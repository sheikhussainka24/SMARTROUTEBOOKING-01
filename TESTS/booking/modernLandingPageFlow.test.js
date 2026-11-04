import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SMART ROUTE — Modern Landing Page & Search Flow Specifications', () => {
  const landingPagePath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/LandingPage.jsx');
  const navbarPath = path.resolve(__dirname, '../../FRONTEND/src/components/common/Navbar.jsx');
  const footerPath = path.resolve(__dirname, '../../FRONTEND/src/components/common/Footer.jsx');
  const routesPath = path.resolve(__dirname, '../../FRONTEND/src/routes/index.jsx');
  const searchTripsPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/SearchTrips.jsx');

  const landingPageContent = fs.readFileSync(landingPagePath, 'utf8');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  const footerContent = fs.readFileSync(footerPath, 'utf8');
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  const searchTripsContent = fs.readFileSync(searchTripsPath, 'utf8');

  // ==================== SECTION 1 & 2: TOP CONTACT BAR & NAVBAR ====================
  test('Top Contact Bar contains support email, phone +91 8072065549, and store download badges without agent/employee logins', () => {
    expect(navbarContent).toContain('+91 8072065549');
    expect(navbarContent).toContain('support@smartroutebooking.com');
    expect(navbarContent).toContain('Google Play');
    expect(navbarContent).toContain('App Store');
    expect(navbarContent).not.toContain('Employee Login');
    expect(navbarContent).not.toContain('Agent Login');
  });

  test('Navigation Header contains Brand Logo, specified 5 primary links, and no login buttons for staff/agents', () => {
    expect(navbarContent).toContain('BrandLogo');
    expect(navbarContent).toContain('Home');
    expect(navbarContent).toContain('Buses');
    expect(navbarContent).toContain('Offers');
    expect(navbarContent).toContain('About Us');
    expect(navbarContent).toContain('Contact');
    expect(navbarContent).not.toContain('Agent Login');
  });

  // ==================== SECTION 3: HERO BANNER & SEARCH WIDGET ====================
  test('Hero Banner & Search Widget includes luxury bus presentation and required input fields', () => {
    expect(landingPageContent).toContain('Book Your Journey');
    expect(landingPageContent).toContain('with Smart Route Booking');
    expect(landingPageContent).toContain('TRAVEL SMART');
    expect(landingPageContent).toContain('Your Journey, Our Promise');
    expect(landingPageContent).toContain('From');
    expect(landingPageContent).toContain('To');
    expect(landingPageContent).toContain('Journey Date');
    expect(landingPageContent).toContain('Return (Optional)');
    expect(landingPageContent).toContain('Passengers');
    expect(landingPageContent).toContain('Search Buses');
  });

  // ==================== SECTION 4: BOTTOM BENEFITS STRIP ====================
  test('Bottom Benefits Strip contains 4 compact feature items, red skyline artwork, and Travel Beyond slogan', () => {
    // 4 compact benefits
    expect(landingPageContent).toContain('Safe &amp; Secure');
    expect(landingPageContent).toContain('Travel with confidence');
    expect(landingPageContent).toContain('Premium Comfort');
    expect(landingPageContent).toContain('2+1 A/C Sleeper &amp; Seater');
    expect(landingPageContent).toContain('Wide Network');
    expect(landingPageContent).toContain('Across India');
    expect(landingPageContent).toContain('24/7 Support');
    expect(landingPageContent).toContain('Always here for you');

    // Artwork & Slogan
    expect(landingPageContent).toContain('Travel Beyond');
    expect(landingPageContent).toContain('trust-badges-ribbon');
  });

  // ==================== SECTION 5: OUR ROUTES — BUS TRAILER CARAVAN ====================
  test('Our Routes section renders moving Bus Trailer Caravan and excludes static direct corridors', () => {
    expect(landingPageContent).toContain('Our Routes');
    expect(landingPageContent).toContain('Our Extensive Bus Routes Connect You To Major Cities And Destinations');
    expect(landingPageContent).toContain('BusRoutesCaravan');
    expect(landingPageContent).not.toContain('Direct Intercity Express Corridors');
    expect(landingPageContent).not.toContain('popularRoutes');
  });

  // ==================== SECTION 6: VALUE PROPOSITION ====================
  test('Value Proposition ("Facilities We Provide") has 2-column layout and 3 vertical feature cards', () => {
    expect(landingPageContent).toContain('Facilities We Provide');
    expect(landingPageContent).toContain('Smart and Simple Booking for a Smooth and Hassle-Free Travel Experience');
    expect(landingPageContent).toContain('1. Book and Manage Your Trip');
    expect(landingPageContent).toContain('2. Track Your Boarding Point Status');
    expect(landingPageContent).toContain('3. Fast Booking');
  });

  // ==================== SECTION 7: ABOUT SECTION ====================
  test('About Section ("Who We Are") features mission statement, Discover More button, and coach visual', () => {
    expect(landingPageContent).toContain('WHO WE ARE');
    expect(landingPageContent).toContain('Pioneering Modern Intercity Coach Travel Across India');
    expect(landingPageContent).toContain('Discover More');
    expect(landingPageContent).toContain('LUXURY CABIN EXPERIENCE');
  });

  // ==================== SECTION 8: AMENITIES GRID ====================
  test('Amenities Grid ("Features We Provide") contains "Comfy Travel That All You Need" with 6 cards', () => {
    expect(landingPageContent).toContain('FEATURES WE PROVIDE');
    expect(landingPageContent).toContain('Comfy Travel That All You Need');
    expect(landingPageContent).toContain('Comfortable Seating');
    expect(landingPageContent).toContain('Surveillance Cameras');
    expect(landingPageContent).toContain('Emergency Exits');
    expect(landingPageContent).toContain('Fire Extinguishers');
    expect(landingPageContent).toContain('Online Booking and Payments');
    expect(landingPageContent).toContain('Customer Support');
  });

  // ==================== SECTION 9: MOBILE APP PROMOTION ====================
  test('Mobile App Promotion section excludes "Our Gallery" and features app badges with device mockup', () => {
    expect(landingPageContent).toMatch(/Instant Booking At Your Fingertips\s*(?:—|&mdash;|-)\s*Download Our Mobile App/);
    expect(landingPageContent).toContain('Google Play');
    expect(landingPageContent).toContain('App Store');
    expect(landingPageContent).toContain('Live Radar: 4.2 km away');

    // Strictly exclude "Our Gallery"
    expect(landingPageContent).not.toMatch(/Our\s+Gallery/i);
  });

  // ==================== SECTION 10: DARK FOOTER ====================
  test('Dark Footer has deep dark background, wavy top divider border, and official contact phone and email', () => {
    expect(footerContent).toContain('#0F172A');
    expect(footerContent).toContain('Useful Links');
    expect(footerContent).toContain('Support &amp; Policies');
    expect(footerContent).toContain('Get In Touch');
    expect(footerContent).toContain('support@smartroutebooking.com');
    expect(footerContent).toContain('+91 8072065549');
    expect(footerContent).toContain('M0,0 C150,90'); // Wavy SVG path
  });

  // ==================== NAVIGATION ROUTING & BUS RESULTS BEHAVIOR ====================
  test('Landing Page strictly contains NO in-page bus list, seat layouts, or results cards', () => {
    expect(landingPageContent).not.toContain('TataPrakashSeatLayout');
    expect(landingPageContent).not.toContain('View Seats');
    expect(landingPageContent).not.toContain('FilterSidebar');
  });

  test('Landing Page redirects unauthenticated searches to /login preserving criteria or to /search-results when authenticated', () => {
    expect(landingPageContent).toContain('/search-results?');
    expect(landingPageContent).toContain('/login?redirect=');
  });

  test('Dedicated Results Page (/search-results) features Sticky Top Header with Modify Search button', () => {
    expect(searchTripsContent).toContain('sticky-route-summary-header');
    expect(searchTripsContent).toContain('Modify Search');
    expect(searchTripsContent).toContain('Close Search');
    expect(searchTripsContent).toContain('FilterSidebar');
    expect(searchTripsContent).toContain('View Seats');
    expect(searchTripsContent).toContain('TataPrakashSeatLayout');
  });

  test('AppRoutes correctly maps / to LandingPage and /search-results to SearchTrips', () => {
    expect(routesContent).toContain('LandingPage');
    expect(routesContent).toContain('<Route path="/" element={<LandingPage />} />');
    expect(routesContent).toContain('<Route path="/search-results" element={<SearchTrips />} />');
    expect(routesContent).toContain('<Route path="/offers" element={<OffersPage />} />');
    expect(routesContent).toContain('<Route path="/about" element={<AboutPage />} />');
    expect(routesContent).toContain('<Route path="/contact" element={<ContactPage />} />');
  });
});
