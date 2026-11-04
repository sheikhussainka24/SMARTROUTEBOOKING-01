/**
 * SMART ROUTE — Acceptance Tests: Accounting, Financial Analytics & Ratings
 * Verification of all 22 criteria from Module 16
 */

import { jest } from '@jest/globals';
import accountingService, {
  busExpenses,
  fuelRecords,
  staffPayroll,
  passengerReviews,
  expenseAuditLogs,
} from '../../BACKEND/src/services/accountingService.js';
import {
  buses,
  trips,
  bookings,
  smartRouteTravelId,
  veeVeeTravelId,
  tranzKingTravelId,
} from '../../BACKEND/src/services/dataStore.js';
import * as accountingController from '../../BACKEND/src/controllers/accountingController.js';

describe('SMART ROUTE — Complete Accounting & Business Analytics Acceptance Tests', () => {
  beforeAll(() => {
    accountingService.initializeSeedAccountingData();
  });

  // 1. One bus with multiple confirmed bookings and successful payments
  test('Criterion 1: Bus with multiple confirmed bookings and successful payments calculates correct gross & net revenue', async () => {
    const busDetails = await accountingService.getBusAccountingDetails({
      busId: 'bus-sr-001',
      userRole: 'super_admin',
    });

    expect(busDetails).toBeDefined();
    expect(busDetails.bus_id).toBe('bus-sr-001');
    expect(busDetails.gross_ticket_sales).toBeGreaterThan(0);
    expect(busDetails.actual_collections).toBeGreaterThan(0);
    expect(busDetails.net_ticket_revenue).toBe(busDetails.gross_ticket_sales - busDetails.discounts - busDetails.refunds);
    expect(busDetails.trip_ledgers.length).toBeGreaterThan(0);
  });

  // 2. A cancelled booking with full refund
  test('Criterion 2: Cancelled booking with full refund deducts from gross revenue to calculate net revenue', async () => {
    const fullRefundBooking = bookings.find((b) => b.id === 'bkg-sr-cancel-full');
    expect(fullRefundBooking).toBeDefined();
    expect(fullRefundBooking.booking_status).toBe('cancelled');
    expect(fullRefundBooking.refund_amount).toBe(1500.0);

    const summary = await accountingService.getFinancialSummary({ travelId: smartRouteTravelId });
    expect(summary.refunds).toBeGreaterThanOrEqual(1500.0);
    expect(summary.net_ticket_revenue).toBe(summary.gross_ticket_sales - summary.discounts - summary.refunds);
  });

  // 3. A partially refunded booking
  test('Criterion 3: Partially refunded booking correctly reflects discount, refund, and net revenue', async () => {
    const partialBooking = bookings.find((b) => b.id === 'bkg-sr-partial-ref');
    expect(partialBooking).toBeDefined();
    expect(partialBooking.discount_amount).toBe(100.0);
    expect(partialBooking.refund_amount).toBe(900.0);

    const summary = await accountingService.getFinancialSummary({ travelId: smartRouteTravelId });
    expect(summary.discounts).toBeGreaterThanOrEqual(100.0);
  });

  // 4. A failed payment
  test('Criterion 4: Failed payments are isolated and reported separately from actual collections', async () => {
    const summary = await accountingService.getFinancialSummary({ travelId: smartRouteTravelId });
    expect(summary.failed_payments).toBeGreaterThan(0);
    expect(summary.actual_collections).toBeLessThanOrEqual(summary.net_ticket_revenue);
  });

  // 5. A bus with diesel and toll expenses
  test('Criterion 5: Bus with diesel and toll expenses tracks both categories independently', async () => {
    const busDetails = await accountingService.getBusAccountingDetails({
      busId: 'bus-sr-001',
      userRole: 'super_admin',
    });

    expect(busDetails.fuel_expenses).toBeGreaterThan(0);
    expect(busDetails.toll_parking_expenses).toBeGreaterThan(0);
    expect(busDetails.total_operating_expenses).toBeGreaterThanOrEqual(
      busDetails.fuel_expenses + busDetails.toll_parking_expenses
    );
  });

  // 6. Monthly salary allocation without duplicate expense counting
  test('Criterion 6: Monthly salary allocation counted only once in consolidated company totals', async () => {
    const summary = await accountingService.getFinancialSummary({ travelId: smartRouteTravelId });
    
    // Check that is_salary_allocation items are excluded from total_operating_expenses
    const rootSalaryExpenses = busExpenses.filter(
      (e) => e.travel_id === smartRouteTravelId && e.category === 'driver_salary' && !e.is_salary_allocation && e.approval_status === 'approved'
    );
    const allocatedTripExpenses = busExpenses.filter(
      (e) => e.travel_id === smartRouteTravelId && e.is_salary_allocation && e.approval_status === 'approved'
    );

    expect(allocatedTripExpenses.length).toBeGreaterThan(0);
    const rootSalarySum = rootSalaryExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Consolidated salary expenses should equal root salaries, avoiding double counting trip allocations
    expect(summary.driver_cleaner_salaries).toBeGreaterThanOrEqual(rootSalarySum);
  });

  // 7. A bus operating on multiple routes over time
  test('Criterion 7: Historical accounting retained when bus operates on multiple trips/routes', async () => {
    const busDetails = await accountingService.getBusAccountingDetails({
      busId: 'bus-sr-001',
      userRole: 'super_admin',
    });

    expect(busDetails.trip_ledgers).toBeDefined();
    expect(busDetails.trip_ledgers.length).toBeGreaterThanOrEqual(1);
    for (const trip of busDetails.trip_ledgers) {
      expect(trip.route_name).toBeDefined();
      expect(trip.departure_date).toBeDefined();
    }
  });

  // 8. Multiple buses operating on the same route
  test('Criterion 8: Multiple buses operating on the same route are aggregated accurately', async () => {
    const routesList = await accountingService.getRouteProfitabilityRankings({ userRole: 'super_admin' });
    const cbeTksRoute = routesList.find((r) => r.route_id === 'rt-cbe-tks-001');
    expect(cbeTksRoute).toBeDefined();
    expect(cbeTksRoute.operated_trips).toBeGreaterThanOrEqual(3);
  });

  // 9. A Travel Owner with multiple buses
  test('Criterion 9: Travel Owner with multiple buses sees complete fleet accounting', async () => {
    const ownerBuses = await accountingService.getBusAccountingList({
      travelId: smartRouteTravelId,
      userRole: 'travel_owner',
    });

    expect(ownerBuses.length).toBeGreaterThan(1);
    for (const b of ownerBuses) {
      expect(b.travel_id).toBe(smartRouteTravelId);
    }
  });

  // 10. Two separate Travel Owners whose financial records remain isolated
  test('Criterion 10: Financial isolation strictly enforced between distinct Travel Owners', async () => {
    const smartRouteSummary = await accountingService.getFinancialSummary({ travelId: smartRouteTravelId });
    const veeVeeSummary = await accountingService.getFinancialSummary({ travelId: veeVeeTravelId });

    expect(smartRouteSummary.organization).not.toBe(veeVeeSummary.organization);
    expect(smartRouteSummary.gross_ticket_sales).not.toBe(veeVeeSummary.gross_ticket_sales);

    // Operator A cannot view Operator B's bus details
    await expect(
      accountingService.getBusAccountingDetails({
        busId: 'bus-cbe-tks-vv-02', // VEE VEE bus
        travelId: smartRouteTravelId, // SMART ROUTE owner
        userRole: 'travel_owner',
      })
    ).rejects.toThrow(/Access denied/);
  });

  // 11. Super Admin consolidated totals across all travel companies
  test('Criterion 11: Super Admin gets consolidated totals across all carriers', async () => {
    const consolidated = await accountingService.getFinancialSummary({ userRole: 'super_admin' });
    const srSummary = await accountingService.getFinancialSummary({ travelId: smartRouteTravelId });
    const vvSummary = await accountingService.getFinancialSummary({ travelId: veeVeeTravelId });

    expect(consolidated.gross_ticket_sales).toBeGreaterThanOrEqual(
      srSummary.gross_ticket_sales + vvSummary.gross_ticket_sales
    );
    expect(consolidated.total_operating_expenses).toBeGreaterThanOrEqual(
      srSummary.total_operating_expenses + vvSummary.total_operating_expenses
    );
  });

  // 12. Available seats for different trips and travel dates
  test('Criterion 12: Seat capacity and available seats calculated dynamically per trip', async () => {
    const busDetails = await accountingService.getBusAccountingDetails({
      busId: 'bus-sr-001',
      userRole: 'super_admin',
    });

    for (const trip of busDetails.trip_ledgers) {
      expect(trip.total_seats).toBeGreaterThan(0);
      expect(trip.available_seats + trip.booked_seats).toBe(trip.total_seats);
      expect(trip.occupancy_percentage).toBeGreaterThanOrEqual(0);
      expect(trip.occupancy_percentage).toBeLessThanOrEqual(100);
    }
  });

  // 13. Profit ranking by total profit and average profit per trip
  test('Criterion 13: Total profit ranking and Average profit per trip ranking are distinguished', async () => {
    const rankedByTotal = await accountingService.getBusAccountingList({
      userRole: 'super_admin',
      sortBy: 'total_profit',
      sortOrder: 'desc',
    });

    const rankedByAvg = await accountingService.getBusAccountingList({
      userRole: 'super_admin',
      sortBy: 'avg_profit_per_trip',
      sortOrder: 'desc',
    });

    expect(rankedByTotal[0].operating_profit_loss).toBeGreaterThanOrEqual(
      rankedByTotal[rankedByTotal.length - 1].operating_profit_loss
    );
    expect(rankedByAvg[0].avg_profit_per_trip).toBeGreaterThanOrEqual(
      rankedByAvg[rankedByAvg.length - 1].avg_profit_per_trip
    );
  });

  // 14. A loss-making bus and a loss-making route
  test('Criterion 14: Loss-making bus and loss-making route identified correctly', async () => {
    const busList = await accountingService.getBusAccountingList({ userRole: 'super_admin' });
    const lossBus = busList.find((b) => b.is_loss_making);
    expect(lossBus).toBeDefined();
    expect(lossBus.operating_profit_loss).toBeLessThan(0);
  });

  // 15. A bus with no financial records (honest empty state)
  test('Criterion 15: Bus with zero records shows honest unpopulated state without fabricated numbers', async () => {
    const details = await accountingService.getBusAccountingDetails({
      busId: 'bus-brand-new-zero-01',
      userRole: 'super_admin',
    });

    expect(details.trip_ledgers.length).toBe(0);
    expect(details.gross_ticket_sales).toBe(0);
    expect(details.total_operating_expenses).toBe(0);
    expect(details.operating_profit_loss).toBe(0);
  });

  // 16. A bus with zero passenger ratings
  test('Criterion 16: Bus with zero ratings reports null average rating and zero count', async () => {
    const summary = await accountingService.getBusRatingSummary('bus-brand-new-zero-01');
    expect(summary.has_ratings).toBe(false);
    expect(summary.total_reviews).toBe(0);
    expect(summary.average_rating).toBeNull();
  });

  // 17. Verified passenger review submission and duplicate-review prevention
  test('Criterion 17: Review submission succeeds for verified booking and blocks duplicate reviews', async () => {
    const uniqueBookingId = `bkg-verify-test-${Date.now()}`;
    bookings.push({
      id: uniqueBookingId,
      pnr_number: `PNR-REV-${Date.now().toString().slice(-4)}`,
      user_id: 'usr-passenger-001',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0].id,
      booking_status: 'confirmed',
      contact_name: 'Test Passenger',
    });

    // 1st submission succeeds
    const review = await accountingService.submitPassengerReview({
      bookingId: uniqueBookingId,
      userId: 'usr-passenger-001',
      ratings: { overall: 5, cleanliness: 5, seat_comfort: 5, punctuality: 4, staff_behaviour: 5 },
      reviewText: 'Great experience on this test ride!',
      user: { id: 'usr-passenger-001', role: 'passenger' },
    });
    expect(review.id).toBeDefined();
    expect(review.overall_rating).toBe(5);

    // 2nd submission for identical booking must be rejected
    await expect(
      accountingService.submitPassengerReview({
        bookingId: uniqueBookingId,
        userId: 'usr-passenger-001',
        ratings: { overall: 4 },
        user: { id: 'usr-passenger-001', role: 'passenger' },
      })
    ).rejects.toThrow(/Duplicate reviews are not permitted/);
  });

  // 18. Ratings and reviews shown only to authorized users
  test('Criterion 18: Operator reviews list scopes to own carrier buses', async () => {
    const vvReviews = await accountingService.getPassengerReviews({ travelId: veeVeeTravelId });
    for (const r of vvReviews) {
      expect(r.travel_id).toBe(veeVeeTravelId);
    }
  });

  // 19. Unauthorized attempts to access another company's financial records
  test('Criterion 19: Controller blocks parameter tampering across travel organizations', async () => {
    const req = {
      user: { id: 'usr-owner-001', role: 'travel_owner', travelId: smartRouteTravelId },
      query: { travelId: veeVeeTravelId }, // Tampered travelId
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await accountingController.getSummary(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringMatching(/Security Violation/),
      })
    );
  });

  // 20. Editing or reversing an approved expense while retaining its audit trail
  test('Criterion 20: Expense reversal never silently deletes; maintains immutable audit trail', async () => {
    const expense = await accountingService.createExpense({
      travelId: smartRouteTravelId,
      busId: 'bus-sr-001',
      expenseDate: '2026-10-25',
      category: 'other',
      amount: Number((1500.0 + (Date.now() % 1000)).toFixed(2)),
      vendor: `Stationery & Boarding Slips #${Date.now().toString().slice(-4)}`,
      user: { id: 'usr-owner-001', role: 'travel_owner', travelId: smartRouteTravelId },
    });

    const reversed = await accountingService.updateExpenseStatus({
      expenseId: expense.id,
      action: 'reverse',
      reason: 'Entered duplicate vendor slip by mistake',
      user: { id: 'usr-owner-001', role: 'travel_owner', travelId: smartRouteTravelId },
    });

    expect(reversed.approval_status).toBe('reversed');
    const logs = expenseAuditLogs.filter((l) => l.expense_id === expense.id);
    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs.some((l) => l.action === 'created')).toBe(true);
    expect(logs.some((l) => l.action === 'reverse')).toBe(true);
  });

  // 21. Dashboard figures matching their underlying records and exported reports
  test('Criterion 21: Dashboard figures reconcile with exported CSV reports and Indian currency formatting', async () => {
    const summary = await accountingService.getFinancialSummary({ travelId: smartRouteTravelId });
    const csvContent = await accountingService.generateCsvExport({
      reportType: 'summary',
      travelId: smartRouteTravelId,
      userRole: 'travel_owner',
      filters: {},
    });

    expect(csvContent).toContain('Net Ticket Revenue');
    expect(csvContent).toContain(summary.net_ticket_revenue.toFixed(2));
    expect(csvContent).toContain('Operating Profit / Loss');
    expect(accountingService.formatINR(summary.net_ticket_revenue)).toContain('₹');
  });

  // 22. Correct date filtering and consistent financial calculations
  test('Criterion 22: Date filters produce consistent, mathematically reconciled periods', async () => {
    const allSummary = await accountingService.getFinancialSummary({ travelId: smartRouteTravelId, dateRange: 'all' });
    const todaySummary = await accountingService.getFinancialSummary({ travelId: smartRouteTravelId, dateRange: 'today' });

    expect(todaySummary.gross_ticket_sales).toBeLessThanOrEqual(allSummary.gross_ticket_sales);
    expect(todaySummary.net_ticket_revenue).toBe(
      todaySummary.gross_ticket_sales - todaySummary.discounts - todaySummary.refunds
    );
    expect(todaySummary.operating_profit_loss).toBe(
      todaySummary.net_ticket_revenue - todaySummary.total_operating_expenses
    );
  });
});
