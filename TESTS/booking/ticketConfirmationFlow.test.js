import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getBookingByPnr,
  bookings,
  trips,
  travels,
  buses,
} from '../../BACKEND/src/services/dataStore.js';

import {
  getBookingByPNR,
} from '../../BACKEND/src/controllers/bookingController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to simulate Express req/res
function mockReqRes({ params = {}, query = {}, body = {} } = {}) {
  const req = {
    params,
    query,
    body,
    ip: '127.0.0.1',
    get: (header) => (header === 'user-agent' ? 'Jest-Ticket-Test' : null),
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

describe('SMART ROUTE — E-Ticket View & Dynamic Operator Binding Specifications', () => {
  const bookingSuccessPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/BookingSuccess.jsx');
  const ticketConfirmationPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TicketConfirmation.jsx');
  const ticketViewPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TicketView.jsx');
  const navbarPath = path.resolve(__dirname, '../../FRONTEND/src/components/common/Navbar.jsx');
  const stylesPath = path.resolve(__dirname, '../../FRONTEND/src/styles/index.css');

  const bookingSuccessContent = fs.readFileSync(bookingSuccessPath, 'utf8');
  const ticketConfirmationContent = fs.readFileSync(ticketConfirmationPath, 'utf8');
  const ticketViewContent = fs.readFileSync(ticketViewPath, 'utf8');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  const stylesContent = fs.readFileSync(stylesPath, 'utf8');

  // ==================== REQUIREMENT 1: REMOVE TOP UTILITY & APP STORE STRIP ====================
  test('Navbar conditionally unmounts top utility bar on ticket confirmation / e-ticket pages', () => {
    // Must check for ticket paths
    expect(navbarContent).toContain('isTicketPage');
    expect(navbarContent).toContain('/booking-success');
    expect(navbarContent).toContain('/ticket');
    // Top utility bar must be guarded by !isTicketPage
    expect(navbarContent).toContain('!isTicketPage &&');
    expect(navbarContent).toContain('top-utility-contact-bar');
    expect(navbarContent).toContain('print:hidden');
  });

  test('Styles include commercial print @media print rules completely hiding utility bar, headers, and navbars', () => {
    expect(stylesContent).toContain('@media print');
    expect(stylesContent).toContain('.top-utility-contact-bar');
    expect(stylesContent).toContain('.top-utility-bar');
    expect(stylesContent).toContain('.top-utility-strip');
    expect(stylesContent).toContain('display: none !important');
  });

  test('Ticket page components and action buttons include print-hidden classes', () => {
    expect(bookingSuccessContent).toContain('print-hidden');
    expect(bookingSuccessContent).toContain('ticket-actions-bar');
  });

  // ==================== REQUIREMENT 2: DYNAMIC OPERATOR & BUS DETAILS ====================
  test('Ticket Confirmation component extracts dynamic operatorName, busRegistration, and serviceNumber', () => {
    // Dynamic Operator Name extraction
    expect(bookingSuccessContent).toContain('operatorName');
    expect(bookingSuccessContent).toContain('booking?.operatorName');
    expect(bookingSuccessContent).toContain('booking?.travel_name');

    // Dynamic Bus Registration extraction
    expect(bookingSuccessContent).toContain('busRegistration');
    expect(bookingSuccessContent).toContain('booking?.busNumber');
    expect(bookingSuccessContent).toContain('booking?.bus_number');

    // Dynamic Service Number extraction
    expect(bookingSuccessContent).toContain('serviceNumber');
    expect(bookingSuccessContent).toContain('booking?.serviceNumber');
    expect(bookingSuccessContent).toContain('booking?.trip_number');

    // Does not hardcode Horizon Travels as the sole static operator
    expect(bookingSuccessContent).not.toContain("travel_name || 'Horizon Travels'");
    expect(bookingSuccessContent).not.toContain("operatorName || 'Horizon Travels'");
  });

  test('Ticket Confirmation & TicketView files exist and re-export the dynamic ticket component', () => {
    expect(ticketConfirmationContent).toContain('BookingSuccess');
    expect(ticketViewContent).toContain('BookingSuccess');
  });

  test('Backend API GET /api/bookings/pnr/:pnr returns dynamic operator and bus metadata instead of hardcoded Horizon Travels', async () => {
    // Primary Seeded booking SR4102 belongs to SMART ROUTE Travels (travel_id: smartRouteTravelId)
    const { req, res } = mockReqRes({ params: { pnr: 'SR4102' } });
    await getBookingByPNR(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.booking).toBeDefined();

    // Verify it returns dynamic travel_name / operatorName matching the booking's travel operator
    expect(res.jsonData.booking.travel_name).toBe('SMART ROUTE Travels');
    expect(res.jsonData.booking.operatorName).toBe('SMART ROUTE Travels');
    expect(res.jsonData.booking.busNumber).toBe('TN-38-SR-0001');
    expect(res.jsonData.booking.pnr_number).toBe('SR4102');
    expect(res.jsonData.booking.travel_name).not.toBe('Horizon Travels');
  });

  // ==================== REQUIREMENT 3: JOURNEY / TRAVEL DATE ====================
  test('Ticket Confirmation component extracts, formats, and displays Journey Date alongside departure timings', () => {
    // Dynamic journey date extraction with fallbacks
    expect(bookingSuccessContent).toContain('rawTravelDate');
    expect(bookingSuccessContent).toContain('booking?.travelDate');
    expect(bookingSuccessContent).toContain('booking?.journey_date');
    expect(bookingSuccessContent).toContain('booking?.travel_date');
    expect(bookingSuccessContent).toContain('booking?.departure_date');

    // Date formatting function
    expect(bookingSuccessContent).toContain('formatTravelDate');
    expect(bookingSuccessContent).toContain('displayJourneyDate');
    expect(bookingSuccessContent).toContain('JOURNEY DATE');
    expect(bookingSuccessContent).toContain('data-testid="ticket-journey-date"');
  });

  test('Backend API GET /api/bookings/pnr/:pnr returns journey_date and travelDate', async () => {
    const { req, res } = mockReqRes({ params: { pnr: 'SR4102' } });
    await getBookingByPNR(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.booking.travelDate).toBeDefined();
    expect(res.jsonData.booking.journeyDate).toBeDefined();
    expect(res.jsonData.booking.departure_date).toBeDefined();
  });
});
