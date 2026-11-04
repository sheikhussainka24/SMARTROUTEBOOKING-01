/**
 * SMART ROUTE — Production Database Queries
 * 
 * Reusable, high-performance, parameterized SQL queries with multi-tenant
 * isolation and transaction guarantees.
 */

export const TRIP_QUERIES = {
  // Search available trips between origin and destination with active seat counts
  SEARCH_TRIPS: `
    SELECT 
      t.id AS trip_id,
      t.departure_time,
      t.arrival_time,
      t.base_seat_fare,
      t.base_sleeper_fare,
      t.status,
      tr.id AS travel_id,
      tr.name AS travel_name,
      tr.logo_url AS travel_logo,
      b.id AS bus_id,
      b.bus_number,
      b.registration_number,
      b.bus_type,
      b.layout_type,
      b.total_capacity,
      r.id AS route_id,
      r.source_city,
      r.destination_city,
      r.distance_km,
      r.estimated_duration_mins,
      origin_stop.stop_name AS origin_stop_name,
      origin_stop.stop_order AS origin_stop_order,
      dest_stop.stop_name AS dest_stop_name,
      dest_stop.stop_order AS dest_stop_order,
      (
        SELECT COUNT(bs.id)
        FROM bus_seats bs
        WHERE bs.bus_id = b.id
          AND bs.id NOT IN (
            SELECT bp.bus_seat_id 
            FROM booking_passengers bp
            JOIN bookings bk ON bp.booking_id = bk.id
            JOIN route_stops b_from ON bk.boarding_stop_id = b_from.id
            JOIN route_stops b_to ON bk.dropping_stop_id = b_to.id
            WHERE bk.trip_id = t.id
              AND bk.status IN ('confirmed', 'pending')
              AND NOT (b_to.stop_order <= origin_stop.stop_order OR b_from.stop_order >= dest_stop.stop_order)
          )
          AND bs.id NOT IN (
            SELECT sl.bus_seat_id
            FROM seat_locks sl
            WHERE sl.trip_id = t.id
              AND sl.status = 'locked'
              AND sl.locked_until > NOW()
              AND NOT (sl.to_stop_order <= origin_stop.stop_order OR sl.from_stop_order >= dest_stop.stop_order)
          )
      ) AS available_seats_count
    FROM trips t
    JOIN travels tr ON t.travel_id = tr.id
    JOIN buses b ON t.bus_id = b.id
    JOIN routes r ON t.route_id = r.id
    JOIN route_stops origin_stop ON origin_stop.route_id = r.id 
      AND LOWER(origin_stop.city) = LOWER(?)
      AND origin_stop.is_boarding_point = true
    JOIN route_stops dest_stop ON dest_stop.route_id = r.id 
      AND LOWER(dest_stop.city) = LOWER(?)
      AND dest_stop.is_dropping_point = true
      AND dest_stop.stop_order > origin_stop.stop_order
    WHERE t.status = 'published'
      AND t.departure_time >= ?
      AND t.departure_time < ?
      AND tr.status = 'active'
    ORDER BY t.departure_time ASC;
  `,

  // Check seat conflict across route segment
  CHECK_SEAT_CONFLICT: `
    SELECT 
      bs.id AS seat_id,
      bs.seat_number,
      CASE 
        WHEN bk.id IS NOT NULL THEN 'booked'
        WHEN sl.id IS NOT NULL THEN 'locked'
        ELSE 'available'
      END AS occupancy_status
    FROM bus_seats bs
    LEFT JOIN (
      SELECT bp.bus_seat_id, bk.id
      FROM booking_passengers bp
      JOIN bookings bk ON bp.booking_id = bk.id
      JOIN route_stops b_from ON bk.boarding_stop_id = b_from.id
      JOIN route_stops b_to ON bk.dropping_stop_id = b_to.id
      WHERE bk.trip_id = ?
        AND bk.status IN ('confirmed', 'pending')
        AND NOT (b_to.stop_order <= ? OR b_from.stop_order >= ?)
    ) bk ON bs.id = bk.bus_seat_id
    LEFT JOIN (
      SELECT sl.bus_seat_id, sl.id
      FROM seat_locks sl
      WHERE sl.trip_id = ?
        AND sl.status = 'locked'
        AND sl.locked_until > NOW()
        AND NOT (sl.to_stop_order <= ? OR sl.from_stop_order >= ?)
    ) sl ON bs.id = sl.bus_seat_id
    WHERE bs.id = ?;
  `,
};

export const DRIVER_QUERIES = {
  // Passenger boarding chart for driver
  GET_BOARDING_CHART: `
    SELECT 
      bp.id AS passenger_id,
      bp.name,
      bp.age,
      bp.gender,
      bp.seat_number,
      bp.is_boarded,
      bp.boarded_at,
      bk.pnr_number,
      bk.passenger_contact,
      b_stop.stop_name AS boarding_point,
      b_stop.stop_order AS boarding_stop_order,
      d_stop.stop_name AS dropping_point,
      d_stop.stop_order AS dropping_stop_order
    FROM booking_passengers bp
    JOIN bookings bk ON bp.booking_id = bk.id
    JOIN route_stops b_stop ON bk.boarding_stop_id = b_stop.id
    JOIN route_stops d_stop ON bk.dropping_stop_id = d_stop.id
    WHERE bk.trip_id = ?
      AND bk.status = 'confirmed'
    ORDER BY b_stop.stop_order ASC, bp.seat_number ASC;
  `,
};

export const TENANT_QUERIES = {
  // Strict travel owner isolation check
  VERIFY_RESOURCE_OWNERSHIP: `
    SELECT 1 
    FROM travels t
    WHERE t.id = ? 
      AND (t.owner_id = ? OR EXISTS (
        SELECT 1 FROM travel_staff ts 
        WHERE ts.travel_id = t.id AND ts.user_id = ? AND ts.status = 'active'
      ));
  `,
};
