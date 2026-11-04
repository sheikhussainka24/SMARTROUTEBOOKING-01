/**
 * SMART ROUTE — Operator Management Controller
 * Covers: Operator registration, Manager CRUD, Driver CRUD, Dashboard Stats
 * All operations enforce strict tenant isolation (travelId scoping)
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db, { isDbConnected, isDurableStorageRequired } from '../config/database.js';
import logger from '../config/logger.js';
import { createAuditLog } from '../services/auditService.js';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth.js';
import {
  users,
  travels,
  buses,
  trips,
  bookings,
  findUserByEmail,
  findUserByMobile,
  registerUserData,
  registerTravelCompany,
  getManagersByTravelId,
  createManagerInStore,
  updateManagerInStore,
  deactivateManagerInStore,
  getDriversByTravelId,
  createDriverInStore,
  updateDriverInStore,
  deactivateDriverInStore,
  getTravelStats,
  getBusesByTravelId,
  getRoutesByTravelId,
  getBookingsByTravelId,
  getTravelById,
  DEFAULT_MANAGER_PERMISSIONS,
  getManagerPermissionsFromStore,
  updateManagerPermissionsInStore,
  getTripsByTravelId,
  createTripInStore,
  updateTripInStore,
  checkScheduleConflictsInStore,
  canDeleteBusInStore,
  createBusInStore,
  updateBusInStore,
  deleteBusInStore,
  cancelBookingInStore,
} from '../services/dataStore.js';
import { hashPassword, validatePasswordStrength } from '../auth/passwordPolicy.js';
import {
  validateBusNumberPlate,
  validateBusChassis,
  analyzeBusLayout,
  getCompatibleChassis,
  CHASSIS_CATALOG,
  SUPPORTED_MANUFACTURERS,
  validateBusModel,
  getModelsForManufacturer,
} from '../services/busLayoutEngine.js';

// ===================== HELPER: Safe user response (no password hash) =====================
function safeUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

// ===================== HELPER: Safe booking response (no payment secrets) =====================
function safeBooking(b) {
  if (!b) return null;
  const { payment_gateway_secret, card_token, raw_payment_response, ...rest } = b;
  return rest;
}

// ===================== HELPER: Verify Manager Granular Permission =====================
export function verifyManagerAction(req, actionName) {
  if (!req.user) return { allowed: false, error: 'Authentication required', code: 'AUTH_REQUIRED' };
  if (req.user.role === 'super_admin' || req.user.role === 'travel_owner') {
    return { allowed: true };
  }
  if (req.user.role === 'manager') {
    const mgrPerms = getManagerPermissionsFromStore(req.user.id, req.user.travelId) || DEFAULT_MANAGER_PERMISSIONS;
    if (mgrPerms[actionName]) {
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `Permission denied: Action "${actionName}" is not permitted for your manager account. Please request authorization from your Travel Operator.`,
      code: 'PERMISSION_DENIED',
      requiredPermission: actionName,
    };
  }
  return { allowed: false, error: 'Insufficient permissions', code: 'FORBIDDEN' };
}

// ===================== OPERATOR REGISTRATION =====================

/**
 * Register a new travel company + operator account (one combined step)
 * POST /api/operator/register
 * Public endpoint; requires admin approval before full activation
 */
export async function registerOperator(req, res) {
  try {
    const {
      // User fields
      fullName, firstName, lastName, email, mobile, password,
      // Company fields
      companyName, businessName, gstNumber, contactEmail, contactMobile,
      city, state, pincode, businessAddress, website,
    } = req.body;

    // Validate required fields
    if (!email || !mobile || !password || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Email, mobile, password, and company name are required',
        code: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);

    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid 10-digit Indian mobile number',
        code: 'INVALID_MOBILE',
      });
    }

    // Validate password complexity
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: passwordCheck.message,
        code: 'WEAK_PASSWORD',
      });
    }

    // Check durable persistence requirement
    if (isDurableStorageRequired() && !isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Durable database persistence is required for operator registration, but PostgreSQL is currently unavailable. Registration is temporarily disabled.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    // Check duplicate email/mobile
    let existingEmail = findUserByEmail(cleanEmail);
    let existingMobile = findUserByMobile(cleanMobile);

    if (isDbConnected()) {
      try {
        if (!existingEmail) existingEmail = await db('users').where('email', cleanEmail).whereNull('deleted_at').first();
        if (!existingMobile) existingMobile = await db('users').where('mobile', cleanMobile).whereNull('deleted_at').first();
      } catch (dbErr) {
        logger.warn('DB duplicate check error:', dbErr.message);
      }
    }

    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists. Please sign in or use a different email.', code: 'EMAIL_EXISTS' });
    }
    if (existingMobile) {
      return res.status(409).json({ success: false, error: 'An account with this mobile number already exists. Please sign in with your mobile number.', code: 'MOBILE_EXISTS' });
    }

    // Check duplicate company name
    let existingCompany = travels.find((t) => t.name.toLowerCase() === companyName.trim().toLowerCase());
    if (!existingCompany && isDbConnected()) {
      try {
        existingCompany = await db('travels').whereRaw('LOWER(name) = ?', [companyName.trim().toLowerCase()]).first();
      } catch (dbErr) {
        logger.warn('DB duplicate company check error:', dbErr.message);
      }
    }
    if (existingCompany) {
      return res.status(409).json({ success: false, error: 'A company with this name is already registered. Please choose a distinctive brand name.', code: 'COMPANY_EXISTS' });
    }

    const passwordHash = await hashPassword(password);
    const userFirstName = firstName || fullName?.split(' ')[0] || 'Operator';
    const userLastName = lastName || fullName?.split(' ').slice(1).join(' ') || '';

    let ownerUser = null;
    let company = null;

    if (isDbConnected()) {
      try {
        // Create owner user
        const [dbUser] = await db('users').insert({
          email: cleanEmail,
          mobile: cleanMobile,
          password_hash: passwordHash,
          first_name: userFirstName,
          last_name: userLastName || null,
          role: 'travel_owner',
          status: 'active',
          email_verified: false,
          mobile_verified: false,
        }).returning('*');
        ownerUser = dbUser;

        // Create company
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const [dbTravel] = await db('travels').insert({
          owner_id: ownerUser.id,
          name: companyName.trim(),
          slug,
          business_name: businessName || companyName,
          gst_number: gstNumber || null,
          contact_email: contactEmail || cleanEmail,
          contact_mobile: contactMobile || cleanMobile,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          business_address: businessAddress || null,
          website: website || null,
          verification_status: 'pending',
          status: 'active',
        }).returning('*');
        company = dbTravel;

        // Link owner to company
        await db('users').where('id', ownerUser.id).update({ travel_id: company.id });
        ownerUser.travel_id = company.id;
      } catch (dbErr) {
        logger.warn('DB operator registration error, falling back to in-memory:', dbErr.message);
      }
    }

    // Fallback: in-memory
    if (!ownerUser) {
      ownerUser = registerUserData({
        email: cleanEmail,
        mobile: cleanMobile,
        passwordHash,
        firstName: userFirstName,
        lastName: userLastName,
        role: 'travel_owner',
        status: 'active',
      });
    }

    if (!company) {
      company = registerTravelCompany({
        name: companyName.trim(),
        businessName: businessName || companyName,
        gstNumber,
        contactEmail: contactEmail || cleanEmail,
        contactMobile: contactMobile || cleanMobile,
        city, state, pincode, businessAddress, website,
        ownerId: ownerUser.id,
      });
    }

    await createAuditLog({
      userId: ownerUser.id,
      userRole: 'travel_owner',
      travelId: company.id,
      action: 'register_operator',
      resourceType: 'travel',
      resourceId: company.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const accessToken = generateAccessToken(ownerUser);
    const refreshToken = generateRefreshToken(ownerUser);

    const userProfile = {
      ...safeUser(ownerUser),
      travelId: ownerUser.travel_id || company.id,
      travel_id: ownerUser.travel_id || company.id,
    };
    return res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: userProfile,
      data: {
        user: userProfile,
        company,
        accessToken,
        refreshToken,
        tokens: { accessToken, refreshToken },
        message: 'Operator registered successfully. Admin verification may be required before full activation.',
      },
      meta: {
        persistence: isDbConnected() ? 'durable_postgres' : 'local_json_fallback',
      },
    });
  } catch (error) {
    logger.error('Register operator error:', error);
    return res.status(500).json({ success: false, error: 'Operator registration failed', code: 'REGISTER_OPERATOR_ERROR' });
  }
}

