/**
 * SMART ROUTE — Complete Database Schema
 * 
 * This migration creates the entire database schema for the
 * SMART ROUTE platform including all tables for:
 * - Users, Roles, Permissions, RBAC
 * - Travel Owners, Travels (multi-tenant)
 * - Managers, Staff, Drivers
 * - Buses, Bus Layouts, Seats
 * - Routes, Stops, Trips
 * - Bookings, Booking Passengers
 * - Payments, Refunds, Tickets
 * - GPS Locations, Real-time tracking
 * - Notifications
 * - AI Interactions
 * - Audit Logs
 */

export async function up(knex) {
  // ======================== EXTENSIONS ========================
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // ======================== ENUM TYPES ========================
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM (
        'super_admin', 'travel_owner', 'manager', 'staff', 'driver', 'passenger'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE account_status AS ENUM (
        'pending', 'active', 'suspended', 'rejected', 'deactivated'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE verification_status AS ENUM (
        'unverified', 'pending', 'verified', 'rejected'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE bus_type AS ENUM (
        'ac_seater', 'non_ac_seater', 'ac_sleeper', 'non_ac_sleeper',
        'ac_seat_cum_sleeper', 'non_ac_seat_cum_sleeper'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE seat_type AS ENUM ('seat', 'sleeper', 'semi_sleeper');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE seat_status AS ENUM (
        'available', 'selected', 'held', 'booked', 'disabled'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE deck_type AS ENUM ('lower', 'upper');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE trip_status AS ENUM (
        'draft', 'published', 'boarding', 'in_transit', 'completed', 'cancelled'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE booking_status AS ENUM (
        'pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'failed'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE payment_status AS ENUM (
        'pending', 'initiated', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE payment_method AS ENUM ('upi', 'card', 'net_banking', 'wallet', 'cash');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE boarding_status AS ENUM ('not_yet', 'boarded', 'no_show', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE notification_type AS ENUM (
        'push', 'sms', 'email', 'in_app', 'ai_call'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // ======================== USERS TABLE ========================
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).unique();
    table.string('mobile', 20).unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100);
    table.specificType('role', 'user_role').notNullable();
    table.specificType('status', 'account_status').notNullable().defaultTo('pending');
    table.boolean('email_verified').defaultTo(false);
    table.boolean('mobile_verified').defaultTo(false);
    table.string('avatar_url', 500);
    table.uuid('travel_id'); // FK added after travels table
    table.timestamp('last_login_at');
    table.string('last_login_ip', 45);
    table.string('refresh_token', 500);
    table.timestamp('refresh_token_expires_at');
    table.timestamps(true, true);
    table.timestamp('deleted_at');

    table.index(['email']);
    table.index(['mobile']);
    table.index(['role']);
    table.index(['status']);
    table.index(['travel_id']);
  });

  // ======================== OTP TABLE ========================
  await knex.schema.createTable('otps', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('identifier', 255).notNullable(); // email or mobile
    table.string('otp_hash', 255).notNullable();
    table.string('purpose', 50).notNullable(); // login, register, reset_password, verify
    table.integer('attempts').defaultTo(0);
    table.boolean('used').defaultTo(false);
    table.timestamp('expires_at').notNullable();
    table.timestamps(true, true);

    table.index(['identifier', 'purpose']);
  });

  // ======================== TRAVELS TABLE ========================
  await knex.schema.createTable('travels', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('owner_id').references('id').inTable('users').onDelete('RESTRICT');
    table.string('name', 255).notNullable();
    table.string('slug', 255).unique();
    table.text('description');
    table.string('logo_url', 500);
    table.string('website', 500);
    table.string('business_name', 255);
    table.string('business_registration_number', 100);
    table.string('gst_number', 20);
    table.string('pan_number', 20);
    table.text('business_address');
    table.string('city', 100);
    table.string('state', 100);
    table.string('pincode', 10);
    table.string('contact_email', 255);
    table.string('contact_mobile', 20);
    table.specificType('verification_status', 'verification_status').defaultTo('unverified');
    table.specificType('status', 'account_status').defaultTo('pending');
    table.jsonb('business_documents'); // Array of document URLs
    table.text('admin_notes');
    table.uuid('approved_by'); // Super admin who approved
    table.timestamp('approved_at');
    table.timestamps(true, true);
    table.timestamp('deleted_at');

    table.index(['owner_id']);
    table.index(['status']);
    table.index(['slug']);
  });

  // Add FK from users.travel_id to travels
  await knex.schema.alterTable('users', (table) => {
    table.foreign('travel_id').references('id').inTable('travels').onDelete('SET NULL');
  });

  // ======================== PERMISSIONS TABLE ========================
  await knex.schema.createTable('permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('code', 100).unique().notNullable();
    table.string('name', 255).notNullable();
    table.string('description', 500);
    table.string('module', 100).notNullable(); // trips, buses, drivers, etc.
    table.string('action', 50).notNullable(); // create, read, update, delete, manage
    table.timestamps(true, true);

    table.index(['module']);
    table.index(['code']);
  });

  // ======================== ROLE PERMISSIONS TABLE ========================
  await knex.schema.createTable('user_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    table.uuid('granted_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    table.unique(['user_id', 'permission_id']);
    table.index(['user_id']);
  });

  // ======================== MANAGER PROFILES ========================
  await knex.schema.createTable('manager_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    table.uuid('travel_id').references('id').inTable('travels').onDelete('CASCADE');
    table.string('designation', 100); // Operations Manager, Fleet Manager, etc.
    table.string('department', 100);
    table.boolean('can_create_staff').defaultTo(false);
    table.boolean('can_create_driver').defaultTo(true);
    table.boolean('can_approve_applications').defaultTo(true);
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at');
    table.timestamps(true, true);

    table.index(['travel_id']);
  });

  // ======================== STAFF PROFILES ========================
  await knex.schema.createTable('staff_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    table.uuid('travel_id').references('id').inTable('travels').onDelete('CASCADE');
    table.string('staff_role', 100); // booking_staff, customer_support, etc.
    table.string('department', 100);
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at');
    table.timestamps(true, true);

    table.index(['travel_id']);
  });

  // ======================== DRIVER PROFILES ========================
  await knex.schema.createTable('driver_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    table.uuid('travel_id').references('id').inTable('travels').onDelete('CASCADE');
    table.string('license_number', 50);
    table.date('license_expiry');
    table.string('license_type', 50); // HMV, LMV, etc.
    table.string('license_document_url', 500);
    table.string('aadhar_number', 20);
    table.string('aadhar_document_url', 500);
    table.string('emergency_contact_name', 100);
    table.string('emergency_contact_mobile', 20);
    table.integer('experience_years').defaultTo(0);
    table.specificType('verification_status', 'verification_status').defaultTo('unverified');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at');
    table.boolean('is_available').defaultTo(true);
    table.timestamps(true, true);

    table.index(['travel_id']);
    table.index(['is_available']);
  });

  // ======================== BUSES TABLE ========================
  await knex.schema.createTable('buses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('travel_id').references('id').inTable('travels').onDelete('CASCADE');
    table.string('name', 255);
    table.string('registration_number', 50).notNullable();
    table.string('chassis_make', 100); // TATA, Ashok Leyland, etc.
    table.string('body_make', 100); // Prakash, etc.
    table.specificType('bus_type', 'bus_type').notNullable();
    table.string('configuration', 20); // 2+1, 2+2, 1+1, etc.
    table.integer('total_seats').notNullable().defaultTo(0);
    table.integer('total_sleepers').defaultTo(0);
    table.boolean('has_ac').defaultTo(false);
    table.boolean('has_wifi').defaultTo(false);
    table.boolean('has_charging').defaultTo(false);
    table.boolean('has_toilet').defaultTo(false);
    table.boolean('has_tv').defaultTo(false);
    table.boolean('has_water_bottle').defaultTo(false);
    table.boolean('has_blanket').defaultTo(false);
    table.string('bus_images', 2000); // JSON array of URLs
    table.boolean('is_active').defaultTo(true);
    table.uuid('layout_id'); // FK added after bus_layouts
    table.timestamps(true, true);
    table.timestamp('deleted_at');

    table.index(['travel_id']);
    table.index(['is_active']);
    table.unique(['travel_id', 'registration_number']);
  });

  // ======================== BUS LAYOUTS ========================
  await knex.schema.createTable('bus_layouts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('travel_id').references('id').inTable('travels').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('configuration', 20).notNullable(); // 2+1, 2+2
    table.boolean('has_upper_deck').defaultTo(false);
    table.integer('lower_deck_rows').notNullable();
    table.integer('upper_deck_rows').defaultTo(0);
    table.integer('columns').notNullable(); // total columns including aisle
    table.integer('total_seats').notNullable().defaultTo(0);
    table.integer('total_sleepers').defaultTo(0);
    table.jsonb('layout_config'); // Full JSON layout definition
    table.boolean('is_template').defaultTo(false);
    table.timestamps(true, true);

    table.index(['travel_id']);
  });

  // Add FK from buses.layout_id
  await knex.schema.alterTable('buses', (table) => {
    table.foreign('layout_id').references('id').inTable('bus_layouts').onDelete('SET NULL');
  });

  // ======================== LAYOUT SEATS (Template definition) ========================
  await knex.schema.createTable('layout_seats', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('layout_id').references('id').inTable('bus_layouts').onDelete('CASCADE');
    table.string('seat_number', 10).notNullable(); // L1, L2, U1, etc.
    table.string('seat_label', 20); // Display label
    table.specificType('seat_type', 'seat_type').notNullable();
    table.specificType('deck', 'deck_type').notNullable();
    table.integer('row_number').notNullable();
    table.integer('column_number').notNullable();
    table.integer('row_span').defaultTo(1); // For sleepers spanning multiple rows
    table.integer('col_span').defaultTo(1);
    table.boolean('is_window').defaultTo(false);
    table.boolean('is_aisle').defaultTo(false);
    table.decimal('base_fare', 10, 2).defaultTo(0);
    table.boolean('is_active').defaultTo(true);

    table.index(['layout_id']);
    table.unique(['layout_id', 'seat_number']);
  });

  // ======================== ROUTES TABLE ========================
  await knex.schema.createTable('routes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('travel_id').references('id').inTable('travels').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('code', 50);
    table.string('source', 255).notNullable();
    table.string('destination', 255).notNullable();
    table.integer('distance_km');
    table.integer('estimated_duration_minutes');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.timestamp('deleted_at');

    table.index(['travel_id']);
    table.index(['source', 'destination']);
    table.index(['is_active']);
  });

  // ======================== ROUTE STOPS ========================
  await knex.schema.createTable('route_stops', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('route_id').references('id').inTable('routes').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('city', 100);
    table.decimal('latitude', 10, 7);
    table.decimal('longitude', 10, 7);
    table.string('address', 500);
    table.string('landmark', 255);
    table.integer('stop_order').notNullable();
    table.integer('distance_from_start_km').defaultTo(0);
    table.integer('estimated_time_from_start_minutes').defaultTo(0);
    table.boolean('is_boarding_point').defaultTo(true);
    table.boolean('is_dropping_point').defaultTo(true);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.index(['route_id']);
    table.index(['stop_order']);
    table.unique(['route_id', 'stop_order']);
  });

  // ======================== TRIPS TABLE ========================
  await knex.schema.createTable('trips', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('travel_id').references('id').inTable('travels').onDelete('CASCADE');
    table.uuid('bus_id').references('id').inTable('buses').onDelete('RESTRICT');
    table.uuid('route_id').references('id').inTable('routes').onDelete('RESTRICT');
    table.uuid('driver_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('trip_number', 50).unique();
    table.date('departure_date').notNullable();
    table.time('departure_time').notNullable();
    table.time('estimated_arrival_time');
    table.timestamp('actual_departure_at');
    table.timestamp('actual_arrival_at');
    table.specificType('status', 'trip_status').notNullable().defaultTo('draft');
    table.integer('current_stop_order').defaultTo(0);
    table.decimal('current_latitude', 10, 7);
    table.decimal('current_longitude', 10, 7);
    table.integer('total_booked_seats').defaultTo(0);
    table.integer('total_available_seats').defaultTo(0);
    table.decimal('base_fare', 10, 2).defaultTo(0);
    table.jsonb('fare_chart'); // Stop-wise fare table
    table.text('notes');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);
    table.timestamp('deleted_at');

    table.index(['travel_id']);
    table.index(['bus_id']);
    table.index(['route_id']);
    table.index(['driver_id']);
    table.index(['departure_date']);
    table.index(['status']);
    table.index(['trip_number']);
  });

  // ======================== TRIP SEAT INVENTORY ========================
  await knex.schema.createTable('trip_seats', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('trip_id').references('id').inTable('trips').onDelete('CASCADE');
    table.uuid('layout_seat_id').references('id').inTable('layout_seats').onDelete('RESTRICT');
    table.string('seat_number', 10).notNullable();
    table.string('seat_label', 20);
    table.specificType('seat_type', 'seat_type').notNullable();
    table.specificType('deck', 'deck_type').notNullable();
    table.specificType('status', 'seat_status').notNullable().defaultTo('available');
    table.decimal('fare', 10, 2).notNullable().defaultTo(0);
    table.uuid('booking_id'); // FK added after bookings table
    table.uuid('held_by'); // User who temporarily holds this seat
    table.timestamp('held_until'); // Expiry of hold
    table.integer('boarding_stop_order'); // Which stop segment this is booked for
    table.integer('dropping_stop_order');
    table.timestamps(true, true);

    table.index(['trip_id']);
    table.index(['status']);
    table.index(['held_until']);
    table.unique(['trip_id', 'seat_number', 'boarding_stop_order', 'dropping_stop_order']);
  });

  // ======================== BOOKINGS TABLE ========================
  await knex.schema.createTable('bookings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('booking_number', 20).unique().notNullable();
    table.uuid('passenger_id').references('id').inTable('users').onDelete('RESTRICT');
    table.uuid('trip_id').references('id').inTable('trips').onDelete('RESTRICT');
    table.uuid('travel_id').references('id').inTable('travels').onDelete('RESTRICT');
    table.uuid('boarding_stop_id').references('id').inTable('route_stops').onDelete('RESTRICT');
    table.uuid('dropping_stop_id').references('id').inTable('route_stops').onDelete('RESTRICT');
    table.integer('boarding_stop_order');
    table.integer('dropping_stop_order');
    table.integer('total_passengers').notNullable().defaultTo(1);
    table.integer('total_seats').notNullable().defaultTo(1);
    table.decimal('base_amount', 10, 2).notNullable().defaultTo(0);
    table.decimal('tax_amount', 10, 2).defaultTo(0);
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('total_amount', 10, 2).notNullable().defaultTo(0);
    table.specificType('status', 'booking_status').notNullable().defaultTo('pending');
    table.string('contact_mobile', 20);
    table.string('contact_email', 255);
    table.text('special_requests');
    table.uuid('booked_by').references('id').inTable('users').onDelete('SET NULL'); // Could be staff
    table.timestamp('confirmed_at');
    table.timestamp('cancelled_at');
    table.string('cancellation_reason', 500);
    table.timestamps(true, true);

    table.index(['passenger_id']);
    table.index(['trip_id']);
    table.index(['travel_id']);
    table.index(['status']);
    table.index(['booking_number']);
    table.index(['boarding_stop_id']);
    table.index(['dropping_stop_id']);
  });

  // Add FK from trip_seats.booking_id
  await knex.schema.alterTable('trip_seats', (table) => {
    table.foreign('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
  });

  // ======================== BOOKING PASSENGERS ========================
  await knex.schema.createTable('booking_passengers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.uuid('trip_seat_id').references('id').inTable('trip_seats').onDelete('RESTRICT');
    table.string('name', 255).notNullable();
    table.integer('age');
    table.string('gender', 20);
    table.string('mobile', 20);
    table.string('seat_number', 10);
    table.specificType('boarding_status', 'boarding_status').notNullable().defaultTo('not_yet');
    table.uuid('boarding_verified_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('boarded_at');
    table.timestamps(true, true);

    table.index(['booking_id']);
    table.index(['boarding_status']);
  });

  // ======================== PAYMENTS TABLE ========================
  await knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('RESTRICT');
    table.uuid('user_id').references('id').inTable('users').onDelete('RESTRICT');
    table.string('payment_order_id', 255); // Gateway order ID
    table.string('payment_id', 255); // Gateway payment ID
    table.string('payment_signature', 500); // Gateway signature
    table.specificType('method', 'payment_method');
    table.specificType('status', 'payment_status').notNullable().defaultTo('pending');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('INR');
    table.string('provider', 50); // razorpay, stripe
    table.jsonb('provider_response'); // Full gateway response
    table.text('failure_reason');
    table.timestamps(true, true);

    table.index(['booking_id']);
    table.index(['user_id']);
    table.index(['status']);
    table.index(['payment_order_id']);
  });

  // ======================== REFUNDS TABLE ========================
  await knex.schema.createTable('refunds', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('payment_id').references('id').inTable('payments').onDelete('RESTRICT');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('RESTRICT');
    table.string('refund_id', 255); // Gateway refund ID
    table.decimal('amount', 10, 2).notNullable();
    table.string('reason', 500);
    table.string('status', 50).notNullable().defaultTo('pending');
    table.jsonb('provider_response');
    table.uuid('initiated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    table.index(['payment_id']);
    table.index(['booking_id']);
  });

  // ======================== TICKETS TABLE ========================
  await knex.schema.createTable('tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE').unique();
    table.string('ticket_number', 30).unique().notNullable();
    table.text('qr_code_data'); // QR code content
    table.string('qr_code_url', 500); // Generated QR image URL
    table.string('status', 50).defaultTo('valid'); // valid, used, cancelled, expired
    table.timestamp('valid_from');
    table.timestamp('valid_until');
    table.timestamps(true, true);

    table.index(['ticket_number']);
    table.index(['booking_id']);
  });

  // ======================== GPS LOCATIONS ========================
  await knex.schema.createTable('gps_locations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('trip_id').references('id').inTable('trips').onDelete('CASCADE');
    table.uuid('driver_id').references('id').inTable('users').onDelete('SET NULL');
    table.decimal('latitude', 10, 7).notNullable();
    table.decimal('longitude', 10, 7).notNullable();
    table.decimal('speed', 6, 2); // km/h
    table.decimal('heading', 5, 2); // degrees
    table.decimal('accuracy', 8, 2); // meters
    table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);

    table.index(['trip_id']);
    table.index(['recorded_at']);
    table.index(['trip_id', 'recorded_at']);
  });

  // ======================== NOTIFICATIONS ========================
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.specificType('type', 'notification_type').notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.jsonb('data'); // Additional data
    table.specificType('status', 'notification_status').defaultTo('pending');
    table.string('reference_type', 50); // booking, trip, payment, etc.
    table.uuid('reference_id');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    table.timestamp('sent_at');
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['status']);
    table.index(['is_read']);
    table.index(['reference_type', 'reference_id']);
  });

  // ======================== AI INTERACTIONS ========================
  await knex.schema.createTable('ai_interactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('trip_id').references('id').inTable('trips').onDelete('SET NULL');
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('SET NULL');
    table.string('interaction_type', 50).notNullable(); // chat, voice_call, notification
    table.text('user_query');
    table.text('ai_response');
    table.jsonb('context_data');
    table.string('status', 50).defaultTo('completed');
    table.integer('response_time_ms');
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['trip_id']);
  });

  // ======================== AUDIT LOGS ========================
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('user_role', 50);
    table.uuid('travel_id').references('id').inTable('travels').onDelete('SET NULL');
    table.string('action', 100).notNullable();
    table.string('resource_type', 100);
    table.uuid('resource_id');
    table.jsonb('old_values');
    table.jsonb('new_values');
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.string('result', 50).defaultTo('success'); // success, failure
    table.text('details');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['user_id']);
    table.index(['travel_id']);
    table.index(['action']);
    table.index(['resource_type', 'resource_id']);
    table.index(['created_at']);
  });

  // ======================== PUSH SUBSCRIPTIONS ========================
  await knex.schema.createTable('push_subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.jsonb('subscription').notNullable(); // Web Push subscription object
    table.string('device_info', 255);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.index(['user_id']);
  });

  // ======================== BOARDING POINT CHANGES ========================
  await knex.schema.createTable('boarding_point_changes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').references('id').inTable('bookings').onDelete('CASCADE');
    table.uuid('booking_passenger_id').references('id').inTable('booking_passengers').onDelete('CASCADE');
    table.uuid('old_stop_id').references('id').inTable('route_stops').onDelete('SET NULL');
    table.uuid('new_stop_id').references('id').inTable('route_stops').onDelete('SET NULL');
    table.string('change_reason', 500);
    table.uuid('changed_by').references('id').inTable('users').onDelete('SET NULL');
    table.string('status', 50).defaultTo('approved'); // requested, approved, rejected
    table.timestamps(true, true);

    table.index(['booking_id']);
  });
}

