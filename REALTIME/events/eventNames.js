/**
 * SMART ROUTE — Canonical Real-Time Event Names
 */

export const REALTIME_EVENTS = {
  // Telemetry & GPS
  DRIVER_GPS_UPDATE: 'driver_gps_update',
  BUS_LOCATION_UPDATED: 'bus_location_updated',
  GPS_SIGNAL_LOST: 'gps_signal_lost',

  // Concurrency & Seat Map
  SEAT_LOCKED_NOTIFY: 'seat_locked_notify',
  SEATS_HELD_UPDATE: 'seats_held_update',
  SEAT_RELEASED_NOTIFY: 'seat_released_notify',
  SEATS_RELEASED_UPDATE: 'seats_released_update',

  // Trip Progress & Boarding
  TRIP_STATUS_CHANGE: 'trip_status_change',
  TRIP_STOP_ADVANCED: 'trip_stop_advanced',
  PASSENGER_BOARDED: 'passenger_boarded',

  // System & Connection
  JOIN_TRIP: 'join_trip',
  LEAVE_TRIP: 'leave_trip',
  JOINED_ROOM: 'joined_room',
};
