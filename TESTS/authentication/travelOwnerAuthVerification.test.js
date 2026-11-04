import { describe, test, expect, beforeAll } from '@jest/globals';
import { registerOperator } from '../../BACKEND/src/controllers/operatorController.js';
import { login, getProfile, verifyLoginOtp } from '../../BACKEND/src/controllers/authController.js';
import { getRoleRedirect } from '../../FRONTEND/src/utils/roleRoutes.js';
import {
  findUserByEmail,
  findUserByMobile,
  loadPersistentStore,
  savePersistentStore,
  travels,
  users,
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

describe('SMART ROUTE — Travel Owner / Admin Registration & Login Verification', () => {
  const uniqueId = Date.now();
  const testOwnerEmail = `royal_owner_${uniqueId}@royalexpress.in`;
  const testOwnerMobile = `98${String(uniqueId).slice(-8)}`;
  const testCompanyName = `Royal Express ${uniqueId}`;
  const testPassword = 'OwnerSecurePass@123';

  // 1. Register a new Travel Owner account
  test('1. Register a new Travel Owner account via /api/operator/register', async () => {
    const { req, res } = mockReqRes({
      body: {
        fullName: 'Vikramaditya Singhania',
        email: testOwnerEmail,
        mobile: testOwnerMobile,
        password: testPassword,
        companyName: testCompanyName,
        businessName: `${testCompanyName} Private Limited`,
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '641018',
      },
    });

    await registerOperator(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('travel_owner');
    expect(res.body.user.email).toBe(testOwnerEmail.toLowerCase());
    expect(res.body.user.mobile).toBe(testOwnerMobile);
    expect(res.body.user.travelId).toBeDefined();
    expect(res.body.data.company.name).toBe(testCompanyName);
    expect(res.body.data.company.verification_status).toBe('pending');
  });

  // 2. Verify persistence after restarting / reloading persistent store
  test('2. Verify that the registered Travel Owner account persists in storage', async () => {
    // Force re-reading from disk
    loadPersistentStore();

    const persistedUser = findUserByEmail(testOwnerEmail);
    expect(persistedUser).toBeDefined();
    expect(persistedUser.role).toBe('travel_owner');
    expect(persistedUser.mobile).toBe(testOwnerMobile);
    expect(persistedUser.travel_id).toBeDefined();

    const persistedCompany = travels.find((t) => t.id === persistedUser.travel_id);
    expect(persistedCompany).toBeDefined();
    expect(persistedCompany.name).toBe(testCompanyName);
  });

  // 3. Log in with registered identifier (email) and correct password
  test('3a. Log in with registered email and correct password', async () => {
    const { req, res } = mockReqRes({
      body: {
        identifier: testOwnerEmail,
        password: testPassword,
      },
    });

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('travel_owner');
    expect(res.body.user.email).toBe(testOwnerEmail.toLowerCase());
    expect(getRoleRedirect(res.body.user.role)).toBe('/operator/dashboard');
  });

  test('3b. Log in with registered 10-digit mobile and correct password', async () => {
    const { req, res } = mockReqRes({
      body: {
        identifier: testOwnerMobile,
        password: testPassword,
      },
    });

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('travel_owner');
    expect(res.body.user.mobile).toBe(testOwnerMobile);
  });

  // 4. Confirm that incorrect passwords are rejected
  test('4. Confirm that incorrect passwords are rejected safely with HTTP 401', async () => {
    const { req, res } = mockReqRes({
      body: {
        identifier: testOwnerEmail,
        password: 'CompletelyWrongPassword!999',
      },
    });

    await login(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid mobile/email or password');
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  // 5. Confirm duplicate registrations are rejected safely
  test('5a. Reject duplicate registration with existing email', async () => {
    const { req, res } = mockReqRes({
      body: {
        fullName: 'Duplicate Tester',
        email: testOwnerEmail,
        mobile: '9900000099',
        password: 'ValidPassword@123',
        companyName: `Unique Company ${Date.now()}`,
      },
    });

    await registerOperator(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_EXISTS');
  });

  test('5b. Reject duplicate registration with existing mobile', async () => {
    const { req, res } = mockReqRes({
      body: {
        fullName: 'Duplicate Mobile Tester',
        email: `new_unique_${Date.now()}@example.in`,
        mobile: testOwnerMobile,
        password: 'ValidPassword@123',
        companyName: `Unique Co ${Date.now()}`,
      },
    });

    await registerOperator(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('MOBILE_EXISTS');
  });

  test('5c. Reject duplicate registration with existing company brand name', async () => {
    const { req, res } = mockReqRes({
      body: {
        fullName: 'Duplicate Company Tester',
        email: `another_${Date.now()}@test.in`,
        mobile: `95${String(Date.now()).slice(-8)}`,
        password: 'ValidPassword@123',
        companyName: testCompanyName,
      },
    });

    await registerOperator(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('COMPANY_EXISTS');
  });

  // 6. Verify page refresh does not log user out (getProfile works for Travel Owner)
  test('6. Verify getProfile succeeds for Travel Owner and returns company profile without 500 error', async () => {
    const owner = findUserByEmail(testOwnerEmail);
    const { req, res } = mockReqRes({
      user: {
        id: owner.id,
        role: 'travel_owner',
        travelId: owner.travel_id,
      },
    });

    await getProfile(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('travel_owner');
    expect(res.body.data.profile).toBeDefined();
    expect(res.body.data.profile.name).toBe(testCompanyName);
  });

  // 7. Confirm that each authorised role reaches the correct dashboard
  test('7. Confirm role redirection maps all roles to their designated dashboards', () => {
    expect(getRoleRedirect('super_admin')).toBe('/admin/dashboard');
    expect(getRoleRedirect('admin')).toBe('/admin/dashboard');
    expect(getRoleRedirect('travel_owner')).toBe('/operator/dashboard');
    expect(getRoleRedirect('manager')).toBe('/operator/dashboard');
    expect(getRoleRedirect('driver')).toBe('/driver/dashboard');
    expect(getRoleRedirect('staff')).toBe('/staff');
    expect(getRoleRedirect('passenger')).toBe('/search');
  });

  // 8. Safely recover yesterday's registered account (testowner@smartroute.in / Apex Royal Travels)
  test('8. Safely recover yesterday\'s account: testowner@smartroute.in can log in and view dashboard profile', async () => {
    const recoveredUser = findUserByEmail('testowner@smartroute.in');
    expect(recoveredUser).toBeDefined();
    expect(recoveredUser.email).toBe('testowner@smartroute.in');
    expect(recoveredUser.mobile).toBe('9876543210');
    expect(recoveredUser.role).toBe('travel_owner');

    // Login with registered credentials
    const { req, res } = mockReqRes({
      body: {
        identifier: 'testowner@smartroute.in',
        password: 'Password@123',
      },
    });

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('travel_owner');
    expect(res.body.user.travelId).toBe('90d203eb-99cd-40d7-a99b-560e5b77d1e2');
    expect(getRoleRedirect(res.body.user.role)).toBe('/operator/dashboard');

    // Profile retrieval works (page refresh test)
    const { req: pReq, res: pRes } = mockReqRes({
      user: {
        id: recoveredUser.id,
        role: 'travel_owner',
        travelId: recoveredUser.travel_id,
      },
    });

    await getProfile(pReq, pRes);

    expect(pRes.statusCode).toBe(200);
    expect(pRes.body.success).toBe(true);
    expect(pRes.body.data.profile.name).toBe('Apex Royal Travels');
  });
});
