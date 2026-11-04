import db, { isDbConnected } from '../config/database.js';
import logger from '../config/logger.js';
import { createAuditLog } from '../services/auditService.js';
import {
  getOwnerStats,
  buses,
  routes,
  routeStops,
  users as dsUsers,
  getRouteById,
  getRouteStopsByRouteId,
  createRouteData,
  updateRouteData,
  updateRouteStopsData,
  verifyRouteData,
  bulkImportRoutesData,
} from '../services/dataStore.js';
import { validateRouteStops, validateStopCoordinates, getVerifiedStopCoordinates } from '../data/indiaTransitHubs.js';
import { validateBusNumberPlate, validateBusChassis, analyzeBusLayout } from '../services/busLayoutEngine.js';

// ======================== TRAVEL MANAGEMENT ========================

/**
 * Register a new travel (by owner)
 * POST /api/owner/travel
 */
export async function registerTravel(req, res) {
  try {
    const {
      name, businessName, businessRegistrationNumber, gstNumber, panNumber,
      contactEmail, contactMobile, website, businessAddress, city, state, pincode,
      description,
    } = req.body;

    // Check if owner already has a travel
    const existing = await db('travels').where('owner_id', req.user.id).first();
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'You already have a registered travel',
        code: 'TRAVEL_EXISTS',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [travel] = await db('travels')
      .insert({
        owner_id: req.user.id,
        name, slug, description,
        business_name: businessName,
        business_registration_number: businessRegistrationNumber || null,
        gst_number: gstNumber || null,
        pan_number: panNumber || null,
        contact_email: contactEmail,
        contact_mobile: contactMobile,
        website: website || null,
        business_address: businessAddress,
        city, state,
        pincode: pincode || null,
        verification_status: 'pending',
        status: 'pending',
      })
      .returning('*');

    // Link owner to travel
    await db('users').where('id', req.user.id).update({ travel_id: travel.id });

    await createAuditLog({
      userId: req.user.id,
      userRole: 'travel_owner',
      travelId: travel.id,
      action: 'register_travel',
      resourceType: 'travel',
      resourceId: travel.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      data: {
        travel,
        message: 'Travel registered. Awaiting admin verification.',
      },
    });
  } catch (error) {
    logger.error('Register travel error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register travel',
      code: 'REGISTER_TRAVEL_ERROR',
    });
  }
}

/**
 * Get owner dashboard stats
 * GET /api/owner/dashboard
 */
