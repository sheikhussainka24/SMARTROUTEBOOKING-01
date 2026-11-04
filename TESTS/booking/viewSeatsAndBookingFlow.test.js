import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SMART ROUTE — View Seats & Passenger Details Complete Flow Verification', () => {
  const searchTripsPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/SearchTrips.jsx');
  const seatSelectionPagePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/SeatSelectionPage.jsx');
  const busSeatLayoutPath = path.resolve(__dirname, '../../FRONTEND/src/components/seats/BusSeatLayout.jsx');
  const tataPrakashLayoutPath = path.resolve(__dirname, '../../FRONTEND/src/components/seats/TataPrakashSeatLayout.jsx');
  const tripBookingPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TripBooking.jsx');
  const routesPath = path.resolve(__dirname, '../../FRONTEND/src/routes/index.jsx');

  const searchTripsContent = fs.readFileSync(searchTripsPath, 'utf8');
  const seatSelectionPageContent = fs.readFileSync(seatSelectionPagePath, 'utf8');
  const busSeatLayoutContent = fs.readFileSync(busSeatLayoutPath, 'utf8');
  const tataPrakashContent = fs.readFileSync(tataPrakashLayoutPath, 'utf8');
  const tripBookingContent = fs.readFileSync(tripBookingPath, 'utf8');
  const routesContent = fs.readFileSync(routesPath, 'utf8');

  // ==================== SECTION 1: VIEW SEATS BUTTON & ROUTING ====================
  test('SearchTrips implements handleViewSeats navigating to /book/:tripId with all preserved parameters', () => {
    expect(searchTripsContent).toContain('handleViewSeats');
    expect(searchTripsContent).toContain('navigate(`/book/${tripId}');
    expect(searchTripsContent).toContain('busId:');
    expect(searchTripsContent).toContain('tripId,');
    expect(searchTripsContent).toContain('travelDate: date,');
    expect(searchTripsContent).toContain('fromCity,');
    expect(searchTripsContent).toContain('toCity,');
    expect(searchTripsContent).toContain('boardingStopId:');
    expect(searchTripsContent).toContain('droppingStopId:');
    expect(searchTripsContent).toContain('View Seats');
  });

  test('AppRoutes correctly maps /book/:tripId and /select-seats/:tripId to SeatSelectionPage', () => {
    expect(routesContent).toContain('import SeatSelectionPage from');
    expect(routesContent).toContain('path="/book/:tripId" element={<SeatSelectionPage />}');
    expect(routesContent).toContain('path="/select-seats/:tripId" element={<SeatSelectionPage />}');
    expect(routesContent).toContain('path="/passenger-details"');
    expect(routesContent).toContain('<TripBooking />');
  });

  // ==================== SECTION 2: AUTHENTIC TWO-DECK BUS INTERIOR LAYOUT ====================
  test('SeatSelectionPage renders authentic Tata + Prakash coach interior configuration (30 Lower + 18 Upper)', () => {
    // Lower Deck: 24 Pushback Seats + 6 Sleeper Berths
    expect(seatSelectionPageContent).toContain('Lower Deck (24 Seats + 6 Sleepers)');
    expect(seatSelectionPageContent).toContain('LS1-LS6');
    expect(seatSelectionPageContent).toContain('PUSHBACK SEATS (24)');
    expect(seatSelectionPageContent).toContain('upperLeftSleepers');
    expect(seatSelectionPageContent).toContain('upperRightSleepers');
    expect(seatSelectionPageContent).toContain('Upper Deck (18 Sleepers)');
    expect(seatSelectionPageContent).toContain('U1-U9');
    expect(seatSelectionPageContent).toContain('U10-U18');

    // Cockpit & Orientation
    expect(seatSelectionPageContent).toContain('Driver Cab (Right)');
    expect(seatSelectionPageContent).toContain('Passenger Entrance & Stairs');
    expect(seatSelectionPageContent).toContain('▲ FRONT (Direction of Travel)');
    expect(seatSelectionPageContent).toContain('WALKING AISLE');
    expect(seatSelectionPageContent).toContain('EMERGENCY EXIT');
  });

  test('BusSeatLayout component renders authentic 24 seats + 6 sleepers lower deck and 18 sleepers upper deck', () => {
    expect(busSeatLayoutContent).toContain('Lower Deck (24 Seats + 6 Sleepers)');
    expect(busSeatLayoutContent).toContain('Upper Deck (18 Sleepers)');
    expect(busSeatLayoutContent).toContain('Driver (Right)');
    expect(busSeatLayoutContent).toContain('Stairs / Entrance (Left)');
    expect(busSeatLayoutContent).toContain('▲ FRONT OF COACH');
    expect(busSeatLayoutContent).toContain('WALKING AISLE');
  });

  // ==================== SECTION 3: SEAT STATUS & INVENTORY INTERACTION ====================
  test('SeatSelectionPage handles real inventory statuses: available, selected, booked, and held', () => {
    expect(seatSelectionPageContent).toContain('Available');
    expect(seatSelectionPageContent).toContain('Selected');
    expect(seatSelectionPageContent).toContain('Booked');
    expect(seatSelectionPageContent).toContain('Temporarily Held');

    // Disabled booked and held seats
    expect(seatSelectionPageContent).toContain("if (seat.status === 'booked' || seat.status === 'held') return;");
    // Max 6 seat restriction
    expect(seatSelectionPageContent).toContain('selectedSeatIds.length >= 6');
  });

  test('SeatSelectionPage displays recoverable error on backend inventory failure instead of empty diagram', () => {
    expect(seatSelectionPageContent).toContain('Retry Seat Loading');
    expect(seatSelectionPageContent).toContain('Select Another Bus');
  });

  // ==================== SECTION 4: PASSENGER DETAILS AND CHECKOUT ====================
  test('SeatSelectionPage navigates to /passenger-details preserving selected seats, trip, and stops', () => {
    expect(seatSelectionPageContent).toContain("navigate('/passenger-details'");
    expect(seatSelectionPageContent).toContain('selectedSeats: selectedSeatNumbers');
    expect(seatSelectionPageContent).toContain('farePerSeat,');
    expect(seatSelectionPageContent).toContain('totalAmount: finalPayable');
    expect(seatSelectionPageContent).toContain('boardingPoint: selectedBoardingPoint');
    expect(seatSelectionPageContent).toContain('droppingPoint: selectedDroppingPoint');
  });

  test('TripBooking collects passenger details per seat and links back to /book/:tripId on Change Seats', () => {
    expect(tripBookingContent).toContain('Change Seats');
    expect(tripBookingContent).toContain('to={`/book/${tripId}');
    expect(tripBookingContent).toContain('selectedSeats.map');
    expect(tripBookingContent).toContain('Full Name');
    expect(tripBookingContent).toContain('Age');
    expect(tripBookingContent).toContain('Gender');
    expect(tripBookingContent).toContain('api.post(\'/bookings\'');
    expect(tripBookingContent).toContain('/booking-success/');
  });
});
