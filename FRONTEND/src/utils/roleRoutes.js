/**
 * SMART ROUTE — Authoritative Role-Based Portal Redirection
 * Maps canonical database roles and display labels to their designated secure dashboards.
 */

export const CANONICAL_ROLES = Object.freeze({
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  TRAVEL_OWNER: 'travel_owner',
  MANAGER: 'manager',
  STAFF: 'staff',
  SUPER_ADMIN: 'super_admin',
});

export const getRoleRedirect = (userRole) => {
  const normalized = String(userRole || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'super_admin':
    case 'superadmin':
    case 'admin':
    case 'administrator':
      return '/admin/dashboard';

    case 'travel_owner':
    case 'travelowner':
    case 'owner':
    case 'operator':
    case 'travel_operator':
      return '/operator/dashboard';

    case 'manager':
    case 'travel_manager':
    case 'travelmanager':
    case 'operations_manager':
      return '/operator/dashboard';

    case 'driver':
      return '/driver/dashboard';

    case 'staff':
    case 'counter_staff':
      return '/staff';

    case 'passenger':
    default:
      return '/search';
  }
};

export default getRoleRedirect;