export async function getDashboard(req, res) {
  try {
    const travelId = req.user?.travelId || 'trv-horizon-001';

    if (!isDbConnected()) {
      const stats = getOwnerStats();
      return res.json({
        success: true,
        travel: { name: 'SMART ROUTE Travels', slug: 'smart-route-travels', gst_number: '33AABCS8891M1ZT' },
        stats: {
          buses: stats.activeBuses,
          drivers: stats.activeDrivers,
          managers: 2,
          staff: 4,
          activeTrips: stats.totalTrips,
          totalBookings: stats.totalBookings,
          todayBookings: 26,
          totalRevenue: stats.totalRevenue,
          routes: stats.activeRoutes,
          passengers: stats.totalPassengers,
        },
        data: {
          travel: { name: 'SMART ROUTE Travels' },
          stats: {
            buses: stats.activeBuses,
            drivers: stats.activeDrivers,
            managers: 2,
            staff: 4,
            activeTrips: stats.totalTrips,
            totalBookings: stats.totalBookings,
            todayBookings: 26,
            totalRevenue: stats.totalRevenue,
            routes: stats.activeRoutes,
            passengers: stats.totalPassengers,
          },
          pendingApprovals: { drivers: 0, managers: 0, staff: 0 },
          recentBookings: [
            { id: 'bkg-sr-8921', booking_number: 'SR8921', status: 'confirmed', total_amount: 1785, first_name: 'Arun', last_name: 'Prakash' },
            { id: 'bkg-sr-9901', booking_number: 'SR9901', status: 'confirmed', total_amount: 1700, first_name: 'Rajesh', last_name: 'Kannan' },
          ],
        },
      });
    }

    const [
      busCount,
      driverCount,
      managerCount,
      staffCount,
      activeTripCount,
      totalBookings,
      todayBookings,
      totalRevenue,
    ] = await Promise.all([
      db('buses').where({ travel_id: travelId, is_active: true }).whereNull('deleted_at').count('* as count').first(),
      db('users').where({ travel_id: travelId, role: 'driver', status: 'active' }).whereNull('deleted_at').count('* as count').first(),
      db('users').where({ travel_id: travelId, role: 'manager', status: 'active' }).whereNull('deleted_at').count('* as count').first(),
      db('users').where({ travel_id: travelId, role: 'staff', status: 'active' }).whereNull('deleted_at').count('* as count').first(),
      db('trips').where({ travel_id: travelId }).whereIn('status', ['published', 'boarding', 'in_transit']).count('* as count').first(),
      db('bookings').where({ travel_id: travelId }).whereIn('status', ['confirmed', 'completed']).count('* as count').first(),
      db('bookings').where({ travel_id: travelId }).whereIn('status', ['confirmed', 'completed'])
        .whereRaw("DATE(created_at) = CURRENT_DATE").count('* as count').first(),
      db('bookings').where({ travel_id: travelId }).where('status', 'confirmed').sum('total_amount as total').first(),
    ]);

    // Pending approvals
    const pendingDrivers = await db('users')
      .where({ travel_id: travelId, role: 'driver', status: 'pending' })
      .count('* as count').first();
    const pendingManagers = await db('users')
      .where({ travel_id: travelId, role: 'manager', status: 'pending' })
      .count('* as count').first();
    const pendingStaff = await db('users')
      .where({ travel_id: travelId, role: 'staff', status: 'pending' })
      .count('* as count').first();

    // Recent bookings
    const recentBookings = await db('bookings')
      .join('users', 'bookings.passenger_id', 'users.id')
      .where('bookings.travel_id', travelId)
      .orderBy('bookings.created_at', 'desc')
      .limit(10)
      .select(
        'bookings.id', 'bookings.booking_number', 'bookings.status',
        'bookings.total_amount', 'bookings.created_at',
        'users.first_name', 'users.last_name'
      );

    return res.json({
      success: true,
      data: {
        stats: {
          buses: parseInt(busCount.count),
          drivers: parseInt(driverCount.count),
          managers: parseInt(managerCount.count),
          staff: parseInt(staffCount.count),
          activeTrips: parseInt(activeTripCount.count),
          totalBookings: parseInt(totalBookings.count),
          todayBookings: parseInt(todayBookings.count),
          totalRevenue: parseFloat(totalRevenue.total) || 0,
        },
        pendingApprovals: {
          drivers: parseInt(pendingDrivers.count),
          managers: parseInt(pendingManagers.count),
          staff: parseInt(pendingStaff.count),
        },
        recentBookings,
      },
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get dashboard',
      code: 'DASHBOARD_ERROR',
    });
  }
}

// ======================== USER MANAGEMENT ========================

/**
 * List staff/managers/drivers
 * GET /api/owner/users?role=driver|manager|staff
 */
