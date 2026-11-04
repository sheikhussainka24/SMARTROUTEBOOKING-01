import {
  getOperatorStats,
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
  createManager,
  updateManager,
  deactivateManager,
  createDriver,
  deactivateDriver,
} from '../../BACKEND/src/controllers/operatorController.js';

import {
  smartRouteTravelId,
  veeVeeTravelId,
  ownerId,
  managerId,
  driver1Id,
  users,
  travels,
  buses,
  routes,
  trips,
  bookings,
  updateManagerPermissionsInStore,
} from '../../BACKEND/src/services/dataStore.js';

// Helper to simulate Express req/res
function mockReqRes({ user, body = {}, params = {}, query = {} } = {}) {
  const req = {
    user: user || { id: managerId, role: 'manager', travelId: smartRouteTravelId },
    body,
    params,
    query,
    ip: '127.0.0.1',
    get: (header) => (header === 'user-agent' ? 'Jest-Test-Agent' : null),
  };

  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    send(data) {
      this.sendData = data;
      return this;
    },
  };

  return { req, res };
}

describe('Manager Permissions & Role-Based Access Control Test Suite', () => {
  beforeEach(() => {
    // Reset permissions to default least-privilege for test manager
    updateManagerPermissionsInStore(managerId, smartRouteTravelId, {
      manage_buses: true,
      manage_routes: true,
      manage_drivers: true,
      view_bookings: true,
      export_reports: true,
      edit_fares: false,
      process_cancellations: false,
      approve_refunds: false,
      add_staff: false,
    });
  });

  // ================= 1. DASHBOARD & TENANT ISOLATION =================
  describe('1. Dashboard & Statistics', () => {
    test('Manager views company-level statistics and operational alerts', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
      });

      await getOperatorStats(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.stats).toBeDefined();
      expect(res.jsonData.data.stats.buses).toBeGreaterThanOrEqual(1);
      expect(res.jsonData.data.operationalAlerts).toBeDefined();
      expect(Array.isArray(res.jsonData.data.operationalAlerts)).toBe(true);
    });

    test('Manager cannot view platform-wide stats or another operator company data', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
      });

      await getCompanyBuses(req, res);
      expect(res.statusCode).toBe(200);
      const returnedBuses = res.jsonData.buses;
      // All returned buses must belong strictly to smartRouteTravelId
      for (const b of returnedBuses) {
        expect(b.travel_id).toBe(smartRouteTravelId);
        expect(b.travel_id).not.toBe(veeVeeTravelId);
      }
    });
  });

  // ================= 2. BUS MANAGEMENT =================
  describe('2. Bus Management', () => {
    test('Manager with manage_buses can add new company bus', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        body: {
          registrationNumber: `TN-38-TEST-${Date.now()}`,
          busType: 'AC Sleeper 2+1',
          totalSeats: 36,
          amenities: ['WiFi', 'AIS-140 GPS', 'Charging Ports'],
        },
      });

      await createCompanyBus(req, res);
      expect(res.statusCode).toBe(201);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.bus.travel_id).toBe(smartRouteTravelId);
    });

    test('Manager denied adding bus if manage_buses permission is revoked', async () => {
      updateManagerPermissionsInStore(managerId, smartRouteTravelId, { manage_buses: false });

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        body: {
          registrationNumber: 'TN-38-NOPE-11',
          busType: 'AC Sleeper 2+1',
        },
      });

      await createCompanyBus(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.code).toBe('PERMISSION_DENIED');
    });

    test('Safeguard: Cannot permanently delete bus with historical trips or bookings', async () => {
      // Find a bus that has linked trips
      const busWithTrips = buses.find((b) => b.travel_id === smartRouteTravelId && trips.some((t) => t.bus_id === b.id));
      expect(busWithTrips).toBeDefined();

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: busWithTrips.id },
      });

      await deleteCompanyBus(req, res);
      expect(res.statusCode).toBe(409);
      expect(res.jsonData.code).toBe('CANNOT_DELETE_BUS_WITH_HISTORY');
    });

    test('Cannot access or delete a bus belonging to another travel operator', async () => {
      // Bus belonging to VeeVee Travels
      const otherBus = buses.find((b) => b.travel_id === veeVeeTravelId);
      expect(otherBus).toBeDefined();

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: otherBus.id },
      });

      await deleteCompanyBus(req, res);
      expect(res.statusCode).toBe(404);
    });
  });

  // ================= 3. ROUTE & SCHEDULE MANAGEMENT =================
  describe('3. Route & Schedule Management', () => {
    test('Manager creates a new trip using approved routes', async () => {
      const companyRoute = routes.find((r) => r.travel_id === smartRouteTravelId);
      const companyBus = buses.find((b) => b.travel_id === smartRouteTravelId);

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        body: {
          routeId: companyRoute.id,
          busId: companyBus.id,
          departureDate: '2026-11-20',
          departureTime: '21:30',
          arrivalTime: '06:00',
          fare: 850,
        },
      });

      await createCompanyTrip(req, res);
      expect(res.statusCode).toBe(201);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.trip.travel_id).toBe(smartRouteTravelId);
    });

    test('Schedule conflict check detects overlapping driver or bus schedule', async () => {
      const existingTrip = trips.find((t) => t.travel_id === smartRouteTravelId && t.status !== 'cancelled');

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        query: {
          busId: existingTrip.bus_id,
          departureDate: existingTrip.departure_date,
          departureTime: existingTrip.departure_time,
        },
      });

      await getCompanyScheduleConflicts(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.hasConflicts).toBe(true);
      expect(res.jsonData.data.conflicts.length).toBeGreaterThanOrEqual(1);
    });

    test('Safeguard: Cannot alter or modify completed trips', async () => {
      // Find or create a completed trip in store
      const completedTrip = trips.find((t) => t.travel_id === smartRouteTravelId && t.status === 'completed') || {
        id: 'test-completed-trip-1',
        travel_id: smartRouteTravelId,
        status: 'completed',
        fare: 750,
      };
      if (!trips.includes(completedTrip)) trips.push(completedTrip);

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: completedTrip.id },
        body: { departureTime: '10:00' },
      });

      await updateCompanyTrip(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.code).toBe('CANNOT_MODIFY_COMPLETED_TRIP');
    });
  });

  // ================= 4. FARE MANAGEMENT =================
  describe('4. Fare Management', () => {
    test('Manager denied editing fares by default (least-privilege)', async () => {
      const activeTrip = trips.find((t) => t.travel_id === smartRouteTravelId && t.status !== 'completed');

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: activeTrip.id },
        body: { newFare: 900, reason: 'Market surge' },
      });

      await updateTripFare(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('PERMISSION_DENIED');
    });

    test('Manager with edit_fares updates fare within ±20% limit', async () => {
      updateManagerPermissionsInStore(managerId, smartRouteTravelId, { edit_fares: true });
      const activeTrip = trips.find((t) => t.travel_id === smartRouteTravelId && t.status !== 'completed');
      const baseFare = activeTrip.base_fare || activeTrip.fare || 800;
      const moderateNewFare = Math.round(baseFare * 1.1); // 10% increase

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: activeTrip.id },
        body: { newFare: moderateNewFare, reason: 'Seasonal fuel surcharge' },
      });

      await updateTripFare(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.status).toBe('applied');
    });

    test('Fare change exceeding ±20% requires Travel Operator approval', async () => {
      updateManagerPermissionsInStore(managerId, smartRouteTravelId, { edit_fares: true });
      const activeTrip = trips.find((t) => t.travel_id === smartRouteTravelId && t.status !== 'completed');
      const baseFare = activeTrip.base_fare || activeTrip.fare || 800;
      const extremeNewFare = Math.round(baseFare * 1.5); // 50% increase (> 20%)

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: activeTrip.id },
        body: { newFare: extremeNewFare, reason: 'Extreme festival surge' },
      });

      await updateTripFare(req, res);
      expect(res.statusCode).toBe(202);
      expect(res.jsonData.data.requiresApproval).toBe(true);
      expect(res.jsonData.data.status).toBe('pending_operator_approval');
    });
  });

  // ================= 5. DRIVER MANAGEMENT =================
  describe('5. Driver Management', () => {
    test('Manager adds a driver with required DL validation', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        body: {
          firstName: 'Senthil',
          lastName: 'Kumar',
          mobile: '9840112233',
          email: `senthil.${Date.now()}@smartroute.in`,
          licenseNumber: 'TN38-2015-0045892',
          licenseType: 'HMV Passenger',
          experienceYears: 8,
        },
      });

      await createDriver(req, res);
      expect(res.statusCode).toBe(201);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.driver.travel_id).toBe(smartRouteTravelId);
    });

    test('Rejects driver addition if license number is missing', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        body: {
          firstName: 'Ramesh',
          mobile: '9840223344',
          // missing licenseNumber
        },
      });

      await createDriver(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.code).toBe('MISSING_LICENSE');
    });

    test('Safeguard: Cannot deactivate driver assigned to active upcoming trips', async () => {
      // Find driver assigned to active trip
      const activeTrip = trips.find((t) => t.travel_id === smartRouteTravelId && ['published', 'boarding'].includes(t.status) && t.driver_id);
      expect(activeTrip).toBeDefined();

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: activeTrip.driver_id },
      });

      await deactivateDriver(req, res);
      expect(res.statusCode).toBe(409);
      expect(res.jsonData.code).toBe('DRIVER_ASSIGNED_TO_UPCOMING_TRIPS');
    });
  });

  // ================= 6. BOOKING MANAGEMENT & SANITIZATION =================
  describe('6. Booking Management', () => {
    test('Manager searches company bookings and sensitive payment data is never exposed', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
      });

      await getCompanyBookings(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      const bookingList = res.jsonData.bookings;
      expect(bookingList.length).toBeGreaterThanOrEqual(1);

      // Verify no sensitive payment credentials exist in payload
      for (const b of bookingList) {
        expect(b.payment_secret).toBeUndefined();
        expect(b.payment_signature).toBeUndefined();
        expect(b.card_cvv).toBeUndefined();
        expect(b.card_number).toBeUndefined();
      }
    });

    test('Cancellation denied by default without process_cancellations permission', async () => {
      const booking = bookings.find((b) => b.travel_id === smartRouteTravelId && b.booking_status === 'confirmed');
      expect(booking).toBeDefined();

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: booking.id },
        body: { reason: 'Customer requested cancellation' },
      });

      await cancelCompanyBooking(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('PERMISSION_DENIED');
    });

    test('Cancellation succeeds when process_cancellations is granted', async () => {
      updateManagerPermissionsInStore(managerId, smartRouteTravelId, { process_cancellations: true });
      const booking = bookings.find((b) => b.travel_id === smartRouteTravelId && b.booking_status === 'confirmed');

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: booking.id },
        body: { reason: 'Passenger emergency cancellation' },
      });

      await cancelCompanyBooking(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.booking.booking_status).toBe('cancelled');
    });

    test('Refund disbursement denied without approve_refunds permission', async () => {
      updateManagerPermissionsInStore(managerId, smartRouteTravelId, {
        process_cancellations: true,
        approve_refunds: false, // Refund approval withheld
      });
      const booking = bookings.find((b) => b.travel_id === smartRouteTravelId);

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: booking.id },
        body: { reason: 'Passenger requested refund', refundAmount: 500 },
      });

      await cancelCompanyBooking(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('REFUND_PERMISSION_DENIED');
    });
  });

  // ================= 7. STAFF PERMISSIONS =================
  describe('7. Staff Permissions & Anti-Elevation', () => {
    test('Manager cannot create another manager without add_staff permission', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        body: {
          firstName: 'Anand',
          email: `anand.${Date.now()}@smartroute.in`,
        },
      });

      await createManager(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('FORBIDDEN');
    });

    test('Manager cannot create a Travel Operator even if add_staff is granted', async () => {
      updateManagerPermissionsInStore(managerId, smartRouteTravelId, { add_staff: true });

      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        body: {
          firstName: 'Fake',
          lastName: 'Operator',
          email: `fakeop.${Date.now()}@smartroute.in`,
          role: 'travel_owner',
        },
      });

      await createManager(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('FORBIDDEN');
    });

    test('Manager cannot change their own role or elevate permissions', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: managerId },
        body: { role: 'travel_owner' },
      });

      await updateManager(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('SELF_ROLE_CHANGE_FORBIDDEN');
    });

    test('Manager cannot deactivate company owner or platform Admin', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: ownerId },
      });

      await deactivateManager(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('FORBIDDEN');
    });
  });

  // ================= 8. REPORTS & PII MASKING =================
  describe('8. Reports & PII Masking', () => {
    test('Manager exports report with passenger phone numbers masked', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        query: { type: 'bookings' },
      });

      await getCompanyReports(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      const reportRows = res.jsonData.data.rows;
      expect(reportRows.length).toBeGreaterThanOrEqual(1);

      // Verify PII masking on passenger phone numbers
      for (const r of reportRows) {
        if (r.passengerMobile) {
          expect(r.passengerMobile).toContain('*****');
        }
      }
    });
  });

  // ================= 9. TRAVEL OPERATOR CONTROL & LEAST PRIVILEGE =================
  describe('9. Travel Operator Control', () => {
    test('Travel Owner inspects and updates manager permissions', async () => {
      const { req, res } = mockReqRes({
        user: { id: ownerId, role: 'travel_owner', travelId: smartRouteTravelId },
        params: { id: managerId },
        body: {
          permissions: {
            manage_buses: true,
            manage_routes: true,
            manage_drivers: true,
            view_bookings: true,
            export_reports: true,
            edit_fares: true,
            process_cancellations: true,
            approve_refunds: true,
            add_staff: false,
          },
        },
      });

      await updateSpecificManagerPermissions(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data.permissions.edit_fares).toBe(true);
      expect(res.jsonData.data.permissions.process_cancellations).toBe(true);
    });

    test('Manager cannot configure their own permissions', async () => {
      const { req, res } = mockReqRes({
        user: { id: managerId, role: 'manager', travelId: smartRouteTravelId },
        params: { id: managerId },
        body: { permissions: { approve_refunds: true } },
      });

      await updateSpecificManagerPermissions(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('FORBIDDEN');
    });
  });
});
