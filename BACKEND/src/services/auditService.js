import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Audit Log Service
 * Records important actions for security and compliance
 */

export async function createAuditLog({
  userId,
  userRole,
  travelId,
  action,
  resourceType,
  resourceId,
  oldValues,
  newValues,
  ipAddress,
  userAgent,
  result = 'success',
  details,
}) {
  if (!isDbConnected()) {
    // Database is not connected; skip PostgreSQL audit insert to avoid connection retry overhead
    return;
  }
  try {
    await db('audit_logs').insert({
      user_id: userId,
      user_role: userRole,
      travel_id: travelId || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      ip_address: ipAddress,
      user_agent: userAgent,
      result,
      details,
    });
  } catch (error) {
    // Don't let audit log failures crash the application
    logger.error('Audit log creation failed:', error);
  }
}

/**
 * Express middleware that creates audit logs for route handlers
 */
export function auditMiddleware(action, resourceType) {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    res.json = function (data) {
      // Log after response is sent
      const result = res.statusCode < 400 ? 'success' : 'failure';
      
      createAuditLog({
        userId: req.user?.id,
        userRole: req.user?.role,
        travelId: req.user?.travelId || req.travelId,
        action,
        resourceType,
        resourceId: req.params?.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        result,
        details: result === 'failure' ? data?.error : undefined,
      });

      return originalJson(data);
    };

    next();
  };
}
