import {
  OPERATIONAL_CARAVAN_ROUTES,
  ROUTE_CATEGORIES,
} from '../../FRONTEND/src/data/routesData.js';

describe('SMART ROUTE — Bus Trailer Caravan & Route Catalogue Tests', () => {
  test('Total caravan routes count must be 71 operational routes', () => {
    expect(OPERATIONAL_CARAVAN_ROUTES.length).toBe(71);
  });

  test('Master sample route must be Coimbatore ⇄ Tenkasi with proper metadata', () => {
    const masterRoute = OPERATIONAL_CARAVAN_ROUTES.find((r) => r.isMaster);
    expect(masterRoute).toBeDefined();
    expect(masterRoute.from).toBe('Coimbatore');
    expect(masterRoute.to).toBe('Tenkasi');
    expect(masterRoute.isTwoWay).toBe(true);
    expect(masterRoute.stateBadge).toBe('TN');
    expect(masterRoute.distance).toBe('320 km');
    expect(masterRoute.category).toBe('master');
  });

  test('Coimbatore ⇄ Karaikudi corridor is present in Tamil Nadu caravan list with required metadata', () => {
    const route = OPERATIONAL_CARAVAN_ROUTES.find(
      (r) => r.from === 'Coimbatore' && r.to === 'Karaikudi'
    );
    expect(route).toBeDefined();
    expect(route.category).toBe('tn');
    expect(route.stateBadge).toBe('TN');
    expect(route.distance).toBe('265 km');
    expect(route.duration).toBe('6h 15m');
    expect(route.frequency).toBe('Daily • 3+ Buses');
    expect(route.searchFrom).toBe('Coimbatore');
    expect(route.searchTo).toBe('Karaikudi');
  });

  test('Route categories counts match the specifications', () => {
    const master = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'master');
    const tn = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'tn');
    const ka = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'ka');
    const kl = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'kl');
    const apTs = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'ap_ts');
    const west = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'west');

    expect(master.length).toBe(1);
    expect(tn.length).toBe(21);
    expect(ka.length).toBe(20);
    expect(kl.length).toBe(13);
    expect(apTs.length).toBe(9);
    expect(west.length).toBe(7);

    // Sum matches 71
    expect(master.length + tn.length + ka.length + kl.length + apTs.length + west.length).toBe(71);
  });

  test('All routes have valid non-empty fields for search and display', () => {
    OPERATIONAL_CARAVAN_ROUTES.forEach((route) => {
      expect(route.id).toBeTruthy();
      expect(route.from).toBeTruthy();
      expect(route.to).toBeTruthy();
      expect(route.searchFrom).toBeTruthy();
      expect(route.searchTo).toBeTruthy();
      expect(route.stateBadge).toBeTruthy();
      expect(route.distance).toMatch(/\d+\s*km/i);
      expect(route.duration).toBeTruthy();
      expect(typeof route.isTwoWay).toBe('boolean');
    });
  });

  test('Kerala routes normalize destination for search query', () => {
    const kochiRoute = OPERATIONAL_CARAVAN_ROUTES.find(
      (r) => r.from === 'Coimbatore' && r.to.includes('Kochi')
    );
    expect(kochiRoute).toBeDefined();
    expect(kochiRoute.searchTo).toBe('Kochi');
    expect(kochiRoute.to).toBe('Kochi / Ernakulam');
  });

  test('Categories definition contains all expected tab definitions', () => {
    expect(ROUTE_CATEGORIES.length).toBe(7);
    const catIds = ROUTE_CATEGORIES.map((c) => c.id);
    expect(catIds).toEqual(['all', 'master', 'tn', 'ka', 'kl', 'ap_ts', 'west']);
  });
});
