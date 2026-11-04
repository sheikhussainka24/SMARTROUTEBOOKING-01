/**
 * SMART ROUTE — Role Hierarchy and Definition
 * 
 * SUPER ADMIN / FOUNDER
 *        ↓
 *   TRAVEL OWNER
 *        ↓
 *     MANAGER
 *        ↓
 *  DRIVER / STAFF
 * 
 * PASSENGER (Independent customer role)
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TRAVEL_OWNER: 'travel_owner',
  MANAGER: 'manager',
  STAFF: 'staff',
  DRIVER: 'driver',
  PASSENGER: 'passenger',
};

export const STAFF_DEPARTMENTS = [
  'booking_staff',
  'customer_support',
  'operations_staff',
  'accounts_staff',
  'fleet_staff',
];

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.TRAVEL_OWNER]: 80,
  [ROLES.MANAGER]: 60,
  [ROLES.STAFF]: 40,
  [ROLES.DRIVER]: 20,
  [ROLES.PASSENGER]: 10,
};

export function hasHigherOrEqualRole(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}
