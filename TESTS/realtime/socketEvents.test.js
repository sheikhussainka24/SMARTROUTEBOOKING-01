import { REALTIME_EVENTS } from '../../REALTIME/events/eventNames.js';
import { isValidCoordinate, haversineDistance } from '../../REALTIME/gps/gpsFilter.js';

describe('Real-Time Telemetry & Event Format Tests', () => {
  test('Validates Indian subcontinent GPS coordinates', () => {
    // Bangalore coordinates: 12.9716° N, 77.5946° E
    expect(isValidCoordinate(12.9716, 77.5946)).toBe(true);
    // Chennai coordinates: 13.0827° N, 80.2707° E
    expect(isValidCoordinate(13.0827, 80.2707)).toBe(true);
    // North pole (invalid)
    expect(isValidCoordinate(89.0, 0.0)).toBe(false);
  });

  test('Calculates Haversine distance between Bangalore and Chennai correctly (~290 km)', () => {
    const dist = haversineDistance(12.9716, 77.5946, 13.0827, 80.2707);
    expect(dist).toBeGreaterThan(280);
    expect(dist).toBeLessThan(310);
  });

  test('Standard real-time event definitions are non-empty strings', () => {
    expect(REALTIME_EVENTS.DRIVER_GPS_UPDATE).toBe('driver_gps_update');
    expect(REALTIME_EVENTS.BUS_LOCATION_UPDATED).toBe('bus_location_updated');
    expect(REALTIME_EVENTS.SEATS_HELD_UPDATE).toBe('seats_held_update');
  });
});
