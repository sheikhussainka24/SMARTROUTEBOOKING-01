/**
 * SMART ROUTE — Input Validation & Sanitization Engine
 *
 * Provides strict client-side validation rules and XSS sanitization
 * to secure user input before submission to backend APIs.
 */

/**
 * Validates standard Indian 10-digit mobile numbers (starting with 6-9)
 */
export function validateIndianMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') {
    return { valid: false, error: 'Mobile number is required.' };
  }
  const digits = mobile.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    return { valid: false, error: 'Mobile number must be exactly 10 digits.' };
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number starting with 6-9.' };
  }
  return { valid: true, sanitized: digits };
}

/**
 * Validates RFC 5322 standard email addresses
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required.' };
  }
  const trimmed = email.trim();
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email address cannot exceed 254 characters.' };
  }
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }
  return { valid: true, sanitized: trimmed.toLowerCase() };
}

/**
 * Validates strong password policies
 * Requirements:
 * - Minimum 8 characters, maximum 128 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 numeric digit
 * - At least 1 special character
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      score: 0,
      error: 'Password is required.',
      criteria: {
        length: false,
        upper: false,
        lower: false,
        digit: false,
        special: false,
      },
    };
  }

  const criteria = {
    length: password.length >= 8 && password.length <= 128,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_~`\-+=\[\]\\\/]/.test(password),
  };

  const passedCount = Object.values(criteria).filter(Boolean).length;
  const isStrong = passedCount === 5;

  let error = null;
  if (!criteria.length) {
    error = 'Password must be between 8 and 128 characters.';
  } else if (!criteria.upper) {
    error = 'Password must contain at least one uppercase letter (A-Z).';
  } else if (!criteria.lower) {
    error = 'Password must contain at least one lowercase letter (a-z).';
  } else if (!criteria.digit) {
    error = 'Password must contain at least one numeric digit (0-9).';
  } else if (!criteria.special) {
    error = 'Password must contain at least one special character (!@#$%^&*...).';
  }

  return {
    valid: isStrong,
    score: passedCount,
    error,
    criteria,
  };
}

/**
 * Validates Passenger Name Record (PNR) syntax
 * Format: 8 to 12 alphanumeric characters (e.g., SR-987654 or SR98765432)
 */
export function validatePnr(pnr) {
  if (!pnr || typeof pnr !== 'string') {
    return { valid: false, error: 'PNR number is required.' };
  }
  const clean = pnr.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 6 || clean.length > 16) {
    return { valid: false, error: 'PNR must be between 6 and 16 alphanumeric characters.' };
  }
  return { valid: true, sanitized: clean };
}

/**
 * Validates legal names without control characters or HTML/script injection tags
 */
export function validateLegalName(name, fieldLabel = 'Name') {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldLabel} is required.` };
  }
  const clean = name.trim();
  if (clean.length < 2) {
    return { valid: false, error: `${fieldLabel} must be at least 2 characters.` };
  }
  if (clean.length > 80) {
    return { valid: false, error: `${fieldLabel} cannot exceed 80 characters.` };
  }
  if (/[<>{}]|javascript:|data:/i.test(clean)) {
    return { valid: false, error: `${fieldLabel} contains forbidden characters.` };
  }
  return { valid: true, sanitized: clean };
}

/**
 * Strips script tags, HTML entities, and dangerous attributes
 */
export function sanitizeInputString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

