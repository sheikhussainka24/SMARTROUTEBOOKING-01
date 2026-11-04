import crypto from 'crypto';
import config from '../config/index.js';

/**
 * Generate a cryptographically random 6-digit numeric OTP
 */
export function generateOTP() {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, '0');
}

/**
 * Hash OTP before database storage
 */
export function hashOTP(otp) {
  return crypto.createHmac('sha256', config.otp.secret).update(otp).digest('hex');
}

/**
 * Verify plaintext OTP against hashed OTP
 */
export function verifyOTP(plainOtp, hashedOtp, expiresAt) {
  if (new Date() > new Date(expiresAt)) {
    return { valid: false, reason: 'EXPIRED' };
  }
  const computedHash = hashOTP(plainOtp);
  if (computedHash !== hashedOtp) {
    return { valid: false, reason: 'INVALID' };
  }
  return { valid: true };
}

/**
 * Get OTP expiration time
 */
export function getOTPExpiry(minutes = config.otp.expiryMinutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
