/**
 * SMART ROUTE — Pan-India Bus Route, Exact Stops, Geocoding & Telemetry Audit Test Suite
 *
 * Certifies:
 * 1. 0 Placeholder / Formula Coordinates (No 11.0 + order*0.05 or 77.0 + order*0.05)
 * 2. Strict Real-World Indian Geographic Boundaries (8.0°–35.5° N, 68.0°–97.5° E)
 * 3. Monotonic Sequential Stop Ordering & Transit Progression across all 135 corridors
 * 4. Distinct Multi-Operator Service Stops, Boarding Points & Timings (Coimbatore ➔ Tenkasi)
 * 5. Decoupled GPS Telemetry with Honest Standby Indicators (Never fake bus movement)
 * 6. Route & Stop Management Center APIs (CRUD, Stop Reordering, Coordinates Validation, Bulk Import)
 */

import {
  routes,
  routeStops,
  trips,
  buses,
  travels,
  getStopsForTrip,
  getTripTrackingPayload,
  setTripTelemetry,
  getRouteById,
  getRouteStopsByRouteId,
  createRouteData,
  updateRouteData,
  updateRouteStopsData,
  verifyRouteData,
  bulkImportRoutesData,
} from '../../BACKEND/src/services/dataStore.js';

import {
  PAN_INDIA_CITY_COORDINATES,
  PAN_INDIA_STOPS_REGISTRY,
  getVerifiedStopCoordinates,
  validateStopCoordinates,
  validateRouteStops,
} from '../../BACKEND/src/data/indiaTransitHubs.js';

