import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';
import { createAuditLog } from '../services/auditService.js';
import { getDriverTrip, getStopsForTrip, getDriverManifest, updatePassengerBoarding, updateGpsLocation } from '../services/dataStore.js';

/**
 * Get driver's current/active trip
 * GET /api/driver/current-trip
 */
export async function getCurrentTrip(req, res) {
  try {
    const driverId = req.user ? req.user.id : 'usr-driver-001';

    if (!isDbConnected()) {
      const trip = getDriverTrip(driverId);
      const stops = getStopsForTrip(trip.id);
      return res.json({
        success: true,
        trip,
        data: {
          trip,
          stops,
          currentStop: stops[0],
          nextStop: stops[1],
          totalStops: stops.length,
          completedStops: 0,
        },
      });
    }

    const trip = await db('trips')
      .join('routes', 'trips.route_id', 'routes.id')
      .join('buses', 'trips.bus_id', 'buses.id')
      .join('travels', 'trips.travel_id', 'travels.id')
      .where('trips.driver_id', driverId)
      .whereIn('trips.status', ['published', 'boarding', 'in_transit'])
      .select(
        'trips.*',
        'routes.name as route_name', 'routes.source', 'routes.destination',
        'buses.name as bus_name', 'buses.registration_number',
        'travels.name as travel_name'
      )
      .orderBy('trips.departure_date', 'asc')
      .first();

    if (!trip) {
      return res.json({
        success: true,
        data: { trip: null, message: 'No active trip assigned' },
      });
    }

    // Get route stops
    const stops = await db('route_stops')
      .where('route_id', trip.route_id)
      .where('is_active', true)
      .orderBy('stop_order')
      .select('*');

    // Get current stop info
    const currentStop = stops.find((s) => s.stop_order === trip.current_stop_order) || stops[0];
    const nextStop = stops.find((s) => s.stop_order === (trip.current_stop_order || 0) + 1);

    return res.json({
      success: true,
      data: {
        trip,
        stops,
        currentStop,
        nextStop,
        totalStops: stops.length,
        completedStops: trip.current_stop_order || 0,
      },
    });
  } catch (error) {
    logger.error('Get current trip error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get current trip',
      code: 'CURRENT_TRIP_ERROR',
    });
  }
}

/**
 * Get stop-wise passenger chart
 * GET /api/driver/passenger-chart/:tripId
 */
export async function getPassengerChart(req, res) {
  try {
    const { tripId } = req.params;
    const { stopOrder } = req.query;

    if (!isDbConnected()) {
      const manifest = getDriverManifest(tripId);
      return res.json({
        success: true,
        passengers: manifest,
        data: {
          passengers: manifest,
          totalPassengers: manifest.length,
          boarded: manifest.filter((m) => m.is_boarded).length,
          notYet: manifest.filter((m) => !m.is_boarded).length,
          stopWiseChart: {},
        },
      });
    }

    // Verify driver is assigned to this trip
    const trip = await db('trips')
      .where({ id: tripId, driver_id: req.user.id })
      .first();

    if (!trip && req.user.role === 'driver') {
      return res.status(403).json({
        success: false,
        error: 'Not assigned to this trip',
        code: 'NOT_ASSIGNED',
      });
    }

    // Get all booking passengers for this trip
    let query = db('booking_passengers')
      .join('bookings', 'booking_passengers.booking_id', 'bookings.id')
      .join('route_stops as boarding', 'bookings.boarding_stop_id', 'boarding.id')
      .join('route_stops as dropping', 'bookings.dropping_stop_id', 'dropping.id')
      .where('bookings.trip_id', tripId)
      .whereIn('bookings.status', ['confirmed', 'completed']);

    // Filter by specific stop if requested
    if (stopOrder) {
      const order = parseInt(stopOrder);
      query = query.where('boarding.stop_order', order);
    }

    const passengers = await query
      .select(
        'booking_passengers.id',
        'booking_passengers.name',
        'booking_passengers.seat_number',
        'booking_passengers.boarding_status',
        'booking_passengers.boarded_at',
        'booking_passengers.mobile',
        'bookings.id as booking_id',
        'bookings.booking_number',
        'bookings.contact_mobile',
        'boarding.name as boarding_stop',
        'boarding.stop_order as boarding_stop_order',
        'dropping.name as dropping_stop',
        'dropping.stop_order as dropping_stop_order'
      )
      .orderBy(['boarding.stop_order', 'booking_passengers.seat_number']);

    // Group by boarding stop
    const stopWiseChart = {};
    const stops = await db('route_stops')
      .where('route_id', trip?.route_id || (await db('trips').where('id', tripId).first()).route_id)
      .where('is_boarding_point', true)
      .where('is_active', true)
      .orderBy('stop_order');

    for (const stop of stops) {
      stopWiseChart[stop.stop_order] = {
        stopName: stop.name,
        stopOrder: stop.stop_order,
        passengers: passengers.filter((p) => p.boarding_stop_order === stop.stop_order),
        totalBoarding: passengers.filter((p) => p.boarding_stop_order === stop.stop_order).length,
        boarded: passengers.filter(
          (p) => p.boarding_stop_order === stop.stop_order && p.boarding_status === 'boarded'
        ).length,
        notYet: passengers.filter(
          (p) => p.boarding_stop_order === stop.stop_order && p.boarding_status === 'not_yet'
        ).length,
      };
    }

    return res.json({
      success: true,
      data: {
        chart: stopWiseChart,
        totalPassengers: passengers.length,
        totalBoarded: passengers.filter((p) => p.boarding_status === 'boarded').length,
        totalNotYet: passengers.filter((p) => p.boarding_status === 'not_yet').length,
        currentStopOrder: trip?.current_stop_order || 1,
      },
    });
  } catch (error) {
    logger.error('Get passenger chart error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get passenger chart',
      code: 'CHART_ERROR',
    });
  }
}

