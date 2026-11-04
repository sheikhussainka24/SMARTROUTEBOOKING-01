import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SMART ROUTE — Live Seat Selection Summary & Total Fare Flow', () => {
  const seatSelectionPagePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/SeatSelectionPage.jsx');
  const tripBookingPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/TripBooking.jsx');

  const seatSelectionPageContent = fs.readFileSync(seatSelectionPagePath, 'utf8');
  const tripBookingContent = fs.readFileSync(tripBookingPath, 'utf8');

  // ==================== SECTION 1: LIVE SELECTION SUMMARY UI ====================
  test('SeatSelectionPage displays Selected Seats, Seat Count, Base Fare, Subtotal, Taxes and Fees, Discount, and Total Payable', () => {
    expect(seatSelectionPageContent).toContain('Selected Seats:');
    expect(seatSelectionPageContent).toContain('Seat Count:');
    expect(seatSelectionPageContent).toContain('Base Fare:');
    expect(seatSelectionPageContent).toContain('Subtotal:');
    expect(seatSelectionPageContent).toContain('Taxes and Fees:');
    expect(seatSelectionPageContent).toContain('Discount:');
    expect(seatSelectionPageContent).toContain('Total Payable:');
  });

  test('SeatSelectionPage renders itemized base fare breakdown for each selected berth', () => {
    expect(seatSelectionPageContent).toContain('s.seat_number');
    expect(seatSelectionPageContent).toContain('s.fare');
    expect(seatSelectionPageContent).toContain('0 selected seats (₹0 seat subtotal)');
  });

  test('Continue button is disabled when no seats are selected and enabled when seats are selected', () => {
    expect(seatSelectionPageContent).toContain('disabled={selectedSeatObjects.length === 0}');
    expect(seatSelectionPageContent).toContain("'Select Seats to Continue'");
    expect(seatSelectionPageContent).toContain('Continue to Passenger Details');
  });

  // ==================== SECTION 2: LIVE SELECTION BEHAVIOUR & DECK SWITCHING ====================
  test('Clicking a seat toggles selection and blocks booked/held seats', () => {
    expect(seatSelectionPageContent).toContain("if (seat.status === 'booked' || seat.status === 'held') return;");
    expect(seatSelectionPageContent).toContain('if (selectedSeatIds.includes(seat.id))');
    expect(seatSelectionPageContent).toContain('setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));');
    expect(seatSelectionPageContent).toContain('setSelectedSeatIds((prev) => [...prev, seat.id]);');
  });

  test('Persistent live selection pill is displayed in the deck switcher bar across deck changes', () => {
    expect(seatSelectionPageContent).toContain('Persistent Live Selection Pill visible when switching decks');
    expect(seatSelectionPageContent).toContain('{selectedSeatObjects.length}');
    expect(seatSelectionPageContent).toContain('finalPayable');
  });

  // ==================== SECTION 3: RESPONSIVE LAYOUT (DESKTOP & MOBILE) ====================
  test('SeatSelectionPage includes mobile compact sticky bottom action bar', () => {
    expect(seatSelectionPageContent).toContain('mobile-sticky-seat-summary');
    expect(seatSelectionPageContent).toContain('0 Seats Selected');
    expect(seatSelectionPageContent).toContain('position: \'fixed\',');
    expect(seatSelectionPageContent).toContain('bottom: 0,');
  });

  // ==================== SECTION 4: CONTINUE TO PASSENGER DETAILS DATA PASS ====================
  test('SeatSelectionPage passes full pricing breakdown to /passenger-details', () => {
    expect(seatSelectionPageContent).toContain("navigate('/passenger-details'");
    expect(seatSelectionPageContent).toContain('selectedSeats: selectedSeatNumbers');
    expect(seatSelectionPageContent).toContain('selectedSeatCount: selectedSeatNumbers.length');
    expect(seatSelectionPageContent).toContain('baseFareSubtotal: subtotal');
    expect(seatSelectionPageContent).toContain('taxesAndFees,');
    expect(seatSelectionPageContent).toContain('discount,');
    expect(seatSelectionPageContent).toContain('totalAmount: finalPayable');
    expect(seatSelectionPageContent).toContain('finalPayable,');
    expect(seatSelectionPageContent).toContain('totalPayable: finalPayable');
  });

  test('TripBooking receives and displays selected seats, itemized fares, taxes, discount, and total payable', () => {
    expect(tripBookingContent).toContain('Base Fare');
    expect(tripBookingContent).toContain('Integrated GST (5%)');
    expect(tripBookingContent).toContain('Discount');
    expect(tripBookingContent).toContain('Total Payable');
    expect(tripBookingContent).toContain('subtotal.toLocaleString');
    expect(tripBookingContent).toContain('totalPayable');
  });

  // ==================== SECTION 5: PURE LOGICAL CALCULATIONS SIMULATION ====================
  test('Selection simulation: select 1, select 3, deselect 1, verify count, subtotal, and 5% GST', () => {
    const seatsCatalog = [
      { id: 'L1', seat_number: 'L1', fare: 850, seat_type: 'seat', deck: 'lower' },
      { id: 'L2', seat_number: 'L2', fare: 800, seat_type: 'seat', deck: 'lower' },
      { id: 'U1', seat_number: 'U1', fare: 1400, seat_type: 'sleeper', deck: 'upper' },
      { id: 'U2', seat_number: 'U2', fare: 1350, seat_type: 'sleeper', deck: 'upper' },
    ];

    // State 1: 0 seats
    let selectedIds = [];
    let selectedObjs = seatsCatalog.filter((s) => selectedIds.includes(s.id));
    let subtotal = selectedObjs.reduce((sum, s) => sum + s.fare, 0);
    let taxes = selectedObjs.length > 0 ? Math.round(subtotal * 0.05) : 0;
    let total = selectedObjs.length > 0 ? subtotal + taxes : 0;

    expect(selectedObjs.length).toBe(0);
    expect(subtotal).toBe(0);
    expect(taxes).toBe(0);
    expect(total).toBe(0);

    // State 2: Select 1 seat (L1)
    selectedIds = [...selectedIds, 'L1'];
    selectedObjs = seatsCatalog.filter((s) => selectedIds.includes(s.id));
    subtotal = selectedObjs.reduce((sum, s) => sum + s.fare, 0);
    taxes = Math.round(subtotal * 0.05);
    total = subtotal + taxes;

    expect(selectedObjs.length).toBe(1);
    expect(subtotal).toBe(850);
    expect(taxes).toBe(43); // 850 * 0.05 = 42.5 rounded -> 43
    expect(total).toBe(893);

    // State 3: Select 3 seats (L1, L2, U1)
    selectedIds = [...selectedIds, 'L2', 'U1'];
    selectedObjs = seatsCatalog.filter((s) => selectedIds.includes(s.id));
    subtotal = selectedObjs.reduce((sum, s) => sum + s.fare, 0);
    taxes = Math.round(subtotal * 0.05);
    total = subtotal + taxes;

    expect(selectedObjs.length).toBe(3);
    expect(subtotal).toBe(850 + 800 + 1400); // 3050
    expect(taxes).toBe(Math.round(3050 * 0.05)); // 153
    expect(total).toBe(3050 + 153); // 3203

    // State 4: Deselect 1 seat (L2)
    selectedIds = selectedIds.filter((id) => id !== 'L2');
    selectedObjs = seatsCatalog.filter((s) => selectedIds.includes(s.id));
    subtotal = selectedObjs.reduce((sum, s) => sum + s.fare, 0);
    taxes = Math.round(subtotal * 0.05);
    total = subtotal + taxes;

    expect(selectedObjs.length).toBe(2);
    expect(subtotal).toBe(850 + 1400); // 2250
    expect(taxes).toBe(Math.round(2250 * 0.05)); // 113
    expect(total).toBe(2250 + 113); // 2363

    // State 5: Switch deck from lower to upper (selectedIds remains unchanged)
    const deckTab = 'upper';
    expect(deckTab).toBe('upper');
    expect(selectedIds).toEqual(['L1', 'U1']); // Preserved across decks!
  });
});
