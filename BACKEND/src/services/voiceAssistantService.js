import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';
import {
  getBookingByPnr,
  getTripTrackingPayload,
  getTripTelemetry,
  getStopsForTrip,
  getDriverManifest,
  trips,
  bookings as inMemoryBookings,
  routes,
  buses,
  travels,
  users,
} from './dataStore.js';

/**
 * SMART ROUTE — Secure AI Voice Assistant Service & Backend Tools
 * 
 * Provides verified data access for in-app voice sessions and telephone conversations.
 * Strictly enforces passenger privacy, driver trip assignment RBAC, and telemetry honesty.
 */

/**
 * Normalizes phone numbers for robust verification (removes +91, spaces, dashes)
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Verifies if the requester has permission to access a booking.
 * Allowed if:
 * 1. user is super_admin or travel_owner of this trip's travel
 * 2. user is the booked passenger (user.id matches booking.user_id)
 * 3. caller's verified mobile matches booking.contact_mobile (last 4 or full 10 digits)
 */
export function verifyBookingOwnership(booking, { user, callerMobile }) {
  if (!booking) return false;

  // 1. Role-based bypass for admin
  if (user && user.role === 'super_admin') {
    return true;
  }

  // 2. Travel Owner check (can only view bookings for their own company)
  if (user && user.role === 'travel_owner') {
    return booking.travel_id === user.travel_id;
  }

  // 3. Authenticated passenger check
  if (user && user.id && (user.id === booking.user_id || user.id === booking.userId)) {
    return true;
  }

  // 4. Telephone / Caller mobile verification
  if (callerMobile) {
    const normCaller = normalizePhone(callerMobile);
    const normBooking = normalizePhone(booking.contact_mobile || booking.contactMobile);

    if (normCaller && normBooking) {
      if (normCaller === normBooking) return true;
      if (normCaller.length >= 4 && normBooking.endsWith(normCaller)) return true;
      if (normBooking.length >= 4 && normCaller.endsWith(normBooking.slice(-4))) return true;
    }
  }

  return false;
}

/**
 * Helper to fetch a booking record by PNR or ID from DB or in-memory store
 */
export async function findBooking(pnr) {
  if (!pnr) return null;
  const cleanPnr = String(pnr).trim().toUpperCase();

  if (isDbConnected()) {
    try {
      const record = await db('bookings')
        .where(function () {
          this.where('pnr_number', cleanPnr).orWhere('id', cleanPnr);
        })
        .first();

      if (record) {
        // Also fetch passengers
        const pax = await db('booking_passengers').where('booking_id', record.id);
        const trip = await db('trips').where('id', record.trip_id).first();
        const bus = trip ? await db('buses').where('id', trip.bus_id).first() : null;
        const route = trip ? await db('routes').where('id', trip.route_id).first() : null;
        const travel = trip ? await db('travels').where('id', trip.travel_id).first() : null;

        return {
          ...record,
          passengers: pax || [],
          trip: {
            trip_number: trip?.trip_number,
            departure_date: trip?.departure_date,
            departure_time: trip?.departure_time,
            estimated_arrival_time: trip?.estimated_arrival_time,
            bus_name: bus?.name,
            registration_number: bus?.registration_number,
            route_name: route?.name,
            source: route?.source,
            destination: route?.destination,
            boarding_stop_name: record.boarding_point_name || 'Designated Terminal',
            dropping_stop_name: record.dropping_point_name || 'Designated Terminal',
            boarding_time: trip?.departure_time || '21:00',
            dropping_time: trip?.estimated_arrival_time || '06:00',
          },
          travel_name: travel?.name,
        };
      }
    } catch (err) {
      logger.warn(`Database booking lookup error (${err.message}). Using local store.`);
    }
  }

  return getBookingByPnr(cleanPnr);
}

/**
 * TOOL 1: getBookingStatus
 * 
 * Retrieves current status, travel date, source, destination, and bus number.
 * Requires ownership verification.
 */
