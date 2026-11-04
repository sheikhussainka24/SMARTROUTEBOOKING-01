import {
  routes,
  buses,
  trips,
  travels,
  routeStops,
  searchTripsData,
  getRouteCoverageReport,
  getBusServicesForRoute,
  createNewBooking,
} from '../../BACKEND/src/services/dataStore.js';
import busInventoryApiService, {
  INVENTORY_PROVIDERS,
  BUS_TYPES,
  BusInventoryApiService,
} from '../../BACKEND/src/services/busInventoryApiService.js';
import { seed as knexSeeder } from '../../DATABASE/seeds/003_populate_route_bus_services.js';

describe('SMART ROUTE — Route Bus Population, Full Coverage & Provenance Suite', () => {
  // =========================================================================
  // 1. ROUTE COVERAGE & ZERO ORPHAN ROUTES
  // =========================================================================
  describe('1. 100% Route Coverage Across Existing Corridors', () => {
    test('Reads all 135 existing routes from database/datastore without duplicates', () => {
      expect(routes).toBeDefined();
      expect(Array.isArray(routes)).toBe(true);
      expect(routes.length).toBe(135);

      // Verify zero duplicate route IDs across all 135 corridors
      const routeIds = new Set();
      routes.forEach((r) => {
        expect(routeIds.has(r.id)).toBe(false);
        routeIds.add(r.id);
      });
      expect(routeIds.size).toBe(135);
    });

    test('Every existing route is associated with valid bus services referencing its exact route ID', () => {
      const routesWithServices = new Set(trips.map((t) => t.route_id));
      const missingRoutes = routes.filter((r) => !routesWithServices.has(r.id));

      expect(missingRoutes.length).toBe(0);
      expect(routesWithServices.size).toBe(routes.length);
    });

    test('Coverage report certifies 100% coverage with exactly 0 missing routes', () => {
      const report = getRouteCoverageReport();
      expect(report).toBeDefined();
      expect(report.totalRoutesProcessed).toBe(135);
      expect(report.routesMissingServicesCount).toBe(0);
      expect(report.coveragePercentage).toBe(100);
      expect(report.totalVerifiedServices).toBeGreaterThan(0);
      expect(report.totalSampleServices).toBeGreaterThan(0);
      expect(report.routesMissingData).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. FLEET BUS TYPES COVERAGE
  // =========================================================================
  describe('2. All 5 Standard Bus Types Represented in Fleet & Services', () => {
    test('Fleet includes all 5 requested bus categories and Volvo multi-axle coaches', () => {
      const busTypesPresent = new Set(buses.map((b) => b.bus_type));

      expect(busTypesPresent.has('ac_sleeper')).toBe(true);
      expect(busTypesPresent.has('non_ac_sleeper')).toBe(true);
      expect(busTypesPresent.has('ac_seater')).toBe(true);
      expect(busTypesPresent.has('non_ac_seater')).toBe(true);
      expect(busTypesPresent.has('ac_seat_cum_sleeper')).toBe(true);

      // Verify premium Volvo 9600 multi-axle coaches exist
      const volvoBuses = buses.filter(
        (b) => (b.chassis_make === 'Volvo' || b.body_make?.includes('Volvo')) && b.is_active
      );
      expect(volvoBuses.length).toBeGreaterThanOrEqual(2);
    });

    test('Coverage report tracks distribution across all 5 bus types', () => {
      const report = getRouteCoverageReport();
      expect(report.servicesByBusType[BUS_TYPES.AC_SLEEPER]).toBeGreaterThan(0);
      expect(report.servicesByBusType[BUS_TYPES.NON_AC_SLEEPER]).toBeGreaterThan(0);
      expect(report.servicesByBusType[BUS_TYPES.AC_SEATER]).toBeGreaterThan(0);
      expect(report.servicesByBusType[BUS_TYPES.NON_AC_SEATER]).toBeGreaterThan(0);
      expect(report.servicesByBusType[BUS_TYPES.AC_SEAT_CUM_SLEEPER]).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. REQUIRED BUS SERVICE METADATA & FIELD INTEGRITY
  // =========================================================================
  describe('3. Required Metadata Attributes per Bus Service', () => {
    test('Every bus service contains all 12 required fields with valid types', () => {
      trips.forEach((t) => {
        // 1. Actual bus operator name
        expect(t.travel_name).toBeDefined();
        expect(typeof t.travel_name).toBe('string');
        expect(t.travel_name.trim().length).toBeGreaterThan(0);

        // 2. Bus service name
        expect(t.bus_name).toBeDefined();
        expect(typeof t.bus_name).toBe('string');

        // 3. Bus type
        expect(t.bus_type).toBeDefined();
        expect(Object.values(BUS_TYPES)).toContain(t.bus_type);

        // 4. Route ID
        expect(t.route_id).toBeDefined();
        expect(routes.some((r) => r.id === t.route_id)).toBe(true);

        // 5. Boarding & dropping points
        expect(Array.isArray(t.boarding_points)).toBe(true);
        expect(t.boarding_points.length).toBeGreaterThan(0);
        expect(Array.isArray(t.dropping_points)).toBe(true);
        expect(t.dropping_points.length).toBeGreaterThan(0);

        // 6. Departure & arrival times (HH:MM format)
        expect(t.departure_time).toMatch(/^\d{2}:\d{2}$/);
        expect(t.estimated_arrival_time).toMatch(/^\d{2}:\d{2}$/);

        // 7. Travel duration
        expect(t.duration_minutes).toBeDefined();
        expect(t.duration_minutes).toBeGreaterThan(0);

        // 8. Ticket fare
        expect(t.base_fare).toBeDefined();
        expect(t.base_fare).toBeGreaterThan(0);
        expect(t.fare_chart).toBeDefined();

        // 9. Total seats and seat layout
        expect(t.total_seats).toBeDefined();
        expect(t.total_seats).toBeGreaterThan(0);
        expect(t.layout_type).toBeDefined();

        // 10. Available, booked, and blocked seat status
        expect(typeof t.total_available_seats).toBe('number');
        expect(typeof t.total_booked_seats).toBe('number');
        expect(typeof t.total_blocked_seats).toBe('number');

        // 11. Operating days and service date
        expect(Array.isArray(t.operating_days)).toBe(true);
        expect(t.operating_days.length).toBeGreaterThan(0);
        expect(t.departure_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // 12. Data source and last-updated timestamp
        expect(t.data_source).toBeDefined();
        expect(t.last_updated_at).toBeDefined();
        expect(new Date(t.last_updated_at).toString()).not.toBe('Invalid Date');
      });
    });
  });

  // =========================================================================
  // 4. REAL DATA VS. SAMPLE DATA SEPARATION & NON-FABRICATION
  // =========================================================================
  describe('4. Strict Real vs. Sample Data Segregation', () => {
    test('Verified corridors are tagged as VERIFIED and published live', () => {
      const verifiedTrips = trips.filter((t) => !t.is_sample);
      expect(verifiedTrips.length).toBeGreaterThan(0);

      verifiedTrips.forEach((t) => {
        expect(t.verification_status).toBe('VERIFIED');
        expect(t.status).toBe('published');
        expect(t.is_sample).toBe(false);
        expect(t.data_source).not.toContain('sample');
      });
    });

    test('Candidate corridors are explicitly marked as SAMPLE DATA and segregated', () => {
      const sampleTrips = trips.filter((t) => t.is_sample);
      expect(sampleTrips.length).toBeGreaterThan(0);

      sampleTrips.forEach((t) => {
        expect(t.verification_status).toBe('SAMPLE_DATA');
        expect(t.status).toBe('sample');
        expect(t.is_sample).toBe(true);
        expect(t.data_source).toBe('smartroute_sample_presentation_v1');
        // Seat availability must NEVER be fabricated as live bookable inventory
        expect(t.total_available_seats).toBe(0);
      });
    });

    test('Standard live customer search excludes sample data by default', () => {
      // Coimbatore -> Mumbai is a candidate corridor
      const liveTrips = searchTripsData({ source: 'Coimbatore', destination: 'Mumbai' });
      expect(liveTrips.length).toBe(0);

      // When includeSample is explicitly requested, candidate records are returned
      const sampleTrips = searchTripsData({
        source: 'Coimbatore',
        destination: 'Mumbai',
        includeSample: true,
      });
      expect(sampleTrips.length).toBeGreaterThan(0);
      sampleTrips.forEach((st) => {
        expect(st.is_sample).toBe(true);
        expect(st.verification_status).toBe('SAMPLE_DATA');
      });
    });

    test('Live booking write is strictly rejected on SAMPLE DATA bus services', () => {
      const sampleTrip = trips.find((t) => t.is_sample);
      expect(sampleTrip).toBeDefined();

      expect(() => {
        createNewBooking({
          tripId: sampleTrip.id,
          passengerDetails: [{ name: 'Test Passenger', seatNumber: 'L1' }],
          contactDetails: { name: 'Test', email: 'test@example.com', phone: '9000000001' },
          boardingStopId: sampleTrip.boarding_points[0]?.id,
          droppingStopId: sampleTrip.dropping_points[0]?.id,
        });
      }).toThrow(/SAMPLE DATA/i);
    });
  });

  // =========================================================================
  // 5. MULTIPLE OPERATORS & MULTIPLE DEPARTURES PER ROUTE
  // =========================================================================
  describe('5. Multi-Operator & Multi-Departure Corridors', () => {
    test('High-volume trunk routes support multiple operators and multiple departures', () => {
      // Check Coimbatore - Tenkasi route (route1Id)
      const cbeTksTrips = trips.filter((t) => t.route_id === 'rt-cbe-tks-001');
      const cbeTksOps = new Set(cbeTksTrips.map((t) => t.travel_id));
      expect(cbeTksOps.size).toBeGreaterThanOrEqual(2);

      // Check Coimbatore - Karaikudi route (route_cbe_kkdi_01)
      const kkdiTrips = trips.filter((t) => t.route_id === 'route_cbe_kkdi_01');
      const kkdiTimes = new Set(kkdiTrips.map((t) => t.departure_time));
      expect(kkdiTimes.size).toBeGreaterThanOrEqual(3); // 14:00, 22:30, 23:15
    });

    test('getBusServicesForRoute returns all services for a designated route ID', () => {
      const firstRoute = routes[0];
      const services = getBusServicesForRoute(firstRoute.id);
      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBeGreaterThan(0);
      services.forEach((s) => {
        expect(s.route_id).toBe(firstRoute.id);
      });
    });
  });

  // =========================================================================
  // 6. INVENTORY API INTEGRATION SERVICE & IDEMPOTENT SYNC
  // =========================================================================
  describe('6. Authorized Bus Inventory API Integration Layer', () => {
    test('Provides valid provider configuration and sandbox status', () => {
      const config = busInventoryApiService.getProviderConfig();
      expect(config.provider).toBeDefined();
      expect(config.supportedBusTypes).toEqual(
        expect.arrayContaining(Object.values(BUS_TYPES))
      );
    });

    test('Normalizes external partner payload into standardized schema', () => {
      const rawApiPayload = {
        operator: 'KPN Speed Travels',
        serviceName: 'KPN Sleeper Express',
        busType: 'AC Sleeper',
        departureTime: '22:00',
        arrivalTime: '06:00',
        fare: 920,
        totalSeats: 36,
        isVerified: true,
      };

      const normalized = busInventoryApiService.normalizeProviderPayload(
        rawApiPayload,
        routes[0].id
      );

      expect(normalized.route_id).toBe(routes[0].id);
      expect(normalized.travel_name).toBe('KPN Speed Travels');
      expect(normalized.bus_type).toBe(BUS_TYPES.AC_SLEEPER);
      expect(normalized.verification_status).toBe('VERIFIED');
      expect(normalized.status).toBe('published');
      expect(normalized.base_fare).toBe(920);
      expect(normalized.total_seats).toBe(36);
    });

    test('Validates service records and catches missing route_id or invalid formats', () => {
      const invalidRecord = {
        route_id: 'non-existent-route',
        departure_time: '25:99', // Invalid time
        base_fare: -100, // Invalid negative fare
        total_seats: 0,
      };

      const result = busInventoryApiService.validateServiceRecord(invalidRecord, routes[0]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('syncRouteServices synchronizes idempotently without creating duplicate records', () => {
      const testRoute = routes[0];
      const testService = {
        tripNumber: 'SYNC-TEST-001',
        operator: 'SMART ROUTE Travels',
        serviceName: 'Sync Test Liner',
        busType: 'AC Sleeper',
        departureTime: '21:00',
        arrivalTime: '05:00',
        fare: 850,
        totalSeats: 36,
        isVerified: true,
      };

      const initialPool = [];
      const firstSync = busInventoryApiService.syncRouteServices(
        testRoute,
        [testService],
        initialPool
      );
      expect(firstSync.added.length).toBe(1);
      expect(firstSync.updated.length).toBe(0);

      // Re-run sync with same trip number
      const secondSync = busInventoryApiService.syncRouteServices(
        testRoute,
        [testService],
        firstSync.added
      );
      expect(secondSync.added.length).toBe(0);
      expect(secondSync.updated.length).toBe(1); // Updated idempotently, 0 duplicates!
    });
  });

  // =========================================================================
  // 7. KNEX DATABASE SEEDER SPECIFICATION
  // =========================================================================
  describe('7. Knex Seeder Verification', () => {
    test('Database seeder script exports valid seed function', () => {
      expect(typeof knexSeeder).toBe('function');
    });

    test('Seeder returns gracefully when schema tables are unmigrated', async () => {
      const mockKnex = {
        schema: {
          hasTable: async () => false,
        },
      };

      const result = await knexSeeder(mockKnex);
      expect(result).toBeDefined();
      expect(result.skipped).toBe(true);
    });
  });
});
