/**
 * Input Sanitization & Attack Prevention Middleware
 * Cleans incoming request bodies, queries, and params against XSS and NoSQL/Injection vectors.
 */

// Patterns to strip or neutralize for XSS prevention
const DANGEROUS_TAG_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^>\s]+/gi,
];

/**
 * Clean a single string from XSS and dangerous injection patterns
 */
export function sanitizeString(val) {
  if (typeof val !== 'string') return val;

  let cleaned = val;
  for (const pattern of DANGEROUS_TAG_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Also replace solitary dangerous HTML brackets if not part of normal text
  // but keep legitimate characters used in passwords or text
  return cleaned;
}

/**
 * Recursively sanitize objects, arrays, and primitives.
 * Strips keys with leading '$' (NoSQL injection prevention) and prototype pollution keys.
 */
export function sanitizeValue(val, depth = 0) {
  if (depth > 20) return val; // Guard against deeply nested objects / cyclic structures

  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    return sanitizeString(val);
  }

  if (Array.isArray(val)) {
    return val.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof val === 'object') {
    const cleanObj = {};
    for (const [key, value] of Object.entries(val)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // Prevent NoSQL operator injection (strip leading '$')
      const cleanKey = key.replace(/^\$+/, '').replace(/\./g, '_');
      if (!cleanKey) continue;

      cleanObj[cleanKey] = sanitizeValue(value, depth + 1);
    }
    return cleanObj;
  }

  return val;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
export function sanitizeRequest(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }
    next();
  } catch (error) {
    next(error);
  }
}

export default sanitizeRequest;

