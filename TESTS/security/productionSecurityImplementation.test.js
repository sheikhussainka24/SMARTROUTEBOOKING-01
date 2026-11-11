import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  validatePasswordStrength,
  hashPassword,
  comparePassword,
} from '../../BACKEND/src/auth/passwordPolicy.js';
import {
  generateOTP,
  hashOTP,
  verifyOTP,
  checkOtpRateLimit,
  recordOtpSent,
  OTP_MAX_ATTEMPTS,
} from '../../BACKEND/src/auth/otpService.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeUserSession,
  isSessionRevoked,
} from '../../BACKEND/src/auth/tokenService.js';
import { redactSensitiveData } from '../../BACKEND/src/config/logger.js';
import { sanitizeValue, sanitizeString, sanitizeRequest } from '../../BACKEND/src/middleware/sanitize.js';
import {
  authenticate,
  authorize,
  tenantIsolation,
} from '../../BACKEND/src/middleware/auth.js';
import {
  users,
  findUserById,
  findUserByMobile,
  findUserByEmail,
  updateUserInStore,
} from '../../BACKEND/src/services/dataStore.js';
import {
  login,
  verifyLoginOtp,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  checkLoginLockout,
  recordFailedLogin,
  clearFailedLogins,
  MAX_LOGIN_ATTEMPTS,
} from '../../BACKEND/src/controllers/authController.js';

function mockReqRes(options = {}) {
  const {
    body = {},
    params = {},
    query = {},
    user = null,
    headers = {},
    cookies = {},
  } = options;

  const req = {
    body,
    params,
    query,
    user,
    headers,
    cookies,
    ip: '127.0.0.1',
    get: (h) => headers[h.toLowerCase()] || headers[h] || '',
  };

  let statusCode = 200;
  let responseData = null;
  const cookiesSet = {};
  const cookiesCleared = [];

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    cookie(name, value, opts) {
      cookiesSet[name] = { value, opts };
      return this;
    },
    clearCookie(name, opts) {
      cookiesCleared.push(name);
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return responseData;
    },
    get cookiesSet() {
      return cookiesSet;
    },
    get cookiesCleared() {
      return cookiesCleared;
    },
  };

  return { req, res };
}