export async function down(knex) {
  // Drop in reverse order of creation
  const tables = [
    'boarding_point_changes',
    'push_subscriptions',
    'audit_logs',
    'ai_interactions',
    'notifications',
    'gps_locations',
    'tickets',
    'refunds',
    'payments',
    'booking_passengers',
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }

  // Remove FK from trip_seats.booking_id before dropping bookings
  await knex.schema.alterTable('trip_seats', (table) => {
    table.dropForeign('booking_id');
  }).catch(() => {});

  await knex.schema.dropTableIfExists('bookings');
  await knex.schema.dropTableIfExists('trip_seats');
  await knex.schema.dropTableIfExists('trips');
  await knex.schema.dropTableIfExists('route_stops');
  await knex.schema.dropTableIfExists('routes');

  // Remove FK from buses.layout_id before dropping
  await knex.schema.alterTable('buses', (table) => {
    table.dropForeign('layout_id');
  }).catch(() => {});

  await knex.schema.dropTableIfExists('layout_seats');
  await knex.schema.dropTableIfExists('bus_layouts');
  await knex.schema.dropTableIfExists('buses');
  await knex.schema.dropTableIfExists('driver_profiles');
  await knex.schema.dropTableIfExists('staff_profiles');
  await knex.schema.dropTableIfExists('manager_profiles');
  await knex.schema.dropTableIfExists('user_permissions');
  await knex.schema.dropTableIfExists('permissions');

  // Remove FK from users.travel_id before dropping travels
  await knex.schema.alterTable('users', (table) => {
    table.dropForeign('travel_id');
  }).catch(() => {});

  await knex.schema.dropTableIfExists('travels');
  await knex.schema.dropTableIfExists('otps');
  await knex.schema.dropTableIfExists('users');

  // Drop enums
  const enums = [
    'notification_status', 'notification_type', 'boarding_status',
    'payment_method', 'payment_status', 'booking_status', 'trip_status',
    'deck_type', 'seat_status', 'seat_type', 'bus_type',
    'verification_status', 'account_status', 'user_role'
  ];
  for (const e of enums) {
    await knex.raw(`DROP TYPE IF EXISTS ${e} CASCADE`);
  }
}
