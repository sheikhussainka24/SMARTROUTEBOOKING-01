import { Router } from 'express';
import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';
import { resetAllSeatLocks } from '../services/dataStore.js';

const router = Router();

/**
 * Reset all seat holds and locks (Developer / Admin hook)
 * POST /api/dev/reset-locks
 */
router.post('/reset-locks', async (req, res) => {
  try {
    // 1. In-memory fallback reset
    resetAllSeatLocks();

    // 2. Database reset if connected
    if (isDbConnected()) {
      try {
        const hasSeatHolds = await db.schema.hasTable('seat_holds');
        if (hasSeatHolds) {
          await db('seat_holds').del();
        }
      } catch (err) {
        logger.warn('Notice while truncating seat_holds table:', err.message);
      }

      await db('trip_seats')
        .where('status', 'held')
        .update({
          status: 'available',
          held_by: null,
          held_until: null,
        });
    }

    return res.json({
      success: true,
      message: 'Seat holds and zombie locks purged successfully across all operational fleet coaches.',
      purgedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Dev reset-locks error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset seat locks',
      message: error.message,
    });
  }
});

export default router;
