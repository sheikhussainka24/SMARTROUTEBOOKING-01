import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';
import { findUserById } from '../services/dataStore.js';

/**
 * Authentication Middleware
 * Verifies JWT access token and attaches user to request
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      mobile: decoded.mobile,
      role: decoded.role,
      status: decoded.status || 'active',
      travelId: decoded.travelId,
    };

    // Live account status verification against authoritative store
    let liveUser = null;
    if (isDbConnected()) {
      try {
        liveUser = await db('users').where('id', decoded.id).select('status', 'role').first();
      } catch (e) {
        logger.warn('DB lookup in authenticate error:', e.message);
      }
    }
    if (!liveUser) {
      liveUser = findUserById(decoded.id);
    }

    if (liveUser) {
      if (liveUser.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: 'Account is suspended. Contact support.',
          code: 'ACCOUNT_SUSPENDED',
        });
      }
      if (liveUser.status === 'rejected') {
        return res.status(403).json({
          success: false,
          error: 'Account application was rejected',
          code: 'ACCOUNT_REJECTED',
        });
      }
      req.user.status = liveUser.status;
      req.user.role = liveUser.role;
    } else if (decoded.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account is suspended. Contact support.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Optional authentication - attaches user if token present but doesn't block
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        mobile: decoded.mobile,
        role: decoded.role,
        travelId: decoded.travelId,
      };
    }
  } catch (error) {
    // Silently continue without auth
  }
  next();
}

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}

/**
 * Permission-based access control middleware
 * Checks if user has specific permission codes
 * @param  {...string} permissionCodes - Required permission codes (any one match suffices)
 */
export function requirePermission(...permissionCodes) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    // Super admin and travel_owner have all permissions
    if (['super_admin', 'travel_owner'].includes(req.user.role)) {
      return next();
    }

    try {
      const userPermissions = await db('user_permissions')
        .join('permissions', 'user_permissions.permission_id', 'permissions.id')
        .where('user_permissions.user_id', req.user.id)
        .select('permissions.code');

      const userPermCodes = userPermissions.map((p) => p.code);
      const hasPermission = permissionCodes.some((code) => userPermCodes.includes(code));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'You do not have the required permission',
          code: 'PERMISSION_DENIED',
          required: permissionCodes,
        });
      }

      req.userPermissions = userPermCodes;
      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission verification failed',
        code: 'PERMISSION_ERROR',
      });
    }
  };
}

/**
 * Tenant isolation middleware
 * Ensures users can only access resources within their travel
 */
export function tenantIsolation(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  // Super admin can access all tenants
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Passengers don't need tenant isolation (they access public trip data)
  if (req.user.role === 'passenger') {
    return next();
  }

  // Other roles must have a travel_id
  if (!req.user.travelId) {
    return res.status(403).json({
      success: false,
      error: 'Not associated with any travel',
      code: 'NO_TENANT',
    });
  }

  // Attach travel filter for downstream queries
  req.travelId = req.user.travelId;
  next();
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status || 'active',
      travelId: user.travel_id || null,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(user) {
  const id = typeof user === 'object' && user !== null ? user.id : user;
  return jwt.sign(
    { id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

// Aliases
export const authorizeRole = authorize;
export const authenticateOptional = optionalAuth;

