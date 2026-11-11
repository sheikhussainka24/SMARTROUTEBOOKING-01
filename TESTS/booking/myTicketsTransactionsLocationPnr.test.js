import { describe, test, expect, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  createNewBooking,
  getBookingByPnr,
  bookings,
  trips,
  travels,
  buses,
  payments,
  refunds,
  tripSegmentReservations,
  tripSeatsMap,
  passenger1Id,
  passenger2Id,
} from '../../BACKEND/src/services/dataStore.js';

import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getPassengerTransactions,
  searchBookingByPnr,
  getBookingByPNR,
} from '../../BACKEND/src/controllers/bookingController.js';

import { searchTrips } from '../../BACKEND/src/controllers/tripController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mockReqRes({ params = {}, query = {}, body = {}, user = null } = {}) {
  const req = {
    params,
    query,
    body,
    user,
    ip: '127.0.0.1',
    get: (header) => (header === 'user-agent' ? 'Jest-EndToEnd-Test' : null),
  };

  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };

  return { req, res };
}

describe('SMART ROUTE — Complete My Tickets, Transactions, Location & PNR Search Verification', () => {
  const myBookingsPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/MyBookings.jsx');
  const transactionsPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TransactionsPage.jsx');
  const pnrSearchPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/PnrSearchPage.jsx');
  const landingPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/LandingPage.jsx');
  const searchTripsPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/SearchTrips.jsx');

  const myBookingsContent = fs.readFileSync(myBookingsPath, 'utf8');
  const transactionsContent = fs.readFileSync(transactionsPath, 'utf8');
  const pnrSearchContent = fs.readFileSync(pnrSearchPath, 'utf8');
  const landingContent = fs.readFileSync(landingPath, 'utf8');
  const searchTripsContent = fs.readFileSync(searchTripsPath, 'utf8');

  // ==================== SECTION 1: MY TICKETS — SAVE SUCCESSFUL BOOKINGS ====================
  describe('1. My Tickets — Save Every Successful Booking', () => {
    test('Successful booking via POST /api/bookings is saved and visible in My Tickets', async () => {
      const passengerId = `usr-pax-${Date.now()}`;
      const passengerEmail = `pax_${Date.now()}@smartroute.in`;
      const user = { id: passengerId, email: passengerEmail, role: 'passenger' };

      const bookingPayload = {
        busId: buses[0].id,
        tripId: trips[0].id,
        operatorName: 'SMART ROUTE Travels',
        serviceNumber: 'SR-101',
        busNumber: buses[0].registration_number,
        departureTime: '21:30',
        arrivalTime: '05:30',
        originCity: 'Coimbatore',
        destinationCity: 'Tenkasi',
        journeyDate: '2026-12-15',
        boardingPoint: 'Coimbatore Omni Bus Stand',
        droppingPoint: 'Tenkasi New Bus Stand',
        passengers: [
          { name: 'Karthik Raja', age: 29, gender: 'male', seatNumber: 'L8', fare: 880 },
        ],
        contactMobile: '9876543210',
        contactEmail: passengerEmail,
        paymentMethod: 'upi',
      };

      // 1. Create booking
      const { req: createReq, res: createRes } = mockReqRes({
        body: bookingPayload,
        user,
      });
      await createBooking(createReq, createRes);

      expect(createRes.statusCode).toBe(201);
      expect(createRes.jsonData.success).toBe(true);
      const bookedPnr = createRes.jsonData.booking.pnr_number;
      expect(bookedPnr).toBeDefined();

      // 2. Fetch My Tickets for this passenger
      const { req: getReq, res: getRes } = mockReqRes({
        user,
      });
      await getMyBookings(getReq, getRes);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.jsonData.success).toBe(true);
      const list = getRes.jsonData.bookings;
      expect(list.length).toBeGreaterThan(0);

      const foundTicket = list.find((t) => t.pnr_number === bookedPnr);
      expect(foundTicket).toBeDefined();

      // Verify all required ticket details are present
      expect(foundTicket.pnr_number).toBe(bookedPnr);
      expect(foundTicket.operator_name).toBeDefined();
      expect(foundTicket.source_city).toBe('Coimbatore');
      expect(foundTicket.destination_city).toBe('Tenkasi');
      expect(foundTicket.journey_date).toBe('2026-12-15');
      expect(foundTicket.departure_time).toBe('21:30');
      expect(foundTicket.arrival_time).toBe('05:30');
      expect(foundTicket.seats).toContain('L8');
      expect(foundTicket.boarding_stop_name).toBe('Coimbatore Omni Bus Stand');
      expect(foundTicket.dropping_stop_name).toBe('Tenkasi New Bus Stand');
      expect(foundTicket.total_fare).toBeGreaterThan(0);
      expect(foundTicket.payment_status).toBe('paid');
      expect(foundTicket.download_url).toBe(`/api/bookings/pnr/${bookedPnr}/pdf`);
    });

    test('Booking without required bus details is rejected and not saved', async () => {
      const { req, res } = mockReqRes({
        body: { passengers: [{ name: 'Incomplete' }] },
        user: { id: 'usr-1', email: 'test@smartroute.in', role: 'passenger' },
      });
      await createBooking(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.code).toBe('MISSING_BUS_DETAILS');
    });
  });

  // ==================== SECTION 2: MY TICKETS STATUS CATEGORIES ====================
  describe('2. My Tickets Status Categories & Completion Lifecycle', () => {
    test('Upcoming tab returns only active upcoming bookings', async () => {
      const { req, res } = mockReqRes({
        query: { status: 'upcoming' },
        user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
      });
      await getMyBookings(req, res);

      expect(res.statusCode).toBe(200);
      res.jsonData.bookings.forEach((t) => {
        expect(['upcoming', 'confirmed']).toContain(t.computed_status);
        expect(t.status).not.toBe('cancelled');
      });
    });

    test('Cancelled tickets remain accessible in cancelled history with refund info', async () => {
      const passengerId = `usr-cancel-${Date.now()}`;
      const passengerEmail = `cancel_${Date.now()}@smartroute.in`;
      const user = { id: passengerId, email: passengerEmail, role: 'passenger' };

      // Create a booking
      const newB = createNewBooking({
        tripId: trips[0].id,
        busId: buses[0].id,
        operatorName: 'SMART ROUTE Travels',
        originCity: 'Coimbatore',
        destinationCity: 'Tenkasi',
        journeyDate: '2026-12-28',
        passengerDetails: [{ seatNumber: 'U8', name: 'Cancel User', age: 25, gender: 'male', fare: 850 }],
        contactDetails: { name: 'Cancel User', email: passengerEmail, phone: '9000000001' },
        userId: passengerId,
        passengerId: passengerId,
      });

      // Cancel the booking
      const { req: cancelReq, res: cancelRes } = mockReqRes({
        params: { bookingId: newB.id },
        body: { reason: 'Personal emergency' },
        user,
      });
      await cancelBooking(cancelReq, cancelRes);

      expect(cancelRes.statusCode).toBe(200);
      expect(cancelRes.jsonData.success).toBe(true);

      // Query My Tickets with status=cancelled
      const { req: queryReq, res: queryRes } = mockReqRes({
        query: { status: 'cancelled' },
        user,
      });
      await getMyBookings(queryReq, queryRes);

      expect(queryRes.statusCode).toBe(200);
      const cancelledList = queryRes.jsonData.bookings;
      const found = cancelledList.find((b) => b.pnr_number === newB.pnr_number);
      expect(found).toBeDefined();
      expect(found.computed_status).toBe('cancelled');
      expect(found.cancellation_fee).toBeGreaterThan(0);
      expect(found.refund_amount).toBeGreaterThan(0);
      expect(found.refund_status).toBe('completed');
      expect(found.refund_reference).toBeDefined();
    });

    test('Cancelled tickets are NEVER marked completed', async () => {
      const passengerId = `usr-never-complete-${Date.now()}`;
      const user = { id: passengerId, email: 'never@smartroute.in', role: 'passenger' };

      // Create an old/past journey date booking that was cancelled
      const pastCancelled = createNewBooking({
        tripId: trips[0].id,
        busId: buses[0].id,
        operatorName: 'SMART ROUTE Travels',
        originCity: 'Coimbatore',
        destinationCity: 'Tenkasi',
        journeyDate: '2024-01-01', // past date
        passengerDetails: [{ seatNumber: 'U9', name: 'Past User', age: 25, gender: 'male', fare: 850 }],
        contactDetails: { name: 'Past User', email: 'never@smartroute.in', phone: '9000000002' },
        userId: passengerId,
        passengerId: passengerId,
      });

      // Cancel it
      const { req: cancelReq, res: cancelRes } = mockReqRes({
        params: { bookingId: pastCancelled.id },
        body: { reason: 'Cancelled long ago' },
        user,
      });
      await cancelBooking(cancelReq, cancelRes);

      // Query My Tickets
      const { req: getReq, res: getRes } = mockReqRes({
        query: { status: 'all' },
        user,
      });
      await getMyBookings(getReq, getRes);

      const ticket = getRes.jsonData.bookings.find((b) => b.pnr_number === pastCancelled.pnr_number);
      expect(ticket).toBeDefined();
      // Even though journey_date is in the past, cancelled tickets must remain cancelled
      expect(ticket.computed_status).toBe('cancelled');
      expect(ticket.computed_status).not.toBe('completed');
    });

    test('Seat overlap and double-booking is prevented with SEGMENT_CONFLICT', () => {
      const tripId = trips[0].id;
      const uniquePax = `usr-conflict-${Date.now()}`;
      const tSeats = tripSeatsMap.get(tripId) || [];
      const testSeat = tSeats.find((s) => s.status === 'available')?.seat_number || 'U15';

      // Reserve available seat for stop 1 to 3
      createNewBooking({
        tripId,
        busId: buses[0].id,
        operatorName: 'SMART ROUTE Travels',
        originCity: 'Coimbatore',
        destinationCity: 'Tenkasi',
        journeyDate: '2026-11-20',
        boardingPoint: 'Coimbatore Omni Bus Stand',
        droppingPoint: 'Tenkasi New Bus Stand',
        boardingStopId: 'rs-cbe-01',
        droppingStopId: 'rs-ten-06',
        passengerDetails: [{ seatNumber: testSeat, name: 'User 1', age: 30, gender: 'male', fare: 850 }],
        contactDetails: { name: 'User 1', email: 'u1@smartroute.in', phone: '9111111111' },
        userId: uniquePax,
        passengerId: uniquePax,
      });

      // Try booking the exact same seat on overlapping segment
      expect(() => {
        createNewBooking({
          tripId,
          busId: buses[0].id,
          operatorName: 'SMART ROUTE Travels',
          originCity: 'Coimbatore',
          destinationCity: 'Tenkasi',
          journeyDate: '2026-11-20',
          boardingPoint: 'Coimbatore Omni Bus Stand',
          droppingPoint: 'Tenkasi New Bus Stand',
          boardingStopId: 'rs-cbe-01',
          droppingStopId: 'rs-ten-06',
          passengerDetails: [{ seatNumber: testSeat, name: 'User 2', age: 28, gender: 'male', fare: 850 }],
          contactDetails: { name: 'User 2', email: 'u2@smartroute.in', phone: '9222222222' },
          userId: `usr-conflict-2-${Date.now()}`,
          passengerId: `usr-conflict-2-${Date.now()}`,
        });
      }).toThrow(/already (reserved|booked)/i);
    });
  });

  // ==================== SECTION 3: TRANSACTIONS HISTORY ====================
  describe('3. Complete Transactions History with Distinguishable Fields', () => {
    test('GET /api/bookings/transactions provides distinguishable booking, payment, cancellation, and refund fields', async () => {
      const { req, res } = mockReqRes({
        query: { status: 'all' },
        user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
      });
      await getPassengerTransactions(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      const txList = res.jsonData.transactions;
      expect(txList.length).toBeGreaterThan(0);

      const sample = txList[0];
      // Separate distinguishable fields
      expect(sample.booking_status).toBeDefined();
      expect(sample.payment_status).toBeDefined();
      expect(sample.cancellation_status).toBeDefined();
      expect(sample.refund_status).toBeDefined();
      expect(sample.amount).toBeGreaterThan(0);
      expect(sample.payment_method).toBeDefined();
      expect(sample.transaction_reference).toBeDefined();
      expect(sample.pnr_number).toBeDefined();
      expect(sample.operator_name).toBeDefined();
    });

    test('Transactions status filters work correctly for successful and cancelled', async () => {
      // 1. Successful filter
      const { req: sReq, res: sRes } = mockReqRes({
        query: { status: 'successful' },
        user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
      });
      await getPassengerTransactions(sReq, sRes);
      expect(sRes.statusCode).toBe(200);
      sRes.jsonData.transactions.forEach((tx) => {
        expect(['completed', 'paid']).toContain(tx.payment_status);
      });

      // 2. Cancelled filter
      const { req: cReq, res: cRes } = mockReqRes({
        query: { status: 'cancelled' },
        user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
      });
      await getPassengerTransactions(cReq, cRes);
      expect(cRes.statusCode).toBe(200);
      cRes.jsonData.transactions.forEach((tx) => {
        expect(tx.cancellation_status).toBe('cancelled');
      });
    });
  });

  // ==================== SECTION 4: DATABASE & BACKEND INTEGRATION ====================
  describe('4. Database & Backend Security & Ownership Checks', () => {
    test('Passenger cannot access tickets belonging to another user', async () => {
      // Passenger 1 accesses My Tickets
      const { req: p1Req, res: p1Res } = mockReqRes({
        user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
      });
      await getMyBookings(p1Req, p1Res);
      const p1Pnrs = p1Res.jsonData.bookings.map((b) => b.pnr_number);

      // Passenger 2 accesses My Tickets
      const { req: p2Req, res: p2Res } = mockReqRes({
        user: { id: passenger2Id, email: 'sneha@smartroute.in', role: 'passenger' },
      });
      await getMyBookings(p2Req, p2Res);
      const p2Pnrs = p2Res.jsonData.bookings.map((b) => b.pnr_number);

      // Ensure no intersection between p1Pnrs and p2Pnrs
      const crossLeak = p1Pnrs.some((pnr) => p2Pnrs.includes(pnr));
      expect(crossLeak).toBe(false);
    });

    test('Unauthorized passenger cannot cancel another passenger booking', async () => {
      // Find a booking belonging to Passenger 1
      const p1Booking = bookings.find((b) => b.user_id === passenger1Id && b.status !== 'cancelled');
      expect(p1Booking).toBeDefined();

      // Passenger 2 tries to cancel Passenger 1's booking
      const { req, res } = mockReqRes({
        params: { bookingId: p1Booking.id },
        body: { reason: 'Malicious attempt' },
        user: { id: passenger2Id, email: 'sneha@smartroute.in', role: 'passenger' },
      });

      await cancelBooking(req, res);

      // Must be rejected with 400 or 403
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });
  });

  // ==================== SECTION 5: LOCATION SEARCH ====================
  describe('5. Website Location Search Verification', () => {
    test('Location search rejects identical source and destination with friendly validation', async () => {
      const { req, res } = mockReqRes({
        query: { source: 'Chennai', destination: 'Chennai' },
      });
      await searchTrips(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.code).toBe('SAME_ORIGIN_DESTINATION');
      expect(res.jsonData.error).toContain('cannot be the same city');
    });

    test('Location search rejects missing source or destination', async () => {
      const { req, res } = mockReqRes({
        query: { source: 'Chennai' },
      });
      await searchTrips(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.code).toBe('MISSING_SEARCH_PARAMS');
    });

    test('Valid location search returns real matching buses with schedules, fares, and available seats', async () => {
      const { req, res } = mockReqRes({
        query: { source: 'Coimbatore', destination: 'Tenkasi', date: trips[0]?.departure_date },
      });
      await searchTrips(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      const tripsList = res.jsonData.trips;
      expect(tripsList.length).toBeGreaterThan(0);

      const sampleBus = tripsList[0];
      expect(sampleBus.travelName || sampleBus.busName || sampleBus.operatorName || sampleBus.travel_name).toBeDefined();
      expect(sampleBus.departure_time).toBeDefined();
      expect(sampleBus.arrival_time || sampleBus.estimated_arrival_time).toBeDefined();
      expect(sampleBus.base_fare || sampleBus.fare).toBeGreaterThan(0);
      expect(sampleBus.available_seats || sampleBus.total_available_seats).toBeDefined();
    });

    test('Frontend components include swap button and past date prevention', () => {
      // LandingPage has swap and min date prevention
      expect(landingContent).toContain('handleSwap');
      expect(landingContent).toContain('min={new Date().toISOString().split(\'T\')[0]}');
      // SearchTrips has swap and same-city validation
      expect(searchTripsContent).toContain('handleSwapCities');
      expect(searchTripsContent).toContain('Origin and destination cannot be the same city');
    });
  });

  // ==================== SECTION 6: PNR SEARCH & PRIVACY ====================
  describe('6. Website PNR Search & Privacy Masking', () => {
    test('Public unauthenticated visitor can look up ticket by PNR with masked PII', async () => {
      const { req, res } = mockReqRes({
        params: { pnr: 'SR4102' },
        user: null,
      });
      await searchBookingByPnr(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      const ticket = res.jsonData.ticket;
      expect(ticket.pnr).toBe('SR4102');
      expect(ticket.is_owner).toBe(false);

      // Sensitive fields must be masked
      expect(ticket.contact_mobile).toContain('••');
      expect(ticket.contact_mobile).not.toBe('9000000006');
      expect(ticket.contact_email).toContain('••');
      expect(ticket.contact_email).not.toBe('passenger@smartroute.in');

      // Passenger full name should be masked for privacy
      ticket.passengers.forEach((p) => {
        expect(p.passenger_name).toContain('••');
      });
    });

    test('Authenticated ticket owner gets full unmasked PII in PNR search', async () => {
      const { req, res } = mockReqRes({
        params: { pnr: 'SR4102' },
        user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
      });
      await searchBookingByPnr(req, res);

      expect(res.statusCode).toBe(200);
      const ticket = res.jsonData.ticket;
      expect(ticket.is_owner).toBe(true);
      expect(ticket.contact_mobile).toBe('9000000006');
      expect(ticket.contact_email).toBe('passenger@smartroute.in');
    });

    test('PNR Search rejects invalid alphanumeric syntax with 400 INVALID_PNR_FORMAT', async () => {
      const { req, res } = mockReqRes({
        params: { pnr: 'A!@#$%' },
      });
      await searchBookingByPnr(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.code).toBe('INVALID_PNR_FORMAT');
    });

    test('PNR Search returns clear 404 BOOKING_NOT_FOUND for non-existent PNR', async () => {
      const { req, res } = mockReqRes({
        params: { pnr: 'SR999999' },
      });
      await searchBookingByPnr(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.code).toBe('BOOKING_NOT_FOUND');
      expect(res.jsonData.error).toContain('No booking found with PNR');
    });
  });

  // ==================== SECTION 7: CANCELLATION & SEAT RELEASE ====================
  describe('7. Cancellation & Instant Seat Release', () => {
    test('Cancelling booking releases seats back to available inventory', async () => {
      const tripId = trips[0].id;
      const uniquePax = `usr-release-${Date.now()}`;
      const uniqueSeat = 'L10';

      // 1. Create booking for L10
      const bkg = createNewBooking({
        tripId,
        busId: buses[0].id,
        operatorName: 'SMART ROUTE Travels',
        originCity: 'Coimbatore',
        destinationCity: 'Tenkasi',
        journeyDate: '2026-12-10',
        boardingPoint: 'Coimbatore Omni Bus Stand',
        droppingPoint: 'Tenkasi New Bus Stand',
        passengerDetails: [{ seatNumber: uniqueSeat, name: 'Release User', age: 30, gender: 'male', fare: 880 }],
        contactDetails: { name: 'Release User', email: 'release@smartroute.in', phone: '9777777777' },
        userId: uniquePax,
        passengerId: uniquePax,
      });

      // Verify seat is booked
      const tSeats = tripSeatsMap.get(tripId);
      const seatBeforeCancel = tSeats ? tSeats.find((s) => s.seat_number === uniqueSeat) : null;
      if (seatBeforeCancel) {
        expect(seatBeforeCancel.status).toBe('booked');
      }

      // 2. Cancel the booking
      const { req, res } = mockReqRes({
        params: { bookingId: bkg.id },
        body: { reason: 'Seat release test' },
        user: { id: uniquePax, email: 'release@smartroute.in', role: 'passenger' },
      });
      await cancelBooking(req, res);

      expect(res.statusCode).toBe(200);

      // Verify seat status is released back to available
      if (seatBeforeCancel) {
        expect(seatBeforeCancel.status).toBe('available');
      }

      // Verify another passenger can now book that seat without segment conflict
      const nextPax = `usr-next-${Date.now()}`;
      const rebook = createNewBooking({
        tripId,
        busId: buses[0].id,
        operatorName: 'SMART ROUTE Travels',
        originCity: 'Coimbatore',
        destinationCity: 'Tenkasi',
        journeyDate: '2026-12-10',
        boardingPoint: 'Coimbatore Omni Bus Stand',
        droppingPoint: 'Tenkasi New Bus Stand',
        passengerDetails: [{ seatNumber: uniqueSeat, name: 'New Passenger', age: 26, gender: 'male', fare: 880 }],
        contactDetails: { name: 'New Passenger', email: 'next@smartroute.in', phone: '9666666666' },
        userId: nextPax,
        passengerId: nextPax,
      });

      expect(rebook.pnr_number).toBeDefined();
    });
  });
});
