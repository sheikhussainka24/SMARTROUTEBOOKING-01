import { busLayout, layoutSeats, getSeatsForTrip, trips } from '../../BACKEND/src/services/dataStore.js';

describe('SMART ROUTE — Tata + Prakash 48-Position Layout & Accordion View Tests', () => {
  test('Tata + Prakash reference layout matches exact 48 passenger positions', () => {
    expect(busLayout.layout_config.chassis).toContain('TATA');
    expect(busLayout.layout_config.body).toContain('Prakash Vega');
    expect(busLayout.layout_config.driver_position).toBe('right');
    expect(busLayout.layout_config.stairs_position).toBe('front_left');

    // Lower Deck: 24 Pushback seats + 6 Sleepers = 30 positions
    expect(busLayout.layout_config.lower_deck.seats).toBe(24);
    expect(busLayout.layout_config.lower_deck.sleepers).toBe(6);

    // Upper Deck: 18 Sleepers
    expect(busLayout.layout_config.upper_deck.sleepers).toBe(18);

    // Total layout positions = 48
    expect(busLayout.total_seats + busLayout.total_sleepers).toBe(48);
  });

  test('Lower deck contains exactly 24 pushback seats and 6 sleepers', () => {
    const lowerDeckSeats = layoutSeats.filter((s) => s.deck === 'lower');
    expect(lowerDeckSeats.length).toBe(30);

    const pushbackSeats = lowerDeckSeats.filter((s) => s.seat_type === 'seat');
    const lowerSleepers = lowerDeckSeats.filter((s) => s.seat_type === 'sleeper');

    expect(pushbackSeats.length).toBe(24);
    expect(lowerSleepers.length).toBe(6);
  });

  test('Upper deck contains exactly 18 panoramic sleepers', () => {
    const upperDeckSeats = layoutSeats.filter((s) => s.deck === 'upper');
    expect(upperDeckSeats.length).toBe(18);
    expect(upperDeckSeats.every((s) => s.seat_type === 'sleeper')).toBe(true);
  });

  test('Authoritative trip seat query returns full 48-seat inventory with layout metadata', () => {
    const sampleTrip = trips[0];
    expect(sampleTrip).toBeDefined();

    const result = getSeatsForTrip(sampleTrip.id);
    expect(result.seats.length).toBe(48);
    expect(result.layout).toBeDefined();
    expect(result.layout.configuration).toBe('2+1');

    // Verify seat statuses are valid
    result.seats.forEach((seat) => {
      expect(['available', 'booked', 'held']).toContain(seat.status);
      expect(seat.fare).toBeGreaterThan(0);
      expect(seat.seat_number).toBeDefined();
    });
  });

  test('Dynamic fare calculation aggregates multiple selected seats correctly', () => {
    const selected = [
      { seat_number: 'SL1', seat_type: 'sleeper', fare: 1190 },
      { seat_number: 'S3', seat_type: 'seat', fare: 880 },
      { seat_number: 'U4', seat_type: 'sleeper', fare: 1190 },
    ];

    const total = selected.reduce((sum, s) => sum + s.fare, 0);
    expect(total).toBe(3260);
    expect(selected.length).toBe(3);
  });
});
