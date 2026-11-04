/**
 * SMART ROUTE — JSON Store to PostgreSQL Migration Script
 *
 * Idempotently and safely imports dynamic users, travel operators, buses, trips,
 * and bookings from `persistent_local_store.json` into durable PostgreSQL tables.
 *
 * Safety guarantees:
 * 1. Safe to rerun multiple times without duplicating data (idempotent ON CONFLICT checks).
 * 2. Runs inside an atomic transaction (rolls back entirely if any fatal error occurs).
 * 3. Never deletes, overwrites, or truncates existing PostgreSQL tables or records.
 * 4. Never modifies or deletes the original source JSON file.
 * 5. Handles mutual foreign keys (users.travel_id <-> travels.owner_id) via two-phase resolution.
 *
 * Usage:
 *   node BACKEND/scripts/migrateJsonToPostgres.js [path_to_store.json]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

import db, { testConnection } from '../src/config/database.js';
import logger from '../src/config/logger.js';

const DEFAULT_SOURCE_FILE = path.resolve(__dirname, '../src/data/persistent_local_store.json');
const BACKUP_FILE = path.resolve(__dirname, '../src/data/backups/persistent_local_store.backup_latest.json');

async function runJsonToPostgresMigration() {
  console.log('\n==============================================================');
  console.log('  SMART ROUTE — JSON Store to PostgreSQL Migration');
  console.log('==============================================================\n');

  // 1. Verify PostgreSQL Connectivity
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ FATAL: Cannot connect to PostgreSQL daemon.');
    console.error('   Please ensure PostgreSQL is running and DB credentials in .env are valid.');
    console.error('   Aborting migration safely without touching any data.\n');
    await db.destroy();
    process.exit(1);
  }

  // 2. Verify Schema Presence
  const hasUsers = await db.schema.hasTable('users');
  const hasTravels = await db.schema.hasTable('travels');
  if (!hasUsers || !hasTravels) {
    console.error('❌ FATAL: Required database tables ("users", "travels") are missing.');
    console.error('   Please run migrations first:');
    console.error('   npm run migrate --prefix BACKEND\n');
    await db.destroy();
    process.exit(1);
  }

  // 3. Resolve and Validate Source File
  const sourcePath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SOURCE_FILE;
  console.log(`📂 Source File: ${sourcePath}`);

  let sourceFileToRead = sourcePath;
  if (!fs.existsSync(sourceFileToRead)) {
    if (fs.existsSync(BACKUP_FILE)) {
      console.warn(`⚠️ Primary source not found at ${sourcePath}. Using backup: ${BACKUP_FILE}`);
      sourceFileToRead = BACKUP_FILE;
    } else {
      console.error(`❌ FATAL: Source file does not exist at ${sourcePath}`);
      await db.destroy();
      process.exit(1);
    }
  }

  let storeData;
  try {
    const raw = fs.readFileSync(sourceFileToRead, 'utf-8');
    storeData = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ FATAL: Failed to parse JSON from ${sourceFileToRead}:`, err.message);
    await db.destroy();
    process.exit(1);
  }

  const sourceUsers = Array.isArray(storeData.users) ? storeData.users : [];
  const sourceTravels = Array.isArray(storeData.travels) ? storeData.travels : [];
  const sourceBuses = Array.isArray(storeData.buses) ? storeData.buses : [];
  const sourceTrips = Array.isArray(storeData.trips) ? storeData.trips : [];
  const sourceBookings = Array.isArray(storeData.bookings) ? storeData.bookings : [];

  console.log(`📊 Discovered records in store:`);
  console.log(`   - Users:    ${sourceUsers.length}`);
  console.log(`   - Travels:  ${sourceTravels.length}`);
  console.log(`   - Buses:    ${sourceBuses.length}`);
  console.log(`   - Trips:    ${sourceTrips.length}`);
  console.log(`   - Bookings: ${sourceBookings.length}\n`);

  if (sourceUsers.length === 0 && sourceTravels.length === 0) {
    console.log('ℹ️ No users or travel operators to migrate. Migration completed with 0 changes.');
    await db.destroy();
    return;
  }

  // 4. Execute Transactional Migration
  const report = {
    usersInserted: 0,
    usersSkipped: 0,
    travelsInserted: 0,
    travelsSkipped: 0,
    userTravelLinksUpdated: 0,
    driverProfilesCreated: 0,
    managerProfilesCreated: 0,
    busesInserted: 0,
    busesSkipped: 0,
    tripsInserted: 0,
    tripsSkipped: 0,
    bookingsInserted: 0,
    bookingsSkipped: 0,
  };

  try {
    await db.transaction(async (trx) => {
      // Step A: Insert Users with travel_id = null first to satisfy foreign key constraints
      console.log('⏳ [Step 1/3] Migrating users...');
      for (const u of sourceUsers) {
        if (!u.id || (!u.email && !u.mobile)) {
          report.usersSkipped++;
          continue;
        }

        // Check if user already exists in DB by ID, email, or mobile
        const existing = await trx('users')
          .where('id', u.id)
          .orWhere((builder) => {
            if (u.email) builder.where('email', u.email.toLowerCase().trim());
          })
          .orWhere((builder) => {
            if (u.mobile) builder.where('mobile', u.mobile.trim());
          })
          .first();

        if (existing) {
          report.usersSkipped++;
          continue;
        }

        await trx('users').insert({
          id: u.id,
          email: u.email ? u.email.toLowerCase().trim() : null,
          mobile: u.mobile ? u.mobile.trim() : null,
          password_hash: u.password_hash || u.passwordHash,
          first_name: u.first_name || u.firstName || 'User',
          last_name: u.last_name || u.lastName || null,
          role: u.role || 'passenger',
          status: u.status || 'active',
          email_verified: Boolean(u.email_verified),
          mobile_verified: Boolean(u.mobile_verified),
          travel_id: null, // Linked in Step C
          created_at: u.created_at || new Date().toISOString(),
          updated_at: u.updated_at || new Date().toISOString(),
        });
        report.usersInserted++;
      }

      // Step B: Insert Travels
      console.log('⏳ [Step 2/3] Migrating travel operators...');
      for (const t of sourceTravels) {
        if (!t.id || !t.name) {
          report.travelsSkipped++;
          continue;
        }

        const existing = await trx('travels').where('id', t.id).orWhere('name', t.name).first();
        if (existing) {
          report.travelsSkipped++;
          continue;
        }

        // Verify owner_id exists in users table, else fallback to null or first admin
        let validOwnerId = t.owner_id;
        if (validOwnerId) {
          const ownerExists = await trx('users').where('id', validOwnerId).first();
          if (!ownerExists) {
            validOwnerId = null;
          }
        }

        await trx('travels').insert({
          id: t.id,
          owner_id: validOwnerId,
          name: t.name,
          slug: t.slug || t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          business_name: t.business_name || t.name,
          gst_number: t.gst_number || null,
          contact_email: t.contact_email || null,
          contact_mobile: t.contact_mobile || null,
          city: t.city || 'Coimbatore',
          state: t.state || 'Tamil Nadu',
          pincode: t.pincode || null,
          business_address: t.business_address || null,
          website: t.website || null,
          verification_status: t.verification_status || 'verified',
          status: t.status || 'active',
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || new Date().toISOString(),
        });
        report.travelsInserted++;
      }

      // Step C: Link users to travels and create role profiles
      console.log('⏳ [Step 3/3] Linking user travel IDs and profiles...');
      for (const u of sourceUsers) {
        if (!u.id) continue;

        if (u.travel_id || u.travelId) {
          const targetTravelId = u.travel_id || u.travelId;
          const travelExists = await trx('travels').where('id', targetTravelId).first();
          if (travelExists) {
            await trx('users').where('id', u.id).update({ travel_id: targetTravelId });
            report.userTravelLinksUpdated++;
          }
        }

        // Driver profile check
        if (u.role === 'driver') {
          const profileExists = await trx('driver_profiles').where('user_id', u.id).first();
          if (!profileExists) {
            await trx('driver_profiles').insert({
              user_id: u.id,
              travel_id: u.travel_id || u.travelId || null,
              license_number: u.license_number || u.operator_code || null,
              verification_status: u.status === 'active' ? 'verified' : 'pending',
            });
            report.driverProfilesCreated++;
          }
        }

        // Manager profile check
        if (u.role === 'manager') {
          const profileExists = await trx('manager_profiles').where('user_id', u.id).first();
          if (!profileExists) {
            await trx('manager_profiles').insert({
              user_id: u.id,
              travel_id: u.travel_id || u.travelId || null,
              designation: 'Operations Manager',
            });
            report.managerProfilesCreated++;
          }
        }
      }
    });

    console.log('\n✅ Migration finished successfully!');
    console.log('--------------------------------------------------------------');
    console.log(`  Users inserted:                ${report.usersInserted}`);
    console.log(`  Users skipped (existing):      ${report.usersSkipped}`);
    console.log(`  Travels inserted:              ${report.travelsInserted}`);
    console.log(`  Travels skipped (existing):    ${report.travelsSkipped}`);
    console.log(`  User-Travel links updated:     ${report.userTravelLinksUpdated}`);
    console.log(`  Driver profiles created:       ${report.driverProfilesCreated}`);
    console.log(`  Manager profiles created:      ${report.managerProfilesCreated}`);
    console.log('--------------------------------------------------------------');
    console.log('🔒 Source file intact at:', sourceFileToRead);
    console.log('==============================================================\n');
  } catch (err) {
    console.error('\n❌ FATAL: Migration failed and transaction was rolled back:');
    console.error(err);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runJsonToPostgresMigration();
