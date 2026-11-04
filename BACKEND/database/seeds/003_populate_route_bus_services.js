import { seed as mainSeed } from '../../../DATABASE/seeds/003_populate_route_bus_services.js';

export async function seed(knex) {
  return mainSeed(knex);
}
