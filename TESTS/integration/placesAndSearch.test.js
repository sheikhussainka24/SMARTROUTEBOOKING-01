import { searchPlacesIndex, getPlaceById, searchTripsData, buses, routes, travels, routeStops, busLayout } from '../../BACKEND/src/services/dataStore.js';
import { autocompletePlaces } from '../../BACKEND/src/controllers/placeController.js';

describe('Places Autocomplete & Carrier Network Tests', () => {
  test('Autocomplete matches South Indian cities and transit hubs when typing "C", "Co", "Coim"', () => {
    const singleLetterMatches = searchPlacesIndex('C');
    expect(singleLetterMatches.length).toBeGreaterThan(0);
    expect(singleLetterMatches.some((p) => p.city === 'Coimbatore' || p.mainText.includes('Chennai'))).toBe(true);

    const coMatches = searchPlacesIndex('Co');
    expect(coMatches.some((p) => p.city === 'Coimbatore')).toBe(true);

    const coimMatches = searchPlacesIndex('Coim');
    expect(coimMatches.length).toBeGreaterThan(0);
    expect(coimMatches.some((p) => p.mainText === 'Coimbatore')).toBe(true);
    expect(coimMatches.some((p) => p.mainText.includes('Omni Bus Stand'))).toBe(true);
    expect(coimMatches.some((p) => p.mainText.includes('International Airport'))).toBe(true);
  });

  test('Autocomplete matches Tenkasi and its bus terminals when typing "Ten"', () => {
    const tenMatches = searchPlacesIndex('Ten');
    expect(tenMatches.length).toBeGreaterThan(0);
    expect(tenMatches.some((p) => p.mainText === 'Tenkasi')).toBe(true);
    expect(tenMatches.some((p) => p.mainText.includes('New Bus Stand'))).toBe(true);
    expect(tenMatches.some((p) => p.mainText.includes('Old Bus Stand'))).toBe(true);
  });

  test('Primary travel operators exist prominently in the carrier network', () => {
    const travelNames = travels.map((t) => t.name);
    expect(travelNames).toContain('SMART ROUTE Travels');
    expect(travelNames).toContain('VEE VEE Travels');
    expect(travelNames).toContain('TRANZKING Travels');
  });

  test('Coimbatore ➔ Tenkasi route contains configured 16 stops', () => {
    const cbeToTksRoute = routes.find((r) => r.source === 'Coimbatore' && r.destination === 'Tenkasi');
    expect(cbeToTksRoute).toBeDefined();
    const stops = routeStops.filter((s) => s.route_id === cbeToTksRoute.id);
    expect(stops.length).toBe(16);
    expect(stops[0].city).toBe('Coimbatore');
    expect(stops[stops.length - 1].city).toBe('Tenkasi');
  });

  test('Trip search returns active trips featuring primary carriers with physical bus specifications', () => {
    const cbeTksTrips = searchTripsData({ source: 'Coimbatore', destination: 'Tenkasi' });
    expect(cbeTksTrips.length).toBeGreaterThan(0);

    const operators = cbeTksTrips.map((t) => t.travelName);
    expect(operators).toContain('SMART ROUTE Travels');
    expect(operators).toContain('VEE VEE Travels');

    // Verify physical bus specification from the layout
    const sampleTrip = cbeTksTrips.find((t) => t.travelName === 'SMART ROUTE Travels');
    expect(sampleTrip.bus_type).toMatch(/ac_seat/);
    expect(sampleTrip.configuration).toBe('2+1');

    // Verify layout specification (TATA chassis, right-side driver, left-side entrance)
    expect(busLayout.layout_config.chassis).toContain('TATA');
    expect(busLayout.layout_config.driver_position).toBe('right');
    expect(busLayout.layout_config.stairs_position).toBe('front_left');
  });

  test('Place controller autocomplete returns structured predictions', async () => {
    const req = { query: { input: 'Coim' } };
    let jsonResult = null;
    const res = {
      json: (data) => {
        jsonResult = data;
        return res;
      },
      status: () => res,
    };

    await autocompletePlaces(req, res);
    expect(jsonResult).toBeDefined();
    expect(jsonResult.success).toBe(true);
    expect(jsonResult.predictions.length).toBeGreaterThan(0);
    expect(jsonResult.predictions[0].mainText).toBe('Coimbatore');
  });
});
