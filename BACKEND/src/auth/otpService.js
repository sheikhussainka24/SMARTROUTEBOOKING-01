import crypto from 'crypto';
import config from '../config/index.js';

export const OTP_MAX_ATTEMPTS = 5;
export const OTP_COOLDOWN_MS = 60000; // 60 seconds
export const OTP_HOURLY_LIMIT = 5;

const otpTracker = new Map();

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateOTP() {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, '0');
}

/**
 * Hash OTP before database/cache storage
 */
export function hashOTP(otp) {
  return crypto.createHmac('sha256', config.otp.secret).update(String(otp).trim()).digest('hex');
}

/**
 * Verify plaintext OTP against hashed OTP with constant-time equality
 */
export function verifyOTP(plainOtp, hashedOtp, expiresAt, attempts = 0, maxAttempts = OTP_MAX_ATTEMPTS) {
  if (attempts >= maxAttempts) {
    return { valid: false, reason: 'MAX_ATTEMPTS_EXCEEDED', code: 'OTP_MAX_ATTEMPTS' };
  }

  if (new Date() > new Date(expiresAt)) {
    return { valid: false, reason: 'EXPIRED', code: 'OTP_EXPIRED' };
  }

  const computedHash = hashOTP(plainOtp);
  const hashBuffer = Buffer.from(computedHash, 'hex');
  const storedBuffer = Buffer.from(hashedOtp, 'hex');

  if (hashBuffer.length !== storedBuffer.length || !crypto.timingSafeEqual(hashBuffer, storedBuffer)) {
    return { valid: false, reason: 'INVALID', code: 'OTP_WRONG' };
  }

  return { valid: true };
}

/**
 * Get OTP expiration time
 */
export function getOTPExpiry(minutes = config.otp.expiryMinutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if user is rate-limited from requesting another OTP
 */
export function checkOtpRateLimit(identifier, cooldownMs = OTP_COOLDOWN_MS) {
  const now = Date.now();
  const state = otpTracker.get(identifier) || { lastSent: 0, timestamps: [] };

  // Filter timestamps to past 1 hour
  const oneHourAgo = now - 3600000;
  state.timestamps = state.timestamps.filter((t) => t > oneHourAgo);

  if (now - state.lastSent < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - (now - state.lastSent)) / 1000);
    return { allowed: false, reason: 'COOLDOWN', retryAfter: waitSeconds };
  }

  if (state.timestamps.length >= OTP_HOURLY_LIMIT) {
    return { allowed: false, reason: 'HOURLY_LIMIT_EXCEEDED', retryAfter: 3600 };
  }

  return { allowed: true };
}

/**
 * Record an OTP send event for rate limiting
 */
export function recordOtpSent(identifier) {
  const now = Date.now();
  const state = otpTracker.get(identifier) || { lastSent: 0, timestamps: [] };
  state.lastSent = now;
  state.timestamps.push(now);
  otpTracker.set(identifier, state);
}
