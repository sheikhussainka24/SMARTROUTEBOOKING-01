import { ALL_CATALOGUE_ROUTES, STATUS } from '../../BACKEND/src/services/routeCatalogueData.js';
import { getVerifiedStopCoordinates } from '../../BACKEND/src/data/indiaTransitHubs.js';

/**
 * SMART ROUTE — Route Catalogue & Provenance Database Seeder
 *
 * Populates all 122 Coimbatore-origin and Bengaluru-origin long-distance private coach corridors
 * (61 forward corridors + 61 reverse corridors) and their ordered intermediate stops.
 *
 * Features:
 * - Deterministic, idempotent execution
 * - Distinguishes CANDIDATE vs SEED presentation records
 * - Sets provenance metadata (verification_status, is_seed, data_source, direction)
 * - Assigns authoritative geocoded coordinates for all intermediate stops
 */
export async function seed(knex) {
  const hasRoutes = await knex.schema.hasTable('routes');
  if (!hasRoutes) return;

  const firstTravel = await knex('travels').first();
  const defaultTravelId = firstTravel ? firstTravel.id : null;

  for (const r of ALL_CATALOGUE_ROUTES) {
    const routeRecord = {
      name: `${r.source} - ${r.destination} ${r.direction === 'reverse' ? 'Return ' : ''}${r.category === 'interstate_long_haul' ? 'Interstate Express' : r.category === 'intercity_day_coach' ? 'Intercity Day Coach' : 'Highway Sleeper'}`,
      code: r.code,
      source: r.source,
      destination: r.destination,
      distance_km: r.distanceKm,
      estimated_duration_minutes: r.durationMins,
      is_active: r.status !== STATUS.INACTIVE,
      direction: r.direction,
      source_state: r.sourceState,
      destination_state: r.destState,
      corridor_region: r.region,
      verification_status: r.status,
      is_seed: true,
      data_source: 'smartroute_catalogue_seed',
    };

    const existingRoute = await knex('routes').where('code', r.code).first();
    let routeId;

    if (existingRoute) {
      await knex('routes').where('id', existingRoute.id).update(routeRecord);
      routeId = existingRoute.id;
    } else {
      routeRecord.id = r.id;
      routeRecord.travel_id = defaultTravelId;
      await knex('routes').insert(routeRecord);
      routeId = r.id;
    }

    // Insert or update intermediate stops with verified coordinates
    if (Array.isArray(r.intermediateStops) && r.intermediateStops.length > 0) {
      for (const st of r.intermediateStops) {
        const stopId = `stop-${r.id}-${st.order}`;
        const geo = getVerifiedStopCoordinates(st.name, st.city, r.sourceState);
        const stopData = {
          route_id: routeId,
          name: st.name,
          city: st.city,
          latitude: geo.latitude,
          longitude: geo.longitude,
          stop_order: st.order,
          distance_from_start_km: Math.round((st.minsFromOrigin / (r.durationMins || 1)) * (r.distanceKm || 100)),
          estimated_time_from_start_minutes: st.minsFromOrigin,
          is_boarding_point: Boolean(st.isBoarding),
          is_dropping_point: Boolean(st.isDropping),
          state: geo.state || r.sourceState || 'Tamil Nadu',
          is_major_hub: st.order === 1 || st.order === r.intermediateStops.length,
          is_active: true,
          is_verified: true,
        };

        const existingStop = await knex('route_stops').where('id', stopId).first();
        if (existingStop) {
          await knex('route_stops').where('id', stopId).update(stopData);
        } else {
          stopData.id = stopId;
          await knex('route_stops').insert(stopData);
        }
      }
    }
  }
}