/**
 * Mark passenger as boarded
 * POST /api/driver/board-passenger
 */
export async function boardPassenger(req, res) {
  try {
    const { passengerId, bookingId, seatNumber, boardingStatus } = req.body;

    if (!isDbConnected()) {
      const result = updatePassengerBoarding(passengerId || seatNumber, boardingStatus || 'boarded');
      return res.json({
        success: true,
        message: `Passenger boarding verified successfully`,
        passenger: result.passenger,
      });
    }

    const passenger = await db('booking_passengers')
      .join('bookings', 'booking_passengers.booking_id', 'bookings.id')
      .where('booking_passengers.id', passengerId)
      .where('bookings.id', bookingId)
      .select('booking_passengers.*', 'bookings.trip_id')
      .first();

    if (!passenger) {
      return res.status(404).json({
        success: false,
        error: 'Passenger not found',
        code: 'PASSENGER_NOT_FOUND',
      });
    }

    if (passenger.boarding_status === 'boarded') {
      return res.status(400).json({
        success: false,
        error: 'Passenger already boarded',
        code: 'ALREADY_BOARDED',
      });
    }

    await db('booking_passengers')
      .where('id', passengerId)
      .update({
        boarding_status: 'boarded',
        boarded_at: db.fn.now(),
        boarding_verified_by: req.user.id,
      });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'board_passenger',
      resourceType: 'booking_passenger',
      resourceId: passengerId,
      newValues: { boardingStatus: 'boarded' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: { message: 'Passenger marked as boarded', passengerId },
    });
  } catch (error) {
    logger.error('Board passenger error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to board passenger',
      code: 'BOARD_ERROR',
    });
  }
}

/**
 * Update GPS location
 * POST /api/driver/location
 */
export async function updateLocation(req, res) {
  try {
    const { tripId, latitude, longitude, speed, heading, accuracy } = req.body;

    if (!tripId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Trip ID, latitude and longitude are required',
        code: 'MISSING_LOCATION',
      });
    }

    if (!isDbConnected()) {
      const loc = updateGpsLocation({ tripId, latitude, longitude, speed, heading });
      return res.json({
        success: true,
        message: 'GPS location updated',
        data: loc,
      });
    }

    // Save GPS location
    await db('gps_locations').insert({
      trip_id: tripId,
      driver_id: req.user.id,
      latitude,
      longitude,
      speed: speed || null,
      heading: heading || null,
      accuracy: accuracy || null,
      recorded_at: db.fn.now(),
    });

    // Update trip current location
    await db('trips')
      .where('id', tripId)
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
      });

    // This will be emitted via WebSocket to connected clients
    // The WebSocket handler listens for location updates

    return res.json({
      success: true,
      data: { message: 'Location updated' },
    });
  } catch (error) {
    logger.error('Update location error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update location',
      code: 'LOCATION_ERROR',
    });
  }
}

/**
 * Advance to next stop
 * POST /api/driver/advance-stop
 */
export async function advanceStop(req, res) {
  try {
    const { tripId } = req.body;

    const trip = await db('trips')
      .where({ id: tripId, driver_id: req.user.id })
      .first();

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found or not assigned',
        code: 'TRIP_NOT_FOUND',
      });
    }

    const totalStops = await db('route_stops')
      .where('route_id', trip.route_id)
      .where('is_active', true)
      .count('* as count')
      .first();

    const newStopOrder = (trip.current_stop_order || 0) + 1;

    if (newStopOrder > parseInt(totalStops.count)) {
      return res.status(400).json({
        success: false,
        error: 'Already at the last stop',
        code: 'LAST_STOP',
      });
    }

    await db('trips').where('id', tripId).update({
      current_stop_order: newStopOrder,
    });

    const nextStop = await db('route_stops')
      .where({ route_id: trip.route_id, stop_order: newStopOrder })
      .first();

    return res.json({
      success: true,
      data: {
        currentStopOrder: newStopOrder,
        currentStop: nextStop?.name,
        message: `Advanced to stop: ${nextStop?.name}`,
      },
    });
  } catch (error) {
    logger.error('Advance stop error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to advance stop',
      code: 'ADVANCE_ERROR',
    });
  }
}

// Aliases
export const verifyPassengerBoarding = boardPassenger;

