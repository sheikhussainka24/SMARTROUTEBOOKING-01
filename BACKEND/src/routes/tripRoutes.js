import { Router } from 'express';
import {
  searchTrips,
  getRouteCatalogue,
  getTripDetails,
  getTripStops,
  createTrip,
  updateTrip,
  cancelTrip,
  getTripsByTravel,
  getRouteCoverageReport,
  getRouteBusServices,
  syncInventoryApi,
  getTripTracking,
  getActiveLiveTrackingTrips,
} from '../controllers/tripController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import { ROLES } from '../permissions/roles.js';

const router = Router();

// Public trip search & route catalogue & analytics
router.get('/search', searchTrips);
router.get('/catalogue', getRouteCatalogue);
router.get('/coverage-report', getRouteCoverageReport);
router.get('/active/live-tracking', getActiveLiveTrackingTrips);
router.post('/sync-inventory', syncInventoryApi);
router.get('/route/:routeId', getRouteBusServices);
router.get('/:tripId/tracking', getTripTracking);
router.get('/:tripId', getTripDetails);
router.get('/:tripId/stops', getTripStops);

// Operator trip management
router.post(
  '/',
  authenticate,
  authorizeRole(ROLES.TRAVEL_OWNER, ROLES.MANAGER),
  createTrip
);
router.put(
  '/:tripId',
  authenticate,
  authorizeRole(ROLES.TRAVEL_OWNER, ROLES.MANAGER),
  updateTrip
);
router.delete(
  '/:tripId',
  authenticate,
  authorizeRole(ROLES.TRAVEL_OWNER, ROLES.MANAGER),
  cancelTrip
);
router.get(
  '/travel/:travelId',
  authenticate,
  authorizeRole(ROLES.TRAVEL_OWNER, ROLES.MANAGER, ROLES.STAFF),
  getTripsByTravel
);

export default router;
