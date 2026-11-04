import { Router } from 'express';
import {
  getCurrentTrip,
  getPassengerChart,
  verifyPassengerBoarding,
  updateLocation,
  advanceStop,
} from '../controllers/driverController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import { ROLES } from '../permissions/roles.js';

const router = Router();

// Driver authentication and approved status required for all operational routes
router.use(authenticate);
router.use(authorizeRole(ROLES.DRIVER));

// Enforce active approval status before allowing operational transit actions
router.use((req, res, next) => {
  if (req.user?.status !== 'active') {
    return res.status(403).json({
      success: false,
      error: 'Driver account is pending verification and operator approval. Operational access is restricted.',
      code: 'DRIVER_NOT_APPROVED',
    });
  }
  next();
});

// Driver operations
router.get('/current-trip', getCurrentTrip);
router.get('/trip/:tripId/passengers', getPassengerChart);
router.post('/passenger/boarding', verifyPassengerBoarding);
router.post('/location', updateLocation);
router.post('/trip/:tripId/advance-stop', advanceStop);

export default router;
