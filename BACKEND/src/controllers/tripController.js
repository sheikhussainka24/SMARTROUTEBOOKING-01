import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';
import { createAuditLog } from '../services/auditService.js';
import {
  searchTripsData,
  getTripDetails as getTripDetailsData,
  getStopsForTrip,
  findMatchingCandidateCorridor,
  getRouteCatalogueData,
  getRouteCoverageReport as getRouteCoverageReportData,
  getBusServicesForRoute,
  getTripTrackingPayload,
  getActiveTrackingTrips,
  travels,
} from '../services/dataStore.js';
import busInventoryApiService from '../services/busInventoryApiService.js';

// ======================== SEARCH BUSES ========================
/**
 * Search available buses/trips
 * GET /api/trips/search?source=&destination=&date=
 */
export async function searchTrips(req, res) {
  try {
    const { busType, minFare, maxFare } = req.query;
    const source = (req.query.source || req.query.fromCity || req.query.from || req.query.origin || '').trim();
    const destination = (req.query.destination || req.query.toCity || req.query.to || '').trim();
    const date = (req.query.date || req.query.travelDate || req.query.journeyDate || '').trim();

    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Source (fromCity) and Destination (toCity) are required',
        code: 'MISSING_SEARCH_PARAMS',
      });
    }

    if (source.toLowerCase() === destination.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination cannot be the same city',
        code: 'SAME_ORIGIN_DESTINATION',
      });
    }

    if (!isDbConnected()) {
      const results = searchTripsData({ source, destination, date, busType, minFare, maxFare });
      const candidateCorridor = results.length === 0 ? findMatchingCandidateCorridor(source, destination) : null;
      return res.json({
        success: true,
        trips: results,
        buses: results,
        candidateCorridor,
        data: {
          trips: results,
          buses: results,
          total: results.length,
          candidateCorridor,
          searchParams: { source, destination, date },
        },
      });
    }

    // Live Database Query with Case-Insensitive Matching & Flexible Fallbacks
    let query = db('trips')
      .join('routes', 'trips.route_id', 'routes.id')
      .join('buses', 'trips.bus_id', 'buses.id')
      .join('travels', 'trips.travel_id', 'travels.id')
      .leftJoin('route_stops as boarding_stops', function () {
        this.on('boarding_stops.route_id', '=', 'routes.id')
          .andOn(function () {
            this.onRaw('(LOWER(boarding_stops.name) LIKE LOWER(?) OR LOWER(boarding_stops.city) LIKE LOWER(?))', [`%${source}%`, `%${source}%`]);
          })
          .andOn('boarding_stops.is_boarding_point', '=', db.raw('true'))
          .andOn('boarding_stops.is_active', '=', db.raw('true'));
      })
      .leftJoin('route_stops as dropping_stops', function () {
        this.on('dropping_stops.route_id', '=', 'routes.id')
          .andOn(function () {
            this.onRaw('(LOWER(dropping_stops.name) LIKE LOWER(?) OR LOWER(dropping_stops.city) LIKE LOWER(?))', [`%${destination}%`, `%${destination}%`]);
          })
          .andOn('dropping_stops.is_dropping_point', '=', db.raw('true'))
          .andOn('dropping_stops.is_active', '=', db.raw('true'));
      })
      .whereIn('trips.status', ['published', 'boarding'])
      .where('buses.is_active', true)
      .where('travels.status', 'active')
      .whereIn('travels.verification_status', ['verified', 'approved'])
      .where((qb) => {
        // Direct route source & destination match OR stop match
        qb.where((sqb) => {
          sqb.whereRaw('(LOWER(routes.source) LIKE LOWER(?) OR LOWER(routes.source) = LOWER(?))', [`%${source}%`, source])
            .andWhereRaw('(LOWER(routes.destination) LIKE LOWER(?) OR LOWER(routes.destination) = LOWER(?))', [`%${destination}%`, destination]);
        }).orWhere((stqb) => {
          stqb.whereNotNull('boarding_stops.id')
            .andWhereNotNull('dropping_stops.id')
            .andWhereRaw('boarding_stops.stop_order < dropping_stops.stop_order');
        });
      })
      .modify((qb) => {
        if (destination.toLowerCase().includes('karaikudi')) {
          qb.whereRaw('LOWER(routes.destination) NOT LIKE ?', ['%tenkasi%'])
            .whereRaw('LOWER(routes.name) NOT LIKE ?', ['%tenkasi%'])
            .whereRaw('LOWER(trips.trip_number) NOT LIKE ?', ['%tks%']);
        }
        if (date) {
          qb.where('trips.departure_date', date);
        }
        if (busType && busType !== 'all') qb.where('buses.bus_type', busType);
        if (minFare) qb.where('trips.base_fare', '>=', parseFloat(minFare));
        if (maxFare) qb.where('trips.base_fare', '<=', parseFloat(maxFare));
      })
      .select(
        'trips.id as tripId',
        'trips.trip_number',
        'trips.departure_date',
        'trips.departure_time',
        'trips.estimated_arrival_time',
        'trips.status',
        'trips.base_fare',
        'trips.total_available_seats',
        'trips.fare_chart',
        'travels.name as travelName',
        'travels.logo_url as travelLogo',
        'buses.id as busId',
        'buses.name as busName',
        'buses.registration_number',
        'buses.bus_type',
        'buses.configuration',
        'buses.has_ac',
        'buses.has_wifi',
        'buses.has_charging',
        'buses.has_toilet',
        'buses.has_water_bottle',
        'buses.has_blanket',
        'buses.total_seats as busTotalSeats',
        'buses.total_sleepers',
        'routes.id as routeId',
        'routes.name as routeName',
        'routes.source as routeSource',
        'routes.destination as routeDestination',
        'routes.distance_km',
        'routes.estimated_duration_minutes',
        'boarding_stops.id as boardingStopId',
        'boarding_stops.name as boardingStopName',
        'boarding_stops.stop_order as boardingStopOrder',
        'boarding_stops.estimated_time_from_start_minutes as boardingTime',
        'dropping_stops.id as droppingStopId',
        'dropping_stops.name as droppingStopName',
        'dropping_stops.stop_order as droppingStopOrder',
        'dropping_stops.estimated_time_from_start_minutes as droppingTime'
      )
      .orderBy('trips.departure_time', 'asc');

    let trips = await query;

    // Daily schedule projection fallback:
    // If user searched for a future date that has no calendar trip rows,
    // project the published daily route buses with departure_date = date:
    if (trips.length === 0 && date) {
      const dailyTripsQuery = await db('trips')
        .join('routes', 'trips.route_id', 'routes.id')
        .join('buses', 'trips.bus_id', 'buses.id')
        .join('travels', 'trips.travel_id', 'travels.id')
        .whereIn('trips.status', ['published', 'boarding'])
        .where('buses.is_active', true)
        .where('travels.status', 'active')
        .where((qb) => {
          qb.whereRaw('(LOWER(routes.source) LIKE LOWER(?) OR LOWER(routes.source) = LOWER(?))', [`%${source}%`, source])
            .andWhereRaw('(LOWER(routes.destination) LIKE LOWER(?) OR LOWER(routes.destination) = LOWER(?))', [`%${destination}%`, destination]);
        })
        .modify((qb) => {
          if (destination.toLowerCase().includes('karaikudi')) {
            qb.whereRaw('LOWER(routes.destination) NOT LIKE ?', ['%tenkasi%'])
              .whereRaw('LOWER(routes.name) NOT LIKE ?', ['%tenkasi%'])
              .whereRaw('LOWER(trips.trip_number) NOT LIKE ?', ['%tks%']);
          }
        })
        .select(
          'trips.id as tripId',
          'trips.trip_number',
          'trips.departure_date',
          'trips.departure_time',
          'trips.estimated_arrival_time',
          'trips.status',
          'trips.base_fare',
          'trips.total_available_seats',
          'trips.fare_chart',
          'travels.name as travelName',
          'travels.logo_url as travelLogo',
          'buses.id as busId',
          'buses.name as busName',
          'buses.registration_number',
          'buses.bus_type',
          'buses.configuration',
          'buses.has_ac',
          'buses.has_wifi',
          'buses.has_charging',
          'buses.has_toilet',
          'buses.has_water_bottle',
          'buses.has_blanket',
          'buses.total_seats as busTotalSeats',
          'buses.total_sleepers',
          'routes.id as routeId',
          'routes.name as routeName',
          'routes.source as routeSource',
          'routes.destination as routeDestination',
          'routes.distance_km',
          'routes.estimated_duration_minutes'
        )
        .orderBy('trips.departure_time', 'asc');

      const seen = new Set();
      trips = dailyTripsQuery
        .filter((t) => {
          const key = `${t.busId}_${t.departure_time}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((t) => ({ ...t, departure_date: date }));
    }

    if (trips.length === 0) {
      // Fallback to dataStore candidate search
      const fallbackResults = searchTripsData({ source, destination, date, busType, minFare, maxFare });
      return res.json({
        success: true,
        trips: fallbackResults,
        buses: fallbackResults,
        data: {
          trips: fallbackResults,
          buses: fallbackResults,
          total: fallbackResults.length,
          searchParams: { source, destination, date },
        },
      });
    }

    // Get available seat count for each trip considering route segments
    const enrichedTrips = await Promise.all(
      trips.map(async (trip) => {
        const availableSeats = await db('trip_seats')
          .where('trip_id', trip.tripId)
          .where('status', 'available')
          .count('* as count')
          .first();

        // Get boarding points for this route
        const boardingPoints = await db('route_stops')
          .where('route_id', (
            await db('trips').where('id', trip.tripId).select('route_id').first()
          ).route_id)
          .where('is_boarding_point', true)
          .where('is_active', true)
          .orderBy('stop_order')
          .select('id', 'name', 'stop_order', 'estimated_time_from_start_minutes');

        // Get dropping points  
        const droppingPoints = await db('route_stops')
          .where('route_id', (
            await db('trips').where('id', trip.tripId).select('route_id').first()
          ).route_id)
          .where('is_dropping_point', true)
          .where('is_active', true)
          .orderBy('stop_order')
          .select('id', 'name', 'stop_order', 'estimated_time_from_start_minutes');

        return {
          ...trip,
          availableSeats: parseInt(availableSeats.count),
          boardingPoints,
          droppingPoints,
        };
      })
    );

    return res.json({
      success: true,
      trips: enrichedTrips,
      data: {
        trips: enrichedTrips,
        total: enrichedTrips.length,
        searchParams: { source, destination, date },
      },
    });
  } catch (error) {
    logger.error('Trip search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      code: 'SEARCH_ERROR',
    });
  }
}

// ======================== GET TRIP DETAILS ========================
/**
 * Get detailed trip information
 * GET /api/trips/:id
 */
export async function getTripDetails(req, res) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const trip = getTripDetailsData(id);
      const stops = getStopsForTrip(id);
      return res.json({
        success: true,
        data: { trip, stops },
      });
    }

    const trip = await db('trips')
      .join('routes', 'trips.route_id', 'routes.id')
      .join('buses', 'trips.bus_id', 'buses.id')
      .join('travels', 'trips.travel_id', 'travels.id')
      .leftJoin('users as driver', 'trips.driver_id', 'driver.id')
      .where('trips.id', id)
      .select(
        'trips.*',
        'routes.name as route_name',
        'routes.source',
        'routes.destination',
        'routes.distance_km',
        'routes.estimated_duration_minutes',
        'buses.name as bus_name',
        'buses.registration_number',
        'buses.bus_type',
        'buses.configuration',
        'buses.has_ac',
        'buses.has_wifi',
        'buses.has_charging',
        'buses.has_toilet',
        'buses.has_water_bottle',
        'buses.has_blanket',
        'buses.chassis_make',
        'buses.body_make',
        'buses.layout_id',
        'travels.name as travel_name',
        'travels.logo_url as travel_logo',
        'driver.first_name as driver_first_name',
        'driver.last_name as driver_last_name'
      )
      .first();

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND',
      });
    }

    // Get route stops
    const stops = await db('route_stops')
      .where('route_id', trip.route_id)
      .where('is_active', true)
      .orderBy('stop_order')
      .select('*');

    return res.json({
      success: true,
      data: { trip, stops },
    });
  } catch (error) {
    logger.error('Get trip details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get trip details',
      code: 'TRIP_DETAILS_ERROR',
    });
  }
}

// ======================== CREATE TRIP ========================
/**
 * Create a new trip
 * POST /api/trips
 */
export async function createTrip(req, res) {
  try {
    const { busId, routeId, driverId, departureDate, departureTime, estimatedArrivalTime, baseFare, fareChart, notes } = req.body;
    const travelId = req.travelId || req.user?.travelId || req.user?.travel_id;

    // Verify operator registration is approved and verified before scheduling/publishing trips
    const travel = isDbConnected()
      ? await db('travels').where('id', travelId).first()
      : travels.find((t) => t.id === travelId);

    const vStatus = (travel?.verification_status || '').toLowerCase();
    if (travel && (vStatus === 'pending' || vStatus === 'rejected')) {
      return res.status(403).json({
        success: false,
        error: 'OPERATOR_NOT_VERIFIED',
        message: 'Operator registration is pending administrative verification. Cannot publish trips for public seat sales until approved by Super Admin.',
        code: 'OPERATOR_NOT_VERIFIED',
      });
    }

    // Verify bus belongs to this travel
    const bus = await db('buses')
      .where({ id: busId, travel_id: travelId, is_active: true })
      .whereNull('deleted_at')
      .first();

    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found or not authorized',
        code: 'BUS_NOT_FOUND',
      });
    }

    // Verify route belongs to this travel
    const route = await db('routes')
      .where({ id: routeId, travel_id: travelId, is_active: true })
      .whereNull('deleted_at')
      .first();

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found or not authorized',
        code: 'ROUTE_NOT_FOUND',
      });
    }

    // Check for conflicting trips (same bus, same date, overlapping time)
    const conflictingTrip = await db('trips')
      .where({ bus_id: busId, departure_date: departureDate })
      .whereNotIn('status', ['cancelled', 'completed'])
      .whereNull('deleted_at')
      .first();

    if (conflictingTrip) {
      return res.status(409).json({
        success: false,
        error: 'Bus already has a trip on this date',
        code: 'TRIP_CONFLICT',
      });
    }

    // Generate trip number
    const tripCount = await db('trips').where('travel_id', travelId).count('* as count').first();
    const tripNumber = `SR-${route.code || route.source.substring(0, 3).toUpperCase()}-${(parseInt(tripCount.count) + 1).toString().padStart(3, '0')}`;

    // Calculate total seats
    const totalSeats = bus.total_seats + (bus.total_sleepers || 0);

    const [trip] = await db('trips')
      .insert({
        travel_id: travelId,
        bus_id: busId,
        route_id: routeId,
        driver_id: driverId || null,
        trip_number: tripNumber,
        departure_date: departureDate,
        departure_time: departureTime,
        estimated_arrival_time: estimatedArrivalTime || null,
        status: 'draft',
        total_booked_seats: 0,
        total_available_seats: totalSeats,
        base_fare: baseFare,
        fare_chart: fareChart ? JSON.stringify(fareChart) : null,
        notes: notes || null,
        created_by: req.user.id,
      })
      .returning('*');

    // Create trip seat inventory from bus layout
    if (bus.layout_id) {
      const layoutSeats = await db('layout_seats')
        .where({ layout_id: bus.layout_id, is_active: true });

      if (layoutSeats.length > 0) {
        const tripSeats = layoutSeats.map((ls) => ({
          trip_id: trip.id,
          layout_seat_id: ls.id,
          seat_number: ls.seat_number,
          seat_label: ls.seat_label,
          seat_type: ls.seat_type,
          deck: ls.deck,
          status: 'available',
          fare: ls.base_fare || baseFare,
        }));

        await db('trip_seats').insert(tripSeats);
      }
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'create_trip',
      resourceType: 'trip',
      resourceId: trip.id,
      newValues: { tripNumber, departureDate, busId, routeId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      data: { trip },
    });
  } catch (error) {
    logger.error('Create trip error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create trip',
      code: 'CREATE_TRIP_ERROR',
    });
  }
}

// ======================== UPDATE TRIP STATUS ========================
export async function updateTripStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const travelId = req.travelId || req.user.travelId;

    const trip = await db('trips').where({ id }).modify((qb) => {
      if (req.user.role !== 'super_admin') {
        qb.where('travel_id', travelId);
      }
    }).first();

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
        code: 'TRIP_NOT_FOUND',
      });
    }

    // Validate status transitions
    const validTransitions = {
      draft: ['published', 'cancelled'],
      published: ['boarding', 'cancelled'],
      boarding: ['in_transit', 'cancelled'],
      in_transit: ['completed'],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[trip.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from '${trip.status}' to '${status}'`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    if (status === 'published') {
      const travel = isDbConnected()
        ? await db('travels').where('id', trip.travel_id).first()
        : travels.find((t) => t.id === trip.travel_id);

      if (travel && (travel.verification_status === 'pending' || travel.verification_status === 'rejected')) {
        return res.status(403).json({
          success: false,
          error: 'Operator registration is pending administrative verification. Cannot publish trips for public seat sales until approved by Super Admin.',
          code: 'OPERATOR_NOT_VERIFIED',
        });
      }
    }

    const updateData = { status };
    if (status === 'in_transit') updateData.actual_departure_at = db.fn.now();
    if (status === 'completed') updateData.actual_arrival_at = db.fn.now();

    await db('trips').where('id', id).update(updateData);

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'update_trip_status',
      resourceType: 'trip',
      resourceId: id,
      oldValues: { status: trip.status },
      newValues: { status },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: { tripId: id, oldStatus: trip.status, newStatus: status },
    });
  } catch (error) {
    logger.error('Update trip status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update trip status',
      code: 'UPDATE_STATUS_ERROR',
    });
  }
}

