/**
* SMART ROUTE — Canonical Role Definitions, Aliases & Permission Mappings
* Matches exact PostgreSQL user_role enum:
* 'super_admin', 'travel_owner', 'manager', 'staff', 'driver', 'passenger'
*/

export const ROLES = Object.freeze({
  PASSENGER: 'passenger',
  DRIVER: 'driver',
  TRAVEL_OWNER: 'travel_owner',
  MANAGER: 'manager',
  STAFF: 'staff',
  SUPER_ADMIN: 'super_admin',
});

export const ALL_CANONICAL_ROLES = Object.freeze([
  ROLES.PASSENGER,
  ROLES.DRIVER,
  ROLES.TRAVEL_OWNER,
  ROLES.MANAGER,
  ROLES.STAFF,
  ROLES.SUPER_ADMIN,
]);

export const ROLE_LABELS = Object.freeze({
  [ROLES.PASSENGER]: 'Passenger',
  [ROLES.DRIVER]: 'Driver',
  [ROLES.TRAVEL_OWNER]: 'Travel Owner',
  [ROLES.MANAGER]: 'Travel Manager',
  [ROLES.STAFF]: 'Staff',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
});

// Comprehensive normalization dictionary supporting display labels, casings, spaces, dashes, and legacy aliases
export const ROLE_NORMALIZATION_MAP = Object.freeze({
  // Passenger
  'passenger': ROLES.PASSENGER,
  'passengers': ROLES.PASSENGER,
  'user': ROLES.PASSENGER,
  'customer': ROLES.PASSENGER,

  // Driver
  'driver': ROLES.DRIVER,
  'drivers': ROLES.DRIVER,
  'captain': ROLES.DRIVER,
  'pilot': ROLES.DRIVER,

  // Travel Owner
  'travel_owner': ROLES.TRAVEL_OWNER,
  'travel owner': ROLES.TRAVEL_OWNER,
  'travel-owner': ROLES.TRAVEL_OWNER,
  'travelowner': ROLES.TRAVEL_OWNER,
  'owner': ROLES.TRAVEL_OWNER,
  'travel_operator': ROLES.TRAVEL_OWNER,
  'travel operator': ROLES.TRAVEL_OWNER,
  'travel-operator': ROLES.TRAVEL_OWNER,
  'operator': ROLES.TRAVEL_OWNER,
  'bus_operator': ROLES.TRAVEL_OWNER,
  'bus operator': ROLES.TRAVEL_OWNER,

  // Travel Manager / Manager
  'manager': ROLES.MANAGER,
  'travel_manager': ROLES.MANAGER,
  'travel manager': ROLES.MANAGER,
  'travel-manager': ROLES.MANAGER,
  'travelmanager': ROLES.MANAGER,
  'operations_manager': ROLES.MANAGER,
  'operations manager': ROLES.MANAGER,

  // Staff
  'staff': ROLES.STAFF,
  'booking_staff': ROLES.STAFF,
  'booking staff': ROLES.STAFF,

  // Admin / Super Admin
  'admin': ROLES.SUPER_ADMIN,
  'administrator': ROLES.SUPER_ADMIN,
  'super_admin': ROLES.SUPER_ADMIN,
  'super admin': ROLES.SUPER_ADMIN,
  'super-admin': ROLES.SUPER_ADMIN,
  'superadmin': ROLES.SUPER_ADMIN,
  'super_administrator': ROLES.SUPER_ADMIN,
  'super administrator': ROLES.SUPER_ADMIN,
});

/**
 * Normalizes any input role (casing, space, dash, or alias) into the canonical database enum value.
 * Returns null if the role is unrecognized.
 * @param {string} inputRole
 * @returns {string|null} Canonical role identifier or null
 */
export function normalizeRole(inputRole) {
  if (!inputRole || typeof inputRole !== 'string') return null;
  const clean = inputRole.trim().toLowerCase();
  if (ROLE_NORMALIZATION_MAP[clean]) {
    return ROLE_NORMALIZATION_MAP[clean];
  }
  const underscored = clean.replace(/[\s-]+/g, '_');
  if (ROLE_NORMALIZATION_MAP[underscored]) {
    return ROLE_NORMALIZATION_MAP[underscored];
  }
  return null;
}

/**
 * Checks if a given string represents any recognized platform role.
 * @param {string} role
 * @returns {boolean}
 */
export function isValidRole(role) {
  return normalizeRole(role) !== null;
}

/**
 * Returns human-readable label for a given role (canonical or raw).
 * @param {string} role
 * @returns {string}
 */
export function getRoleLabel(role) {
  const canonical = normalizeRole(role);
  return (canonical && ROLE_LABELS[canonical]) || role || 'Unknown';
}

/**
 * Evaluates public registration eligibility for a canonical role.
 * @param {string} canonicalRole
 * @param {object} options - { operatorCode }
 * @returns {{ allowed: boolean, code?: string, error?: string, redirectTo?: string }}
 */
export function evaluateRegistrationEligibility(canonicalRole, { operatorCode, invitationToken } = {}) {
  switch (canonicalRole) {
    case ROLES.PASSENGER:
      return { allowed: true };

    case ROLES.DRIVER:
      // Drivers can register only with an authorized operator invitation code or commercial DL
      if (operatorCode && String(operatorCode).trim().length > 0) {
        return { allowed: true };
      }
      return {
        allowed: false,
        code: 'INVITATION_REQUIRED',
        error: 'Driver accounts must be created or invited by an authorized Travel Owner or Manager. An operator invitation code or commercial driving license is required to activate a driver account.',
      };

    case ROLES.TRAVEL_OWNER:
      return {
        allowed: false,
        code: 'OPERATOR_USE_DEDICATED_PORTAL',
        redirectTo: '/owner/register',
        error: 'Travel Owner accounts require company registration with business verification. Please use the Travel Operator Registration portal at /owner/register.',
      };

    case ROLES.MANAGER:
    case ROLES.STAFF:
      if (invitationToken && String(invitationToken).trim().length > 0) {
        return { allowed: true };
      }
      return {
        allowed: false,
        code: 'INVITATION_REQUIRED',
        error: `${ROLE_LABELS[canonicalRole]} accounts must be created or invited by an authorized Travel Owner. Request an invitation from your company operator.`,
      };

    case ROLES.SUPER_ADMIN:
      return {
        allowed: false,
        code: 'ADMIN_REGISTRATION_FORBIDDEN',
        error: 'Admin and Super Admin accounts cannot be created via public registration. Platform administrator accounts must be provisioned through secure administrative channels.',
      };

    default:
      return {
        allowed: false,
        code: 'INVALID_ROLE',
        error: `Invalid role "${canonicalRole}". Allowed roles are: Passenger, Driver, Travel Owner, Travel Manager, Admin, Super Admin.`,
      };
  }
}

export default {
  ROLES,
  ALL_CANONICAL_ROLES,
  ROLE_LABELS,
  ROLE_NORMALIZATION_MAP,
  normalizeRole,
  isValidRole,
  getRoleLabel,
  evaluateRegistrationEligibility,
};
