import { describe, test, expect } from '@jest/globals';
import {
  validateIndianMobile,
  validateEmail,
  validatePassword,
  validatePnr,
  validateLegalName,
  sanitizeInputString,
} from '../../FRONTEND/src/utils/inputValidators.js';

import {
  maskMobile,
  maskEmail,
  maskPaymentId,
  getSafeErrorMessage,
  hasRequiredRole,
  SESSION_CONFIG,
} from '../../FRONTEND/src/utils/securityUtils.js';

import { getRoleRedirect, CANONICAL_ROLES } from '../../FRONTEND/src/utils/roleRoutes.js';

describe('SMART ROUTE — Secure UI Design & Defensive Architecture Suite', () => {
  // ==================== 1. STRONG PASSWORD POLICY ====================
  describe('1. Strong Password Policy & Validation', () => {
    test('Rejects passwords shorter than 8 characters', () => {
      const res = validatePassword('Pass1!');
      expect(res.valid).toBe(false);
      expect(res.criteria.length).toBe(false);
      expect(res.error).toMatch(/between 8 and 128 characters/i);
    });

    test('Rejects passwords without uppercase letters', () => {
      const res = validatePassword('password123!');
      expect(res.valid).toBe(false);
      expect(res.criteria.upper).toBe(false);
      expect(res.error).toMatch(/uppercase/i);
    });

    test('Rejects passwords without lowercase letters', () => {
      const res = validatePassword('PASSWORD123!');
      expect(res.valid).toBe(false);
      expect(res.criteria.lower).toBe(false);
      expect(res.error).toMatch(/lowercase/i);
    });

    test('Rejects passwords without numeric digits', () => {
      const res = validatePassword('Password!@#');
      expect(res.valid).toBe(false);
      expect(res.criteria.digit).toBe(false);
      expect(res.error).toMatch(/numeric digit/i);
    });

    test('Rejects passwords without special characters', () => {
      const res = validatePassword('Password123');
      expect(res.valid).toBe(false);
      expect(res.criteria.special).toBe(false);
      expect(res.error).toMatch(/special character/i);
    });

    test('Rejects passwords exceeding 128 characters (DoS prevention)', () => {
      const longPwd = 'A1!' + 'a'.repeat(130);
      const res = validatePassword(longPwd);
      expect(res.valid).toBe(false);
      expect(res.criteria.length).toBe(false);
    });

    test('Accepts compliant strong passwords with full score', () => {
      const res = validatePassword('SmartRoute@2026');
      expect(res.valid).toBe(true);
      expect(res.score).toBe(5);
      expect(res.error).toBeNull();
      expect(res.criteria.length).toBe(true);
      expect(res.criteria.upper).toBe(true);
      expect(res.criteria.lower).toBe(true);
      expect(res.criteria.digit).toBe(true);
      expect(res.criteria.special).toBe(true);
    });
  });

  // ==================== 2. MULTI-FACTOR AUTHENTICATION & PII MASKING ====================
  describe('2. Multi-Factor Authentication & Sensitive Data Masking', () => {
    test('Masks mobile phone numbers to prevent shoulder surfing and PII exposure', () => {
      expect(maskMobile('9876543210')).toBe('+91 ******3210');
      expect(maskMobile('+919876543210')).toBe('+91 ******3210');
      expect(maskMobile('7890')).toBe('+91 ******7890');
      expect(maskMobile('')).toBe('');
    });

    test('Masks email addresses preserving domain context while protecting identity', () => {
      expect(maskEmail('passenger@smartroute.in')).toBe('p*******r@smartroute.in');
      expect(maskEmail('admin@smartroutebooking.com')).toBe('a***n@smartroutebooking.com');
      expect(maskEmail('ab@domain.com')).toBe('a*@domain.com');
    });

    test('Masks payment identifiers (cards and UPI VPAs)', () => {
      expect(maskPaymentId('4111222233334444')).toBe('•••• •••• •••• 4444');
      expect(maskPaymentId('john.doe@okicici')).toBe('j******e@okicici');
    });
  });

  // ==================== 3. INPUT VALIDATION & SANITIZATION ====================
  describe('3. Client-Side Input Validation & Sanitization', () => {
    test('Validates Indian mobile numbers (10 digits starting with 6-9)', () => {
      expect(validateIndianMobile('9876543210').valid).toBe(true);
      expect(validateIndianMobile('8123456789').valid).toBe(true);
      expect(validateIndianMobile('7000000001').valid).toBe(true);
      expect(validateIndianMobile('6380123456').valid).toBe(true);

      // Rejects invalid formats
      expect(validateIndianMobile('1234567890').valid).toBe(false);
      expect(validateIndianMobile('98765').valid).toBe(false);
      expect(validateIndianMobile('').valid).toBe(false);
    });

    test('Validates RFC-compliant email addresses', () => {
      expect(validateEmail('user@smartroute.in').valid).toBe(true);
      expect(validateEmail('test.passenger+tag@domain.co.in').valid).toBe(true);

      // Rejects invalid formats
      expect(validateEmail('invalid-email').valid).toBe(false);
      expect(validateEmail('user@').valid).toBe(false);
      expect(validateEmail('@domain.com').valid).toBe(false);
    });

    test('Validates PNR alphanumeric syntax', () => {
      expect(validatePnr('SR-892104').valid).toBe(true);
      expect(validatePnr('SR892104').sanitized).toBe('SR892104');
      expect(validatePnr('12').valid).toBe(false); // too short
    });

    test('Validates legal names rejecting HTML tags and injection payloads', () => {
      expect(validateLegalName('Sundar Pichai').valid).toBe(true);
      expect(validateLegalName('<script>alert(1)</script>').valid).toBe(false);
      expect(validateLegalName('A').valid).toBe(false); // too short
    });

    test('Sanitizes XSS tags and javascript: pseudo-protocols', () => {
      const malicious = '<script>fetch("http://evil.com")</script>Hello World';
      expect(sanitizeInputString(malicious)).toBe('Hello World');
      expect(sanitizeInputString('javascript:void(0)')).toBe('void(0)');
    });
  });

  // ==================== 4. PROPER ERROR MESSAGES (NO ENUMERATION OR LEAKS) ====================
  describe('4. Proper Error Messages Without Sensitive Details', () => {
    test('Transforms specific user-not-found errors to generic auth message (prevents user enumeration)', () => {
      const safe = getSafeErrorMessage('User not found with email user@example.com', 'login');
      expect(safe).toBe('Invalid mobile number, email, or password. Please verify your credentials and try again.');
    });

    test('Transforms incorrect password error to generic auth message', () => {
      const safe = getSafeErrorMessage('Password incorrect for user', 'login');
      expect(safe).toBe('Invalid mobile number, email, or password. Please verify your credentials and try again.');
    });

    test('Transforms forgot-password errors to neutral confirmation message', () => {
      const safe = getSafeErrorMessage('No account associated with mobile', 'forgot_password');
      expect(safe).toBe('If an account exists with this mobile number or email, a secure verification code has been dispatched.');
    });

    test('Suppresses raw SQL and database schema error details', () => {
      const sqlError = 'select * from "users" where "id" = $1 - Knex: Timeout acquiring a connection';
      const safe = getSafeErrorMessage(sqlError);
      expect(safe).not.toContain('Knex');
      expect(safe).not.toContain('select *');
      expect(safe).toMatch(/Unable to process your request securely/i);
    });

    test('Converts rate limit errors to polite security delay message', () => {
      const safe = getSafeErrorMessage('Too many requests, please slow down');
      expect(safe).toMatch(/Too many attempts/i);
    });
  });

  // ==================== 5. AUTOMATIC SESSION TIMEOUT ====================
  describe('5. Automatic Session Timeout & Inactivity Monitoring', () => {
    test('Configures standard 15-minute inactivity threshold and 60-second warning', () => {
      expect(SESSION_CONFIG.INACTIVITY_TIMEOUT_MS).toBe(15 * 60 * 1000); // 15 mins
      expect(SESSION_CONFIG.WARNING_DURATION_MS).toBe(60 * 1000);         // 60 secs
    });

    test('Monitors key interaction events across keyboard, pointer, and touch', () => {
      expect(SESSION_CONFIG.ACTIVITY_EVENTS).toContain('mousemove');
      expect(SESSION_CONFIG.ACTIVITY_EVENTS).toContain('mousedown');
      expect(SESSION_CONFIG.ACTIVITY_EVENTS).toContain('keydown');
      expect(SESSION_CONFIG.ACTIVITY_EVENTS).toContain('scroll');
      expect(SESSION_CONFIG.ACTIVITY_EVENTS).toContain('touchstart');
    });
  });

  // ==================== 6. ROLE-BASED ACCESS CONTROL (RBAC) ====================
  describe('6. Role-Based Access Control (RBAC) & Navigation', () => {
    test('hasRequiredRole correctly validates role against allowed list', () => {
      expect(hasRequiredRole('super_admin', ['super_admin', 'admin'])).toBe(true);
      expect(hasRequiredRole('passenger', ['super_admin', 'travel_owner'])).toBe(false);
      expect(hasRequiredRole('travel_owner', ['travel_owner', 'manager'])).toBe(true);
      expect(hasRequiredRole(null, ['passenger'])).toBe(false);
    });

    test('getRoleRedirect maps canonical roles to designated secure portals', () => {
      expect(getRoleRedirect(CANONICAL_ROLES.SUPER_ADMIN)).toBe('/admin/dashboard');
      expect(getRoleRedirect(CANONICAL_ROLES.TRAVEL_OWNER)).toBe('/operator/dashboard');
      expect(getRoleRedirect(CANONICAL_ROLES.DRIVER)).toBe('/driver/dashboard');
      expect(getRoleRedirect(CANONICAL_ROLES.PASSENGER)).toBe('/search');
    });
  });
});
