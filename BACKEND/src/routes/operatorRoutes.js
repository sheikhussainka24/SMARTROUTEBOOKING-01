/**
 * SMART ROUTE — Operator Management Routes
 * Covers: Company registration, Manager CRUD, Driver CRUD, Bus CRUD, Trip/Route CRUD,
 * Fare management, Bookings, Reports, Schedule Conflicts, and Manager Permissions configuration.
 * All routes enforce authentication + tenant isolation middleware.
 */

import { Router } from 'express';
import {
  registerOperator,
  getOperatorStats,
  listManagers,
  createManager,
  updateManager,
  deactivateManager,
  listDrivers,
  createDriver,
  updateDriver,
  deactivateDriver,
  getCompanyBuses,
  createCompanyBus,
  updateCompanyBus,
  deleteCompanyBus,
  getCompanyRoutes,
  getCompanyTrips,
  createCompanyTrip,
  updateCompanyTrip,
  getCompanyScheduleConflicts,
  updateTripFare,
  getCompanyBookings,
  cancelCompanyBooking,
  getCompanyReports,
  getManagerPermissions,
  getSpecificManagerPermissions,
  updateSpecificManagerPermissions,
  createManagerInvitationEndpoint,
  listManagerInvitationsEndpoint,
} from '../controllers/operatorController.js';
import { authenticate, authorize, tenantIsolation } from '../middleware/auth.js';
import { ROLES } from '../permissions/roles.js';

const router = Router();

// ===================== PUBLIC OPERATOR REGISTRATION =====================
// Operators register their company + account in one step (no auth required)
router.post('/register', registerOperator);

// ===================== PROTECTED: Requires authentication + tenant =====================
router.use(authenticate);
router.use(tenantIsolation);

// Owner & Manager shared routes (read/view/manage subject to RBAC and fine-grained permissions)
router.use(authorize(ROLES.TRAVEL_OWNER, ROLES.MANAGER, ROLES.SUPER_ADMIN));

// 1. Dashboard stats & Operational Alerts
router.get('/stats', getOperatorStats);

// 2. Bus Management
router.get('/company/buses', getCompanyBuses);
router.post('/company/buses', createCompanyBus);
router.get('/buses', getCompanyBuses);
router.post('/buses', createCompanyBus);
router.put('/company/buses/:id', updateCompanyBus);
router.delete('/company/buses/:id', deleteCompanyBus);

// 3. Route & Schedule Management
router.get('/company/routes', getCompanyRoutes);
router.get('/company/trips', getCompanyTrips);
router.post('/company/trips', createCompanyTrip);
router.put('/company/trips/:id', updateCompanyTrip);
router.get('/company/conflicts', getCompanyScheduleConflicts);

// 4. Fare Management
router.put('/company/trips/:id/fare', updateTripFare);

// 5. Driver Management
router.get('/drivers', listDrivers);
router.post('/drivers', createDriver);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deactivateDriver);

// 6. Booking Management
router.get('/company/bookings', getCompanyBookings);
router.post('/company/bookings/:id/cancel', cancelCompanyBooking);

// 7. Reports
router.get('/company/reports', getCompanyReports);

// 8. Staff / Manager Management
router.get('/managers', listManagers);
router.post('/managers', authorize(ROLES.TRAVEL_OWNER, ROLES.SUPER_ADMIN), createManager);
router.put('/managers/:id', authorize(ROLES.TRAVEL_OWNER, ROLES.SUPER_ADMIN), updateManager);
router.delete('/managers/:id', authorize(ROLES.TRAVEL_OWNER, ROLES.SUPER_ADMIN), deactivateManager);

// 9. Manager Permissions Configuration (Owner control)
router.get('/manager-permissions', getManagerPermissions);
router.get('/managers/:id/permissions', getSpecificManagerPermissions);
router.put('/managers/:id/permissions', authorize(ROLES.TRAVEL_OWNER, ROLES.SUPER_ADMIN), updateSpecificManagerPermissions);

// 10. Operator Manager Invitations
router.post('/invitations', authorize(ROLES.TRAVEL_OWNER, ROLES.SUPER_ADMIN), createManagerInvitationEndpoint);
router.get('/invitations', listManagerInvitationsEndpoint);

export default router;
