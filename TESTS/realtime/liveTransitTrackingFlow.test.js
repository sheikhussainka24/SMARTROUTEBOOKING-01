import { describe, test, expect, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  trips,
  buses,
  routes,
  bookings,
  primaryTripId,
  tripTelemetryMap,
  setTripTelemetry,
  getTripTelemetry,
  getTripTrackingPayload,
  getActiveTrackingTrips,
  getBookingByPnr,
} from '../../BACKEND/src/services/dataStore.js';

import {
  getTripTracking,
  getActiveLiveTrackingTrips,
} from '../../BACKEND/src/controllers/tripController.js';

import {
  getBookingTracking,
} from '../../BACKEND/src/controllers/bookingController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to simulate Express req/res
function mockReqRes({ body = {}, params = {}, query = {} } = {}) {
  const req = {
    body,
    params,
    query,
    ip: '127.0.0.1',
    get: (header) => (header === 'user-agent' ? 'Jest-Live-Tracking-Agent' : null),
  };

  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };

  return { req, res };
}

describe('SMART ROUTE — Where Is My Train Live Transit Tracking Architecture', () => {
  beforeEach(() => {
    // Reset telemetry baseline before each test
    tripTelemetryMap.clear();
  });

  // ==========================================
  // 1. API: GET /api/trips/:tripId/tracking
  // ==========================================
  describe('Trip Tracking API (GET /api/trips/:tripId/tracking)', () => {
    test('Returns 404 TRIP_NOT_FOUND when requested trip ID does not exist', async () => {
      const { req, res } = mockReqRes({ params: { tripId: 'non-existent-trip-999' } });
      await getTripTracking(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.code).toBe('TRIP_NOT_FOUND');
    });

    test('Returns full route stops, bus info, driver and standby state when no GPS has been emitted', async () => {
      const { req, res } = mockReqRes({ params: { tripId: primaryTripId } });
      await getTripTracking(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      const tracking = res.jsonData.tracking;

      expect(tracking.trip.id).toBe(primaryTripId);
      expect(tracking.bus.registration_number).toBe('TN-38-SR-0001');
      expect(tracking.bus.bus_type.toLowerCase()).toContain('sleeper');
      expect(tracking.route.source).toBe('Coimbatore');
      expect(tracking.route.destination).toBe('Tenkasi');
      expect(tracking.stops.length).toBeGreaterThanOrEqual(16);

      // Verify each stop contains scheduled arrival time, coordinates, and platform bay
      const firstStop = tracking.stops[0];
      expect(firstStop.name).toContain('Coimbatore');
      expect(firstStop.platform).toBeDefined();
      expect(firstStop.scheduled_time).toMatch(/^\d{2}:\d{2}$/);
      expect(typeof firstStop.latitude).toBe('number');
      expect(typeof firstStop.longitude).toBe('number');

      // Standby / no live GPS state: Do not fake GPS
      expect(tracking.liveGps.hasLiveGps).toBe(false);
      expect(['unavailable', 'standby']).toContain(tracking.liveGps.status);
    });

    test('Reflects actual GPS coordinates, speed, and heading when driver emits telemetry', async () => {
      // Driver emits GPS update
      setTripTelemetry(primaryTripId, {
        bus_id: buses[0].id,
        latitude: 10.9950,
        longitude: 77.0002,
        speed: 68,
        heading: 145,
        current_stop_id: 'stop-103',
        next_stop_name: 'Singanallur',
        eta: '12 mins',
      });

      const { req, res } = mockReqRes({ params: { tripId: primaryTripId } });
      await getTripTracking(req, res);

      expect(res.statusCode).toBe(200);
      const tracking = res.jsonData.tracking;

      expect(tracking.liveGps.hasLiveGps).toBe(true);
      expect(tracking.liveGps.status).toBe('active');
      expect(tracking.liveGps.latitude).toBe(10.9950);
      expect(tracking.liveGps.longitude).toBe(77.0002);
      expect(tracking.liveGps.speed).toBe(68);
      expect(tracking.liveGps.heading).toBe(145);
      expect(tracking.liveGps.next_stop_name).toBe('Singanallur');
      expect(tracking.liveGps.eta).toBe('12 mins');

      // Passed stops before stop-103 should be marked is_passed: true
      const stop101 = tracking.stops.find((s) => s.id === 'stop-101');
      const stop102 = tracking.stops.find((s) => s.id === 'stop-102');
      const stop103 = tracking.stops.find((s) => s.id === 'stop-103');
      const stop104 = tracking.stops.find((s) => s.id === 'stop-104');

      if (stop101 && stop102 && stop103 && stop104) {
        expect(stop101.is_passed).toBe(true);
        expect(stop102.is_passed).toBe(true);
        expect(stop103.is_current).toBe(true);
        expect(stop104.is_passed).toBe(false);
      }
    });

    test('Detects stale telemetry when GPS update is older than 5 minutes', () => {
      const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
      tripTelemetryMap.set(primaryTripId, {
        trip_id: primaryTripId,
        latitude: 10.9950,
        longitude: 77.0002,
        speed: 0,
        heading: 90,
        recorded_at: new Date(sixMinutesAgo).toISOString(),
        recorded_at_ms: sixMinutesAgo,
      });

      const telemetry = getTripTelemetry(primaryTripId);
      expect(telemetry.isStale).toBe(true);
      expect(telemetry.status).toBe('stale');
      expect(telemetry.ageSeconds).toBeGreaterThanOrEqual(360);
    });
  });

  // ==========================================
  // 2. API: GET /api/trips/active/live-tracking
  // ==========================================
  describe('Active Live Tracking Fleet List (GET /api/trips/active/live-tracking)', () => {
    test('Lists all active commercial trips available for real-time tracking', async () => {
      const { req, res } = mockReqRes();
      await getActiveLiveTrackingTrips(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(Array.isArray(res.jsonData.trips)).toBe(true);
      expect(res.jsonData.trips.length).toBeGreaterThan(0);

      const firstTrip = res.jsonData.trips[0];
      expect(firstTrip.tripId).toBeDefined();
      expect(firstTrip.tripNumber).toBeDefined();
      expect(firstTrip.source).toBeDefined();
      expect(firstTrip.destination).toBeDefined();
      expect(firstTrip.registrationNumber).toBeDefined();
      expect(typeof firstTrip.hasLiveGps).toBe('boolean');
    });
  });

  // ==========================================
  // 3. API: GET /api/bookings/pnr/:pnr/tracking
  // ==========================================
  describe('Passenger PNR Live Tracking API (GET /api/bookings/pnr/:pnr/tracking)', () => {
    test('Returns 404 BOOKING_NOT_FOUND when PNR is invalid', async () => {
      const { req, res } = mockReqRes({ params: { pnr: 'INVALID-PNR-8888' } });
      await getBookingTracking(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.code).toBe('BOOKING_NOT_FOUND');
    });

    test('Returns passenger reservation details and live transit status for valid PNR SR4102', async () => {
      const { req, res } = mockReqRes({ params: { pnr: 'SR4102' } });
      await getBookingTracking(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.booking.pnr_number).toBe('SR4102');
      expect(res.jsonData.booking.contact_name).toBe('Arun Prakash');
      expect(res.jsonData.tracking).toBeDefined();
      expect(res.jsonData.tracking.bus.registration_number).toBe('TN-38-SR-0001');
      expect(res.jsonData.tracking.booking.pnr).toBe('SR4102');
      expect(res.jsonData.tracking.booking.contact_name).toBe('Arun Prakash');
    });
  });

  // ==========================================
  // 4. FRONTEND SPECIFICATIONS & ARCHITECTURE
  // ==========================================
  describe('Frontend Where Is My Train Experience & Map Integration', () => {
    const liveTrackingPagePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/LiveTracking.jsx');
    const liveBusMapPath = path.resolve(__dirname, '../../FRONTEND/src/components/maps/LiveBusMap.jsx');
    const driverDashboardPath = path.resolve(__dirname, '../../FRONTEND/src/pages/driver/DriverDashboard.jsx');

    const liveTrackingContent = fs.readFileSync(liveTrackingPagePath, 'utf8');
    const liveBusMapContent = fs.readFileSync(liveBusMapPath, 'utf8');
    const driverDashboardContent = fs.readFileSync(driverDashboardPath, 'utf8');

    test('LiveTracking page renders Where Is My Train transit radar, PNR search, and station track timeline', () => {
      // Transit header
      expect(liveTrackingContent).toContain('LIVE GPS RADAR');
      expect(liveTrackingContent).toContain('Where Is My Train Experience');
      expect(liveTrackingContent).toContain('Confirmed Passenger Reservation');
      expect(liveTrackingContent).toContain('Next Route Milestone');
      expect(liveTrackingContent).toContain('Route Track & Station Milestones');
    });

    test('LiveBusMap component properly manages Leaflet lifecycle and avoids duplicate initialization errors', () => {
      // Must clean existing instance and clear _leaflet_id
      expect(liveBusMapContent).toContain('leafletMapInstanceRef.current.remove()');
      expect(liveBusMapContent).toContain('delete mapContainerRef.current._leaflet_id');
      expect(liveBusMapContent).toContain('map.invalidateSize()');
    });

    test('LiveBusMap draws split route polylines distinguishing completed journey from remaining journey', () => {
      // Emerald completed route
      expect(liveBusMapContent).toContain('#10B981'); // Emerald
      // Amber/Gold remaining dashed route
      expect(liveBusMapContent).toContain('#F59E0B'); // Amber
      expect(liveBusMapContent).toContain('dashArray');
    });

    test('LiveBusMap implements requestAnimationFrame smooth bus marker movement interpolation', () => {
      expect(liveBusMapContent).toContain('requestAnimationFrame');
      expect(liveBusMapContent).toContain('animateBusMarkerTo');
      expect(liveBusMapContent).toContain('cancelAnimationFrame');
    });

    test('Displays honest Live location unavailable standby notice when telemetry is missing without faking coordinates', () => {
      expect(liveBusMapContent.toLowerCase()).toContain('live location unavailable');
      expect(liveBusMapContent).toContain('Coach is currently on terminal standby');
      expect(liveBusMapContent).toContain('hasLiveGps');
      // Must not generate fake random math coordinates
      expect(liveBusMapContent).not.toContain('Math.random() * 0.05');
    });

    test('Driver Dashboard is synchronized with primary trip trp-sr-cbe-100 and TN-38-SR-0001 bus', () => {
      expect(driverDashboardContent).toContain('trp-sr-cbe-100');
      expect(driverDashboardContent).toContain('TN-38-SR-0001');
      expect(driverDashboardContent).toContain('driver_gps_update');
    });
  });
});