describe('SMART ROUTE — Complete Production Security Implementation Suite', () => {

  // =========================================================================
  // 1. STRONG PASSWORD SECURITY
  // =========================================================================
  describe('1. Strong Password Policy & Cryptographic Hashing', () => {
    test('Rejects passwords shorter than 8 characters', () => {
      const res = validatePasswordStrength('Ab1!xyz');
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/at least 8 characters/i);
    });

    test('Rejects passwords without uppercase letters', () => {
      const res = validatePasswordStrength('securepass123!');
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/uppercase/i);
    });

    test('Rejects passwords without lowercase letters', () => {
      const res = validatePasswordStrength('SECUREPASS123!');
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/lowercase/i);
    });

    test('Rejects passwords without numbers', () => {
      const res = validatePasswordStrength('SecurePassword!');
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/number/i);
    });

    test('Rejects passwords without special characters', () => {
      const res = validatePasswordStrength('SecurePassword123');
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/special character/i);
    });

    test('Rejects passwords exceeding 128 characters (DoS prevention)', () => {
      const longPass = 'A1!' + 'a'.repeat(130);
      const res = validatePasswordStrength(longPass);
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/not exceed 128/i);
    });

    test('Rejects trivial and easily guessable common passwords', () => {
      const res = validatePasswordStrength('Password123!');
      expect(res.valid).toBe(false);
      expect(res.message).toMatch(/too common or easily guessable/i);
    });

    test('Accepts strong compliant passwords', () => {
      const res = validatePasswordStrength('SmartRoute@2026!Secure');
      expect(res.valid).toBe(true);
    });

    test('Enforces bcrypt salt rounds >= 12 and generates valid bcrypt hash', async () => {
      const plain = 'StrongPass#9876';
      const hash = await hashPassword(plain);
      // Bcrypt hash format: $2a$12$ or $2b$12$
      expect(hash).toMatch(/^\$2[ab]\$12\$/);
      const isValid = await comparePassword(plain, hash);
      expect(isValid).toBe(true);
      const isWrong = await comparePassword('WrongPassword#123', hash);
      expect(isWrong).toBe(false);
    });
  });

  // =========================================================================
  // 2. MULTI-FACTOR AUTHENTICATION (MFA) & OTP SECURITY
  // =========================================================================
  describe('2. Multi-Factor Authentication (OTP Security & Attempt Capping)', () => {
    test('Generates cryptographically secure 6-digit numeric OTP', () => {
      for (let i = 0; i < 20; i++) {
        const otp = generateOTP();
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
      }
    });

    test('Hashed OTP is stored, never plaintext OTP', () => {
      const plainOtp = '482915';
      const hash1 = hashOTP(plainOtp);
      const hash2 = hashOTP(plainOtp);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(plainOtp);
      expect(hash1).toHaveLength(64); // SHA-256 HMAC
    });

    test('Verifies valid OTP within expiration window', () => {
      const plainOtp = '123456';
      const hashed = hashOTP(plainOtp);
      const future = new Date(Date.now() + 5 * 60 * 1000);
      const result = verifyOTP(plainOtp, hashed, future, 0);
      expect(result.valid).toBe(true);
    });

    test('Rejects expired OTP', () => {
      const plainOtp = '123456';
      const hashed = hashOTP(plainOtp);
      const past = new Date(Date.now() - 1000);
      const result = verifyOTP(plainOtp, hashed, past, 0);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('OTP_EXPIRED');
    });

    test('Enforces max 5 OTP verification attempts', () => {
      const plainOtp = '123456';
      const hashed = hashOTP(plainOtp);
      const future = new Date(Date.now() + 5 * 60 * 1000);
      const result = verifyOTP(plainOtp, hashed, future, 5, OTP_MAX_ATTEMPTS);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('OTP_MAX_ATTEMPTS');
    });

    test('Enforces resend cooldown rate limiting', () => {
      const identifier = 'rate_test_mobile_1';
      recordOtpSent(identifier);
      const check = checkOtpRateLimit(identifier, 60000);
      expect(check.allowed).toBe(false);
      expect(check.reason).toBe('COOLDOWN');
      expect(check.retryAfter).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. ACCOUNT LOCKOUT & BRUTE-FORCE PROTECTION
  // =========================================================================
  describe('3. Account Lockout & Brute-Force Protection', () => {
    test('Locks account after 5 consecutive failed login attempts', () => {
      const key = 'test_lockout_user_99';
      clearFailedLogins(key);

      // 4 failed attempts should not lock yet
      for (let i = 1; i <= 4; i++) {
        const record = recordFailedLogin(key);
        expect(record.count).toBe(i);
        expect(record.lockedUntil).toBeNull();
      }

      // 5th attempt locks the account
      const fifthRecord = recordFailedLogin(key);
      expect(fifthRecord.count).toBe(5);
      expect(fifthRecord.lockedUntil).toBeGreaterThan(Date.now());

      const status = checkLoginLockout(key);
      expect(status.locked).toBe(true);
      expect(status.remainingSeconds).toBeGreaterThan(0);

      clearFailedLogins(key);
    });

    test('Clears failed attempt tracker upon successful authentication', () => {
      const key = 'test_lockout_user_clear';
      recordFailedLogin(key);
      recordFailedLogin(key);
      expect(checkLoginLockout(key).locked).toBe(false);
      clearFailedLogins(key);
      const fresh = recordFailedLogin(key);
      expect(fresh.count).toBe(1);
      clearFailedLogins(key);
    });
  });

  // =========================================================================
  // 4. INPUT SANITIZATION & ATTACK PREVENTION (XSS & NoSQL INJECTION)
  // =========================================================================
  describe('4. Input Sanitization (XSS, NoSQL & Prototype Pollution)', () => {
    test('Sanitizes XSS scripts and dangerous event handlers from strings', () => {
      const dirty = '<script>alert("xss")</script>Hello <img src="x" onerror="alert(1)">World';
      const clean = sanitizeString(dirty);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('onerror=');
      expect(clean).toContain('Hello');
      expect(clean).toContain('World');
    });

    test('Strips javascript: pseudo-protocols from strings', () => {
      const dirty = 'javascript:evilFunction()';
      const clean = sanitizeString(dirty);
      expect(clean).not.toMatch(/javascript\s*:/i);
    });

    test('Strips leading $ from object keys to prevent NoSQL operator injection', () => {
      const maliciousPayload = {
        username: 'admin',
        $gt: '',
        $where: 'sleep(5000)',
        nested: {
          $ne: null,
          validKey: 'safeValue',
        },
      };
      const cleaned = sanitizeValue(maliciousPayload);
      expect(cleaned.$gt).toBeUndefined();
      expect(cleaned.$where).toBeUndefined();
      expect(cleaned.nested.$ne).toBeUndefined();
      expect(cleaned.username).toBe('admin');
      expect(cleaned.nested.validKey).toBe('safeValue');
    });

    test('Guards against prototype pollution (__proto__, constructor, prototype)', () => {
      const payload = JSON.parse('{"__proto__": {"polluted": true}, "constructor": "bad", "name": "clean"}');
      const sanitized = sanitizeValue(payload);
      expect(sanitized.__proto__.polluted).toBeUndefined();
      expect(sanitized.name).toBe('clean');
    });

    test('sanitizeRequest middleware automatically cleanses req.body, req.query, and req.params', () => {
      const { req, res } = mockReqRes({
        body: { query: '<script>bad()</script>', $inject: 'attack', normal: 'safe' },
        query: { search: '<img src=x onerror=alert(1)>' },
        params: { id: 'clean-id' },
      });
      let nextCalled = false;
      sanitizeRequest(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
      expect(req.body.$inject).toBeUndefined();
      expect(req.body.query).not.toContain('<script>');
      expect(req.body.normal).toBe('safe');
      expect(req.query.search).not.toContain('onerror=');
    });
  });

  // =========================================================================
  // 5. SECURE ERROR HANDLING & DATA REDACTION
  // =========================================================================
  describe('5. Secure Error Handling & Sensitive Data Redaction', () => {
    test('Redacts passwords, tokens, secrets, OTPs, and auth headers from log metadata', () => {
      const rawLog = {
        message: 'User authentication trace',
        user: {
          email: 'user@test.com',
          password: 'SecretPassword123!',
          newPassword: 'AnotherSecretPassword123!',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
          refreshToken: 'refresh_token_secret_123',
          otp: '654321',
          creditCard: '4111222233334444',
          cvv: '123',
        },
        headers: {
          authorization: 'Bearer eyJhbGciOi...',
          cookie: 'smartroute_token=xyz',
        },
      };

      const redacted = redactSensitiveData(rawLog);
      expect(redacted.user.password).toBe('[REDACTED]');
      expect(redacted.user.newPassword).toBe('[REDACTED]');
      expect(redacted.user.token).toBe('[REDACTED]');
      expect(redacted.user.refreshToken).toBe('[REDACTED]');
      expect(redacted.user.otp).toBe('[REDACTED]');
      expect(redacted.user.creditCard).toBe('[REDACTED]');
      expect(redacted.user.cvv).toBe('[REDACTED]');
      expect(redacted.headers.authorization).toBe('[REDACTED]');
      expect(redacted.headers.cookie).toBe('[REDACTED]');
      expect(redacted.user.email).toBe('user@test.com');
    });
  });

  // =========================================================================
  // 6. SESSION & TOKEN SECURITY (ROTATION, REVOCATION & REPLAY DETECTION)
  // =========================================================================
  describe('6. Session & Token Security (Rotation, Revocation & Replay Detection)', () => {
    test('Generates valid access tokens and refresh tokens with correct payload', () => {
      const testUser = {
        id: 'test-user-token-01',
        email: 'tokens@test.com',
        mobile: '9888877771',
        role: 'passenger',
        status: 'active',
      };
      const accessToken = generateAccessToken(testUser);
      const refreshToken = generateRefreshToken(testUser);

      const decodedAccess = verifyAccessToken(accessToken);
      expect(decodedAccess.id).toBe(testUser.id);
      expect(decodedAccess.email).toBe(testUser.email);
      expect(decodedAccess.role).toBe('passenger');

      const decodedRefresh = verifyRefreshToken(refreshToken);
      expect(decodedRefresh.id).toBe(testUser.id);
      expect(decodedRefresh.type).toBe('refresh');
    });

    test('Refresh token rotation detects token reuse and revokes user session', async () => {
      const mockUserId = 'user-replay-test-01';
      const mockUser = {
        id: mockUserId,
        email: 'replay@test.com',
        mobile: '9999988881',
        role: 'passenger',
        status: 'active',
        password_hash: await hashPassword('Secret@2026!Pass'),
      };
      users.push(mockUser);

      // Initial active refresh token
      const originalRefreshToken = generateRefreshToken(mockUser);
      updateUserInStore(mockUserId, { refresh_token: originalRefreshToken });

      // First refresh: valid exchange
      const { req: req1, res: res1 } = mockReqRes({
        body: { refreshToken: originalRefreshToken },
      });
      await refreshToken(req1, res1);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.refreshToken).toBeDefined();
      expect(res1.body.refreshToken).not.toBe(originalRefreshToken);

      // REPLAY ATTACK ATTEMPT: Submitting the already-used original refresh token
      const { req: req2, res: res2 } = mockReqRes({
        body: { refreshToken: originalRefreshToken },
      });
      await refreshToken(req2, res2);

      // Must be rejected with 403 REFRESH_TOKEN_REUSED
      expect(res2.statusCode).toBe(403);
      expect(res2.body.code).toBe('REFRESH_TOKEN_REUSED');

      // The active session must now be revoked
      expect(isSessionRevoked(mockUserId, Math.floor(Date.now() / 1000) - 1)).toBe(true);
      const updatedUser = findUserById(mockUserId);
      expect(updatedUser.refresh_token).toBeNull();
    });

    test('Session revocation marks old tokens as revoked', () => {
      const userId = 'revocation-user-01';
      const pastIat = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
      expect(isSessionRevoked(userId, pastIat)).toBe(false);

      revokeUserSession(userId);

      expect(isSessionRevoked(userId, pastIat)).toBe(true);
      const futureIat = Math.floor(Date.now() / 1000) + 10;
      expect(isSessionRevoked(userId, futureIat)).toBe(false);
    });

    test('Logout clears refresh token and revokes user session', async () => {
      const testUser = {
        id: 'logout-user-01',
        email: 'logout@test.com',
        mobile: '9111122223',
        role: 'passenger',
        status: 'active',
      };
      users.push(testUser);

      const token = generateAccessToken(testUser);
      const { req, res } = mockReqRes({
        user: testUser,
        headers: { authorization: `Bearer ${token}` },
      });

      await logout(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/logged out successfully/i);

      // Session must be revoked
      expect(isSessionRevoked(testUser.id, Math.floor(Date.now() / 1000) - 5)).toBe(true);
    });
  });

  // =========================================================================
  // 7. STRICT RBAC & TENANT ISOLATION
  // =========================================================================
  describe('7. Strict RBAC & Tenant Isolation', () => {
    test('Unauthenticated access to protected route returns 401 AUTH_REQUIRED', async () => {
      const { req, res } = mockReqRes({});
      let nextCalled = false;
      await authenticate(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe('AUTH_REQUIRED');
    });

    test('Passenger token cannot access Travel Owner role (RBAC enforcement)', () => {
      const passengerUser = {
        id: 'passenger-rbac-01',
        email: 'pass.rbac@test.com',
        mobile: '9222233334',
        role: 'passenger',
        status: 'active',
      };
      const { req, res } = mockReqRes({ user: passengerUser });
      let nextCalled = false;
      authorize('travel_owner')(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    test('Operator with no travelId is blocked by tenantIsolation with NO_TENANT', () => {
      const managerUser = {
        id: 'manager-no-tenant',
        email: 'manager.notenant@test.com',
        role: 'manager',
        travelId: null,
      };
      const { req, res } = mockReqRes({ user: managerUser });
      let nextCalled = false;
      tenantIsolation(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('NO_TENANT');
    });

    test('Operator with valid travelId passes tenantIsolation and sets req.travelId', () => {
      const managerUser = {
        id: 'manager-with-tenant',
        email: 'manager.withtenant@test.com',
        role: 'manager',
        travelId: 'travel-tenant-uuid-1234',
      };
      const { req, res } = mockReqRes({ user: managerUser });
      let nextCalled = false;
      tenantIsolation(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
      expect(req.travelId).toBe('travel-tenant-uuid-1234');
    });
  });

  // =========================================================================
  // 8. PASSWORD RESET & CHANGE WORKFLOWS END-TO-END
  // =========================================================================
  describe('8. Password Reset & Change Workflows End-to-End', () => {
    const testEmail = 'pwd.reset.test@smartroute.in';
    const testMobile = '9777766661';
    let testUser = null;

    beforeEach(async () => {
      const hash = await hashPassword('Initial@Pass123!');
      testUser = {
        id: 'pwd-reset-user-id-01',
        email: testEmail,
        mobile: testMobile,
        role: 'passenger',
        status: 'active',
        password_hash: hash,
      };
      const existing = users.findIndex((u) => u.id === testUser.id);
      if (existing >= 0) {
        users[existing] = testUser;
      } else {
        users.push(testUser);
      }
    });

    test('Forgot Password requests generate 6-digit OTP and rate-limits rapid repeated requests', async () => {
      // First request: success
      const { req: req1, res: res1 } = mockReqRes({
        body: { identifier: testEmail },
      });
      await forgotPassword(req1, res1);

      expect(res1.statusCode).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.devOtp).toBeDefined();
      expect(res1.body.devOtp).toHaveLength(6);

      // Immediate repeated request: rate-limited with 429
      const { req: req2, res: res2 } = mockReqRes({
        body: { identifier: testEmail },
      });
      await forgotPassword(req2, res2);

      expect(res2.statusCode).toBe(429);
      expect(res2.body.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(res2.body.retryAfter).toBeGreaterThan(0);
    });

    test('Reset Password rejects mismatched passwords and weak passwords', async () => {
      const { req: req1, res: res1 } = mockReqRes({
        body: {
          identifier: testMobile,
          otp: '123456',
          newPassword: 'short',
          confirmPassword: 'short',
        },
      });
      await resetPassword(req1, res1);

      expect(res1.statusCode).toBe(400);
      expect(res1.body.code).toBe('WEAK_PASSWORD');

      const { req: req2, res: res2 } = mockReqRes({
        body: {
          identifier: testMobile,
          otp: '123456',
          newPassword: 'Valid@Password123!',
          confirmPassword: 'Different@Password123!',
        },
      });
      await resetPassword(req2, res2);

      expect(res2.statusCode).toBe(400);
      expect(res2.body.code).toBe('PASSWORD_MISMATCH');
    });

    test('Reset Password successfully updates password hash with bcrypt salt >= 12 and invalidates old sessions', async () => {
      // 1. Request forgot password OTP
      const { req: fReq, res: fRes } = mockReqRes({
        body: { identifier: testMobile },
      });
      await forgotPassword(fReq, fRes);

      expect(fRes.statusCode).toBe(200);
      const otp = fRes.body.devOtp;
      expect(otp).toBeDefined();

      const newPlainPassword = 'BrandNewSecure@2026#Password';

      // 2. Submit reset password
      const { req: rReq, res: rRes } = mockReqRes({
        body: {
          identifier: testMobile,
          otp,
          newPassword: newPlainPassword,
          confirmPassword: newPlainPassword,
        },
      });
      await resetPassword(rReq, rRes);

      expect(rRes.statusCode).toBe(200);
      expect(rRes.body.success).toBe(true);

      // 3. Verify user password_hash in store was updated with valid bcrypt hash
      const updatedUser = findUserById(testUser.id);
      expect(updatedUser.password_hash).toMatch(/^\$2[ab]\$12\$/);
      const isMatch = await comparePassword(newPlainPassword, updatedUser.password_hash);
      expect(isMatch).toBe(true);

      // 4. Verify previous sessions are revoked
      expect(isSessionRevoked(testUser.id, Math.floor(Date.now() / 1000) - 1)).toBe(true);
    });

    test('Change Password verifies current password, rejects identical password, and rotates tokens', async () => {
      const currentPass = 'Initial@Pass123!';
      const token = generateAccessToken(testUser);

      // 1. Rejects wrong current password
      const { req: wReq, res: wRes } = mockReqRes({
        user: testUser,
        body: {
          currentPassword: 'WrongCurrentPassword#123!',
          newPassword: 'BrandNew@Pass2026#Valid',
          confirmPassword: 'BrandNew@Pass2026#Valid',
        },
      });
      await changePassword(wReq, wRes);

      expect(wRes.statusCode).toBe(400);
      expect(wRes.body.code).toBe('INVALID_CURRENT_PASSWORD');

      // 2. Rejects new password identical to current password
      const { req: sReq, res: sRes } = mockReqRes({
        user: testUser,
        body: {
          currentPassword: currentPass,
          newPassword: currentPass,
          confirmPassword: currentPass,
        },
      });
      await changePassword(sReq, sRes);

      expect(sRes.statusCode).toBe(400);
      expect(sRes.body.code).toBe('PASSWORD_SAME_AS_CURRENT');

      // 3. Successfully changes password and issues new tokens
      const newPass = 'UpdatedSecure@2026#NewPass';
      const { req: cReq, res: cRes } = mockReqRes({
        user: testUser,
        body: {
          currentPassword: currentPass,
          newPassword: newPass,
          confirmPassword: newPass,
        },
      });
      await changePassword(cReq, cRes);

      expect(cRes.statusCode).toBe(200);
      expect(cRes.body.success).toBe(true);
      expect(cRes.body.accessToken).toBeDefined();
      expect(cRes.body.refreshToken).toBeDefined();

      // Verify stored password hash updated
      const updated = findUserById(testUser.id);
      const isValidNewPass = await comparePassword(newPass, updated.password_hash);
      expect(isValidNewPass).toBe(true);
    });
  });
});
