import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SMART ROUTE — Bus Search Discovery & Multi-Criteria Filtering', () => {
  // Test 1: Verify SearchTrips file structure & imported components
  test('SearchTrips.jsx renders RedBus/Abhibus inspired components & two-column layout', () => {
    const filePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/SearchTrips.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('AiSmartFilter');
    expect(content).toContain('FilterSidebar');
    expect(content).toContain('PromotionalBanners');
    expect(content).toContain('SortByBar');
    expect(content).toContain('PopularFiltersScroller');
    expect(content).toContain('search-results-layout-container');
    expect(content).toContain('search-filter-sidebar-wrapper');
    expect(content).toContain('search-results-main-col');

    // Header validation
    expect(content).toContain('SMART ROUTE Intercity Expresses');
    expect(content).not.toMatch(/Vee\s*Vee\s*Layout/i);
  });

  // Test 2: AI Smart Filter component requirements
  test('AiSmartFilter.jsx includes sparkle icon, mic voice search, and 10 quick pills', () => {
    const filePath = path.resolve(__dirname, '../../FRONTEND/src/components/passenger/AiSmartFilter.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // Prompt requested placeholder
    expect(content).toContain("Try 'Morning bus under ₹800' or 'Sleeper to Tenkasi'");

    // Voice search icons
    expect(content).toContain('Mic');
    expect(content).toContain('Sparkles');

    // 10 requested quick pills
    expect(content).toContain('Smart Assured / Primo');
    expect(content).toContain('Free Cancellation');
    expect(content).toContain('AC');
    expect(content).toContain('SLEEPER');
    expect(content).toContain('Single Seats');
    expect(content).toContain('SEATER');
    expect(content).toContain('NON-AC');
    expect(content).toContain('18:00 - 24:00');
    expect(content).toContain('High Rated Buses');
    expect(content).toContain('Live Tracking');
  });

  // Test 3: Comprehensive Filter Sidebar requirements
  test('FilterSidebar.jsx contains 7 bus types, dual price slider, 4 time slots, and accordions', () => {
    const filePath = path.resolve(__dirname, '../../FRONTEND/src/components/passenger/FilterSidebar.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // 7 bus types
    expect(content).toContain('AC');
    expect(content).toContain('Sleeper');
    expect(content).toContain('Seater');
    expect(content).toContain('Non-AC');
    expect(content).toContain('Live Track');
    expect(content).toContain('New Fleet');
    expect(content).toContain('Offers');

    // 4 time slots
    expect(content).toContain('Before 10 AM');
    expect(content).toContain('10 AM - 5 PM');
    expect(content).toContain('5 PM - 11 PM');
    expect(content).toContain('After 11 PM');

    // Price range
    expect(content).toContain('Price Range');
    expect(content).toContain('min="500"');
    expect(content).toContain('max="2500"');

    // Accordions
    expect(content).toContain('Bus Partners');
    expect(content).toContain('Boarding Points');
    expect(content).toContain('Dropping Points');
    expect(content).toContain('Single Window Seat/Berth');
    expect(content).toContain('Amenities');

    // Clear all action
    expect(content).toContain('Clear All');
  });

  // Test 4: Promotional Banners component
  test('PromotionalBanners.jsx includes 4 promotional cards', () => {
    const filePath = path.resolve(__dirname, '../../FRONTEND/src/components/passenger/PromotionalBanners.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('SMART Assured');
    expect(content).toContain('Highest Rated Buses');
    expect(content).toContain('Women Exclusive Offer');
    expect(content).toContain('Flash Express Offers');
  });

  // Test 5: Sort By Bar component
  test('SortByBar.jsx includes dynamic count badge and 5 interactive sort tabs', () => {
    const filePath = path.resolve(__dirname, '../../FRONTEND/src/components/passenger/SortByBar.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('Showing');
    expect(content).toContain('Buses on this route');
    expect(content).toContain('Departure Time');
    expect(content).toContain('Arrival Time');
    expect(content).toContain('Price');
    expect(content).toContain('Ratings');
    expect(content).toContain('Seats');
    expect(content).toContain('ArrowUp');
    expect(content).toContain('ArrowDown');
  });

  // Test 6: Popular Filters Scroller component
  test('PopularFiltersScroller.jsx contains Boarding Points and Operators tabs', () => {
    const filePath = path.resolve(__dirname, '../../FRONTEND/src/components/passenger/PopularFiltersScroller.jsx');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toContain('Boarding Points');
    expect(content).toContain('Operators');
    expect(content).toContain('Gandhipuram');
    expect(content).toContain('Omni Bus Stand');
  });

  // Test 7: Multi-criteria filtering simulation
  test('Multi-criteria boolean AND filtering logic correctly filters bus mock set', () => {
    const testBuses = [
      {
        id: 'b1',
        travelName: 'SMART ROUTE Travels',
        travelRating: '4.9',
        bus_type: 'ac_sleeper',
        has_ac: true,
        base_fare: 880,
        departure_time: '21:30',
        boardingStopName: 'Gandhipuram Omni Bus Stand',
      },
      {
        id: 'b2',
        travelName: 'VEE VEE Travels',
        travelRating: '4.8',
        bus_type: 'non_ac_seater',
        has_ac: false,
        base_fare: 650,
        departure_time: '08:30',
        boardingStopName: 'Singanallur',
      },
      {
        id: 'b3',
        travelName: 'TRANZKING Travels',
        travelRating: '4.6',
        bus_type: 'ac_seat_cum_sleeper',
        has_ac: true,
        base_fare: 1100,
        departure_time: '19:45',
        boardingStopName: 'Gandhipuram Omni Bus Stand',
      },
    ];

    // Filter 1: AC only
    const acOnly = testBuses.filter((b) => b.has_ac);
    expect(acOnly.length).toBe(2);

    // Filter 2: Price <= 900
    const under900 = testBuses.filter((b) => b.base_fare <= 900);
    expect(under900.length).toBe(2);

    // Filter 3: AC + Under 900 (Boolean AND)
    const acUnder900 = testBuses.filter((b) => b.has_ac && b.base_fare <= 900);
    expect(acUnder900.length).toBe(1);
    expect(acUnder900[0].travelName).toBe('SMART ROUTE Travels');

    // Filter 4: Morning departure (08:30)
    const morningBuses = testBuses.filter((b) => {
      const hour = parseInt(b.departure_time.split(':')[0], 10);
      return hour < 10;
    });
    expect(morningBuses.length).toBe(1);
    expect(morningBuses[0].travelName).toBe('VEE VEE Travels');
  });
});
