import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createRoute,
  listRoutes,
  getRouteDetails,
  getRouteStops,
  updateRouteStops,
} from '../../BACKEND/src/controllers/ownerController.js';
import {
  smartRouteTravelId,
  ownerId,
  routes,
  routeStops,
  searchPlacesIndex,
} from '../../BACKEND/src/services/dataStore.js';
import {
  PAN_INDIA_TRANSIT_HUBS,
  PAN_INDIA_CITY_COORDINATES,
  validateStopCoordinates,
  validateRouteStops,
} from '../../BACKEND/src/data/indiaTransitHubs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mockReqRes(options = {}) {
  const {
    body = {},
    params = {},
    query = {},
    user = { id: ownerId, role: 'travel_owner', travelId: smartRouteTravelId },
    headers = {},
  } = options;

  const req = {
    body,
    params,
    query,
    user,
    headers,
    ip: '127.0.0.1',
    get: (h) => headers[h.toLowerCase()] || headers[h] || '',
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return responseData;
    },
  };

  return { req, res };
}

describe('SMART ROUTE — Assigned Commercial Routes & Tata Label Correction', () => {
  const wizardPath = path.resolve(__dirname, '../../FRONTEND/src/pages/admin/AddBusWizard.jsx');
  const fleetDashPath = path.resolve(__dirname, '../../FRONTEND/src/pages/admin/AdminFleetDashboard.jsx');
  const ownerDashPath = path.resolve(__dirname, '../../FRONTEND/src/pages/owner/OwnerDashboard.jsx');
  const routeModalPath = path.resolve(__dirname, '../../FRONTEND/src/components/owner/CommercialRouteConfigModal.jsx');

  const wizardContent = fs.readFileSync(wizardPath, 'utf8');
  const fleetDashContent = fs.readFileSync(fleetDashPath, 'utf8');
  const ownerDashContent = fs.readFileSync(ownerDashPath, 'utf8');
  const routeModalContent = fs.readFileSync(routeModalPath, 'utf8');

  // =========================================================================
  // 1. TATA LABEL CORRECTION
  // =========================================================================
  describe('1. Tata Label Correction (“Tata Prakash” ➔ “Tata”)', () => {
    test('AddBusWizard displays "2+1 Combo (Tata)" instead of "Tata Prakash"', () => {
      expect(wizardContent).toContain("name: '2+1 Combo (Tata)'");
      expect(wizardContent).not.toContain("name: '2+1 Combo (Tata Prakash)'");
    });

    test('AddBusWizard preserves chassis and coach-body information ("Prakash Vega")', () => {
      // Chassis info must be preserved
      expect(wizardContent).toContain("chassis: 'Tata LPO 1618 / Prakash Vega 2+1 Combo'");
    });

    test('AddBusWizard preserves 4-step wizard structure and existing features', () => {
      expect(wizardContent).toContain('Step A: Fleet Details');
      expect(wizardContent).toContain('Step B: 6 Coach Layouts');
      expect(wizardContent).toContain('Step C: Dynamic Fares');
      expect(wizardContent).toContain('Step D: Amenities & Deploy');
    });

    test('AdminFleetDashboard displays "2+1 Combo (Tata)" and preserves vehicle info', () => {
      expect(fleetDashContent).toContain("bus_type: '2+1 Combo (Tata)'");
      expect(fleetDashContent).toContain("layout_name: '2+1 Combo (Tata)'");
      expect(fleetDashContent).not.toContain("bus_type: '2+1 Combo (Tata Prakash)'");
    });

    test('OwnerDashboard bus configuration option uses "Tata Vega AC" without "Prakash"', () => {
      expect(ownerDashContent).toContain('<option value="Tata Vega AC">Tata Vega AC Coach</option>');
      expect(ownerDashContent).not.toContain('<option value="Tata Prakash Vega AC">Tata Prakash Vega AC Coach</option>');
    });
  });

  // =========================================================================
  // 2. ASSIGNED COMMERCIAL ROUTES SECTION NAVIGATION & UI
  // =========================================================================
  describe('2. Assigned Commercial Routes Section & UI', () => {
    test('Travel Owner dashboard includes Assigned Commercial Routes navigation tab', () => {
      expect(ownerDashContent).toContain("id: 'routes', label: `Assigned Commercial Routes (");
    });

    test('Assigned Commercial Routes section features "+ Configure Commercial Route" CTA button', () => {
      expect(ownerDashContent).toContain('Assigned Commercial Routes');
      expect(ownerDashContent).toContain('Configure Commercial Route');
      expect(ownerDashContent).toContain('CommercialRouteConfigModal');
    });

    test('CommercialRouteConfigModal supports searchable From & To location fields across India', () => {
      expect(routeModalContent).toContain('PlaceAutocomplete');
      expect(routeModalContent).toContain('commercial-route-origin');
      expect(routeModalContent).toContain('commercial-route-destination');
      expect(routeModalContent).toContain('From (Origin Location)');
      expect(routeModalContent).toContain('To (Destination Location)');
    });

    test('CommercialRouteConfigModal allows intermediate stops to be configured and reordered', () => {
      expect(routeModalContent).toContain('handleMoveStop');
      expect(routeModalContent).toContain('handleRemoveStop');
      expect(routeModalContent).toContain('handleAddIntermediateStop');
      expect(routeModalContent).toContain('Move Stop Earlier in Journey');
      expect(routeModalContent).toContain('Move Stop Later in Journey');
    });

    test('CommercialRouteConfigModal displays an interactive live route preview before saving', () => {
      expect(routeModalContent).toContain('Commercial Route Preview');
      expect(routeModalContent).toContain('Sequential Passenger Transit Sequence');
      expect(routeModalContent).toContain('Route Pre-Flight Audit');
    });

    test('CommercialRouteConfigModal validates and prevents identical origin and destination', () => {
      expect(routeModalContent).toContain('Origin and Destination cannot be the same location');
      expect(routeModalContent).toContain('handleSwapLocations');
      expect(routeModalContent).toContain('disabled={!isValid || saving}');
    });

    test('Route configuration is kept separate from trip scheduling, bus assignment, and fares', () => {
      // Must not contain bus assignment, departure trip time schedules, or dynamic fare matrix in the route configurator
      expect(routeModalContent).not.toContain('assignedBusId');
      expect(routeModalContent).not.toContain('driverId');
      expect(routeModalContent).not.toContain('seatFare');
      expect(routeModalContent).not.toContain('fareMultiplier');
    });
  });

  // =========================================================================
  // 3. PAN-INDIA TRANSIT HUBS & LOCATION DATA REUSE
  // =========================================================================
  describe('3. Pan-India Transit Hubs & Location Data Coverage', () => {
    test('Location search covers major cities across Indian states & Union Territories', () => {
      const citiesToTest = [
        'Coimbatore',
        'Bengaluru',
        'Kochi',
        'Hyderabad',
        'Mumbai',
        'Jaipur',
        'Delhi',
        'Shimla',
        'Kolkata',
        'Guwahati',
        'Shillong',
        'Agartala',
        'Imphal',
        'Leh',
        'Puducherry',
      ];

      citiesToTest.forEach((city) => {
        const matches = searchPlacesIndex(city);
        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0].mainText.toLowerCase()).toContain(city.toLowerCase());
      });
    });

    test('PAN_INDIA_CITY_COORDINATES covers southern, western, northern, and northeastern territories', () => {
      expect(PAN_INDIA_CITY_COORDINATES.coimbatore).toBeDefined();
      expect(PAN_INDIA_CITY_COORDINATES.bengaluru).toBeDefined();
      expect(PAN_INDIA_CITY_COORDINATES.mumbai).toBeDefined();
      expect(PAN_INDIA_CITY_COORDINATES.delhi).toBeDefined();
      expect(PAN_INDIA_CITY_COORDINATES.leh).toBeDefined();
      expect(PAN_INDIA_CITY_COORDINATES.gangtok).toBeDefined();
      expect(PAN_INDIA_CITY_COORDINATES.puducherry).toBeDefined();
    });

    test('Coordinate validation strictly adheres to Indian geographical boundary limits', () => {
      // Valid Indian coordinates (Coimbatore: 11.0168°N, 76.9558°E)
      const validCoord = validateStopCoordinates(11.0168, 76.9558);
      expect(validCoord.isValid).toBe(true);

      // Outside latitude (< 8.0° N)
      const southCoord = validateStopCoordinates(5.0, 77.0);
      expect(southCoord.isValid).toBe(false);

      // Outside latitude (> 35.5° N)
      const northCoord = validateStopCoordinates(38.0, 77.0);
      expect(northCoord.isValid).toBe(false);

      // Outside longitude (< 68.0° E)
      const westCoord = validateStopCoordinates(20.0, 65.0);
      expect(westCoord.isValid).toBe(false);

      // Outside longitude (> 97.5° E)
      const eastCoord = validateStopCoordinates(20.0, 102.0);
      expect(eastCoord.isValid).toBe(false);
    });
  });

  // =========================================================================
  // 4. BACKEND ROUTE SAVING & VALIDATION ARCHITECTURE
  // =========================================================================
  describe('4. Backend Commercial Route Persistence & Validation', () => {
    test('Rejects route creation when origin and destination are identical', async () => {
      const { req, res } = mockReqRes({
        body: {
          name: 'Invalid Circular Route',
          source: 'Bengaluru',
          destination: 'Bengaluru',
        },
      });

      await createRoute(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('cannot be identical');
    });

    test('Rejects route creation when origin or destination is missing', async () => {
      const { req, res } = mockReqRes({
        body: {
          source: 'Coimbatore',
          destination: '',
        },
      });

      await createRoute(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Successfully saves a new assigned commercial route with ordered intermediate stops', async () => {
      const uniqueCode = `CR-TEST-${Date.now().toString().slice(-4)}`;
      const { req, res } = mockReqRes({
        body: {
          name: 'Coimbatore ➔ Mysuru Royal Corridor',
          code: uniqueCode,
          source: 'Coimbatore',
          destination: 'Mysuru',
          distanceKm: 210,
          estimatedDurationMinutes: 300,
          stops: [
            {
              name: 'Coimbatore Gandhipuram Omni Stand',
              city: 'Coimbatore',
              stopOrder: 1,
              isBoardingPoint: true,
              isDroppingPoint: false,
              distanceFromStartKm: 0,
              estimatedTimeFromStartMinutes: 0,
              latitude: 11.0183,
              longitude: 76.9725,
            },
            {
              name: 'Sathyamangalam Bus Stand',
              city: 'Sathyamangalam',
              stopOrder: 2,
              isBoardingPoint: true,
              isDroppingPoint: true,
              distanceFromStartKm: 68,
              estimatedTimeFromStartMinutes: 90,
              latitude: 11.5034,
              longitude: 77.2415,
            },
            {
              name: 'Chamarajanagar Bus Stand',
              city: 'Chamarajanagar',
              stopOrder: 3,
              isBoardingPoint: true,
              isDroppingPoint: true,
              distanceFromStartKm: 145,
              estimatedTimeFromStartMinutes: 200,
              latitude: 11.9261,
              longitude: 76.9437,
            },
            {
              name: 'Mysore Suburb Bus Stand',
              city: 'Mysuru',
              stopOrder: 4,
              isBoardingPoint: false,
              isDroppingPoint: true,
              distanceFromStartKm: 210,
              estimatedTimeFromStartMinutes: 300,
              latitude: 12.3115,
              longitude: 76.6558,
            },
          ],
        },
      });

      await createRoute(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.route).toBeDefined();
      expect(res.body.data.route.source).toBe('Coimbatore');
      expect(res.body.data.route.destination).toBe('Mysuru');
      expect(res.body.data.route.code).toBe(uniqueCode);

      // Verify stops were saved in exact sequence
      const routeId = res.body.data.route.id;
      const { req: stopsReq, res: stopsRes } = mockReqRes({
        params: { id: routeId },
      });

      await getRouteStops(stopsReq, stopsRes);
      expect(stopsRes.statusCode).toBe(200);
      expect(stopsRes.body.data.stops.length).toBe(4);
      expect(stopsRes.body.data.stops[0].name).toBe('Coimbatore Gandhipuram Omni Stand');
      expect(stopsRes.body.data.stops[1].name).toBe('Sathyamangalam Bus Stand');
      expect(stopsRes.body.data.stops[2].name).toBe('Chamarajanagar Bus Stand');
      expect(stopsRes.body.data.stops[3].name).toBe('Mysore Suburb Bus Stand');
    });

    test('Allows intermediate stops to be reordered in reverse or modified sequence', async () => {
      const testRoute = routes.find((r) => r.source === 'Coimbatore' && r.destination === 'Mysuru');
      expect(testRoute).toBeDefined();

      const existingStops = routeStops.filter((s) => s.route_id === testRoute.id);
      expect(existingStops.length).toBeGreaterThanOrEqual(2);

      // Reorder stops
      const swapped = [existingStops[1], existingStops[0], ...existingStops.slice(2)];
      const { req, res } = mockReqRes({
        params: { id: testRoute.id },
        body: { stops: swapped },
      });

      await updateRouteStops(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stops[0].name).toBe(existingStops[1].name);
    });
  });
});
