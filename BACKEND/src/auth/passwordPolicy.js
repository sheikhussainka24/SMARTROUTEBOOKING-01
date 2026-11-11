import bcrypt from 'bcryptjs';
import config from '../config/index.js';

// Common weak / easily guessable passwords to reject
const COMMON_WEAK_PASSWORDS = new Set([
  'password123!',
  'password@123',
  'admin12345!',
  'admin@123',
  'qwerty1234!',
  'welcome123!',
  'welcome@123',
  'letmein123!',
  'smartroute123!',
  'pass12345!',
]);

/**
 * Hash password with bcrypt (enforcing minimum 12 salt rounds)
 */
export async function hashPassword(plainPassword) {
  const configuredRounds = parseInt(config.bcrypt?.saltRounds || '12', 10);
  const saltRounds = Math.max(12, isNaN(configuredRounds) ? 12 : configuredRounds);
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Validate password complexity:
 * - At least 8 characters (supports up to 128 characters)
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains digit
 * - Contains special character
 * - Not in common weak passwords list
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must not exceed 128 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_~`\-+=\[\]\\\/]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*...)' };
  }
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, message: 'Password is too common or easily guessable. Please choose a more secure password.' };
  }
  return { valid: true };
}

/**
 * Validate that two password fields match exactly
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword) {
    return { valid: false, message: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match. Please verify both password fields.' };
  }
  return { valid: true };
}