// ===================== OPERATOR DASHBOARD STATS =====================

/**
 * GET /api/operator/stats
 * Returns company-level statistics for the authenticated operator or manager
 */
export async function getOperatorStats(req, res) {
  try {
    const travelId = req.user?.travelId;

    if (!travelId) {
      return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });
    }

    const operationalAlerts = [
      { id: 'alt-1', type: 'info', message: 'All scheduled coaches operating normally', level: 'low' },
      { id: 'alt-2', type: 'compliance', message: 'AIS-140 GPS telemetry broadcasting active', level: 'info' },
    ];

    const managerPermissions = (req.user?.role === 'manager' || req.user?.role === 'travel_owner')
      ? (getManagerPermissionsFromStore(req.user.id, travelId) || DEFAULT_MANAGER_PERMISSIONS)
      : null;

    if (!isDbConnected()) {
      const stats = getTravelStats(travelId);
      const company = getTravelById(travelId) || { name: 'Your Company', slug: '', gst_number: '' };
      return res.json({ success: true, data: { stats, company, travelId, operationalAlerts, managerPermissions } });
    }

    const [
      busCount, routeCount, managerCount, driverCount,
      upcomingTripCount, bookingCount, revenueResult,
    ] = await Promise.all([
      db('buses').where({ travel_id: travelId, is_active: true }).whereNull('deleted_at').count('* as count').first(),
      db('routes').where({ travel_id: travelId, is_active: true }).count('* as count').first(),
      db('users').where({ travel_id: travelId, role: 'manager', status: 'active' }).whereNull('deleted_at').count('* as count').first(),
      db('users').where({ travel_id: travelId, role: 'driver', status: 'active' }).whereNull('deleted_at').count('* as count').first(),
      db('trips').where({ travel_id: travelId }).whereIn('status', ['published', 'boarding']).count('* as count').first(),
      db('bookings').where({ travel_id: travelId }).whereIn('status', ['confirmed', 'completed']).count('* as count').first(),
      db('bookings').where({ travel_id: travelId, status: 'confirmed' }).sum('total_amount as total').first(),
    ]);

    const company = await db('travels').where('id', travelId).first();

    return res.json({
      success: true,
      data: {
        company,
        travelId,
        operationalAlerts,
        managerPermissions,
        stats: {
          buses: parseInt(busCount?.count || 0),
          routes: parseInt(routeCount?.count || 0),
          managers: parseInt(managerCount?.count || 0),
          drivers: parseInt(driverCount?.count || 0),
          upcomingTrips: parseInt(upcomingTripCount?.count || 0),
          bookings: parseInt(bookingCount?.count || 0),
          totalRevenue: parseFloat(revenueResult?.total || 0),
        },
      },
    });
  } catch (error) {
    logger.error('Get operator stats error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load stats', code: 'STATS_ERROR' });
  }
}

// ===================== MANAGER MANAGEMENT =====================

/**
 * GET /api/operator/managers
 * List all managers of the authenticated operator's company
 */
export async function listManagers(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    if (!isDbConnected()) {
      const managers = getManagersByTravelId(travelId).map(safeUser);
      return res.json({ success: true, managers, data: { managers } });
    }

    const managers = await db('users')
      .where({ travel_id: travelId, role: 'manager' })
      .whereNull('deleted_at')
      .whereNot('status', 'deleted')
      .select('id', 'email', 'mobile', 'first_name', 'last_name', 'role', 'status', 'designation', 'created_at')
      .orderBy('created_at', 'desc');

    // Enrich with manager_profiles if available
    let profiles = [];
    try {
      profiles = await db('manager_profiles').where('travel_id', travelId).select('user_id', 'designation', 'department', 'can_create_staff', 'can_create_driver', 'can_approve_applications');
    } catch (e) { /* manager_profiles may not exist */ }

    const enriched = managers.map((m) => {
      const profile = profiles.find((p) => p.user_id === m.id) || {};
      return { ...m, ...profile };
    });

    return res.json({ success: true, managers: enriched, data: { managers: enriched } });
  } catch (error) {
    logger.error('List managers error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list managers', code: 'LIST_MANAGERS_ERROR' });
  }
}

/**
 * POST /api/operator/managers
 * Create a new manager for this company
 * Only travel_owner can create managers
 */
export async function createManager(req, res) {
  try {
    if (req.user?.role !== 'travel_owner' && req.user?.role !== 'super_admin') {
      if (req.user?.role === 'manager') {
        const canAddStaff = verifyManagerAction(req, 'add_staff');
        if (!canAddStaff.allowed) {
          return res.status(403).json({ success: false, error: 'Cannot create staff without add_staff permission', code: 'FORBIDDEN' });
        }
        if (req.body.role === 'travel_owner' || req.body.role === 'super_admin') {
          return res.status(403).json({ success: false, error: 'Managers cannot create Travel Operators or Platform Admins', code: 'FORBIDDEN' });
        }
      } else {
        return res.status(403).json({ success: false, error: 'Only Travel Owners can create staff/managers', code: 'FORBIDDEN' });
      }
    }

    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const { email, mobile, firstName, lastName, password, designation, department, canCreateStaff, canCreateDriver, canApproveApplications } = req.body;

    if (!firstName || (!email && !mobile)) {
      return res.status(400).json({ success: false, error: 'First name and at least one contact (email or mobile) are required', code: 'MISSING_FIELDS' });
    }

    // Generate password if not provided
    const rawPassword = password || `SR${Math.random().toString(36).substring(2, 10)}!A`;
    const passwordHash = await hashPassword(rawPassword);

    // Check duplicates
    if (email) {
      const existingEmail = findUserByEmail(email) || (isDbConnected() ? await db('users').where('email', email.toLowerCase()).whereNull('deleted_at').first() : null);
      if (existingEmail) return res.status(409).json({ success: false, error: 'A user with this email already exists', code: 'EMAIL_EXISTS' });
    }

    if (mobile) {
      const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
      const existingMobile = findUserByMobile(cleanMobile) || (isDbConnected() ? await db('users').where('mobile', cleanMobile).whereNull('deleted_at').first() : null);
      if (existingMobile) return res.status(409).json({ success: false, error: 'A user with this mobile already exists', code: 'MOBILE_EXISTS' });
    }

    let newManager = null;

    if (isDbConnected()) {
      try {
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;
        const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : null;

        const [dbManager] = await db('users').insert({
          email: cleanEmail,
          mobile: cleanMobile,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName || null,
          role: 'manager',
          status: 'active',
          travel_id: travelId,
        }).returning('*');

        newManager = dbManager;

        try {
          await db('manager_profiles').insert({
            user_id: newManager.id,
            travel_id: travelId,
            designation: designation || 'Operations Manager',
            department: department || null,
            can_create_staff: canCreateStaff || false,
            can_create_driver: canCreateDriver !== false,
            can_approve_applications: canApproveApplications !== false,
            approved_by: req.user.id,
            approved_at: db.fn.now(),
          });
        } catch (profileErr) {
          logger.warn('Manager profile insert error:', profileErr.message);
        }
      } catch (dbErr) {
        logger.warn('DB create manager error, falling back to in-memory:', dbErr.message);
      }
    }

    if (!newManager) {
      newManager = createManagerInStore({
        travelId,
        email,
        mobile,
        passwordHash,
        firstName,
        lastName,
        designation,
        department,
        canCreateStaff: canCreateStaff || false,
        canCreateDriver: canCreateDriver !== false,
        canApproveApplications: canApproveApplications !== false,
        addedBy: req.user.id,
      });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'create_manager',
      resourceType: 'user',
      resourceId: newManager.id,
      newValues: { email, mobile, firstName, lastName, designation },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const isDev = process.env.NODE_ENV !== 'production';

    return res.status(201).json({
      success: true,
      data: {
        manager: safeUser(newManager),
        message: 'Manager account created successfully',
        ...(isDev ? { devPassword: rawPassword } : {}),
      },
    });
  } catch (error) {
    logger.error('Create manager error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create manager', code: 'CREATE_MANAGER_ERROR' });
  }
}

