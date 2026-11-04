import { Router } from 'express';
import {
  getTripSeatMap,
  getBusSeatLayout,
  lockSeats,
  releaseSeatHold,
  cleanupExpiredHolds,
} from '../controllers/seatController.js';
import { authenticateOptional } from '../middleware/auth.js';

const router = Router();

// Public / Passenger Seat map retrieval
router.get('/trip/:tripId', getTripSeatMap);
router.get('/bus/:busId/seat-layout', getBusSeatLayout);
router.get('/bus/:busId', getBusSeatLayout);

// Concurrency-safe seat locking & release
router.post('/lock', authenticateOptional, lockSeats);
router.post('/release', releaseSeatHold);

// Internal background maintenance
router.post('/cleanup-expired', cleanupExpiredHolds);

export default router;