describe('SMART ROUTE — Pan-India Route, Exact Stops & Map Data Comprehensive Audit Suite', () => {

  // =========================================================================
  // 1. ZERO PLACEHOLDER / MOCK COORDINATES AUDIT
  // =========================================================================
  describe('1. Zero Placeholder & Mock Formula Coordinates Audit', () => {
    test('Certified 0 placeholder coordinates across all 725+ intermediate route stops', () => {
      expect(routeStops).toBeDefined();
      expect(Array.isArray(routeStops)).toBe(true);
      expect(routeStops.length).toBeGreaterThanOrEqual(725);

      const fakeFormulaStops = [];

      routeStops.forEach((stop) => {
        const lat = Number(stop.latitude);
        const lng = Number(stop.longitude);
        const order = Number(stop.stop_order || stop.order || 1);

        // Check against the historical mock formula: 11.0 + order * 0.05
        const mockLat = 11.0 + (order * 0.05);
        const mockLng = 77.0 + (order * 0.05);

        const isExactMockFormula = Math.abs(lat - mockLat) < 0.00001 && Math.abs(lng - mockLng) < 0.00001;
        if (isExactMockFormula) {
          fakeFormulaStops.push({
            id: stop.id,
            name: stop.name,
            route_id: stop.route_id,
            order,
            lat,
            lng,
          });
        }
      });

      expect(fakeFormulaStops).toHaveLength(0);
    });

    test('Every route stop possesses non-null, valid numeric latitude and longitude', () => {
      routeStops.forEach((stop) => {
        expect(typeof stop.latitude).toBe('number');
        expect(typeof stop.longitude).toBe('number');
        expect(Number.isNaN(stop.latitude)).toBe(false);
        expect(Number.isNaN(stop.longitude)).toBe(false);
        expect(stop.latitude).not.toBeNull();
        expect(stop.longitude).not.toBeNull();
      });
    });

    test('All 135 corridors have verified intermediate stops attached', () => {
      const stopsPerRoute = new Map();
      routeStops.forEach((st) => {
        stopsPerRoute.set(st.route_id, (stopsPerRoute.get(st.route_id) || 0) + 1);
      });

      routes.forEach((r) => {
        const count = stopsPerRoute.get(r.id) || 0;
        expect(count).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // =========================================================================
  // 2. GEOGRAPHICAL BOUNDARIES & PAN-INDIA COORDINATES CONFORMANCE
  // =========================================================================
  describe('2. Pan-India Geographic Boundaries Conformance (8.0°–35.5°N, 68.0°–97.5°E)', () => {
    test('100% of route stops conform to authentic Indian geographic bounds', () => {
      const outOfBoundsStops = [];

      routeStops.forEach((stop) => {
        const validation = validateStopCoordinates(stop.latitude, stop.longitude);
        if (!validation.isValid) {
          outOfBoundsStops.push({
            id: stop.id,
            name: stop.name,
            city: stop.city,
            latitude: stop.latitude,
            longitude: stop.longitude,
            error: validation.error,
          });
        }
      });

      expect(outOfBoundsStops).toHaveLength(0);
    });

    test('validateStopCoordinates helper correctly accepts valid Indian points and rejects outliers', () => {
      // Valid points across India
      expect(validateStopCoordinates(13.0827, 80.2707).isValid).toBe(true); // Chennai (South)
      expect(validateStopCoordinates(28.6139, 77.2090).isValid).toBe(true); // New Delhi (North)
      expect(validateStopCoordinates(19.0760, 72.8777).isValid).toBe(true); // Mumbai (West)
      expect(validateStopCoordinates(22.5726, 88.3639).isValid).toBe(true); // Kolkata (East)
      expect(validateStopCoordinates(8.5241, 76.9366).isValid).toBe(true);  // Trivandrum (Far South)
      expect(validateStopCoordinates(32.7266, 74.8570).isValid).toBe(true); // Jammu (Far North)

      // Invalid points outside Indian territory
      expect(validateStopCoordinates(0.0, 0.0).isValid).toBe(false);       // Null Island
      expect(validateStopCoordinates(51.5074, -0.1278).isValid).toBe(false); // London
      expect(validateStopCoordinates(37.7749, -122.4194).isValid).toBe(false); // San Francisco
      expect(validateStopCoordinates('invalid', 'coord').isValid).toBe(false);
    });

    test('Pan-India Transit Hub registry covers all major zones', () => {
      const cities = Object.keys(PAN_INDIA_CITY_COORDINATES);
      expect(cities.length).toBeGreaterThanOrEqual(100);

      // Verify South, North, West, East cities are registered
      expect(PAN_INDIA_CITY_COORDINATES).toHaveProperty('coimbatore');
      expect(PAN_INDIA_CITY_COORDINATES).toHaveProperty('bengaluru');
      expect(PAN_INDIA_CITY_COORDINATES).toHaveProperty('delhi');
      expect(PAN_INDIA_CITY_COORDINATES).toHaveProperty('mumbai');
      expect(PAN_INDIA_CITY_COORDINATES).toHaveProperty('kolkata');
      expect(PAN_INDIA_CITY_COORDINATES).toHaveProperty('hyderabad');
      expect(PAN_INDIA_CITY_COORDINATES).toHaveProperty('chandigarh');
      expect(PAN_INDIA_CITY_COORDINATES).toHaveProperty('jaipur');
      expect(PAN_INDIA_CITY_COORDINATES).toHaveProperty('kochi');
    });

    test('getVerifiedStopCoordinates resolves known hubs and handles unknown points gracefully', () => {
      const gandhipuram = getVerifiedStopCoordinates('Gandhipuram Omni Bus Stand', 'Coimbatore', 'Tamil Nadu');
      expect(gandhipuram.latitude).toBeCloseTo(11.0183, 2);
      expect(gandhipuram.longitude).toBeCloseTo(76.9725, 2);
      expect(gandhipuram.isVerified).toBe(true);

      const kashmereGate = getVerifiedStopCoordinates('Kashmere Gate ISBT', 'Delhi', 'Delhi NCR');
      expect(kashmereGate.latitude).toBeCloseTo(28.6665, 2);
      expect(kashmereGate.longitude).toBeCloseTo(77.2285, 2);
      expect(kashmereGate.isVerified).toBe(true);

      const unknownHub = getVerifiedStopCoordinates('Random Unknown Corner', 'Madurai', 'Tamil Nadu');
      expect(unknownHub.latitude).toBeDefined();
      expect(unknownHub.longitude).toBeDefined();
      expect(validateStopCoordinates(unknownHub.latitude, unknownHub.longitude).isValid).toBe(true);
    });
  });

  // =========================================================================
  // 3. SEQUENTIAL ORDERING & ROUTE INTEGRITY AUDIT
  // =========================================================================
  describe('3. Sequential Stop Ordering & Transit Progression Integrity', () => {
    test('Every route stop sequence has strictly monotonic stop_order starting from 1', () => {
      const stopsByRoute = new Map();
      routeStops.forEach((s) => {
        if (!stopsByRoute.has(s.route_id)) {
          stopsByRoute.set(s.route_id, []);
        }
        stopsByRoute.get(s.route_id).push(s);
      });

      stopsByRoute.forEach((stops, routeId) => {
        stops.sort((a, b) => a.stop_order - b.stop_order);

        stops.forEach((s, idx) => {
          expect(s.stop_order).toBe(idx + 1);
        });

        // First stop must be at 0 km and 0 mins
        expect(stops[0].distance_from_start_km).toBe(0);
        expect(stops[0].estimated_time_from_start_minutes).toBe(0);
        expect(stops[0].is_boarding_point).toBe(true);

        // Terminal stop must be dropping point
        const lastStop = stops[stops.length - 1];
        expect(lastStop.is_dropping_point).toBe(true);
        expect(lastStop.distance_from_start_km).toBeGreaterThan(0);
        expect(lastStop.estimated_time_from_start_minutes).toBeGreaterThan(0);
      });
    });

    test('Distance and estimated time increase monotonically along every route', () => {
      const stopsByRoute = new Map();
      routeStops.forEach((s) => {
        if (!stopsByRoute.has(s.route_id)) {
          stopsByRoute.set(s.route_id, []);
        }
        stopsByRoute.get(s.route_id).push(s);
      });

      stopsByRoute.forEach((stops) => {
        stops.sort((a, b) => a.stop_order - b.stop_order);

        for (let i = 1; i < stops.length; i++) {
          const prev = stops[i - 1];
          const curr = stops[i];
          expect(curr.distance_from_start_km).toBeGreaterThanOrEqual(prev.distance_from_start_km);
          expect(curr.estimated_time_from_start_minutes).toBeGreaterThanOrEqual(prev.estimated_time_from_start_minutes);
        }
      });
    });

    test('validateRouteStops validator correctly detects out-of-order sequences or duplicates', () => {
      // 1. Valid sequence
      const validStops = [
        { name: 'Hub A', latitude: 11.0, longitude: 77.0, stop_order: 1 },
        { name: 'Hub B', latitude: 11.5, longitude: 77.5, stop_order: 2 },
        { name: 'Hub C', latitude: 12.0, longitude: 78.0, stop_order: 3 },
      ];
      expect(validateRouteStops(validStops).isValid).toBe(true);

      // 2. Out of order
      const outOfOrderStops = [
        { name: 'Hub A', latitude: 11.0, longitude: 77.0, stop_order: 1 },
        { name: 'Hub C', latitude: 12.0, longitude: 78.0, stop_order: 3 },
        { name: 'Hub B', latitude: 11.5, longitude: 77.5, stop_order: 2 },
      ];
      const resOrder = validateRouteStops(outOfOrderStops);
      expect(resOrder.isValid).toBe(false);
      expect(resOrder.errors.some((e) => e.includes('out of sequential order'))).toBe(true);

      // 3. Out of bounds coordinate
      const invalidCoordStops = [
        { name: 'Hub A', latitude: 11.0, longitude: 77.0, stop_order: 1 },
        { name: 'Hub Out', latitude: 0.5, longitude: 10.0, stop_order: 2 },
      ];
      const resCoord = validateRouteStops(invalidCoordStops);
      expect(resCoord.isValid).toBe(false);
      expect(resCoord.errors.some((e) => e.includes('outside Indian borders'))).toBe(true);
    });
  });

  // =========================================================================
  // 4. MULTI-OPERATOR DISTINCT SERVICE STOPS & SCHEDULES
  // =========================================================================
  describe('4. Multi-Operator Route Differentiation & Service Stops', () => {
    test('Coimbatore ➔ Tenkasi corridor (rt-cbe-tks-001) has at least 5 distinct bus operators', () => {
      const cbeTksTrips = trips.filter((t) => t.route_id === 'rt-cbe-tks-001');
      expect(cbeTksTrips.length).toBeGreaterThanOrEqual(5);

      const operators = new Set(cbeTksTrips.map((t) => t.travel_name || t.travel_id));
      expect(operators.size).toBeGreaterThanOrEqual(5);
    });

    test('Each of the 5 operators on Coimbatore ➔ Tenkasi has unique, distinct service stop itineraries', () => {
      const smartRouteTrip = trips.find((t) => t.id.startsWith('trp-sr-cbe-'));
      const veeVeeTrip = trips.find((t) => t.id.startsWith('trp-vv-tks-') || t.id.startsWith('trp-vv-cbe-'));
      const tranzkingTrip = trips.find((t) => t.id.startsWith('trp-tk-tks-'));
      const cityTrip = trips.find((t) => t.id.startsWith('trp-ct-tks-'));
      const ybmTrip = trips.find((t) => t.id.startsWith('trp-yb-tks-'));

      expect(smartRouteTrip).toBeDefined();
      expect(veeVeeTrip).toBeDefined();
      expect(tranzkingTrip).toBeDefined();
      expect(cityTrip).toBeDefined();
      expect(ybmTrip).toBeDefined();

      const srStops = getStopsForTrip(smartRouteTrip.id);
      const vvStops = getStopsForTrip(veeVeeTrip.id);
      const tkStops = getStopsForTrip(tranzkingTrip.id);
      const ctStops = getStopsForTrip(cityTrip.id);
      const ybStops = getStopsForTrip(ybmTrip.id);

      // Verify each operator has their distinct stop count & route profile
      expect(srStops.length).toBe(16); // SMART ROUTE: 16 stops via Palani/Rajapalayam
      expect(vvStops.length).toBe(14); // VEE VEE: 14 stops via Kangeyam/Dharapuram/Sempatty
      expect(tkStops.length).toBe(9);  // TRANZKING: 9 express stops
      expect(ctStops.length).toBe(16); // City Travels: 16 daytime stops
      expect(ybStops.length).toBe(9);  // YBM: 9 night sleeper bypass stops

      // Verify stop lists are not identical across operators
      const srStopNames = srStops.map((s) => s.name).join('|');
      const vvStopNames = vvStops.map((s) => s.name).join('|');
      const tkStopNames = tkStops.map((s) => s.name).join('|');
      const ctStopNames = ctStops.map((s) => s.name).join('|');
      const ybStopNames = ybStops.map((s) => s.name).join('|');

      expect(srStopNames).not.toEqual(vvStopNames);
      expect(srStopNames).not.toEqual(tkStopNames);
      expect(vvStopNames).not.toEqual(ctStopNames);
      expect(tkStopNames).not.toEqual(ybStopNames);
    });

    test('Trip tracking payload embeds operator-specific stop itineraries with realistic timing', () => {
      const smartRouteTrip = trips.find((t) => t.id.startsWith('trp-sr-cbe-'));
      const tracking = getTripTrackingPayload(smartRouteTrip.id);

      expect(tracking).toBeDefined();
      expect(tracking.stops).toHaveLength(16);
      expect(tracking.stops[0].name).toContain('Coimbatore');
      expect(tracking.stops[15].name).toBe('Tenkasi New Bus Stand');

      // Check scheduled timings are computed and formatted properly (HH:MM)
      tracking.stops.forEach((st) => {
        expect(st.scheduled_time).toMatch(/^\d{2}:\d{2}$/);
        expect(typeof st.distance_km).toBe('number');
        expect(typeof st.estimated_time_from_start_minutes).toBe('number');
      });
    });
  });

  // =========================================================================
  // 5. HONEST STANDBY GPS TELEMETRY & DECOUPLED TRACKING
  // =========================================================================
  describe('5. Honest Standby GPS Telemetry vs Live Broadcast', () => {
    test('Standby coaches without live GPS ping return honest standby telemetry (no fake moving coords)', () => {
      // Find a trip that does not have recorded telemetry
      const unstreamedTrip = trips.find((t) => t.id.includes('ct-tks-') || t.id.includes('yb-tks-'));
      expect(unstreamedTrip).toBeDefined();

      const trackingPayload = getTripTrackingPayload(unstreamedTrip.id);
      expect(trackingPayload).toBeDefined();
      expect(trackingPayload.liveGps).toBeDefined();

      // Standby verification: hasLiveGps must be false, lat/lng must be null
      expect(trackingPayload.liveGps.hasLiveGps).toBe(false);
      expect(trackingPayload.liveGps.latitude).toBeNull();
      expect(trackingPayload.liveGps.longitude).toBeNull();
      expect(trackingPayload.liveGps.status).toBe('standby');
      expect(trackingPayload.liveGps.reason).toContain('standby');
    });

    test('Active bus telemetry returns verified coordinates, speed, and real-time status', () => {
      const activeTrip = trips[0];
      const validStop = getStopsForTrip(activeTrip.id)[0];

      // Record simulated genuine GPS ping
      setTripTelemetry(activeTrip.id, {
        latitude: validStop.latitude,
        longitude: validStop.longitude,
        speed: 68,
        heading: 185,
        current_stop_id: validStop.id,
        next_stop_name: 'Next Transit Junction',
        eta: '25 mins',
      });

      const payload = getTripTrackingPayload(activeTrip.id);
      expect(payload).toBeDefined();
      expect(payload.liveGps.hasLiveGps).toBe(true);
      expect(payload.liveGps.latitude).toBe(validStop.latitude);
      expect(payload.liveGps.longitude).toBe(validStop.longitude);
      expect(payload.liveGps.speed).toBe(68);
      expect(payload.liveGps.heading).toBe(185);
      expect(payload.liveGps.eta).toBe('25 mins');
    });
  });

  // =========================================================================
  // 6. ROUTE & STOP MANAGEMENT CENTER APIS
  // =========================================================================
  describe('6. Route & Stop Management Center APIs & Operations', () => {
    test('getRouteById and getRouteStopsByRouteId return valid corridor details and stops', () => {
      const route = getRouteById('rt-cbe-tks-001');
      expect(route).toBeDefined();
      expect(route.source).toBe('Coimbatore');
      expect(route.destination).toBe('Tenkasi');

      const stops = getRouteStopsByRouteId('rt-cbe-tks-001');
      expect(stops.length).toBeGreaterThanOrEqual(2);
      expect(stops[0].stop_order).toBe(1);
    });

    test('updateRouteStopsData successfully updates and re-indexes stops sequentially', () => {
      const testRouteId = 'rt-cbe-tks-001';
      const originalStops = getRouteStopsByRouteId(testRouteId);

      const modifiedStops = [
        { name: 'Gandhipuram Omni Bus Stand', city: 'Coimbatore', latitude: 11.0183, longitude: 76.9725, is_boarding_point: true, is_dropping_point: false },
        { name: 'Singanallur Bus Stand', city: 'Coimbatore', latitude: 10.9950, longitude: 77.0002, is_boarding_point: true, is_dropping_point: false },
        { name: 'Pollachi Central', city: 'Pollachi', latitude: 10.6609, longitude: 77.0082, is_boarding_point: true, is_dropping_point: true },
        { name: 'Tenkasi Bus Stand', city: 'Tenkasi', latitude: 8.9604, longitude: 77.3152, is_boarding_point: false, is_dropping_point: true },
      ];

      const updated = updateRouteStopsData(testRouteId, modifiedStops);
      expect(updated).toHaveLength(4);
      expect(updated[0].stop_order).toBe(1);
      expect(updated[1].stop_order).toBe(2);
      expect(updated[2].stop_order).toBe(3);
      expect(updated[3].stop_order).toBe(4);

      // Verify all stops are verified within Indian bounds
      updated.forEach((st) => {
        expect(st.is_verified).toBe(true);
        expect(validateStopCoordinates(st.latitude, st.longitude).isValid).toBe(true);
      });

      // Restore original stops
      updateRouteStopsData(testRouteId, originalStops);
    });

    test('verifyRouteData toggles verification status between VERIFIED and PENDING_VERIFICATION', () => {
      const testRouteId = 'rt-cbe-tks-001';
      
      const unverified = verifyRouteData(testRouteId, false);
      expect(unverified.verification_status).toBe('PENDING_VERIFICATION');

      const verified = verifyRouteData(testRouteId, true);
      expect(verified.verification_status).toBe('VERIFIED');
    });

    test('bulkImportRoutesData imports valid route payloads and reports errors on malformed records', () => {
      const importPayload = [
        {
          source: 'Madurai',
          destination: 'Rameswaram',
          distanceKm: 172,
          estimatedDurationMinutes: 210,
          stops: [
            { name: 'Mattuthavani Integrated Bus Terminus', city: 'Madurai', latitude: 9.9391, longitude: 78.1574 },
            { name: 'Manamadurai Bus Stand', city: 'Manamadurai', latitude: 9.6974, longitude: 78.4485 },
            { name: 'Paramakudi Bus Stand', city: 'Paramakudi', latitude: 9.5448, longitude: 78.5910 },
            { name: 'Ramanathapuram New Bus Stand', city: 'Ramanathapuram', latitude: 9.3639, longitude: 78.8395 },
            { name: 'Rameswaram Bus Terminal', city: 'Rameswaram', latitude: 9.2885, longitude: 79.3129 },
          ],
        },
        {
          // Malformed: missing source
          destination: 'Kanyakumari',
          distanceKm: 240,
        },
      ];

      const result = bulkImportRoutesData(importPayload);
      expect(result.imported).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Row 2: Missing source or destination');
    });
  });

});
