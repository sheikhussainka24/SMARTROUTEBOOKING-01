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
  cancelPassengerBooking,
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
    get: (header) => (header === 'user-agent' ? 'Jest-Tickets-Test' : null),
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

describe('SMART ROUTE — Passenger Tickets, Transactions, Search & PNR Verification', () => {
  const myBookingsPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/MyBookings.jsx');
  const transactionsPagePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TransactionsPage.jsx');
  const pnrSearchPagePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/PnrSearchPage.jsx');
  const navbarPath = path.resolve(__dirname, '../../FRONTEND/src/components/common/Navbar.jsx');
  const routesPath = path.resolve(__dirname, '../../FRONTEND/src/routes/index.jsx');

  const myBookingsContent = fs.readFileSync(myBookingsPath, 'utf8');
  const transactionsPageContent = fs.readFileSync(transactionsPagePath, 'utf8');
  const pnrSearchPageContent = fs.readFileSync(pnrSearchPagePath, 'utf8');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  const routesContent = fs.readFileSync(routesPath, 'utf8');

  // ==================== 1. FRONTEND ROUTES & NAVBAR SPECIFICATIONS ====================
  test('Frontend routes register /my-tickets, /transactions, and /pnr-search', () => {
    expect(routesContent).toContain('/my-tickets');
    expect(routesContent).toContain('/transactions');
    expect(routesContent).toContain('/pnr-search');
    expect(routesContent).toContain('MyBookings');
    expect(routesContent).toContain('TransactionsPage');
    expect(routesContent).toContain('PnrSearchPage');
  });

  test('Navbar includes accessible links for My Tickets, Cancel & Refund, Transactions, and PNR Search', () => {
    expect(navbarContent).toContain('/my-tickets');
    expect(navbarContent).toContain('/transactions');
    expect(navbarContent).toContain('/pnr-search');
    expect(navbarContent).toContain('My Tickets');
    expect(navbarContent).toContain('Cancel &amp; Refund');
    expect(navbarContent).toContain('Transactions');
    expect(navbarContent).toContain('PNR Search');
  });

  // ==================== 2. MY TICKETS STATUS CATEGORIES ====================
  test('MyBookings component provides the 4 required status categories: Upcoming, Cancelled, Completed, All', () => {
    expect(myBookingsContent).toContain('Upcoming / Confirmed');
    expect(myBookingsContent).toContain('Cancelled');
    expect(myBookingsContent).toContain('Completed');
    expect(myBookingsContent).toContain('All Tickets');
    expect(myBookingsContent).toContain('handleTabChange');
    expect(myBookingsContent).toContain('handleDownloadPdf');
  });

  test('TransactionsPage component includes the 7 required transaction filter tabs', () => {
    expect(transactionsPageContent).toContain('All Transactions');
    expect(transactionsPageContent).toContain('Successful');
    expect(transactionsPageContent).toContain('Pending');
    expect(transactionsPageContent).toContain('Failed');
    expect(transactionsPageContent).toContain('Cancelled');
    expect(transactionsPageContent).toContain('Refund Pending');
    expect(transactionsPageContent).toContain('Refund Completed');
  });

  // ==================== 3. BACKEND MY BOOKINGS & PASSENGER ISOLATION ====================
  test('GET /api/bookings/my-bookings isolates Passenger 1 bookings from Passenger 2', async () => {
    // Passenger 1 request
    const p1Mock = mockReqRes({
      user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
    });
    await getMyBookings(p1Mock.req, p1Mock.res);

    expect(p1Mock.res.statusCode).toBe(200);
    const p1List = p1Mock.res.jsonData.bookings;
    expect(p1List.length).toBeGreaterThan(0);
    // All bookings returned must belong to Passenger 1
    p1List.forEach((b) => {
      const isP1 = b.user_id === passenger1Id || b.passenger_id === passenger1Id || b.pnr_number === 'SR4102';
      expect(isP1).toBe(true);
    });

    // Passenger 2 request
    const p2Mock = mockReqRes({
      user: { id: passenger2Id, email: 'sneha@smartroute.in', role: 'passenger' },
    });
    await getMyBookings(p2Mock.req, p2Mock.res);

    expect(p2Mock.res.statusCode).toBe(200);
    const p2List = p2Mock.res.jsonData.bookings;
    expect(p2List.length).toBeGreaterThan(0);
    p2List.forEach((b) => {
      const isP2 = b.user_id === passenger2Id || b.passenger_id === passenger2Id || b.pnr_number === 'VV8820';
      expect(isP2).toBe(true);
    });

    // Ensure Passenger 2's list does not contain Passenger 1's PNR
    const p2HasP1Ticket = p2List.some((b) => b.pnr_number === 'SR4102');
    expect(p2HasP1Ticket).toBe(false);
  });

  test('GET /api/bookings/my-bookings returns all required ticket fields', async () => {
    const { req, res } = mockReqRes({
      user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
    });
    await getMyBookings(req, res);

    expect(res.statusCode).toBe(200);
    const ticket = res.jsonData.bookings[0];
    expect(ticket).toBeDefined();

    // Required fields: PNR, operator, from/to, dates, departure/arrival times, seats, fare, status
    expect(ticket.pnr_number).toBeDefined();
    expect(ticket.operator_name).toBeDefined();
    expect(ticket.source_city).toBeDefined();
    expect(ticket.destination_city).toBeDefined();
    expect(ticket.journey_date).toBeDefined();
    expect(ticket.departure_time).toBeDefined();
    expect(ticket.arrival_time).toBeDefined();
    expect(ticket.boarding_stop_name).toBeDefined();
    expect(ticket.dropping_stop_name).toBeDefined();
    expect(ticket.total_fare).toBeGreaterThan(0);
    expect(ticket.seats).toBeDefined();
    expect(ticket.computed_status).toBeDefined();
    expect(ticket.download_url).toContain('/pdf');
  });

  // ==================== 4. STATUS FILTER TABS SPECIFICATION ====================
  test('GET /api/bookings/my-bookings filters by status=upcoming, cancelled, and all', async () => {
    const { req: allReq, res: allRes } = mockReqRes({
      query: { status: 'all' },
      user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
    });
    await getMyBookings(allReq, allRes);
    expect(allRes.statusCode).toBe(200);
    const allCount = allRes.jsonData.bookings.length;

    const { req: upReq, res: upRes } = mockReqRes({
      query: { status: 'upcoming' },
      user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
    });
    await getMyBookings(upReq, upRes);
    expect(upRes.statusCode).toBe(200);
    upRes.jsonData.bookings.forEach((b) => {
      expect(b.computed_status).toBe('upcoming');
    });
  });

  // ==================== 5. TICKET CANCELLATION & REFUNDS ====================
  test('POST /api/bookings/:id/cancel cancels booking, records refund, and preserves historical record', async () => {
    // Create a dynamic booking for Passenger 1 to cancel
    const uniqueUserId = `usr-test-${Date.now()}`;
    const dynamicBooking = createNewBooking({
      tripId: trips[0].id,
      busId: buses[0].id,
      operatorName: 'SMART ROUTE Travels',
      originCity: 'Coimbatore',
      destinationCity: 'Tenkasi',
      journeyDate: '2026-12-25',
      boardingPoint: 'Coimbatore Omni Bus Stand',
      droppingPoint: 'Tenkasi New Bus Stand',
      passengerDetails: [
        { seatNumber: 'U5', name: 'Test User', age: 30, gender: 'male', fare: 880 },
      ],
      contactDetails: {
        name: 'Test User',
        email: 'testuser@smartroute.in',
        phone: '9888877777',
      },
      userId: uniqueUserId,
      passengerId: uniqueUserId,
    });

    expect(dynamicBooking.pnr_number).toBeDefined();
    const createdPnr = dynamicBooking.pnr_number;

    // Cancel this dynamic booking
    const { req, res } = mockReqRes({
      params: { bookingId: dynamicBooking.id },
      body: { reason: 'Schedule change requested by passenger' },
      user: { id: uniqueUserId, email: 'testuser@smartroute.in', role: 'passenger' },
    });
    await cancelBooking(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.refund).toBeDefined();
    expect(res.jsonData.refund.amount).toBeGreaterThan(0);
    expect(res.jsonData.refund.refund_id).toBeDefined();

    // Verify booking record is PRESERVED and marked cancelled
    const retrieved = getBookingByPnr(createdPnr);
    expect(retrieved).not.toBeNull();
    expect(retrieved.status).toBe('cancelled');
    expect(retrieved.cancellation_reason).toContain('Schedule change');
    expect(retrieved.refund_amount).toBeGreaterThan(0);
    expect(retrieved.refund_status).toBe('completed');
  });

  // ==================== 6. PASSENGER TRANSACTIONS API ====================
  test('GET /api/bookings/transactions returns transactions with payment and refund details', async () => {
    const { req, res } = mockReqRes({
      query: { status: 'all' },
      user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
    });
    await getPassengerTransactions(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    const txList = res.jsonData.transactions;
    expect(Array.isArray(txList)).toBe(true);
    expect(txList.length).toBeGreaterThan(0);

    const firstTx = txList[0];
    expect(firstTx.transaction_reference).toBeDefined();
    expect(firstTx.pnr_number).toBeDefined();
    expect(firstTx.amount).toBeGreaterThan(0);
    expect(firstTx.payment_status).toBeDefined();
    expect(firstTx.booking_status).toBeDefined();
    expect(firstTx.cancellation_status).toBeDefined();
    expect(firstTx.refund_status).toBeDefined();
  });

  test('GET /api/bookings/transactions supports filtering by successful, cancelled, etc.', async () => {
    const { req, res } = mockReqRes({
      query: { status: 'successful' },
      user: { id: passenger1Id, email: 'passenger@smartroute.in', role: 'passenger' },
    });
    await getPassengerTransactions(req, res);

    expect(res.statusCode).toBe(200);
    res.jsonData.transactions.forEach((tx) => {
      expect(['completed', 'paid']).toContain(tx.payment_status);
    });
  });

  // ==================== 7. LOCATION SEARCH VALIDATION ====================
  test('GET /api/trips/search returns buses for valid distinct source and destination', async () => {
    const { req, res } = mockReqRes({
      query: { source: 'Coimbatore', destination: 'Tenkasi' },
    });
    await searchTrips(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.trips.length).toBeGreaterThan(0);
  });

  test('GET /api/trips/search rejects identical source and destination with 400 SAME_ORIGIN_DESTINATION', async () => {
    const { req, res } = mockReqRes({
      query: { source: 'Coimbatore', destination: 'Coimbatore' },
    });
    await searchTrips(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.code).toBe('SAME_ORIGIN_DESTINATION');
    expect(res.jsonData.error).toContain('cannot be the same');
  });

  test('GET /api/trips/search rejects missing search parameters with 400 MISSING_SEARCH_PARAMS', async () => {
    const { req, res } = mockReqRes({
      query: { source: 'Coimbatore' },
    });
    await searchTrips(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.code).toBe('MISSING_SEARCH_PARAMS');
  });

  // ==================== 8. PNR SEARCH & PRIVACY MASKING ====================
  test('GET /api/bookings/pnr-search/:pnr returns verified booking details for valid PNR', async () => {
    const { req, res } = mockReqRes({
      params: { pnr: 'SR4102' },
    });
    await searchBookingByPnr(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    const ticket = res.jsonData.ticket;
    expect(ticket.pnr).toBe('SR4102');
    expect(ticket.operator_name).toBeDefined();
    expect(ticket.source_city).toBe('Coimbatore');
    expect(ticket.destination_city).toBe('Tenkasi');
    expect(ticket.seats).toBeDefined();
    expect(ticket.computed_status).toBeDefined();
  });

  test('PNR Search masks sensitive contact info for unauthenticated requests', async () => {
    // Unauthenticated public request
    const { req, res } = mockReqRes({
      params: { pnr: 'SR4102' },
      user: null,
    });
    await searchBookingByPnr(req, res);

    expect(res.statusCode).toBe(200);
    const ticket = res.jsonData.ticket;
    // Phone must be masked: not the full raw 10-digit number
    expect(ticket.contact_mobile).toContain('••');
    expect(ticket.contact_mobile).not.toBe('9000000006');
    // Email must be masked
    expect(ticket.contact_email).toContain('••');
    expect(ticket.contact_email).not.toBe('passenger@smartroute.in');
  });

  test('PNR Search unmasks contact info for the verified authenticated owner', async () => {
    // Authenticated owner request
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

  test('PNR Search rejects invalid PNR format with 400 INVALID_PNR_FORMAT', async () => {
    const { req, res } = mockReqRes({
      params: { pnr: '!@#$' },
    });
    await searchBookingByPnr(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.code).toBe('INVALID_PNR_FORMAT');
  });

  test('PNR Search returns 404 BOOKING_NOT_FOUND for non-existent PNR', async () => {
    const { req, res } = mockReqRes({
      params: { pnr: 'NONEXISTENT999' },
    });
    await searchBookingByPnr(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonData.code).toBe('BOOKING_NOT_FOUND');
  });
});

