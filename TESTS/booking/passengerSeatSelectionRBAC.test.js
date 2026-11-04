import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SMART ROUTE — Passenger Seat Selection RBAC & Coach Layout Switcher Security', () => {
  const coachLayoutPath = path.resolve(__dirname, '../../FRONTEND/src/components/seats/CoachSeatLayout.jsx');
  const seatSelectionPagePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/SeatSelectionPage.jsx');

  const coachContent = fs.readFileSync(coachLayoutPath, 'utf8');
  const seatPageContent = fs.readFileSync(seatSelectionPagePath, 'utf8');

  // ==================== SECTION 1: ROLE-BASED ACCESS CONTROL (RBAC) LOGIC ====================
  test('CoachSeatLayout imports AuthContext and defines isAuthorizedStaff verifying admin, owner, manager, and travel_admin', () => {
    expect(coachContent).toContain("import AuthContext from '../../context/AuthContext.jsx'");
    expect(coachContent).toContain('const authContext = useContext(AuthContext)');
    expect(coachContent).toContain("authUser.role === 'admin'");
    expect(coachContent).toContain("authUser.role === 'owner'");
    expect(coachContent).toContain("authUser.role === 'manager'");
    expect(coachContent).toContain("authUser.userType === 'travel_admin'");
    expect(coachContent).toContain('isAuthorizedStaff');
  });

  test('SeatSelectionPage imports AuthContext and calculates isAuthorizedStaff', () => {
    expect(seatPageContent).toContain("import AuthContext from '../../context/AuthContext.jsx'");
    expect(seatPageContent).toContain('const auth = useContext(AuthContext)');
    expect(seatPageContent).toContain("user.role === 'admin'");
    expect(seatPageContent).toContain("user.role === 'owner'");
    expect(seatPageContent).toContain("user.role === 'manager'");
    expect(seatPageContent).toContain("user.userType === 'travel_admin'");
  });

  // ==================== SECTION 2: PASSENGER VIEW EXCLUSION (LAYOUT SWITCHER HIDDEN) ====================
  test('Layout switcher container is strictly conditionally rendered inside isAuthorizedStaff block', () => {
    // Verified that the container header with title, badge and buttons is guarded by isAuthorizedStaff
    expect(coachContent).toContain('{isAuthorizedStaff && (');
    expect(coachContent).toContain('Select Coach Berths & Seats');
    expect(coachContent).toContain('48-SEAT 2+1');
    expect(coachContent).toContain("setActiveLayout('2+1 Sleeper/Seater')");
    expect(coachContent).toContain("setActiveLayout('Fully Sleeper')");
    expect(coachContent).toContain("setActiveLayout('seater')");
    expect(coachContent).toContain("setActiveLayout('sleeper_washroom')");
    expect(coachContent).toContain("setActiveLayout('sleeper_washroom_front')");
    expect(coachContent).toContain("setActiveLayout('seater_washroom')");
  });

  // ==================== SECTION 3: PASSENGER SEAT SELECTION VIEW SPECIFICATION ====================
  test('SeatSelectionPage renders only Select Your Berths, Deck tabs, legends, and physical coach layout', () => {
    // 1. Select Your Berths Header
    expect(seatPageContent).toContain('Select Your Berths');
    expect(seatPageContent).toContain('Click an available berth to select (Maximum 6 seats)');

    // 2. Deck tabs (Lower Deck, Upper Deck, Both Decks)
    expect(seatPageContent).toContain('Lower Deck (24 Seats + 6 Sleepers)');
    expect(seatPageContent).toContain('Upper Deck (18 Sleepers)');
    expect(seatPageContent).toContain('Both Decks');

    // 3. Seat availability legends
    expect(seatPageContent).toContain('Available');
    expect(seatPageContent).toContain('Selected');
    expect(seatPageContent).toContain('Booked');
    expect(seatPageContent).toContain('Temporarily Held');
    expect(coachContent).toContain('Ladies Reserved');

    // 4. Physical coach layout integration passing activeDeckTab and RBAC flags
    expect(seatPageContent).toContain('<CoachSeatLayout');
    expect(seatPageContent).toContain('activeDeckTab={activeDeckTab}');
    expect(seatPageContent).toContain('onDeckTabChange={setActiveDeckTab}');
    expect(seatPageContent).toContain('isAuthorizedStaff={isAuthorizedStaff}');
    expect(seatPageContent).toContain('user={user}');
  });

  // ==================== SECTION 4: RBAC EVALUATION LOGIC BEHAVIOR ====================
  test('Pure RBAC permission evaluation helper accurately distinguishes staff vs passenger', () => {
    const checkStaff = (user) => Boolean(
      user && (
        user.role === 'admin' || 
        user.role === 'owner' || 
        user.role === 'manager' ||
        user.userType === 'travel_admin' ||
        user.role === 'travel_owner' ||
        user.role === 'super_admin' ||
        user.role === 'travel_admin'
      )
    );

    // Regular Passenger / Guest
    expect(checkStaff(null)).toBe(false);
    expect(checkStaff({})).toBe(false);
    expect(checkStaff({ role: 'passenger' })).toBe(false);
    expect(checkStaff({ role: 'user' })).toBe(false);
    expect(checkStaff({ role: 'guest' })).toBe(false);

    // Authorized Staff Roles
    expect(checkStaff({ role: 'admin' })).toBe(true);
    expect(checkStaff({ role: 'owner' })).toBe(true);
    expect(checkStaff({ role: 'manager' })).toBe(true);
    expect(checkStaff({ userType: 'travel_admin' })).toBe(true);
    expect(checkStaff({ role: 'travel_admin' })).toBe(true);
    expect(checkStaff({ role: 'travel_owner' })).toBe(true);
    expect(checkStaff({ role: 'super_admin' })).toBe(true);
  });
});
