import { describe, test, expect, beforeAll } from '@jest/globals';
import {
  SUPPORTED_MANUFACTURERS,
  getSupportedManufacturers,
  getModelsForManufacturer,
  validateBusModel,
  CHASSIS_CATALOG,
} from '../../BACKEND/src/services/busLayoutEngine.js';
import {
  createAdminBus,
  approveTravel,
  rejectTravel,
  listTravels,
} from '../../BACKEND/src/controllers/adminController.js';
import {
  createCompanyBus,
} from '../../BACKEND/src/controllers/operatorController.js';
import {
  createTrip,
} from '../../BACKEND/src/controllers/tripController.js';
import {
  travels,
  buses,
  users,
  trips,
  searchTripsData,
  createNewBooking,
  createTripInStore,
} from '../../BACKEND/src/services/dataStore.js';

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

describe('PART A: Bus Brand, Model & Custom Bus Name System', () => {
  test('1. Supported manufacturers catalogue includes all required brands', () => {
    const mfrs = getSupportedManufacturers();
    expect(mfrs).toContain('Volvo');
    expect(mfrs).toContain('Tata');
    expect(mfrs).toContain('BharatBenz');
    expect(mfrs).toContain('Ashok Leyland');
    expect(mfrs).toContain('Eicher');
    expect(mfrs).toContain('Scania');
    expect(mfrs).toContain('Mercedes-Benz');
  });

  test('2. Dependent models filter correctly per manufacturer', () => {
    const volvoModels = getModelsForManufacturer('Volvo');
    expect(volvoModels.length).toBeGreaterThan(0);
    expect(volvoModels.every((c) => c.brand.toLowerCase() === 'volvo')).toBe(true);

    const scaniaModels = getModelsForManufacturer('Scania');
    expect(scaniaModels.length).toBeGreaterThan(0);
    expect(scaniaModels.every((c) => c.brand.toLowerCase() === 'scania')).toBe(true);
    expect(scaniaModels.some((c) => c.model === 'Metrolink HD')).toBe(true);

    const tataModels = getModelsForManufacturer('Tata');
    expect(tataModels.some((c) => c.model === 'LPO 1618')).toBe(true);
  });

  test('3. validateBusModel enforces compulsory manufacturer and model', () => {
    // Missing manufacturer
    const noMfr = validateBusModel('', '9600');
    expect(noMfr.valid).toBe(false);
    expect(noMfr.error).toMatch(/manufacturer/i);

    // Missing model
    const noModel = validateBusModel('Volvo', '');
    expect(noModel.valid).toBe(false);
    expect(noModel.error).toMatch(/model/i);

    // Unsupported manufacturer
    const invalidMfr = validateBusModel('AlienMotors', 'X1');
    expect(invalidMfr.valid).toBe(false);
    expect(invalidMfr.error).toMatch(/unsupported/i);

    // Unsupported model for valid manufacturer
    const invalidModel = validateBusModel('Volvo', 'UnknownPhantomModel');
    expect(invalidModel.valid).toBe(false);
    expect(invalidModel.error).toMatch(/not a recognized model/i);

    // Valid pair
    const valid = validateBusModel('Volvo', '9600');
    expect(valid.valid).toBe(true);
    expect(valid.chassis).toBeDefined();
    expect(valid.chassis.brand).toBe('Volvo');
  });

  test('4. Display name logic: Custom name takes priority when provided', async () => {
    const adminUser = { id: 'usr-admin-001', role: 'super_admin' };
    const { req, res } = mockReqRes({
      user: adminUser,
      body: {
        manufacturer: 'Volvo',
        model: '9600',
        custom_name: 'Royal Express',
        registrationNumber: 'TN 76 AB 1001',
        layoutType: 'sleeper_36',
      },
    });

    await createAdminBus(req, res);
    expect(res.getStatusCode()).toBe(201);
    const bus = res.getData().bus;
    expect(bus.manufacturer).toBe('Volvo');
    expect(bus.model).toBe('9600');
    expect(bus.custom_name).toBe('Royal Express');
    expect(bus.display_name).toBe('Royal Express');
    expect(bus.name).toBe('Royal Express');
  });

  test('5. Display name logic: Defaults to [Manufacturer] [Model] when custom name is omitted', async () => {
    const adminUser = { id: 'usr-admin-001', role: 'super_admin' };
    const { req, res } = mockReqRes({
      user: adminUser,
      body: {
        manufacturer: 'Scania',
        model: 'Metrolink HD',
        registrationNumber: 'TN 76 CD 2002',
        layoutType: 'sleeper_36',
      },
    });

    await createAdminBus(req, res);
    expect(res.getStatusCode()).toBe(201);
    const bus = res.getData().bus;
    expect(bus.manufacturer).toBe('Scania');
    expect(bus.model).toBe('Metrolink HD');
    expect(bus.custom_name).toBeNull();
    expect(bus.display_name).toBe('Scania Metrolink HD');
    expect(bus.name).toBe('Scania Metrolink HD');
  });

  test('6. Compulsory manufacturer/model is strictly enforced in operator createCompanyBus', async () => {
    const ownerUser = { id: 'usr-tranz-owner', role: 'travel_owner', travel_id: 'trv-sr-001', travelId: 'trv-sr-001' };
    
    // Attempt without manufacturer
    const { req: badReq, res: badRes } = mockReqRes({
      user: ownerUser,
      body: {
        bus_name: 'Custom Express Only',
        registration_number: 'TN 76 EF 3003',
        layout_id: 'combo_48',
      },
    });
    await createCompanyBus(badReq, badRes);
    expect(badRes.getStatusCode()).toBe(400);
    expect(badRes.getData().message || badRes.getData().error).toMatch(/manufacturer/i);

    // Valid submission with custom name
    const { req: goodReq, res: goodRes } = mockReqRes({
      user: ownerUser,
      body: {
        manufacturer: 'Tata',
        model: 'LPO 1618',
        custom_name: 'Cauvery Express',
        registration_number: 'TN 76 EF 3004',
        layout_id: 'combo_48',
      },
    });
    await createCompanyBus(goodReq, goodRes);
    expect(goodRes.getStatusCode()).toBe(201);
    const bus = goodRes.getData().bus;
    expect(bus.manufacturer).toBe('Tata');
    expect(bus.model).toBe('LPO 1618');
    expect(bus.custom_name).toBe('Cauvery Express');
    expect(bus.display_name).toBe('Cauvery Express');
  });
});