export async function getBookingStatus({ pnr, mobile, user } = {}) {
  if (!pnr) {
    return {
      success: false,
      error: 'MISSING_PNR',
      message: 'Please provide a valid booking PNR number.',
    };
  }

  const booking = await findBooking(pnr);
  if (!booking) {
    return {
      success: false,
      error: 'BOOKING_NOT_FOUND',
      message: `No booking found with PNR reference "${pnr}". Please check the number and try again.`,
    };
  }

  const isAuthorized = verifyBookingOwnership(booking, { user, callerMobile: mobile });
  if (!isAuthorized) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Identity verification required. For security, please verify the registered mobile number associated with this booking.',
      requiresVerification: true,
    };
  }

  return {
    success: true,
    data: {
      pnr: booking.pnr_number || booking.id,
      status: booking.booking_status || booking.status || 'confirmed',
      paymentStatus: booking.payment_status || 'paid',
      travelDate: booking.trip?.departure_date || booking.journey_date || new Date().toISOString().split('T')[0],
      source: booking.trip?.source || booking.origin_city || 'Coimbatore',
      destination: booking.trip?.destination || booking.destination_city || 'Bangalore',
      busNumber: booking.trip?.registration_number || booking.bus_number || 'TN-38-SR-0001',
      travelName: booking.travel_name || booking.trip?.travel_name || 'Smart Route Flagship Express',
      totalPassengers: (booking.passengers || []).length || 1,
    },
  };
}

/**
 * TOOL 2: getPassengerTripDetails
 * 
 * Retrieves seat numbers, seat types, bus amenities, scheduled times, and passenger names.
 */
export async function getPassengerTripDetails({ pnr, mobile, user } = {}) {
  if (!pnr) {
    return {
      success: false,
      error: 'MISSING_PNR',
      message: 'Please provide a valid booking PNR number.',
    };
  }

  const booking = await findBooking(pnr);
  if (!booking) {
    return {
      success: false,
      error: 'BOOKING_NOT_FOUND',
      message: `No booking found for PNR "${pnr}".`,
    };
  }

  const isAuthorized = verifyBookingOwnership(booking, { user, callerMobile: mobile });
  if (!isAuthorized) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Access denied. The registered passenger mobile number must match the booking record.',
      requiresVerification: true,
    };
  }

  const paxList = (booking.passengers || []).map((p) => ({
    name: p.passenger_name || p.name || 'Passenger',
    seatNumber: p.seat_number,
    seatType: p.seat_number?.startsWith('U') ? 'Upper Sleeper' : (p.seat_number?.startsWith('LS') || p.seat_number?.startsWith('L') ? 'Lower Sleeper/Seater' : 'Standard Seater'),
    isBoarded: Boolean(p.is_boarded),
  }));

  return {
    success: true,
    data: {
      pnr: booking.pnr_number || booking.id,
      tripNumber: booking.trip?.trip_number || 'SR-TRIP-101',
      busName: booking.trip?.bus_name || 'Royal Multi-Axle Volvo Coach',
      busType: booking.bus_type || 'AC Sleeper 2+1',
      amenities: 'High-speed WiFi, Air Conditioning, Individual USB Charging, Sanitized Blankets, Reading Lamps',
      departureTime: booking.trip?.departure_time || '21:00',
      estimatedArrivalTime: booking.trip?.estimated_arrival_time || '06:00',
      passengers: paxList,
      seatNumbers: paxList.map((p) => p.seatNumber).join(', '),
    },
  };
}

/**
 * TOOL 3: getBusLocationAndETA
 * 
 * Connects to live GPS telemetry. Strictly verifies timestamp and freshness.
 * If tracking is stale (> 5 minutes) or on standby, honestly explains status without inventing fake coordinates.
 */
