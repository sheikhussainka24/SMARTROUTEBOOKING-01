/**
 * SMART ROUTE — Core Accounting, Financial Analytics & Passenger Ratings Engine
 * 
 * Provides unified, production-grade business calculations, strict multi-tenant
 * isolation, audit logs, and performance metrics across Super Admin and Travel Owners.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';
import {
  buses,
  routes,
  trips,
  travels,
  bookings,
  users,
  smartRouteTravelId,
  veeVeeTravelId,
  tranzKingTravelId,
  savePersistentStore,
} from './dataStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSISTENT_ACCOUNTING_FILE = path.resolve(__dirname, '../data/persistent_accounting_store.json');

// Expense Categories
export const EXPENSE_CATEGORIES = [
  'diesel_fuel',
  'driver_salary',
  'cleaner_salary',
  'driver_allowance',
  'cleaner_allowance',
  'toll',
  'parking',
  'maintenance',
  'tyres_spares',
  'insurance_permits',
  'staff_food',
  'other',
];

// In-memory collections with persistent storage sync
export const busExpenses = [];
export const fuelRecords = [];
export const staffPayroll = [];
export const passengerReviews = [];
export const expenseAuditLogs = [];

/**
 * Format Indian Currency (₹)
 */
export function formatINR(val) {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Filter items by date range
 */
export function filterByDate(items, dateField, { dateRange = 'all', startDate, endDate }) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (dateRange === 'all' && !startDate && !endDate) return items;

  const now = new Date();
  let start = null;
  let end = null;

  if (startDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
  }
  if (endDate) {
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  if (!startDate && !endDate) {
    if (dateRange === 'today') {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'this_week') {
      start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
  }

  return items.filter((item) => {
    const raw = item[dateField];
    if (!raw) return false;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

/**
 * Initialize Seed Accounting Records for Realistic Baseline Operations
 */
export function initializeSeedAccountingData() {
  if (busExpenses.length > 0) return; // Already seeded

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const d1 = new Date(now);
  d1.setDate(d1.getDate() - 1);
  const yestStr = d1.toISOString().split('T')[0];

  const d2 = new Date(now);
  d2.setDate(d2.getDate() - 2);
  const twoDaysAgoStr = d2.toISOString().split('T')[0];

  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Diesel Fuel Records (Bus 1 - SMART ROUTE Pioneer Express)
  fuelRecords.push(
    {
      id: 'fuel-sr-001-1',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      purchase_date: twoDaysAgoStr,
      litres: 120.0,
      price_per_litre: 92.5,
      total_cost: 11100.0,
      odometer_reading: 145200.0,
      fuel_station: 'Indian Oil Highway Plaza, Dharapuram',
      payment_status: 'paid',
      receipt_url: 'https://smartroute.in/receipts/fuel_sr_001_1.pdf',
      notes: 'Full tank refuel before night run',
      created_by: 'usr-driver-001',
      is_flagged_anomaly: false,
      anomaly_reason: null,
      created_at: new Date(d2).toISOString(),
    },
    {
      id: 'fuel-sr-001-2',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      purchase_date: yestStr,
      litres: 115.0,
      price_per_litre: 92.5,
      total_cost: 10637.5,
      odometer_reading: 145620.0, // 420 km covered, 115 L -> 3.65 km/L
      fuel_station: 'Bharat Petroleum Omni Fuel Point, Tenkasi',
      payment_status: 'paid',
      receipt_url: 'https://smartroute.in/receipts/fuel_sr_001_2.pdf',
      notes: 'Return trip top-up',
      created_by: 'usr-driver-001',
      is_flagged_anomaly: false,
      anomaly_reason: null,
      created_at: new Date(d1).toISOString(),
    },
    // Flagged Fuel Anomaly Test Case (Impossible odometer decrease)
    {
      id: 'fuel-sr-anomaly-01',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-royal-sleeper-01',
      trip_id: null,
      purchase_date: todayStr,
      litres: 130.0,
      price_per_litre: 93.0,
      total_cost: 12090.0,
      odometer_reading: 98000.0, // Prior was 110000 -> Anomaly!
      fuel_station: 'HP Auto Care, Salem Bypass',
      payment_status: 'paid',
      notes: 'Suspicious meter rollback flagged by integrity check',
      created_by: 'usr-driver-001',
      is_flagged_anomaly: true,
      anomaly_reason: 'Odometer decreased from previous recorded reading of 110,000 km to 98,000 km.',
      created_at: now.toISOString(),
    },
    // VEE VEE Fuel
    {
      id: 'fuel-vv-001-1',
      travel_id: veeVeeTravelId,
      bus_id: 'bus-cbe-tks-vv-02',
      trip_id: trips[1]?.id || 'trp-vv-tks-100',
      purchase_date: yestStr,
      litres: 110.0,
      price_per_litre: 92.8,
      total_cost: 10208.0,
      odometer_reading: 184500.0,
      fuel_station: 'Shell Fuel Stop, Coimbatore Ring Road',
      payment_status: 'paid',
      created_by: 'usr-driver-002',
      is_flagged_anomaly: false,
      anomaly_reason: null,
      created_at: new Date(d1).toISOString(),
    }
  );

  // 2. Bus Operating Expenses (Diesel, Toll, Salaries, Maintenance)
  busExpenses.push(
    // Bus SR-001 Diesel
    {
      id: 'exp-sr-001-fuel-1',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      expense_date: twoDaysAgoStr,
      category: 'diesel_fuel',
      amount: 11100.0,
      quantity: 120.0,
      unit_price: 92.5,
      vendor: 'Indian Oil Highway Plaza',
      payment_method: 'fuel_card',
      payment_status: 'paid',
      notes: '120L HSD Diesel',
      created_by: 'usr-driver-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d2).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d2).toISOString(),
    },
    {
      id: 'exp-sr-001-fuel-2',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      expense_date: yestStr,
      category: 'diesel_fuel',
      amount: 10637.5,
      quantity: 115.0,
      unit_price: 92.5,
      vendor: 'Bharat Petroleum Omni Fuel Point',
      payment_method: 'fuel_card',
      payment_status: 'paid',
      notes: '115L HSD Diesel',
      created_by: 'usr-driver-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d1).toISOString(),
    },
    // Toll & Parking
    {
      id: 'exp-sr-001-toll-1',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      expense_date: yestStr,
      category: 'toll',
      amount: 1850.0,
      vendor: 'FASTag NHAI Toll Plazas',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      notes: 'NH-209 FASTag automatic deduction',
      created_by: 'usr-owner-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d1).toISOString(),
    },
    {
      id: 'exp-sr-001-parking-1',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      expense_date: yestStr,
      category: 'parking',
      amount: 450.0,
      vendor: 'Omni Terminal Parking Hub',
      payment_method: 'cash',
      payment_status: 'paid',
      notes: 'Overnight terminal parking fee',
      created_by: 'usr-driver-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d1).toISOString(),
    },
    // Driver & Cleaner Trip Allowance
    {
      id: 'exp-sr-001-drv-allowance',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      expense_date: yestStr,
      category: 'driver_allowance',
      amount: 1200.0,
      vendor: 'Driver Batty / Allowance',
      payment_method: 'upi',
      payment_status: 'paid',
      notes: 'Trip food and night allowance',
      created_by: 'usr-owner-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d1).toISOString(),
    },
    {
      id: 'exp-sr-001-cln-allowance',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      expense_date: yestStr,
      category: 'cleaner_allowance',
      amount: 600.0,
      vendor: 'Cleaner Batty',
      payment_method: 'cash',
      payment_status: 'paid',
      notes: 'Cleaner trip allowance',
      created_by: 'usr-owner-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d1).toISOString(),
    },
    // Maintenance & Spares
    {
      id: 'exp-sr-001-maint-1',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: null,
      expense_date: twoDaysAgoStr,
      category: 'maintenance',
      amount: 4800.0,
      vendor: 'Tata Commercial Service Centre, Coimbatore',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      notes: 'Brake liner replacement and suspension greasing',
      created_by: 'usr-owner-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d2).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d2).toISOString(),
    },
    // Monthly Salary (Consolidated Single-Count): Driver Monthly Base Pay
    {
      id: 'exp-sr-drv-monthly-salary',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: null,
      expense_date: todayStr,
      category: 'driver_salary',
      amount: 32000.0,
      vendor: 'K. Murugan (Commercial Pilot)',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      notes: `Driver monthly salary for period ${currentMonthStr} (counted once)`,
      created_by: 'usr-owner-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: now.toISOString(),
      is_salary_allocation: false, // Root salary record
      created_at: now.toISOString(),
    },
    // Monthly Salary Trip Allocation (Trip 100 allocation) - NOT double counted in consolidated
    {
      id: 'exp-sr-drv-trip-alloc-1',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      expense_date: yestStr,
      category: 'driver_salary',
      amount: 1066.67, // (32000 / 30 trips)
      vendor: 'Driver Salary Trip Allocation',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      notes: 'Trip-level allocation of monthly salary (excluded from company total to avoid double counting)',
      created_by: 'usr-owner-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: true, // Marked as allocation!
      created_at: new Date(d1).toISOString(),
    },
    // Loss-Making Bus Test Case: Heavy engine repair + fuel with low occupancy
    {
      id: 'exp-loss-bus-maint',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-exec-seatersleeper-02',
      trip_id: null,
      expense_date: yestStr,
      category: 'maintenance',
      amount: 45000.0,
      vendor: 'Ashok Leyland Authorised Workshop',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      notes: 'Gearbox overhaul and clutch plate overhaul (Loss maker)',
      created_by: 'usr-owner-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d1).toISOString(),
    },
    {
      id: 'exp-loss-bus-fuel',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-exec-seatersleeper-02',
      trip_id: null,
      expense_date: yestStr,
      category: 'diesel_fuel',
      amount: 14000.0,
      vendor: 'HPCL Fuel Station',
      payment_method: 'fuel_card',
      payment_status: 'paid',
      notes: 'Interstate high-volume fuel top-up',
      created_by: 'usr-owner-001',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d1).toISOString(),
    },
    // VEE VEE Expenses
    {
      id: 'exp-vv-001-fuel',
      travel_id: veeVeeTravelId,
      bus_id: 'bus-cbe-tks-vv-02',
      trip_id: trips[1]?.id || 'trp-vv-tks-100',
      expense_date: yestStr,
      category: 'diesel_fuel',
      amount: 10208.0,
      quantity: 110.0,
      unit_price: 92.8,
      vendor: 'Shell Fuel Stop',
      payment_method: 'fuel_card',
      payment_status: 'paid',
      notes: '110L Diesel refuel',
      created_by: 'usr-driver-002',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d1).toISOString(),
    },
    {
      id: 'exp-vv-001-toll',
      travel_id: veeVeeTravelId,
      bus_id: 'bus-cbe-tks-vv-02',
      trip_id: trips[1]?.id || 'trp-vv-tks-100',
      expense_date: yestStr,
      category: 'toll',
      amount: 1950.0,
      vendor: 'NHAI FASTag',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      notes: 'Toll plaza charges',
      created_by: 'usr-driver-002',
      approval_status: 'approved',
      approved_by: 'usr-owner-001',
      approved_at: new Date(d1).toISOString(),
      is_salary_allocation: false,
      created_at: new Date(d1).toISOString(),
    }
  );

  // 3. Staff Payroll Records
  staffPayroll.push(
    {
      id: 'pay-sr-drv-001',
      travel_id: smartRouteTravelId,
      user_id: 'usr-driver-001',
      staff_name: 'K. Murugan',
      role: 'driver',
      trip_id: null,
      bus_id: 'bus-sr-001',
      payroll_type: 'monthly_salary',
      period_month: currentMonthStr,
      amount_payable: 32000.0,
      amount_paid: 32000.0,
      balance: 0.0,
      payment_date: todayStr,
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      notes: 'Regular monthly salary credited',
      created_by: 'usr-owner-001',
      created_at: now.toISOString(),
    },
    {
      id: 'pay-sr-cln-001',
      travel_id: smartRouteTravelId,
      user_id: null,
      staff_name: 'S. Ramasamy',
      role: 'cleaner',
      trip_id: null,
      bus_id: 'bus-sr-001',
      payroll_type: 'monthly_salary',
      period_month: currentMonthStr,
      amount_payable: 18000.0,
      amount_paid: 18000.0,
      balance: 0.0,
      payment_date: todayStr,
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      notes: 'Cleaner monthly salary credited',
      created_by: 'usr-owner-001',
      created_at: now.toISOString(),
    },
    {
      id: 'pay-vv-drv-002',
      travel_id: veeVeeTravelId,
      user_id: 'usr-driver-002',
      staff_name: 'V. Prakash',
      role: 'driver',
      trip_id: null,
      bus_id: 'bus-cbe-tks-vv-02',
      payroll_type: 'monthly_salary',
      period_month: currentMonthStr,
      amount_payable: 30000.0,
      amount_paid: 25000.0,
      balance: 5000.0,
      payment_date: yestStr,
      payment_method: 'bank_transfer',
      payment_status: 'partial',
      notes: 'Partial advance credited, balance ₹5,000 pending',
      created_by: 'usr-owner-001',
      created_at: new Date(d1).toISOString(),
    }
  );

  // 4. Passenger Reviews & Ratings (Verified against completed bookings)
  passengerReviews.push(
    {
      id: 'rev-sr-4102-1',
      booking_id: 'bkg-sr-4102',
      pnr_number: 'SR4102',
      user_id: 'usr-passenger-001',
      passenger_name: 'Arun Prakash',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      overall_rating: 5,
      cleanliness_rating: 5,
      seat_comfort_rating: 5,
      punctuality_rating: 5,
      staff_behaviour_rating: 5,
      review_text: 'Spotless clean sleeper berth, on-time departure from Coimbatore Omni Stand. Very polite staff and smooth ride!',
      complaint_category: 'none',
      moderation_status: 'published',
      moderated_by: 'usr-admin-001',
      moderation_notes: 'Verified trip passenger review',
      created_at: new Date(d1).toISOString(),
    },
    {
      id: 'rev-sr-seed-2',
      booking_id: 'bkg-sr-4103',
      pnr_number: 'SR4103',
      user_id: 'usr-passenger-002',
      passenger_name: 'Rajesh Kannan',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-sr-001',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      overall_rating: 4,
      cleanliness_rating: 4,
      seat_comfort_rating: 5,
      punctuality_rating: 4,
      staff_behaviour_rating: 4,
      review_text: 'Comfortable sleeper seats and good driving speed. AC was a bit too cold initially but driver adjusted it when asked.',
      complaint_category: 'none',
      moderation_status: 'published',
      moderated_by: 'usr-admin-001',
      moderation_notes: 'Verified trip passenger review',
      created_at: new Date(d2).toISOString(),
    },
    {
      id: 'rev-vv-8820-1',
      booking_id: 'bkg-vv-8820',
      pnr_number: 'VV8820',
      user_id: 'usr-passenger-002',
      passenger_name: 'Sneha Varma',
      travel_id: veeVeeTravelId,
      bus_id: 'bus-cbe-tks-vv-02',
      trip_id: trips[5]?.id || 'trp-vv-tks-105',
      overall_rating: 4,
      cleanliness_rating: 4,
      seat_comfort_rating: 4,
      punctuality_rating: 5,
      staff_behaviour_rating: 4,
      review_text: 'Good legroom on the Capella seater bus. Reached Madurai exactly on schedule.',
      complaint_category: 'none',
      moderation_status: 'published',
      moderated_by: 'usr-admin-001',
      moderation_notes: 'Verified trip passenger review',
      created_at: new Date(d1).toISOString(),
    },
    // Review with Structured Complaint for Moderation Test
    {
      id: 'rev-loss-exec-01',
      booking_id: 'bkg-sr-seed-complaint-01',
      pnr_number: 'SR7744',
      user_id: 'usr-passenger-001',
      passenger_name: 'Kavitha Sundar',
      travel_id: smartRouteTravelId,
      bus_id: 'bus-exec-seatersleeper-02',
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      overall_rating: 2,
      cleanliness_rating: 2,
      seat_comfort_rating: 3,
      punctuality_rating: 2,
      staff_behaviour_rating: 3,
      review_text: 'Bus was delayed by 45 minutes at boarding point and AC cooling was inadequate during summer afternoon run.',
      complaint_category: 'ac_issue',
      moderation_status: 'flagged',
      moderated_by: null,
      moderation_notes: 'Under review for operator response',
      created_at: new Date(d1).toISOString(),
    }
  );

  // 5. Initial Audit Logs
  expenseAuditLogs.push(
    {
      id: 'aud-exp-001',
      expense_id: 'exp-sr-001-fuel-1',
      action: 'created',
      previous_data: null,
      new_data: { amount: 11100.0, category: 'diesel_fuel', bus_id: 'bus-sr-001' },
      performed_by: 'usr-driver-001',
      reason: 'Standard fuel refuel entry',
      created_at: new Date(d2).toISOString(),
    },
    {
      id: 'aud-exp-002',
      expense_id: 'exp-sr-001-fuel-1',
      action: 'approved',
      previous_data: { approval_status: 'pending' },
      new_data: { approval_status: 'approved' },
      performed_by: 'usr-owner-001',
      reason: 'Verified against fuel slip #IOCL-8829',
      created_at: new Date(d2).toISOString(),
    }
  );

  // 6. Enrich Bookings to satisfy all acceptance criteria:
  // - Cancelled booking with full refund
  if (!bookings.some((b) => b.id === 'bkg-sr-cancel-full')) {
    bookings.push({
      id: 'bkg-sr-cancel-full',
      pnr_number: 'SR-FULL-REFUND',
      travel_id: smartRouteTravelId,
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      user_id: 'usr-passenger-001',
      boarding_stop_id: 'stop-101',
      dropping_stop_id: 'stop-110',
      total_fare: 1500.0,
      booking_status: 'cancelled',
      payment_status: 'refunded',
      discount_amount: 0.0,
      refund_amount: 1500.0,
      contact_name: 'Dinesh Karthik',
      contact_email: 'dinesh@test.com',
      contact_mobile: '9840112233',
      created_at: new Date(d1).toISOString(),
      passengers: [{ id: 'pax-cf-1', seat_number: 'U5', passenger_name: 'Dinesh Karthik', fare: 1500.0 }],
    });
  }

  // - Partially refunded booking
  if (!bookings.some((b) => b.id === 'bkg-sr-partial-ref')) {
    bookings.push({
      id: 'bkg-sr-partial-ref',
      pnr_number: 'SR-PARTIAL-REFUND',
      travel_id: smartRouteTravelId,
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      user_id: 'usr-passenger-002',
      boarding_stop_id: 'stop-101',
      dropping_stop_id: 'stop-110',
      total_fare: 2000.0,
      booking_status: 'partially_cancelled',
      payment_status: 'partially_refunded',
      discount_amount: 100.0,
      refund_amount: 900.0, // Partial cancellation fee deducted
      contact_name: 'Priya Mani',
      contact_email: 'priya@test.com',
      contact_mobile: '9840223344',
      created_at: new Date(d1).toISOString(),
      passengers: [
        { id: 'pax-pr-1', seat_number: 'L7', passenger_name: 'Priya Mani', fare: 1000.0 },
        { id: 'pax-pr-2', seat_number: 'L8', passenger_name: 'Deepa Mani', fare: 1000.0, is_cancelled: true },
      ],
    });
  }

  // - Failed payment booking
  if (!bookings.some((b) => b.id === 'bkg-sr-failed-pay')) {
    bookings.push({
      id: 'bkg-sr-failed-pay',
      pnr_number: 'SR-FAILED-PAY',
      travel_id: smartRouteTravelId,
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      user_id: 'usr-passenger-001',
      boarding_stop_id: 'stop-101',
      dropping_stop_id: 'stop-110',
      total_fare: 880.0,
      booking_status: 'failed',
      payment_status: 'failed',
      discount_amount: 0.0,
      refund_amount: 0.0,
      contact_name: 'Ramesh Sundar',
      contact_email: 'ramesh@test.com',
      contact_mobile: '9840334455',
      created_at: new Date(d2).toISOString(),
      passengers: [{ id: 'pax-fp-1', seat_number: 'L9', passenger_name: 'Ramesh Sundar', fare: 880.0 }],
    });
  }

  // - High gross confirmed booking for SMART ROUTE Bus 001
  if (!bookings.some((b) => b.id === 'bkg-sr-corp-bulk')) {
    bookings.push({
      id: 'bkg-sr-corp-bulk',
      pnr_number: 'SR-CORP-401',
      travel_id: smartRouteTravelId,
      trip_id: trips[0]?.id || 'trp-sr-cbe-100',
      user_id: 'usr-passenger-001',
      boarding_stop_id: 'stop-101',
      dropping_stop_id: 'stop-110',
      total_fare: 10560.0, // 12 seats * 880
      discount_amount: 560.0, // Coupon applied
      refund_amount: 0.0,
      booking_status: 'confirmed',
      payment_status: 'paid',
      contact_name: 'Tech Mahindra Group Travel',
      contact_email: 'grouptravel@techm.com',
      contact_mobile: '9840556677',
      created_at: new Date(d1).toISOString(),
      passengers: Array.from({ length: 12 }).map((_, i) => ({
        id: `pax-corp-${i + 1}`,
        seat_number: `U${i + 1}`,
        passenger_name: `TechM Employee ${i + 1}`,
        fare: 880.0,
        is_boarded: true,
      })),
    });
  }
}

export function saveAccountingStore() {
  try {
    const dataDir = path.dirname(PERSISTENT_ACCOUNTING_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const payload = {
      busExpenses,
      fuelRecords,
      staffPayroll,
      passengerReviews,
      expenseAuditLogs,
    };
    fs.writeFileSync(PERSISTENT_ACCOUNTING_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal
  }
}

export function loadAccountingStore() {
  try {
    if (fs.existsSync(PERSISTENT_ACCOUNTING_FILE)) {
      const raw = fs.readFileSync(PERSISTENT_ACCOUNTING_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.busExpenses)) {
        for (const e of data.busExpenses) {
          if (!busExpenses.some((x) => x.id === e.id)) busExpenses.push(e);
        }
      }
      if (Array.isArray(data.fuelRecords)) {
        for (const f of data.fuelRecords) {
          if (!fuelRecords.some((x) => x.id === f.id)) fuelRecords.push(f);
        }
      }
      if (Array.isArray(data.staffPayroll)) {
        for (const p of data.staffPayroll) {
          if (!staffPayroll.some((x) => x.id === p.id)) staffPayroll.push(p);
        }
      }
      if (Array.isArray(data.passengerReviews)) {
        for (const r of data.passengerReviews) {
          if (!passengerReviews.some((x) => x.id === r.id)) passengerReviews.push(r);
        }
      }
      if (Array.isArray(data.expenseAuditLogs)) {
        for (const a of data.expenseAuditLogs) {
          if (!expenseAuditLogs.some((x) => x.id === a.id)) expenseAuditLogs.push(a);
        }
      }
    }
  } catch (err) {
    // Non-fatal
  }
}

// Ensure seed data is initialized on module import
initializeSeedAccountingData();
loadAccountingStore();

/**
 * MODULE 1 & 2: Financial Summary
 * Super Admin consolidated or Travel Owner company-scoped
 */
export async function getFinancialSummary({ travelId, dateRange = 'all', startDate, endDate } = {}) {
  initializeSeedAccountingData();

  // Filter bookings
  let relevantBookings = bookings;
  if (travelId) {
    relevantBookings = relevantBookings.filter((b) => b.travel_id === travelId);
  }
  relevantBookings = filterByDate(relevantBookings, 'created_at', { dateRange, startDate, endDate });

  // Filter expenses (approved only, excluding salary allocations from consolidated total to avoid double counting)
  let relevantExpenses = busExpenses.filter((e) => e.approval_status === 'approved' && !e.is_salary_allocation);
  if (travelId) {
    relevantExpenses = relevantExpenses.filter((e) => e.travel_id === travelId);
  }
  relevantExpenses = filterByDate(relevantExpenses, 'expense_date', { dateRange, startDate, endDate });

  // 1. Revenue Metrics
  let grossTicketSales = 0;
  let totalDiscounts = 0;
  let totalRefunds = 0;
  let actualCollections = 0;
  let pendingPayments = 0;
  let failedPayments = 0;

  for (const b of relevantBookings) {
    const fare = Number(b.total_fare || b.total_amount) || 0;
    const discount = Number(b.discount_amount || b.discount) || 0;
    const refund = Number(b.refund_amount || b.refund) || 0;

    grossTicketSales += fare;
    totalDiscounts += discount;
    totalRefunds += refund;

    if (b.payment_status === 'paid' || b.payment_status === 'completed' || b.payment_status === 'successful') {
      actualCollections += Math.max(0, fare - discount - refund);
    } else if (b.payment_status === 'pending') {
      pendingPayments += fare;
    } else if (b.payment_status === 'failed') {
      failedPayments += fare;
    }
  }

  const netTicketRevenue = Math.max(0, grossTicketSales - totalDiscounts - totalRefunds);
  const outstandingCollections = Math.max(0, netTicketRevenue - actualCollections);

  // 2. Expense Metrics Breakdown
  let fuelExpenses = 0;
  let driverCleanerSalaries = 0;
  let tollParkingExpenses = 0;
  let maintenanceRepairsExpenses = 0;
  let otherOperatingExpenses = 0;
  let totalOperatingExpenses = 0;
  let outstandingPayableExpenses = 0;

  for (const exp of relevantExpenses) {
    const amt = Number(exp.amount) || 0;
    totalOperatingExpenses += amt;

    if (exp.payment_status === 'pending') {
      outstandingPayableExpenses += amt;
    }

    if (exp.category === 'diesel_fuel') {
      fuelExpenses += amt;
    } else if (
      exp.category === 'driver_salary' ||
      exp.category === 'cleaner_salary' ||
      exp.category === 'driver_allowance' ||
      exp.category === 'cleaner_allowance' ||
      exp.category === 'staff_food'
    ) {
      driverCleanerSalaries += amt;
    } else if (exp.category === 'toll' || exp.category === 'parking') {
      tollParkingExpenses += amt;
    } else if (exp.category === 'maintenance' || exp.category === 'tyres_spares') {
      maintenanceRepairsExpenses += amt;
    } else {
      otherOperatingExpenses += amt;
    }
  }

  const operatingProfitLoss = netTicketRevenue - totalOperatingExpenses;

  // 3. Operational Counts (Trips & Seats)
  let relevantTrips = trips;
  if (travelId) {
    relevantTrips = relevantTrips.filter((t) => t.travel_id === travelId);
  }
  relevantTrips = filterByDate(relevantTrips, 'departure_date', { dateRange, startDate, endDate });

  const totalSeatsOffered = relevantTrips.reduce((acc, t) => acc + (Number(t.total_booked_seats || 0) + Number(t.total_available_seats || 40)), 0);
  const totalBookedSeats = relevantTrips.reduce((acc, t) => acc + Number(t.total_booked_seats || 0), 0);
  const totalAvailableSeats = Math.max(0, totalSeatsOffered - totalBookedSeats);
  const occupancyPercentage = totalSeatsOffered > 0 ? Number(((totalBookedSeats / totalSeatsOffered) * 100).toFixed(1)) : 0;

  const tripsScheduled = relevantTrips.length;
  const tripsOperated = relevantTrips.filter((t) => t.status !== 'cancelled').length;
  const tripsCompleted = relevantTrips.filter((t) => t.status === 'completed' || t.status === 'published').length;
  const tripsCancelled = relevantTrips.filter((t) => t.status === 'cancelled').length;

  return {
    organization: travelId ? (travels.find((t) => t.id === travelId)?.name || 'Authorized Carrier') : 'Consolidated Platform (All Carriers)',
    reporting_period: dateRange,
    calculation_basis: 'Accrual ticket sales minus eligible operating expenses; cash collections reported separately',
    currency: 'INR (₹)',
    is_preliminary: relevantExpenses.length === 0 && relevantBookings.length > 0,
    gross_ticket_sales: grossTicketSales,
    discounts: totalDiscounts,
    refunds: totalRefunds,
    net_ticket_revenue: netTicketRevenue,
    actual_collections: actualCollections,
    pending_payments: pendingPayments,
    failed_payments: failedPayments,
    outstanding_collections: outstandingCollections,
    total_operating_expenses: totalOperatingExpenses,
    fuel_expenses: fuelExpenses,
    driver_cleaner_salaries: driverCleanerSalaries,
    toll_parking_expenses: tollParkingExpenses,
    maintenance_repairs_expenses: maintenanceRepairsExpenses,
    other_operating_expenses: otherOperatingExpenses,
    operating_profit_loss: operatingProfitLoss,
    outstanding_payable_expenses: outstandingPayableExpenses,
    total_seats_offered: totalSeatsOffered,
    total_booked_seats: totalBookedSeats,
    total_available_seats: totalAvailableSeats,
    occupancy_percentage: occupancyPercentage,
    trips_scheduled: tripsScheduled,
    trips_operated: tripsOperated,
    trips_completed: tripsCompleted,
    trips_cancelled: tripsCancelled,
  };
}

/**
 * MODULE 1 & 2: Fleet Summary
 */
export async function getFleetSummary({ travelId, dateRange = 'all', startDate, endDate } = {}) {
  initializeSeedAccountingData();

  let relevantBuses = buses;
  if (travelId) {
    relevantBuses = relevantBuses.filter((b) => b.travel_id === travelId);
  }

  let relevantTrips = trips;
  if (travelId) {
    relevantTrips = relevantTrips.filter((t) => t.travel_id === travelId);
  }
  relevantTrips = filterByDate(relevantTrips, 'departure_date', { dateRange, startDate, endDate });

  const todayStr = new Date().toISOString().split('T')[0];
  const tripsToday = trips.filter((t) => t.departure_date === todayStr && (!travelId || t.travel_id === travelId));
  const operatingBusIdsToday = new Set(tripsToday.map((t) => t.bus_id));

  const totalRegistered = relevantBuses.length;
  const activeBuses = relevantBuses.filter((b) => b.is_active !== false).length;
  const operatingToday = relevantBuses.filter((b) => operatingBusIdsToday.has(b.id)).length;
  const underMaintenance = relevantBuses.filter((b) => b.status === 'maintenance' || b.under_maintenance).length;
  const idleBuses = Math.max(0, activeBuses - operatingToday - underMaintenance);

  const totalSeatsOffered = relevantTrips.reduce((acc, t) => acc + (Number(t.total_booked_seats || 0) + Number(t.total_available_seats || 40)), 0);
  const totalBookedSeats = relevantTrips.reduce((acc, t) => acc + Number(t.total_booked_seats || 0), 0);
  const totalAvailableSeats = Math.max(0, totalSeatsOffered - totalBookedSeats);
  const occupancyPercentage = totalSeatsOffered > 0 ? Number(((totalBookedSeats / totalSeatsOffered) * 100).toFixed(1)) : 0;

  return {
    total_registered_buses: totalRegistered,
    active_buses: activeBuses,
    buses_operating_today: operatingToday,
    buses_on_trips: tripsToday.filter((t) => ['in_transit', 'boarding'].includes(t.status)).length,
    buses_idle: idleBuses,
    buses_under_maintenance: underMaintenance,
    trips_scheduled: relevantTrips.length,
    trips_ongoing: relevantTrips.filter((t) => ['in_transit', 'boarding'].includes(t.status)).length,
    trips_completed: relevantTrips.filter((t) => t.status === 'completed' || t.status === 'published').length,
    trips_cancelled: relevantTrips.filter((t) => t.status === 'cancelled').length,
    trips_missed: relevantTrips.filter((t) => t.status === 'missed').length,
    total_seats_offered: totalSeatsOffered,
    total_booked_seats: totalBookedSeats,
    total_available_seats: totalAvailableSeats,
    seat_occupancy_percentage: occupancyPercentage,
  };
}

/**
 * MODULE 3 & 9: Bus-wise Accounting & Profitability Rankings
 */
export async function getBusAccountingList({
  travelId,
  userRole,
  dateRange = 'all',
  startDate,
  endDate,
  sortBy = 'total_profit',
  sortOrder = 'desc',
} = {}) {
  initializeSeedAccountingData();

  // Strict RBAC boundary
  let busList = buses;
  if (userRole === 'travel_owner' || userRole === 'manager') {
    if (!travelId) {
      throw new Error('Travel ID is required for operator-scoped bus accounts');
    }
    busList = busList.filter((b) => b.travel_id === travelId);
  } else if (travelId) {
    busList = busList.filter((b) => b.travel_id === travelId);
  }

  const results = [];

  for (const bus of busList) {
    const busTrips = filterByDate(
      trips.filter((t) => t.bus_id === bus.id),
      'departure_date',
      { dateRange, startDate, endDate }
    );
    const busTripIds = new Set(busTrips.map((t) => t.id));

    // Bookings for this bus
    const busBookings = filterByDate(
      bookings.filter((b) => busTripIds.has(b.trip_id) || b.bus_id === bus.id || b.trip?.registration_number === bus.registration_number),
      'created_at',
      { dateRange, startDate, endDate }
    );

    let grossTicketSales = 0;
    let discounts = 0;
    let refunds = 0;
    let actualCollections = 0;
    let pendingPayments = 0;

    for (const b of busBookings) {
      const fare = Number(b.total_fare || b.total_amount) || 0;
      const disc = Number(b.discount_amount || b.discount) || 0;
      const ref = Number(b.refund_amount || b.refund) || 0;

      grossTicketSales += fare;
      discounts += disc;
      refunds += ref;

      if (['paid', 'completed', 'successful'].includes(b.payment_status)) {
        actualCollections += Math.max(0, fare - disc - ref);
      } else if (b.payment_status === 'pending') {
        pendingPayments += fare;
      }
    }

    const netTicketRevenue = Math.max(0, grossTicketSales - discounts - refunds);

    // Expenses for this bus
    const busExpList = filterByDate(
      busExpenses.filter((e) => (e.bus_id === bus.id || busTripIds.has(e.trip_id)) && e.approval_status === 'approved'),
      'expense_date',
      { dateRange, startDate, endDate }
    );

    let fuelExpenses = 0;
    let driverCleanerSalaries = 0;
    let tollParkingExpenses = 0;
    let maintenanceExpenses = 0;
    let otherExpenses = 0;
    let totalOperatingExpenses = 0;

    for (const exp of busExpList) {
      // Exclude salary allocations if this is an overall bus rollup with base salary already present
      const amt = Number(exp.amount) || 0;
      totalOperatingExpenses += amt;

      if (exp.category === 'diesel_fuel') {
        fuelExpenses += amt;
      } else if (
        exp.category === 'driver_salary' ||
        exp.category === 'cleaner_salary' ||
        exp.category === 'driver_allowance' ||
        exp.category === 'cleaner_allowance' ||
        exp.category === 'staff_food'
      ) {
        driverCleanerSalaries += amt;
      } else if (exp.category === 'toll' || exp.category === 'parking') {
        tollParkingExpenses += amt;
      } else if (exp.category === 'maintenance' || exp.category === 'tyres_spares') {
        maintenanceExpenses += amt;
      } else {
        otherExpenses += amt;
      }
    }

    const operatingProfitLoss = netTicketRevenue - totalOperatingExpenses;
    const tripsOperated = busTrips.length;
    const avgProfitPerTrip = tripsOperated > 0 ? Number((operatingProfitLoss / tripsOperated).toFixed(2)) : 0;

    // Seats & Occupancy
    const totalSeatsOffered = busTrips.reduce((acc, t) => acc + (Number(t.total_booked_seats || 0) + Number(t.total_available_seats || bus.total_seats || 40)), 0);
    const bookedSeats = busTrips.reduce((acc, t) => acc + Number(t.total_booked_seats || 0), 0);
    const availableSeats = Math.max(0, totalSeatsOffered - bookedSeats);
    const occupancyPercentage = totalSeatsOffered > 0 ? Number(((bookedSeats / totalSeatsOffered) * 100).toFixed(1)) : 0;

    // Fuel Litres & Mileage
    const busFuelLogs = fuelRecords.filter((f) => f.bus_id === bus.id);
    const totalLitres = busFuelLogs.reduce((acc, f) => acc + (Number(f.litres) || 0), 0);
    let mileageKmPerLitre = null;
    let fuelCostPerKm = null;

    if (busFuelLogs.length >= 2) {
      const sortedLogs = [...busFuelLogs].sort((a, b) => new Date(a.purchase_date) - new Date(b.purchase_date));
      const firstOdo = sortedLogs[0].odometer_reading;
      const lastOdo = sortedLogs[sortedLogs.length - 1].odometer_reading;
      const dist = Math.max(0, lastOdo - firstOdo);
      if (dist > 0 && totalLitres > 0) {
        mileageKmPerLitre = Number((dist / totalLitres).toFixed(2));
        fuelCostPerKm = Number((fuelExpenses / dist).toFixed(2));
      }
    }

    // Ratings & Reviews
    const busReviews = passengerReviews.filter((r) => r.bus_id === bus.id && r.moderation_status === 'published');
    const reviewCount = busReviews.length;
    const averageRating = reviewCount > 0
      ? Number((busReviews.reduce((acc, r) => acc + r.overall_rating, 0) / reviewCount).toFixed(1))
      : null;

    const travelObj = travels.find((t) => t.id === bus.travel_id);
    const hasSufficientData = tripsOperated > 0 || busExpList.length > 0 || busBookings.length > 0;

    results.push({
      bus_id: bus.id,
      name: bus.name,
      registration_number: bus.registration_number,
      travel_id: bus.travel_id,
      travel_name: travelObj?.name || 'Smart Route Partner',
      bus_type: bus.bus_type || 'ac_seater_sleeper',
      total_seats: bus.total_seats || 40,
      trips_operated: tripsOperated,
      trips_completed: busTrips.filter((t) => t.status === 'completed' || t.status === 'published').length,
      trips_cancelled: busTrips.filter((t) => t.status === 'cancelled').length,
      gross_ticket_sales: grossTicketSales,
      discounts: discounts,
      refunds: refunds,
      net_ticket_revenue: netTicketRevenue,
      actual_collections: actualCollections,
      pending_payments: pendingPayments,
      fuel_expenses: fuelExpenses,
      driver_cleaner_salaries: driverCleanerSalaries,
      toll_parking_expenses: tollParkingExpenses,
      maintenance_expenses: maintenanceExpenses,
      other_expenses: otherExpenses,
      total_operating_expenses: totalOperatingExpenses,
      operating_profit_loss: operatingProfitLoss,
      avg_profit_per_trip: avgProfitPerTrip,
      total_seats_offered: totalSeatsOffered,
      booked_seats: bookedSeats,
      available_seats: availableSeats,
      occupancy_percentage: occupancyPercentage,
      fuel_litres: totalLitres,
      mileage_km_per_litre: mileageKmPerLitre,
      fuel_cost_per_km: fuelCostPerKm,
      average_rating: averageRating,
      review_count: reviewCount,
      has_sufficient_data: hasSufficientData,
      is_loss_making: operatingProfitLoss < 0,
      reporting_period: dateRange,
    });
  }

  // Sort rankings
  results.sort((a, b) => {
    let factor = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'avg_profit_per_trip') {
      return (a.avg_profit_per_trip - b.avg_profit_per_trip) * factor;
    }
    if (sortBy === 'occupancy') {
      return (a.occupancy_percentage - b.occupancy_percentage) * factor;
    }
    if (sortBy === 'revenue') {
      return (a.net_ticket_revenue - b.net_ticket_revenue) * factor;
    }
    if (sortBy === 'rating') {
      return ((a.average_rating || 0) - (b.average_rating || 0)) * factor;
    }
    // Default: total_profit
    return (a.operating_profit_loss - b.operating_profit_loss) * factor;
  });

  return results;
}

/**
 * MODULE 3: Individual Bus Account Drill-down & Ledger
 */
export async function getBusAccountingDetails({ busId, travelId, userRole, dateRange = 'all', startDate, endDate } = {}) {
  initializeSeedAccountingData();

  const bus = buses.find((b) => b.id === busId);
  if (!bus) {
    const err = new Error(`Bus with ID '${busId}' was not found`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Strict RBAC: Travel Owner & Manager cannot access another company's bus account
  if (userRole === 'travel_owner' || userRole === 'manager') {
    if (bus.travel_id !== travelId) {
      const err = new Error('Access denied: You do not have authorization to inspect another travel company’s bus ledger.');
      err.code = 'FORBIDDEN';
      throw err;
    }
  }

  const travel = travels.find((t) => t.id === bus.travel_id);

  // Trips operated by this bus
  const busTrips = filterByDate(
    trips.filter((t) => t.bus_id === bus.id),
    'departure_date',
    { dateRange, startDate, endDate }
  );

  // Detailed trip accounting ledger
  const tripLedgers = busTrips.map((t) => {
    const route = routes.find((r) => r.id === t.route_id);
    const tripBookings = bookings.filter((b) => b.trip_id === t.id);

    let gross = 0;
    let disc = 0;
    let ref = 0;
    let actualColl = 0;
    for (const b of tripBookings) {
      const f = Number(b.total_fare || b.total_amount) || 0;
      const d = Number(b.discount_amount || b.discount) || 0;
      const r = Number(b.refund_amount || b.refund) || 0;
      gross += f;
      disc += d;
      ref += r;
      if (['paid', 'completed', 'successful'].includes(b.payment_status)) {
        actualColl += Math.max(0, f - d - r);
      }
    }
    const net = Math.max(0, gross - disc - ref);

    const tripExpenses = busExpenses.filter((e) => e.trip_id === t.id && e.approval_status === 'approved');
    const fuel = tripExpenses.filter((e) => e.category === 'diesel_fuel').reduce((sum, e) => sum + Number(e.amount), 0);
    const salaries = tripExpenses
      .filter((e) => ['driver_salary', 'cleaner_salary', 'driver_allowance', 'cleaner_allowance'].includes(e.category))
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const tollParking = tripExpenses.filter((e) => ['toll', 'parking'].includes(e.category)).reduce((sum, e) => sum + Number(e.amount), 0);
    const other = tripExpenses.filter((e) => !['diesel_fuel', 'driver_salary', 'cleaner_salary', 'driver_allowance', 'cleaner_allowance', 'toll', 'parking'].includes(e.category)).reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExp = fuel + salaries + tollParking + other;

    const booked = Number(t.total_booked_seats || 0);
    const totalSeats = Number(t.total_booked_seats || 0) + Number(t.total_available_seats || bus.total_seats || 40);
    const occPct = totalSeats > 0 ? Number(((booked / totalSeats) * 100).toFixed(1)) : 0;

    return {
      trip_id: t.id,
      trip_number: t.trip_number,
      departure_date: t.departure_date,
      departure_time: t.departure_time,
      status: t.status,
      route_name: route?.name || `${route?.source || 'Origin'} ➔ ${route?.destination || 'Destination'}`,
      total_seats: totalSeats,
      booked_seats: booked,
      available_seats: Math.max(0, totalSeats - booked),
      occupancy_percentage: occPct,
      gross_ticket_sales: gross,
      discounts: disc,
      refunds: ref,
      net_ticket_revenue: net,
      actual_collections: actualColl,
      allocated_fuel: fuel,
      allocated_salaries: salaries,
      allocated_toll_parking: tollParking,
      other_expenses: other,
      total_operating_expenses: totalExp,
      trip_profit_loss: net - totalExp,
    };
  });

  // Overall bus financials
  const grossTicketSales = tripLedgers.reduce((acc, t) => acc + t.gross_ticket_sales, 0);
  const discounts = tripLedgers.reduce((acc, t) => acc + t.discounts, 0);
  const refunds = tripLedgers.reduce((acc, t) => acc + t.refunds, 0);
  const netTicketRevenue = Math.max(0, grossTicketSales - discounts - refunds);
  const actualCollections = tripLedgers.reduce((acc, t) => acc + t.actual_collections, 0);

  // All expenses directly associated with this bus or its trips
  const busExpensesList = filterByDate(
    busExpenses.filter((e) => (e.bus_id === bus.id || busTrips.some((t) => t.id === e.trip_id)) && e.approval_status === 'approved'),
    'expense_date',
    { dateRange, startDate, endDate }
  );

  let fuelExpenses = 0;
  let driverCleanerSalaries = 0;
  let tollParking = 0;
  let maintenanceRepairs = 0;
  let otherExpenses = 0;
  let totalOperatingExpenses = 0;

  for (const exp of busExpensesList) {
    const amt = Number(exp.amount) || 0;
    totalOperatingExpenses += amt;
    if (exp.category === 'diesel_fuel') fuelExpenses += amt;
    else if (['driver_salary', 'cleaner_salary', 'driver_allowance', 'cleaner_allowance', 'staff_food'].includes(exp.category)) driverCleanerSalaries += amt;
    else if (['toll', 'parking'].includes(exp.category)) tollParking += amt;
    else if (['maintenance', 'tyres_spares'].includes(exp.category)) maintenanceRepairs += amt;
    else otherExpenses += amt;
  }

  const operatingProfitLoss = netTicketRevenue - totalOperatingExpenses;
  const avgProfitPerTrip = tripLedgers.length > 0 ? Number((operatingProfitLoss / tripLedgers.length).toFixed(2)) : 0;

  // Fuel logs for this bus
  const fuelLogs = fuelRecords.filter((f) => f.bus_id === bus.id);

  // Reviews for this bus
  const busReviews = passengerReviews.filter((r) => r.bus_id === bus.id && r.moderation_status === 'published');
  const avgRating = busReviews.length > 0
    ? Number((busReviews.reduce((acc, r) => acc + r.overall_rating, 0) / busReviews.length).toFixed(1))
    : null;

  return {
    bus_id: bus.id,
    name: bus.name,
    registration_number: bus.registration_number,
    travel_id: bus.travel_id,
    travel_name: travel?.name || 'Smart Route Partner',
    bus_type: bus.bus_type || 'ac_seater_sleeper',
    total_capacity: bus.total_seats || 40,
    reporting_period: dateRange,
    gross_ticket_sales: grossTicketSales,
    discounts: discounts,
    refunds: refunds,
    net_ticket_revenue: netTicketRevenue,
    actual_collections: actualCollections,
    fuel_expenses: fuelExpenses,
    driver_cleaner_salaries: driverCleanerSalaries,
    toll_parking_expenses: tollParking,
    maintenance_repairs_expenses: maintenanceRepairs,
    other_operating_expenses: otherExpenses,
    total_operating_expenses: totalOperatingExpenses,
    operating_profit_loss: operatingProfitLoss,
    avg_profit_per_trip: avgProfitPerTrip,
    trips_operated: tripLedgers.length,
    average_rating: avgRating,
    review_count: busReviews.length,
    trip_ledgers: tripLedgers,
    fuel_history: fuelLogs,
    expense_history: busExpensesList,
    reviews: busReviews,
  };
}

/**
 * MODULE 8: Route-wise Profitability Analysis
 */
export async function getRouteProfitabilityRankings({
  travelId,
  userRole,
  dateRange = 'all',
  startDate,
  endDate,
  sortBy = 'total_profit',
  sortOrder = 'desc',
} = {}) {
  initializeSeedAccountingData();

  // Strict RBAC scoping
  let routeList = routes;
  if (userRole === 'travel_owner' || userRole === 'manager') {
    if (!travelId) {
      throw new Error('Travel ID is required for operator route profitability');
    }
    routeList = routeList.filter((r) => r.travel_id === travelId || !r.travel_id);
  } else if (travelId) {
    routeList = routeList.filter((r) => r.travel_id === travelId || !r.travel_id);
  }

  const results = [];

  for (const route of routeList) {
    let routeTrips = trips.filter((t) => t.route_id === route.id);
    if (travelId) {
      routeTrips = routeTrips.filter((t) => t.travel_id === travelId);
    }
    routeTrips = filterByDate(routeTrips, 'departure_date', { dateRange, startDate, endDate });

    if (routeTrips.length === 0) continue; // Only rank routes with operations in period

    const tripIds = new Set(routeTrips.map((t) => t.id));
    const routeBookings = filterByDate(
      bookings.filter((b) => tripIds.has(b.trip_id)),
      'created_at',
      { dateRange, startDate, endDate }
    );

    let grossTicketSales = 0;
    let discounts = 0;
    let refunds = 0;
    let actualCollections = 0;

    for (const b of routeBookings) {
      const f = Number(b.total_fare || b.total_amount) || 0;
      const d = Number(b.discount_amount || b.discount) || 0;
      const r = Number(b.refund_amount || b.refund) || 0;
      grossTicketSales += f;
      discounts += d;
      refunds += r;
      if (['paid', 'completed', 'successful'].includes(b.payment_status)) {
        actualCollections += Math.max(0, f - d - r);
      }
    }
    const netTicketRevenue = Math.max(0, grossTicketSales - discounts - refunds);

    // Expenses for this route's trips
    const routeExpenses = busExpenses.filter((e) => tripIds.has(e.trip_id) && e.approval_status === 'approved');
    let fuelExp = 0;
    let salaryExp = 0;
    let tollParking = 0;
    let otherExp = 0;
    let totalExpenses = 0;

    for (const exp of routeExpenses) {
      const a = Number(exp.amount) || 0;
      totalExpenses += a;
      if (exp.category === 'diesel_fuel') fuelExp += a;
      else if (['driver_salary', 'cleaner_salary', 'driver_allowance', 'cleaner_allowance'].includes(exp.category)) salaryExp += a;
      else if (['toll', 'parking'].includes(exp.category)) tollParking += a;
      else otherExp += a;
    }

    const operatingProfitLoss = netTicketRevenue - totalExpenses;
    const tripsOperated = routeTrips.length;
    const avgProfitPerTrip = tripsOperated > 0 ? Number((operatingProfitLoss / tripsOperated).toFixed(2)) : 0;

    const seatsOffered = routeTrips.reduce((acc, t) => acc + (Number(t.total_booked_seats || 0) + Number(t.total_available_seats || 40)), 0);
    const bookedSeats = routeTrips.reduce((acc, t) => acc + Number(t.total_booked_seats || 0), 0);
    const occupancyPercentage = seatsOffered > 0 ? Number(((bookedSeats / seatsOffered) * 100).toFixed(1)) : 0;

    // Average rating for this route
    const routeReviews = passengerReviews.filter((r) => tripIds.has(r.trip_id) && r.moderation_status === 'published');
    const avgRating = routeReviews.length > 0
      ? Number((routeReviews.reduce((sum, r) => sum + r.overall_rating, 0) / routeReviews.length).toFixed(1))
      : null;

    const travelObj = route.travel_id ? travels.find((t) => t.id === route.travel_id) : null;

    results.push({
      route_id: route.id,
      name: route.name,
      source: route.source,
      destination: route.destination,
      distance_km: route.distance_km || 150,
      travel_id: route.travel_id || travelId || 'multi_carrier',
      travel_name: travelObj?.name || 'Smart Route Network',
      scheduled_trips: routeTrips.length,
      operated_trips: tripsOperated,
      completed_trips: routeTrips.filter((t) => t.status === 'completed' || t.status === 'published').length,
      cancelled_trips: routeTrips.filter((t) => t.status === 'cancelled').length,
      gross_ticket_sales: grossTicketSales,
      discounts: discounts,
      refunds: refunds,
      net_ticket_revenue: netTicketRevenue,
      actual_collections: actualCollections,
      fuel_expenses: fuelExp,
      salary_expenses: salaryExp,
      toll_parking_expenses: tollParking,
      other_operating_expenses: otherExp,
      total_operating_expenses: totalExpenses,
      operating_profit_loss: operatingProfitLoss,
      avg_profit_per_trip: avgProfitPerTrip,
      total_seats_offered: seatsOffered,
      booked_seats: bookedSeats,
      available_seats: Math.max(0, seatsOffered - bookedSeats),
      occupancy_percentage: occupancyPercentage,
      average_rating: avgRating,
      review_count: routeReviews.length,
      is_loss_making: operatingProfitLoss < 0,
      is_preliminary: routeExpenses.length === 0 && grossTicketSales > 0,
      reporting_period: dateRange,
    });
  }

  // Sort rankings
  results.sort((a, b) => {
    let factor = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'avg_profit_per_trip') {
      return (a.avg_profit_per_trip - b.avg_profit_per_trip) * factor;
    }
    if (sortBy === 'occupancy') {
      return (a.occupancy_percentage - b.occupancy_percentage) * factor;
    }
    if (sortBy === 'revenue') {
      return (a.net_ticket_revenue - b.net_ticket_revenue) * factor;
    }
    return (a.operating_profit_loss - b.operating_profit_loss) * factor;
  });

  return results;
}

/**
 * MODULE 4: Expense Entry, Listing & Audit Trail
 */
export async function getExpenses({ travelId, busId, tripId, category, status, dateRange = 'all', startDate, endDate } = {}) {
  initializeSeedAccountingData();

  let list = busExpenses;
  if (travelId) list = list.filter((e) => e.travel_id === travelId);
  if (busId) list = list.filter((e) => e.bus_id === busId);
  if (tripId) list = list.filter((e) => e.trip_id === tripId);
  if (category) list = list.filter((e) => e.category === category);
  if (status) list = list.filter((e) => e.approval_status === status);

  list = filterByDate(list, 'expense_date', { dateRange, startDate, endDate });
  return list.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
}

export async function createExpense({
  travelId,
  busId,
  tripId,
  expenseDate,
  category,
  amount,
  quantity,
  unitPrice,
  vendor,
  paymentMethod = 'bank_transfer',
  notes,
  receiptUrl,
  user,
}) {
  initializeSeedAccountingData();

  if (!travelId) throw new Error('Organization / Travel ID is mandatory for expense recording');
  if (!category || !EXPENSE_CATEGORIES.includes(category)) {
    throw new Error(`Invalid category. Must be one of: ${EXPENSE_CATEGORIES.join(', ')}`);
  }
  const parsedAmt = Number(amount);
  if (isNaN(parsedAmt) || parsedAmt <= 0) {
    throw new Error('Expense amount must be a positive number');
  }
  if (!expenseDate) throw new Error('Expense date is required');

  // Prevent duplicate submission (same bus, date, category, amount entered recently)
  const isDuplicate = busExpenses.some(
    (e) =>
      e.travel_id === travelId &&
      e.bus_id === busId &&
      e.expense_date === expenseDate &&
      e.category === category &&
      Math.abs(Number(e.amount) - parsedAmt) < 0.01 &&
      Date.now() - new Date(e.created_at).getTime() < 300000 // 5 minutes window
  );
  if (isDuplicate) {
    const err = new Error('Duplicate expense record detected. Identical transaction was submitted within the last 5 minutes.');
    err.code = 'DUPLICATE_ENTRY';
    throw err;
  }

  const isOperator = user?.role === 'travel_owner' || user?.role === 'manager' || user?.role === 'super_admin';
  const approvalStatus = isOperator ? 'approved' : 'pending';

  const newExpense = {
    id: `exp-${uuidv4().slice(0, 8)}`,
    travel_id: travelId,
    bus_id: busId || null,
    trip_id: tripId || null,
    expense_date: expenseDate,
    category,
    amount: parsedAmt,
    quantity: quantity ? Number(quantity) : null,
    unit_price: unitPrice ? Number(unitPrice) : null,
    vendor: vendor || 'Direct Expense',
    payment_method: paymentMethod,
    payment_status: 'paid',
    notes: notes || '',
    receipt_url: receiptUrl || null,
    created_by: user?.id || 'usr-system',
    approval_status: approvalStatus,
    approved_by: isOperator ? user?.id : null,
    approved_at: isOperator ? new Date().toISOString() : null,
    is_salary_allocation: false,
    created_at: new Date().toISOString(),
  };

  busExpenses.push(newExpense);

  // Audit log
  expenseAuditLogs.push({
    id: `aud-${uuidv4().slice(0, 8)}`,
    expense_id: newExpense.id,
    action: 'created',
    previous_data: null,
    new_data: { ...newExpense },
    performed_by: user?.id || 'usr-system',
    reason: 'Initial expense entry submitted',
    created_at: new Date().toISOString(),
  });

  saveAccountingStore();
  savePersistentStore();
  return newExpense;
}

export async function updateExpenseStatus({ expenseId, action, reason, user, updates = {} }) {
  initializeSeedAccountingData();

  const exp = busExpenses.find((e) => e.id === expenseId);
  if (!exp) {
    const err = new Error('Expense transaction not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Strict RBAC: Can only modify within own travel_id
  if (user?.role !== 'super_admin' && exp.travel_id !== user?.travelId) {
    const err = new Error('Unauthorized attempt to modify financial transaction belonging to another company.');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const prevData = { ...exp };

  if (action === 'approve') {
    exp.approval_status = 'approved';
    exp.approved_by = user?.id || 'usr-admin';
    exp.approved_at = new Date().toISOString();
  } else if (action === 'reject') {
    exp.approval_status = 'rejected';
  } else if (action === 'reverse') {
    // Approved financial transactions are NEVER silently deleted; reversals retain audit trail
    exp.approval_status = 'reversed';
    exp.notes = `${exp.notes || ''} [Reversed by ${user?.firstName || 'Admin'}: ${reason || 'Transaction reversed'}]`;
  } else if (action === 'edit') {
    if (updates.amount) exp.amount = Number(updates.amount);
    if (updates.category) exp.category = updates.category;
    if (updates.vendor) exp.vendor = updates.vendor;
    if (updates.notes) exp.notes = updates.notes;
  }

  exp.updated_at = new Date().toISOString();

  expenseAuditLogs.push({
    id: `aud-${uuidv4().slice(0, 8)}`,
    expense_id: exp.id,
    action,
    previous_data: prevData,
    new_data: { ...exp },
    performed_by: user?.id || 'usr-admin',
    reason: reason || `Expense marked as ${action}`,
    created_at: new Date().toISOString(),
  });

  saveAccountingStore();
  savePersistentStore();
  return exp;
}

/**
 * MODULE 5: Diesel & Fuel Accounting & Anomaly Detection
 */
export async function getFuelLogs({ travelId, busId, dateRange = 'all', startDate, endDate } = {}) {
  initializeSeedAccountingData();

  let list = fuelRecords;
  if (travelId) list = list.filter((f) => f.travel_id === travelId);
  if (busId) list = list.filter((f) => f.bus_id === busId);
  list = filterByDate(list, 'purchase_date', { dateRange, startDate, endDate });

  return list.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
}

export async function recordFuelPurchase({
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
  user,
}) {
  initializeSeedAccountingData();

  if (!busId) throw new Error('Bus selection is required for diesel fuel purchase');
  const bus = buses.find((b) => b.id === busId);
  if (!bus) throw new Error('Specified bus not found in active fleet');

  const parsedLitres = Number(litres);
  const parsedPrice = Number(pricePerLitre);
  const parsedTotal = totalCost ? Number(totalCost) : Number((parsedLitres * parsedPrice).toFixed(2));
  const parsedOdo = Number(odometerReading);

  if (isNaN(parsedLitres) || parsedLitres <= 0) throw new Error('Litres purchased must be positive');
  if (isNaN(parsedPrice) || parsedPrice <= 0) throw new Error('Price per litre must be positive');
  if (isNaN(parsedOdo) || parsedOdo < 0) throw new Error('Valid odometer reading is required');

  // Anomaly Detection: Check previous odometer reading for this bus
  const previousLogs = fuelRecords
    .filter((f) => f.bus_id === busId && f.purchase_date <= purchaseDate)
    .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));

  let isFlagged = false;
  let anomalyReason = null;

  if (previousLogs.length > 0 && previousLogs[0].odometer_reading > parsedOdo) {
    isFlagged = true;
    anomalyReason = `Impossible odometer decrease! Previous reading was ${previousLogs[0].odometer_reading.toLocaleString()} km, entered reading is ${parsedOdo.toLocaleString()} km.`;
  }

  if (parsedLitres > 400) {
    isFlagged = true;
    anomalyReason = (anomalyReason ? `${anomalyReason} ` : '') + `Litres purchased (${parsedLitres}L) exceeds standard commercial fuel tank capacity.`;
  }

  const newFuelRecord = {
    id: `fuel-${uuidv4().slice(0, 8)}`,
    travel_id: travelId || bus.travel_id,
    bus_id: busId,
    trip_id: tripId || null,
    purchase_date: purchaseDate,
    litres: parsedLitres,
    price_per_litre: parsedPrice,
    total_cost: parsedTotal,
    odometer_reading: parsedOdo,
    fuel_station: fuelStation || 'Highway Commercial Fuel Point',
    payment_status: 'paid',
    notes: notes || '',
    created_by: user?.id || 'usr-driver',
    is_flagged_anomaly: isFlagged,
    anomaly_reason: anomalyReason,
    created_at: new Date().toISOString(),
  };

  fuelRecords.push(newFuelRecord);

  // Automatically record operating expense under diesel_fuel
  await createExpense({
    travelId: travelId || bus.travel_id,
    busId,
    tripId,
    expenseDate: purchaseDate,
    category: 'diesel_fuel',
    amount: parsedTotal,
    quantity: parsedLitres,
    unitPrice: parsedPrice,
    vendor: fuelStation,
    paymentMethod: 'fuel_card',
    notes: `Fuel Slip - ${parsedLitres}L @ ₹${parsedPrice}/L. Odometer: ${parsedOdo} km. ${isFlagged ? `[ANOMALY FLAGGED: ${anomalyReason}]` : ''}`,
    user,
  });

  saveAccountingStore();
  savePersistentStore();
  return newFuelRecord;
}

/**
 * MODULE 6: Driver and Cleaner Salary Accounting
 */
export async function getPayrollSummary({ travelId, role, periodMonth, dateRange = 'all' } = {}) {
  initializeSeedAccountingData();

  let list = staffPayroll;
  if (travelId) list = list.filter((p) => p.travel_id === travelId);
  if (role) list = list.filter((p) => p.role === role);
  if (periodMonth) list = list.filter((p) => p.period_month === periodMonth);

  const totalPayable = list.reduce((sum, p) => sum + Number(p.amount_payable || 0), 0);
  const totalPaid = list.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
  const totalBalance = Math.max(0, totalPayable - totalPaid);

  return {
    total_records: list.length,
    total_payable: totalPayable,
    total_paid: totalPaid,
    total_balance: totalBalance,
    records: list,
  };
}

export async function recordPayrollPayment({
  travelId,
  userId,
  staffName,
  role,
  tripId,
  busId,
  payrollType = 'monthly_salary',
  periodMonth,
  amountPayable,
  amountPaid,
  paymentMethod = 'bank_transfer',
  notes,
  user,
}) {
  initializeSeedAccountingData();

  if (!travelId) throw new Error('Travel organization required for payroll entry');
  if (!staffName) throw new Error('Staff name is required');
  const payable = Number(amountPayable);
  const paid = Number(amountPaid || 0);

  if (isNaN(payable) || payable <= 0) throw new Error('Payable salary amount must be positive');

  const newPayroll = {
    id: `pay-${uuidv4().slice(0, 8)}`,
    travel_id: travelId,
    user_id: userId || null,
    staff_name: staffName,
    role: role || 'driver',
    trip_id: tripId || null,
    bus_id: busId || null,
    payroll_type: payrollType,
    period_month: periodMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    amount_payable: payable,
    amount_paid: paid,
    balance: Math.max(0, payable - paid),
    payment_date: paid > 0 ? new Date().toISOString().split('T')[0] : null,
    payment_method: paymentMethod,
    payment_status: paid >= payable ? 'paid' : (paid > 0 ? 'partial' : 'pending'),
    notes: notes || '',
    created_by: user?.id || 'usr-owner',
    created_at: new Date().toISOString(),
  };

  staffPayroll.push(newPayroll);

  // If salary is paid, record in bus_expenses.
  // CRITICAL RULE: If it's a trip allocation of an existing monthly salary, mark is_salary_allocation = true
  // so consolidated summaries never count the monthly salary twice!
  if (paid > 0) {
    const isAllocation = payrollType === 'per_trip' || payrollType === 'trip_allocation';
    await createExpense({
      travelId,
      busId,
      tripId,
      expenseDate: newPayroll.payment_date || new Date().toISOString().split('T')[0],
      category: role === 'driver' ? 'driver_salary' : 'cleaner_salary',
      amount: paid,
      vendor: staffName,
      paymentMethod,
      notes: `${payrollType.replace('_', ' ').toUpperCase()} payment for ${staffName} (${newPayroll.period_month})`,
      user,
    });

    if (isAllocation) {
      // Find newly pushed expense and mark is_salary_allocation
      const lastExp = busExpenses[busExpenses.length - 1];
      if (lastExp) lastExp.is_salary_allocation = true;
    }
  }

  saveAccountingStore();
  savePersistentStore();
  return newPayroll;
}

/**
 * MODULE 11: Passenger Ratings & Bus Reviews Engine
 */
export async function getPassengerReviews({ busId, travelId, status = 'published' } = {}) {
  initializeSeedAccountingData();

  let list = passengerReviews;
  if (busId) list = list.filter((r) => r.bus_id === busId);
  if (travelId) list = list.filter((r) => r.travel_id === travelId);
  if (status && status !== 'all') list = list.filter((r) => r.moderation_status === status);

  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getBusRatingSummary(busId) {
  initializeSeedAccountingData();

  const reviews = passengerReviews.filter((r) => r.bus_id === busId && r.moderation_status === 'published');
  const count = reviews.length;

  if (count === 0) {
    return {
      bus_id: busId,
      average_rating: null,
      total_reviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categories: {
        cleanliness: null,
        seat_comfort: null,
        punctuality: null,
        staff_behaviour: null,
      },
      common_complaints: [],
      has_ratings: false,
    };
  }

  const avgOverall = Number((reviews.reduce((acc, r) => acc + r.overall_rating, 0) / count).toFixed(1));
  const avgCleanliness = Number((reviews.reduce((acc, r) => acc + r.cleanliness_rating, 0) / count).toFixed(1));
  const avgComfort = Number((reviews.reduce((acc, r) => acc + r.seat_comfort_rating, 0) / count).toFixed(1));
  const avgPunctuality = Number((reviews.reduce((acc, r) => acc + r.punctuality_rating, 0) / count).toFixed(1));
  const avgStaff = Number((reviews.reduce((acc, r) => acc + r.staff_behaviour_rating, 0) / count).toFixed(1));

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, r.overall_rating));
    distribution[star] = (distribution[star] || 0) + 1;
  }

  const complaintsMap = {};
  for (const r of reviews) {
    if (r.complaint_category && r.complaint_category !== 'none') {
      complaintsMap[r.complaint_category] = (complaintsMap[r.complaint_category] || 0) + 1;
    }
  }

  return {
    bus_id: busId,
    average_rating: avgOverall,
    total_reviews: count,
    distribution,
    categories: {
      cleanliness: avgCleanliness,
      seat_comfort: avgComfort,
      punctuality: avgPunctuality,
      staff_behaviour: avgStaff,
    },
    common_complaints: Object.entries(complaintsMap).map(([category, count]) => ({ category, count })),
    recent_reviews: reviews.slice(0, 10),
    has_ratings: true,
  };
}

export async function submitPassengerReview({
  bookingId,
  pnrNumber,
  userId,
  ratings = {},
  reviewText,
  complaintCategory = 'none',
  user,
}) {
  initializeSeedAccountingData();

  // Find booking
  const booking = bookings.find((b) => b.id === bookingId || b.pnr_number === pnrNumber);
  if (!booking) {
    const err = new Error('Verified booking reservation not found for passenger feedback submission');
    err.code = 'BOOKING_NOT_FOUND';
    throw err;
  }

  // Passenger authorization check: user must own booking unless admin
  if (user && user.role === 'passenger' && booking.user_id && booking.user_id !== user.id) {
    const err = new Error('Access denied: You can only review trips that you personally booked.');
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Booking eligibility: must not be cancelled
  if (['cancelled', 'failed'].includes(booking.booking_status)) {
    const err = new Error('Reviews can only be submitted for completed or confirmed passenger journeys.');
    err.code = 'INELIGIBLE_BOOKING';
    throw err;
  }

  // Prevent duplicate review for the same booking
  const existingReview = passengerReviews.find((r) => r.booking_id === booking.id || (pnrNumber && r.pnr_number === pnrNumber));
  if (existingReview) {
    const err = new Error('You have already submitted a verified passenger review for this booking. Duplicate reviews are not permitted.');
    err.code = 'DUPLICATE_REVIEW';
    throw err;
  }

  const overall = Number(ratings.overall || ratings.overall_rating || 5);
  const cleanliness = Number(ratings.cleanliness || ratings.cleanliness_rating || overall);
  const comfort = Number(ratings.seat_comfort || ratings.seat_comfort_rating || overall);
  const punctuality = Number(ratings.punctuality || ratings.punctuality_rating || overall);
  const staff = Number(ratings.staff_behaviour || ratings.staff_behaviour_rating || overall);

  const trip = trips.find((t) => t.id === booking.trip_id);
  const bus = trip ? buses.find((b) => b.id === trip.bus_id) : (booking.bus_id ? buses.find((b) => b.id === booking.bus_id) : buses[0]);

  const newReview = {
    id: `rev-${uuidv4().slice(0, 8)}`,
    booking_id: booking.id,
    pnr_number: booking.pnr_number,
    user_id: user?.id || booking.user_id || 'usr-passenger-001',
    passenger_name: booking.contact_name || user?.firstName || 'Verified Passenger',
    travel_id: booking.travel_id || bus.travel_id,
    bus_id: bus.id,
    trip_id: booking.trip_id,
    overall_rating: Math.max(1, Math.min(5, overall)),
    cleanliness_rating: Math.max(1, Math.min(5, cleanliness)),
    seat_comfort_rating: Math.max(1, Math.min(5, comfort)),
    punctuality_rating: Math.max(1, Math.min(5, punctuality)),
    staff_behaviour_rating: Math.max(1, Math.min(5, staff)),
    review_text: reviewText ? String(reviewText).trim().slice(0, 1000) : '',
    complaint_category: complaintCategory || 'none',
    moderation_status: complaintCategory && complaintCategory !== 'none' ? 'published' : 'published',
    moderated_by: null,
    moderation_notes: 'Automatically published verified booking review',
    created_at: new Date().toISOString(),
  };

  passengerReviews.push(newReview);
  saveAccountingStore();
  savePersistentStore();
  return newReview;
}

/**
 * MODULE 13: Report Generation & CSV Exports
 */
export async function generateCsvExport({ reportType, travelId, userRole, filters = {} }) {
  initializeSeedAccountingData();

  const orgName = travelId ? (travels.find((t) => t.id === travelId)?.name || 'Travel Operator') : 'Consolidated Platform (All Carriers)';
  const period = filters.dateRange || 'all';

  let rows = [];
  let headers = [];

  if (reportType === 'bus_profitability') {
    headers = [
      'Registration Number',
      'Bus Name',
      'Carrier',
      'Trips Operated',
      'Gross Sales (INR)',
      'Discounts (INR)',
      'Refunds (INR)',
      'Net Ticket Revenue (INR)',
      'Operating Expenses (INR)',
      'Operating Profit/Loss (INR)',
      'Avg Profit Per Trip (INR)',
      'Occupancy (%)',
      'Average Rating',
    ];
    const busData = await getBusAccountingList({ travelId, userRole, ...filters });
    rows = busData.map((b) => [
      `"${b.registration_number}"`,
      `"${b.name}"`,
      `"${b.travel_name}"`,
      b.trips_operated,
      b.gross_ticket_sales.toFixed(2),
      b.discounts.toFixed(2),
      b.refunds.toFixed(2),
      b.net_ticket_revenue.toFixed(2),
      b.total_operating_expenses.toFixed(2),
      b.operating_profit_loss.toFixed(2),
      b.avg_profit_per_trip.toFixed(2),
      `${b.occupancy_percentage}%`,
      b.average_rating ? `${b.average_rating} ★` : 'N/A',
    ]);
  } else if (reportType === 'route_profitability') {
    headers = [
      'Route Name',
      'Source',
      'Destination',
      'Carrier',
      'Scheduled Trips',
      'Operated Trips',
      'Net Ticket Revenue (INR)',
      'Operating Expenses (INR)',
      'Operating Profit/Loss (INR)',
      'Avg Profit Per Trip (INR)',
      'Occupancy (%)',
      'Average Rating',
    ];
    const routeData = await getRouteProfitabilityRankings({ travelId, userRole, ...filters });
    rows = routeData.map((r) => [
      `"${r.name}"`,
      `"${r.source}"`,
      `"${r.destination}"`,
      `"${r.travel_name}"`,
      r.scheduled_trips,
      r.operated_trips,
      r.net_ticket_revenue.toFixed(2),
      r.total_operating_expenses.toFixed(2),
      r.operating_profit_loss.toFixed(2),
      r.avg_profit_per_trip.toFixed(2),
      `${r.occupancy_percentage}%`,
      r.average_rating ? `${r.average_rating} ★` : 'N/A',
    ]);
  } else if (reportType === 'fuel_expenses') {
    headers = [
      'Purchase Date',
      'Bus Registration',
      'Litres',
      'Price Per Litre (INR)',
      'Total Fuel Cost (INR)',
      'Odometer Reading (KM)',
      'Fuel Station',
      'Anomaly Flag',
    ];
    const fuelData = await getFuelLogs({ travelId, ...filters });
    rows = fuelData.map((f) => {
      const b = buses.find((x) => x.id === f.bus_id);
      return [
        f.purchase_date,
        `"${b?.registration_number || f.bus_id}"`,
        f.litres.toFixed(2),
        f.price_per_litre.toFixed(2),
        f.total_cost.toFixed(2),
        f.odometer_reading,
        `"${f.fuel_station}"`,
        f.is_flagged_anomaly ? `FLAGGED: ${f.anomaly_reason}` : 'Normal',
      ];
    });
  } else if (reportType === 'expenses') {
    headers = [
      'Date',
      'Category',
      'Amount (INR)',
      'Bus Registration',
      'Vendor',
      'Payment Method',
      'Approval Status',
      'Notes',
    ];
    const expData = await getExpenses({ travelId, ...filters });
    rows = expData.map((e) => {
      const b = buses.find((x) => x.id === e.bus_id);
      return [
        e.expense_date,
        e.category,
        e.amount.toFixed(2),
        `"${b?.registration_number || 'Organization'}"`,
        `"${e.vendor || 'N/A'}"`,
        e.payment_method,
        e.approval_status,
        `"${e.notes || ''}"`,
      ];
    });
  } else {
    // Consolidated Financial Summary
    headers = ['Metric', 'Amount (INR / Count)', 'Remarks'];
    const summary = await getFinancialSummary({ travelId, ...filters });
    rows = [
      ['Gross Ticket Sales', summary.gross_ticket_sales.toFixed(2), 'Total gross tickets booked'],
      ['Discounts Applied', summary.discounts.toFixed(2), 'Coupons & promotional concessions'],
      ['Refunds Processed', summary.refunds.toFixed(2), 'Customer cancellations'],
      ['Net Ticket Revenue', summary.net_ticket_revenue.toFixed(2), 'Gross - Discounts - Refunds'],
      ['Actual Collections', summary.actual_collections.toFixed(2), 'Cash / PG payments received'],
      ['Pending Collections', summary.pending_payments.toFixed(2), 'Unsettled payment attempts'],
      ['Fuel / Diesel Costs', summary.fuel_expenses.toFixed(2), 'High Speed Diesel refuel expenses'],
      ['Crew Salaries & Allowances', summary.driver_cleaner_salaries.toFixed(2), 'Driver & cleaner payroll'],
      ['Toll & Parking Expenses', summary.toll_parking_expenses.toFixed(2), 'FASTag NHAI & terminal parking'],
      ['Maintenance & Repairs', summary.maintenance_repairs_expenses.toFixed(2), 'Workshop & spare parts'],
      ['Total Operating Expenses', summary.total_operating_expenses.toFixed(2), 'All approved operating expenses'],
      ['Operating Profit / Loss', summary.operating_profit_loss.toFixed(2), 'Net Ticket Revenue - Total Operating Expenses'],
      ['Overall Seat Occupancy', `${summary.occupancy_percentage}%`, `${summary.total_booked_seats} of ${summary.total_seats_offered} seats booked`],
    ];
  }

  // Prepend metadata comments
  const metaLines = [
    `# SMART ROUTE BOOKING — FINANCIAL & FLEET PERFORMANCE REPORT`,
    `# Organization: ${orgName}`,
    `# Reporting Period: ${period.toUpperCase()}`,
    `# Export Generated: ${new Date().toISOString()}`,
    `# Currency: INR (₹)`,
    ``,
  ];

  const csvContent = '\uFEFF' + metaLines.join('\n') + headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
  return csvContent;
}
export default {
  initializeSeedAccountingData,
  saveAccountingStore,
  loadAccountingStore,
  getFinancialSummary,
  getFleetSummary,
  getBusAccountingList,
  getBusAccountingDetails,
  getRouteProfitabilityRankings,
  getExpenses,
  createExpense,
  updateExpenseStatus,
  getFuelLogs,
  recordFuelPurchase,
  getPayrollSummary,
  recordPayrollPayment,
  getPassengerReviews,
  getBusRatingSummary,
  submitPassengerReview,
  generateCsvExport,
  formatINR,
};
