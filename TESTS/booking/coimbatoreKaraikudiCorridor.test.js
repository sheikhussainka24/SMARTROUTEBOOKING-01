import { describe, test, expect } from '@jest/globals';
import {
  routes,
  routeStops,
  trips,
  buses,
  searchTripsData,
  getSeatsForTrip,
  routeKkdiId,
  busRoyalSleeperId,
  busExecSeaterSleeperId,
  busNightGliderId,
} from '../../BACKEND/src/services/dataStore.js';
import {
  OPERATIONAL_CARAVAN_ROUTES,
  ROUTE_CATEGORIES,
} from '../../FRONTEND/src/data/routesData.js';
import { seed } from '../../DATABASE/seeds/001_development_data.js';

describe('SMART ROUTE — Coimbatore ⇄ Karaikudi Corridor End-to-End Suite', () => {
  // =========================================================================
  // 1. DATABASE & DATA STORE SEED INTEGRITY
  // =========================================================================
  describe('1. Route Corridor Definition & Route Stops', () => {
    test('Route exists with code route_cbe_kkdi_01 and exact metadata', () => {
      const kkdiRoute = routes.find((r) => r.code === 'route_cbe_kkdi_01' || r.id === routeKkdiId);
      expect(kkdiRoute).toBeDefined();
      expect(kkdiRoute.source).toBe('Coimbatore');
      expect(kkdiRoute.destination).toBe('Karaikudi');
      expect(kkdiRoute.distance_km).toBe(265);
      expect(kkdiRoute.estimated_duration_minutes).toBe(375); // 6h 15m
      expect(kkdiRoute.corridor_region).toBe('Tamil Nadu');
      expect(kkdiRoute.is_active).toBe(true);
    });

    test('Includes all 5 designated boarding points and 3 dropping points in proper sequence', () => {
      const stops = routeStops
        .filter((s) => s.route_id === routeKkdiId)
        .sort((a, b) => a.stop_order - b.stop_order);

      expect(stops.length).toBe(8);

      // 5 Boarding Points
      const boardingStops = stops.filter((s) => s.is_boarding_point);
      expect(boardingStops.length).toBe(5);
      expect(boardingStops.map((s) => s.name)).toEqual([
        'Gandhipuram Omni Bus Stand',
        'Lakshmi Mills',
        'Singanallur',
        'Sulur',
        'Palladam',
      ]);

      // 3 Dropping Points
      const droppingStops = stops.filter((s) => s.is_dropping_point);
      expect(droppingStops.length).toBe(3);
      expect(droppingStops.map((s) => s.name)).toEqual([
        'Pudukkottai Bypass',
        'Alagappa University',
        'Karaikudi New Bus Stand',
      ]);

      // Terminal points check
      expect(stops[0].name).toBe('Gandhipuram Omni Bus Stand');
      expect(stops[stops.length - 1].name).toBe('Karaikudi New Bus Stand');
      expect(stops[stops.length - 1].distance_from_start_km).toBe(265);
    });
  });

  // =========================================================================
  // 2. FLEET SCHEDULES & BUS CONFIGURATIONS
  // =========================================================================
  describe('2. Three Distinct Fleet Schedules', () => {
    test('Configures Bus 1: SMART ROUTE Royal Sleeper (Volvo 9600 A/C Sleeper)', () => {
      const bus = buses.find((b) => b.id === busRoyalSleeperId);
      expect(bus).toBeDefined();
      expect(bus.name).toBe('SMART ROUTE Royal Sleeper');
      expect(bus.chassis_make).toBe('Volvo');
      expect(bus.body_make).toBe('Volvo 9600');
      expect(bus.bus_type).toBe('ac_sleeper');
      expect(bus.total_sleepers).toBe(36);
      expect(bus.features).toEqual(expect.arrayContaining(['Live Radar GPS', 'UV AC', 'USB-C Charging', 'Blanket']));
    });

    test('Configures Bus 2: SMART ROUTE Executive Seater/Sleeper (Tata Capella 48 layout)', () => {
      const bus = buses.find((b) => b.id === busExecSeaterSleeperId);
      expect(bus).toBeDefined();
      expect(bus.name).toBe('SMART ROUTE Executive Seater/Sleeper');
      expect(bus.chassis_make).toBe('TATA');
      expect(bus.body_make).toBe('Prakash');
      expect(bus.bus_type).toBe('ac_seat_cum_sleeper');
      expect(bus.total_seats).toBe(24);
      expect(bus.total_sleepers).toBe(24);
      expect(bus.features).toEqual(expect.arrayContaining(['Pushback Seater', 'Charging Port', 'Reading Light']));
    });

    test('Configures Bus 3: SMART ROUTE Night Glider (BharatBenz A/C Sleeper)', () => {
      const bus = buses.find((b) => b.id === busNightGliderId);
      expect(bus).toBeDefined();
      expect(bus.name).toBe('SMART ROUTE Night Glider');
      expect(bus.chassis_make).toBe('BharatBenz');
      expect(bus.bus_type).toBe('ac_sleeper');
      expect(bus.features).toEqual(expect.arrayContaining(['Live Tracking', 'Climate Controlled AC']));
    });
  });

  // =========================================================================
  // 3. CARAVAN SCROLLER INTEGRATION
  // =========================================================================
  describe('3. Our Routes Moving Caravan Card', () => {
    test('Caravan trailer list includes Coimbatore ⇄ Karaikudi card under Tamil Nadu filter', () => {
      const card = OPERATIONAL_CARAVAN_ROUTES.find(
        (r) => r.from === 'Coimbatore' && r.to === 'Karaikudi'
      );
      expect(card).toBeDefined();
      expect(card.category).toBe('tn');
      expect(card.stateBadge).toBe('TN');
      expect(card.distance).toBe('265 km');
      expect(card.frequency).toBe('Daily • 3+ Buses');
      expect(card.searchFrom).toBe('Coimbatore');
      expect(card.searchTo).toBe('Karaikudi');
    });

    test('Category counts correctly reflect Tamil Nadu count and All count', () => {
      const tnCategory = ROUTE_CATEGORIES.find((c) => c.id === 'tn');
      const allCategory = ROUTE_CATEGORIES.find((c) => c.id === 'all');
      expect(tnCategory.count).toBe(21);
      expect(allCategory.count).toBe(71);
    });
  });

  // =========================================================================
  // 4. SEARCH RESULTS FEED & INTERACTIVE 48-SEAT LAYOUT
  // =========================================================================
  describe('4. Search Results Query & Accordion Seat Layout', () => {
    test('Searching Coimbatore to Karaikudi returns all 3 configured buses for any active date', () => {
      const today = new Date().toISOString().split('T')[0];
      const results = searchTripsData({
        source: 'Coimbatore',
        destination: 'Karaikudi',
        date: today,
      });

      expect(results.length).toBe(3);

      const busNames = results.map((r) => r.busName);
      expect(busNames).toContain('SMART ROUTE Royal Sleeper');
      expect(busNames).toContain('SMART ROUTE Executive Seater/Sleeper');
      expect(busNames).toContain('SMART ROUTE Night Glider');

      // Check Bus 1 schedule details
      const b1 = results.find((r) => r.busName === 'SMART ROUTE Royal Sleeper');
      expect(b1.departure_time).toBe('22:30');
      expect(b1.estimated_arrival_time).toBe('04:45');
      expect(b1.base_fare).toBe(850);
      expect(b1.has_live_tracking).toBe(true);
      expect(b1.estimated_duration_minutes).toBe(375);

      // Check Bus 2 schedule details
      const b2 = results.find((r) => r.busName === 'SMART ROUTE Executive Seater/Sleeper');
      expect(b2.departure_time).toBe('14:00');
      expect(b2.estimated_arrival_time).toBe('20:30');
      expect(b2.base_fare).toBe(550);
      expect(b2.has_live_tracking).toBe(true);

      // Check Bus 3 schedule details
      const b3 = results.find((r) => r.busName === 'SMART ROUTE Night Glider');
      expect(b3.departure_time).toBe('23:15');
      expect(b3.estimated_arrival_time).toBe('05:30');
      expect(b3.base_fare).toBe(820);
      expect(b3.has_live_tracking).toBe(true);
    });

    test('Opening "View Seats" renders the authentic 48-seat Tata Capella layout with lower & upper decks', () => {
      const results = searchTripsData({
        source: 'Coimbatore',
        destination: 'Karaikudi',
      });
      expect(results.length).toBeGreaterThan(0);

      const tripId = results[0].tripId;
      const { layout, seats } = getSeatsForTrip(tripId);

      expect(layout).toBeDefined();
      expect(layout.name).toContain('TATA Capella');
      expect(seats.length).toBe(48);

      const lowerDeck = seats.filter((s) => s.deck === 'lower');
      const upperDeck = seats.filter((s) => s.deck === 'upper');
      expect(lowerDeck.length).toBe(30); // 24 seats + 6 sleeper berths
      expect(upperDeck.length).toBe(18); // 18 sleeper berths
    });
  });

  // =========================================================================
  // 5. DATABASE SEED MODULE EXPORT INTEGRITY
  // =========================================================================
  describe('5. Seed Module Clean Functionality', () => {
    test('seed module exports an asynchronous seed function', () => {
      expect(typeof seed).toBe('function');
    });
  });
});
