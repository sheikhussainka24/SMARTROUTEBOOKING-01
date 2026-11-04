import { register, login, verifyLoginOtp } from '../../BACKEND/src/controllers/authController.js';
import { getRoleRedirect } from '../../FRONTEND/src/utils/roleRoutes.js';

function mockReqRes(body = {}, headers = {}) {
  const req = {
    body,
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

describe('MODULE 1 & 3: Unified Role-Based Auth, Redirection & Route Flow Tests', () => {
  // Test 1: Role mapping redirection utility
  test('Role redirection maps authoritative roles to exact designated portal URLs', () => {
    expect(getRoleRedirect('passenger')).toBe('/search');
    expect(getRoleRedirect('driver')).toBe('/driver/dashboard');
    expect(getRoleRedirect('travel_owner')).toBe('/operator/dashboard');
    expect(getRoleRedirect('manager')).toBe('/operator/dashboard');
    expect(getRoleRedirect('super_admin')).toBe('/admin/dashboard');
    expect(getRoleRedirect('admin')).toBe('/admin/dashboard');
  });

  // Test 2: Registration with Driver role and Operator Code
  test('Registration enforces authoritative role selection and operator code storage', async () => {
    const timestamp = Date.now();
    const driverEmail = `driver_${timestamp}@smartroute.in`;
    const driverMobile = `91${String(timestamp).slice(-8)}`;

    const { req, res } = mockReqRes({
      fullName: 'Ravi Chandran',
      email: driverEmail,
      mobile: driverMobile,
      password: 'SmartDriver@2024',
      confirmPassword: 'SmartDriver@2024',
      role: 'driver',
      operatorCode: 'TN38-DL-99201',
      agreeTerms: true,
    });

    await register(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('driver');
    expect(res.body.data.user.status).toBe('pending');
  });

  // Test 3: Unified Login for Driver using Email credentials
  test('Unified login accepts email credentials directly and returns driver role', async () => {
    const { req, res } = mockReqRes({
      identifier: 'driver@smartroute.in',
      password: 'SmartRoute@2024',
    });

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('driver');
    expect(res.body.accessToken).toBeDefined();
    expect(getRoleRedirect(res.body.user.role)).toBe('/driver/dashboard');
  });

  // Test 4: Unified Login for Travel Owner using Email credentials
  test('Unified login accepts owner credentials and dynamically redirects to /operator/dashboard', async () => {
    const { req, res } = mockReqRes({
      identifier: 'owner@smartroute.in',
      password: 'SmartRoute@2024',
    });

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('travel_owner');
    expect(res.body.accessToken).toBeDefined();
    expect(getRoleRedirect(res.body.user.role)).toBe('/operator/dashboard');
  });

  // Test 5: Unified Login for Travel Manager using Email credentials
  test('Unified login accepts manager credentials and dynamically redirects to /operator/dashboard', async () => {
    const { req, res } = mockReqRes({
      identifier: 'manager@smartroute.in',
      password: 'SmartRoute@2024',
    });

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('manager');
    expect(res.body.accessToken).toBeDefined();
    expect(getRoleRedirect(res.body.user.role)).toBe('/operator/dashboard');
  });

  // Test 6: Unified Login for Super Admin using Email credentials
  test('Unified login accepts super admin credentials and dynamically redirects to /admin/dashboard', async () => {
    const { req, res } = mockReqRes({
      identifier: 'admin@smartroute.in',
      password: 'SmartRoute@2024',
    });

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('super_admin');
    expect(res.body.accessToken).toBeDefined();
    expect(getRoleRedirect(res.body.user.role)).toBe('/admin/dashboard');
  });

  // Test 7: Unified Login for Passenger using Phone Number
  test('Unified login recognizes passenger role and enforces OTP before redirecting to /search', async () => {
    const { req, res } = mockReqRes({
      identifier: '9000000006',
      password: 'SmartRoute@2024',
    });

    await login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.requireOtp).toBe(true);
    expect(res.body.userRole).toBe('passenger');

    // Verify OTP
    const { req: vReq, res: vRes } = mockReqRes({
      mobile: '9000000006',
      otp: res.body.devOtp,
    });

    await verifyLoginOtp(vReq, vRes);

    expect(vRes.statusCode).toBe(200);
    expect(vRes.body.user.role).toBe('passenger');
    expect(getRoleRedirect(vRes.body.user.role)).toBe('/search');
  });

  // Test 8: UI Content Validation for Header and Amenities
  test('SearchTrips header displays ONLY "SMART ROUTE Intercity Expresses" without "Vee Vee layout"', async () => {
    const fs = await import('fs');
    const searchTripsContent = fs.readFileSync(new URL('../../FRONTEND/src/pages/passenger/SearchTrips.jsx', import.meta.url), 'utf8');
    expect(searchTripsContent).toContain('SMART ROUTE Intercity Expresses');
    expect(searchTripsContent).not.toMatch(/Vee\s*Vee\s*Layout/i);
  });

  test('SearchAmenitiesRibbon excludes "Tata Capella Berth" promotional column', async () => {
    const fs = await import('fs');
    const ribbonContent = fs.readFileSync(new URL('../../FRONTEND/src/components/passenger/SearchAmenitiesRibbon.jsx', import.meta.url), 'utf8');
    expect(ribbonContent).not.toMatch(/Tata\s*(Prakash|Capella)\s*Berth/i);
    expect(ribbonContent).toContain('Verified Luxury Fleet');
    expect(ribbonContent).toContain('Live Radar GPS');
    expect(ribbonContent).toContain('Climate Controlled AC');
  });
});

