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
  getCompanyRoutes,
  getCompanyBookings,
} from '../../BACKEND/src/controllers/operatorController.js';
import {
  smartRouteTravelId,
  veeVeeTravelId,
  ownerId,
  managerId,
  driver1Id,
  users,
  travels,
} from '../../BACKEND/src/services/dataStore.js';

function mockReqRes(options = {}) {
  const {
    body = {},
    params = {},
    query = {},
    user = null,
    headers = {},
  } = options;

  const req = {
    body,
    params,
    query,
    user,
    headers,
    ip: '127.0.0.1',
    get: (h) => headers[h.toLowerCase()] || headers[h] || '',
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return responseData;
    },
  };

  return { req, res };
}

describe('SMART ROUTE — Operator, Manager & Driver Management System', () => {
  const testTimestamp = Date.now();
  let createdOperatorId = null;
  let createdTravelId = null;
  let createdManagerId = null;
  let createdDriverId = null;

  // ==========================================
  // 1. BUS OPERATOR REGISTRATION
  // ==========================================
  describe('1. Bus Operator Registration', () => {
    test('Operator can register their company details and create owner account in one step', async () => {
      const companyName = `BlueStar Travels ${testTimestamp}`;
      const email = `operator_${testTimestamp}@bluestar.in`;
      const mobile = `98${String(testTimestamp).slice(-8)}`;

      const { req, res } = mockReqRes({
        body: {
          fullName: 'Suresh Kumar',
          email,
          mobile,
          password: 'BlueStar@Operator2026',
          companyName,
          businessName: `${companyName} Pvt Ltd`,
          gstNumber: '33AABCB1234F1Z8',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '641018',
          businessAddress: '42 Omni Bus Stand Complex',
        },
      });

      await registerOperator(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.role).toBe('travel_owner');
      expect(res.body.data.company).toBeDefined();
      expect(res.body.data.company.name).toBe(companyName);
      expect(res.body.data.company.verification_status).toBe('pending');
      expect(res.body.data.user.travel_id).toBe(res.body.data.company.id);

      createdOperatorId = res.body.data.user.id;
      createdTravelId = res.body.data.company.id;
    });

    test('Prevents duplicate company name registration', async () => {
      const companyName = `BlueStar Travels ${testTimestamp}`;
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Duplicate Owner',
          email: `duplicate_${testTimestamp}@test.in`,
          mobile: '9100000000',
          password: 'Pass@12345678',
          companyName,
        },
      });

      await registerOperator(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('COMPANY_EXISTS');
    });

    test('Prevents duplicate email registration', async () => {
      const email = `operator_${testTimestamp}@bluestar.in`;
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Another Owner',
          email,
          mobile: '9200000000',
          password: 'Pass@12345678',
          companyName: `Another Brand ${testTimestamp}`,
        },
      });

      await registerOperator(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });
  });

  // ==========================================
  // 2. OPERATOR DASHBOARD STATS
  // ==========================================
  describe('2. Operator Dashboard Statistics', () => {
    test('Returns company-level statistics scoped to operator travelId', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: ownerId,
          role: 'travel_owner',
          travelId: smartRouteTravelId,
        },
      });

      await getOperatorStats(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.buses).toBeGreaterThanOrEqual(1);
      expect(res.body.data.stats.routes).toBeGreaterThanOrEqual(1);
      expect(res.body.data.stats.managers).toBeGreaterThanOrEqual(1);
      expect(res.body.data.stats.drivers).toBeGreaterThanOrEqual(1);
      expect(res.body.data.stats.upcomingTrips).toBeDefined();
      expect(res.body.data.stats.bookings).toBeDefined();
    });

    test('Rejects request if user has no company tenant association', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: 'usr-unlinked-001',
          role: 'travel_owner',
          travelId: null,
        },
      });

      await getOperatorStats(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('NO_TENANT');
    });
  });

  // ==========================================
  // 3. MANAGER MANAGEMENT
  // ==========================================
  describe('3. Manager Management (CRUD & RBAC)', () => {
    test('Authorized Travel Owner can create a new manager for their company', async () => {
      const mgrEmail = `mgr_${testTimestamp}@bluestar.in`;
      const mgrMobile = `93${String(testTimestamp).slice(-8)}`;

      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId,
        },
        body: {
          firstName: 'Anand',
          lastName: 'Rajan',
          email: mgrEmail,
          mobile: mgrMobile,
          password: 'ManagerSecure@2026',
          designation: 'Operations Director',
          department: 'Fleet & Dispatch',
          canCreateDriver: true,
          canCreateStaff: false,
          canApproveApplications: true,
        },
      });

      await createManager(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.manager).toBeDefined();
      expect(res.body.data.manager.role).toBe('manager');
      expect(res.body.data.manager.travel_id).toBe(createdTravelId);
      expect(res.body.data.manager.first_name).toBe('Anand');

      createdManagerId = res.body.data.manager.id;
    });

    test('Non-owner role (e.g. manager) cannot create other managers', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: createdManagerId,
          role: 'manager',
          travelId: createdTravelId,
        },
        body: {
          firstName: 'Subordinate',
          email: 'subordinate@test.in',
          mobile: '9400000000',
        },
      });

      await createManager(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    test('List managers returns only managers belonging to the authenticated company', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId,
        },
      });

      await listManagers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.managers)).toBe(true);
      expect(res.body.managers.length).toBe(1);
      expect(res.body.managers[0].id).toBe(createdManagerId);
    });

    test('Travel Owner can update manager profile and permissions', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId,
        },
        params: { id: createdManagerId },
        body: {
          designation: 'Senior Fleet Controller',
          department: 'Operations & Safety',
          canCreateStaff: true,
        },
      });

      await updateManager(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('Travel Owner can deactivate a manager account', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId,
        },
        params: { id: createdManagerId },
      });

      await deactivateManager(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify manager is deactivated in store
      const mgrInStore = users.find((u) => u.id === createdManagerId);
      expect(mgrInStore.status).toBe('deactivated');
    });
  });

  // ==========================================
  // 4. DRIVER MANAGEMENT
  // ==========================================
  describe('4. Driver Management (CRUD & Assignment)', () => {
    test('Authorized Travel Owner can add a driver with license details and bus assignment', async () => {
      const driverEmail = `drv_${testTimestamp}@bluestar.in`;
      const driverMobile = `95${String(testTimestamp).slice(-8)}`;

      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId,
        },
        body: {
          firstName: 'Perumal',
          lastName: 'Swamy',
          email: driverEmail,
          mobile: driverMobile,
          password: 'DriverSecure@2026',
          licenseNumber: 'TN38-DL-2016-0081923',
          licenseType: 'HMV Passenger Heavy',
          experienceYears: 10,
          assignedBusId: 'bus-bluestar-001',
        },
      });

      await createDriver(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.driver).toBeDefined();
      expect(res.body.data.driver.role).toBe('driver');
      expect(res.body.data.driver.travel_id).toBe(createdTravelId);
      expect(res.body.data.driver.license_number).toBe('TN38-DL-2016-0081923');

      createdDriverId = res.body.data.driver.id;
    });

    test('Creating a driver requires license number', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId,
        },
        body: {
          firstName: 'NoLicense',
          mobile: '9600000000',
        },
      });

      await createDriver(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('MISSING_LICENSE');
    });

    test('Manager of the company can also add a driver if permitted', async () => {
      const driver2Email = `drv2_${testTimestamp}@smartroute.in`;
      const driver2Mobile = `97${String(testTimestamp).slice(-8)}`;

      const { req, res } = mockReqRes({
        user: {
          id: managerId,
          role: 'manager',
          travelId: smartRouteTravelId,
        },
        body: {
          firstName: 'Senthil',
          lastName: 'Nathan',
          email: driver2Email,
          mobile: driver2Mobile,
          password: 'DriverPass@2026',
          licenseNumber: 'TN43-DL-2019-0099412',
          licenseType: 'HMV Passenger',
          experienceYears: 7,
        },
      });

      await createDriver(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.driver.travel_id).toBe(smartRouteTravelId);
    });

    test('List drivers returns only drivers belonging to the authenticated company', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId,
        },
      });

      await listDrivers(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.drivers)).toBe(true);
      expect(res.body.drivers.length).toBe(1);
      expect(res.body.drivers[0].id).toBe(createdDriverId);
    });

    test('Update driver updates bus assignment and availability', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId,
        },
        params: { id: createdDriverId },
        body: {
          assignedBusId: 'bus-bluestar-002',
          isAvailable: false,
        },
      });

      await updateDriver(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const drvInStore = users.find((u) => u.id === createdDriverId);
      expect(drvInStore.assigned_bus_id).toBe('bus-bluestar-002');
      expect(drvInStore.is_available).toBe(false);
    });

    test('Deactivate driver marks status deactivated and availability false', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId,
        },
        params: { id: createdDriverId },
      });

      await deactivateDriver(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const drvInStore = users.find((u) => u.id === createdDriverId);
      expect(drvInStore.status).toBe('deactivated');
      expect(drvInStore.is_available).toBe(false);
    });
  });

  // ==========================================
  // 5. MULTI-TENANT ISOLATION SECURITY
  // ==========================================
  describe('5. Multi-Tenant Security & Isolation', () => {
    test('Operator A cannot access or update Operator B driver', async () => {
      // createdOperatorId belongs to createdTravelId
      // driver1Id belongs to smartRouteTravelId
      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId, // Operator A
        },
        params: { id: driver1Id }, // Operator B driver
        body: {
          firstName: 'Hacked Driver',
        },
      });

      await updateDriver(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe('DRIVER_NOT_FOUND');
    });

    test('Operator A cannot deactivate Operator B manager', async () => {
      // managerId belongs to smartRouteTravelId
      const { req, res } = mockReqRes({
        user: {
          id: createdOperatorId,
          role: 'travel_owner',
          travelId: createdTravelId, // Operator A
        },
        params: { id: managerId }, // Operator B manager
      });

      await deactivateManager(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe('MANAGER_NOT_FOUND');
    });

    test('Company buses and routes endpoints return only company-specific data', async () => {
      const { req, res } = mockReqRes({
        user: {
          id: ownerId,
          role: 'travel_owner',
          travelId: smartRouteTravelId,
        },
      });

      await getCompanyBuses(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.buses.every((b) => b.travel_id === smartRouteTravelId)).toBe(true);

      const { req: rReq, res: rRes } = mockReqRes({
        user: {
          id: ownerId,
          role: 'travel_owner',
          travelId: smartRouteTravelId,
        },
      });

      await getCompanyRoutes(rReq, rRes);
      expect(rRes.statusCode).toBe(200);
      expect(rRes.body.routes.every((r) => r.travel_id === smartRouteTravelId)).toBe(true);
    });
  });
});
