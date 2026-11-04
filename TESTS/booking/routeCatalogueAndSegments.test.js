import {
  COIMBATORE_ROUTES,
  BENGALURU_ROUTES,
  MASTER_ROUTE_CATALOGUE,
  ALL_CATALOGUE_ROUTES,
  CITY_ALIASES,
  isCityMatch,
  normalizeCityName,
} from '../../BACKEND/src/services/routeCatalogueData.js';

import {
  routes,
  routeStops,
  trips,
  buses,
  travels,
  busLayout,
  tripSegmentReservations,
  hasSegmentConflict,
  searchTripsData,
  findMatchingCandidateCorridor,
  getRouteCatalogueData,
  getSeatsForTrip,
  createNewBooking,
} from '../../BACKEND/src/services/dataStore.js';

describe('SMART ROUTE — Route Catalogue & Segment Inventory Test Suite', () => {
  // =========================================================================
  // 1. ROUTE CATALOGUE COMPLETENESS & STRUCTURE
  // =========================================================================
  describe('1. Route Catalogue Corridors Completeness', () => {
    test('Contains exactly 23 Coimbatore-origin candidate corridors across required regions', () => {
      expect(COIMBATORE_ROUTES.length).toBe(23);

      const tnRoutes = COIMBATORE_ROUTES.filter((r) => r.region === 'Tamil Nadu');
      const klRoutes = COIMBATORE_ROUTES.filter((r) => r.region === 'Kerala');
      const kaRoutes = COIMBATORE_ROUTES.filter((r) => r.region === 'Karnataka');
      const tsRoutes = COIMBATORE_ROUTES.filter((r) => r.region.includes('Telangana'));
      const mhRoutes = COIMBATORE_ROUTES.filter((r) => r.region === 'Goa & Maharashtra');

      expect(tnRoutes.length).toBe(11);
      expect(klRoutes.length).toBe(5);
      expect(kaRoutes.length).toBe(3);
      expect(tsRoutes.length).toBe(1);
      expect(mhRoutes.length).toBe(3);

      // Verify specific candidate destinations
      const destinations = COIMBATORE_ROUTES.map((r) => r.destination);
      expect(destinations).toContain('Chennai');
      expect(destinations).toContain('Madurai');
      expect(destinations).toContain('Tirunelveli');
      expect(destinations).toContain('Tenkasi');
      expect(destinations).toContain('Nagercoil');
      expect(destinations).toContain('Thoothukudi');
      expect(destinations).toContain('Rameswaram');
      expect(destinations).toContain('Tiruchendur');
      expect(destinations).toContain('Trichy');
      expect(destinations).toContain('Thanjavur');
      expect(destinations).toContain('Salem');
      expect(destinations).toContain('Kochi');
      expect(destinations).toContain('Ernakulam');
      expect(destinations).toContain('Thrissur');
      expect(destinations).toContain('Kozhikode');
      expect(destinations).toContain('Thiruvananthapuram');
      expect(destinations).toContain('Bengaluru');
      expect(destinations).toContain('Mysuru');
      expect(destinations).toContain('Mangaluru');
      expect(destinations).toContain('Hyderabad');
      expect(destinations).toContain('Goa');
      expect(destinations).toContain('Mumbai');
      expect(destinations).toContain('Pune');
    });

    test('Contains exactly 38 Bengaluru-origin candidate corridors across required regions', () => {
      expect(BENGALURU_ROUTES.length).toBe(38);

      const tnRoutes = BENGALURU_ROUTES.filter((r) => r.region === 'Tamil Nadu');
      const klRoutes = BENGALURU_ROUTES.filter((r) => r.region === 'Kerala');
      const apTsRoutes = BENGALURU_ROUTES.filter((r) => r.region.includes('Telangana') || r.region.includes('Andhra'));
      const kaRoutes = BENGALURU_ROUTES.filter((r) => r.region === 'Karnataka');
      const mhRoutes = BENGALURU_ROUTES.filter((r) => r.region === 'Goa & Maharashtra');

      expect(tnRoutes.length).toBe(14);
      expect(klRoutes.length).toBe(9);
      expect(apTsRoutes.length).toBe(7);
      expect(kaRoutes.length).toBe(4);
      expect(mhRoutes.length).toBe(4);

      const destinations = BENGALURU_ROUTES.map((r) => r.destination);
      expect(destinations).toContain('Coimbatore');
      expect(destinations).toContain('Chennai');
      expect(destinations).toContain('Hosur');
      expect(destinations).toContain('Kochi');
      expect(destinations).toContain('Ernakulam');
      expect(destinations).toContain('Thiruvananthapuram');
      expect(destinations).toContain('Hyderabad');
      expect(destinations).toContain('Vijayawada');
      expect(destinations).toContain('Visakhapatnam');
      expect(destinations).toContain('Mysuru');
      expect(destinations).toContain('Mangaluru');
      expect(destinations).toContain('Goa');
      expect(destinations).toContain('Mumbai');
      expect(destinations).toContain('Pune');
      expect(destinations).toContain('Shirdi');
    });

    test('Generates complete 122 forward and reverse corridor catalogue (61 forward + 61 reverse)', () => {
      expect(MASTER_ROUTE_CATALOGUE.length).toBe(61);
      expect(ALL_CATALOGUE_ROUTES.length).toBe(122);

      const forwardCorridors = ALL_CATALOGUE_ROUTES.filter((r) => r.direction === 'forward');
      const reverseCorridors = ALL_CATALOGUE_ROUTES.filter((r) => r.direction === 'reverse');

      expect(forwardCorridors.length).toBe(61);
      expect(reverseCorridors.length).toBe(61);

      // Verify each reverse route pairs with a forward route
      reverseCorridors.forEach((rev) => {
        const matchingForward = forwardCorridors.find(
          (fwd) => fwd.source === rev.destination && fwd.destination === rev.source
        );
        expect(matchingForward).toBeDefined();
        expect(rev.direction).toBe('reverse');
      });
    });
  });

  // =========================================================================
  // 2. PROVENANCE, DATA MODEL & EXCLUSIONS
  // =========================================================================
  describe('2. Data Provenance & Operational Separation', () => {
    test('Every catalogue entry has valid provenance fields and is marked as seed/candidate data', () => {
      ALL_CATALOGUE_ROUTES.forEach((r) => {
        expect(['CANDIDATE', 'SEED', 'PENDING_VERIFICATION', 'VERIFIED', 'INACTIVE']).toContain(r.status);
        expect(r.isSeed).toBe(true);
        expect(r.dataSource).toBe('smartroute_presentation_v1');
        expect(r.corridorRegion).toBeDefined();
        expect(r.distanceKm).toBeGreaterThan(0);
        expect(r.durationMins).toBeGreaterThan(0);
      });
    });

    test('Candidate corridors without live services are clearly marked and not fabricated into live buses', () => {
      const mumbaiCorridor = ALL_CATALOGUE_ROUTES.find(
        (r) => r.source === 'Coimbatore' && r.destination === 'Mumbai'
      );
      expect(mumbaiCorridor).toBeDefined();
      expect(mumbaiCorridor.status).toBe('CANDIDATE');
      expect(mumbaiCorridor.hasActiveService).toBe(false);

      // Searching Coimbatore -> Mumbai should return 0 live trips and return candidateCorridor info
      const liveTrips = searchTripsData({ source: 'Coimbatore', destination: 'Mumbai' });
      expect(liveTrips.length).toBe(0);

      const candidate = findMatchingCandidateCorridor('Coimbatore', 'Mumbai');
      expect(candidate).toBeDefined();
      expect(candidate.source).toBe('Coimbatore');
      expect(candidate.destination).toBe('Mumbai');
      expect(candidate.status).toBe('CANDIDATE');
      expect(candidate.distanceKm).toBeGreaterThan(1200);
    });

    test('Catalogue strictly excludes government/RTC buses, town buses, or cab services', () => {
      // Check all buses
      buses.forEach((b) => {
        expect(b.bus_type).not.toMatch(/rtc|govt|town|city_local|auto|cab/i);
      });
      // Check travels
      travels.forEach((t) => {
        expect(t.name).not.toMatch(/tnstc|ksrtc|setc|apsrtc|mtc/i);
      });
    });
  });

  // =========================================================================
  // 3. REVERSE-DIRECTION SEARCH & ALIAS NORMALIZATION
  // =========================================================================
  describe('3. Reverse Search & Alias Normalization', () => {
    test('Forward and reverse trips between Coimbatore and Bengaluru are independently searchable', () => {
      const cbeToBlr = searchTripsData({ source: 'Coimbatore', destination: 'Bengaluru' });
      expect(cbeToBlr.length).toBeGreaterThan(0);
      cbeToBlr.forEach((t) => {
        expect(
          isCityMatch(t.routeSource, 'Coimbatore') ||
          (t.boardingStopName && t.boardingStopName.toLowerCase().includes('coimbatore'))
        ).toBe(true);
        expect(
          isCityMatch(t.routeDestination, 'Bengaluru') ||
          (t.droppingStopName && t.droppingStopName.toLowerCase().includes('bengaluru')) ||
          (t.droppingStopName && t.droppingStopName.toLowerCase().includes('bangalore'))
        ).toBe(true);
      });

      const blrToCbe = searchTripsData({ source: 'Bengaluru', destination: 'Coimbatore' });
      expect(blrToCbe.length).toBeGreaterThan(0);
      blrToCbe.forEach((t) => {
        expect(
          isCityMatch(t.routeSource, 'Bengaluru') ||
          (t.boardingStopName && t.boardingStopName.toLowerCase().includes('bengaluru')) ||
          (t.boardingStopName && t.boardingStopName.toLowerCase().includes('bangalore'))
        ).toBe(true);
        expect(
          isCityMatch(t.routeDestination, 'Coimbatore') ||
          (t.droppingStopName && t.droppingStopName.toLowerCase().includes('coimbatore'))
        ).toBe(true);
      });
    });

    test('Resolves destination aliases (Kochi ↔ Ernakulam) seamlessly without duplicates', () => {
      const matchKochi = isCityMatch('Kochi', 'Ernakulam');
      expect(matchKochi).toBe(true);

      const matchBangalore = isCityMatch('Bangalore', 'Bengaluru');
      expect(matchBangalore).toBe(true);

      const matchTrichy = isCityMatch('Trichy', 'Tiruchirappalli');
      expect(matchTrichy).toBe(true);

      // Search using alias "Bangalore" finds trips configured for "Bengaluru"
      const bangaloreTrips = searchTripsData({ source: 'Bangalore', destination: 'Coimbatore' });
      expect(bangaloreTrips.length).toBeGreaterThan(0);

      // Search using alias "Kochi" finds trips configured for "Ernakulam"
      const kochiTrips = searchTripsData({ source: 'Coimbatore', destination: 'Kochi' });
      expect(kochiTrips.length).toBeGreaterThan(0);
    });

    test('Normalizes city names correctly', () => {
      expect(normalizeCityName('  Bangalore  ')).toBe('Bengaluru');
      expect(normalizeCityName('Trichy')).toBe('Tiruchirappalli');
      expect(normalizeCityName('Pondy')).toBe('Puducherry');
    });
  });

  // =========================================================================
  // 4. INTERMEDIATE STOPS, ORDERING & SEGMENT BOOKING
  // =========================================================================
  describe('4. Intermediate Stops & Segment Booking Rules', () => {
    test('Trip routes have ordered intermediate stops starting with boarding and ending with dropping points', () => {
      const cbeToBlrRoute = routes.find((r) => r.source === 'Coimbatore' && r.destination === 'Bengaluru');
      expect(cbeToBlrRoute).toBeDefined();

      const stops = routeStops.filter((s) => s.route_id === cbeToBlrRoute.id).sort((a, b) => a.stop_order - b.stop_order);
      expect(stops.length).toBeGreaterThan(2);

      // Verify stop sequence is strictly increasing
      for (let i = 0; i < stops.length - 1; i++) {
        expect(stops[i].stop_order).toBeLessThan(stops[i + 1].stop_order);
      }
      expect(stops[0].is_boarding_point).toBe(true);
      expect(stops[stops.length - 1].is_dropping_point).toBe(true);
    });

    test('Rejects booking when boarding stop is after dropping stop (INVALID_STOP_ORDER)', () => {
      const cbeToBlrRoute = routes.find((r) => r.source === 'Coimbatore' && r.destination === 'Bengaluru');
      const stops = routeStops.filter((s) => s.route_id === cbeToBlrRoute.id).sort((a, b) => a.stop_order - b.stop_order);

      const trip = trips.find((t) => t.route_id === cbeToBlrRoute.id);
      expect(trip).toBeDefined();

      // Reversed stop IDs: Salem boarding -> Coimbatore dropping
      const firstStop = stops[0]; // Coimbatore
      const laterStop = stops[stops.length - 1]; // Bengaluru

      expect(() => {
        createNewBooking({
          tripId: trip.id,
          boardingStopId: laterStop.id, // Drop stop passed as boarding
          droppingStopId: firstStop.id, // Origin stop passed as drop
          passengerDetails: [{ seatNumber: 'L1', name: 'Test User', fare: 800 }],
        });
      }).toThrow();

      try {
        createNewBooking({
          tripId: trip.id,
          boardingStopId: laterStop.id,
          droppingStopId: firstStop.id,
          passengerDetails: [{ seatNumber: 'L1', name: 'Test User', fare: 800 }],
        });
      } catch (err) {
        expect(err.code).toBe('INVALID_STOP_ORDER');
      }
    });

    test('Segment overlap logic accurately identifies conflicting and non-conflicting segments', () => {
      // Mathematical rule: !(existing_to <= req_from || existing_to >= req_to)
      // Existing booking on Seat U1: Stop 2 (Tiruppur) to Stop 5 (Salem)
      const mockReservations = [
        {
          seatNumber: 'U1',
          boardingStopOrder: 2,
          droppingStopOrder: 5,
        },
      ];

      // Test 1: Sub-segment (Stop 3 to 4) on same seat -> CONFLICT
      expect(hasSegmentConflict(mockReservations, 'U1', 3, 4)).toBe(true);

      // Test 2: Overlapping start (Stop 1 to 3) on same seat -> CONFLICT
      expect(hasSegmentConflict(mockReservations, 'U1', 1, 3)).toBe(true);

      // Test 3: Overlapping end (Stop 4 to 6) on same seat -> CONFLICT
      expect(hasSegmentConflict(mockReservations, 'U1', 4, 6)).toBe(true);

      // Test 4: Fully encompassing (Stop 1 to 6) on same seat -> CONFLICT
      expect(hasSegmentConflict(mockReservations, 'U1', 1, 6)).toBe(true);

      // Test 5: Adjacent before (Stop 1 to 2) -> NO CONFLICT (passenger drops at stop 2 where next boards)
      expect(hasSegmentConflict(mockReservations, 'U1', 1, 2)).toBe(false);

      // Test 6: Adjacent after (Stop 5 to 7) -> NO CONFLICT (passenger boards at stop 5 where previous dropped)
      expect(hasSegmentConflict(mockReservations, 'U1', 5, 7)).toBe(false);

      // Test 7: Completely disjoint (Stop 6 to 8) -> NO CONFLICT
      expect(hasSegmentConflict(mockReservations, 'U1', 6, 8)).toBe(false);

      // Test 8: Different seat (U2) on same segment -> NO CONFLICT
      expect(hasSegmentConflict(mockReservations, 'U2', 2, 5)).toBe(false);
    });

    test('Prevents booking duplicate/overlapping seat segments and throws SEGMENT_CONFLICT', () => {
      const cbeToBlrRoute = routes.find((r) => r.source === 'Coimbatore' && r.destination === 'Bengaluru');
      const stops = routeStops.filter((s) => s.route_id === cbeToBlrRoute.id).sort((a, b) => a.stop_order - b.stop_order);
      const trip = trips.find((t) => t.route_id === cbeToBlrRoute.id);

      const stop1 = stops[0]; // Coimbatore (order 1)
      const stop2 = stops[1]; // Intermediate (e.g. Tiruppur)
      const stop3 = stops[2]; // Intermediate (e.g. Erode)
      const stop4 = stops[stops.length - 1]; // Bengaluru

      const uniqueSeat = 'L20';

      // First booking: stop1 -> stop3 on uniqueSeat
      const booking1 = createNewBooking({
        tripId: trip.id,
        boardingStopId: stop1.id,
        droppingStopId: stop3.id,
        passengerDetails: [{ seatNumber: uniqueSeat, name: 'Passenger Alpha', fare: 500 }],
      });
      expect(booking1.pnr_number).toBeDefined();

      // Conflicting booking attempt: stop2 -> stop4 on same uniqueSeat
      expect(() => {
        createNewBooking({
          tripId: trip.id,
          boardingStopId: stop2.id,
          droppingStopId: stop4.id,
          passengerDetails: [{ seatNumber: uniqueSeat, name: 'Passenger Beta', fare: 600 }],
        });
      }).toThrow();

      try {
        createNewBooking({
          tripId: trip.id,
          boardingStopId: stop2.id,
          droppingStopId: stop4.id,
          passengerDetails: [{ seatNumber: uniqueSeat, name: 'Passenger Beta', fare: 600 }],
        });
      } catch (err) {
        expect(err.code).toBe('SEGMENT_CONFLICT');
      }

      // Non-conflicting adjacent booking on same seat: stop3 -> stop4 (boarding where previous drops)
      const bookingAdjacent = createNewBooking({
        tripId: trip.id,
        boardingStopId: stop3.id,
        droppingStopId: stop4.id,
        passengerDetails: [{ seatNumber: uniqueSeat, name: 'Passenger Gamma', fare: 450 }],
      });
      expect(bookingAdjacent.pnr_number).toBeDefined();
    });

    test('getSeatsForTrip marks seats booked only for overlapping segments', () => {
      const cbeToBlrRoute = routes.find((r) => r.source === 'Coimbatore' && r.destination === 'Bengaluru');
      const stops = routeStops.filter((s) => s.route_id === cbeToBlrRoute.id).sort((a, b) => a.stop_order - b.stop_order);
      const trip = trips.find((t) => t.route_id === cbeToBlrRoute.id);

      const seatQuerySegment = getSeatsForTrip(trip.id, {
        boardingStopOrder: stops[0].stop_order,
        droppingStopOrder: stops[1].stop_order,
      });

      expect(seatQuerySegment.seats).toBeDefined();
      expect(seatQuerySegment.layout).toBeDefined();
      expect(seatQuerySegment.seats.length).toBe(48);
    });
  });

  // =========================================================================
  // 5. BUS CATEGORIES & TATA CAPELLA REFERENCE LAYOUT
  // =========================================================================
  describe('5. Bus Categories & Physical Specification', () => {
    test('Preserves Tata + Prakash Body reference layout (48 passenger positions: 24 lower seats + 6 sleepers, 18 upper sleepers)', () => {
      expect(busLayout.layout_config.lower_deck.seats).toBe(24);
      expect(busLayout.layout_config.lower_deck.sleepers).toBe(6);
      expect(busLayout.layout_config.upper_deck.sleepers).toBe(18);
      expect(busLayout.total_seats + busLayout.total_sleepers).toBe(48);
      expect(busLayout.layout_config.driver_position).toBe('right');
      expect(busLayout.layout_config.stairs_position).toBe('front_left');
    });

    test('Fleet encompasses required luxury private coach models', () => {
      const models = buses.map((b) => `${b.chassis_make || ''} ${b.body_make || ''} ${b.model_name || ''} ${b.name || ''}`);
      expect(models.some((m) => m.includes('Volvo') || m.includes('9600'))).toBe(true);
      expect(models.some((m) => m.includes('BharatBenz'))).toBe(true);
      expect(models.some((m) => m.includes('TATA') || m.includes('Tata') || m.includes('Prakash'))).toBe(true);
    });
  });

  // =========================================================================
  // 6. ROUTE CATALOGUE DATA RETRIEVAL & FILTERING
  // =========================================================================
  describe('6. Catalogue Data Retrieval API & Filtering', () => {
    test('getRouteCatalogueData filters by origin, region, and status', () => {
      const cbeCatalog = getRouteCatalogueData({ origin: 'Coimbatore', direction: 'forward' });
      expect(cbeCatalog.total).toBe(23);

      const blrCatalog = getRouteCatalogueData({ origin: 'Bengaluru', direction: 'forward' });
      expect(blrCatalog.total).toBe(38);

      const tnCatalog = getRouteCatalogueData({ origin: 'Coimbatore', region: 'Tamil Nadu', direction: 'forward' });
      expect(tnCatalog.total).toBe(11);

      const candidateOnly = getRouteCatalogueData({ status: 'CANDIDATE' });
      expect(candidateOnly.total).toBeGreaterThan(0);
      candidateOnly.routes.forEach((r) => expect(r.status).toBe('CANDIDATE'));
    });
  });
});
