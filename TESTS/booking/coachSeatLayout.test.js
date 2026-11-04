import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SMART ROUTE — Authentic 2+1 Vertical Sleeper & Seater Coach Layout (CoachSeatLayout.jsx)', () => {
  const coachLayoutPath = path.resolve(__dirname, '../../FRONTEND/src/components/seats/CoachSeatLayout.jsx');
  const coachContent = fs.readFileSync(coachLayoutPath, 'utf8');

  // ==================== SECTION 1: 48-SEAT TATA CAPELLA EXECUTIVE DATA SPECIFICATION ====================
  test('CoachSeatLayout implements authentic 48-seat configuration (30 Lower + 18 Upper)', () => {
    // 48-seat layout configuration
    expect(coachContent).toContain('48-SEAT 2+1');
    expect(coachContent).not.toContain('TATA LPO 1618 Tata Capella Executive Coach');
    expect(coachContent).toContain('lowerDeckRows');
    expect(coachContent).toContain('upperDeckRows');
  });

  test('Lower Deck: Left Column implements 6 Single Vertical Sleepers (SL1 to SL6) @ ₹850 with SL5 test state', () => {
    expect(coachContent).toContain('SL1');
    expect(coachContent).toContain('SL6');
    expect(coachContent).toContain("type: 'sleeper_lower'");
    expect(coachContent).toContain('price: backendSleeper?.fare ? Number(backendSleeper.fare) : 850');
    expect(coachContent).toContain("sleeperStatus = 'booked'");
    expect(coachContent).toContain("sleeperGender = 'female'"); // SL5 test state
  });

  test('Lower Deck: Right Column implements 24 Pushback Seaters in 6 sets of 4 (S1 to S24) @ ₹550 vertically aligned with SL1-SL6', () => {
    expect(coachContent).toContain('S1');
    expect(coachContent).toContain('S24');
    expect(coachContent).toContain("type: 'seater'");
    expect(coachContent).toContain('price: backendSeat?.fare ? Number(backendSeat.fare) : 550');
    expect(coachContent).toContain('subRow1');
    expect(coachContent).toContain('subRow2');
    expect(coachContent).toContain('h-20'); // Exact height alignment with 1 vertical sleeper
  });

  test('Upper Deck: Left Column implements 6 Single Vertical Sleepers (U1 to U6) @ ₹1150 / ₹950', () => {
    expect(coachContent).toContain('U1');
    expect(coachContent).toContain('U6');
    expect(coachContent).toContain("type: 'sleeper_upper_single'");
    expect(coachContent).toContain('1150');
  });

  test('Upper Deck: Right Column implements 12 Double Vertical Sleepers (U7-U18) with individual berth partitions @ ₹950', () => {
    expect(coachContent).toContain('U7');
    expect(coachContent).toContain('U18');
    expect(coachContent).toContain("type: 'sleeper_upper_double'");
    expect(coachContent).toContain('950');
    expect(coachContent).toContain('Individual Berth Partition Divider');
  });

  // ==================== SECTION 2: COMPONENT VISUAL HIERARCHY & TAILWIND DESIGN TOKENS ====================
  test('Deck containers match pure white rounded-2xl cards with #F1EDFA borders', () => {
    expect(coachContent).toContain('bg-white rounded-2xl border border-[#F1EDFA] p-5 shadow-sm');
  });

  test('Header labels show deep plum deck title and driver steering icon without text badges', () => {
    expect(coachContent).toContain('bg-[#FFF1F6] text-[#C13D78]');
    expect(coachContent).not.toContain('STAIRCASE / ENTRY');
    expect(coachContent).not.toContain('STAIRWAY LANDING');
    expect(coachContent).not.toContain('DRIVER CABIN');
    expect(coachContent).toContain('LOWER DECK');
    expect(coachContent).toContain('UPPER DECK');
    expect(coachContent).toContain('text-[#24152D]');
    expect(coachContent).toContain('SteeringWheelIcon');
  });

  test('Rear indicator removes REAR • EMERGENCY EXIT text and preserves clean aesthetic', () => {
    expect(coachContent).not.toContain('REAR • EMERGENCY EXIT');
  });

  test('Seat states match exact visual design tokens for Seater, Vertical Sleeper, Selected, Booked, and Ladies Reserved', () => {
    // Available Seater
    expect(coachContent).toContain('bg-white border-1.5 border-[#E7A0BF] text-[#24152D] hover:border-[#C13D78]');
    // Available Vertical Sleeper
    expect(coachContent).toContain('bg-white border-1.5 border-[#E7A0BF] text-[#24152D] rounded-md relative hover:shadow-md');
    expect(coachContent).toContain('bg-[#FCE7F3] rounded-sm');
    // Selected Berth/Seat with translucent white pillow
    expect(coachContent).toContain('bg-[#C13D78] border-1.5 border-[#9E1B55] text-white font-bold scale-105 transition-all shadow-md');
    expect(coachContent).toContain('bg-white/40');
    // Booked Seat
    expect(coachContent).toContain('bg-gray-100 border-1.5 border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none');
    // Ladies Reserved
    expect(coachContent).toContain('bg-rose-50 border-1.5 border-rose-300 text-rose-500');
  });

  // ==================== SECTION 3: INTERACTIVE SELECTION LOGIC & PRICING ====================
  test('Enforces multi-seat selection capped at max 6 seats with exact payload structure', () => {
    expect(coachContent).toContain('selectedSeats.length >= 6');
    expect(coachContent).toContain("alert('Maximum 6 seats per booking reservation.');");
    expect(coachContent).toContain("type: isSleeper ? 'sleeper' : 'seater'");
    expect(coachContent).toContain('deck: seat.deck');
    expect(coachContent).toContain('price: seat.price');
  });

  test('Calculates total fare and renders bottom floating summary bar with seat pills and Proceed button', () => {
    expect(coachContent).toContain('totalCalculatedFare');
    expect(coachContent).toContain('Total Calculated Fare:');
    expect(coachContent).toContain('data-testid="total-amount"');
    expect(coachContent).toContain('Proceed to Passenger Details');
    expect(coachContent).toContain('disabled={selectedSeats.length === 0}');
  });

  test('Transfers complete booking state and preserved payload to /passenger-details on proceed', () => {
    expect(coachContent).toContain("navigate('/passenger-details'");
    expect(coachContent).toContain('busId:');
    expect(coachContent).toContain('operatorName,');
    expect(coachContent).toContain('serviceNumber,');
    expect(coachContent).toContain('selectedSeats:');
    expect(coachContent).toContain('farePerSeat,');
    expect(coachContent).toContain('totalAmount: totalCalculatedFare');
    expect(coachContent).toContain('boardingPoint: selectedBoardingPoint');
    expect(coachContent).toContain('droppingPoint: selectedDroppingPoint');
    expect(coachContent).toContain('travelDate,');
  });

  // ==================== SECTION 4: DECK SWITCHING & RESPONSIVENESS ====================
  test('Implements deck switching tabs for Both Decks View, Lower Deck, and Upper Deck', () => {
    expect(coachContent).toContain('Both Decks View');
    expect(coachContent).toContain('Lower Deck');
    expect(coachContent).toContain('Upper Deck');
    expect(coachContent).toContain("activeDeckTab === 'both'");
    expect(coachContent).toContain("grid-cols-1 lg:grid-cols-2");
  });

  test('Supports responsive mobile layout and minimum touch targets', () => {
    expect(coachContent).toContain('touch-manipulation');
    expect(coachContent).toContain('min-w-[40px]');
  });

  // ==================== SECTION 5: LAYOUT 2 (VOLVO 9600 36-BERTH FULL SLEEPER) SPECIFICATION ====================
  test('Layout 2 implements 36-Berth configuration across Lower and Upper Decks without branding', () => {
    expect(coachContent).toContain('36-BERTH SLEEPER');
    expect(coachContent).not.toContain('VOLVO 9600 36-BERTH FULL SLEEPER');
    expect(coachContent).toContain('layout2LowerDeckRows');
    expect(coachContent).toContain('layout2UpperDeckRows');
  });

  test('Layout 2 Lower Deck: 6 Single Sleepers (L1 to L6) @ ₹950 and 6 pairs of Double Sleepers (L7-L18) @ ₹850', () => {
    expect(coachContent).toContain('L1');
    expect(coachContent).toContain('L6');
    expect(coachContent).toContain("type: 'sleeper_lower_single'");
    expect(coachContent).toContain('price: backendLSingle?.fare ? Number(backendLSingle.fare) : 950');
    expect(coachContent).toContain('L7');
    expect(coachContent).toContain('L18');
    expect(coachContent).toContain("type: 'sleeper_lower_double'");
    expect(coachContent).toContain('price: bD1?.fare ? Number(bD1.fare) : 850');
    expect(coachContent).toContain("sleeperGender = 'female'"); // L5 ladies reserved test state
  });

  test('Layout 2 Upper Deck: 6 Single Sleepers (U1 to U6) @ ₹1150 and 6 pairs of Double Sleepers (U7-U18) @ ₹1050', () => {
    expect(coachContent).toContain("type: 'sleeper_upper_single'");
    expect(coachContent).toContain('1150');
    expect(coachContent).toContain('1050');
    expect(coachContent).toContain("activeLayout === 'Fully Sleeper' ? 1050 : 950");
  });

  test('Layout 2 Berths feature w-11 h-20 vertical orientation (~1:2 aspect ratio) with distinct pillow indicator', () => {
    expect(coachContent).toContain('w-11 h-20');
    expect(coachContent).toContain('min-w-[44px]');
    expect(coachContent).toContain('min-h-[80px]');
    expect(coachContent).toContain('Pillow / Headrest Indicator at Top');
  });

  test('Layout 2 implements Soft-Pink design tokens for Available, Selected, Booked, and Ladies Reserved berths', () => {
    // Available Berth: Pure White (#FFFFFF), border (#E7A0BF), headrest (#FCE7F3), Deep Plum text (#24152D)
    expect(coachContent).toContain('#FFFFFF');
    expect(coachContent).toContain('#E7A0BF');
    expect(coachContent).toContain('#FCE7F3');
    expect(coachContent).toContain('#24152D');
    // Selected Berth: Rose Pink (#C13D78), border (#9E1B55), white bold text, glow shadow
    expect(coachContent).toContain('bg-[#C13D78] border-1.5 border-[#9E1B55] text-white font-bold scale-105 transition-all shadow-md');
    // Booked Berth: Muted Gray (#F3F4F6), border (#D1D5DB), disabled pointer events
    expect(coachContent).toContain('bg-[#F3F4F6] border-1.5 border-[#D1D5DB] text-gray-400 cursor-not-allowed pointer-events-none');
    // Ladies Berth: Soft Rose tint (#FFF1F2) with pink border (#FDA4AF)
    expect(coachContent).toContain('bg-[#FFF1F2] border-1.5 border-[#FDA4AF] text-rose-500 cursor-not-allowed pointer-events-none');
  });

  test('Dynamic Bus Type Support handles bus.type === "2+1 Sleeper/Seater" and bus.type === "Fully Sleeper"', () => {
    expect(coachContent).toContain("bus?.type === 'Fully Sleeper'");
    expect(coachContent).toContain("bus?.type === '2+1 Sleeper/Seater'");
    expect(coachContent).toContain("activeLayout === 'Fully Sleeper'");
    expect(coachContent).toContain('Fully Sleeper (36 Berths)');
    expect(coachContent).toContain('2+1 Sleeper/Seater (48 Seats)');
  });

  // ==================== SECTION 6: LAYOUT 3 (FULLY 2+2 A/C PUSHBACK SEATER COACH - 40 SEATS) SPECIFICATION ====================
  test('Layout 3 implements 40-Seat Single Deck configuration (S1 to S40) without branding inside map', () => {
    expect(coachContent).toContain('40-SEAT 2+2');
    expect(coachContent).not.toContain('Ashok Leyland / BharatBenz Intercity Express');
    expect(coachContent).toContain('layout3SeaterRows');
    expect(coachContent).toContain('2+2 Pushback Seater Coach (40 Seats)');
    expect(coachContent).toContain('Fully 2+2 Seater (40 Seats)');
  });

  test('Layout 3 Single Deck Behavior hides Upper Deck & Both Decks view tabs, rendering ONLY Lower Deck container', () => {
    // Deck tabs omitted for single deck
    expect(coachContent).toContain('!isSeaterLayout');
    // Renders ONLY Lower Deck container centered horizontally with max-w-xl mx-auto
    expect(coachContent).toContain('LOWER DECK ONLY');
    expect(coachContent).toContain('bg-white rounded-2xl border border-[#F1EDFA] p-6 shadow-sm max-w-xl mx-auto');
  });

  test('Layout 3 implements 2+2 Grid Seating Array with 10 rows (S1-S40), central walking gangway (gap-8 md:gap-12), and base price ₹550', () => {
    // 10 Rows total (S1-S4 to S37-S40)
    expect(coachContent).toContain('r < 10');
    // Aisle / Gangway gap
    expect(coachContent).toContain('gap-8 md:gap-12');
    expect(coachContent).toContain('WALKING AISLE');
    // Base Price ₹550 per seat
    expect(coachContent).toContain('backendSeat?.fare ? Number(backendSeat.fare) : 550');
    // Window & Aisle labels
    expect(coachContent).toContain('WINDOW & AISLE');
    expect(coachContent).toContain('AISLE & WINDOW');
  });

  test('Layout 3 visual tokens: deep plum LOWER DECK ONLY, driver steering icon only, no PASSENGER ENTRY or REAR EXIT text', () => {
    expect(coachContent).not.toContain('PASSENGER ENTRY');
    expect(coachContent).not.toContain('ENTRY DOOR');
    expect(coachContent).not.toContain('DRIVER CABIN');
    expect(coachContent).toContain('SteeringWheelIcon');
    expect(coachContent).not.toContain('REAR • EMERGENCY EXIT');
  });

  test('Layout 3 seat styling tokens match exact specifications for Available, Selected, Booked, and Ladies Seat', () => {
    // Available Seater
    expect(coachContent).toContain('bg-white border-1.5 border-[#E7A0BF] text-[#24152D] rounded-md hover:border-[#C13D78] transition-all');
    // Selected Seater
    expect(coachContent).toContain('bg-[#C13D78] border-[#9E1B55] text-white font-bold scale-105 shadow-md');
    // Booked Seat
    expect(coachContent).toContain('bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none');
    // Ladies Seat
    expect(coachContent).toContain('bg-rose-50 border-rose-300 text-rose-500');
  });

  test('Dynamic Bus Type Routing accurately switches layout for combo (Layout 1), sleeper (Layout 2), and seater (Layout 3)', () => {
    expect(coachContent).toContain("bus?.layoutType === 'combo'");
    expect(coachContent).toContain("bus?.layoutType === 'sleeper'");
    expect(coachContent).toContain("bus?.layoutType === 'seater'");
    expect(coachContent).toContain("bus?.busType === 'seater'");
    expect(coachContent).toContain("layoutType === 'seater'");
    expect(coachContent).toContain("setActiveLayout('seater')");
  });

  // ==================== SECTION 7: LAYOUT 4 (VOLVO 9600 CLUB CLASS WITH ONBOARD WASHROOM - 34 BERTHS) SPECIFICATION ====================
  test('Layout 4 implements 34-Berths configuration with Onboard Washroom without Volvo branding in map', () => {
    expect(coachContent).toContain('34-BERTH SLEEPER');
    expect(coachContent).not.toContain('VOLVO 9600 CLUB CLASS WITH ONBOARD WASHROOM');
    expect(coachContent).toContain('layout4LowerDeckRows');
    expect(coachContent).toContain('layout4UpperDeckRows');
    expect(coachContent).toContain('2+1 Sleeper + Washroom (34 Berths)');
  });

  test('Layout 4 Lower Deck implements 16 Berths (L1-L6 single, L7-L16 double) + Row 6 Onboard Restroom without fare text in headers', () => {
    expect(coachContent).toContain('L1');
    expect(coachContent).toContain('L6');
    expect(coachContent).toContain('L7');
    expect(coachContent).toContain('L16');
    expect(coachContent).toContain('backendLSingle?.fare ? Number(backendLSingle.fare) : 1050');
    expect(coachContent).toContain('isRestroom: r === 5');
    expect(coachContent).toContain('SINGLE');
    expect(coachContent).toContain('DOUBLE & WC');
    expect(coachContent).not.toContain('SINGLE (₹1050)');
  });

  test('Layout 4 Onboard Restroom Box matches non-clickable amenity card with RestroomWCIcon, RESTROOM / WC, and Sanitized Bio-Toilet', () => {
    expect(coachContent).toContain('bg-sky-50 border border-sky-200 rounded-lg p-2 text-center');
    expect(coachContent).toContain('RestroomWCIcon');
    expect(coachContent).toContain('RESTROOM / WC');
    expect(coachContent).toContain('Sanitized Bio-Toilet');
    expect(coachContent).toContain('pointer-events-none');
    expect(coachContent).toContain('Onboard Restroom');
  });

  test('Layout 4 Upper Deck implements 18 Berths without fare text in headers', () => {
    expect(coachContent).toContain('backendSingle?.fare ? Number(backendSingle.fare) : 1200');
    expect(coachContent).toContain('U7');
    expect(coachContent).toContain('U18');
    expect(coachContent).toContain('SINGLE');
    expect(coachContent).toContain('DOUBLE');
    expect(coachContent).not.toContain('SINGLE (₹1200)');
  });

  test('Layout 4 adjacent berths (L6, L15, L16) feature Near WC subtle badge', () => {
    expect(coachContent).toContain('Near WC');
    expect(coachContent).toContain("berth.id === 'L6' || berth.id === 'L15' || berth.id === 'L16'");
  });

  test('Dynamic Bus Layout Switcher handles all 6 commercial layouts seamlessly (combo, sleeper, seater, sleeper_washroom, sleeper_washroom_front, seater_washroom)', () => {
    expect(coachContent).toContain("bus?.layoutType === 'sleeper_washroom'");
    expect(coachContent).toContain("bus?.busType === 'sleeper_washroom'");
    expect(coachContent).toContain("layoutType === 'sleeper_washroom'");
    expect(coachContent).toContain("setActiveLayout('sleeper_washroom')");
    expect(coachContent).toContain('hasWashroomAmenity');
    expect(coachContent).toContain("bus?.layoutType === 'sleeper_washroom_front'");
    expect(coachContent).toContain("setActiveLayout('sleeper_washroom_front')");
    expect(coachContent).toContain("bus?.layoutType === 'seater_washroom'");
    expect(coachContent).toContain("setActiveLayout('seater_washroom')");
  });

  // ==================== SECTION 8: LAYOUT 5 (VOLVO 9600 CLUB CLASS WITH FRONT RESTROOM - 35 BERTHS) SPECIFICATION ====================
  test('Layout 5 implements Front Onboard Restroom Replacing L1 (35 Berths: 17 Lower + 18 Upper) without Volvo branding in map', () => {
    expect(coachContent).toContain('35-BERTH SLEEPER');
    expect(coachContent).toContain('FRONT WC ONBOARD');
    expect(coachContent).not.toContain('VOLVO 9600 CLUB CLASS WITH FRONT RESTROOM');
    expect(coachContent).toContain('layout5LowerDeckRows');
    expect(coachContent).toContain('layout5UpperDeckRows');
    expect(coachContent).toContain('2+1 Sleeper + Front WC (35 Berths)');
  });

  test('Layout 5 Lower Deck implements 17 Berths (L2-L6 single @ ₹1050, L7-L18 double @ ₹950) + Row 1 Front Restroom WC replacing L1', () => {
    expect(coachContent).toContain('L2');
    expect(coachContent).toContain('L6');
    expect(coachContent).toContain('L7');
    expect(coachContent).toContain('L18');
    expect(coachContent).toContain('1 Front Restroom + 5 Single Sleepers + Aisle + 12 Double Sleepers (17 Berths + WC)');
    expect(coachContent).toContain('isRestroom: isRow1');
  });

  test('Layout 5 Front Restroom Box matches tall vertical card footprint replacing L1 with soft blue tint, RestroomWCIcon, REST, ROOM, and WC', () => {
    expect(coachContent).toContain('w-11 h-20 min-w-[44px] min-h-[80px] bg-sky-50 border border-sky-300 rounded-md flex flex-col items-center justify-center p-1 text-center select-none pointer-events-none');
    expect(coachContent).toContain('RestroomWCIcon');
    expect(coachContent).toContain('REST');
    expect(coachContent).toContain('ROOM');
    expect(coachContent).toContain('WC');
    expect(coachContent).toContain('pointer-events-none');
  });

  test('Layout 5 Upper Deck implements 18 Berths (U1-U6 single @ ₹1200, U7-U18 double @ ₹1050)', () => {
    expect(coachContent).toContain('layout5UpperDeckRows');
    expect(coachContent).toContain('U1');
    expect(coachContent).toContain('U6');
    expect(coachContent).toContain('U7');
    expect(coachContent).toContain('U18');
  });

  test('Layout 5 adjacent berths (L2, L7, L8) feature Near WC subtle badge', () => {
    expect(coachContent).toContain('Near WC');
    expect(coachContent).toContain("berth.id === 'L2' || berth.id === 'L7' || berth.id === 'L8'");
  });

  // ==================== SECTION 9: LAYOUT 6 (2+2 PUSHBACK SEATER WITH REAR ONBOARD RESTROOM - 38 SEATS + 1 WC) SPECIFICATION ====================
  test('Layout 6 implements 38-Seat 2+2 Pushback Seater Coach with Onboard Restroom without brand names in map', () => {
    expect(coachContent).toContain('38-SEAT 2+2');
    expect(coachContent).toContain('WC ONBOARD');
    expect(coachContent).not.toContain('BharatBenz / Volvo Intercity Express');
    expect(coachContent).toContain('layout6SeaterRows');
    expect(coachContent).toContain('2+2 Seater + Washroom (38 Seats)');
    expect(coachContent).toContain("setActiveLayout('seater_washroom')");
    expect(coachContent).toContain('isWashroomSeaterLayout');
  });

  test('Layout 6 Single Deck Constraints completely hides Upper Deck and deck view switcher tabs, centering Lower Deck container', () => {
    expect(coachContent).toContain('!isSeaterLayout && !isWashroomSeaterLayout');
    expect(coachContent).toContain('LOWER DECK ONLY');
    expect(coachContent).toContain('2+2 Pushback Seater Coach with Rear Washroom (38 Seats + WC)');
    expect(coachContent).toContain('max-w-xl mx-auto');
  });

  test('Layout 6 implements 2+2 Grid Seating Array with Rows 1-9 (S1 to S36) and Row 10 (S37, S38 + Rear Restroom replacing S39 & S40) @ ₹650', () => {
    expect(coachContent).toContain('price: backendSeat?.fare ? Number(backendSeat.fare) : 650');
    expect(coachContent).toContain('Available Pushback Seater (₹650)');
    expect(coachContent).toContain('WINDOW & AISLE');
    expect(coachContent).toContain('AISLE & WINDOW');
    expect(coachContent).toContain('WALKING AISLE');
    expect(coachContent).toContain('isRestroom: isRow10');
  });

  test('Layout 6 Onboard Restroom Box matches non-interactive card spanning 2 chairs with RestroomWCIcon, RESTROOM / WC, and Sanitized Bio-Toilet', () => {
    expect(coachContent).toContain('w-24 sm:w-26 h-9 bg-sky-50 border border-sky-300 rounded-lg p-2 text-center pointer-events-none select-none');
    expect(coachContent).toContain('RestroomWCIcon');
    expect(coachContent).toContain('RESTROOM / WC');
    expect(coachContent).toContain('Sanitized Bio-Toilet');
    expect(coachContent).toContain('pointer-events-none');
  });

  test('Layout 6 implements exact seat styling tokens for Available (#FFFFFF, #E7A0BF, #24152D), Selected (#C13D78), Booked, and Ladies Seat', () => {
    expect(coachContent).toContain('bg-white border-1.5 border-[#E7A0BF]');
    expect(coachContent).toContain('bg-[#C13D78] border-[#9E1B55]');
    expect(coachContent).toContain('bg-[#F3F4F6] border-[#D1D5DB]');
    expect(coachContent).toContain('bg-[#FFF1F2] border-[#FDA4AF]');
  });

  test('Configuration Switcher supports all 6 commercial layouts with responsive design and auto fare summing', () => {
    expect(coachContent).toContain("'2+1 Sleeper/Seater'");
    expect(coachContent).toContain("'Fully Sleeper'");
    expect(coachContent).toContain("'seater'");
    expect(coachContent).toContain("'sleeper_washroom'");
    expect(coachContent).toContain("'sleeper_washroom_front'");
    expect(coachContent).toContain("'seater_washroom'");
  });
});
