import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * SMART ROUTE — Development Seed Data
 * 
 * ⚠️ THIS IS DEVELOPMENT/DEMO DATA ONLY
 * Do NOT use in production.
 * 
 * Creates:
 * - Super Admin account
 * - Permissions
 * - Sample Travel Owner + Travel
 * - Sample Manager, Staff, Driver
 * - Sample Bus with layout
 * - Sample Route (Coimbatore → Tenkasi)
 * - Sample Trip
 */

export async function seed(knex) {
  // Clean existing data (in reverse FK order)
  await knex('boarding_point_changes').del();
  await knex('push_subscriptions').del();
  await knex('audit_logs').del();
  await knex('ai_interactions').del();
  await knex('notifications').del();
  await knex('gps_locations').del();
  await knex('tickets').del();
  await knex('refunds').del();
  await knex('payments').del();
  await knex('booking_passengers').del();
  await knex('bookings').del();
  await knex('trip_seats').del();
  await knex('trips').del();
  await knex('route_stops').del();
  await knex('routes').del();
  await knex('layout_seats').del();
  await knex('buses').del();
  await knex('bus_layouts').del();
  await knex('driver_profiles').del();
  await knex('staff_profiles').del();
  await knex('manager_profiles').del();
  await knex('user_permissions').del();
  await knex('permissions').del();
  await knex('otps').del();
  // Remove travel_id FK from users before deleting travels
  await knex('users').update({ travel_id: null });
  await knex('travels').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('SmartRoute@2024', 12);

  // ======================== IDs ========================
  const superAdminId = uuidv4();
  const ownerId = uuidv4();
  const managerId = uuidv4();
  const staffId = uuidv4();
  const driverId = uuidv4();
  const passengerId = uuidv4();
  const travelId = uuidv4();
  const layoutId = uuidv4();
  const busId = uuidv4();
  const routeId = uuidv4();

  // ======================== USERS ========================
  await knex('users').insert([
    {
      id: superAdminId,
      email: 'admin@smartroute.in',
      mobile: '9000000001',
      password_hash: passwordHash,
      first_name: 'Smart',
      last_name: 'Admin',
      role: 'super_admin',
      status: 'active',
      email_verified: true,
      mobile_verified: true,
    },
    {
      id: ownerId,
      email: 'owner@smartroute.in',
      mobile: '9000000002',
      password_hash: passwordHash,
      first_name: 'Rajesh',
      last_name: 'Kumar',
      role: 'travel_owner',
      status: 'active',
      email_verified: true,
      mobile_verified: true,
      travel_id: null, // Set after travel creation
    },
    {
      id: managerId,
      email: 'manager@smartroute.in',
      mobile: '9000000003',
      password_hash: passwordHash,
      first_name: 'Suresh',
      last_name: 'Babu',
      role: 'manager',
      status: 'active',
      email_verified: true,
      mobile_verified: true,
      travel_id: null,
    },
    {
      id: staffId,
      email: 'staff@smartroute.in',
      mobile: '9000000004',
      password_hash: passwordHash,
      first_name: 'Priya',
      last_name: 'Devi',
      role: 'staff',
      status: 'active',
      email_verified: true,
      mobile_verified: true,
      travel_id: null,
    },
    {
      id: driverId,
      email: 'driver@smartroute.in',
      mobile: '9000000005',
      password_hash: passwordHash,
      first_name: 'Muthu',
      last_name: 'Krishnan',
      role: 'driver',
      status: 'active',
      email_verified: true,
      mobile_verified: true,
      travel_id: null,
    },
    {
      id: passengerId,
      email: 'passenger@smartroute.in',
      mobile: '9000000006',
      password_hash: passwordHash,
      first_name: 'Arun',
      last_name: 'Prakash',
      role: 'passenger',
      status: 'active',
      email_verified: true,
      mobile_verified: true,
    },
  ]);

  // ======================== TRAVEL ========================
  await knex('travels').insert({
    id: travelId,
    owner_id: ownerId,
    name: 'SMART ROUTE Travels',
    slug: 'smart-route-travels',
    description: 'Premium private bus service connecting Tamil Nadu cities',
    business_name: 'Smart Route Private Limited',
    business_registration_number: 'U60100TN2024PTC000001',
    gst_number: '33AABCS1234A1Z5',
    contact_email: 'info@smartroute.in',
    contact_mobile: '9000000002',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641001',
    business_address: '100, Avinashi Road, RS Puram, Coimbatore, Tamil Nadu',
    verification_status: 'verified',
    status: 'active',
    approved_by: superAdminId,
    approved_at: knex.fn.now(),
  });

  // Update users with travel_id
  await knex('users').whereIn('id', [ownerId, managerId, staffId, driverId]).update({ travel_id: travelId });

  // ======================== PERMISSIONS ========================
  const permissionModules = [
    { module: 'trips', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'buses', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'routes', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { module: 'drivers', actions: ['create', 'read', 'update', 'delete', 'manage', 'approve'] },
    { module: 'staff', actions: ['create', 'read', 'update', 'delete', 'manage', 'approve'] },
    { module: 'managers', actions: ['create', 'read', 'update', 'delete', 'manage', 'approve'] },
    { module: 'bookings', actions: ['create', 'read', 'update', 'cancel', 'manage'] },
    { module: 'payments', actions: ['read', 'manage', 'refund'] },
    { module: 'passengers', actions: ['read', 'manage'] },
    { module: 'reports', actions: ['read', 'export'] },
    { module: 'settings', actions: ['read', 'update'] },
    { module: 'notifications', actions: ['create', 'read', 'manage'] },
    { module: 'tracking', actions: ['read', 'manage'] },
    { module: 'audit_logs', actions: ['read'] },
  ];

  const permissionRecords = [];
  for (const pm of permissionModules) {
    for (const action of pm.actions) {
      permissionRecords.push({
        id: uuidv4(),
        code: `${pm.module}.${action}`,
        name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${pm.module.charAt(0).toUpperCase() + pm.module.slice(1).replace(/_/g, ' ')}`,
        description: `Permission to ${action} ${pm.module.replace(/_/g, ' ')}`,
        module: pm.module,
        action: action,
      });
    }
  }

  await knex('permissions').insert(permissionRecords);

  // Grant all permissions to manager
  const allPermissions = await knex('permissions').select('id');
  const managerPermissions = allPermissions.map((p) => ({
    id: uuidv4(),
    user_id: managerId,
    permission_id: p.id,
    granted_by: ownerId,
  }));
  await knex('user_permissions').insert(managerPermissions);

  // ======================== PROFILES ========================
  await knex('manager_profiles').insert({
    id: uuidv4(),
    user_id: managerId,
    travel_id: travelId,
    designation: 'Operations Manager',
    department: 'Operations',
    can_create_staff: true,
    can_create_driver: true,
    can_approve_applications: true,
    approved_by: ownerId,
    approved_at: knex.fn.now(),
  });

  await knex('staff_profiles').insert({
    id: uuidv4(),
    user_id: staffId,
    travel_id: travelId,
    staff_role: 'booking_staff',
    department: 'Booking',
    approved_by: ownerId,
    approved_at: knex.fn.now(),
  });

  await knex('driver_profiles').insert({
    id: uuidv4(),
    user_id: driverId,
    travel_id: travelId,
    license_number: 'TN01-DL-2020-0012345',
    license_expiry: '2030-12-31',
    license_type: 'HMV',
    experience_years: 10,
    verification_status: 'verified',
    approved_by: ownerId,
    approved_at: knex.fn.now(),
    is_available: true,
  });

  // ======================== BUS LAYOUT ========================
  // TATA Chassis + Prakash Body | AC Seat/Cum/Sleeper | 2+1 Configuration
  // Lower Deck: 24 Seats + 6 Sleepers
  // Upper Deck: 18 Sleepers
  // Driver seat RIGHT side, front stairs on driver's LEFT
  
  await knex('bus_layouts').insert({
    id: layoutId,
    travel_id: travelId,
    name: 'TATA Capella AC 2+1 Seat/Cum/Sleeper',
    configuration: '2+1',
    has_upper_deck: true,
    lower_deck_rows: 12,
    upper_deck_rows: 9,
    columns: 4, // Left2 + Aisle + Right1
    total_seats: 24,
    total_sleepers: 24, // 6 lower + 18 upper
    is_template: true,
    layout_config: JSON.stringify({
      description: 'TATA chassis + Prakash body. AC Seat/Cum/Sleeper. 2+1 configuration.',
      lower_deck: {
        seats: 24,
        sleepers: 6,
        description: 'Left side: 2 seats per row. Right side: 1 seat per row. Last 3 rows right side have sleepers.'
      },
      upper_deck: {
        sleepers: 18,
        description: 'Full sleeper deck. Left side: 2-abreast sleepers (9 pairs = 18). Right: single sleepers may vary.'
      },
      driver_position: 'right',
      stairs_position: 'front_left',
    }),
  });

  // Lower Deck Seats - 2+1 configuration
  // Left side (columns 1,2) = 2 seats per row
  // Right side (column 4) = 1 seat per row (column 3 is aisle)
  // Driver is at right-front, so Row 1 right side has no passenger seat
  
  const layoutSeats = [];
  let seatCounter = 1;
  
  // Lower deck seats (Rows 1-8, standard seating)
  for (let row = 1; row <= 8; row++) {
    // Left side - 2 seats
    layoutSeats.push({
      id: uuidv4(),
      layout_id: layoutId,
      seat_number: `L${seatCounter}`,
      seat_label: `${seatCounter}`,
      seat_type: 'seat',
      deck: 'lower',
      row_number: row,
      column_number: 1,
      is_window: true,
      is_aisle: false,
      base_fare: 800,
      is_active: true,
    });
    seatCounter++;

    layoutSeats.push({
      id: uuidv4(),
      layout_id: layoutId,
      seat_number: `L${seatCounter}`,
      seat_label: `${seatCounter}`,
      seat_type: 'seat',
      deck: 'lower',
      row_number: row,
      column_number: 2,
      is_window: false,
      is_aisle: true,
      base_fare: 750,
      is_active: true,
    });
    seatCounter++;

    // Right side - 1 seat (skip row 1 right - driver area)
    if (row >= 2) {
      layoutSeats.push({
        id: uuidv4(),
        layout_id: layoutId,
        seat_number: `L${seatCounter}`,
        seat_label: `${seatCounter}`,
        seat_type: 'seat',
        deck: 'lower',
        row_number: row,
        column_number: 4,
        is_window: true,
        is_aisle: false,
        base_fare: 850,
        is_active: true,
      });
      seatCounter++;
    }
  }

  // Last row (row 9) - full width: 4 seats (back seats without gap)
  // But in 2+1, we continue 2+1 pattern for remaining to reach 24
  // Already have: 8*2 (left) + 7*1 (right, skip row 1) = 16 + 7 = 23 seats
  // Need 1 more seat
  layoutSeats.push({
    id: uuidv4(),
    layout_id: layoutId,
    seat_number: `L${seatCounter}`,
    seat_label: `${seatCounter}`,
    seat_type: 'seat',
    deck: 'lower',
    row_number: 1,
    column_number: 4,
    is_window: true,
    is_aisle: false,
    base_fare: 800,
    is_active: true,
  });
  seatCounter = 25; // Reset for sleepers

  // Lower deck sleepers (rows 9-11, left side, each sleeper spans 2 columns)
  for (let row = 9; row <= 11; row++) {
    // Left side sleeper (spans columns 1-2)
    layoutSeats.push({
      id: uuidv4(),
      layout_id: layoutId,
      seat_number: `LS${row - 8}`,
      seat_label: `LS${row - 8}`,
      seat_type: 'sleeper',
      deck: 'lower',
      row_number: row,
      column_number: 1,
      row_span: 1,
      col_span: 2,
      is_window: true,
      is_aisle: false,
      base_fare: 1200,
      is_active: true,
    });
    // Right side sleeper
    layoutSeats.push({
      id: uuidv4(),
      layout_id: layoutId,
      seat_number: `LS${row - 8 + 3}`,
      seat_label: `LS${row - 8 + 3}`,
      seat_type: 'sleeper',
      deck: 'lower',
      row_number: row,
      column_number: 4,
      row_span: 1,
      col_span: 1,
      is_window: true,
      is_aisle: false,
      base_fare: 1300,
      is_active: true,
    });
  }

  // Upper deck sleepers (18 sleepers)
  for (let row = 1; row <= 9; row++) {
    // Left side sleeper (spans columns 1-2)
    layoutSeats.push({
      id: uuidv4(),
      layout_id: layoutId,
      seat_number: `U${(row - 1) * 2 + 1}`,
      seat_label: `U${(row - 1) * 2 + 1}`,
      seat_type: 'sleeper',
      deck: 'upper',
      row_number: row,
      column_number: 1,
      row_span: 1,
      col_span: 2,
      is_window: true,
      is_aisle: false,
      base_fare: 1100,
      is_active: true,
    });
    // Right side sleeper
    layoutSeats.push({
      id: uuidv4(),
      layout_id: layoutId,
      seat_number: `U${(row - 1) * 2 + 2}`,
      seat_label: `U${(row - 1) * 2 + 2}`,
      seat_type: 'sleeper',
      deck: 'upper',
      row_number: row,
      column_number: 4,
      row_span: 1,
      col_span: 1,
      is_window: true,
      is_aisle: false,
      base_fare: 1200,
      is_active: true,
    });
  }

  await knex('layout_seats').insert(layoutSeats);

  // ======================== BUS ========================
  await knex('buses').insert({
    id: busId,
    travel_id: travelId,
    name: 'Smart Express 1',
    registration_number: 'TN-43-AB-1234',
    chassis_make: 'TATA',
    body_make: 'Prakash',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_charging: true,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  });

  // ======================== ROUTE ========================
  await knex('routes').insert({
    id: routeId,
    travel_id: travelId,
    name: 'Coimbatore - Tenkasi Express',
    code: 'CBE-TKS-001',
    source: 'Coimbatore',
    destination: 'Tenkasi',
    distance_km: 320,
    estimated_duration_minutes: 480,
    is_active: true,
  });

  // ======================== ROUTE STOPS ========================
  const stops = [
    { name: 'Coimbatore', city: 'Coimbatore', lat: 11.0168, lng: 76.9558, order: 1, dist: 0, time: 0, boarding: true, dropping: false },
    { name: 'Gandhipuram', city: 'Coimbatore', lat: 11.0183, lng: 76.9725, order: 2, dist: 3, time: 10, boarding: true, dropping: true },
    { name: 'Singanallur', city: 'Coimbatore', lat: 10.9950, lng: 77.0002, order: 3, dist: 8, time: 20, boarding: true, dropping: true },
    { name: 'Ukkadam', city: 'Coimbatore', lat: 10.9912, lng: 76.9610, order: 4, dist: 12, time: 30, boarding: true, dropping: true },
    { name: 'Pollachi', city: 'Pollachi', lat: 10.6609, lng: 77.0082, order: 5, dist: 42, time: 60, boarding: true, dropping: true },
    { name: 'Udumalapettai', city: 'Udumalapettai', lat: 10.5872, lng: 77.2476, order: 6, dist: 82, time: 100, boarding: true, dropping: true },
    { name: 'Palani', city: 'Palani', lat: 10.4505, lng: 77.5164, order: 7, dist: 120, time: 150, boarding: true, dropping: true },
    { name: 'Ottanchathiram', city: 'Ottanchathiram', lat: 10.3851, lng: 77.5995, order: 8, dist: 145, time: 180, boarding: true, dropping: true },
    { name: 'Thirumangalam', city: 'Thirumangalam', lat: 9.8189, lng: 77.9808, order: 9, dist: 200, time: 240, boarding: true, dropping: true },
    { name: 'Srivilliputhur', city: 'Srivilliputhur', lat: 9.5125, lng: 77.6348, order: 10, dist: 225, time: 275, boarding: true, dropping: true },
    { name: 'Rajapalayam', city: 'Rajapalayam', lat: 9.4534, lng: 77.5565, order: 11, dist: 240, time: 300, boarding: true, dropping: true },
    { name: 'Vasudevanallur', city: 'Vasudevanallur', lat: 9.2437, lng: 77.4114, order: 12, dist: 260, time: 330, boarding: true, dropping: true },
    { name: 'Sivagiri', city: 'Sivagiri', lat: 9.1699, lng: 77.3005, order: 13, dist: 270, time: 350, boarding: false, dropping: true },
    { name: 'Puliyangudi', city: 'Puliyangudi', lat: 9.1737, lng: 77.3952, order: 14, dist: 280, time: 370, boarding: false, dropping: true },
    { name: 'Kadayanallur', city: 'Kadayanallur', lat: 9.0733, lng: 77.3423, order: 15, dist: 300, time: 400, boarding: false, dropping: true },
    { name: 'Tenkasi', city: 'Tenkasi', lat: 8.9604, lng: 77.3152, order: 16, dist: 320, time: 480, boarding: false, dropping: true },
  ];

  const routeStops = stops.map((s) => ({
    id: uuidv4(),
    route_id: routeId,
    name: s.name,
    city: s.city,
    latitude: s.lat,
    longitude: s.lng,
    stop_order: s.order,
    distance_from_start_km: s.dist,
    estimated_time_from_start_minutes: s.time,
    is_boarding_point: s.boarding,
    is_dropping_point: s.dropping,
    is_active: true,
  }));

  await knex('route_stops').insert(routeStops);

  // ======================== SAMPLE TRIP ========================
  const tripId = uuidv4();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const departureDate = tomorrow.toISOString().split('T')[0];

  await knex('trips').insert({
    id: tripId,
    travel_id: travelId,
    bus_id: busId,
    route_id: routeId,
    driver_id: driverId,
    trip_number: 'SR-CBE-TKS-001',
    departure_date: departureDate,
    departure_time: '21:00',
    estimated_arrival_time: '05:00',
    status: 'published',
    total_booked_seats: 0,
    total_available_seats: 48,
    base_fare: 800,
    fare_chart: JSON.stringify({
      segments: [
        { from_order: 1, to_order: 5, fare: 200 },
        { from_order: 1, to_order: 7, fare: 450 },
        { from_order: 1, to_order: 11, fare: 700 },
        { from_order: 1, to_order: 16, fare: 800 },
        { from_order: 5, to_order: 11, fare: 500 },
        { from_order: 5, to_order: 16, fare: 650 },
        { from_order: 7, to_order: 16, fare: 500 },
      ],
    }),
    created_by: ownerId,
  });

  // Create trip seat inventory from layout
  const layoutSeatRecords = await knex('layout_seats').where({ layout_id: layoutId });
  const tripSeats = layoutSeatRecords.map((ls) => ({
    id: uuidv4(),
    trip_id: tripId,
    layout_seat_id: ls.id,
    seat_number: ls.seat_number,
    seat_label: ls.seat_label,
    seat_type: ls.seat_type,
    deck: ls.deck,
    status: 'available',
    fare: ls.base_fare,
  }));

  await knex('trip_seats').insert(tripSeats);

  console.log('✅ Seed data inserted successfully');
  console.log('');
  console.log('=== DEVELOPMENT LOGIN CREDENTIALS ===');
  console.log('Password for all accounts: SmartRoute@2024');
  console.log('');
  console.log('Super Admin:  admin@smartroute.in');
  console.log('Owner:        owner@smartroute.in');
  console.log('Manager:      manager@smartroute.in');
  console.log('Staff:        staff@smartroute.in');
  console.log('Driver:       driver@smartroute.in');
  console.log('Passenger:    passenger@smartroute.in');
  console.log('=====================================');
}