describe('PART B: Super Admin Review, Operator Verification & Restrictions', () => {
  const TRANZKING_ID = '69fd55b3-a98d-40ab-8018-c33b503e7e5b';

  test('1. Inspect pending operator Tranzking Travel Express in registry', () => {
    const tranzking = travels.find((t) => t.id === TRANZKING_ID);
    expect(tranzking).toBeDefined();
    expect(tranzking.name).toBe('Tranzking Travel Express');
    expect(tranzking.verification_status).toBe('pending');
  });

  test('2. Unverified operator is blocked from creating or publishing trips', async () => {
    const unverifiedOwner = {
      id: 'usr-tranzking-owner',
      role: 'travel_owner',
      travelId: TRANZKING_ID,
      travel_id: TRANZKING_ID,
    };

    const { req, res } = mockReqRes({
      user: unverifiedOwner,
      body: {
        route_id: 'route_cbe_kkdi_01',
        bus_id: 'bus-sample-01',
        departure_time: '2026-12-01T21:00:00Z',
        arrival_time: '2026-12-02T05:00:00Z',
        base_fare: 750,
      },
    });

    await createTrip(req, res);
    expect(res.getStatusCode()).toBe(403);
    expect(res.getData().error).toBe('OPERATOR_NOT_VERIFIED');
  });

  test('3. Unverified operator trips cannot be created in dataStore', () => {
    expect(() => {
      createTripInStore({
        travel_id: TRANZKING_ID,
        bus_id: 'bus-01',
        route_id: 'route-01',
      });
    }).toThrow(/OPERATOR_NOT_VERIFIED/);
  });

  test('4. Super Admin reviews and approves Tranzking Travel Express', async () => {
    const superAdmin = {
      id: 'usr-admin-001',
      role: 'super_admin',
      firstName: 'Admin',
    };

    const { req, res } = mockReqRes({
      user: superAdmin,
      params: { travelId: TRANZKING_ID },
      body: {
        notes: 'Compliance documents and TN permit verified by Super Admin.',
      },
    });

    await approveTravel(req, res);
    expect(res.getStatusCode()).toBe(200);
    expect(res.getData().success).toBe(true);

    // Verify status in store
    const updated = travels.find((t) => t.id === TRANZKING_ID);
    expect(updated.verification_status).toBe('verified');
    expect(updated.status).toBe('active');
    expect(updated.approved_by).toBe('usr-admin-001');
    expect(updated.admin_notes).toMatch(/Compliance documents/);

    // Verify owner account activated
    const owner = users.find((u) => u.travel_id === TRANZKING_ID && u.role === 'travel_owner');
    if (owner) {
      expect(owner.status).toBe('active');
    }
  });

  test('5. Verified operator can now publish trips and accept bookings', () => {
    // Verified operator can create a trip
    const newTrip = createTripInStore({
      travel_id: TRANZKING_ID,
      bus_id: 'bus-seed-01',
      route_id: 'route_cbe_kkdi_01',
      departure_time: '2026-12-15T22:00:00Z',
      arrival_time: '2026-12-16T06:00:00Z',
      fare: 850,
      total_seats: 36,
      available_seats: 36,
    });
    expect(newTrip).toBeDefined();
    expect(newTrip.travel_id).toBe(TRANZKING_ID);

    // Booking can now proceed
    const bookingResult = createNewBooking({
      tripId: newTrip.id,
      busId: 'bus-seed-01',
      operatorName: 'Tranzking Travel Express',
      passengerDetails: [{ name: 'Test Passenger', seatNumber: 'L1', age: 28, gender: 'male', fare: 850 }],
      contactDetails: { email: 'test@example.com', phone: '9876543210' },
      originCity: 'Coimbatore',
      destinationCity: 'Karaikudi',
      journeyDate: '2026-12-15',
    });
    expect(bookingResult).toBeDefined();
    expect(bookingResult.pnr || bookingResult.pnr_number).toBeDefined();
    expect(bookingResult.booking_status).toBe('confirmed');
  });
});
