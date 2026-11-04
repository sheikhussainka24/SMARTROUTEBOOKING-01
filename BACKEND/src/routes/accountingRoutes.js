/**
 * SMART ROUTE — Accounting & Financial Analytics Routes
 * 
 * Secure endpoints for financial ledger, route/bus profitability,
 * daily expenses, fuel tracking, staff payroll, reviews, and CSV exports.
 */

import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import {
  getSummary,
  getFleet,
  getBusesAccounting,
  getBusDetails,
  getRoutesAccounting,
  listExpenses,
  createExpense,
  updateExpenseApproval,
  listFuel,
  recordFuel,
  listPayroll,
  recordPayroll,
  listReviews,
  getBusRatingSummary,
  submitReview,
  exportReport,
} from '../controllers/accountingController.js';

const router = Router();

// 1. Executive Summaries & Overviews
router.get('/summary', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), getSummary);
router.get('/fleet-summary', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), getFleet);

// 2. Bus-wise Accounting & Drill-down
router.get('/buses', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), getBusesAccounting);
router.get('/buses/:busId', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), getBusDetails);

// 3. Route-wise Profitability
router.get('/routes', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), getRoutesAccounting);

// 4. Daily Expense Management & Approvals
router.get('/expenses', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), listExpenses);
router.post('/expenses', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), createExpense);
router.patch('/expenses/:id/approve', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), updateExpenseApproval);

// 5. Diesel & Fuel Accounting
router.get('/fuel', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager', 'driver'), listFuel);
router.post('/fuel', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager', 'driver'), recordFuel);

// 6. Driver & Cleaner Payroll
router.get('/payroll', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), listPayroll);
router.post('/payroll', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), recordPayroll);

// 7. Verified Passenger Ratings & Reviews
router.get('/reviews', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), listReviews);
router.get('/reviews/bus/:busId', optionalAuth, getBusRatingSummary);
router.post('/reviews', authenticate, submitReview);

// 8. Downloadable Reports & CSV Exports
router.get('/export', authenticate, authorize('super_admin', 'admin', 'travel_owner', 'manager'), exportReport);

export default router;
