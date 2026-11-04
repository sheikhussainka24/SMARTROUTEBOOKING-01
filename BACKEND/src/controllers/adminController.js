import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';
import { createAuditLog } from '../services/auditService.js';
import { travels, buses, users, createBusInStore, savePersistentStore } from '../services/dataStore.js';
import { getHubConfig, saveHubConfig } from '../config/hubConfig.js';
import {
  validateBusNumberPlate,
  validateBusChassis,
  analyzeBusLayout,
  getCompatibleChassis,
  CHASSIS_CATALOG,
  SUPPORTED_MANUFACTURERS,
  getSupportedManufacturers,
  getModelsForManufacturer,
  validateBusModel,
} from '../services/busLayoutEngine.js';

/**
 * Super Admin Dashboard
 * GET /api/admin/dashboard
 */
export async function getDashboard(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json({
        success: true,
        data: {
          stats: {
            totalTravels: 1,
            activeTravels: 1,
            suspendedTravels: 0,
            pendingTravels: 0,
            totalBuses: buses.length,
            totalDrivers: 6,
            totalManagers: 1,
            totalStaff: 2,
            totalPassengers: 368,
            activeTrips: 14,
            totalBookings: 142,
            totalRevenue: 248600,
          },
        },
      });
    }

    const [
      totalTravels,
      activeTravels,
      suspendedTravels,
      pendingTravels,
      totalBuses,
      totalDrivers,
      totalManagers,
      totalStaff,
      totalPassengers,
      activeTrips,
      totalBookings,
      totalRevenue,
    ] = await Promise.all([
      db('travels').whereNull('deleted_at').count('* as count').first(),
      db('travels').where('status', 'active').count('* as count').first(),
      db('travels').where('status', 'suspended').count('* as count').first(),
      db('travels').where('status', 'pending').count('* as count').first(),
      db('buses').where('is_active', true).whereNull('deleted_at').count('* as count').first(),
      db('users').where({ role: 'driver', status: 'active' }).whereNull('deleted_at').count('* as count').first(),
      db('users').where({ role: 'manager', status: 'active' }).whereNull('deleted_at').count('* as count').first(),
      db('users').where({ role: 'staff', status: 'active' }).whereNull('deleted_at').count('* as count').first(),
      db('users').where({ role: 'passenger', status: 'active' }).whereNull('deleted_at').count('* as count').first(),
      db('trips').whereIn('status', ['published', 'boarding', 'in_transit']).count('* as count').first(),
      db('bookings').whereIn('status', ['confirmed', 'completed']).count('* as count').first(),
      db('bookings').where('status', 'confirmed').sum('total_amount as total').first(),
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          totalTravels: parseInt(totalTravels.count),
          activeTravels: parseInt(activeTravels.count),
          suspendedTravels: parseInt(suspendedTravels.count),
          pendingTravels: parseInt(pendingTravels.count),
          totalBuses: parseInt(totalBuses.count),
          totalDrivers: parseInt(totalDrivers.count),
          totalManagers: parseInt(totalManagers.count),
          totalStaff: parseInt(totalStaff.count),
          totalPassengers: parseInt(totalPassengers.count),
          activeTrips: parseInt(activeTrips.count),
          totalBookings: parseInt(totalBookings.count),
          totalRevenue: parseFloat(totalRevenue.total) || 0,
        },
      },
    });
  } catch (error) {
    logger.error('Admin dashboard error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get dashboard' });
  }
}

/**
 * List all travels (with summary, not private details)
 * GET /api/admin/travels
 */
