import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SMART ROUTE — Landing Page Hero Section & Navbar Specifications', () => {
  const navbarPath = path.resolve(__dirname, '../../FRONTEND/src/components/common/Navbar.jsx');
  const landingHeroPath = path.resolve(__dirname, '../../FRONTEND/src/components/passenger/LandingHero.jsx');
  const searchTripsPath = path.resolve(__dirname, '../../FRONTEND/src/pages/passenger/SearchTrips.jsx');

  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  const landingHeroContent = fs.readFileSync(landingHeroPath, 'utf8');
  const searchTripsContent = fs.readFileSync(searchTripsPath, 'utf8');

  // ==================== 1. TOP UTILITY BAR & MAIN NAVBAR ====================
  test('Top Utility Bar includes support email, phone +91 8072065549, and store badges without employee/agent login', () => {
    // Contact email and phone
    expect(navbarContent).toContain('support@smartroutebooking.com');
    expect(navbarContent).toContain('+91 8072065549');

    // Right links & CTA
    expect(navbarContent).toContain('Google Play');
    expect(navbarContent).toContain('App Store');
    expect(navbarContent).not.toContain('Employee Login');
    expect(navbarContent).not.toContain('Agent Login');
  });

  test('Main Navbar includes Brand Logo, 5 Nav links (Home, Buses, Offers, About Us, Contact), and active state', () => {
    // Official Logo
    expect(navbarContent).toContain('BrandLogo');

    // Nav links
    expect(navbarContent).toContain('Home');
    expect(navbarContent).toContain('Buses');
    expect(navbarContent).toContain('Offers');
    expect(navbarContent).toContain('About Us');
    expect(navbarContent).toContain('Contact');

    // Active underline in #C13D78
    expect(navbarContent).toContain('#C13D78');
  });

  // ==================== 2. HERO SHOWCASE SECTION (TWO-COLUMN DESKTOP SPLIT) ====================
  test('Hero section features Left Content Area value proposition', () => {
    // Eyebrow Badge
    expect(landingHeroContent).toMatch(/TRAVEL SMART(?:[\s]|&nbsp;)*\/(?:[\s]|&nbsp;)*SAFE(?:[\s]|&nbsp;)*\/(?:[\s]|&nbsp;)*COMFORTABLE/);

    // Main Headline
    expect(landingHeroContent).toContain('Book Your Journey with');
    expect(landingHeroContent).toContain('Smart Route Booking');

    // Subtitle
    expect(landingHeroContent).toMatch(/Comfortable Buses\s*\|\s*2\+1 A\/C Sleeper\s*&(?:amp;)?\s*Seater\s*\|\s*Across India/);

    // Handwritten Script Slogan
    expect(landingHeroContent).toContain('Your Journey, Our Promise');

    // Map watermark
    expect(landingHeroContent).toContain('viewBox=\'0 0 1000 500\'');
  });

  test('Hero section features Right Visual Showcase with dual bus presentation & curved rose wave graphics', () => {
    // Dual coach container & dynamic replacement props
    expect(landingHeroContent).toContain('dual-bus-container');
    expect(landingHeroContent).toContain('busImage');
    expect(landingHeroContent).toContain('bgImage');

    // Two coaches
    expect(landingHeroContent).toContain('SMART ROUTE Luxury Coach Rear');
    expect(landingHeroContent).toContain('SMART ROUTE BOOKING Luxury Volvo/Tata Coach');

    // Wave SVG graphics
    expect(landingHeroContent).toContain('waveGradient1');
    expect(landingHeroContent).toContain('waveGradient2');
  });

  // ==================== 3. FLOATING SEARCH WIDGET ====================
  test('Floating Search Widget includes BUS BOOKING badge, Origin/Destination with ⇄ swap, Date, Passengers dropdown, and Search CTA', () => {
    // BUS BOOKING badge
    expect(landingHeroContent).toContain('BUS BOOKING');

    // Form inputs
    expect(landingHeroContent).toContain('Enter source city');
    expect(landingHeroContent).toContain('Enter destination city');
    expect(landingHeroContent).toContain('Swap Origin and Destination');
    expect(landingHeroContent).toContain('Journey Date');

    // Passenger counter (Adults / Children)
    expect(landingHeroContent).toContain('Adults');
    expect(landingHeroContent).toContain('Children');

    // Search CTA Button
    expect(landingHeroContent).toContain('Search Buses');
  });

  // ==================== 4. BOTTOM TRUST BADGES RIBBON ====================
  test('Bottom Trust Badges Ribbon includes skyline silhouette, 4 feature cards, and Travel Beyond accent', () => {
    // Trust cards
    expect(landingHeroContent).toContain('Safe &amp; Secure');
    expect(landingHeroContent).toContain('Travel with confidence');

    expect(landingHeroContent).toContain('Premium Comfort');
    expect(landingHeroContent).toContain('2+1 A/C Sleeper &amp; Seater');

    expect(landingHeroContent).toContain('Wide Network');
    expect(landingHeroContent).toContain('Across India');

    expect(landingHeroContent).toContain('24/7 Support');
    expect(landingHeroContent).toContain('Always here for you');

    // Right accent
    expect(landingHeroContent).toContain('Travel Beyond');
  });

  // ==================== 5. INTEGRATION IN SEARCHTRIPS ====================
  test('SearchTrips cleanly integrates LandingHero with required title invariant', () => {
    expect(searchTripsContent).toContain('<LandingHero');
    expect(searchTripsContent).toContain('headerTitle="SMART ROUTE Intercity Expresses"');
  });
});