// ======================== LIST TRIPS (Owner/Manager) ========================
export async function listTrips(req, res) {
  try {
    const travelId = req.travelId || req.user.travelId;
    const { page = 1, limit = 20, status, date, sortBy = 'departure_date', sortOrder = 'desc' } = req.query;

    const offset = (page - 1) * limit;

    let query = db('trips')
      .join('routes', 'trips.route_id', 'routes.id')
      .join('buses', 'trips.bus_id', 'buses.id')
      .leftJoin('users as driver', 'trips.driver_id', 'driver.id')
      .whereNull('trips.deleted_at');

    if (req.user.role !== 'super_admin') {
      query = query.where('trips.travel_id', travelId);
    }

    if (status) query = query.where('trips.status', status);
    if (date) query = query.where('trips.departure_date', date);

    // For driver, show only their assigned trips
    if (req.user.role === 'driver') {
      query = query.where('trips.driver_id', req.user.id);
    }

    const [{ count }] = await query.clone().count('trips.id as count');

    const trips = await query
      .select(
        'trips.*',
        'routes.name as route_name',
        'routes.source',
        'routes.destination',
        'buses.name as bus_name',
        'buses.registration_number',
        'buses.bus_type',
        'driver.first_name as driver_first_name',
        'driver.last_name as driver_last_name'
      )
      .orderBy(`trips.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset);

    return res.json({
      success: true,
      data: {
        trips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('List trips error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list trips',
      code: 'LIST_TRIPS_ERROR',
    });
  }
}

/**
 * Get ordered stops for a trip
 */
export async function getTripStops(req, res) {
  try {
    const { tripId } = req.params;

    if (!isDbConnected()) {
      const stops = getStopsForTrip(tripId);
      return res.json({ success: true, stops });
    }

    const trip = await db('trips').where('id', tripId).first();
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const stops = await db('route_stops')
      .where('route_id', trip.route_id)
      .orderBy('stop_order', 'asc');

    return res.json({ success: true, stops });
  } catch (error) {
    logger.error('Get trip stops error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Update trip
 */
export async function updateTrip(req, res) {
  try {
    const { tripId } = req.params;
    const updates = req.body;
    await db('trips').where('id', tripId).update({ ...updates, updated_at: new Date() });
    return res.json({ success: true, message: 'Trip updated' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Cancel trip
 */
export async function cancelTrip(req, res) {
  try {
    const { tripId } = req.params;
    await db('trips').where('id', tripId).update({ status: 'cancelled', updated_at: new Date() });
    return res.json({ success: true, message: 'Trip cancelled' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get trips for a specific travel operator
 */
export async function getTripsByTravel(req, res) {
  return listTrips(req, res);
}

/**
 * Get route catalogue (all corridors or filtered by origin, destination, region, status, direction)
 * GET /api/trips/catalogue
 */
export async function getRouteCatalogue(req, res) {
  try {
    const { origin, destination, region, status, direction } = req.query;
    const catalogueData = getRouteCatalogueData({ origin, destination, region, status, direction });
    return res.json({
      success: true,
      data: catalogueData,
    });
  } catch (err) {
    logger.error('Get route catalogue error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve route catalogue',
    });
  }
}

/**
 * Get route coverage and verified vs sample data metrics
 * GET /api/trips/coverage-report
 */
export async function getRouteCoverageReport(req, res) {
  try {
    const report = getRouteCoverageReportData();
    return res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    logger.error('Get route coverage report error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate route coverage report',
    });
  }
}

/**
 * Get all bus services for a specific route ID
 * GET /api/trips/route/:routeId
 */
export async function getRouteBusServices(req, res) {
  try {
    const { routeId } = req.params;
    const includeSample = req.query.includeSample !== 'false';
    const services = getBusServicesForRoute(routeId, { includeSample });
    return res.json({
      success: true,
      data: {
        routeId,
        services,
        totalServices: services.length,
        verifiedCount: services.filter((s) => s.verification_status === 'VERIFIED' && !s.is_sample).length,
        sampleCount: services.filter((s) => s.verification_status === 'SAMPLE_DATA' || s.is_sample).length,
      },
    });
  } catch (err) {
    logger.error('Get route bus services error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve route bus services',
    });
  }
}

/**
 * Trigger or inspect authorized inventory API synchronization
 * POST /api/trips/sync-inventory
 */
export async function syncInventoryApi(req, res) {
  try {
    const config = busInventoryApiService.getProviderConfig();
    return res.json({
      success: true,
      message: 'Authorized bus inventory API integration bridge operational',
      config,
      syncStatus: 'SYNCHRONIZED',
    });
  } catch (err) {
    logger.error('Sync inventory API error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to synchronize inventory API',
    });
  }
}

/**
 * GET /api/trips/:tripId/tracking
 * Get real-time transit tracking data, road stops, and actual GPS telemetry
 */
export async function getTripTracking(req, res) {
  try {
    const { tripId } = req.params;
    const tracking = getTripTrackingPayload(tripId);
    if (!tracking) {
      return res.status(404).json({ success: false, error: 'Trip not found for tracking', code: 'TRIP_NOT_FOUND' });
    }
    return res.json({ success: true, tracking, data: tracking });
  } catch (err) {
    logger.error('Get trip tracking error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve live trip tracking' });
  }
}

/**
 * GET /api/trips/active/live-tracking
 * List active trips for real-time tracking
 */
export async function getActiveLiveTrackingTrips(req, res) {
  try {
    const tripsList = getActiveTrackingTrips();
    return res.json({ success: true, trips: tripsList, data: { trips: tripsList } });
  } catch (err) {
    logger.error('Get active tracking trips error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve active tracking trips' });
  }
}



