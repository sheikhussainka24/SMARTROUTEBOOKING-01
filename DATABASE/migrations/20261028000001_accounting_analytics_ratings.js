/**
 * SMART ROUTE — Accounting, Financial Analytics, Fleet Performance & Passenger Ratings Schema
 * Migration: 20261028000001_accounting_analytics_ratings.js
 */

export async function up(knex) {
  // 1. Bus Expenses
  await knex.schema.createTable('bus_expenses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('travel_id').notNullable().references('id').inTable('travels').onDelete('CASCADE');
    table.uuid('bus_id').nullable().references('id').inTable('buses').onDelete('SET NULL');
    table.uuid('trip_id').nullable().references('id').inTable('trips').onDelete('SET NULL');
    table.date('expense_date').notNullable();
    table.string('category', 60).notNullable(); // diesel_fuel, driver_salary, cleaner_salary, driver_allowance, cleaner_allowance, toll, parking, maintenance, tyres_spares, insurance_permits, staff_food, other
    table.decimal('amount', 12, 2).notNullable();
    table.decimal('quantity', 10, 2).nullable();
    table.decimal('unit_price', 10, 2).nullable();
    table.string('vendor', 120).nullable();
    table.string('payment_method', 40).defaultTo('bank_transfer'); // cash, upi, bank_transfer, credit_card, fuel_card
    table.string('payment_status', 30).defaultTo('paid'); // paid, pending, cancelled
    table.text('receipt_url').nullable();
    table.text('notes').nullable();
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('approval_status', 30).defaultTo('approved'); // pending, approved, rejected, reversed
    table.uuid('approved_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('approved_at').nullable();
    table.boolean('is_recurring').defaultTo(false);
    table.boolean('is_salary_allocation').defaultTo(false);
    table.timestamps(true, true);

    table.index(['travel_id', 'expense_date']);
    table.index(['bus_id', 'expense_date']);
    table.index(['trip_id']);
    table.index(['category']);
    table.index(['approval_status']);
  });

  // 2. Fuel Records (Diesel accounting & odometer verification)
  await knex.schema.createTable('fuel_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('travel_id').notNullable().references('id').inTable('travels').onDelete('CASCADE');
    table.uuid('bus_id').notNullable().references('id').inTable('buses').onDelete('CASCADE');
    table.uuid('trip_id').nullable().references('id').inTable('trips').onDelete('SET NULL');
    table.date('purchase_date').notNullable();
    table.decimal('litres', 10, 2).notNullable();
    table.decimal('price_per_litre', 10, 2).notNullable();
    table.decimal('total_cost', 12, 2).notNullable();
    table.decimal('odometer_reading', 12, 2).notNullable();
    table.string('fuel_station', 150).notNullable();
    table.string('payment_status', 30).defaultTo('paid');
    table.text('receipt_url').nullable();
    table.text('notes').nullable();
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.boolean('is_flagged_anomaly').defaultTo(false);
    table.text('anomaly_reason').nullable();
    table.timestamps(true, true);

    table.index(['travel_id', 'purchase_date']);
    table.index(['bus_id', 'purchase_date']);
    table.index(['odometer_reading']);
  });

  // 3. Staff Payroll (Drivers, Cleaners, Fleet Crew)
  await knex.schema.createTable('staff_payroll', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('travel_id').notNullable().references('id').inTable('travels').onDelete('CASCADE');
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('staff_name', 120).notNullable();
    table.string('role', 40).notNullable(); // driver, cleaner, maintenance, manager
    table.uuid('trip_id').nullable().references('id').inTable('trips').onDelete('SET NULL');
    table.uuid('bus_id').nullable().references('id').inTable('buses').onDelete('SET NULL');
    table.string('payroll_type', 40).notNullable(); // monthly_salary, per_trip, daily_allowance, bonus, deduction
    table.string('period_month', 20).nullable(); // e.g. '2026-10'
    table.decimal('amount_payable', 12, 2).notNullable();
    table.decimal('amount_paid', 12, 2).notNullable().defaultTo(0);
    table.decimal('balance', 12, 2).notNullable().defaultTo(0);
    table.date('payment_date').nullable();
    table.string('payment_method', 40).nullable();
    table.string('payment_status', 30).defaultTo('paid'); // pending, paid, partial
    table.text('notes').nullable();
    table.uuid('created_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamps(true, true);

    table.index(['travel_id', 'period_month']);
    table.index(['user_id']);
    table.index(['role']);
    table.index(['payment_status']);
  });

  // 4. Passenger Reviews & Verified Ratings
  await knex.schema.createTable('passenger_reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    table.string('pnr_number', 40).notNullable();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('passenger_name', 120).notNullable();
    table.uuid('travel_id').notNullable().references('id').inTable('travels').onDelete('CASCADE');
    table.uuid('bus_id').notNullable().references('id').inTable('buses').onDelete('CASCADE');
    table.uuid('trip_id').notNullable().references('id').inTable('trips').onDelete('CASCADE');
    table.integer('overall_rating').notNullable(); // 1 to 5
    table.integer('cleanliness_rating').notNullable(); // 1 to 5
    table.integer('seat_comfort_rating').notNullable(); // 1 to 5
    table.integer('punctuality_rating').notNullable(); // 1 to 5
    table.integer('staff_behaviour_rating').notNullable(); // 1 to 5
    table.text('review_text').nullable();
    table.string('complaint_category', 60).nullable(); // ac_issue, delays, staff_rude, seat_broken, luggage_lost, hygiene, none
    table.string('moderation_status', 30).defaultTo('published'); // published, flagged, under_review, rejected
    table.uuid('moderated_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('moderation_notes').nullable();
    table.timestamps(true, true);

    table.unique(['booking_id']); // Strictly one review per booking
    table.index(['bus_id', 'overall_rating']);
    table.index(['travel_id', 'overall_rating']);
    table.index(['trip_id']);
    table.index(['moderation_status']);
  });

  // 5. Expense Audit Logs (Ensures no silent edits or deletions)
  await knex.schema.createTable('expense_audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('expense_id').notNullable().references('id').inTable('bus_expenses').onDelete('CASCADE');
    table.string('action', 40).notNullable(); // created, updated, approved, rejected, reversed
    table.jsonb('previous_data').nullable();
    table.jsonb('new_data').nullable();
    table.uuid('performed_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('reason').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['expense_id']);
    table.index(['performed_by']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('expense_audit_logs');
  await knex.schema.dropTableIfExists('passenger_reviews');
  await knex.schema.dropTableIfExists('staff_payroll');
  await knex.schema.dropTableIfExists('fuel_records');
  await knex.schema.dropTableIfExists('bus_expenses');
}
