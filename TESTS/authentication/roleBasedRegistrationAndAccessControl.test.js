import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  ROLES,
  ROLE_LABELS,
  normalizeRole,
  isValidRole,
  evaluateRegistrationEligibility,
} from '../../BACKEND/src/config/roles.js';
import { getRoleRedirect } from '../../FRONTEND/src/utils/roleRoutes.js';
import {
  register,
  login,
  verifyEmail,
  verifyLoginOtp,
} from '../../BACKEND/src/controllers/authController.js';
import {
  createManagerInvitation,
  validateManagerInvitation,
  consumeManagerInvitation,
} from '../../BACKEND/src/services/invitationService.js';
import { authenticate, authorize, generateAccessToken } from '../../BACKEND/src/middleware/auth.js';
import {
  smartRouteTravelId,
  ownerId,
  managerId,
  driver1Id,
  superAdminId,
  passenger1Id,
  users,
  findUserById,
} from '../../BACKEND/src/services/dataStore.js';
import smtpMailer from '../../NOTIFICATIONS/email/smtpMailer.js';
import smsGateway from '../../NOTIFICATIONS/sms/smsGateway.js';

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

describe('SMART ROUTE — Registration, Role Security & Verification Suite', () => {
  let testNonce;

  beforeEach(() => {
    testNonce = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  });

  // =========================================================================
  // 1. CANONICAL ROLE NORMALIZATION & MAPPING
  // =========================================================================
  describe('1. Canonical Role Normalization & Safeguards', () => {
    test('Correctly maps all required roles from display labels and aliases', () => {
      expect(normalizeRole('Passenger')).toBe(ROLES.PASSENGER);
      expect(normalizeRole('Driver')).toBe(ROLES.DRIVER);
      expect(normalizeRole('Travel Owner')).toBe(ROLES.TRAVEL_OWNER);
      expect(normalizeRole('Travel Manager')).toBe(ROLES.MANAGER);
      expect(normalizeRole('Admin')).toBe(ROLES.SUPER_ADMIN);
      expect(normalizeRole('Super Admin')).toBe(ROLES.SUPER_ADMIN);
      expect(normalizeRole('travel-owner')).toBe('travel_owner');
      expect(normalizeRole('super_administrator')).toBe('super_admin');
    });

    test('Rejects unrecognized, malicious, or arbitrary roles', () => {
      expect(normalizeRole('hacker')).toBeNull();
      expect(normalizeRole('root')).toBeNull();
      expect(normalizeRole('')).toBeNull();
      expect(normalizeRole(null)).toBeNull();
      expect(isValidRole('hacker')).toBe(false);
      expect(isValidRole('passenger')).toBe(true);
    });
  });

  // =========================================================================
  // 2. VALID PASSENGER REGISTRATION
  // =========================================================================
  describe('2. Valid Passenger Registration', () => {
    test('Successfully registers a passenger with default active status', async () => {
      const email = `pass_${testNonce}@test.com`;
      const mobile = `98${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '1')}`;

      const { req, res } = mockReqRes({
        body: {
          fullName: 'Arun Kumar',
          email,
          mobile,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'passenger',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('passenger');
      expect(res.body.data.user.status).toBe('active');
      expect(res.body.data.user.email).toBe(email.toLowerCase());
      expect(res.body.data.user.mobile).toBe(mobile);
      // Plaintext password must never be returned or stored
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    test('Defaults to passenger role when no role is explicitly supplied', async () => {
      const email = `default_role_${testNonce}@test.com`;
      const mobile = `91${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '2')}`;

      const { req, res } = mockReqRes({
        body: {
          fullName: 'Deepa Lakshmi',
          email,
          mobile,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          // role omitted
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('passenger');
    });
  });

  // =========================================================================
  // 3. INVALID AND DUPLICATE REGISTRATION (MOBILE & EMAIL)
  // =========================================================================
  describe('3. Invalid and Duplicate Registration Validation', () => {
    test('Rejects invalid mobile number with clear error code', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Bad Mobile User',
          email: `bad_mobile_${testNonce}@test.com`,
          mobile: '12345', // only 5 digits
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_MOBILE');
    });

    test('Rejects invalid email format', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Bad Email User',
          email: 'not-an-email',
          mobile: '9876543210',
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_EMAIL');
    });

    test('Rejects duplicate email address with 409 conflict', async () => {
      const email = `dup_email_${testNonce}@test.com`;
      const mobile1 = `92${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '3')}`;
      const mobile2 = `93${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '4')}`;

      // First user
      const { req: req1, res: res1 } = mockReqRes({
        body: {
          fullName: 'First User',
          email,
          mobile: mobile1,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });
      await register(req1, res1);
      expect(res1.statusCode).toBe(201);

      // Second user with same email
      const { req: req2, res: res2 } = mockReqRes({
        body: {
          fullName: 'Duplicate Email User',
          email: email.toUpperCase(), // Case insensitive duplicate check
          mobile: mobile2,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });
      await register(req2, res2);

      expect(res2.statusCode).toBe(409);
      expect(res2.body.success).toBe(false);
      expect(res2.body.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    test('Rejects duplicate mobile number with 409 conflict', async () => {
      const mobile = `94${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '5')}`;
      const email1 = `mobile1_${testNonce}@test.com`;
      const email2 = `mobile2_${testNonce}@test.com`;

      // First user
      const { req: req1, res: res1 } = mockReqRes({
        body: {
          fullName: 'First Mobile User',
          email: email1,
          mobile,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });
      await register(req1, res1);
      expect(res1.statusCode).toBe(201);

      // Second user with same mobile
      const { req: req2, res: res2 } = mockReqRes({
        body: {
          fullName: 'Duplicate Mobile User',
          email: email2,
          mobile: `+91 ${mobile}`, // Formatted duplicate
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });
      await register(req2, res2);

      expect(res2.statusCode).toBe(409);
      expect(res2.body.success).toBe(false);
      expect(res2.body.code).toBe('MOBILE_ALREADY_EXISTS');
    });
  });

  // =========================================================================
  // 4. PASSWORD POLICY AND CONFIRM PASSWORD MATCH
  // =========================================================================
  describe('4. Password Policy and Password Mismatch', () => {
    test('Rejects weak password lacking special characters or uppercase', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Weak Password User',
          email: `weakpass_${testNonce}@test.com`,
          mobile: '9876543210',
          password: 'password123', // Missing uppercase and special char
          confirmPassword: 'password123',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('WEAK_PASSWORD');
    });

    test('Rejects password mismatch between password and confirmPassword', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Mismatch Password User',
          email: `mismatch_${testNonce}@test.com`,
          mobile: '9876543210',
          password: 'Password@2026',
          confirmPassword: 'DifferentPassword@2026',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('PASSWORD_MISMATCH');
    });
  });

  // =========================================================================
  // 5. PRIVILEGE ESCALATION & ADMIN REGISTRATION PROTECTION
  // =========================================================================
  describe('5. Privilege Escalation & Admin Role Safeguards', () => {
    test('Strictly forbids Admin public registration attempt via API', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Sneaky Admin',
          email: `admin_attempt_${testNonce}@test.com`,
          mobile: '9876543210',
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'Admin',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ADMIN_REGISTRATION_FORBIDDEN');
    });

    test('Strictly forbids Super Admin public registration attempt via API', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Sneaky Super Admin',
          email: `sadmin_attempt_${testNonce}@test.com`,
          mobile: '9876543210',
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'super_admin',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ADMIN_REGISTRATION_FORBIDDEN');
    });

    test('Mass assignment protection: Prevents escalating a Passenger into Admin via request body fields', async () => {
      const email = `mass_assign_${testNonce}@test.com`;
      const mobile = `95${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '6')}`;

      const { req, res } = mockReqRes({
        body: {
          fullName: 'Mass Assign Attacker',
          email,
          mobile,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'passenger',
          is_admin: true,
          isAdmin: true,
          permissions: ['*'],
          status: 'super_admin_status',
          travel_id: 'trv-forged-001',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('passenger');
      expect(res.body.data.user.status).toBe('active');
      expect(res.body.data.user.is_admin).toBeUndefined();
      expect(res.body.data.user.isAdmin).toBeUndefined();
    });
  });

  // =========================================================================
  // 6. MANAGER INVITATION VALIDATION, EXPIRY & SINGLE-USE ENFORCEMENT
  // =========================================================================
  describe('6. Travel Manager Invitation Lifecycle & Validation', () => {
    test('Rejects Travel Manager registration without an invitation token', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Uninvited Manager',
          email: `no_invite_${testNonce}@test.com`,
          mobile: '9876543210',
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'manager',
          // missing invitationToken
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVITATION_REQUIRED');
    });

    test('Rejects invalid or bogus invitation token', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Fake Invite Manager',
          email: `fake_invite_${testNonce}@test.com`,
          mobile: '9876543210',
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'manager',
          invitationToken: 'INV-FAKE-TOKEN-00000',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVITATION_NOT_FOUND');
    });

    test('Rejects expired manager invitation token', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Expired Invite Manager',
          email: `expired_mgr_${testNonce}@test.com`,
          mobile: '9876543210',
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'manager',
          invitationToken: 'INV-EXPIRED-SAMPLE',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVITATION_EXPIRED');
    });

    test('Rejects already used / redeemed manager invitation token', async () => {
      const { req, res } = mockReqRes({
        body: {
          fullName: 'Reused Invite Manager',
          email: `reused_mgr_${testNonce}@test.com`,
          mobile: '9876543210',
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'manager',
          invitationToken: 'INV-REUSED-SAMPLE',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVITATION_ALREADY_USED');
    });

    test('Successfully registers manager with valid invitation and enforces single-use', async () => {
      // 1. Create a fresh single-use invitation
      const freshInvite = createManagerInvitation({
        travelId: smartRouteTravelId,
        invitedBy: ownerId,
        email: `fresh_mgr_${testNonce}@test.com`,
        mobile: `96${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '7')}`,
      });

      // 2. Redeem invitation
      const { req: req1, res: res1 } = mockReqRes({
        body: {
          fullName: 'Fresh Manager',
          email: freshInvite.email,
          mobile: freshInvite.mobile,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'manager',
          invitationToken: freshInvite.token,
        },
      });

      await register(req1, res1);

      expect(res1.statusCode).toBe(201);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.user.role).toBe('manager');
      expect(res1.body.data.user.status).toBe('active');

      // 3. Attempting to reuse the same invitation token must fail with INVITATION_ALREADY_USED
      const { req: req2, res: res2 } = mockReqRes({
        body: {
          fullName: 'Second Attempt Manager',
          email: `second_${testNonce}@test.com`,
          mobile: `97${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '8')}`,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
          role: 'manager',
          invitationToken: freshInvite.token,
        },
      });

      await register(req2, res2);

      expect(res2.statusCode).toBe(403);
      expect(res2.body.success).toBe(false);
      expect(res2.body.code).toBe('INVITATION_ALREADY_USED');
    });
  });

  // =========================================================================
  // 7. DRIVER REGISTRATION & APPROVAL STATUS ENFORCEMENT
  // =========================================================================
  describe('7. Driver Registration & Operational Approval Enforcement', () => {
    test('Driver registration sets status to pending awaiting operator verification', async () => {
      const email = `driver_pending_${testNonce}@test.com`;
      const mobile = `98${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '9')}`;

      const { req, res } = mockReqRes({
        body: {
          fullName: 'Muthuvel Driver',
          email,
          mobile,
          password: 'Driver@Password2026',
          confirmPassword: 'Driver@Password2026',
          role: 'driver',
          operatorCode: 'TN38-DL-2022-0049182',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('driver');
      // Driver accounts must require approval before enabling protected operational features
      expect(res.body.data.user.status).toBe('pending');
    });

    test('Pending driver account cannot log in and is rejected with ACCOUNT_PENDING_APPROVAL', async () => {
      const email = `driver_login_block_${testNonce}@test.com`;
      const mobile = `99${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '0')}`;

      // Register driver
      const { req: regReq, res: regRes } = mockReqRes({
        body: {
          fullName: 'Pending Driver',
          email,
          mobile,
          password: 'Driver@Password2026',
          confirmPassword: 'Driver@Password2026',
          role: 'driver',
          operatorCode: 'TN38-DL-2024-998877',
        },
      });
      await register(regReq, regRes);
      expect(regRes.statusCode).toBe(201);

      // Attempt login while status is pending
      const { req: loginReq, res: loginRes } = mockReqRes({
        body: {
          identifier: mobile,
          password: 'Driver@Password2026',
        },
      });

      await login(loginReq, loginRes);

      expect(loginRes.statusCode).toBe(403);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.code).toBe('ACCOUNT_PENDING_APPROVAL');
    });
  });

  // =========================================================================
  // 8. SUSPENDED ACCOUNT RESTRICTIONS
  // =========================================================================
  describe('8. Suspended Account Restrictions', () => {
    test('Suspended account is rejected on login with ACCOUNT_SUSPENDED', async () => {
      const email = `suspended_${testNonce}@test.com`;
      const mobile = `90${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '4')}`;

      // Register and suspend user
      const { req: regReq, res: regRes } = mockReqRes({
        body: {
          fullName: 'Suspended User',
          email,
          mobile,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });
      await register(regReq, regRes);
      expect(regRes.statusCode).toBe(201);

      // Mark suspended in memory store
      const user = users.find((u) => u.email === email);
      if (user) {
        user.status = 'suspended';
      }

      // Attempt login
      const { req: loginReq, res: loginRes } = mockReqRes({
        body: {
          identifier: mobile,
          password: 'Password@2026',
        },
      });

      await login(loginReq, loginRes);

      expect(loginRes.statusCode).toBe(403);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.code).toBe('ACCOUNT_SUSPENDED');
    });

    test('Authenticate middleware rejects suspended user access token', async () => {
      const suspendedUser = {
        id: `usr-susp-${testNonce}`,
        email: `susp_token_${testNonce}@test.com`,
        mobile: '9000000099',
        role: 'passenger',
        status: 'suspended',
      };
      users.push(suspendedUser);

      const token = generateAccessToken(suspendedUser);

      const { req, res } = mockReqRes({
        headers: { authorization: `Bearer ${token}` },
      });

      let nextCalled = false;
      await authenticate(req, res, () => {
        nextCalled = true;
      });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  // =========================================================================
  // 9. EMAIL & OTP VERIFICATION HONESTY & RATE LIMITS
  // =========================================================================
  describe('9. Verification Lifecycle, Delivery Honesty & Cooldowns', () => {
    test('Returns honest delivery state when SMTP is not configured', async () => {
      const email = `honest_smtp_${testNonce}@test.com`;
      const mobile = `92${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '8')}`;

      const { req, res } = mockReqRes({
        body: {
          fullName: 'Honest Delivery User',
          email,
          mobile,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });

      await register(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.emailDelivery).toBeDefined();
      if (!smtpMailer.isConfigured()) {
        expect(res.body.data.emailDelivery.sent).toBe(false);
        expect(res.body.data.emailDelivery.reason).toBe('SMTP_CREDENTIALS_NOT_CONFIGURED');
      }
    });

    test('Rejects invalid 6-digit email OTP and caps max attempts', async () => {
      const email = `otp_attempts_${testNonce}@test.com`;
      const mobile = `93${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '7')}`;

      const { req: regReq, res: regRes } = mockReqRes({
        body: {
          fullName: 'OTP Attempt User',
          email,
          mobile,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });
      await register(regReq, regRes);
      expect(regRes.statusCode).toBe(201);

      // Submit 5 wrong OTPs
      for (let i = 0; i < 5; i++) {
        const { req, res } = mockReqRes({
          body: {
            email,
            otp: '000000',
          },
        });
        await verifyEmail(req, res);
        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe('OTP_WRONG');
      }

      // 6th attempt must trigger rate limit lockout
      const { req: lockReq, res: lockRes } = mockReqRes({
        body: {
          email,
          otp: '000000',
        },
      });
      await verifyEmail(lockReq, lockRes);

      expect(lockRes.statusCode).toBe(429);
      expect(lockRes.body.code).toBe('OTP_MAX_ATTEMPTS');
    });

    test('Successfully verifies email with correct OTP and invalidates single-use token', async () => {
      const email = `otp_success_${testNonce}@test.com`;
      const mobile = `94${String(testNonce).replace(/\D/g, '').slice(-8).padStart(8, '6')}`;

      const { req: regReq, res: regRes } = mockReqRes({
        body: {
          fullName: 'Successful Verifier',
          email,
          mobile,
          password: 'Password@2026',
          confirmPassword: 'Password@2026',
        },
      });
      await register(regReq, regRes);
      expect(regRes.statusCode).toBe(201);

      const devOtp = regRes.body.data.devVerificationOtp;
      expect(devOtp).toBeDefined();

      // Verify email with the generated OTP
      const { req: vReq, res: vRes } = mockReqRes({
        body: {
          email,
          otp: devOtp,
        },
      });
      await verifyEmail(vReq, vRes);

      expect(vRes.statusCode).toBe(200);
      expect(vRes.body.success).toBe(true);

      // Verify that user is marked verified
      const user = users.find((u) => u.email === email);
      expect(user.email_verified).toBe(true);

      // Attempting to reuse the OTP must fail with OTP_INVALID
      const { req: reuseReq, res: reuseRes } = mockReqRes({
        body: {
          email,
          otp: devOtp,
        },
      });
      await verifyEmail(reuseReq, reuseRes);

      expect(reuseRes.statusCode).toBe(400);
      expect(reuseRes.body.code).toBe('OTP_INVALID');
    });
  });

  // =========================================================================
  // 10. ROLE REDIRECTION ROUTING
  // =========================================================================
  describe('10. Role Redirection & Portal Routing', () => {
    test('getRoleRedirect correctly routes canonical and display role strings', () => {
      expect(getRoleRedirect('passenger')).toBe('/search');
      expect(getRoleRedirect('Passenger')).toBe('/search');
      expect(getRoleRedirect('driver')).toBe('/driver/dashboard');
      expect(getRoleRedirect('Driver')).toBe('/driver/dashboard');
      expect(getRoleRedirect('travel_owner')).toBe('/operator/dashboard');
      expect(getRoleRedirect('Travel Owner')).toBe('/operator/dashboard');
      expect(getRoleRedirect('manager')).toBe('/operator/dashboard');
      expect(getRoleRedirect('Travel Manager')).toBe('/operator/dashboard');
      expect(getRoleRedirect('super_admin')).toBe('/admin/dashboard');
      expect(getRoleRedirect('Admin')).toBe('/admin/dashboard');
    });
  });
});
