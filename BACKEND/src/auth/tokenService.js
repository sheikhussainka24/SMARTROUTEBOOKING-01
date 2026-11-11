import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index.js';

// In-memory revocation tracking: userId -> timestamp after which tokens are valid
const revokedSessions = new Map();

/**
 * Generate short-lived JWT access token
 */
export function generateAccessToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    status: user.status || 'active',
    travelId: user.travel_id || user.travelId || null,
  };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry || '30d',
  });
}

/**
 * Generate refresh token with unique jti to detect reuse
 */
export function generateRefreshToken(userOrId) {
  const id = typeof userOrId === 'object' && userOrId !== null ? userOrId.id : userOrId;
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign(
    { id, type: 'refresh', jti },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry || '365d' }
  );
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

/**
 * Hash a refresh token for safe storage
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Revoke all tokens for a user (e.g. on password change, reset, or logout)
 */
export function revokeUserSession(userId) {
  revokedSessions.set(userId, Math.floor(Date.now() / 1000));
}

/**
 * Check if a token was issued before the user's session was revoked
 */
export function isSessionRevoked(userId, tokenIat) {
  const revokedAt = revokedSessions.get(userId);
  if (!revokedAt) return false;
  return tokenIat < revokedAt;
}
