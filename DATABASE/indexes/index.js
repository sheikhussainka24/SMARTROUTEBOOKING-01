/**
 * SMART ROUTE — Database Indexes
 * 
 * Performance indexes designed for fast trip searches, rapid seat lock resolution,
 * low-latency GPS ingestion, and tenant-isolated operations.
 */

export const DATABASE_INDEXES = [
  // User lookup indexes
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
  'CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);',
  'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);',

  // Travels
  'CREATE INDEX IF NOT EXISTS idx_travels_owner ON travels(owner_id);',
  'CREATE INDEX IF NOT EXISTS idx_travels_status ON travels(status);',

  // Bus layout & seats
  'CREATE INDEX IF NOT EXISTS idx_bus_seats_bus_id ON bus_seats(bus_id);',
  'CREATE INDEX IF NOT EXISTS idx_bus_seats_deck_number ON bus_seats(bus_id, deck, seat_number);',

  // Routes and Stops
  'CREATE INDEX IF NOT EXISTS idx_route_stops_route_order ON route_stops(route_id, stop_order);',
  'CREATE INDEX IF NOT EXISTS idx_route_stops_city ON route_stops(city);',

  // Trips
  'CREATE INDEX IF NOT EXISTS idx_trips_search ON trips(route_id, status, departure_time);',
  'CREATE INDEX IF NOT EXISTS idx_trips_travel_id ON trips(travel_id);',

  // Concurrency seat locks (Critical for race condition prevention)
  'CREATE INDEX IF NOT EXISTS idx_seat_locks_active ON seat_locks(trip_id, bus_seat_id, status, locked_until);',

  // Bookings & Passengers
  'CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr_number);',
  'CREATE INDEX IF NOT EXISTS idx_bookings_trip ON bookings(trip_id, status);',
  'CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking ON booking_passengers(booking_id);',
  'CREATE INDEX IF NOT EXISTS idx_booking_passengers_seat ON booking_passengers(bus_seat_id);',

  // Telemetry (Time-series GPS data)
  'CREATE INDEX IF NOT EXISTS idx_gps_trip_time ON gps_telemetry(trip_id, recorded_at DESC);'
];