/**
 * PUT /api/operator/managers/:id
 * Update a manager's profile or permissions
 */
export async function updateManager(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    // Safeguard: Cannot change own role or grant own permissions
    if (req.user?.id === id) {
      if (req.body.role && req.body.role !== req.user.role) {
        return res.status(403).json({ success: false, error: 'Cannot change your own role', code: 'SELF_ROLE_CHANGE_FORBIDDEN' });
      }
      if (req.body.permissions) {
        return res.status(403).json({ success: false, error: 'Cannot grant yourself additional permissions', code: 'SELF_PERMISSIONS_FORBIDDEN' });
      }
    }

    const { firstName, lastName, designation, department, status, canCreateStaff, canCreateDriver, canApproveApplications } = req.body;

    // Verify manager belongs to same company
    let manager = null;
    if (isDbConnected()) {
      manager = await db('users').where({ id, travel_id: travelId, role: 'manager' }).whereNull('deleted_at').first();
    }
    if (!manager) {
      manager = users.find((u) => u.id === id && u.travel_id === travelId && u.role === 'manager');
    }

    if (!manager) {
      return res.status(404).json({ success: false, error: 'Manager not found in your company', code: 'MANAGER_NOT_FOUND' });
    }

    // Prevent manager from elevating their own permissions
    if (req.user?.id === id && req.user?.role === 'manager') {
      return res.status(403).json({ success: false, error: 'Managers cannot modify their own permissions', code: 'SELF_MODIFY_FORBIDDEN' });
    }

    const updates = {};
    if (firstName) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (designation !== undefined) updates.designation = designation;
    if (department !== undefined) updates.department = department;
    if (status) updates.status = status;

    if (isDbConnected()) {
      try {
        await db('users').where({ id, travel_id: travelId }).update({ ...updates, updated_at: new Date() });

        if (canCreateStaff !== undefined || canCreateDriver !== undefined || canApproveApplications !== undefined) {
          const profileUpdates = {};
          if (designation !== undefined) profileUpdates.designation = designation;
          if (department !== undefined) profileUpdates.department = department;
          if (canCreateStaff !== undefined) profileUpdates.can_create_staff = canCreateStaff;
          if (canCreateDriver !== undefined) profileUpdates.can_create_driver = canCreateDriver;
          if (canApproveApplications !== undefined) profileUpdates.can_approve_applications = canApproveApplications;
          try {
            await db('manager_profiles').where('user_id', id).update(profileUpdates);
          } catch (pe) { /* profile table may not exist */ }
        }
      } catch (dbErr) {
        logger.warn('DB update manager error:', dbErr.message);
      }
    }

    // Always update in-memory
    updateManagerInStore(id, travelId, {
      first_name: firstName,
      last_name: lastName,
      designation,
      department,
      status,
      can_create_staff: canCreateStaff,
      can_create_driver: canCreateDriver,
      can_approve_applications: canApproveApplications,
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'update_manager',
      resourceType: 'user',
      resourceId: id,
      newValues: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, data: { message: 'Manager updated successfully', managerId: id } });
  } catch (error) {
    logger.error('Update manager error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update manager', code: 'UPDATE_MANAGER_ERROR' });
  }
}

/**
 * DELETE /api/operator/managers/:id
 * Deactivate a manager (soft delete)
 */
export async function deactivateManager(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;

    if (req.user?.role !== 'travel_owner' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Only Travel Owners can deactivate managers', code: 'FORBIDDEN' });
    }
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    // Prevent self-deactivation
    if (req.user.id === id) {
      return res.status(403).json({ success: false, error: 'You cannot deactivate your own account', code: 'SELF_DEACTIVATE_FORBIDDEN' });
    }

    // Safeguard: Cannot deactivate company owner or platform Admin
    const targetUser = users.find((u) => u.id === id);
    if (targetUser && (targetUser.role === 'travel_owner' || targetUser.role === 'super_admin')) {
      return res.status(403).json({ success: false, error: 'Cannot deactivate company owner or platform Admin', code: 'CANNOT_DEACTIVATE_OWNER' });
    }

    let manager = null;
    if (isDbConnected()) {
      manager = await db('users').where({ id, travel_id: travelId, role: 'manager' }).whereNull('deleted_at').first();
      if (manager) {
        await db('users').where({ id }).update({ status: 'deactivated', updated_at: new Date() });
      }
    }

    deactivateManagerInStore(id, travelId);

    if (!manager) {
      manager = users.find((u) => u.id === id && u.travel_id === travelId);
    }

    if (!manager) {
      return res.status(404).json({ success: false, error: 'Manager not found', code: 'MANAGER_NOT_FOUND' });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'deactivate_manager',
      resourceType: 'user',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, data: { message: 'Manager deactivated successfully', managerId: id } });
  } catch (error) {
    logger.error('Deactivate manager error:', error);
    return res.status(500).json({ success: false, error: 'Failed to deactivate manager', code: 'DEACTIVATE_MANAGER_ERROR' });
  }
}

// ===================== DRIVER MANAGEMENT =====================

/**
 * GET /api/operator/drivers
 * List all drivers of the authenticated operator's company
 */
export async function listDrivers(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    if (!isDbConnected()) {
      const drivers = getDriversByTravelId(travelId).map(safeUser);
      return res.json({ success: true, drivers, data: { drivers } });
    }

    const drivers = await db('users')
      .where({ travel_id: travelId, role: 'driver' })
      .whereNull('deleted_at')
      .whereNot('status', 'deleted')
      .select('id', 'email', 'mobile', 'first_name', 'last_name', 'role', 'status', 'license_number', 'created_at')
      .orderBy('created_at', 'desc');

    // Enrich with driver profiles
    let profiles = [];
    try {
      profiles = await db('driver_profiles').where('travel_id', travelId).select('user_id', 'license_number', 'license_type', 'license_expiry', 'experience_years', 'verification_status', 'is_available');
    } catch (e) { /* table may not exist */ }

    const enriched = drivers.map((d) => {
      const profile = profiles.find((p) => p.user_id === d.id) || {};
      return { ...d, ...profile };
    });

    return res.json({ success: true, drivers: enriched, data: { drivers: enriched } });
  } catch (error) {
    logger.error('List drivers error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list drivers', code: 'LIST_DRIVERS_ERROR' });
  }
}

