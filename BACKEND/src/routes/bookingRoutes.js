import { Router } from 'express';
import {
  createBooking,
  getBookingByPNR,
  getBookingTracking,
  getPassengerBookings,
  getPassengerTransactions,
  searchBookingByPnr,
  cancelBooking,
  verifyTicketQR,
  downloadBookingTicketPdf,
} from '../controllers/bookingController.js';
import { authenticate, authenticateOptional, authorizeRole } from '../middleware/auth.js';
import { ROLES } from '../permissions/roles.js';

const router = Router();

// Create booking (Authenticated or Guest with contact info)
router.post('/', authenticateOptional, createBooking);

// ======================== STATIC PASSENGER SUBPATHS (MUST PRECEDE /:pnr WILDCARD) ========================
// Passenger bookings & tickets history
router.get('/my-bookings', authenticate, getPassengerBookings);
router.get('/my-tickets', authenticate, getPassengerBookings);

// Passenger transactions history
router.get('/transactions', authenticate, getPassengerTransactions);

// Dedicated PNR Search with privacy masking
router.get('/pnr-search/:pnr', authenticateOptional, searchBookingByPnr);
router.post('/pnr-search', authenticateOptional, searchBookingByPnr);

// Cancel booking (accepts bookingId or PNR)
router.post('/:bookingId/cancel', authenticate, cancelBooking);

// QR Ticket verification (Driver, Staff, Manager)
router.post(
  '/verify-qr',
  authenticate,
  authorizeRole(ROLES.DRIVER, ROLES.STAFF, ROLES.MANAGER, ROLES.TRAVEL_OWNER),
  verifyTicketQR
);

// Download Single-Page E-Ticket PDF
router.get('/pnr/:pnr/pdf', downloadBookingTicketPdf);
router.get('/pnr/:pnr/download-ticket', downloadBookingTicketPdf);
router.get('/:pnr/pdf', downloadBookingTicketPdf);
router.get('/:pnr/download-ticket', downloadBookingTicketPdf);

// Retrieve booking by PNR & Tracking
router.get('/pnr/:pnr/tracking', getBookingTracking);
router.get('/pnr/:pnr', getBookingByPNR);
router.get('/:pnr', getBookingByPNR);

export default router;
