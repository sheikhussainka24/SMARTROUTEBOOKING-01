/**
 * SMART ROUTE — Migration: Add Bus Brand, Model, Custom Name & Operator Audit Fields
 *
 * Adds structured manufacturer, model, custom_name, display_name to `buses`.
 * Adds admin_notes, rejection_reason, approved_by, approved_at to `travels`.
 */

export async function up(knex) {
  const hasBuses = await knex.schema.hasTable('buses');
  if (hasBuses) {
    const hasMfr = await knex.schema.hasColumn('buses', 'manufacturer');
    if (!hasMfr) {
      await knex.schema.alterTable('buses', (table) => {
        table.string('manufacturer', 100).nullable();
        table.string('model', 100).nullable();
        table.string('custom_name', 150).nullable();
        table.string('display_name', 150).nullable();
      });
    }
  }

  const hasTravels = await knex.schema.hasTable('travels');
  if (hasTravels) {
    const hasAdminNotes = await knex.schema.hasColumn('travels', 'admin_notes');
    if (!hasAdminNotes) {
      await knex.schema.alterTable('travels', (table) => {
        table.text('admin_notes').nullable();
        table.text('rejection_reason').nullable();
        table.uuid('approved_by').nullable();
        table.timestamp('approved_at').nullable();
      });
    }
  }
}

export async function down(knex) {
  const hasBuses = await knex.schema.hasTable('buses');
  if (hasBuses) {
    const hasMfr = await knex.schema.hasColumn('buses', 'manufacturer');
    if (hasMfr) {
      await knex.schema.alterTable('buses', (table) => {
        table.dropColumn('manufacturer');
        table.dropColumn('model');
        table.dropColumn('custom_name');
        table.dropColumn('display_name');
      });
    }
  }

  const hasTravels = await knex.schema.hasTable('travels');
  if (hasTravels) {
    const hasAdminNotes = await knex.schema.hasColumn('travels', 'admin_notes');
    if (hasAdminNotes) {
      await knex.schema.alterTable('travels', (table) => {
        table.dropColumn('admin_notes');
        table.dropColumn('rejection_reason');
        table.dropColumn('approved_by');
        table.dropColumn('approved_at');
      });
    }
  }
}

