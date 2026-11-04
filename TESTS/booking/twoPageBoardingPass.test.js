import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getBookingByPNR, downloadBookingTicketPdf } from '../../BACKEND/src/controllers/bookingController.js';
import { generateTicketPdf } from '../../BACKEND/src/services/ticketPdfService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mockReqRes({ params = {}, query = {}, body = {} } = {}) {
  const req = { params, query, body, ip: '127.0.0.1' };
  const headers = {};
  let statusCode = 200;
  let jsonData = null;
  let endedBuffer = null;

  const res = {
    statusCode: 200,
    headers,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    status(code) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    json(data) {
      jsonData = data;
      return this;
    },
    end(data) {
      endedBuffer = data;
      return this;
    },
    get jsonData() {
      return jsonData;
    },
    get endedBuffer() {
      return endedBuffer;
    },
  };
  return { req, res };
}

describe('SMART ROUTE — Single-Page E-Ticket & Download Button Verification', () => {
  const bookingSuccessPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/BookingSuccess.jsx');
  const ticketConfirmationPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TicketConfirmation.jsx');
  const ticketViewPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TicketView.jsx');
  const stylesPath = path.resolve(__dirname, '../../FRONTEND/src/styles/index.css');
  const bookingRoutesPath = path.resolve(__dirname, '../../BACKEND/src/routes/bookingRoutes.js');

  const bookingSuccessContent = fs.readFileSync(bookingSuccessPath, 'utf8');
  const ticketConfirmationContent = fs.readFileSync(ticketConfirmationPath, 'utf8');
  const ticketViewContent = fs.readFileSync(ticketViewPath, 'utf8');
  const stylesContent = fs.readFileSync(stylesPath, 'utf8');
  const bookingRoutesContent = fs.readFileSync(bookingRoutesPath, 'utf8');

  // ==================== SECTION 1: DYNAMIC OPERATOR & JOURNEY RESOLUTION ====================
  describe('1. Dynamic Operator and Journey Metadata Extraction', () => {
    test('TicketConfirmation and TicketView extract dynamic operator, service ID, bus number, departure time, and journey date', () => {
      expect(ticketConfirmationContent).toContain('operatorName');
      expect(ticketConfirmationContent).toContain('serviceNumber');
      expect(ticketConfirmationContent).toContain('busNumber');
      expect(ticketConfirmationContent).toContain('departureTime');
      expect(ticketConfirmationContent).toContain('rawJourneyDate');
      expect(ticketConfirmationContent).toContain('formattedJourneyDate');

      expect(ticketViewContent).toContain('operatorName');
      expect(ticketViewContent).toContain('serviceNumber');
      expect(ticketViewContent).toContain('busNumber');
    });

    test('BookingSuccess contains dynamic operator and bus extraction matching specifications', () => {
      expect(bookingSuccessContent).toContain('operatorName');
      expect(bookingSuccessContent).toContain('booking?.operatorName');
      expect(bookingSuccessContent).toContain('serviceNumber');
      expect(bookingSuccessContent).toContain('booking?.serviceNumber');
      expect(bookingSuccessContent).toContain('busNumber');
      expect(bookingSuccessContent).toContain('booking?.busNumber');
      expect(bookingSuccessContent).toContain('departureTime');
      expect(bookingSuccessContent).toContain('booking?.departureTime');
      expect(bookingSuccessContent).toContain('rawJourneyDate');
      expect(bookingSuccessContent).toContain('formattedJourneyDate');
    });

    test('bookingRoutes supports both /api/bookings/:pnr, /api/bookings/pnr/:pnr, and PDF download routes', () => {
      expect(bookingRoutesContent).toContain("router.get('/pnr/:pnr', getBookingByPNR)");
      expect(bookingRoutesContent).toContain("router.get('/:pnr', getBookingByPNR)");
      expect(bookingRoutesContent).toContain("router.get('/pnr/:pnr/pdf', downloadBookingTicketPdf)");
      expect(bookingRoutesContent).toContain("router.get('/:pnr/pdf', downloadBookingTicketPdf)");
    });

    test('Backend GET /api/bookings/:pnr provides operatorName, busNumber, serviceNumber, and journeyDate', async () => {
      const { req, res } = mockReqRes({ params: { pnr: 'VV8820' } });
      await getBookingByPNR(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      const b = res.jsonData.booking;
      expect(b.operatorName).toBeDefined();
      expect(b.serviceNumber).toBeDefined();
      expect(b.busNumber).toBeDefined();
      expect(b.departureTime).toBeDefined();
      expect(b.journeyDate).toBeDefined();
    });
  });

  // ==================== SECTION 2: SINGLE-PAGE E-TICKET & DOWNLOAD BUTTON ====================
  describe('2. Single-Page E-Ticket Interface & Download Handler', () => {
    test('BookingSuccess displays a single prominent "Download E-Ticket" button', () => {
      expect(bookingSuccessContent).toContain('Download E-Ticket');
      expect(bookingSuccessContent).toContain('download-eticket-btn');
      expect(bookingSuccessContent).toContain('handleDownloadPdf');
    });

    test('BookingSuccess eliminates duplicate two-page layout and obsolete pagination', () => {
      expect(bookingSuccessContent).not.toContain('PAGE 1 OF 2');
      expect(bookingSuccessContent).not.toContain('PAGE 2 OF 2');
      expect(bookingSuccessContent).not.toContain('Dual-Sheet Format: Page 1 (Boarding Pass) + Page 2 (Support & Policies)');
      expect(bookingSuccessContent).not.toContain('ticket-print-page-2 ticket-page-sheet');
    });

    test('Single-sheet E-Ticket contains Passenger Boarding Pass elements', () => {
      expect(bookingSuccessContent).toContain('ticket-operator-name');
      expect(bookingSuccessContent).toContain('ticket-bus-service');
      expect(bookingSuccessContent).toContain('ticket-pnr');
      expect(bookingSuccessContent).toContain('ticket-journey-date');
      expect(bookingSuccessContent).toContain('Passenger Manifest');
      expect(bookingSuccessContent).toContain('CONFIRMED BERTHS');
      expect(bookingSuccessContent).toContain('Digital Passenger Boarding QR Code');
    });

    test('Single-sheet E-Ticket integrates essential Support, Policies, Guidelines, and designated Central Bus Hub legal footer', () => {
      expect(bookingSuccessContent).toContain('PASSENGER TRAVEL GUIDELINES');
      expect(bookingSuccessContent).toContain('Boarding Protocol');
      expect(bookingSuccessContent).toContain('Luggage Allowance');
      expect(bookingSuccessContent).toContain('Cancellation Policy');
      expect(bookingSuccessContent).toContain('SMART ROUTE Central Bus Hub');
      expect(bookingSuccessContent).toContain('Palakkad – Ukkadam Highway, K.G. Chavadi, Coimbatore – 641105');
      expect(bookingSuccessContent).toContain('support@smartroutebooking.com');
      expect(bookingSuccessContent).toContain('+91 8072065549');
      expect(bookingSuccessContent).toContain('100% SECURE SSL 256-BIT PAYMENT');
      expect(bookingSuccessContent).toContain('Direct Operator Settlement Compliant');
      expect(bookingSuccessContent).toContain('EXACTLY ONE-PAGE A4 E-TICKET');
    });

    test('index.css removes conflicting page-break-after/before and enforces single-sheet A4 print styles', () => {
      expect(stylesContent).not.toContain('page-break-after: always !important');
      expect(stylesContent).not.toContain('page-break-before: always !important');
      expect(stylesContent).toContain('@page');
      expect(stylesContent).toContain('size: A4 portrait');
      expect(stylesContent).toContain('.ticket-single-sheet');
    });
  });

  // ==================== SECTION 3: EXACT SINGLE-PAGE A4 PDF GENERATION ====================
  describe('3. Exactly One A4 Page PDF Download Generation', () => {
    test('downloadBookingTicketPdf streams valid PDF with application/pdf and SMART-ROUTE-Ticket-{PNR}.pdf filename', async () => {
      const { req, res } = mockReqRes({ params: { pnr: 'SR4102' } });
      await downloadBookingTicketPdf(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toBe('attachment; filename="SMART-ROUTE-Ticket-SR4102.pdf"');
      expect(res.endedBuffer).toBeDefined();

      // Check PDF header
      const header = res.endedBuffer.slice(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');

      // Check exact page count in PDF structure: exactly 1 /Page object
      const pdfString = res.endedBuffer.toString('latin1');
      const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g) || [];
      expect(pageMatches.length).toBe(1);
    });

    test('generateTicketPdf generates exactly 1 A4 page with dynamic booking data for VV8820', async () => {
      const { req, res } = mockReqRes({ params: { pnr: 'VV8820' } });
      await downloadBookingTicketPdf(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-disposition']).toBe('attachment; filename="SMART-ROUTE-Ticket-VV8820.pdf"');

      const rawPdfString = res.endedBuffer.toString('latin1');
      const pageMatches = rawPdfString.match(/\/Type\s*\/Page[^s]/g) || [];
      expect(pageMatches.length).toBe(1);

      // Decode hex strings produced by PDFKit and strip kerning numbers for textual inspection
      const decodedPdfText = rawPdfString
        .replace(/<([0-9a-fA-F]+)>/g, (_, hex) => Buffer.from(hex, 'hex').toString('latin1'))
        .replace(/\s+-?\d+\s+/g, '');

      // Verify essential ticket metadata in generated PDF text
      expect(decodedPdfText).toMatch(/VV8820/);
      expect(decodedPdfText).toMatch(/VEE.*VEE.*Travels/);
      expect(decodedPdfText).toMatch(/SMART.*ROUTE.*Central.*Bus.*Hub/);
      expect(decodedPdfText).toContain('Coimbatore');
    });
  });
});
