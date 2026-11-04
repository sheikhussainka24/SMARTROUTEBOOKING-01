/**
 * SMART ROUTE — Granular Permissions
 */

export const PERMISSIONS = {
  // Super Admin Permissions
  PLATFORM_MANAGE_TRAVELS: 'platform:manage_travels',
  PLATFORM_APPROVE_OWNER: 'platform:approve_owner',
  PLATFORM_VIEW_METRICS: 'platform:view_metrics',
  PLATFORM_AUDIT_LOGS: 'platform:audit_logs',

  // Travel Owner Permissions
  TRAVEL_MANAGE_PROFILE: 'travel:manage_profile',
  TRAVEL_MANAGE_MANAGERS: 'travel:manage_managers',
  TRAVEL_MANAGE_STAFF: 'travel:manage_staff',
  TRAVEL_MANAGE_DRIVERS: 'travel:manage_drivers',
  TRAVEL_VIEW_FINANCIALS: 'travel:view_financials',

  // Fleet & Trip Permissions (Manager / Staff / Owner)
  BUS_CREATE: 'bus:create',
  BUS_UPDATE: 'bus:update',
  BUS_DELETE: 'bus:delete',
  BUS_VIEW: 'bus:view',

  ROUTE_CREATE: 'route:create',
  ROUTE_UPDATE: 'route:update',
  ROUTE_DELETE: 'route:delete',
  ROUTE_VIEW: 'route:view',

  TRIP_CREATE: 'trip:create',
  TRIP_UPDATE: 'trip:update',
  TRIP_CANCEL: 'trip:cancel',
  TRIP_VIEW: 'trip:view',

  // Booking & Passenger Permissions
  BOOKING_CREATE: 'booking:create',
  BOOKING_CANCEL: 'booking:cancel',
  BOOKING_VIEW: 'booking:view',
  BOOKING_OFFLINE_COUNTER: 'booking:offline_counter',

  // Driver Permissions
  DRIVER_VIEW_ASSIGNED_TRIP: 'driver:view_assigned_trip',
  DRIVER_UPDATE_GPS: 'driver:update_gps',
  DRIVER_UPDATE_PASSENGER_BOARDING: 'driver:update_passenger_boarding',
  DRIVER_UPDATE_TRIP_PROGRESS: 'driver:update_trip_progress',

  // Passenger Permissions
  PASSENGER_SEARCH_TRIPS: 'passenger:search_trips',
  PASSENGER_BOOK_SEAT: 'passenger:book_seat',
  PASSENGER_VIEW_TICKET: 'passenger:view_ticket',
  PASSENGER_TRACK_BUS: 'passenger:track_bus',
};
