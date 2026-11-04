import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  MapPin,
  Calendar,
  Users,
  Search,
  ArrowLeftRight,
  ShieldCheck,
  Headphones,
  Radio,
  Snowflake,
  Zap,
  ArrowRight,
  Sparkles,
  Smartphone,
  Download,
  CheckCircle2,
  Armchair,
  Video,
  DoorOpen,
  Flame,
  CreditCard,
  PhoneCall,
  Clock,
  Compass,
  Star,
  Bus,
  Plane,
  Menu,
  Ticket,
  User,
  Home,
} from 'lucide-react';
import PlaceAutocomplete from '../../components/common/PlaceAutocomplete.jsx';
import BusRoutesCaravan from '../../components/passenger/BusRoutesCaravan.jsx';
import busCutoutDay from '../../assets/bus-cutout-day.png';
import highwayBgDay from '../../assets/highway-bg-day.jpg';
import smartRouteLogo from '../../assets/smart-route-official-logo.jpg';
import featureComfortableSeating from '../../assets/feature-comfortable-seating.jpg';
import featureSurveillanceCameras from '../../assets/feature-surveillance-cameras.jpg';
import featureEmergencyExits from '../../assets/feature-emergency-exits.jpg';
import featureFireExtinguishers from '../../assets/feature-fire-extinguishers.jpg';
import featureOnlinePayments from '../../assets/feature-online-payments.jpg';
import featureCustomerSupport from '../../assets/feature-customer-support.jpg';
import luxuryCoachHighway from '../../assets/luxury-coach-highway.jpg';
import busCabinExperience from '../../assets/bus-cabin-experience.jpg';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Search parameters
  const [fromCity, setFromCity] = useState('Coimbatore');
  const [toCity, setToCity] = useState('Tenkasi');
  const [journeyDate, setJourneyDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Swap Origin and Destination
  const handleSwap = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  // Search Submission & Redirection
  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!fromCity || !fromCity.trim()) {
      setValidationError('Please select a valid Source (From) city.');
      return;
    }
    if (!toCity || !toCity.trim()) {
      setValidationError('Please select a valid Destination (To) city.');
      return;
    }
    if (!journeyDate) {
      setValidationError('Please select a valid Journey Date.');
      return;
    }
    if (fromCity.trim().toLowerCase() === toCity.trim().toLowerCase()) {
      setValidationError('Source and Destination cities cannot be the same.');
      return;
    }

    setValidationError('');
    // Flush stale booking session on new search
    try {
      sessionStorage.removeItem('smartroute_active_bus');
      sessionStorage.removeItem('smartroute_selected_seats');
      sessionStorage.removeItem('smartroute_boarding_point');
      sessionStorage.removeItem('smartroute_dropping_point');
      sessionStorage.removeItem('smartroute_booking_session');
    } catch (e) {
      // ignore
    }

    const params = new URLSearchParams({
      from: fromCity.trim(),
      to: toCity.trim(),
      date: journeyDate,
      passengers: String(adults + childrenCount),
    });
    if (returnDate) params.set('returnDate', returnDate);

    const searchTarget = `/search-results?${params.toString()}`;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(searchTarget)}`);
      return;
    }

    // Redirect to dedicated search results page
    navigate(searchTarget);
  };

  // Caravan Route Click-to-Search Handler
  const handleCaravanRouteSelect = (route) => {
    const origin = route.searchFrom || route.from;
    const destination = route.searchTo || route.to;
    setFromCity(origin);
    setToCity(destination);
    setValidationError('');

    // Flush stale booking session on caravan route selection
    try {
      sessionStorage.removeItem('smartroute_active_bus');
      sessionStorage.removeItem('smartroute_selected_seats');
      sessionStorage.removeItem('smartroute_boarding_point');
      sessionStorage.removeItem('smartroute_dropping_point');
      sessionStorage.removeItem('smartroute_booking_session');
    } catch (e) {
      // ignore
    }

    const params = new URLSearchParams({
      from: origin,
      to: destination,
      date: journeyDate,
      passengers: String(adults + childrenCount),
    });
    if (returnDate) params.set('returnDate', returnDate);

    const searchTarget = `/search-results?${params.toString()}`;
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(searchTarget)}`);
      return;
    }
    navigate(searchTarget);
  };

  const passengerLabel = `${adults} Adult${adults > 1 ? 's' : ''}${childrenCount > 0 ? `, ${childrenCount} Child${childrenCount > 1 ? 'ren' : ''}` : ''}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 64, width: '100%', background: '#FFFFFF' }}>
      {/* ==================== 1. HERO SHOWCASE SECTION (DESKTOP TWO-COLUMN LAYOUT) ==================== */}
      <section
        style={{
          position: 'relative',
          borderRadius: 24,
          background: '#FFF1F6',
          border: '1.5px solid #F1EDFA',
          color: '#24152D',
          padding: '44px 32px 80px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(36, 21, 45, 0.05)',
        }}
        className="hero-showcase-section"
      >
        {/* Translucent World Map Vector Watermark Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.06,
            pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 500' fill='%23C13D78'%3E%3Cpath d='M150,120 Q180,80 220,100 T290,130 T320,180 T260,230 T200,210 Z M650,110 Q700,70 760,90 T840,140 T890,200 T830,240 T760,220 Z M380,240 Q430,210 470,230 T510,290 T470,350 T410,330 Z M220,290 Q260,270 290,300 T310,380 T260,430 T220,380 Z M680,270 Q730,250 780,270 T830,340 T790,410 T720,380 Z' /%3E%3Ccircle cx='500' cy='180' r='6' /%3E%3Ccircle cx='280' cy='160' r='5' /%3E%3Ccircle cx='760' cy='180' r='5' /%3E%3Ccircle cx='460' cy='310' r='6' /%3E%3Ccircle cx='740' cy='330' r='6' /%3E%3C/svg%3E")`,
            backgroundSize: '850px 425px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div
          style={{
            alignItems: 'center',
            position: 'relative',
            zIndex: 2,
            maxWidth: 1240,
            margin: '0 auto',
          }}
          className="hero-split-grid"
        >
          {/* Left: Value Proposition Typography */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Eyebrow Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#FFF1F6',
                border: '1px solid #E7A0BF',
                color: '#C13D78',
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                width: 'fit-content',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={13} color="#C13D78" />
              <span>TRAVEL SMART &nbsp;/&nbsp; SAFE &nbsp;/&nbsp; COMFORTABLE</span>
            </div>

            {/* Headline: Two-line hierarchy matching screenshot */}
            <h1
              style={{
                fontSize: 'clamp(32px, 4.2vw, 48px)',
                fontWeight: 900,
                color: '#24152D',
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
              className="font-display text-3xl md:text-5xl font-extrabold text-[#24152D] tracking-tight"
            >
              Book Your Journey<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                className="text-[#E11D48]"
              >
                with Smart Route Booking
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(14px, 1.8vw, 16px)',
                color: '#6E5D73',
                lineHeight: 1.6,
                margin: 0,
                fontWeight: 600,
                maxWidth: 540,
              }}
              className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed"
            >
              Comfortable Buses | 2+1 A/C Sleeper &amp; Seater | Across India
            </p>

            {/* Slogan: Elegant handwritten script font in dark charcoal */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              <span
                style={{
                  fontFamily: "var(--sr-font-script), 'Dancing Script', 'Caveat', cursive",
                  fontSize: 26,
                  fontWeight: 600,
                  color: '#24152D',
                  letterSpacing: '0.02em',
                }}
                className="font-script text-2xl md:text-3xl font-semibold text-[#24152D]"
              >
                &ldquo;Your Journey, Our Promise&rdquo;
              </span>
              <div style={{ height: 2, width: 36, background: '#E7A0BF', borderRadius: 2 }} />
            </div>

            {/* Quick Benefits */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 4, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <CheckCircle2 size={15} color="#10B981" />
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Zero Booking Fees</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <CheckCircle2 size={15} color="#10B981" />
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Instant WhatsApp M-Ticket</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <CheckCircle2 size={15} color="#10B981" />
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>24/7 Live Helpline</span>
              </div>
            </div>
          </div>

          {/* Right Visual: Hero Luxury Bus Showcase (Volvo 9600 Sleeper Coach + Curved Wave Graphics) */}
          <div
            style={{
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              minHeight: 280,
              boxShadow: '0 16px 36px rgba(36, 21, 45, 0.12)',
              border: '2px solid #FFFFFF',
              backgroundImage: `url(${highwayBgDay})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '16px 12px',
            }}
            className="dual-bus-container"
          >
            {/* Subtle Sky Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(36, 21, 45, 0.15) 0%, transparent 40%, rgba(36, 21, 45, 0.35) 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Dynamic Curved Red/Rose Wave Graphics framing the coach */}
            <svg
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                height: '100%',
                width: '45%',
                pointerEvents: 'none',
                opacity: 0.85,
              }}
              viewBox="0 0 200 400"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="landingWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C13D78" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#8E2355" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="landingWaveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E7A0BF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#C13D78" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <path d="M 60,0 Q 140,200 20,400 L 200,400 L 200,0 Z" fill="url(#landingWaveGrad2)" />
              <path d="M 110,0 Q 180,180 80,400 L 200,400 L 200,0 Z" fill="url(#landingWaveGrad1)" />
            </svg>

            {/* Dual Coach Presentation */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                zIndex: 5,
              }}
            >
              {/* Rear Coach */}
              <div
                style={{
                  position: 'absolute',
                  left: '12%',
                  bottom: '18px',
                  width: '68%',
                  transform: 'scale(0.82)',
                  filter: 'drop-shadow(0 12px 20px rgba(0, 0, 0, 0.6))',
                  opacity: 0.92,
                  zIndex: 2,
                }}
              >
                <img
                  src={busCutoutDay}
                  alt="SMART ROUTE Luxury Coach Rear"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>

              {/* Lead Volvo 9600 Coach */}
              <div
                style={{
                  position: 'relative',
                  width: '82%',
                  zIndex: 4,
                  filter: 'drop-shadow(0 16px 28px rgba(0, 0, 0, 0.8))',
                }}
              >
                <img
                  src={busCutoutDay}
                  alt="SMART ROUTE BOOKING Luxury Volvo 9600 Sleeper Coach with Metallic Gold and Black Livery"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>

            {/* Top Badge: 2+1 A/C SLEEPER COACH • SMART ROUTE BOOKING */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                zIndex: 10,
                border: '1px solid #E7A0BF',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C13D78' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#24152D' }}>
                2+1 A/C SLEEPER COACH &bull; SMART ROUTE BOOKING
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SEARCH CARD FORM (FLOATING WIDGET) ==================== */}
      <section style={{ marginTop: -70, position: 'relative', zIndex: 30, padding: '0 8px' }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1.5px solid #F1EDFA',
            boxShadow: '0 16px 40px rgba(36, 21, 45, 0.08)',
            padding: '24px 28px',
            maxWidth: 1240,
            margin: '0 auto',
          }}
        >
          {/* Header pill & status */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                  color: '#FFFFFF',
                  padding: '5px 14px',
                  borderRadius: 14,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(193, 61, 120, 0.3)',
                }}
              >
                <Bus size={13} color="#FFFFFF" />
                <span>BUS BOOKING</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#24152D' }}>
                Direct Intercity Express Routes
              </span>
            </div>

            <div style={{ fontSize: 12, color: '#6E5D73', fontWeight: 600 }}>
              Instant Confirmation &bull; Real-time Radar GPS
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {validationError}
            </div>
          )}

          {/* Search Inputs Form */}
          <form onSubmit={handleSearchSubmit} autoComplete="off">
            {/* Dummy read-only trap fields to absorb uninvited browser password manager heuristics */}
            <input type="text" style={{ display: 'none' }} aria-hidden="true" autoComplete="off" tabIndex={-1} readOnly />
            <input type="password" style={{ display: 'none' }} aria-hidden="true" autoComplete="new-password" tabIndex={-1} readOnly />

            <div className="landing-search-toolbar-grid">
              {/* 1. From (Source city) */}
              <div style={{ textAlign: 'left' }}>
                <PlaceAutocomplete
                  id="landing-search-origin"
                  label="From"
                  value={fromCity}
                  onChange={(val) => { setFromCity(val); setValidationError(''); }}
                  onSelectPlace={(place) => { setFromCity(place.city || place.mainText); setValidationError(''); }}
                  placeholder="Enter source city"
                  icon={<MapPin size={16} color="#C13D78" />}
                  required
                />
              </div>

              {/* 2. Swap Button: Circular red floating button with white two-way exchange arrows (⇄) */}
              <div className="search-swap-col" style={{ display: 'flex', justifyContent: 'center', paddingBottom: 2 }}>
                <button
                  type="button"
                  onClick={handleSwap}
                  style={{
                    width: 42,
                    height: 42,
                    padding: 0,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(193, 61, 120, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                  title="Swap Origin & Destination"
                >
                  <ArrowLeftRight size={16} color="#FFFFFF" />
                </button>
              </div>

              {/* 3. To (Destination city) */}
              <div style={{ textAlign: 'left' }}>
                <PlaceAutocomplete
                  id="landing-search-destination"
                  label="To"
                  value={toCity}
                  onChange={(val) => { setToCity(val); setValidationError(''); }}
                  onSelectPlace={(place) => { setToCity(place.city || place.mainText); setValidationError(''); }}
                  placeholder="Enter destination city"
                  icon={<MapPin size={16} color="#C13D78" />}
                  required
                />
              </div>

              {/* 4. Journey Date */}
              <div style={{ textAlign: 'left' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#6E5D73',
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  <Calendar size={14} color="#C13D78" /> Journey Date
                </label>
                <input
                  type="date"
                  value={journeyDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setJourneyDate(e.target.value); setValidationError(''); }}
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  style={{
                    height: 44,
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 10,
                    width: '100%',
                    padding: '0 10px',
                    fontSize: 13,
                    color: '#0F172A',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* 5. Return Date (Optional) */}
              <div style={{ textAlign: 'left' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#475569',
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  <Calendar size={14} color="#64748B" /> Return (Optional)
                </label>
                <input
                  type="date"
                  value={returnDate}
                  min={journeyDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setReturnDate(e.target.value)}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  style={{
                    height: 44,
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 10,
                    width: '100%',
                    padding: '0 10px',
                    fontSize: 13,
                    color: '#0F172A',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* 6. Passengers Dropdown */}
              <div style={{ textAlign: 'left', position: 'relative' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#6E5D73',
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  <Users size={14} color="#C13D78" /> Passengers
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                  style={{
                    width: '100%',
                    height: 44,
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {passengerLabel}
                  </span>
                  <span style={{ fontSize: 10, color: '#64748B' }}>▼</span>
                </button>

                {showPassengerDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 6,
                      background: '#FFFFFF',
                      borderRadius: 12,
                      border: '1.5px solid #CBD5E1',
                      boxShadow: '0 12px 28px rgba(15, 23, 42, 0.15)',
                      padding: 14,
                      zIndex: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Adults</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>12+ yrs</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                          disabled={adults <= 1}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: '1px solid #CBD5E1',
                            background: '#F8FAFC',
                            cursor: adults <= 1 ? 'default' : 'pointer',
                            opacity: adults <= 1 ? 0.4 : 1,
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>
                          {adults}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdults((prev) => Math.min(6, prev + 1))}
                          disabled={adults + childrenCount >= 6}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: '1px solid #CBD5E1',
                            background: '#F8FAFC',
                            cursor: adults + childrenCount >= 6 ? 'default' : 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Children</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>0-11 yrs</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setChildrenCount((prev) => Math.max(0, prev - 1))}
                          disabled={childrenCount <= 0}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: '1px solid #CBD5E1',
                            background: '#F8FAFC',
                            cursor: childrenCount <= 0 ? 'default' : 'pointer',
                            opacity: childrenCount <= 0 ? 0.4 : 1,
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>
                          {childrenCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChildrenCount((prev) => Math.min(4, prev + 1))}
                          disabled={adults + childrenCount >= 6}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: '1px solid #CBD5E1',
                            background: '#F8FAFC',
                            cursor: adults + childrenCount >= 6 ? 'default' : 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPassengerDropdown(false)}
                      style={{
                        background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* 7. Search CTA Button: Prominent wide rounded-xl button in vibrant Rose Red */}
              <div className="search-cta-col">
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: 44,
                    background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 13.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(193, 61, 120, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                >
                  <Search size={16} color="#FFFFFF" />
                  <span>Search Buses</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ==================== 4. BOTTOM BENEFITS STRIP ==================== */}
      <section style={{ maxWidth: 1240, margin: '0 auto', width: '100%', padding: '0 8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1.5px solid #F1EDFA',
            padding: '14px 20px',
            boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)',
            position: 'relative',
            overflow: 'hidden',
            flexWrap: 'wrap',
            gap: 12,
          }}
          className="trust-badges-ribbon"
        >
          {/* Left: Red India-inspired decorative skyline/wave artwork */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              opacity: 0.75,
              width: 120,
              height: 42,
              flexShrink: 0,
            }}
            className="desktop-only"
            title="Iconic Skylines &amp; Destinations"
          >
            <svg viewBox="0 0 140 45" width="100%" height="100%" fill="#C13D78">
              <path d="M0,42 Q 70,38, 140,42 L 140,45 L 0,45 Z" />
              <rect x="4" y="16" width="22" height="26" rx="1" />
              <rect x="9" y="24" width="12" height="18" rx="6" fill="#FFFFFF" />
              <polygon points="15,10 4,16 26,16" />
              <rect x="30" y="12" width="7" height="30" />
              <polygon points="33.5,4 30,12 37,12" />
              <rect x="42" y="8" width="9" height="34" />
              <polygon points="46.5,0 42,8 51,8" />
              <circle cx="46.5" cy="14" r="2" fill="#FFFFFF" />
              <circle cx="64" cy="22" r="13" stroke="#C13D78" strokeWidth="2" fill="none" />
              <circle cx="64" cy="22" r="2" />
              <line x1="64" y1="22" x2="64" y2="42" stroke="#C13D78" strokeWidth="2" />
              <rect x="82" y="14" width="10" height="28" />
              <rect x="96" y="8" width="12" height="34" />
              <polygon points="102,2 96,8 108,8" />
              <rect x="112" y="18" width="8" height="24" />
              <rect x="124" y="12" width="12" height="30" />
            </svg>
          </div>

          {/* Center: Four Compact Feature Items */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              flex: 1,
            }}
            className="trust-cards-grid"
          >
            {/* 1. Safe & Secure — Travel with confidence */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', padding: '8px 12px', borderRadius: 12, border: '1px solid #F1EDFA', boxShadow: '0 2px 8px rgba(36,21,45,0.03)' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#FFF1F6',
                  border: '1px solid #E7A0BF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C13D78',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={20} color="#C13D78" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Safe &amp; Secure</div>
                <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>Travel with confidence</div>
              </div>
            </div>

            {/* 2. Premium Comfort — 2+1 A/C Sleeper & Seater */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', padding: '8px 12px', borderRadius: 12, border: '1px solid #F1EDFA', boxShadow: '0 2px 8px rgba(36,21,45,0.03)' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#FFF1F6',
                  border: '1px solid #E7A0BF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C13D78',
                  flexShrink: 0,
                }}
              >
                <Armchair size={20} color="#C13D78" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Premium Comfort</div>
                <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>2+1 A/C Sleeper &amp; Seater</div>
              </div>
            </div>

            {/* 3. Wide Network — Across India */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', padding: '8px 12px', borderRadius: 12, border: '1px solid #F1EDFA', boxShadow: '0 2px 8px rgba(36,21,45,0.03)' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#FFF1F6',
                  border: '1px solid #E7A0BF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C13D78',
                  flexShrink: 0,
                }}
              >
                <MapPin size={20} color="#C13D78" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Wide Network</div>
                <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>Across India</div>
              </div>
            </div>

            {/* 4. 24/7 Support — Always here for you */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', padding: '8px 12px', borderRadius: 12, border: '1px solid #F1EDFA', boxShadow: '0 2px 8px rgba(36,21,45,0.03)' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#FFF1F6',
                  border: '1px solid #E7A0BF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C13D78',
                  flexShrink: 0,
                }}
              >
                <Headphones size={20} color="#C13D78" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>24/7 Support</div>
                <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>Always here for you</div>
              </div>
            </div>
          </div>

          {/* Right: Red script accent "Travel Beyond ✈️" with trailing dotted flight path line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #FFF1F6 0%, #FDF2F8 100%)',
              border: '1px solid #E7A0BF',
              padding: '6px 16px',
              borderRadius: 16,
              flexShrink: 0,
            }}
            className="desktop-only"
          >
            <span
              style={{
                fontFamily: "'Brush Script MT', 'Caveat', cursive, serif",
                fontSize: 17,
                fontWeight: 700,
                color: '#C13D78',
                fontStyle: 'italic',
              }}
            >
              Travel Beyond
            </span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
                <path d="M2 12 Q 12 2, 22 4" stroke="#C13D78" strokeWidth="1.2" strokeDasharray="2 2" />
              </svg>
              <Plane size={14} color="#C13D78" style={{ transform: 'rotate(-25deg)', marginLeft: -4 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 5. OUR ROUTES — BUS TRAILER CARAVAN ==================== */}
      {/* Our Routes: Our Extensive Bus Routes Connect You To Major Cities And Destinations */}
      <section style={{ maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        {/* Highway Moving Bus-Pulling-Route-Cards Trailer Caravan */}
        <BusRoutesCaravan onSelectRoute={handleCaravanRouteSelect} />
      </section>

      {/* ==================== 6. VALUE PROPOSITION ("FACILITIES WE PROVIDE") ==================== */}
      <section style={{ maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            alignItems: 'center',
          }}
          className="facilities-split-grid"
        >
          {/* Left Column: Big Banner Card */}
          <div
            style={{
              background: '#FFF1F6',
              color: '#24152D',
              borderRadius: 20,
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 8px 32px rgba(36, 21, 45, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              border: '1.5px solid #E7A0BF',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(193, 61, 120, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C13D78',
              }}
            >
              <Sparkles size={22} />
            </div>

            <div className="eyebrow-accent-badge font-script text-2xl md:text-3xl font-semibold text-[#24152D]">
              <span className="first-letter-dot" />
              Facilities We Provide
            </div>

            <h3
              className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-[#24152D] leading-snug"
              style={{ margin: 0 }}
            >
              Smart and Simple Booking for a Smooth and Hassle-Free Travel Experience
            </h3>

            <p
              className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed"
              style={{ margin: 0 }}
            >
              From live seat selection on Tata Capella multi-axle coaches to real-time driver telemetry updates, our cloud-connected infrastructure gives passengers complete peace of mind.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => navigate('/search-results')}
                style={{
                  background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(193, 61, 120, 0.25)',
                }}
              >
                <span>Explore Buses</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Column: 3 Vertical Feature Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Feature 1 */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1.5px solid #F1EDFA',
                padding: '20px 24px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                boxShadow: '0 4px 14px rgba(36, 21, 45, 0.04)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'rgba(193, 61, 120, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C13D78',
                  flexShrink: 0,
                }}
              >
                <Armchair size={22} />
              </div>
              <div>
                <h4
                  className="font-display text-base md:text-lg font-bold text-[#24152D]"
                  style={{ margin: '0 0 6px 0' }}
                >
                  1. Book and Manage Your Trip
                </h4>
                <p
                  className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed"
                  style={{ margin: 0 }}
                >
                  Select exact sleeper or semi-sleeper berths, view coach amenities, and manage boarding details in a single click.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1.5px solid #F1EDFA',
                padding: '20px 24px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                boxShadow: '0 4px 14px rgba(36, 21, 45, 0.04)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  flexShrink: 0,
                }}
              >
                <Radio size={22} />
              </div>
              <div>
                <h4
                  className="font-display text-base md:text-lg font-bold text-[#24152D]"
                  style={{ margin: '0 0 6px 0' }}
                >
                  2. Track Your Boarding Point Status (Live Radar GPS)
                </h4>
                <p
                  className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed"
                  style={{ margin: 0 }}
                >
                  Real-time GPS telemetry radar feeds live bus locations every 5 seconds so you never miss your coach pickup.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1.5px solid #F1EDFA',
                padding: '20px 24px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                boxShadow: '0 4px 14px rgba(36, 21, 45, 0.04)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3B82F6',
                  flexShrink: 0,
                }}
              >
                <Zap size={22} />
              </div>
              <div>
                <h4
                  className="font-display text-base md:text-lg font-bold text-[#24152D]"
                  style={{ margin: '0 0 6px 0' }}
                >
                  3. Fast Booking
                </h4>
                <p
                  className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed"
                  style={{ margin: 0 }}
                >
                  Zero friction checkout with instant UPI, NetBanking, and credit/debit options paired with immediate WhatsApp tickets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 7. ABOUT SECTION ("WHO WE ARE") ==================== */}
      <section style={{ maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 40,
            alignItems: 'center',
          }}
          className="about-split-grid"
        >
          {/* Left: Brand Mission */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <div className="eyebrow-accent-badge font-script text-2xl md:text-3xl font-semibold text-[#24152D]">
                <span className="first-letter-dot" />
                Who We Are?
              </div>
              <span className="sr-only">WHO WE ARE</span>
            </div>

            <h2
              className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-[#24152D] leading-snug"
              style={{ margin: 0 }}
            >
              Pioneering Modern Intercity Coach Travel Across India
            </h2>

            <p
              className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed"
              style={{ margin: 0 }}
            >
              SMART ROUTE BOOKING is India&apos;s dedicated luxury bus mobility platform, connecting key economic, cultural, and scenic corridors with state-of-the-art Volvo and Tata Capella 2+1 A/C sleeper buses. We combine verified passenger safety, zero booking surcharges, and instant automated seat allocations to set new standards in intercity coach operations.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '8px 0' }}>
              <div style={{ background: '#FFF1F6', padding: '12px 14px', borderRadius: 12, border: '1px solid #E7A0BF' }}>
                <div className="font-display text-xl md:text-2xl font-extrabold text-[#C13D78]">120+</div>
                <div className="font-sans text-xs font-semibold text-[#6E5D73]">Active Corridors</div>
              </div>
              <div style={{ background: '#FFF1F6', padding: '12px 14px', borderRadius: 12, border: '1px solid #E7A0BF' }}>
                <div className="font-display text-xl md:text-2xl font-extrabold text-[#10B981]">99.4%</div>
                <div className="font-sans text-xs font-semibold text-[#6E5D73]">On-Time Rating</div>
              </div>
              <div style={{ background: '#FFF1F6', padding: '12px 14px', borderRadius: 12, border: '1px solid #E7A0BF' }}>
                <div className="font-display text-xl md:text-2xl font-extrabold text-[#C13D78]">2.4M+</div>
                <div className="font-sans text-xs font-semibold text-[#6E5D73]">Happy Passengers</div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => navigate('/about')}
                style={{
                  background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 24px',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(193, 61, 120, 0.25)',
                }}
              >
                <span>Discover More</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right: Bus Exterior & Interior Showcase Visual */}
          <div
            style={{
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              background: '#0F172A',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
              border: '2px solid #E2E8F0',
            }}
          >
            <img
              src={busCabinExperience}
              alt="Luxury Volvo & Tata Capella 2+1 A/C Sleeper Coach Cabin Berths"
              style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 40%, rgba(15, 23, 42, 0.85) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '24px',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#F87171' }}>
                  LUXURY CABIN EXPERIENCE
                </span>
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px 0' }}>
                Volvo &amp; Tata Capella 2+1 A/C Berths
              </h4>
              <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
                Custom ergonomic mattresses, personal reading lights, noise-dampening acoustic cabins, and sanitized blankets on every trip.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 8. AMENITIES GRID ("FEATURES WE PROVIDE") ==================== */}
      <section style={{ maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
            <div className="eyebrow-accent-badge font-script text-2xl md:text-3xl font-semibold text-[#24152D]">
              <span className="first-letter-dot" />
              Features We Provide
            </div>
            <span className="sr-only">FEATURES WE PROVIDE</span>
          </div>
          <h2
            className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-[#24152D] leading-snug"
            style={{ margin: '0 0 8px 0' }}
          >
            Comfy Travel That All You Need
          </h2>
          <p
            className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed"
            style={{ maxWidth: 640, margin: '0 auto' }}
          >
            Every passenger journey is backed by comprehensive safety measures, onboard comforts, and uninterrupted customer assistance.
          </p>
        </div>

        {/* 3x2 Grid of 6 Cards */}
        <div className="amenities-3x2-grid">
          {/* Card 1: Comfortable Seating */}
          <div className="amenity-feature-card">
            <div className="amenity-thumb-wrapper">
              <img
                src={featureComfortableSeating}
                alt="2+1 luxury sleeper berths"
                className="amenity-thumb-img"
                loading="lazy"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#FDF2F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#DB2777',
                }}
              >
                <Armchair size={18} />
              </div>
              <h4
                className="font-display text-base font-bold text-[#1E1B4B]"
                style={{ margin: '4px 0 0 0' }}
              >
                Comfortable Seating
              </h4>
              <p
                className="font-sans text-xs md:text-sm text-[#64748B] leading-relaxed"
                style={{ margin: 0 }}
              >
                2+1 A/C executive sleeper berths and push-back recliner seats crafted for restful overnight highway journeys.
              </p>
            </div>
          </div>

          {/* Card 2: Surveillance Cameras */}
          <div className="amenity-feature-card">
            <div className="amenity-thumb-wrapper">
              <img
                src={featureSurveillanceCameras}
                alt="High-definition CCTV cameras"
                className="amenity-thumb-img"
                loading="lazy"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <Video size={18} />
              </div>
              <h4
                className="font-display text-base font-bold text-[#1E1B4B]"
                style={{ margin: '4px 0 0 0' }}
              >
                Surveillance Cameras
              </h4>
              <p
                className="font-sans text-xs md:text-sm text-[#64748B] leading-relaxed"
                style={{ margin: 0 }}
              >
                High-definition CCTV cameras in passenger aisles and driver cockpits connected to our central security monitoring hub.
              </p>
            </div>
          </div>

          {/* Card 3: Emergency Exits */}
          <div className="amenity-feature-card">
            <div className="amenity-thumb-wrapper">
              <img
                src={featureEmergencyExits}
                alt="Dual emergency exits and break-glass hammer"
                className="amenity-thumb-img"
                loading="lazy"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                }}
              >
                <DoorOpen size={18} />
              </div>
              <h4
                className="font-display text-base font-bold text-[#1E1B4B]"
                style={{ margin: '4px 0 0 0' }}
              >
                Emergency Exits
              </h4>
              <p
                className="font-sans text-xs md:text-sm text-[#64748B] leading-relaxed"
                style={{ margin: 0 }}
              >
                Dual rear and roof emergency egress hatches with break-glass safety hammers clearly marked in every coach row.
              </p>
            </div>
          </div>

          {/* Card 4: Fire Extinguishers */}
          <div className="amenity-feature-card">
            <div className="amenity-thumb-wrapper">
              <img
                src={featureFireExtinguishers}
                alt="Serviced fire extinguisher and sensors"
                className="amenity-thumb-img"
                loading="lazy"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#FFF1F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E11D48',
                }}
              >
                <Flame size={18} />
              </div>
              <h4
                className="font-display text-base font-bold text-[#1E1B4B]"
                style={{ margin: '4px 0 0 0' }}
              >
                Fire Extinguishers
              </h4>
              <p
                className="font-sans text-xs md:text-sm text-[#64748B] leading-relaxed"
                style={{ margin: 0 }}
              >
                Regularly serviced ABC dry powder extinguishers and engine bay thermal fire suppression sensors for maximum safety.
              </p>
            </div>
          </div>

          {/* Card 5: Online Booking and Payments */}
          <div className="amenity-feature-card">
            <div className="amenity-thumb-wrapper">
              <img
                src={featureOnlinePayments}
                alt="Instant UPI and online payments"
                className="amenity-thumb-img"
                loading="lazy"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#FDF2F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#C026D3',
                }}
              >
                <CreditCard size={18} />
              </div>
              <h4
                className="font-display text-base font-bold text-[#1E1B4B]"
                style={{ margin: '4px 0 0 0' }}
              >
                Online Booking and Payments
              </h4>
              <p
                className="font-sans text-xs md:text-sm text-[#64748B] leading-relaxed"
                style={{ margin: 0 }}
              >
                Instant live inventory access, zero surcharge payments through UPI, Cards, and Net Banking with instant receipt delivery.
              </p>
            </div>
          </div>

          {/* Card 6: Customer Support */}
          <div className="amenity-feature-card">
            <div className="amenity-thumb-wrapper">
              <img
                src={featureCustomerSupport}
                alt="Dedicated 24/7 passenger care helpline"
                className="amenity-thumb-img"
                loading="lazy"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#FFFBEB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#D97706',
                }}
              >
                <PhoneCall size={18} />
              </div>
              <h4
                className="font-display text-base font-bold text-[#1E1B4B]"
                style={{ margin: '4px 0 0 0' }}
              >
                Customer Support
              </h4>
              <p
                className="font-sans text-xs md:text-sm text-[#64748B] leading-relaxed"
                style={{ margin: 0 }}
              >
                Dedicated 24/7 passenger care helpline with multilingual representatives ready to assist on any schedule or route query.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 9. MOBILE APP PROMOTION ==================== */}
      <section
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          width: '100%',
          borderRadius: 24,
          background: `linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.82) 48%, rgba(15, 23, 42, 0.45) 100%), url(${luxuryCoachHighway}) center center / cover no-repeat`,
          color: '#FFFFFF',
          padding: '48px 44px',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.22)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className="app-promo-split-grid">
          {/* Left: Text & Store Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(225, 29, 72, 0.18)',
                border: '1px solid rgba(225, 29, 72, 0.35)',
                color: '#FDA4AF',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.04em',
                width: 'fit-content',
              }}
            >
              <Smartphone size={15} color="#FB7185" />
              <span>SMART ROUTE MOBILE APP</span>
            </div>

            <h2
              style={{
                fontSize: 34,
                fontWeight: 900,
                lineHeight: 1.25,
                margin: 0,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              Instant Booking At Your Fingertips &mdash; Download Our Mobile App
            </h2>

            <p
              style={{
                fontSize: 15,
                color: '#CBD5E1',
                lineHeight: 1.6,
                margin: 0,
                maxWidth: 540,
              }}
            >
              Book your favorite routes, track your journey, and enjoy a seamless travel experience &mdash; all from your phone.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
              {/* Google Play Store Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#000000',
                  border: '1px solid #475569',
                  borderRadius: 12,
                  padding: '9px 18px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <svg width="22" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3.6 1.7A1.5 1.5 0 0 0 3 3v18a1.5 1.5 0 0 0 .6 1.3l.1.1 10.1-10.1v-.2L3.7 2l-.1-.3z" fill="#00E676"/>
                  <path d="M17.1 15.5l-3.3-3.3v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.7 0 2.3l-4 2.2z" fill="#FFD600"/>
                  <path d="M13.8 12.1L3.7 22.2c.5.5 1.3.5 2.1.1l11.4-6.5-3.4-3.7z" fill="#FF1744"/>
                  <path d="M13.8 11.9l3.4-3.4L5.8 2c-.8-.4-1.6-.4-2.1.1l10.1 9.8z" fill="#00B0FF"/>
                </svg>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>GET IT ON</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>Google Play</div>
                </div>
              </div>

              {/* Apple App Store Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#000000',
                  border: '1px solid #475569',
                  borderRadius: 12,
                  padding: '9px 18px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <svg width="22" height="24" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.63-.77 1.06-1.84.94-2.91-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.76-.95 2.81 1.02.08 2.05-.5 2.68-1.27z"/>
                </svg>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Download on the</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>App Store</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Realistic Smartphone Mockup Running SMART ROUTE App */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div
              style={{
                width: 290,
                maxWidth: '100%',
                borderRadius: 40,
                background: '#FFFFFF',
                border: '7px solid #1E293B',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                color: '#1E1B4B',
              }}
            >
              {/* iPhone Notch & Status Bar */}
              <div
                style={{
                  height: 26,
                  background: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 18px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#0F172A',
                }}
              >
                <span>9:41</span>
                <div style={{ width: 72, height: 16, borderRadius: 10, background: '#0F172A', margin: '0 auto' }} />
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 800 }}>5G</span>
                </div>
                <span className="sr-only">Live Radar: 4.2 km away</span>
              </div>

              {/* App Top Bar with Official Logo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  borderBottom: '1px solid #F1F5F9',
                  background: '#FFFFFF',
                }}
              >
                <Menu size={18} color="#1E1B4B" />
                <img
                  src={smartRouteLogo}
                  alt="SMART ROUTE BOOKING"
                  style={{ height: 26, objectFit: 'contain' }}
                />
                <div style={{ width: 18 }} />
              </div>

              {/* Mini Hero Banner */}
              <div
                style={{
                  margin: '10px 14px 6px',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #1E1B4B 0%, #3B162E 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#FFFFFF' }}>Your Journey</div>
                  <div style={{ fontSize: 9, color: '#FDA4AF', fontWeight: 600 }}>Our Priority</div>
                </div>
                <img
                  src={busCutoutDay}
                  alt="Coach"
                  style={{ height: 30, width: 'auto', objectFit: 'contain' }}
                />
              </div>

              {/* Search Card */}
              <div
                style={{
                  margin: '6px 14px 10px',
                  padding: '10px 12px',
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                {/* From Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <MapPin size={13} color="#DB2777" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 8, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>From</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1E1B4B' }}>Coimbatore</span>
                  </div>
                </div>

                {/* To Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <MapPin size={13} color="#2563EB" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 8, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>To</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1E1B4B' }}>Tenkasi</span>
                  </div>
                </div>

                {/* Date Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <Calendar size={13} color="#E11D48" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 8, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Date</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1E1B4B' }}>Thu, 24 Apr 2025</span>
                  </div>
                </div>

                {/* Search CTA */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                    color: '#FFFFFF',
                    borderRadius: 8,
                    padding: '8px',
                    fontSize: 11,
                    fontWeight: 700,
                    textAlign: 'center',
                    marginTop: 2,
                    boxShadow: '0 4px 10px rgba(225, 29, 72, 0.3)',
                    cursor: 'pointer',
                  }}
                >
                  Search Buses
                </div>
              </div>

              {/* Bottom Mobile App Navigation Bar */}
              <div
                style={{
                  marginTop: 'auto',
                  borderTop: '1px solid #F1F5F9',
                  background: '#FFFFFF',
                  padding: '7px 12px 9px',
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#E11D48' }}>
                  <Home size={13} />
                  <span style={{ fontSize: 8, fontWeight: 700 }}>Home</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#94A3B8' }}>
                  <Ticket size={13} />
                  <span style={{ fontSize: 8, fontWeight: 500 }}>Bookings</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#94A3B8' }}>
                  <Bus size={13} />
                  <span style={{ fontSize: 8, fontWeight: 500 }}>My Trips</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#94A3B8' }}>
                  <User size={13} />
                  <span style={{ fontSize: 8, fontWeight: 500 }}>Profile</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
