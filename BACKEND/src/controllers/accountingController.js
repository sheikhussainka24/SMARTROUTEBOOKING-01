/**
 * SMART ROUTE — Accounting & Financial Analytics Controller
 * 
 * Strict RBAC enforcement:
 * - Super Admin / Founder: Platform-wide consolidated view, drill-down across all operators.
 * - Travel Owner / Manager: Strictly restricted to their own organization's records.
 */

import accountingService from '../services/accountingService.js';
import logger from '../config/logger.js';

/**
 * Helper to resolve and enforce travel_id based on user role
 */
function resolveAuthorizedTravelId(req) {
  const user = req.user;
  if (!user) {
    const err = new Error('Authentication required');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  // Super Admin can inspect all or filter by requested travelId
  if (user.role === 'super_admin' || user.role === 'admin') {
    return req.query.travelId || req.body.travelId || null;
  }

  // Travel Owner or Manager must strictly see only their authorized travelId
  const authorizedId = user.travelId || user.travel_id;
  if (!authorizedId) {
    const err = new Error('No travel organization associated with this account');
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Detect and block unauthorized parameter tampering
  const requestedId = req.query.travelId || req.body.travelId;
  if (requestedId && requestedId !== authorizedId) {
    const err = new Error('Security Violation: You do not have authorization to access financial records for another organization.');
    err.code = 'FORBIDDEN';
    throw err;
  }

  return authorizedId;
}

/**
 * GET /api/accounting/summary
 * Consolidated or company-scoped financial & operations summary
 */
export async function getSummary(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { dateRange = 'all', startDate, endDate } = req.query;

    const [financialSummary, fleetSummary] = await Promise.all([
      accountingService.getFinancialSummary({ travelId, dateRange, startDate, endDate }),
      accountingService.getFleetSummary({ travelId, dateRange, startDate, endDate }),
    ]);

    return res.json({
      success: true,
      data: {
        financials: financialSummary,
        fleet: fleetSummary,
      },
    });
  } catch (err) {
    logger.error('Accounting getSummary error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : (err.code === 'UNAUTHORIZED' ? 401 : 500);
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/fleet-summary
 */
export async function getFleet(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { dateRange = 'all', startDate, endDate } = req.query;

    const fleet = await accountingService.getFleetSummary({ travelId, dateRange, startDate, endDate });
    return res.json({ success: true, data: fleet });
  } catch (err) {
    logger.error('Accounting getFleet error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/buses
 * Bus-wise accounting list and profitability rankings
 */
export async function getBusesAccounting(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { dateRange = 'all', startDate, endDate, sortBy = 'total_profit', sortOrder = 'desc' } = req.query;

    const busesList = await accountingService.getBusAccountingList({
      travelId,
      userRole: req.user.role,
      dateRange,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    return res.json({ success: true, data: busesList });
  } catch (err) {
    logger.error('Accounting getBusesAccounting error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/buses/:busId
 * Detailed ledger & trip-by-trip accounting for an individual bus
 */
export async function getBusDetails(req, res) {
  try {
    const { busId } = req.params;
    const travelId = resolveAuthorizedTravelId(req);
    const { dateRange = 'all', startDate, endDate } = req.query;

    const busDetails = await accountingService.getBusAccountingDetails({
      busId,
      travelId,
      userRole: req.user.role,
      dateRange,
      startDate,
      endDate,
    });

    return res.json({ success: true, data: busDetails });
  } catch (err) {
    logger.error('Accounting getBusDetails error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : (err.code === 'NOT_FOUND' ? 404 : 500);
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/routes
 * Route-wise profitability rankings and operational metrics
 */
export async function getRoutesAccounting(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { dateRange = 'all', startDate, endDate, sortBy = 'total_profit', sortOrder = 'desc' } = req.query;

    const routesList = await accountingService.getRouteProfitabilityRankings({
      travelId,
      userRole: req.user.role,
      dateRange,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    return res.json({ success: true, data: routesList });
  } catch (err) {
    logger.error('Accounting getRoutesAccounting error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/expenses
 */
export async function listExpenses(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { busId, tripId, category, status, dateRange = 'all', startDate, endDate } = req.query;

    const expenses = await accountingService.getExpenses({
      travelId,
      busId,
      tripId,
      category,
      status,
      dateRange,
      startDate,
      endDate,
    });

    return res.json({ success: true, data: expenses });
  } catch (err) {
    logger.error('Accounting listExpenses error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * POST /api/accounting/expenses
 * Create an expense entry
 */
export async function createExpense(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { busId, tripId, expenseDate, category, amount, quantity, unitPrice, vendor, paymentMethod, notes, receiptUrl } = req.body;

    const expense = await accountingService.createExpense({
      travelId,
      busId,
      tripId,
      expenseDate,
      category,
      amount,
      quantity,
      unitPrice,
      vendor,
      paymentMethod,
      notes,
      receiptUrl,
      user: req.user,
    });

    return res.status(201).json({ success: true, data: expense });
  } catch (err) {
    logger.error('Accounting createExpense error:', err);
    const status = err.code === 'DUPLICATE_ENTRY' ? 409 : (err.code === 'FORBIDDEN' ? 403 : 400);
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * PATCH /api/accounting/expenses/:id/approve
 * Approval, rejection, or reversal workflow with audit logging
 */
export async function updateExpenseApproval(req, res) {
  try {
    const { id } = req.params;
    const { action = 'approve', reason, updates } = req.body;

    const result = await accountingService.updateExpenseStatus({
      expenseId: id,
      action,
      reason,
      user: req.user,
      updates,
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Accounting updateExpenseApproval error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : (err.code === 'NOT_FOUND' ? 404 : 400);
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/fuel
 */
export async function listFuel(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { busId, dateRange = 'all', startDate, endDate } = req.query;

    const fuelLogs = await accountingService.getFuelLogs({ travelId, busId, dateRange, startDate, endDate });
    return res.json({ success: true, data: fuelLogs });
  } catch (err) {
    logger.error('Accounting listFuel error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * POST /api/accounting/fuel
 */
export async function recordFuel(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { busId, tripId, purchaseDate, litres, pricePerLitre, totalCost, odometerReading, fuelStation, notes } = req.body;

    const fuel = await accountingService.recordFuelPurchase({
      travelId,
      busId,
      tripId,
      purchaseDate,
      litres,
      pricePerLitre,
      totalCost,
      odometerReading,
      fuelStation,
      notes,
      user: req.user,
    });

    return res.status(201).json({ success: true, data: fuel });
  } catch (err) {
    logger.error('Accounting recordFuel error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 400;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/payroll
 */
export async function listPayroll(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { role, periodMonth, dateRange = 'all' } = req.query;

    const payroll = await accountingService.getPayrollSummary({ travelId, role, periodMonth, dateRange });
    return res.json({ success: true, data: payroll });
  } catch (err) {
    logger.error('Accounting listPayroll error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * POST /api/accounting/payroll
 */
export async function recordPayroll(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { userId, staffName, role, tripId, busId, payrollType, periodMonth, amountPayable, amountPaid, paymentMethod, notes } = req.body;

    const payroll = await accountingService.recordPayrollPayment({
      travelId,
      userId,
      staffName,
      role,
      tripId,
      busId,
      payrollType,
      periodMonth,
      amountPayable,
      amountPaid,
      paymentMethod,
      notes,
      user: req.user,
    });

    return res.status(201).json({ success: true, data: payroll });
  } catch (err) {
    logger.error('Accounting recordPayroll error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 400;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/reviews
 */
export async function listReviews(req, res) {
  try {
    const travelId = req.user.role === 'super_admin' ? req.query.travelId : resolveAuthorizedTravelId(req);
    const { busId, status = 'published' } = req.query;

    const reviews = await accountingService.getPassengerReviews({ busId, travelId, status });
    return res.json({ success: true, data: reviews });
  } catch (err) {
    logger.error('Accounting listReviews error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/reviews/bus/:busId
 */
export async function getBusRatingSummary(req, res) {
  try {
    const { busId } = req.params;
    const summary = await accountingService.getBusRatingSummary(busId);
    return res.json({ success: true, data: summary });
  } catch (err) {
    logger.error('Accounting getBusRatingSummary error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/accounting/reviews
 * Passenger verified review submission
 */
export async function submitReview(req, res) {
  try {
    const { bookingId, pnrNumber, ratings, reviewText, complaintCategory } = req.body;

    const review = await accountingService.submitPassengerReview({
      bookingId,
      pnrNumber,
      ratings,
      reviewText,
      complaintCategory,
      user: req.user,
    });

    return res.status(201).json({
      success: true,
      data: {
        message: 'Verified passenger review recorded successfully',
        review,
      },
    });
  } catch (err) {
    logger.error('Accounting submitReview error:', err);
    const status = err.code === 'DUPLICATE_REVIEW'
      ? 409
      : err.code === 'FORBIDDEN'
      ? 403
      : err.code === 'BOOKING_NOT_FOUND' || err.code === 'INELIGIBLE_BOOKING'
      ? 400
      : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

/**
 * GET /api/accounting/export
 * Download CSV reports with Indian Currency (₹)
 */
export async function exportReport(req, res) {
  try {
    const travelId = resolveAuthorizedTravelId(req);
    const { reportType = 'summary', dateRange = 'all', startDate, endDate } = req.query;

    const csvData = await accountingService.generateCsvExport({
      reportType,
      travelId,
      userRole: req.user.role,
      filters: { dateRange, startDate, endDate },
    });

    const filename = `smartroute_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvData);
  } catch (err) {
    logger.error('Accounting exportReport error:', err);
    const status = err.code === 'FORBIDDEN' ? 403 : 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
}

export default {
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
};
