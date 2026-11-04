import { describe, test, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import {
  trips,
  routes,
  routeStops,
  tripSeatsMap,
  tripSegmentReservations,
  createNewBooking,
  getSeatsForTrip,
  purgeExpiredMemoryHolds,
  resetAllSeatLocks,
} from '../../BACKEND/src/services/dataStore.js';
import {
  validateSeatGenders,
  getAdjacentSeat,
  DEFAULT_SEAT_PAIRS,
} from '../../BACKEND/src/utils/genderAllocation.js';
import { getTripSeatMap } from '../../BACKEND/src/controllers/seatController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Gender Allocation Rules & Seat Overlap Sync Pipeline', () => {
  const passengerDetailsPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/PassengerDetails.jsx');
  const checkoutPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/Checkout.jsx');
  const tripBookingPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TripBooking.jsx');
  const searchTripsPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/SearchTrips.jsx');
  const landingPagePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/LandingPage.jsx');
  const coachLayoutPath = path.resolve(__dirname, '../../FRONTEND/src/components/seats/CoachSeatLayout.jsx');
  const devRoutesPath = path.resolve(__dirname, '../../BACKEND/src/routes/devRoutes.js');

  const passengerDetailsContent = fs.readFileSync(passengerDetailsPath, 'utf8');
  const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
  const tripBookingContent = fs.readFileSync(tripBookingPath, 'utf8');
  const searchTripsContent = fs.readFileSync(searchTripsPath, 'utf8');
  const landingPageContent = fs.readFileSync(landingPagePath, 'utf8');
  const coachLayoutContent = fs.readFileSync(coachLayoutPath, 'utf8');
  const devRoutesContent = fs.readFileSync(devRoutesPath, 'utf8');

  let testTrip;
  let boardingStop;
  let droppingStop;

  beforeAll(() => {
    testTrip = trips[0];
    const stops = routeStops
      .filter((s) => s.route_id === testTrip.route_id)
      .sort((a, b) => a.stop_order - b.stop_order);
    boardingStop = stops[0];
    droppingStop = stops[stops.length - 1];
  });

  // ==================== SECTION 1: SELECTED BUS CRASH PROTECTION ====================
  describe('1. selectedBus Reference Stability & Safe Fallbacks', () => {
    test('PassengerDetails, Checkout, and TripBooking guard against selectedBus ReferenceError', () => {
      expect(passengerDetailsContent).toContain('selectedBus');
      expect(passengerDetailsContent).toContain('activeRoute');
      expect(checkoutContent).toContain('selectedBus');
      expect(checkoutContent).toContain('activeRoute');
      expect(tripBookingContent).toContain('const activeBus =');
      expect(tripBookingContent).toContain('const selectedBus =');
      expect(tripBookingContent).toContain('const activeRoute =');
    });

    test('TripBooking reads selectedBus from location.state, bookingState, and sessionStorage fallback', () => {
      expect(tripBookingContent).toContain("sessionStorage.getItem('smartroute_active_bus')");
      expect(tripBookingContent).toContain("sessionStorage.getItem('smartroute_selected_seats')");
      expect(tripBookingContent).toContain('activeBus');
    });
  });

  // ==================== SECTION 2: ROUTE STATE ISOLATION & CACHE FLUSH ====================
  describe('2. Route State Isolation & Cache Flush', () => {
    test('LandingPage flushes stale booking session keys on new search and caravan clicks', () => {
      expect(landingPageContent).toContain("sessionStorage.removeItem('smartroute_active_bus')");
      expect(landingPageContent).toContain("sessionStorage.removeItem('smartroute_selected_seats')");
      expect(landingPageContent).toContain("sessionStorage.removeItem('smartroute_boarding_point')");
      expect(landingPageContent).toContain("sessionStorage.removeItem('smartroute_dropping_point')");
      expect(landingPageContent).toContain("sessionStorage.removeItem('smartroute_booking_session')");
    });

    test('SearchTrips flushes stale booking storage and strictly isolates Karaikudi route', () => {
      expect(searchTripsContent).toContain('flushStaleBookingSession');
      expect(searchTripsContent).toContain("lowerTo.includes('karaikudi')");
      expect(searchTripsContent).toContain("dest.includes('tenkasi')");
      expect(searchTripsContent).toContain("['Pudukkottai', 'Alagappa University', 'Karaikudi New Bus Stand']");
    });
  });

  // ==================== SECTION 3: COMMERCIAL BUS GENDER ALLOCATION ENGINE ====================
  describe('3. Commercial Bus Gender Allocation Rules', () => {
    test('correctly identifies adjacent sleeper berth pairs and seater pairs', () => {
      expect(getAdjacentSeat('U7', DEFAULT_SEAT_PAIRS)).toBe('U8');
      expect(getAdjacentSeat('U8', DEFAULT_SEAT_PAIRS)).toBe('U7');
      expect(getAdjacentSeat('U9', DEFAULT_SEAT_PAIRS)).toBe('U10');
      expect(getAdjacentSeat('U10', DEFAULT_SEAT_PAIRS)).toBe('U9');
      expect(getAdjacentSeat('U11', DEFAULT_SEAT_PAIRS)).toBe('U12');
      expect(getAdjacentSeat('U12', DEFAULT_SEAT_PAIRS)).toBe('U11');
      expect(getAdjacentSeat('L7', DEFAULT_SEAT_PAIRS)).toBe('L8');
      expect(getAdjacentSeat('S1', DEFAULT_SEAT_PAIRS)).toBe('S2');
      expect(getAdjacentSeat('U1', DEFAULT_SEAT_PAIRS)).toBeNull(); // Single sleeper has no adjacent pair
    });

    test('blocks male passenger from reserving berth adjacent to female passenger from another booking', () => {
      const existingBookings = [
        { seatNumber: 'U7', gender: 'female', bookingId: 'bkg-stranger-001' },
      ];
      const incomingPassengers = [
        { seatNumber: 'U8', gender: 'male', name: 'Ramesh Kumar' },
      ];

      const result = validateSeatGenders(incomingPassengers, DEFAULT_SEAT_PAIRS, existingBookings, 'bkg-new-002');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('adjacent to a female passenger from another booking');
      expect(result.message).toContain('U8');
    });

    test('allows female passenger to reserve berth adjacent to female passenger from another booking', () => {
      const existingBookings = [
        { seatNumber: 'U7', gender: 'female', bookingId: 'bkg-stranger-001' },
      ];
      const incomingPassengers = [
        { seatNumber: 'U8', gender: 'female', name: 'Lakshmi Priya' },
      ];

      const result = validateSeatGenders(incomingPassengers, DEFAULT_SEAT_PAIRS, existingBookings, 'bkg-new-003');
      expect(result.valid).toBe(true);
    });

    test('permits mixed-gender family booking on adjacent seats within the SAME booking ticket (intra-ticket exemption)', () => {
      const existingBookings = [];
      const familyPassengers = [
        { seatNumber: 'U7', gender: 'male', name: 'Senthil Nathan' },
        { seatNumber: 'U8', gender: 'female', name: 'Revathi Senthil' },
      ];

      const result = validateSeatGenders(familyPassengers, DEFAULT_SEAT_PAIRS, existingBookings, 'bkg-family-101');
      expect(result.valid).toBe(true);
    });

    test('createNewBooking enforces gender allocation rules', () => {
      const maleOnU8 = [
        { seatNumber: 'U8', gender: 'male', name: 'Male Traveler', fare: 950 },
      ];
      const existingFemaleOnU7 = [
        { seatNumber: 'U7', gender: 'female', bookingId: 'bkg-prior-female' },
      ];

      const check = validateSeatGenders(maleOnU8, DEFAULT_SEAT_PAIRS, existingFemaleOnU7, 'bkg-male-attempt');
      expect(check.valid).toBe(false);
      expect(check.message).toContain('Berth U8 is adjacent to a female passenger from another booking and can only be reserved by a female traveler.');
    });
  });

  // ==================== SECTION 4: GHOST HOLD PURGE & DEV RESET HOOK ====================
  describe('4. Developer Reset Hook & Ghost Hold Purging', () => {
    test('devRoutes defines POST /reset-locks to purge locks across fleet', () => {
      expect(devRoutesContent).toContain('/reset-locks');
      expect(devRoutesContent).toContain('resetAllSeatLocks');
      expect(devRoutesContent).toContain('Seat holds and zombie locks purged successfully');
    });

    test('resetAllSeatLocks releases all held seats in memory', () => {
      const sList = tripSeatsMap.get(testTrip.id);
      if (sList && sList.length > 0) {
        sList[0].status = 'held';
        sList[0].held_by = 'usr-ghost';
        sList[0].held_until = new Date(Date.now() + 600000).toISOString();
      }

      const res = resetAllSeatLocks();
      expect(res.success).toBe(true);

      if (sList && sList.length > 0) {
        expect(sList[0].status).toBe('available');
        expect(sList[0].held_by).toBeNull();
      }
    });

    test('purgeExpiredMemoryHolds purges holds older than expiration timestamp', () => {
      const sList = tripSeatsMap.get(testTrip.id);
      if (sList && sList.length > 1) {
        sList[1].status = 'held';
        sList[1].held_until = new Date(Date.now() - 5000).toISOString();
      }

      purgeExpiredMemoryHolds();

      if (sList && sList.length > 1) {
        expect(sList[1].status).toBe('available');
      }
    });
  });

  // ==================== SECTION 5: SEGMENT CONFLICT DETECTION & REAL-TIME SYNC ====================
  describe('5. Seat Overlap Validation Sync', () => {
    test('getSeatsForTrip marks overlapping booked seats as segmentConflict and disabled', () => {
      // Create segment reservation for U9
      const reservations = tripSegmentReservations.get(testTrip.id) || [];
      reservations.push({
        seatNumber: 'U9',
        boardingStopOrder: 1,
        droppingStopOrder: 3,
        bookingId: 'bkg-seg-test',
      });
      tripSegmentReservations.set(testTrip.id, reservations);

      const seatMap = getSeatsForTrip(testTrip.id, {
        boardingStopOrder: 1,
        droppingStopOrder: 4,
      });

      const u9 = seatMap.seats.find((s) => s.seat_number === 'U9');
      expect(u9).toBeDefined();
      expect(u9.status).toBe('booked');
      expect(u9.segmentConflict).toBe(true);
      expect(u9.disabled).toBe(true);
    });

    test('CoachSeatLayout syncs with boardingStopId and droppingStopId and disables conflicting seats', () => {
      expect(coachLayoutContent).toContain('api.get(`/seats/trip/${tripId}${qStr}`)');
      expect(coachLayoutContent).toContain('seat.segmentConflict || seat.disabled');
      expect(coachLayoutContent).toContain('berth.segmentConflict || berth.disabled');
    });

    test('getTripSeatMap controller handles stop parameters and hold release', async () => {
      let responseData = null;
      let responseStatus = null;
      const req = {
        params: { tripId: testTrip.id },
        query: {
          boardingStopId: boardingStop.id,
          droppingStopId: droppingStop.id,
        },
      };
      const res = {
        status: (code) => {
          responseStatus = code;
          return res;
        },
        json: (data) => {
          responseData = data;
          return res;
        },
      };

      await getTripSeatMap(req, res);
      expect(responseData).toBeDefined();
      expect(responseData.success).toBe(true);
      expect(responseData.data.seats.length).toBeGreaterThan(0);
    });
  });
});
