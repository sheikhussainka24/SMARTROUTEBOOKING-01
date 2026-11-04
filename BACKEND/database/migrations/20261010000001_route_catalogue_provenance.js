/**
 * SMART ROUTE — Migration: Add Route Catalogue & Data Provenance Metadata
 * Adds state, direction, verification_status, data_source, and is_seed fields to routes
 */

export async function up(knex) {
  const hasRoutes = await knex.schema.hasTable('routes');
  if (hasRoutes) {
    await knex.schema.alterTable('routes', (table) => {
      table.string('direction', 20).defaultTo('forward'); // 'forward' | 'reverse'
      table.string('source_state', 50).nullable();
      table.string('destination_state', 50).nullable();
      table.string('corridor_region', 50).nullable(); // 'Tamil Nadu', 'Kerala', 'Karnataka', etc.
      table.string('verification_status', 30).defaultTo('SEED'); // 'CANDIDATE', 'SEED', 'PENDING_VERIFICATION', 'VERIFIED', 'INACTIVE'
      table.boolean('is_seed').defaultTo(true);
      table.string('data_source', 100).defaultTo('smartroute_catalogue_seed');
      table.jsonb('metadata').defaultTo('{}');
    });
  }

  const hasRouteStops = await knex.schema.hasTable('route_stops');
  if (hasRouteStops) {
    await knex.schema.alterTable('route_stops', (table) => {
      table.string('state', 50).nullable();
      table.boolean('is_major_hub').defaultTo(false);
    });
  }

  const hasTrips = await knex.schema.hasTable('trips');
  if (hasTrips) {
    await knex.schema.alterTable('trips', (table) => {
      table.string('verification_status', 30).defaultTo('SEED');
      table.boolean('is_seed').defaultTo(true);
      table.string('data_source', 100).defaultTo('smartroute_presentation_seed');
    });
  }
}

export async function down(knex) {
  const hasRoutes = await knex.schema.hasTable('routes');
  if (hasRoutes) {
    await knex.schema.alterTable('routes', (table) => {
      table.dropColumn('direction');
      table.dropColumn('source_state');
      table.dropColumn('destination_state');
      table.dropColumn('corridor_region');
      table.dropColumn('verification_status');
      table.dropColumn('is_seed');
      table.dropColumn('data_source');
      table.dropColumn('metadata');
    });
  }

  const hasRouteStops = await knex.schema.hasTable('route_stops');
  if (hasRouteStops) {
    await knex.schema.alterTable('route_stops', (table) => {
      table.dropColumn('state');
      table.dropColumn('is_major_hub');
    });
  }

  const hasTrips = await knex.schema.hasTable('trips');
  if (hasTrips) {
    await knex.schema.alterTable('trips', (table) => {
      table.dropColumn('verification_status');
      table.dropColumn('is_seed');
      table.dropColumn('data_source');
    });
  }
}