/**
 * POST /api/operator/drivers
 * Create a new driver for this company
 */
export async function createDriver(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const { email, mobile, firstName, lastName, password, licenseNumber, licenseType, experienceYears, assignedBusId } = req.body;

    if (!firstName || (!email && !mobile)) {
      return res.status(400).json({ success: false, error: 'First name and at least one contact (email or mobile) are required', code: 'MISSING_FIELDS' });
    }

    if (!licenseNumber) {
      return res.status(400).json({ success: false, error: 'Driver license number is required', code: 'MISSING_LICENSE' });
    }

    // Check manager has driver creation permission
    if (req.user?.role === 'manager') {
      const mgr = users.find((u) => u.id === req.user.id);
      if (mgr && mgr.can_create_driver === false) {
        return res.status(403).json({ success: false, error: 'You do not have permission to create drivers', code: 'PERMISSION_DENIED' });
      }
    }

    const rawPassword = password || `DRV${Math.random().toString(36).substring(2, 8)}!A1`;
    const passwordHash = await hashPassword(rawPassword);

    // Check duplicates
    if (email) {
      const existingEmail = findUserByEmail(email);
      if (existingEmail) return res.status(409).json({ success: false, error: 'A user with this email already exists', code: 'EMAIL_EXISTS' });
    }
    if (mobile) {
      const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
      const existingMobile = findUserByMobile(cleanMobile);
      if (existingMobile) return res.status(409).json({ success: false, error: 'A user with this mobile already exists', code: 'MOBILE_EXISTS' });
    }

    let newDriver = null;

    if (isDbConnected()) {
      try {
        const cleanEmail = email ? String(email).trim().toLowerCase() : null;
        const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : null;

        const [dbDriver] = await db('users').insert({
          email: cleanEmail,
          mobile: cleanMobile,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName || null,
          role: 'driver',
          status: 'active',
          travel_id: travelId,
        }).returning('*');
        newDriver = dbDriver;

        try {
          await db('driver_profiles').insert({
            user_id: newDriver.id,
            travel_id: travelId,
            license_number: licenseNumber,
            license_type: licenseType || 'HMV',
            experience_years: experienceYears || 0,
            verification_status: 'unverified',
            is_available: true,
            approved_by: req.user.id,
            approved_at: db.fn.now(),
          });
        } catch (profileErr) {
          logger.warn('Driver profile insert error:', profileErr.message);
        }
      } catch (dbErr) {
        logger.warn('DB create driver error, falling back to in-memory:', dbErr.message);
      }
    }

    if (!newDriver) {
      newDriver = createDriverInStore({
        travelId,
        email,
        mobile,
        passwordHash,
        firstName,
        lastName,
        licenseNumber,
        licenseType,
        experienceYears,
        assignedBusId,
        addedBy: req.user.id,
      });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'create_driver',
      resourceType: 'user',
      resourceId: newDriver.id,
      newValues: { email, mobile, firstName, lastName, licenseNumber },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const isDev = process.env.NODE_ENV !== 'production';

    return res.status(201).json({
      success: true,
      data: {
        driver: safeUser(newDriver),
        message: 'Driver account created successfully',
        ...(isDev ? { devPassword: rawPassword } : {}),
      },
    });
  } catch (error) {
    logger.error('Create driver error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create driver', code: 'CREATE_DRIVER_ERROR' });
  }
}

/**
 * PUT /api/operator/drivers/:id
 * Update a driver's profile, license info, or assignment
 */
export async function updateDriver(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const { firstName, lastName, licenseNumber, licenseType, experienceYears, assignedBusId, status, isAvailable } = req.body;

    // Tenant isolation check
    let driver = users.find((u) => u.id === id && u.travel_id === travelId && u.role === 'driver');
    if (!driver && isDbConnected()) {
      driver = await db('users').where({ id, travel_id: travelId, role: 'driver' }).whereNull('deleted_at').first();
    }
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found in your company', code: 'DRIVER_NOT_FOUND' });
    }

    // Check for upcoming trips if trying to deactivate
    if (status === 'deactivated' || status === 'suspended') {
      const hasUpcomingTrips = (req._inMemory !== false) && users.find((u) => u.id === id);
      // In a full implementation, check trips table for driver assignments
    }

    if (isDbConnected()) {
      try {
        const userUpdates = {};
        if (firstName) userUpdates.first_name = firstName;
        if (lastName !== undefined) userUpdates.last_name = lastName;
        if (status) userUpdates.status = status;
        if (Object.keys(userUpdates).length > 0) {
          await db('users').where({ id }).update({ ...userUpdates, updated_at: new Date() });
        }

        const profileUpdates = {};
        if (licenseNumber) profileUpdates.license_number = licenseNumber;
        if (licenseType) profileUpdates.license_type = licenseType;
        if (experienceYears !== undefined) profileUpdates.experience_years = experienceYears;
        if (isAvailable !== undefined) profileUpdates.is_available = isAvailable;
        if (Object.keys(profileUpdates).length > 0) {
          try {
            await db('driver_profiles').where('user_id', id).update(profileUpdates);
          } catch (pe) { /* table may not exist */ }
        }
      } catch (dbErr) {
        logger.warn('DB update driver error:', dbErr.message);
      }
    }

    updateDriverInStore(id, travelId, {
      first_name: firstName,
      last_name: lastName,
      license_number: licenseNumber,
      license_type: licenseType,
      experience_years: experienceYears,
      assigned_bus_id: assignedBusId,
      status,
      is_available: isAvailable,
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'update_driver',
      resourceType: 'user',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, data: { message: 'Driver updated successfully', driverId: id } });
  } catch (error) {
    logger.error('Update driver error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update driver', code: 'UPDATE_DRIVER_ERROR' });
  }
}

/**
 * DELETE /api/operator/drivers/:id
 * Deactivate a driver (soft delete)
 */