export async function listTravels(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    if (!isDbConnected()) {
      let list = travels.map((t) => {
        const owner = users.find((u) => u.id === t.owner_id);
        const tBuses = buses.filter((b) => b.travel_id === t.id);
        return {
          ...t,
          owner_first_name: owner?.first_name || (t.contact_email ? t.contact_email.split('@')[0] : 'Operator'),
          owner_last_name: owner?.last_name || '',
          owner_email: owner?.email || t.contact_email,
          owner_mobile: owner?.mobile || t.contact_mobile,
          busCount: tBuses.length,
          total_buses: tBuses.length,
          managerCount: 1,
          driverCount: 2,
          staffCount: 1,
        };
      });

      if (status) {
        list = list.filter((t) => t.status === status || t.verification_status === status);
      }

      return res.json({
        success: true,
        travels: list,
        data: {
          travels: list,
          pagination: { total: list.length, page: 1, limit: 20, totalPages: 1 },
        },
      });
    }

    const offset = (page - 1) * limit;

    let query = db('travels')
      .leftJoin('users as owner', 'travels.owner_id', 'owner.id')
      .whereNull('travels.deleted_at');

    if (status) query = query.where('travels.status', status);

    const [{ count }] = await query.clone().count('travels.id as count');

    const travelsList = await query
      .select(
        'travels.id', 'travels.name', 'travels.slug', 'travels.logo_url',
        'travels.business_name', 'travels.city', 'travels.state',
        'travels.verification_status', 'travels.status',
        'travels.created_at', 'travels.approved_at',
        'owner.first_name as owner_first_name', 'owner.last_name as owner_last_name',
        'owner.email as owner_email', 'owner.mobile as owner_mobile'
      )
      .orderBy('travels.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Get aggregate counts for each travel
    const enrichedTravels = await Promise.all(
      travelsList.map(async (travel) => {
        const [busRec, managers, drivers, staff] = await Promise.all([
          db('buses').where({ travel_id: travel.id, is_active: true }).count('* as count').first(),
          db('users').where({ travel_id: travel.id, role: 'manager', status: 'active' }).count('* as count').first(),
          db('users').where({ travel_id: travel.id, role: 'driver', status: 'active' }).count('* as count').first(),
          db('users').where({ travel_id: travel.id, role: 'staff', status: 'active' }).count('* as count').first(),
        ]);

        return {
          ...travel,
          busCount: parseInt(busRec.count),
          total_buses: parseInt(busRec.count),
          managerCount: parseInt(managers.count),
          driverCount: parseInt(drivers.count),
          staffCount: parseInt(staff.count),
        };
      })
    );

    return res.json({
      success: true,
      travels: enrichedTravels,
      data: {
        travels: enrichedTravels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('List travels error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list travels' });
  }
}

/**
 * Approve/reject a travel registration
 * POST /api/admin/travels/:travelId/approve
 */
export async function approveTravel(req, res) {
  try {
    const travelId = req.params.travelId || req.params.id;
    const { action = 'approve', notes } = req.body; // 'approve' or 'reject'

    if (!isDbConnected()) {
      const travel = travels.find((t) => t.id === travelId);
      if (!travel) {
        return res.status(404).json({ success: false, error: 'Travel operator not found' });
      }

      const newStatus = action === 'approve' ? 'active' : 'rejected';
      const verificationStatus = action === 'approve' ? 'verified' : 'rejected';

      travel.status = newStatus;
      travel.verification_status = verificationStatus;
      travel.admin_notes = notes || (action === 'approve' ? 'Approved by Super Admin' : 'Rejected by Super Admin');
      travel.approved_by = req.user?.id || 'usr-admin-001';
      travel.approved_at = action === 'approve' ? new Date().toISOString() : null;
      travel.updated_at = new Date().toISOString();

      // Also activate or reject the owner account
      if (travel.owner_id) {
        const owner = users.find((u) => u.id === travel.owner_id);
        if (owner) {
          owner.status = action === 'approve' ? 'active' : 'rejected';
        }
      }

      savePersistentStore();

      await createAuditLog({
        userId: req.user?.id || 'usr-admin-001',
        userRole: 'super_admin',
        action: `${action}_travel`,
        resourceType: 'travel',
        resourceId: travelId,
        newValues: { status: newStatus, verificationStatus, notes },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.json({
        success: true,
        message: `Travel carrier "${travel.name}" has been ${action === 'approve' ? 'approved and verified' : 'rejected'} successfully.`,
        data: {
          message: `Travel ${action}d successfully`,
          travelId,
          newStatus,
          verificationStatus,
          travel,
        },
      });
    }

    const travel = await db('travels').where('id', travelId).first();
    if (!travel) {
      return res.status(404).json({ success: false, error: 'Travel not found' });
    }

    const newStatus = action === 'approve' ? 'active' : 'rejected';
    const verificationStatus = action === 'approve' ? 'verified' : 'rejected';

    await db('travels').where('id', travelId).update({
      status: newStatus,
      verification_status: verificationStatus,
      admin_notes: notes || null,
      approved_by: req.user.id,
      approved_at: action === 'approve' ? db.fn.now() : null,
      updated_at: db.fn.now(),
    });

    // Also update owner status
    if (travel.owner_id) {
      await db('users').where('id', travel.owner_id).update({
        status: action === 'approve' ? 'active' : 'rejected',
      });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: 'super_admin',
      action: `${action}_travel`,
      resourceType: 'travel',
      resourceId: travelId,
      newValues: { status: newStatus, verificationStatus },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: `Travel carrier "${travel.name}" has been ${action === 'approve' ? 'approved and verified' : 'rejected'} successfully.`,
      data: {
        message: `Travel ${action}d successfully`,
        travelId,
        newStatus,
        verificationStatus,
      },
    });
  } catch (error) {
    logger.error('Approve travel error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process travel approval' });
  }
}

/**
 * Suspend/reactivate a travel
 * POST /api/admin/travels/:id/status
 */
export async function updateTravelStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    await db('travels').where('id', id).update({
      status,
      admin_notes: reason || null,
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: 'super_admin',
      action: 'update_travel_status',
      resourceType: 'travel',
      resourceId: id,
      newValues: { status, reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: { message: `Travel status updated to ${status}` },
    });
  } catch (error) {
    logger.error('Update travel status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update status' });
  }
}

