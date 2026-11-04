import { getBusSeatLayout, getTripSeatMap } from '../../BACKEND/src/controllers/seatController.js';
import {
  buses,
  trips,
  bookings,
  createNewBooking,
} from '../../BACKEND/src/services/dataStore.js';

function createMockReqRes(params = {}, query = {}) {
  const req = { params, query };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return { req, res };
}

describe('SMART ROUTE — Double Booking & Seat Inventory Fix (Service #VV-CBETKS-100 & Seat U3)', () => {
  const targetDate = new Date().toISOString().split('T')[0];
  const serviceNumber = 'VV-CBETKS-100';

  let targetBus = buses.find((b) =>
    (b.service_number && b.service_number.includes(serviceNumber)) ||
    (b.registration_number && b.registration_number.includes(serviceNumber)) ||
    (b.bus_number && b.bus_number.includes(serviceNumber))
  );

  let targetTrip = trips.find((t) =>
    (t.trip_number && t.trip_number.includes(serviceNumber)) ||
    (t.bus_number && t.bus_number.includes(serviceNumber)) ||
    (t.service_number && t.service_number.includes(serviceNumber)) ||
    (targetBus && t.bus_id === targetBus.id)
  );

  if (!targetBus) {
    targetBus = buses.find((b) => (b.travel_name || '').includes('VEE VEE')) || buses[0];
  }

  const busId = targetBus?.id || 'bus-001';

  // 1. Parameter Validation Test
  describe('1. Endpoint Parameter Validation', () => {
    test('Rejects request with 400 when journey date is missing', async () => {
      const { req, res } = createMockReqRes({ busId }, {});
      await getBusSeatLayout(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.data.error).toBe('busId and journeyDate are required to evaluate seat inventory.');
    });

    test('Rejects request with 400 when busId is blank or missing', async () => {
      const { req, res } = createMockReqRes({ busId: '' }, { date: targetDate });
      await getBusSeatLayout(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.data.error).toBe('busId and journeyDate are required to evaluate seat inventory.');
    });
  });

  // 2. Authoritative Seat Inventory & Booking Verification
  describe('2. Seat Inventory & Confirmed Booking Detection', () => {
    beforeAll(() => {
      // Simulate confirmed booking of Seat U3 for targetDate on target service
      const existingU3Booking = bookings.find(
        (b) =>
          b.status !== 'cancelled' &&
          (b.journey_date === targetDate || b.travel_date === targetDate) &&
          (b.passengers || []).some((p) => p.seat_number === 'U3' || p.seatNumber === 'U3')
      );

      if (!existingU3Booking) {
        // Create confirmed booking for U3 with male passenger
        createNewBooking({
          tripId: targetTrip?.id || 'trip-cbe-tks-101',
          busId: busId,
          serviceNumber: serviceNumber,
          journeyDate: targetDate,
          travelDate: targetDate,
          passengerDetails: [
            {
              seatNumber: 'U3',
              name: 'Karthik Subramanian',
              gender: 'male',
              age: 29,
              fare: 1450,
            },
          ],
        });
      }
    });

    test('getBusSeatLayout immediately marks Seat U3 as booked and disabled: true with gender indication', async () => {
      const { req, res } = createMockReqRes({ busId }, { date: targetDate });
      await getBusSeatLayout(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data.seats)).toBe(true);

      const seatU3 = res.data.data.seats.find((s) => s.seat_number === 'U3');
      expect(seatU3).toBeDefined();

      // Crucial verification requirements:
      // 1. Immediately blocked (disabled: true, non-clickable)
      expect(seatU3.disabled).toBe(true);
      // 2. Status set to 'booked'
      expect(seatU3.status).toBe('booked');
      // 3. Clear gender indication (distinct visual for male vs female)
      expect(seatU3.gender).toBe('male');
    });

    test('Prevents another passenger from double-booking Seat U3 on the same service and date', () => {
      expect(() => {
        createNewBooking({
          tripId: targetTrip?.id || 'trip-cbe-tks-101',
          busId: busId,
          serviceNumber: serviceNumber,
          journeyDate: targetDate,
          travelDate: targetDate,
          passengerDetails: [
            {
              seatNumber: 'U3',
              name: 'Duplicate Passenger',
              gender: 'female',
              age: 26,
              fare: 1450,
            },
          ],
        });
      }).toThrow();
    });

    test('Reopening seat layout on a different date (future date) still shows Seat U3 as available', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const { req, res } = createMockReqRes({ busId }, { date: tomorrow });
      await getBusSeatLayout(req, res);

      expect(res.statusCode).toBe(200);
      const seatU3Tomorrow = res.data.data.seats.find((s) => s.seat_number === 'U3');
      expect(seatU3Tomorrow).toBeDefined();
      expect(seatU3Tomorrow.status).toBe('available');
      expect(seatU3Tomorrow.disabled).toBe(false);
    });

    test('Supports querying by service number alias directly', async () => {
      const { req, res } = createMockReqRes({ busId: serviceNumber }, { date: targetDate });
      await getBusSeatLayout(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      const seatU3 = res.data.data.seats.find((s) => s.seat_number === 'U3');
      expect(seatU3).toBeDefined();
      expect(seatU3.disabled).toBe(true);
      expect(seatU3.status).toBe('booked');
      expect(seatU3.gender).toBe('male');
    });

    test('Supports getTripSeatMap with journeyDate query parameter', async () => {
      const tripId = targetTrip?.id || 'trip-cbe-tks-101';
      const { req, res } = createMockReqRes({ tripId }, { date: targetDate });
      await getTripSeatMap(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      const seats = res.data.data.seats;
      const seatU3 = seats.find((s) => s.seat_number === 'U3');
      if (seatU3) {
        expect(seatU3.status).toBe('booked');
        expect(seatU3.disabled).toBe(true);
        expect(seatU3.gender).toBe('male');
      }
    });
  });
});
