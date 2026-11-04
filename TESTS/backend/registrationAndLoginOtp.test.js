import {
  register,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  verifyEmail,
  resendEmailVerification,
} from '../../BACKEND/src/controllers/authController.js';
import { users } from '../../BACKEND/src/services/dataStore.js';

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

describe('SMART ROUTE — Registration & 2-Step Mobile Login Authentication Tests', () => {
  const timestamp = Date.now();
  const testEmail = `testpax_${timestamp}@smartroute.in`;
  const testMobile = `98${String(timestamp).slice(-8)}`;
  const testPassword = 'StrongPassword@2025';
  let devVerificationOtp = null;
  let devLoginOtp = null;

  // ================= 1. REGISTRATION TESTS =================
  describe('1. Passenger Registration Flow', () => {
    test('Successful registration with valid details and password complexity', async () => {
      const { req, res } = mockReqRes({
        fullName: 'Senthil Nathan',
        mobile: testMobile,
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        role: 'passenger',
        agreeTerms: true,
      });

      await register(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.user.mobile).toBe(testMobile);
      expect(res.body.data.user.role).toBe('passenger');
      expect(res.body.data.emailVerificationPending).toBe(true);
      expect(res.body.data.emailDelivery).toBeDefined();
      expect(res.body.data.emailDelivery.sent).toBe(false);
      expect(res.body.data.emailDelivery.reason).toBe('SMTP_CREDENTIALS_NOT_CONFIGURED');
      expect(res.body.data.devVerificationOtp).toBeDefined();
      expect(res.body.data.devVerificationOtp).toHaveLength(6);

      // Save for subsequent OTP verification tests
      devVerificationOtp = res.body.data.devVerificationOtp;
    });

    test('Duplicate email registration is rejected with HTTP 409', async () => {
      const { req, res } = mockReqRes({
        fullName: 'Another Person',
        mobile: '9123456789',
        email: testEmail, // same email
        password: testPassword,
        confirmPassword: testPassword,
        role: 'passenger',
        agreeTerms: true,
      });

      await register(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(res.body.error).toContain('email address already exists');
    });

    test('Duplicate mobile registration is rejected with HTTP 409', async () => {
      const { req, res } = mockReqRes({
        fullName: 'Another Person',
        mobile: testMobile, // same mobile
        email: `different_${Date.now()}@smartroute.in`,
        password: testPassword,
        confirmPassword: testPassword,
        role: 'passenger',
        agreeTerms: true,
      });

      await register(req, res);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('MOBILE_ALREADY_EXISTS');
      expect(res.body.error).toContain('mobile phone number already exists');
    });

    test('Mismatched confirm password is rejected with HTTP 400', async () => {
      const { req, res } = mockReqRes({
        fullName: 'Valid Name',
        mobile: '9876543210',
        email: 'mismatch@smartroute.in',
        password: 'Password@123',
        confirmPassword: 'Password@999',
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('PASSWORD_MISMATCH');
    });

    test('Weak password lacking special character or uppercase is rejected', async () => {
      const { req, res } = mockReqRes({
        fullName: 'Valid Name',
        mobile: '9876543210',
        email: 'weakpass@smartroute.in',
        password: 'alllowercase123',
        confirmPassword: 'alllowercase123',
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('WEAK_PASSWORD');
    });

    test('Invalid mobile number (< 10 digits) is rejected with HTTP 400', async () => {
      const { req, res } = mockReqRes({
        fullName: 'Valid Name',
        mobile: '98765', // only 5 digits
        email: 'valid_test@smartroute.in',
        password: testPassword,
        confirmPassword: testPassword,
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_MOBILE');
    });
  });

  // ================= 2. EMAIL VERIFICATION TESTS =================
  describe('2. Email OTP Verification', () => {
    test('Incorrect verification OTP is rejected with HTTP 400', async () => {
      const { req, res } = mockReqRes({
        email: testEmail,
        otp: '000000',
      });

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('OTP_WRONG');
    });

    test('Correct verification OTP verifies email successfully', async () => {
      expect(devVerificationOtp).toBeDefined();

      const { req, res } = mockReqRes({
        email: testEmail,
        otp: devVerificationOtp,
      });

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('verified successfully');
    });

    test('Reusing an already-used verification OTP is rejected', async () => {
      const { req, res } = mockReqRes({
        email: testEmail,
        otp: devVerificationOtp,
      });

      await verifyEmail(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('OTP_INVALID');
    });
  });

  // ================= 3. PASSENGER LOGIN STEP 1 TESTS =================
  describe('3. Passenger Login — Step 1: Mobile + Password', () => {
    test('Disallow login with email address for passengers', async () => {
      const { req, res } = mockReqRes({
        mobile: testEmail, // Passing email instead of mobile
        password: testPassword,
      });

      await login(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_LOGIN_DISALLOWED');
      expect(res.body.error).toContain('Email login is not permitted');
    });

    test('Login with incorrect password returns HTTP 401', async () => {
      const { req, res } = mockReqRes({
        mobile: testMobile,
        password: 'WrongPassword@999',
      });

      await login(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    test('Login with unknown mobile number returns HTTP 401', async () => {
      const { req, res } = mockReqRes({
        mobile: '9999999999',
        password: testPassword,
      });

      await login(req, res);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    test('Correct mobile & password triggers Step 2 OTP requirement without issuing tokens', async () => {
      const { req, res } = mockReqRes({
        mobile: testMobile,
        password: testPassword,
      });

      await login(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.requireOtp).toBe(true);
      expect(res.body.mobile).toBe(testMobile);
      expect(res.body.accessToken).toBeUndefined(); // MUST NOT issue tokens yet!
      expect(res.body.refreshToken).toBeUndefined();
      expect(res.body.smsDelivery).toBeDefined();
      expect(res.body.smsDelivery.sent).toBe(false);
      expect(res.body.smsDelivery.reason).toBe('SMS_GATEWAY_NOT_CONFIGURED');
      expect(res.body.devOtp).toBeDefined();
      expect(res.body.devOtp).toHaveLength(6);

      // Save login OTP for Step 2 verification test
      devLoginOtp = res.body.devOtp;
    });
  });

  // ================= 4. PASSENGER LOGIN STEP 2 TESTS =================
  describe('4. Passenger Login — Step 2: OTP Verification', () => {
    test('Incorrect login OTP is rejected with HTTP 400 and returns attempts remaining', async () => {
      const { req, res } = mockReqRes({
        mobile: testMobile,
        otp: '111111',
      });

      await verifyLoginOtp(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('OTP_WRONG');
      expect(res.body.attemptsRemaining).toBeDefined();
    });

    test('Correct login OTP verifies passenger and issues authenticated JWT tokens', async () => {
      expect(devLoginOtp).toBeDefined();

      const { req, res } = mockReqRes({
        mobile: testMobile,
        otp: devLoginOtp,
      });

      await verifyLoginOtp(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.mobile).toBe(testMobile);
      expect(res.body.user.role).toBe('passenger');
      expect(res.body.user.mobileVerified).toBe(true);
    });

    test('Reusing the same login OTP is rejected with HTTP 400', async () => {
      const { req, res } = mockReqRes({
        mobile: testMobile,
        otp: devLoginOtp,
      });

      await verifyLoginOtp(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('OTP_INVALID');
    });

    test('Exceeding 5 failed OTP verification attempts triggers rate limit (429)', async () => {
      const attemptsMobile = `97${String(Date.now()).slice(-8)}`;
      // Register passenger
      const { req: regReq, res: regRes } = mockReqRes({
        fullName: 'Rate Limit Tester',
        mobile: attemptsMobile,
        email: `ratelimit_${Date.now()}@smartroute.in`,
        password: testPassword,
        confirmPassword: testPassword,
        agreeTerms: true,
      });
      await register(regReq, regRes);

      // Login to generate fresh OTP
      const { req: logReq, res: logRes } = mockReqRes({
        mobile: attemptsMobile,
        password: testPassword,
      });
      await login(logReq, logRes);
      expect(logRes.statusCode).toBe(200);

      // Attempt 5 wrong OTPs
      for (let i = 0; i < 5; i++) {
        const { req: errReq, res: errRes } = mockReqRes({ mobile: attemptsMobile, otp: '999999' });
        await verifyLoginOtp(errReq, errRes);
      }

      // 6th attempt should be blocked with 429
      const { req: blockReq, res: blockRes } = mockReqRes({ mobile: attemptsMobile, otp: '999999' });
      await verifyLoginOtp(blockReq, blockRes);

      expect(blockRes.statusCode).toBe(429);
      expect(blockRes.body.code).toBe('OTP_MAX_ATTEMPTS');
    });
  });

  // ================= 5. ROLE-BASED ACCESS PROTECTION =================
  describe('5. Role-Based Access Isolation', () => {
    test('Pre-configured passenger Arun (9000000006) requires OTP and receives passenger role', async () => {
      const { req: loginReq, res: loginRes } = mockReqRes({
        mobile: '9000000006',
        password: 'SmartRoute@2024',
      });

      await login(loginReq, loginRes);

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.requireOtp).toBe(true);
      const pOtp = loginRes.body.devOtp;

      const { req: verifyReq, res: verifyRes } = mockReqRes({
        mobile: '9000000006',
        otp: pOtp,
      });

      await verifyLoginOtp(verifyReq, verifyRes);

      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.accessToken).toBeDefined();
      expect(verifyRes.body.user.role).toBe('passenger');
      expect(verifyRes.body.user.role).not.toBe('super_admin');
      expect(verifyRes.body.user.role).not.toBe('travel_owner');
    });
  });
});
