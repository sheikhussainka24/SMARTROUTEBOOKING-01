import {
  OPERATIONAL_CARAVAN_ROUTES,
  ROUTE_CATEGORIES,
  getRouteCount,
} from '../../FRONTEND/src/data/routesData.js';

describe('SMART ROUTE — Bus Trailer Caravan & Route Catalogue Tests', () => {
  test('Total caravan routes count must be 71 operational routes', () => {
    expect(OPERATIONAL_CARAVAN_ROUTES.length).toBe(71);
  });

  test('Lead route must be Coimbatore ⇄ Tenkasi in Tamil Nadu category with proper metadata', () => {
    const leadRoute = OPERATIONAL_CARAVAN_ROUTES.find(
      (r) => (r.from === 'Coimbatore' && r.to === 'Tenkasi') || r.id === 'route_cbe_tks'
    );
    expect(leadRoute).toBeDefined();
    expect(leadRoute.from).toBe('Coimbatore');
    expect(leadRoute.to).toBe('Tenkasi');
    expect(leadRoute.isTwoWay).toBe(true);
    expect(leadRoute.stateBadge).toBe('TN');
    expect(leadRoute.distance).toBe('320 km');
    expect(leadRoute.category).toBe('tamilnadu');
    expect(leadRoute.badge === 'TN Lead Corridor' || leadRoute.badgeText === 'TN Lead Corridor').toBe(true);
  });

  test('Coimbatore ⇄ Karaikudi corridor is present in Tamil Nadu caravan list with required metadata', () => {
    const route = OPERATIONAL_CARAVAN_ROUTES.find(
      (r) => r.from === 'Coimbatore' && r.to === 'Karaikudi'
    );
    expect(route).toBeDefined();
    expect(route.category === 'tamilnadu' || route.category === 'tn').toBe(true);
    expect(route.stateBadge).toBe('TN');
    expect(route.distance).toBe('265 km');
    expect(route.duration).toBe('6h 15m');
    expect(route.frequency).toBe('Daily • 3+ Buses');
    expect(route.searchFrom).toBe('Coimbatore');
    expect(route.searchTo).toBe('Karaikudi');
  });

  test('Route categories counts match the specifications', () => {
    const master = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'master');
    const tn = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'tamilnadu' || r.category === 'tn');
    const ka = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'karnataka' || r.category === 'ka');
    const kl = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'kerala' || r.category === 'kl');
    const apTs = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'andhra_telangana' || r.category === 'ap_ts');
    const west = OPERATIONAL_CARAVAN_ROUTES.filter((r) => r.category === 'pan_india' || r.category === 'west');

    expect(master.length).toBe(0);
    expect(tn.length).toBe(22);
    expect(ka.length).toBe(20);
    expect(kl.length).toBe(13);
    expect(apTs.length).toBe(9);
    expect(west.length).toBe(7);

    // Sum matches 71
    expect(tn.length + ka.length + kl.length + apTs.length + west.length).toBe(71);
  });

  test('Coimbatore ⇄ Tenkasi is lead card at index 0 under Tamil Nadu category', () => {
    const tnRoutes = OPERATIONAL_CARAVAN_ROUTES.filter(
      (r) => r.category === 'tamilnadu' || r.category === 'tn'
    );
    expect(tnRoutes[0].from).toBe('Coimbatore');
    expect(tnRoutes[0].to).toBe('Tenkasi');
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

  test('Categories definition contains all expected tab definitions without Master Route', () => {
    expect(ROUTE_CATEGORIES.length).toBe(6);
    const catIds = ROUTE_CATEGORIES.map((c) => c.id);
    expect(catIds).toEqual(['all', 'tamilnadu', 'karnataka', 'kerala', 'andhra_telangana', 'pan_india']);
    expect(catIds).not.toContain('master');

    const tnCat = ROUTE_CATEGORIES.find((c) => c.id === 'tamilnadu');
    expect(tnCat.count).toBe(22);
  });

  test('getRouteCount correctly returns dynamic count for each category', () => {
    expect(getRouteCount('all')).toBe(71);
    expect(getRouteCount('tamilnadu')).toBe(22);
    expect(getRouteCount('karnataka')).toBe(20);
    expect(getRouteCount('kerala')).toBe(13);
    expect(getRouteCount('andhra_telangana')).toBe(9);
    expect(getRouteCount('pan_india')).toBe(7);
  });
});