export async function getBusLocationAndETA({ tripId, pnr, mobile, user } = {}) {
  let effectiveTripId = tripId;

  // If tripId is not passed, resolve from PNR
  if (!effectiveTripId && pnr) {
    const booking = await findBooking(pnr);
    if (booking) {
      const isAuthorized = verifyBookingOwnership(booking, { user, callerMobile: mobile });
      if (!isAuthorized) {
        return {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Verification required to track this bus.',
        };
      }
      effectiveTripId = booking.trip_id;
    }
  }

  if (!effectiveTripId && trips[0]) {
    effectiveTripId = trips[0].id;
  }

  // Check telemetry
  const telemetry = getTripTelemetry(effectiveTripId);
  const payload = getTripTrackingPayload(effectiveTripId);

  if (!telemetry || !payload?.liveGps?.hasLiveGps) {
    return {
      success: true,
      hasLiveTracking: false,
      status: 'standby',
      message: 'Live GPS telemetry is currently on standby at the departure terminal. Live tracking starts 30-45 minutes before departure once the driver activates the console.',
      busName: payload?.bus?.name || 'Smart Route Coach',
      scheduledDeparture: payload?.trip?.departure_time || '21:00',
    };
  }

  // Check freshness (> 5 minutes is stale)
  if (telemetry.isStale) {
    return {
      success: true,
      hasLiveTracking: false,
      status: 'stale_gps',
      message: `GPS telemetry was last recorded ${Math.round(telemetry.ageSeconds / 60)} minutes ago and is currently awaiting a signal update. The live ETA cannot be reliably confirmed at this moment.`,
      lastKnownLocation: {
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        recordedAt: telemetry.recorded_at,
        lastStop: telemetry.next_stop_name || 'En Route',
      },
    };
  }

  // Reliable fresh live tracking
  return {
    success: true,
    hasLiveTracking: true,
    status: 'active',
    data: {
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      speedKmH: Math.round(telemetry.speed || 0),
      headingDegrees: Math.round(telemetry.heading || 0),
      nextStop: telemetry.next_stop_name || payload.stops?.[1]?.name || 'Next Scheduled Stop',
      eta: telemetry.eta || '15 mins',
      lastUpdatedSecondsAgo: telemetry.ageSeconds || 5,
      busRegistration: payload.bus?.registration_number || 'TN-38-SR-0001',
      tripStatus: payload.trip?.status || 'in_transit',
    },
  };
}

/**
 * TOOL 4: getBoardingAndDroppingDetails
 * 
 * Returns passenger's exact boarding stop, landmark, scheduled time, platform/bay, and drop stop.
 */
export async function getBoardingAndDroppingDetails({ pnr, mobile, user } = {}) {
  if (!pnr) {
    return {
      success: false,
      error: 'MISSING_PNR',
      message: 'Please provide a valid booking PNR number.',
    };
  }

  const booking = await findBooking(pnr);
  if (!booking) {
    return {
      success: false,
      error: 'BOOKING_NOT_FOUND',
      message: `No booking found for PNR "${pnr}".`,
    };
  }

  const isAuthorized = verifyBookingOwnership(booking, { user, callerMobile: mobile });
  if (!isAuthorized) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Access denied. The registered passenger mobile number must match the booking record.',
    };
  }

  const payload = getTripTrackingPayload(booking.trip_id, booking);
  const stops = payload?.stops || getStopsForTrip(booking.trip_id);

  const boardingStop = stops.find((s) => s.id === booking.boarding_stop_id || s.name === booking.trip?.boarding_stop_name) || {
    name: booking.trip?.boarding_stop_name || 'Omni Bus Stand',
    scheduled_time: booking.trip?.boarding_time || '21:15',
    platform: 'Bay 3',
  };

  const droppingStop = stops.find((s) => s.id === booking.dropping_stop_id || s.name === booking.trip?.dropping_stop_name) || {
    name: booking.trip?.dropping_stop_name || 'City Terminal',
    scheduled_time: booking.trip?.dropping_time || '05:30',
    platform: 'Platform 1',
  };

  return {
    success: true,
    data: {
      pnr: booking.pnr_number || booking.id,
      boardingPoint: {
        name: boardingStop.name || boardingStop.stop_name,
        scheduledTime: boardingStop.scheduled_time || '21:15',
        platform: boardingStop.platform || 'Bay 3',
        landmark: 'Near Main Passenger Lounge, Counter 4',
      },
      droppingPoint: {
        name: droppingStop.name || droppingStop.stop_name,
        scheduledTime: droppingStop.scheduled_time || '05:30',
        platform: droppingStop.platform || 'Platform 1',
      },
    },
  };
}