export async function listUsers(req, res) {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const travelId = req.user?.travelId || 'trv-horizon-001';

    if (!isDbConnected()) {
      let filtered = dsUsers.filter((u) => ['driver', 'manager', 'staff'].includes(u.role));
      if (role) filtered = filtered.filter((u) => u.role === role);
      if (status) filtered = filtered.filter((u) => u.status === status);
      return res.json({
        success: true,
        users: filtered,
        data: {
          users: filtered,
          pagination: {
            total: filtered.length,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        },
      });
    }

    const offset = (page - 1) * limit;

    let query = db('users')
      .where('travel_id', travelId)
      .whereNull('deleted_at');

    if (role) query = query.where('role', role);
    if (status) query = query.where('status', status);

    const [{ count }] = await query.clone().count('* as count');

    const users = await query
      .select('id', 'email', 'mobile', 'first_name', 'last_name', 'role', 'status', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return res.json({
      success: true,
      users,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('List users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list users',
      code: 'LIST_USERS_ERROR',
    });
  }
}

/**
 * Approve or reject a user application
 * POST /api/owner/users/:id/approve
 */
export async function approveUser(req, res) {
  try {
    const { id } = req.params;
    const { action, travelId: assignTravelId } = req.body; // action: 'approve' or 'reject'
    const travelId = req.user.travelId;

    const user = await db('users').where('id', id).first();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // For owner: can only approve users linked to their travel or unlinked users
    if (req.user.role === 'travel_owner' && user.travel_id && user.travel_id !== travelId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot manage users from another travel',
        code: 'CROSS_TENANT',
      });
    }

    const newStatus = action === 'approve' ? 'active' : 'rejected';
    const updateData = { status: newStatus };

    if (action === 'approve' && !user.travel_id) {
      updateData.travel_id = travelId;
    }

    await db('users').where('id', id).update(updateData);

    // Update profile approval
    if (action === 'approve') {
      const profileTable = {
        driver: 'driver_profiles',
        manager: 'manager_profiles',
        staff: 'staff_profiles',
      }[user.role];

      if (profileTable) {
        await db(profileTable).where('user_id', id).update({
          travel_id: travelId,
          approved_by: req.user.id,
          approved_at: db.fn.now(),
        });
      }
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: action === 'approve' ? 'approve_user' : 'reject_user',
      resourceType: 'user',
      resourceId: id,
      newValues: { status: newStatus, role: user.role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: { message: `User ${action}d successfully`, userId: id, newStatus },
    });
  } catch (error) {
    logger.error('Approve user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process approval',
      code: 'APPROVE_ERROR',
    });
  }
}

/**
 * Create/invite a user (driver/manager/staff)
 * POST /api/owner/users/invite
 */
