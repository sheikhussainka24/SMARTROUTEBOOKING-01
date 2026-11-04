import { ROLES, hasHigherOrEqualRole } from '../../BACKEND/src/permissions/roles.js';
import { hasPermission } from '../../BACKEND/src/permissions/rolePermissions.js';
import { PERMISSIONS } from '../../BACKEND/src/permissions/permissions.js';

describe('Role Hierarchy & Granular RBAC Tests', () => {
  test('Role level checks follow strict hierarchy', () => {
    expect(hasHigherOrEqualRole(ROLES.SUPER_ADMIN, ROLES.TRAVEL_OWNER)).toBe(true);
    expect(hasHigherOrEqualRole(ROLES.TRAVEL_OWNER, ROLES.MANAGER)).toBe(true);
    expect(hasHigherOrEqualRole(ROLES.MANAGER, ROLES.DRIVER)).toBe(true);
    expect(hasHigherOrEqualRole(ROLES.DRIVER, ROLES.MANAGER)).toBe(false);
    expect(hasHigherOrEqualRole(ROLES.PASSENGER, ROLES.DRIVER)).toBe(false);
  });

  test('Super Admin holds platform administrative permissions', () => {
    expect(hasPermission(ROLES.SUPER_ADMIN, [], PERMISSIONS.PLATFORM_APPROVE_OWNER)).toBe(true);
  });

  test('Passenger cannot manage fleet or trips', () => {
    expect(hasPermission(ROLES.PASSENGER, [], PERMISSIONS.BUS_CREATE)).toBe(false);
    expect(hasPermission(ROLES.PASSENGER, [], PERMISSIONS.TRIP_CREATE)).toBe(false);
  });

  test('Custom staff permissions are honored dynamically', () => {
    // Staff without custom permission cannot create route
    expect(hasPermission(ROLES.STAFF, [], PERMISSIONS.ROUTE_CREATE)).toBe(false);
    // Staff with custom route permission granted
    expect(hasPermission(ROLES.STAFF, [PERMISSIONS.ROUTE_CREATE], PERMISSIONS.ROUTE_CREATE)).toBe(true);
  });
});