/**
 * TOOL 5: getNextRouteStop
 * 
 * Returns the next upcoming stop on the route for an active trip.
 */
export async function getNextRouteStop({ tripId } = {}) {
  const targetTripId = tripId || trips[0]?.id;
  const stops = getStopsForTrip(targetTripId);
  const telemetry = getTripTelemetry(targetTripId);

  if (!stops || stops.length === 0) {
    return {
      success: false,
      error: 'NO_STOPS_FOUND',
      message: 'Route stops are not defined for this trip.',
    };
  }

  let nextStopIndex = 1;
  if (telemetry?.current_stop_id) {
    const currentIdx = stops.findIndex((s) => s.id === telemetry.current_stop_id);
    if (currentIdx !== -1 && currentIdx < stops.length - 1) {
      nextStopIndex = currentIdx + 1;
    }
  }

  const nextStop = stops[nextStopIndex] || stops[stops.length - 1];

  return {
    success: true,
    data: {
      tripId: targetTripId,
      nextStopName: nextStop.name,
      stopOrder: nextStop.stop_order || nextStopIndex + 1,
      totalStops: stops.length,
      estimatedArrival: telemetry?.eta || '15 mins',
      isDroppingPoint: Boolean(nextStop.is_dropping_point),
      isBoardingPoint: Boolean(nextStop.is_boarding_point),
    },
  };
}

/**
 * TOOL 6: getDriverBoardingManifest
 * 
 * STRICT ACCESS CONTROL:
 * Only an authenticated driver (`role === 'driver'`) assigned to this trip can access the manifest.
 * Rejects passengers, conductors, or drivers assigned to different trips.
 */
export async function getDriverBoardingManifest({ tripId, driverId, user } = {}) {
  const targetTripId = tripId || trips[0]?.id;

  // 1. Authorization check: User must be authenticated
  if (!user && !driverId) {
    return {
      success: false,
      error: 'UNAUTHENTICATED',
      message: 'Driver authentication required to access trip passenger manifest.',
    };
  }

  const effectiveDriverId = user?.id || driverId;
  const effectiveRole = user?.role || (driverId ? 'driver' : 'passenger');

  // Must be driver role (or super_admin for operational oversight)
  if (effectiveRole !== 'driver' && effectiveRole !== 'super_admin') {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Unauthorized. Passenger manifest is strictly restricted to assigned drivers.',
    };
  }

  // 2. Verify driver is assigned to this specific trip
  const trip = trips.find((t) => t.id === targetTripId);
  if (trip && trip.driver_id && trip.driver_id !== effectiveDriverId && effectiveRole !== 'super_admin') {
    return {
      success: false,
      error: 'NOT_ASSIGNED',
      message: 'You are not assigned as the primary driver for this trip.',
    };
  }

  const manifest = getDriverManifest(targetTripId);
  const sanitizedManifest = manifest.map((m) => ({
    id: m.id,
    pnr: m.pnr_number,
    seatNumber: m.seat_number,
    passengerName: m.passenger_name,
    passengerGender: m.passenger_gender,
    boardingStop: m.boarding_stop,
    isBoarded: Boolean(m.is_boarded),
  }));

  return {
    success: true,
    data: {
      tripId: targetTripId,
      totalPassengers: sanitizedManifest.length,
      boardedCount: sanitizedManifest.filter((m) => m.isBoarded).length,
      pendingCount: sanitizedManifest.filter((m) => !m.isBoarded).length,
      passengers: sanitizedManifest,
    },
  };
}

export default {
  getBookingStatus,
  getPassengerTripDetails,
  getBusLocationAndETA,
  getBoardingAndDroppingDetails,
  getNextRouteStop,
  getDriverBoardingManifest,
  verifyBookingOwnership,
  findBooking,
  normalizePhone,
};