/**
 * Get audit logs
 * GET /api/admin/audit-logs
 */
export async function getAuditLogs(req, res) {
  try {
    const { page = 1, limit = 50, action, resourceType, userId, travelId } = req.query;
    const offset = (page - 1) * limit;

    let query = db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id');

    if (action) query = query.where('audit_logs.action', action);
    if (resourceType) query = query.where('audit_logs.resource_type', resourceType);
    if (userId) query = query.where('audit_logs.user_id', userId);
    if (travelId) query = query.where('audit_logs.travel_id', travelId);

    const [{ count }] = await query.clone().count('audit_logs.id as count');

    const logs = await query
      .select(
        'audit_logs.*',
        'users.first_name', 'users.last_name', 'users.email'
      )
      .orderBy('audit_logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get audit logs' });
  }
}

/**
 * Get detailed information for single travel
 */
export async function getTravelDetails(req, res) {
  try {
    const travelId = req.params.travelId || req.params.id;

    if (!isDbConnected()) {
      const travel = travels.find((t) => t.id === travelId);
      if (!travel) {
        return res.status(404).json({ success: false, error: 'Travel not found' });
      }
      const tBuses = buses.filter((b) => b.travel_id === travelId);
      const owner = users.find((u) => u.id === travel.owner_id);
      return res.json({
        success: true,
        travel: {
          ...travel,
          bus_count: tBuses.length,
          owner_first_name: owner?.first_name || '',
          owner_last_name: owner?.last_name || '',
          owner_email: owner?.email || travel.contact_email,
          owner_mobile: owner?.mobile || travel.contact_mobile,
        },
      });
    }

    const travel = await db('travels').where('id', travelId).first();
    if (!travel) {
      return res.status(404).json({ success: false, error: 'Travel not found' });
    }
    const [{ busCount }] = await db('buses').where('travel_id', travelId).count('id as busCount');
    return res.json({
      success: true,
      travel: {
        ...travel,
        bus_count: parseInt(busCount),
      },
    });
  } catch (error) {
    logger.error('Get travel details error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Reject travel registration
 */
export async function rejectTravel(req, res) {
  try {
    const travelId = req.params.travelId || req.params.id;
    const { reason, notes } = req.body;
    const rejectionReason = reason || notes || 'Documentation incomplete';

    if (!isDbConnected()) {
      const travel = travels.find((t) => t.id === travelId);
      if (!travel) {
        return res.status(404).json({ success: false, error: 'Travel operator not found' });
      }

      travel.status = 'rejected';
      travel.verification_status = 'rejected';
      travel.rejection_reason = rejectionReason;
      travel.admin_notes = rejectionReason;
      travel.updated_at = new Date().toISOString();

      if (travel.owner_id) {
        const owner = users.find((u) => u.id === travel.owner_id);
        if (owner) owner.status = 'rejected';
      }

      savePersistentStore();

      await createAuditLog({
        userId: req.user?.id || 'usr-admin-001',
        userRole: 'super_admin',
        action: 'reject_travel',
        resourceType: 'travel',
        resourceId: travelId,
        newValues: { status: 'rejected', verificationStatus: 'rejected', reason: rejectionReason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.json({
        success: true,
        message: `Travel registration for "${travel.name}" has been rejected.`,
        data: { travelId, status: 'rejected', verificationStatus: 'rejected' },
      });
    }

    await db('travels').where('id', travelId).update({
      status: 'rejected',
      verification_status: 'rejected',
      rejection_reason: rejectionReason,
      admin_notes: rejectionReason,
      updated_at: new Date(),
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: 'super_admin',
      action: 'reject_travel',
      resourceType: 'travel',
      resourceId: travelId,
      newValues: { status: 'rejected', verificationStatus: 'rejected', reason: rejectionReason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: 'Travel registration rejected',
      data: { travelId, status: 'rejected', verificationStatus: 'rejected' },
    });
  } catch (error) {
    logger.error('Reject travel error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Aliases
export const getTravels = listTravels;

/**
 * GET /api/admin/buses
 * List all buses across the platform or for the user's travel carrier
 */
export async function getAdminBuses(req, res) {
  try {
    const travelId = req.user?.travelId;
    let list = [...buses];
    if (travelId && req.user?.role !== 'super_admin') {
      list = list.filter((b) => b.travel_id === travelId);
    }
    return res.json({
      success: true,
      buses: list,
      data: { buses: list, total: list.length },
    });
  } catch (error) {
    logger.error('Get admin buses error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve buses' });
  }
}

/**
 * POST /api/admin/buses
 * Create new bus with full layout blueprint, seat pricing metadata, and route assignment
 */
export async function createAdminBus(req, res) {
  try {
    const {
      operatorName,
      busName,
      manufacturer,
      model,
      customName,
      custom_name,
      registrationNumber,
      busNumber,
      assignedRoute,
      routeId,
      departureTime,
      arrivalTime,
      layoutType,
      layoutName,
      totalSeats,
      fareConfig,
      seatPricing,
      seatingMap,
      amenities,
      status,
    } = req.body;

    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        error: 'Registration Number is required',
        code: 'MISSING_REQUIRED_FIELDS',
      });
    }

    const cleanReg = String(registrationNumber).trim().toUpperCase();

    // Check duplicate registration first
    const existing = buses.find((b) => b.registration_number === cleanReg);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `A bus with registration number "${cleanReg}" already exists in the fleet.`,
        code: 'DUPLICATE_REGISTRATION',
      });
    }

    let rawMfr = manufacturer || req.body.chassisMake || req.body.brand;
    let rawModel = model || req.body.chassisModel;
    const rawCustom = customName || custom_name;

    // Detect manufacturer and model from busName or chassis if not explicitly provided
    if (!rawMfr && busName) {
      const detectedMfr = SUPPORTED_MANUFACTURERS.find((m) =>
        busName.toLowerCase().includes(m.toLowerCase())
      );
      if (detectedMfr) {
        rawMfr = detectedMfr;
        if (!rawModel) {
          const avail = getModelsForManufacturer(detectedMfr);
          const found = avail.find((c) =>
            busName.toLowerCase().includes(c.model.toLowerCase())
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

    if (!rawMfr && !rawModel && !busName && !rawCustom && (req.body.busType || req.body.layoutType)) {
      rawMfr = 'Tata';
      rawModel = 'LPO 1618';
    }

    // 1. Bus Brand & Model Selection (Compulsory from supported catalog)
    if (!rawMfr || !rawModel) {
      return res.status(400).json({
        success: false,
        error: 'Bus manufacturer/brand and model selection are compulsory.',
        code: 'MISSING_BRAND_MODEL',
      });
    }

    const modelValidation = validateBusModel(rawMfr, rawModel, layoutType || 'combo_48');
    if (!modelValidation.valid) {
      return res.status(400).json({
        success: false,
        error: modelValidation.error,
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

    // Determine travel carrier
    let travelId = req.user?.travelId;
    if (!travelId) {
      if (operatorName) {
        const found = travels.find((t) => t.name.toLowerCase() === operatorName.toLowerCase());
        if (found) travelId = found.id;
      }
      if (!travelId && travels.length > 0) {
        travelId = travels[0].id;
      }
    }

    const newBus = createBusInStore({
      travel_id: travelId || 'trv-sr-001',
      registration_number: cleanReg,
      bus_number: busNumber || cleanReg,
      name: displayName,
      display_name: displayName,
      manufacturer: modelValidation.chassis.brand,
      model: modelValidation.chassis.model,
      custom_name: cleanCustomName,
      bus_type: layoutName || displayName || 'AC Sleeper 2+1',
      layout_type: layoutType || 'combo_48',
      layout_name: layoutName || '2+1 Combination Coach',
      chassis: chassisValidation.chassis?.fullName,
      chassis_id: chassisValidation.chassis?.id,
      chassis_make: chassisValidation.chassis?.brand,
      chassis_model: chassisValidation.chassis?.model,
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
      assigned_route: assignedRoute || 'Coimbatore ⇄ Karaikudi',
      route_id: routeId || 'route_cbe_kkdi_01',
      departure_time: departureTime || '21:30',
      arrival_time: arrivalTime || '05:00',
      amenities: Array.isArray(amenities) && amenities.length > 0
        ? amenities
        : ['Live Radar GPS Tracking', 'Climate Controlled AC (UV Purified)', '230V & USB-C Power Outlets', 'Clean Blanket & Pillow'],
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
      newValues: { registrationNumber: cleanReg, busName: displayName, layoutType },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      message: `Bus ${displayName} added successfully with ${layoutName || layoutType} configuration!`,
      bus: newBus,
      data: { bus: newBus },
    });
  } catch (error) {
    logger.error('Create admin bus error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create bus', code: 'CREATE_BUS_ERROR' });
  }
}

/**
 * Get Central Bus Hub Settings
 * GET /api/admin/settings/hub
 */
export async function getHubSettings(req, res) {
  try {
    const config = getHubConfig();
    return res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error('Get hub settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve hub settings' });
  }
}

/**
 * Update Central Bus Hub Settings
 * PUT /api/admin/settings/hub
 */
export async function updateHubSettings(req, res) {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid settings payload' });
    }
    const updated = saveHubConfig(updates);

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId: req.user.travelId,
      action: 'update_hub_settings',
      resourceType: 'system_settings',
      resourceId: 'central_bus_hub',
      newValues: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: 'Central Bus Hub address configuration updated successfully',
      data: updated,
    });
  } catch (error) {
    logger.error('Update hub settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update hub settings' });
  }
}


