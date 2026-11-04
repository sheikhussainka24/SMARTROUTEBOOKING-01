import { Router } from 'express';
import {
  registerTravel,
  getDashboard,
  getUsers,
  inviteUser,
  approveUser,
  rejectUser,
  updateUserStatus,
  updateUserPermissions,
  getBuses,
  createBus,
  getRoutes,
  createRoute,
  getRouteDetails,
  updateRoute,
  getRouteStops,
  updateRouteStops,
  verifyRoute,
  validateRouteStopsApi,
  bulkImportRoutes,
} from '../controllers/ownerController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';
import { ROLES } from '../permissions/roles.js';

const router = Router();

// Travel registration (Requires authenticated user wanting to become an owner)
router.post('/register-travel', authenticate, registerTravel);

// Owner / Manager Protected Dashboard and Operations
router.use(authenticate);
router.use(authorizeRole(ROLES.TRAVEL_OWNER, ROLES.MANAGER));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.post('/users/invite', inviteUser);
router.post('/users/:userId/approve', approveUser);
router.post('/users/:userId/reject', rejectUser);
router.put('/users/:userId/status', updateUserStatus);
router.put('/users/:userId/permissions', updateUserPermissions);

router.get('/buses', getBuses);
router.post('/buses', createBus);

// Scalable Route & Stop Management
router.get('/routes', getRoutes);
router.post('/routes', createRoute);
router.post('/routes/validate-stops', validateRouteStopsApi);
router.post('/routes/bulk-import', bulkImportRoutes);
router.get('/routes/:id', getRouteDetails);
router.put('/routes/:id', updateRoute);
router.get('/routes/:id/stops', getRouteStops);
router.put('/routes/:id/stops', updateRouteStops);
router.post('/routes/:id/verify', verifyRoute);

export default router;
