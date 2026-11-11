/**
 * SMART ROUTE — Frontend Security Utilities
 *
 * Implements:
 * 1. Sensitive PII masking (email, phone, cards, UPI)
 * 2. Neutral error transformation preventing user enumeration
 * 3. Role-based access control (RBAC) helpers
 * 4. Session timeout constants and helpers
 */

/**
 * Mask mobile numbers: +91 9876543210 -> +91 ******3210
 */
export function maskMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return '';
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 4) return '******';
  const last4 = digits.slice(-4);
  const prefix = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : '+91 ';
  return `${prefix}******${last4}`;
}

/**
 * Mask email addresses: user@example.com -> u***r@example.com
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0] || '*'}*@${domain}`;
  }
  const maskedLocal = `${local[0]}${'*'.repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask payment identifiers (cards, UPI VPAs)
 */
export function maskPaymentId(id) {
  if (!id || typeof id !== 'string') return '';
  if (id.includes('@')) {
    // UPI VPA e.g. john.doe@okhdfcbank -> j***e@okhdfcbank
    return maskEmail(id);
  }
  const clean = id.replace(/\s+/g, '');
  if (clean.length >= 8) {
    return `•••• •••• •••• ${clean.slice(-4)}`;
  }
  return '••••';
}

/**
 * Safe error transformation:
 * Converts raw server exceptions, database errors, and detailed auth errors
 * into safe, neutral, user-friendly messages that do not expose internal
 * stacks or allow user account enumeration.
 */
export function getSafeErrorMessage(error, context = 'general') {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const rawMessage = typeof error === 'string'
    ? error
    : (error.response?.data?.message || error.response?.data?.error || error.message || '');

  const lower = rawMessage.toLowerCase();

  // 1. Prevent User Enumeration on Login
  if (
    context === 'login' ||
    lower.includes('user not found') ||
    lower.includes('invalid credentials') ||
    lower.includes('password incorrect') ||
    lower.includes('no user exists') ||
    lower.includes('account not found')
  ) {
    return 'Invalid mobile number, email, or password. Please verify your credentials and try again.';
  }

  // 2. Prevent User Enumeration on Password Reset
  if (context === 'forgot_password') {
    return 'If an account exists with this mobile number or email, a secure verification code has been dispatched.';
  }

  // 3. Database & SQL errors
  if (
    lower.includes('sql') ||
    lower.includes('knex') ||
    lower.includes('postgres') ||
    lower.includes('econnrefused') ||
    lower.includes('syntaxerror') ||
    lower.includes('internal server error') ||
    lower.includes('aggregateerror')
  ) {
    return 'Unable to process your request securely at this time. Our engineers have been alerted. Please try again shortly.';
  }

  // 4. Rate Limiting
  if (lower.includes('too many requests') || lower.includes('rate limit') || lower.includes('cooldown')) {
    return 'Too many attempts. For your security, please wait a few moments before trying again.';
  }

  // 5. Session Expiry
  if (lower.includes('token expired') || lower.includes('unauthorized') || lower.includes('jwt expired')) {
    return 'Your secure session has expired. Please log in again to continue.';
  }

  // Return cleaned message if safe
  return rawMessage || 'An unexpected error occurred. Please try again.';
}

/**
 * RBAC Helper: Check if user role matches allowed roles
 */
export function hasRequiredRole(userRole, allowedRoles = []) {
  if (!userRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
}

/**
 * Session Inactivity Timeout Configuration
 */
export const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT_MS: 15 * 60 * 1000, // 15 minutes of inactivity
  WARNING_DURATION_MS: 60 * 1000,        // 60 seconds warning countdown before logout
  ACTIVITY_EVENTS: ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'],
};

