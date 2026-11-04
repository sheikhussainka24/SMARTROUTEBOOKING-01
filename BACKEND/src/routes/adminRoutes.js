import { Router } from 'express';
import {
  getDashboard,
  getTravels,
  getTravelDetails,
  approveTravel,
  rejectTravel,
  updateTravelStatus,
  getAuditLogs,
  getAdminBuses,
  createAdminBus,
  getHubSettings,
  updateHubSettings,
} from '../controllers/adminController.js';
import { authenticate, authorizeRole, authorize } from '../middleware/auth.js';
import { ROLES } from '../permissions/roles.js';

const router = Router();

// Mandatory authentication for all admin portal endpoints
router.use(authenticate);

// Fleet management & Add Bus endpoints (Super Admin, Travel Owner, Operations Manager)
router.get('/buses', authorize(ROLES.SUPER_ADMIN, ROLES.TRAVEL_OWNER, ROLES.MANAGER), getAdminBuses);
router.post('/buses', authorize(ROLES.SUPER_ADMIN, ROLES.TRAVEL_OWNER, ROLES.MANAGER), createAdminBus);

// Platform aggregate oversight & Travel governance (Super Admin only)
router.get('/dashboard', authorizeRole(ROLES.SUPER_ADMIN), getDashboard);
router.get('/travels', authorizeRole(ROLES.SUPER_ADMIN), getTravels);
router.get('/travels/:travelId', authorizeRole(ROLES.SUPER_ADMIN), getTravelDetails);
router.post('/travels/:travelId/approve', authorizeRole(ROLES.SUPER_ADMIN), approveTravel);
router.post('/travels/:travelId/reject', authorizeRole(ROLES.SUPER_ADMIN), rejectTravel);
router.put('/travels/:travelId/status', authorizeRole(ROLES.SUPER_ADMIN), updateTravelStatus);
router.get('/audit-logs', authorizeRole(ROLES.SUPER_ADMIN), getAuditLogs);

// System Settings: Central Bus Hub configuration
router.get('/settings/hub', authorize(ROLES.SUPER_ADMIN, ROLES.TRAVEL_OWNER), getHubSettings);
router.put('/settings/hub', authorizeRole(ROLES.SUPER_ADMIN), updateHubSettings);

export default router;

