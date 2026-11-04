import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAdminBuses,
  createAdminBus,
} from '../../BACKEND/src/controllers/adminController.js';
import {
  createCompanyBus,
  getCompanyBuses,
} from '../../BACKEND/src/controllers/operatorController.js';
import {
  buses,
  travels,
  smartRouteTravelId,
} from '../../BACKEND/src/services/dataStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function mockReqRes(options = {}) {
  const {
    body = {},
    params = {},
    query = {},
    user = null,
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
    getStatusCode: () => statusCode,
    getData: () => responseData,
  };

  return { req, res };
}

describe('SMART ROUTE — Fleet Management & "+ Add Bus" Workflow', () => {
  const wizardPath = path.resolve(__dirname, '../../FRONTEND/src/pages/admin/AddBusWizard.jsx');
  const fleetDashPath = path.resolve(__dirname, '../../FRONTEND/src/pages/admin/AdminFleetDashboard.jsx');
  const ownerDashPath = path.resolve(__dirname, '../../FRONTEND/src/pages/owner/OwnerDashboard.jsx');
  const adminDashPath = path.resolve(__dirname, '../../FRONTEND/src/pages/superadmin/AdminDashboard.jsx');
  const routesPath = path.resolve(__dirname, '../../FRONTEND/src/routes/index.jsx');

  const wizardContent = fs.readFileSync(wizardPath, 'utf8');
  const fleetDashContent = fs.readFileSync(fleetDashPath, 'utf8');
  const ownerDashContent = fs.readFileSync(ownerDashPath, 'utf8');
  const adminDashContent = fs.readFileSync(adminDashPath, 'utf8');
  const routesContent = fs.readFileSync(routesPath, 'utf8');

  // ==================== SECTION 1: ENTRY POINT & CTA BUTTON ====================
  test('Admin Fleet Dashboard & Portals feature high-visibility Rose Pink "+ Add Bus" CTA button', () => {
    // Exact button styling requested in prompt:
    const expectedStyle = 'bg-[#C13D78] hover:bg-[#A82B63] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2';

    // 1. Admin Fleet Dashboard
    expect(fleetDashContent).toContain(expectedStyle);
    expect(fleetDashContent).toContain('+ Add Bus');
    expect(fleetDashContent).toContain('/admin/buses/create');

    // 2. Owner Dashboard Fleet tab
    expect(ownerDashContent).toContain(expectedStyle);
    expect(ownerDashContent).toContain('+ Add Bus');
    expect(ownerDashContent).toContain('/admin/buses/create');

    // 3. Admin Dashboard Platform Oversight
    expect(adminDashContent).toContain(expectedStyle);
    expect(adminDashContent).toContain('+ Add Bus');
    expect(adminDashContent).toContain('/admin/buses/create');
  });

  test('Routes definition links /admin/buses/create, /admin/fleet, and /admin/buses with RBAC protection', () => {
    expect(routesContent).toContain('/admin/buses/create');
    expect(routesContent).toContain('/admin/fleet');
    expect(routesContent).toContain('/admin/buses');
    expect(routesContent).toContain('AddBusWizard');
    expect(routesContent).toContain('AdminFleetDashboard');
    expect(routesContent).toContain("allowedRoles={['super_admin', 'admin', 'travel_owner', 'manager']}");
  });

  // ==================== SECTION 2: ADD BUS WIZARD SPECIFICATIONS ====================
  test('Add Bus Wizard matches Soft-Pink theme tokens (#FFF1F6, #FFFFFF cards, #24152D text)', () => {
    expect(wizardContent).toContain('#FFF1F6');
    expect(wizardContent).toContain('#24152D');
    expect(wizardContent).toContain('#C13D78');
    expect(wizardContent).toContain('#E7A0BF');
  });

  test('Step A implements all required Basic Fleet Details inputs', () => {
    // 1. Operator Name
    expect(wizardContent).toContain('1. Operator Name / Carrier Brand');
    // 2. Bus Name / Model
    expect(wizardContent).toContain('2. Bus Name / Model');
    expect(wizardContent).toContain('Volvo 9600 Multi-Axle Luxury Glider');
    // 3. Registration Number
    expect(wizardContent).toContain('3. Registration Number');
    expect(wizardContent).toContain('TN 38 AH 7890');
    // 4. Assigned Route
    expect(wizardContent).toContain('4. Assigned Commercial Route');
    expect(wizardContent).toContain('Coimbatore ⇄ Karaikudi');
    // 5. Departure & Arrival Times
    expect(wizardContent).toContain('5. Daily Departure Time');
    expect(wizardContent).toContain('6. Estimated Arrival Time');
    expect(wizardContent).toContain('21:30');
    expect(wizardContent).toContain('05:00');
  });

  test('Step B implements all 6 official layout cards with exact badges, specs, and active border styling', () => {
    // Active card border
    expect(wizardContent).toContain('ring-2 ring-[#C13D78] bg-[#FFF1F6]/50');

    // Layout 1: combo_48
    expect(wizardContent).toContain('combo_48');
    expect(wizardContent).toContain('2+1 Combo (Tata)');
    expect(wizardContent).toContain('48 Seats (24 Seater + 24 Sleeper)');
    expect(wizardContent).toContain('Lower: 1 Sleeper + 2 Seater | Upper: 1+2 Sleeper');

    // Layout 2: sleeper_36
    expect(wizardContent).toContain('sleeper_36');
    expect(wizardContent).toContain('Fully Sleeper (Volvo 9600)');
    expect(wizardContent).toContain('36 Luxury Berths');

    // Layout 3: seater_40
    expect(wizardContent).toContain('seater_40');
    expect(wizardContent).toContain('Fully Seater (Executive Pushback)');
    expect(wizardContent).toContain('40 Pushback Seats (Single Deck)');
    expect(wizardContent).toContain('2+2 Seater Only | Lower Deck');

    // Layout 4: sleeper_washroom_rear
    expect(wizardContent).toContain('sleeper_washroom_rear');
    expect(wizardContent).toContain('Fully Sleeper + Rear Restroom');
    expect(wizardContent).toContain('34 Berths + Rear WC');
    expect(wizardContent).toContain('Lower: 16 Berths + Rear Right WC | Upper: 18 Berths');

    // Layout 5: sleeper_washroom_front
    expect(wizardContent).toContain('sleeper_washroom_front');
    expect(wizardContent).toContain('Fully Sleeper + Front Restroom');
    expect(wizardContent).toContain('35 Berths + Front WC (L1)');
    expect(wizardContent).toContain('Lower: 17 Berths + L1 Entry WC | Upper: 18 Berths');

    // Layout 6: seater_washroom
    expect(wizardContent).toContain('seater_washroom');
    expect(wizardContent).toContain('Fully Seater + Rear Restroom');
    expect(wizardContent).toContain('38 Seats + Rear WC');
    expect(wizardContent).toContain('Single Deck 2+2 Seater + Rear Right WC');
  });

  test('Step C renders live interactive CoachSeatLayout preview with per-seat VIP/Window override modal', () => {
    expect(wizardContent).toContain('<CoachSeatLayout');
    expect(wizardContent).toContain('previewMode={true}');
    expect(wizardContent).toContain('showFloatingBar={false}');
    expect(wizardContent).toContain('onSeatClick={handleSeatClickForOverride}');
    expect(wizardContent).toContain('Override Fare for Seat');
    expect(wizardContent).toContain('Save Price Override');
    expect(wizardContent).toContain('+₹100 (Front VIP)');
    expect(wizardContent).toContain('+₹150 (Panoramic)');
    expect(wizardContent).toContain('₹1,250 (Luxury Glider)');
  });

  test('Step D implements Dynamic Fare Configuration Engine with sleeper & seater controls and 5% GST toggle', () => {
    // Sleeper controls
    expect(wizardContent).toContain('Default Lower Deck Sleeper Fare (₹)');
    expect(wizardContent).toContain('Default Upper Deck Sleeper Fare (₹)');
    expect(wizardContent).toContain('Single Berth Window Premium (+₹)');

    // Seater controls
    expect(wizardContent).toContain('Pushback Seater Standard Fare (₹)');
    expect(wizardContent).toContain('Window Seat Premium (+₹)');

    // Quick bulk actions & GST toggle
    expect(wizardContent).toContain('Apply Base Pricing to All Available Berths/Seats');
    expect(wizardContent).toContain('Include 5% GST in Displayed Fare');
  });

  test('Step E implements amenities selection with auto-check for washroom and CTA submission', () => {
    expect(wizardContent).toContain('Live Radar GPS Tracking');
    expect(wizardContent).toContain('Climate Controlled AC (UV Purified)');
    expect(wizardContent).toContain('230V & USB-C Power Outlets');
    expect(wizardContent).toContain('Clean Blanket & Pillow');
    expect(wizardContent).toContain('Reading Lamp');
    expect(wizardContent).toContain('Onboard Washroom');

    // Submission CTA
    expect(wizardContent).toContain('Save as Draft');
    expect(wizardContent).toContain('Publish Bus to Fleet');
    expect(wizardContent).toContain('bg-[#C13D78] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#A82B63]');
    expect(wizardContent).toContain('/api/admin/buses');
    expect(wizardContent).toContain('Bus ${formData.busName} added successfully with ${activeLayoutConfig.name} configuration!');
  });

  // ==================== SECTION 3: BACKEND API ENDPOINTS ====================
  test('Backend POST /api/admin/buses provisions new coach with full layout metadata and custom pricing', async () => {
    const testReg = `TN-38-TEST-${Date.now().toString().slice(-4)}`;
    const { req, res } = mockReqRes({
      user: {
        id: 'usr-admin-01',
        role: 'super_admin',
        travelId: smartRouteTravelId,
      },
      body: {
        operatorName: 'SMART ROUTE Travels',
        busName: 'Scania Metrolink 14.5M Multi-Axle Glider',
        registrationNumber: testReg,
        assignedRoute: 'Coimbatore ⇄ Karaikudi',
        routeId: 'route_cbe_kkdi_01',
        departureTime: '21:30',
        arrivalTime: '05:00',
        layoutType: 'sleeper_washroom_rear',
        layoutName: 'Fully Sleeper + Rear Restroom',
        totalSeats: 34,
        fareConfig: {
          sleeperLower: 950,
          sleeperUpper: 1200,
          singleWindowPremium: 100,
          includeGst: true,
        },
        seatPricing: {
          L1: 1050,
          U1: 1300,
          L7: 950,
        },
        amenities: [
          'Live Radar GPS Tracking',
          'Climate Controlled AC (UV Purified)',
          'Onboard Washroom',
          '230V & USB-C Power Outlets',
        ],
        status: 'published',
      },
    });

    await createAdminBus(req, res);

    expect(res.getStatusCode()).toBe(201);
    const data = res.getData();
    expect(data.success).toBe(true);
    expect(data.bus).toBeDefined();
    expect(data.bus.registration_number).toBe(testReg);
    expect(data.bus.layout_type).toBe('sleeper_washroom_rear');
    expect(data.bus.total_seats).toBe(34);
    expect(data.bus.amenities).toContain('Onboard Washroom');
    expect(data.bus.seat_pricing.U1).toBe(1300);
    expect(data.message).toContain('added successfully with Fully Sleeper + Rear Restroom configuration!');

    // Verify stored in dataStore buses array
    const stored = buses.find((b) => b.registration_number === testReg);
    expect(stored).toBeDefined();
    expect(stored.layout_name).toBe('Fully Sleeper + Rear Restroom');
  });

  test('Backend POST /api/admin/buses enforces duplicate registration number rejection', async () => {
    // Existing bus TN 38 AH 7890
    const existingBus = buses[0];
    const { req, res } = mockReqRes({
      user: { id: 'usr-admin-01', role: 'super_admin' },
      body: {
        busName: 'Duplicate Test Bus',
        registrationNumber: existingBus.registration_number,
      },
    });

    await createAdminBus(req, res);
    expect(res.getStatusCode()).toBe(409);
    expect(res.getData().code).toBe('DUPLICATE_REGISTRATION');
  });

  test('Backend GET /api/admin/buses returns complete fleet inventory', async () => {
    const { req, res } = mockReqRes({
      user: { id: 'usr-admin-01', role: 'super_admin' },
    });

    await getAdminBuses(req, res);
    expect(res.getStatusCode()).toBe(200);
    const data = res.getData();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.buses)).toBe(true);
    expect(data.buses.length).toBeGreaterThan(0);
  });
});
