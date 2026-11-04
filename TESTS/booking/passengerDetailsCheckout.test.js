import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SMART ROUTE — Seat Selection Data Pass & Dynamic Passenger Details Flow', () => {
  const seatLayoutPath = path.resolve(__dirname, '../../FRONTEND/src/components/seats/TataPrakashSeatLayout.jsx');
  const routesPath = path.resolve(__dirname, '../../FRONTEND/src/routes/index.jsx');
  const tripBookingPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TripBooking.jsx');

  const seatLayoutContent = fs.readFileSync(seatLayoutPath, 'utf8');
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  const tripBookingContent = fs.readFileSync(tripBookingPath, 'utf8');

  test('TataPrakashSeatLayout navigates forward to /passenger-details with exact state payload schema', () => {
    expect(seatLayoutContent).toContain("navigate('/passenger-details'");
    expect(seatLayoutContent).toContain('busId:');
    expect(seatLayoutContent).toContain('operatorName:');
    expect(seatLayoutContent).toContain('serviceNumber:');
    expect(seatLayoutContent).toContain('selectedSeats:');
    expect(seatLayoutContent).toContain('farePerSeat:');
    expect(seatLayoutContent).toContain('totalAmount:');
    expect(seatLayoutContent).toContain('boardingPoint:');
    expect(seatLayoutContent).toContain('droppingPoint:');
    expect(seatLayoutContent).toContain('travelDate:');
  });

  test('AppRoutes registers /passenger-details as a protected route for passengers', () => {
    expect(routesContent).toContain('path="/passenger-details"');
    expect(routesContent).toContain('<TripBooking />');
  });

  test('TripBooking strictly excludes the redundant Physical Coach Seating Arrangement and BusSeatLayout', () => {
    expect(tripBookingContent).not.toContain('Physical Coach Seating Arrangement');
    expect(tripBookingContent).not.toContain('BusSeatLayout');
  });

  test('TripBooking implements dynamic Passenger Details inputs (Name, Age, Gender) per reserved berth', () => {
    expect(tripBookingContent).toContain('selectedSeats.map');
    expect(tripBookingContent).toContain('Full Name');
    expect(tripBookingContent).toContain('Age');
    expect(tripBookingContent).toContain('Gender');
    expect(tripBookingContent).toContain('Berth {seat.seat_number}');
    expect(tripBookingContent).toContain('handlePassengerChange');
  });

  test('TripBooking preserves boarding & dropping points and persists fare calculation', () => {
    expect(tripBookingContent).toContain('boardingDisplayName');
    expect(tripBookingContent).toContain('droppingDisplayName');
    expect(tripBookingContent).toContain('totalPayable');
    expect(tripBookingContent).toContain('sessionStorage');
  });
});