export async function inviteUser(req, res) {
  try {
    const { email, mobile, firstName, lastName, role, designation, department } = req.body;
    const travelId = req.user.travelId;

    // Validate role
    if (!['driver', 'manager', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Can only invite drivers, managers, or staff',
        code: 'INVALID_ROLE',
      });
    }

    // Check manager permission for staff creation
    if (req.user.role === 'manager') {
      const managerProfile = await db('manager_profiles')
        .where('user_id', req.user.id).first();
      
      if (role === 'staff' && !managerProfile?.can_create_staff) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to create staff',
          code: 'STAFF_CREATE_DENIED',
        });
      }
    }

    // Check existing
    const existing = await db('users')
      .where(function () {
        if (email) this.where('email', email);
        if (mobile) this.orWhere('mobile', mobile);
      })
      .whereNull('deleted_at')
      .first();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'User with this email or mobile already exists',
        code: 'USER_EXISTS',
      });
    }

    // Create user with temporary password
    const bcrypt = (await import('bcryptjs')).default;
    const tempPassword = `SR${Math.random().toString(36).substring(2, 10)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const [user] = await db('users')
      .insert({
        email: email || null,
        mobile: mobile || null,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName || null,
        role,
        status: 'active',
        travel_id: travelId,
      })
      .returning('*');

    // Create profile
    if (role === 'driver') {
      await db('driver_profiles').insert({
        user_id: user.id,
        travel_id: travelId,
        approved_by: req.user.id,
        approved_at: db.fn.now(),
      });
    } else if (role === 'manager') {
      await db('manager_profiles').insert({
        user_id: user.id,
        travel_id: travelId,
        designation: designation || null,
        department: department || null,
        approved_by: req.user.id,
        approved_at: db.fn.now(),
      });
    } else if (role === 'staff') {
      await db('staff_profiles').insert({
        user_id: user.id,
        travel_id: travelId,
        staff_role: designation || null,
        department: department || null,
        approved_by: req.user.id,
        approved_at: db.fn.now(),
      });
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'invite_user',
      resourceType: 'user',
      resourceId: user.id,
      newValues: { role, email, mobile },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // In development, return the temporary password
    const devInfo = process.env.NODE_ENV === 'development' ? { tempPassword } : {};

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
        },
        message: 'User created and invitation will be sent',
        ...devInfo,
      },
    });
  } catch (error) {
    logger.error('Invite user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to invite user',
      code: 'INVITE_ERROR',
    });
  }
}

// ======================== BUS MANAGEMENT ========================

export async function listBuses(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json({ success: true, buses, data: { buses } });
    }

    const travelId = req.user.travelId || req.travelId;
    const buses = await db('buses')
      .leftJoin('bus_layouts', 'buses.layout_id', 'bus_layouts.id')
      .where('buses.travel_id', travelId)
      .whereNull('buses.deleted_at')
      .select(
        'buses.*',
        'bus_layouts.name as layout_name',
        'bus_layouts.configuration as layout_configuration'
      )
      .orderBy('buses.created_at', 'desc');

    return res.json({ success: true, buses, data: { buses } });
  } catch (error) {
    logger.error('List buses error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list buses' });
  }
}

export async function createBus(req, res) {
  try {
    const travelId = req.user.travelId || req.travelId;
    const {
      name, registrationNumber, chassisMake, bodyMake, busType, configuration,
      totalSeats, totalSleepers, hasAc, hasWifi, hasCharging, hasToilet,
      hasWaterBottle, hasBlanket, layoutId,
    } = req.body;

    const plateVal = validateBusNumberPlate(registrationNumber);
    if (!plateVal.valid) {
      return res.status(400).json({ success: false, error: plateVal.error, code: 'INVALID_NUMBER_PLATE' });
    }

    const chassisVal = validateBusChassis(chassisMake || req.body.chassis, layoutId || 'combo_48');
    if (!chassisVal.valid) {
      return res.status(400).json({ success: false, error: chassisVal.error, code: 'INVALID_CHASSIS_SELECTION' });
    }

    const [bus] = await db('buses')
      .insert({
        travel_id: travelId,
        name: name || null,
        registration_number: plateVal.formatted,
        chassis_make: chassisVal.chassis?.brand || chassisMake,
        body_make: bodyMake || null,
        bus_type: busType,
        configuration,
        total_seats: totalSeats,
        total_sleepers: totalSleepers || 0,
        has_ac: hasAc || false,
        has_wifi: hasWifi || false,
        has_charging: hasCharging || false,
        has_toilet: hasToilet || false,
        has_water_bottle: hasWaterBottle || false,
        has_blanket: hasBlanket || false,
        layout_id: layoutId || null,
        is_active: true,
      })
      .returning('*');

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'create_bus',
      resourceType: 'bus',
      resourceId: bus.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({ success: true, data: { bus } });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Bus with this registration number already exists',
        code: 'BUS_EXISTS',
      });
    }
    logger.error('Create bus error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create bus' });
  }
}

// ======================== ROUTE MANAGEMENT ========================

export async function listRoutes(req, res) {
  try {
    if (!isDbConnected()) {
      const enriched = routes.map((r) => {
        const stops = getRouteStopsByRouteId(r.id);
        return {
          ...r,
          stops_count: stops.length,
          verification_status: r.verification_status || 'VERIFIED',
        };
      });
      return res.json({ success: true, routes: enriched, data: { routes: enriched } });
    }

    const travelId = req.user.travelId || req.travelId;
    const dbRoutes = await db('routes')
      .where('travel_id', travelId)
      .where('is_active', true)
      .whereNull('deleted_at')
      .orderBy('name');

    const enriched = await Promise.all(
      dbRoutes.map(async (r) => {
        const stops = await db('route_stops').where('route_id', r.id).where('is_active', true);
        return {
          ...r,
          stops_count: stops.length,
          verification_status: r.verification_status || 'VERIFIED',
        };
      })
    );

    return res.json({ success: true, routes: enriched, data: { routes: enriched } });
  } catch (error) {
    logger.error('List routes error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list routes' });
  }
}

export async function createRoute(req, res) {
  try {
    const travelId = req.user.travelId || req.travelId;
    const { name, code, source, destination, distanceKm, estimatedDurationMinutes, stops } = req.body;

    if (!source || !destination) {
      return res.status(400).json({ success: false, error: 'Origin and destination are required' });
    }

    const cleanSource = String(source).trim();
    const cleanDestination = String(destination).trim();

    if (cleanSource.toLowerCase() === cleanDestination.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination cannot be identical locations',
      });
    }

    if (Array.isArray(stops) && stops.length >= 2) {
      const stopsValidation = validateRouteStops(stops);
      if (!stopsValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid route stops sequence',
          details: stopsValidation.errors,
        });
      }
    }

    if (!isDbConnected()) {
      const newRoute = createRouteData({
        travel_id: travelId,
        name: name || `${cleanSource} - ${cleanDestination} Express`,
        code,
        source: cleanSource,
        destination: cleanDestination,
        distanceKm,
        estimatedDurationMinutes,
        stops,
      });
      const routeStopsList = getRouteStopsByRouteId(newRoute.id);
      return res.status(201).json({
        success: true,
        data: { route: newRoute, stops: routeStopsList },
      });
    }

    const [route] = await db('routes')
      .insert({
        travel_id: travelId,
        name: name || `${cleanSource} - ${cleanDestination} Express`,
        code: code || null,
        source: cleanSource,
        destination: cleanDestination,
        distance_km: distanceKm || null,
        estimated_duration_minutes: estimatedDurationMinutes || null,
        is_active: true,
        verification_status: 'VERIFIED',
      })
      .returning('*');

    // Create stops if provided
    if (stops && Array.isArray(stops) && stops.length > 0) {
      const routeStopsToInsert = stops.map((s, idx) => {
        const geo = getVerifiedStopCoordinates(s.name, s.city, 'Tamil Nadu');
        return {
          route_id: route.id,
          name: s.name,
          city: s.city || null,
          latitude: s.latitude !== undefined && s.latitude !== null ? Number(s.latitude) : geo.latitude,
          longitude: s.longitude !== undefined && s.longitude !== null ? Number(s.longitude) : geo.longitude,
          address: s.address || null,
          landmark: s.landmark || null,
          stop_order: s.stopOrder || idx + 1,
          distance_from_start_km: s.distanceFromStartKm || idx * 25,
          estimated_time_from_start_minutes: s.estimatedTimeFromStartMinutes || idx * 30,
          is_boarding_point: s.isBoardingPoint !== false,
          is_dropping_point: s.isDroppingPoint !== false,
          is_active: true,
        };
      });

      await db('route_stops').insert(routeStopsToInsert);
    }

    const createdStops = await db('route_stops')
      .where('route_id', route.id)
      .orderBy('stop_order');

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'create_route',
      resourceType: 'route',
      resourceId: route.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(201).json({
      success: true,
      data: { route, stops: createdStops },
    });
  } catch (error) {
    logger.error('Create route error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create route' });
  }
}

export async function getRouteDetails(req, res) {
  try {
    const { id } = req.params;
    if (!isDbConnected()) {
      const route = getRouteById(id);
      if (!route) {
        return res.status(404).json({ success: false, error: 'Route not found' });
      }
      const stops = getRouteStopsByRouteId(id);
      return res.json({ success: true, data: { route, stops } });
    }

    const route = await db('routes').where('id', id).first();
    if (!route) {
      return res.status(404).json({ success: false, error: 'Route not found' });
    }

    const stops = await db('route_stops')
      .where('route_id', id)
      .where('is_active', true)
      .orderBy('stop_order');

    return res.json({ success: true, data: { route, stops } });
  } catch (error) {
    logger.error('Get route error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get route' });
  }
}

export async function updateRoute(req, res) {
  try {
    const { id } = req.params;
    const { name, distanceKm, estimatedDurationMinutes, is_active, verification_status } = req.body;

    if (!isDbConnected()) {
      const updated = updateRouteData(id, {
        ...(name ? { name } : {}),
        ...(distanceKm ? { distance_km: Number(distanceKm) } : {}),
        ...(estimatedDurationMinutes ? { estimated_duration_minutes: Number(estimatedDurationMinutes) } : {}),
        ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
        ...(verification_status ? { verification_status } : {}),
      });
      if (!updated) return res.status(404).json({ success: false, error: 'Route not found' });
      return res.json({ success: true, data: { route: updated } });
    }

    const updatePayload = {};
    if (name) updatePayload.name = name;
    if (distanceKm) updatePayload.distance_km = Number(distanceKm);
    if (estimatedDurationMinutes) updatePayload.estimated_duration_minutes = Number(estimatedDurationMinutes);
    if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);
    if (verification_status) updatePayload.verification_status = verification_status;

    await db('routes').where('id', id).update(updatePayload);
    const route = await db('routes').where('id', id).first();
    return res.json({ success: true, data: { route } });
  } catch (error) {
    logger.error('Update route error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update route' });
  }
}

export async function getRouteStops(req, res) {
  try {
    const { id } = req.params;
    if (!isDbConnected()) {
      const stops = getRouteStopsByRouteId(id);
      return res.json({ success: true, data: { stops } });
    }

    const stops = await db('route_stops')
      .where('route_id', id)
      .where('is_active', true)
      .orderBy('stop_order');

    return res.json({ success: true, data: { stops } });
  } catch (error) {
    logger.error('Get route stops error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get route stops' });
  }
}

export async function updateRouteStops(req, res) {
  try {
    const { id } = req.params;
    const { stops } = req.body;
    if (!Array.isArray(stops)) {
      return res.status(400).json({ success: false, error: 'stops array is required' });
    }

    const normalizedStops = stops.map((s, idx) => ({
      ...s,
      stop_order: idx + 1,
    }));

    const validation = validateRouteStops(normalizedStops);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: 'Invalid stop configuration', errors: validation.errors });
    }

    if (!isDbConnected()) {
      const updatedStops = updateRouteStopsData(id, normalizedStops);
      return res.json({ success: true, data: { stops: updatedStops } });
    }

    await db('route_stops').where('route_id', id).delete();
    const records = stops.map((s, idx) => ({
      route_id: id,
      name: s.name,
      city: s.city || null,
      latitude: s.latitude,
      longitude: s.longitude,
      stop_order: idx + 1,
      distance_from_start_km: s.distance_from_start_km || idx * 25,
      estimated_time_from_start_minutes: s.estimated_time_from_start_minutes || idx * 30,
      is_boarding_point: s.is_boarding_point !== false,
      is_dropping_point: s.is_dropping_point !== false,
      is_active: true,
    }));
    await db('route_stops').insert(records);
    const newStops = await db('route_stops').where('route_id', id).orderBy('stop_order');

    return res.json({ success: true, data: { stops: newStops } });
  } catch (error) {
    logger.error('Update route stops error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update route stops' });
  }
}

export async function verifyRoute(req, res) {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    if (!isDbConnected()) {
      const updated = verifyRouteData(id, isVerified !== false);
      if (!updated) return res.status(404).json({ success: false, error: 'Route not found' });
      return res.json({ success: true, data: { route: updated } });
    }

    await db('routes').where('id', id).update({
      verification_status: isVerified !== false ? 'VERIFIED' : 'PENDING_VERIFICATION',
    });
    const route = await db('routes').where('id', id).first();
    return res.json({ success: true, data: { route } });
  } catch (error) {
    logger.error('Verify route error:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify route' });
  }
}

export async function validateRouteStopsApi(req, res) {
  try {
    const { stops } = req.body;
    if (!Array.isArray(stops)) {
      return res.status(400).json({ success: false, error: 'stops array is required' });
    }
    const result = validateRouteStops(stops);
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Validate route stops error:', error);
    return res.status(500).json({ success: false, error: 'Failed to validate route stops' });
  }
}

export async function bulkImportRoutes(req, res) {
  try {
    const { routes: routeItems } = req.body;
    if (!Array.isArray(routeItems)) {
      return res.status(400).json({ success: false, error: 'routes array is required' });
    }

    if (!isDbConnected()) {
      const result = bulkImportRoutesData(routeItems);
      return res.json({ success: true, data: result });
    }

    let imported = 0;
    const errors = [];
    for (let i = 0; i < routeItems.length; i++) {
      const r = routeItems[i];
      try {
        if (!r.source || !r.destination) {
          errors.push(`Row ${i + 1}: Missing source or destination`);
          continue;
        }
        const [inserted] = await db('routes').insert({
          travel_id: req.user.travelId || req.travelId,
          name: r.name || `${r.source} - ${r.destination}`,
          source: r.source,
          destination: r.destination,
          distance_km: r.distanceKm || r.distance_km || 100,
          estimated_duration_minutes: r.durationMinutes || r.estimated_duration_minutes || 180,
          verification_status: 'VERIFIED',
          is_active: true,
        }).returning('*');

        if (Array.isArray(r.stops) && r.stops.length > 0) {
          const stopRows = r.stops.map((s, idx) => ({
            route_id: inserted.id,
            name: s.name,
            city: s.city || null,
            latitude: s.latitude,
            longitude: s.longitude,
            stop_order: idx + 1,
            distance_from_start_km: s.distance_from_start_km || idx * 25,
            estimated_time_from_start_minutes: s.estimated_time_from_start_minutes || idx * 30,
            is_boarding_point: s.is_boarding_point !== false,
            is_dropping_point: s.is_dropping_point !== false,
            is_active: true,
          }));
          await db('route_stops').insert(stopRows);
        }
        imported++;
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return res.json({ success: true, data: { imported, errors } });
  } catch (error) {
    logger.error('Bulk import routes error:', error);
    return res.status(500).json({ success: false, error: 'Failed to bulk import routes' });
  }
}

// ======================== PERMISSIONS MANAGEMENT ========================

export async function listPermissions(req, res) {
  try {
    const permissions = await db('permissions').orderBy(['module', 'action']);
    return res.json({ success: true, data: { permissions } });
  } catch (error) {
    logger.error('List permissions error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list permissions' });
  }
}

export async function getUserPermissions(req, res) {
  try {
    const { userId } = req.params;
    const permissions = await db('user_permissions')
      .join('permissions', 'user_permissions.permission_id', 'permissions.id')
      .where('user_permissions.user_id', userId)
      .select('permissions.*', 'user_permissions.id as assignment_id');

    return res.json({ success: true, data: { permissions } });
  } catch (error) {
    logger.error('Get user permissions error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get permissions' });
  }
}

export async function updateUserPermissions(req, res) {
  try {
    const { userId } = req.params;
    const { permissionIds } = req.body;
    const travelId = req.user.travelId;

    // Verify user belongs to same travel
    const targetUser = await db('users').where('id', userId).first();
    if (!targetUser || targetUser.travel_id !== travelId) {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify permissions for this user',
        code: 'CROSS_TENANT',
      });
    }

    // Remove existing permissions
    await db('user_permissions').where('user_id', userId).del();

    // Insert new permissions
    if (permissionIds && permissionIds.length > 0) {
      const records = permissionIds.map((pid) => ({
        user_id: userId,
        permission_id: pid,
        granted_by: req.user.id,
      }));
      await db('user_permissions').insert(records);
    }

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId,
      action: 'update_permissions',
      resourceType: 'user',
      resourceId: userId,
      newValues: { permissionIds },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      data: { message: 'Permissions updated', userId },
    });
  } catch (error) {
    logger.error('Update permissions error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update permissions' });
  }
}

/**
 * Reject user application
 */
export async function rejectUser(req, res) {
  req.body = { ...req.body, action: 'reject' };
  return approveUser(req, res);
}

/**
 * Update user status
 */
export async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    await db('users').where('id', userId).update({ status, updated_at: new Date() });
    return res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Aliases
export const getUsers = listUsers;
export const getBuses = listBuses;
export const getRoutes = listRoutes;