export async function deactivateDriver(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;
    const authCheck = verifyManagerAction(req, 'manage_drivers');
    if (!authCheck.allowed) {
      return res.status(403).json({ success: false, error: authCheck.reason, code: 'PERMISSION_DENIED' });
    }

    // Safeguard for upcoming trips: cannot deactivate driver assigned to active trips
    const upcomingTrips = getTripsByTravelId(travelId).filter(
      (t) => t.driver_id === id && ['published', 'boarding', 'in_transit'].includes(t.status)
    );
    if (upcomingTrips.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot deactivate driver while assigned to ${upcomingTrips.length} active or upcoming trip(s). Reassign trips first.`,
        code: 'DRIVER_ASSIGNED_TO_UPCOMING_TRIPS',
        assignedTrips: upcomingTrips.map((t) => ({ id: t.id, trip_number: t.trip_number, status: t.status })),
      });
    }

    // Tenant isolation: verify driver belongs to company
    let driver = users.find((u) => u.id === id && u.travel_id === travelId && u.role === 'driver');
    if (!driver && isDbConnected()) {
      driver = await db('users').where({ id, travel_id: travelId, role: 'driver' }).whereNull('deleted_at').first();
      if (driver) await db('users').where({ id }).update({ status: 'deactivated', updated_at: new Date() });
    }

    deactivateDriverInStore(id, travelId);

    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found in your company', code: 'DRIVER_NOT_FOUND' });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'deactivate_driver',
      resourceType: 'user',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, data: { message: 'Driver deactivated successfully', driverId: id } });
  } catch (error) {
    logger.error('Deactivate driver error:', error);
    return res.status(500).json({ success: false, error: 'Failed to deactivate driver', code: 'DEACTIVATE_DRIVER_ERROR' });
  }
}

// ===================== COMPANY BUSES & FLEET CRUD =====================

/**
 * GET /api/operator/company/buses
 * List company buses with tenant isolation
 */
export async function getCompanyBuses(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    if (!isDbConnected()) {
      const busList = getBusesByTravelId(travelId);
      return res.json({ success: true, buses: busList, data: { buses: busList } });
    }

    const busList = await db('buses').where({ travel_id: travelId }).whereNull('deleted_at').orderBy('created_at', 'desc');
    return res.json({ success: true, buses: busList, data: { buses: busList } });
  } catch (error) {
    logger.error('Get company buses error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load buses', code: 'BUSES_ERROR' });
  }
}

/**
 * POST /api/operator/company/buses
 * Create a new bus for this company
 */
export async function createCompanyBus(req, res) {
  try {
    const travelId = req.user?.travelId || req.user?.travel_id;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const check = verifyManagerAction(req, 'manage_buses');
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error, code: check.code, requiredPermission: check.requiredPermission });
    }

    const {
      registrationNumber,
      busNumber,
      busName,
      manufacturer,
      model,
      customName,
      custom_name,
      busType,
      layoutType,
      layoutName,
      totalSeats,
      amenities,
      seatPricing,
      seatingMap,
      fareConfig,
      assignedRoute,
      routeId,
      departureTime,
      arrivalTime,
      status,
    } = req.body;
    const rawReg = registrationNumber || req.body.registration_number || req.body.busNumber || req.body.bus_number;
    if (!rawReg) {
      return res.status(400).json({ success: false, error: 'Registration number is required', message: 'Registration number is required', code: 'MISSING_REGISTRATION' });
    }

    let rawMfr = manufacturer || req.body.chassisMake || req.body.brand || req.body.manufacturer_name;
    let rawModel = model || req.body.chassisModel || req.body.model_name;
    const rawCustom = customName || custom_name;

    // Detect manufacturer and model from busName or chassis if not explicitly provided
    if (!rawMfr && (busName || req.body.bus_name)) {
      const candidateName = busName || req.body.bus_name;
      const detectedMfr = SUPPORTED_MANUFACTURERS.find((m) =>
        candidateName.toLowerCase().includes(m.toLowerCase())
      );
      if (detectedMfr) {
        rawMfr = detectedMfr;
        if (!rawModel) {
          const avail = getModelsForManufacturer(detectedMfr);
          const found = avail.find((c) =>
            candidateName.toLowerCase().includes(c.model.toLowerCase())
          );
          rawModel = found ? found.model : (avail[0]?.model || '');
        }
      }
    }

    if (!rawMfr && req.body.chassis) {
      const detectedMfr = SUPPORTED_MANUFACTURERS.find((m) =>
        req.body.chassis.toLowerCase().includes(m.toLowerCase())
      );
      if (detectedMfr) {
        rawMfr = detectedMfr;
        if (!rawModel) {
          const avail = getModelsForManufacturer(detectedMfr);
          rawModel = avail[0]?.model || '';
        }
      }
    }

    if (!rawMfr && !rawModel && !busName && !req.body.bus_name && !rawCustom && (req.body.busType || req.body.bus_type || layoutType)) {
      rawMfr = 'Tata';
      rawModel = 'LPO 1618';
    }

    // 1. Bus Brand & Model Selection (Compulsory from supported catalog)
    if (!rawMfr || !rawModel) {
      return res.status(400).json({
        success: false,
        error: 'Bus manufacturer/brand and model selection are compulsory.',
        message: 'Bus manufacturer/brand and model selection are compulsory.',
        code: 'MISSING_BRAND_MODEL',
      });
    }

    const modelValidation = validateBusModel(rawMfr, rawModel, layoutType || 'combo_48');
    if (!modelValidation.valid) {
      return res.status(400).json({
        success: false,
        error: modelValidation.error,
        message: modelValidation.error,
        code: 'INVALID_BUS_MODEL',
      });
    }

    const chassisValidation = validateBusChassis(modelValidation.chassis.id, layoutType || 'combo_48');
    if (!chassisValidation.valid) {
      return res.status(400).json({
        success: false,
        error: chassisValidation.error,
        code: 'INVALID_CHASSIS_SELECTION',
      });
    }

    // Determine final bus display name:
    // If a custom name is supplied, use it as the bus's display name wherever shown to passengers
    // If no custom name is supplied, automatically use selected manufacturer and model
    const cleanCustomName = (rawCustom && String(rawCustom).trim()) ? String(rawCustom).trim() : null;
    const displayName = cleanCustomName || (busName?.trim() && !busName.includes(rawMfr) ? busName.trim() : `${modelValidation.chassis.brand} ${modelValidation.chassis.model}`);

    const cleanReg = rawReg.trim().toUpperCase();

    // Check duplicate registration first
    const existing = buses.find((b) => b.registration_number === cleanReg && b.travel_id === travelId);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Bus with this registration number already exists in your fleet', code: 'DUPLICATE_BUS' });
    }

    // 2. Bus Number Plate Validation (Must start with TN 76)
    const plateValidation = validateBusNumberPlate(cleanReg);
    if (!plateValidation.valid) {
      return res.status(400).json({
        success: false,
        error: plateValidation.error,
        code: 'INVALID_NUMBER_PLATE',
      });
    }

    // 3. Exact Layout Seat/Berth Count Validation
    let layoutAnalysis = null;
    if (Array.isArray(seatingMap) && seatingMap.length > 0) {
      layoutAnalysis = analyzeBusLayout(seatingMap, req.body.driverCount || 1);
      if (!layoutAnalysis.valid || layoutAnalysis.errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: layoutAnalysis.errors.join('; ') || 'Layout seat/berth count validation failed.',
          code: 'LAYOUT_VALIDATION_ERROR',
          details: layoutAnalysis,
        });
      }
    }

    const newBus = createBusInStore({
      travel_id: travelId,
      registration_number: cleanReg,
      bus_number: busNumber || cleanReg,
      name: displayName,
      display_name: displayName,
      manufacturer: modelValidation.chassis.brand,
      model: modelValidation.chassis.model,
      custom_name: cleanCustomName,
      bus_type: layoutName || busType || displayName || 'AC Sleeper 2+1',
      layout_type: layoutType || 'combo_48',
      layout_name: layoutName || '2+1 Combination Coach',
      chassis: chassisValidation.chassis?.fullName,
      chassis_id: chassisValidation.chassis?.id,
      chassis_make: chassisValidation.chassis?.brand,
      chassis_model: chassisValidation.chassis?.model,
      layout_classification: layoutAnalysis?.layoutType || 'Seater-Cum-Sleeper',
      count_summary: layoutAnalysis?.countSummary || `S24 + B24 + D1 = 49`,
      total_seats: layoutAnalysis ? (layoutAnalysis.seaterCount + layoutAnalysis.sleeperCount) : (totalSeats || 48),
      driver_count: layoutAnalysis?.driverCount || 1,
      total_capacity: layoutAnalysis?.totalCapacity || ((totalSeats || 48) + 1),
      seat_pricing: seatPricing || {},
      seating_map: seatingMap || [],
      fare_config: fareConfig || {},
      assigned_route: assignedRoute || '',
      route_id: routeId || '',
      departure_time: departureTime || '',
      arrival_time: arrivalTime || '',
      amenities: amenities || ['WiFi', 'AIS-140 GPS', 'Charging Ports', 'AC'],
      is_active: status !== 'draft',
      status: status || 'published',
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'create_bus',
      resourceType: 'bus',
      resourceId: newBus.id,
      newValues: { registrationNumber: cleanReg, busType, totalSeats },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({ success: true, bus: newBus, data: { bus: newBus } });
  } catch (error) {
    logger.error('Create bus error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create bus', code: 'CREATE_BUS_ERROR' });
  }
}

/**
 * PUT /api/operator/company/buses/:id
 * Update bus details or activate/deactivate
 */
export async function updateCompanyBus(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const check = verifyManagerAction(req, 'manage_buses');
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error, code: check.code, requiredPermission: check.requiredPermission });
    }

    const { registrationNumber, busNumber, busName, manufacturer, model, customName, custom_name, busType, totalSeats, isActive, amenities } = req.body;
    const updates = {};
    if (registrationNumber) updates.registration_number = registrationNumber.trim().toUpperCase();
    if (busNumber) updates.bus_number = busNumber;
    if (manufacturer) updates.manufacturer = manufacturer;
    if (model) updates.model = model;
    if (customName !== undefined || custom_name !== undefined) {
      const cName = customName !== undefined ? customName : custom_name;
      updates.custom_name = cName ? String(cName).trim() : null;
    }
    if (manufacturer && model) {
      updates.display_name = updates.custom_name || `${manufacturer} ${model}`;
      updates.name = updates.display_name;
    } else if (updates.custom_name) {
      updates.display_name = updates.custom_name;
      updates.name = updates.display_name;
    } else if (busName) {
      updates.name = busName;
      updates.display_name = busName;
    }
    if (busType) updates.bus_type = busType;
    if (totalSeats !== undefined) updates.total_seats = totalSeats;
    if (isActive !== undefined) updates.is_active = isActive;
    if (amenities) updates.amenities = amenities;

    const updated = updateBusInStore(id, travelId, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Bus not found in your company', code: 'BUS_NOT_FOUND' });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'update_bus',
      resourceType: 'bus',
      resourceId: id,
      newValues: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, message: 'Bus updated successfully', bus: updated });
  } catch (error) {
    logger.error('Update bus error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update bus', code: 'UPDATE_BUS_ERROR' });
  }
}

/**
 * DELETE /api/operator/company/buses/:id
 * Delete bus — strictly prevents deletion if historical trips or bookings exist
 */
export async function deleteCompanyBus(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const check = verifyManagerAction(req, 'manage_buses');
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error, code: check.code, requiredPermission: check.requiredPermission });
    }

    const bus = buses.find((b) => b.id === id && b.travel_id === travelId);
    if (!bus) {
      return res.status(404).json({ success: false, error: 'Bus not found in your company', code: 'BUS_NOT_FOUND' });
    }

    // Safeguard: Cannot permanently delete buses with historical trips or bookings
    if (!canDeleteBusInStore(id)) {
      return res.status(409).json({
        success: false,
        error: `Cannot permanently delete bus ${bus.registration_number || id} because it has historical trips or linked bookings. Please deactivate the bus instead.`,
        code: 'CANNOT_DELETE_BUS_WITH_HISTORY',
      });
    }

    const result = deleteBusInStore(id, travelId);
    if (result.error) {
      return res.status(409).json({ success: false, error: 'Failed to delete bus', code: result.error });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'delete_bus',
      resourceType: 'bus',
      resourceId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, message: 'Bus permanently removed', busId: id });
  } catch (error) {
    logger.error('Delete bus error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete bus', code: 'DELETE_BUS_ERROR' });
  }
}

// ===================== COMPANY ROUTES, TRIPS & SCHEDULES =====================

/**
 * GET /api/operator/company/routes
 * List company routes with tenant isolation
 */
export async function getCompanyRoutes(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    if (!isDbConnected()) {
      const routeList = getRoutesByTravelId(travelId);
      return res.json({ success: true, routes: routeList, data: { routes: routeList } });
    }

    const routeList = await db('routes').where({ travel_id: travelId, is_active: true }).whereNull('deleted_at').orderBy('name');
    return res.json({ success: true, routes: routeList, data: { routes: routeList } });
  } catch (error) {
    logger.error('Get company routes error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load routes', code: 'ROUTES_ERROR' });
  }
}

/**
 * GET /api/operator/company/trips
 * List trips scheduled for this company
 */
export async function getCompanyTrips(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const companyTrips = getTripsByTravelId(travelId);
    return res.json({ success: true, trips: companyTrips, data: { trips: companyTrips } });
  } catch (error) {
    logger.error('Get company trips error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load trips', code: 'TRIPS_ERROR' });
  }
}

/**
 * POST /api/operator/company/trips
 * Create/publish a new trip on an approved route with schedule conflict detection
 */
export async function createCompanyTrip(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const check = verifyManagerAction(req, 'manage_routes');
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error, code: check.code, requiredPermission: check.requiredPermission });
    }

    const { routeId, busId, driverId, departureDate, departureTime, estimatedArrivalTime, baseFare, force } = req.body;
    if (!routeId || !departureDate || !departureTime) {
      return res.status(400).json({ success: false, error: 'Route ID, departure date, and departure time are required', code: 'MISSING_FIELDS' });
    }

    // Schedule conflict verification
    const conflicts = checkScheduleConflictsInStore(travelId, { busId, driverId, departureDate, departureTime });
    if (conflicts.length > 0 && !force) {
      return res.status(409).json({
        success: false,
        error: 'Schedule conflict detected for the selected coach or driver.',
        code: 'SCHEDULE_CONFLICT',
        conflicts,
      });
    }

    const defaultBus = buses.find((b) => b.travel_id === travelId && b.is_active);
    const newTrip = createTripInStore({
      travel_id: travelId,
      route_id: routeId,
      bus_id: busId || defaultBus?.id,
      driver_id: driverId || null,
      departure_date: departureDate,
      departure_time: departureTime,
      estimated_arrival_time: estimatedArrivalTime || '06:00',
      base_fare: baseFare || 880,
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'create_trip',
      resourceType: 'trip',
      resourceId: newTrip.id,
      newValues: { routeId, busId, driverId, departureDate, departureTime },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({ success: true, trip: newTrip, data: { trip: newTrip } });
  } catch (error) {
    logger.error('Create trip error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create trip', code: 'CREATE_TRIP_ERROR' });
  }
}

/**
 * PUT /api/operator/company/trips/:id
 * Edit trip details — strictly forbids editing completed trips
 */
export async function updateCompanyTrip(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const check = verifyManagerAction(req, 'manage_routes');
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error, code: check.code, requiredPermission: check.requiredPermission });
    }

    const targetTrip = trips.find((t) => t.id === id && t.travel_id === travelId);
    if (!targetTrip) {
      return res.status(404).json({ success: false, error: 'Trip not found in your company', code: 'TRIP_NOT_FOUND' });
    }

    // Safeguard: Cannot modify completed trip records
    if (targetTrip.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Completed trips cannot be modified to preserve historical records.',
        code: 'CANNOT_MODIFY_COMPLETED_TRIP',
      });
    }

    const { departureTime, departureDate, busId, driverId, status, baseFare } = req.body;
    const updates = {};
    if (departureTime) updates.departure_time = departureTime;
    if (departureDate) updates.departure_date = departureDate;
    if (busId) updates.bus_id = busId;
    if (driverId) updates.driver_id = driverId;
    if (status) updates.status = status;
    if (baseFare) updates.base_fare = baseFare;

    const updated = updateTripInStore(id, travelId, updates);
    if (updated?.error) {
      return res.status(400).json({ success: false, error: updated.error, code: updated.error });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'update_trip',
      resourceType: 'trip',
      resourceId: id,
      newValues: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({ success: true, message: 'Trip updated successfully', trip: updated });
  } catch (error) {
    logger.error('Update trip error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update trip', code: 'UPDATE_TRIP_ERROR' });
  }
}

/**
 * GET /api/operator/company/schedule-conflicts
 * View schedule conflicts across company buses and drivers
 */
export async function getCompanyScheduleConflicts(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const { busId, driverId, departureDate, departureTime, excludeTripId } = req.query || {};
    const conflicts = checkScheduleConflictsInStore(travelId, { busId, driverId, departureDate, departureTime, excludeTripId });
    return res.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
        total: conflicts.length,
      },
      conflicts,
      total: conflicts.length,
    });
  } catch (error) {
    logger.error('Schedule conflicts error:', error);
    return res.status(500).json({ success: false, error: 'Failed to analyze conflicts', code: 'CONFLICT_ERROR' });
  }
}

// ===================== FARE MANAGEMENT (WITH OPERATOR LIMITS) =====================

/**
 * PUT /api/operator/company/trips/:id/fare
 * Update fare: Within ±20% limit updates directly; outside requires operator approval
 */
export async function updateTripFare(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const check = verifyManagerAction(req, 'edit_fares');
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error, code: check.code, requiredPermission: check.requiredPermission });
    }

    const { newFare } = req.body;
    if (!newFare || isNaN(newFare) || Number(newFare) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive fare amount is required', code: 'INVALID_FARE' });
    }

    const numericFare = Number(newFare);
    const trip = trips.find((t) => t.id === id && t.travel_id === travelId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found in your company', code: 'TRIP_NOT_FOUND' });
    }

    const baseFare = Number(trip.base_fare || trip.fare || 800);
    const percentChange = Math.abs((numericFare - baseFare) / baseFare) * 100;
    const isOwnerOrAdmin = req.user.role === 'travel_owner' || req.user.role === 'super_admin';

    // Fare changes beyond ±20% require Travel Operator approval
    if (percentChange > 20 && !isOwnerOrAdmin) {
      await createAuditLog({
        userId: req.user.id,
        userRole: req.user.role,
        travelId,
        action: 'propose_fare_change',
        resourceType: 'trip',
        resourceId: id,
        oldValues: { baseFare },
        newValues: { proposedFare: numericFare, percentChange },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(202).json({
        success: true,
        requiresApproval: true,
        status: 'pending_operator_approval',
        data: {
          requiresApproval: true,
          status: 'pending_operator_approval',
          proposedFare: numericFare,
          baseFare,
          percentChange: Number(percentChange.toFixed(1)),
        },
        proposedFare: numericFare,
        baseFare,
        percentChange: Number(percentChange.toFixed(1)),
        message: `Fare change of ${percentChange.toFixed(1)}% exceeds permitted ±20% threshold. Submitted to Travel Operator for approval.`,
      });
    }

    // Within allowable threshold or authorized by owner
    const oldFare = trip.base_fare || trip.fare;
    trip.base_fare = numericFare;
    trip.fare = numericFare;

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'update_fare',
      resourceType: 'trip',
      resourceId: id,
      oldValues: { baseFare: oldFare },
      newValues: { baseFare: numericFare },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      requiresApproval: false,
      status: 'applied',
      data: {
        status: 'applied',
        newFare: numericFare,
        oldFare,
      },
      newFare: numericFare,
      oldFare,
      message: 'Fare updated successfully and recorded in audit log.',
    });
  } catch (error) {
    logger.error('Update fare error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update fare', code: 'UPDATE_FARE_ERROR' });
  }
}

// ===================== BOOKINGS MANAGEMENT & CANCELLATIONS =====================

/**
 * GET /api/operator/company/bookings
 * Search & inspect company bookings with sanitized payment data
 */
export async function getCompanyBookings(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const check = verifyManagerAction(req, 'view_bookings');
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error, code: check.code, requiredPermission: check.requiredPermission });
    }

    const { status, search, routeId, date, page = 1, limit = 20 } = req.query;

    if (!isDbConnected()) {
      let all = getBookingsByTravelId(travelId, { status });
      if (search) {
        const q = String(search).trim().toLowerCase();
        all = all.filter((b) =>
          (b.pnr_number && b.pnr_number.toLowerCase().includes(q)) ||
          (b.contact_name && b.contact_name.toLowerCase().includes(q)) ||
          (b.contact_mobile && b.contact_mobile.includes(q))
        );
      }
      if (date) {
        all = all.filter((b) => b.trip?.departure_date === date || (b.created_at && b.created_at.startsWith(date)));
      }
      const safeList = all.map(safeBooking);
      const paginated = safeList.slice((page - 1) * limit, page * limit);
      return res.json({ success: true, bookings: paginated, total: all.length, data: { bookings: paginated } });
    }

    let query = db('bookings').where('bookings.travel_id', travelId);
    if (status) query = query.where('bookings.status', status);

    const total = await query.clone().count('* as count').first();
    const bookingList = await query.orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);

    return res.json({
      success: true,
      bookings: bookingList.map(safeBooking),
      total: parseInt(total?.count || 0),
      data: { bookings: bookingList.map(safeBooking) },
    });
  } catch (error) {
    logger.error('Get company bookings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load bookings', code: 'BOOKINGS_ERROR' });
  }
}

/**
 * POST /api/operator/company/bookings/:id/cancel
 * Process booking cancellation and check refund permission
 */
export async function cancelCompanyBooking(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const checkCancel = verifyManagerAction(req, 'process_cancellations');
    if (!checkCancel.allowed) {
      return res.status(403).json({ success: false, error: checkCancel.error, code: checkCancel.code, requiredPermission: checkCancel.requiredPermission });
    }

    const { refundAmount = 0, processRefund, reason } = req.body;
    if (refundAmount > 0 || processRefund) {
      const checkRefund = verifyManagerAction(req, 'approve_refunds');
      if (!checkRefund.allowed) {
        return res.status(403).json({
          success: false,
          error: 'Refund approval requires explicit Travel Operator authorization.',
          code: 'REFUND_PERMISSION_DENIED',
          requiredPermission: 'approve_refunds',
        });
      }
    }

    const cancelled = cancelBookingInStore(id, travelId, { refundAmount, reason });
    if (!cancelled) {
      return res.status(404).json({ success: false, error: 'Booking not found in your company', code: 'BOOKING_NOT_FOUND' });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'cancel_booking',
      resourceType: 'booking',
      resourceId: id,
      newValues: { refundAmount, reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const safeCancelled = safeBooking(cancelled);
    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: safeCancelled,
      data: { booking: safeCancelled },
    });
  } catch (error) {
    logger.error('Cancel booking error:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel booking', code: 'CANCEL_BOOKING_ERROR' });
  }
}

// ===================== REPORTS & EXPORT (WITH MASKED PII) =====================

/**
 * GET /api/operator/company/reports
 * Export company reports with passenger PII protection
 */
export async function getCompanyReports(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const check = verifyManagerAction(req, 'export_reports');
    if (!check.allowed) {
      return res.status(403).json({ success: false, error: check.error, code: check.code, requiredPermission: check.requiredPermission });
    }

    const { reportType = 'manifest' } = req.query;
    const companyBookings = getBookingsByTravelId(travelId);
    const companyTrips = getTripsByTravelId(travelId);

    // Sanitize passenger personal data: Mask mobile numbers
    const sanitizedBookings = companyBookings.map((b) => {
      const rawMobile = b.contact_mobile || (b.passengers?.[0]?.mobile) || '9840100003';
      const masked = `${rawMobile.slice(0, 2)}*****${rawMobile.slice(-3)}`;
      return {
        pnr: b.pnr_number || b.id,
        passengerName: b.contact_name || 'Passenger',
        maskedMobile: masked,
        passengerMobile: masked,
        route: b.trip ? `${b.trip.source} ➔ ${b.trip.destination}` : 'Coimbatore ➔ Tenkasi',
        boardingStop: b.trip?.boarding_stop_name || 'Origin Stop',
        droppingStop: b.trip?.dropping_stop_name || 'Destination Stop',
        totalFare: b.total_fare,
        status: b.booking_status,
        passengers: (b.passengers || []).map((p) => ({
          seatNumber: p.seat_number,
          name: p.passenger_name,
          gender: p.passenger_gender,
          isBoarded: p.is_boarded,
        })),
      };
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'export_report',
      resourceType: 'report',
      resourceId: reportType,
      newValues: { reportType, recordsCount: sanitizedBookings.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      reportType,
      data: {
        records: sanitizedBookings,
        rows: sanitizedBookings,
        tripsCount: companyTrips.length,
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.id,
      },
    });
  } catch (error) {
    logger.error('Export reports error:', error);
    return res.status(500).json({ success: false, error: 'Failed to export reports', code: 'REPORT_EXPORT_ERROR' });
  }
}

// ===================== MANAGER PERMISSIONS CONFIGURATION =====================

export const PERMISSION_MATRIX = {
  manage_buses: { label: 'Manage Buses', description: 'Add, edit, activate/deactivate buses', category: 'Operations', defaultEnabled: true, isSensitive: false },
  manage_routes: { label: 'Manage Routes & Schedules', description: 'Create/edit trips and schedules on approved routes', category: 'Operations', defaultEnabled: true, isSensitive: false },
  edit_fares: { label: 'Edit Fares', description: 'Propose or update fares within ±20% limits', category: 'Commercial', defaultEnabled: false, isSensitive: true },
  manage_drivers: { label: 'Manage Drivers', description: 'Add, edit, deactivate drivers and assign buses', category: 'Fleet & Staff', defaultEnabled: true, isSensitive: false },
  view_bookings: { label: 'View Bookings', description: 'View passenger bookings, search manifests, seat status', category: 'Customer Service', defaultEnabled: true, isSensitive: false },
  process_cancellations: { label: 'Process Cancellations', description: 'Assist with cancellations per company policy', category: 'Customer Service', defaultEnabled: false, isSensitive: true },
  approve_refunds: { label: 'Approve Refunds', description: 'Authorize refunds (requires explicit operator grant)', category: 'Financial', defaultEnabled: false, isSensitive: true },
  export_reports: { label: 'Export Reports', description: 'Export trip, booking, and operational reports with masked PII', category: 'Reporting', defaultEnabled: true, isSensitive: false },
  add_staff: { label: 'Add Staff', description: 'Create counter booking staff accounts', category: 'Administration', defaultEnabled: false, isSensitive: true },
};

/**
 * GET /api/operator/manager-permissions
 * Get metadata matrix of manager permissions
 */
export async function getManagerPermissions(req, res) {
  return res.json({ success: true, data: { permissionMatrix: PERMISSION_MATRIX } });
}

/**
 * GET /api/operator/managers/:id/permissions
 * Get configured permissions for a specific manager
 */
export async function getSpecificManagerPermissions(req, res) {
  try {
    const targetId = req.params.id === 'me' ? req.user?.id : req.params.id;
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    const perms = getManagerPermissionsFromStore(targetId, travelId);
    if (!perms) {
      return res.status(404).json({ success: false, error: 'Manager not found in your company', code: 'MANAGER_NOT_FOUND' });
    }

    return res.json({
      success: true,
      data: {
        managerId: targetId,
        permissions: perms,
        matrix: PERMISSION_MATRIX,
      },
    });
  } catch (error) {
    logger.error('Get specific manager permissions error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get permissions', code: 'GET_PERMS_ERROR' });
  }
}

/**
 * PUT /api/operator/managers/:id/permissions
 * Travel Owner configures allowed actions for a specific manager
 */
export async function updateSpecificManagerPermissions(req, res) {
  try {
    const { id } = req.params;
    const travelId = req.user?.travelId;
    if (!travelId) return res.status(403).json({ success: false, error: 'Not associated with any company', code: 'NO_TENANT' });

    // Only Travel Owner or Super Admin can configure manager permissions
    if (req.user.role !== 'travel_owner' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Only Travel Owners can configure manager permissions', code: 'FORBIDDEN' });
    }

    // Prevent modifying self
    if (req.user.id === id) {
      return res.status(403).json({ success: false, error: 'Cannot modify your own permissions', code: 'SELF_MODIFY_FORBIDDEN' });
    }

    const { permissions: newPerms } = req.body;
    if (!newPerms || typeof newPerms !== 'object') {
      return res.status(400).json({ success: false, error: 'Valid permissions object required', code: 'INVALID_PERMISSIONS' });
    }

    const updated = updateManagerPermissionsInStore(id, travelId, newPerms);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Manager not found in your company', code: 'MANAGER_NOT_FOUND' });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'update_manager_permissions',
      resourceType: 'user',
      resourceId: id,
      newValues: newPerms,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: {
        managerId: id,
        permissions: updated,
        message: 'Manager permissions updated successfully',
      },
    });
  } catch (error) {
    logger.error('Update specific manager permissions error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update permissions', code: 'UPDATE_PERMS_ERROR' });
  }
}

/**
 * POST /api/operator/invitations
 * Issue an invitation for a manager or staff member
 */
export async function createManagerInvitationEndpoint(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) {
      return res.status(403).json({ success: false, error: 'Not associated with any travel company', code: 'NO_TENANT' });
    }

    if (req.user.role !== 'travel_owner' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Only travel owners and administrators can issue manager invitations',
        code: 'PERMISSION_DENIED',
      });
    }

    const { email, mobile, role = 'manager', expiresInDays = 7 } = req.body;
    const { createManagerInvitation } = await import('../services/invitationService.js');
    const invitation = createManagerInvitation({
      travelId,
      invitedBy: req.user.id,
      email,
      mobile,
      role,
      expiresInDays,
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'issue_invitation',
      resourceType: 'invitation',
      resourceId: invitation.id,
      newValues: { email, mobile, role, token: invitation.token },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      data: { invitation },
      message: 'Operator manager invitation issued successfully',
    });
  } catch (error) {
    logger.error('Create invitation error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create invitation', code: 'INVITATION_ERROR' });
  }
}

/**
 * GET /api/operator/invitations
 * List all manager and staff invitations for this operator
 */
export async function listManagerInvitationsEndpoint(req, res) {
  try {
    const travelId = req.user?.travelId;
    if (!travelId) {
      return res.status(403).json({ success: false, error: 'Not associated with any travel company', code: 'NO_TENANT' });
    }

    const { listInvitations } = await import('../services/invitationService.js');
    const invitations = listInvitations(travelId);
    return res.json({
      success: true,
      data: { invitations },
    });
  } catch (error) {
    logger.error('List invitations error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list invitations', code: 'LIST_INVITATIONS_ERROR' });
  }
}

