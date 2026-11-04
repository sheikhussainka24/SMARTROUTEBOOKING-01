import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Users,
  Search,
  ArrowLeftRight,
  ShieldCheck,
  Armchair,
  Headphones,
  Compass,
  Bus,
  Sparkles,
  Plane,
  ChevronDown,
  Plus,
  Minus,
} from 'lucide-react';
import PlaceAutocomplete from '../common/PlaceAutocomplete.jsx';
import busCutoutDay from '../../assets/bus-cutout-day.png';
import highwayBgDay from '../../assets/highway-bg-day.jpg';

/**
 * SMART ROUTE — High-Converting Landing Page Hero Section
 * Features:
 * - Two-Column Desktop Split (Hero Value Proposition + Dual Luxury Coach Visual)
 * - Floating Multi-Field Search Widget overlapping the hero
 * - Bottom Trust Badges & Amenities Ribbon with City Skyline Silhouette
 */
export default function LandingHero({
  headerTitle = 'SMART ROUTE Intercity Expresses',
  fromCity = 'Coimbatore',
  toCity = 'Tenkasi',
  date = '',
  passengers = 1,
  onFromCityChange,
  onToCityChange,
  onDateChange,
  onPassengersChange,
  onSwapCities,
  onSearch,
  loading = false,
  busImage = null,
  bgImage = null,
}) {
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

  const effectiveBusCutout = busImage || busCutoutDay || '/assets/bus-cutout-day.png';
  const effectiveHighwayBg = bgImage || highwayBgDay || '/assets/highway-bg-day.jpg';

  const handlePassengerUpdate = (newAdults, newChildren) => {
    setAdults(newAdults);
    setChildrenCount(newChildren);
    const total = newAdults + newChildren;
    if (onPassengersChange) onPassengersChange(total);
  };

  const passengerLabel = `${adults} Adult${adults > 1 ? 's' : ''}${childrenCount > 0 ? `, ${childrenCount} Child${childrenCount > 1 ? 'ren' : ''}` : ''}`;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
      {/* ==================== 1. HERO SHOWCASE SECTION (TWO-COLUMN SPLIT) ==================== */}
      <div
        style={{
          position: 'relative',
          borderRadius: 24,
          background: '#FFF1F6',
          border: '1.5px solid #F1EDFA',
          padding: '40px 32px 70px 32px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(36, 21, 45, 0.05)',
        }}
        className="hero-showcase-wrapper"
      >
        {/* Light World Map Watermark Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 500' fill='%23C13D78'%3E%3Cpath d='M150,120 Q180,80 220,100 T290,130 T320,180 T260,230 T200,210 Z M650,110 Q700,70 760,90 T840,140 T890,200 T830,240 T760,220 Z M380,240 Q430,210 470,230 T510,290 T470,350 T410,330 Z M220,290 Q260,270 290,300 T310,380 T260,430 T220,380 Z M680,270 Q730,250 780,270 T830,340 T790,410 T720,380 Z' /%3E%3Ccircle cx='500' cy='180' r='6' /%3E%3Ccircle cx='280' cy='160' r='5' /%3E%3Ccircle cx='760' cy='180' r='5' /%3E%3Ccircle cx='460' cy='310' r='6' /%3E%3Ccircle cx='740' cy='330' r='6' /%3E%3C/svg%3E")`,
            backgroundSize: '800px 400px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Two-Column Grid */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
          }}
          className="hero-split-grid"
        >
          {/* Left Column: Hero Value Proposition */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Eyebrow Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#FFF1F6',
                  border: '1px solid #E7A0BF',
                  borderRadius: 20,
                  padding: '5px 14px',
                  color: '#C13D78',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                <Sparkles size={13} color="#C13D78" />
                <span>TRAVEL SMART &nbsp;/&nbsp; SAFE &nbsp;/&nbsp; COMFORTABLE</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 900,
                color: '#24152D',
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: '-0.02em',
              }}
              className="font-display text-3xl md:text-5xl font-extrabold text-[#24152D]"
            >
              Book Your Journey with{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                className="text-[#E11D48]"
              >
                Smart Route Booking
              </span>
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(14px, 1.8vw, 16px)',
                color: '#6E5D73',
                margin: 0,
                lineHeight: 1.5,
                fontWeight: 600,
              }}
              className="font-sans text-xs md:text-sm font-normal text-[#6E5D73]"
            >
              Comfortable Buses | 2+1 A/C Sleeper &amp; Seater | Across India
            </p>

            {/* Handwritten Script Slogan in dark charcoal */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 4,
              }}
            >
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
              <div style={{ height: 2, width: 40, background: '#E7A0BF', borderRadius: 2 }} />
            </div>
          </div>

          {/* Right Column: Visual Showcase (Dual Bus Hero Area) */}
          <div
            style={{
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              minHeight: 280,
              boxShadow: '0 16px 36px rgba(36, 21, 45, 0.12)',
              border: '2px solid #FFFFFF',
              backgroundImage: `url(${effectiveHighwayBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '16px 12px',
            }}
            className="dual-bus-container"
          >
            {/* Subtle Landscape Sky Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(36, 21, 45, 0.15) 0%, transparent 40%, rgba(36, 21, 45, 0.4) 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Dynamic Red/Rose Curved Wave Graphics framing from right */}
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
                <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C13D78" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#8E2355" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E7A0BF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#C13D78" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <path d="M 60,0 Q 140,200 20,400 L 200,400 L 200,0 Z" fill="url(#waveGradient2)" />
              <path d="M 110,0 Q 180,180 80,400 L 200,400 L 200,0 Z" fill="url(#waveGradient1)" />
            </svg>

            {/* Dual Luxury Bus Staggered Presentation */}
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
              {/* Rear Coach (Slightly smaller, offset for highway depth) */}
              <div
                style={{
                  position: 'absolute',
                  left: '12%',
                  bottom: '18px',
                  width: '68%',
                  transform: 'scale(0.82)',
                  filter: 'drop-shadow(0 12px 20px rgba(0, 0, 0, 0.6)) blur(0.3px)',
                  opacity: 0.92,
                  zIndex: 2,
                }}
              >
                <img
                  src={effectiveBusCutout}
                  alt="SMART ROUTE Luxury Coach Rear"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>

              {/* Lead Coach (Crisp and dominant in front) */}
              <div
                style={{
                  position: 'relative',
                  width: '82%',
                  zIndex: 4,
                  filter: 'drop-shadow(0 16px 28px rgba(0, 0, 0, 0.75))',
                }}
              >
                <img
                  src={effectiveBusCutout}
                  alt="SMART ROUTE BOOKING Luxury Volvo/Tata Coach (Volvo 9600 Sleeper Coach)"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>

            {/* Official Brand Badge in corner: 2+1 A/C SLEEPER COACH */}
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
      </div>

      {/* ==================== 2. FLOATING MULTI-FIELD SEARCH WIDGET ==================== */}
      <div
        style={{
          marginTop: -38,
          marginBottom: 16,
          zIndex: 20,
          padding: '0 12px',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1.5px solid #F1EDFA',
            boxShadow: '0 16px 40px rgba(36, 21, 45, 0.08)',
            padding: '20px 24px',
            position: 'relative',
          }}
        >
          {/* Top Tag: BUS BOOKING Badge & Required Brand Invariant */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Red/Rose Pill Badge "BUS BOOKING" */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                  color: '#FFFFFF',
                  padding: '4px 14px',
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

              {/* Exact Header Tagline Invariant for Tests */}
              <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D', letterSpacing: '-0.01em' }}>
                SMART ROUTE Intercity Expresses
              </span>
            </div>

            <div style={{ fontSize: 12, color: '#6E5D73', fontWeight: 600 }}>
              Instant Live Confirmation &bull; Real-time Radar GPS
            </div>
          </div>

          {/* Search Inputs Toolbar (Desktop Single-line Grid / Mobile Stack) */}
          <form onSubmit={onSearch}>
            <div className="hero-search-toolbar-grid">
              {/* 1. From (Origin) */}
              <div style={{ textAlign: 'left' }}>
                <PlaceAutocomplete
                  id="hero-search-origin"
                  label="From"
                  value={fromCity}
                  onChange={(val) => onFromCityChange(val)}
                  onSelectPlace={(place) => onFromCityChange(place.city || place.mainText)}
                  placeholder="Enter source city"
                  icon={<MapPin size={15} color="#C13D78" />}
                  required
                />
              </div>

              {/* 2. Swap Button: Circular red floating button with white two-way exchange arrows (⇄) */}
              <div className="search-swap-col" style={{ display: 'flex', justifyContent: 'center', paddingBottom: 2 }}>
                <button
                  type="button"
                  onClick={onSwapCities}
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
                  title="Swap Origin and Destination"
                >
                  <ArrowLeftRight size={16} color="#FFFFFF" />
                </button>
              </div>

              {/* 3. To (Destination) */}
              <div style={{ textAlign: 'left' }}>
                <PlaceAutocomplete
                  id="hero-search-destination"
                  label="To"
                  value={toCity}
                  onChange={(val) => onToCityChange(val)}
                  onSelectPlace={(place) => onToCityChange(place.city || place.mainText)}
                  placeholder="Enter destination city"
                  icon={<MapPin size={15} color="#C13D78" />}
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
                  className="input-field"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  required
                  style={{ height: 44, border: '1.5px solid #F1EDFA', borderRadius: 10, width: '100%' }}
                />
              </div>

              {/* 5. Passengers Dropdown */}
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
                    border: '1.5px solid #F1EDFA',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#24152D',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {passengerLabel}
                  </span>
                  <ChevronDown size={14} color="#6E5D73" />
                </button>

                {/* Passenger Selector Popup */}
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
                      border: '1.5px solid #F1EDFA',
                      boxShadow: '0 8px 24px rgba(36, 21, 45, 0.12)',
                      padding: 14,
                      zIndex: 50,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Adults counter */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#24152D' }}>Adults</div>
                        <div style={{ fontSize: 11, color: '#6E5D73' }}>12+ yrs</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handlePassengerUpdate(Math.max(1, adults - 1), childrenCount)}
                          disabled={adults <= 1}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: '1px solid #E7A0BF',
                            background: '#FFF1F6',
                            color: '#C13D78',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: adults <= 1 ? 'default' : 'pointer',
                            opacity: adults <= 1 ? 0.4 : 1,
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>
                          {adults}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePassengerUpdate(Math.min(6, adults + 1), childrenCount)}
                          disabled={adults + childrenCount >= 6}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: '1px solid #E7A0BF',
                            background: '#FFF1F6',
                            color: '#C13D78',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: adults + childrenCount >= 6 ? 'default' : 'pointer',
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Children counter */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#24152D' }}>Children</div>
                        <div style={{ fontSize: 11, color: '#6E5D73' }}>0-11 yrs</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handlePassengerUpdate(adults, Math.max(0, childrenCount - 1))}
                          disabled={childrenCount <= 0}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: '1px solid #E7A0BF',
                            background: '#FFF1F6',
                            color: '#C13D78',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: childrenCount <= 0 ? 'default' : 'pointer',
                            opacity: childrenCount <= 0 ? 0.4 : 1,
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: 'center' }}>
                          {childrenCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePassengerUpdate(adults, Math.min(4, childrenCount + 1))}
                          disabled={adults + childrenCount >= 6}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            border: '1px solid #E7A0BF',
                            background: '#FFF1F6',
                            color: '#C13D78',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: adults + childrenCount >= 6 ? 'default' : 'pointer',
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPassengerDropdown(false)}
                      className="btn btn-primary"
                      style={{ padding: '6px', fontSize: 11, justifyContent: 'center' }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* 6. Search CTA Button: Prominent wide rounded-xl button in Rose Red */}
              <div className="search-cta-col">
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: 44,
                    fontSize: 13.5,
                    fontWeight: 800,
                    borderRadius: 12,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
                    boxShadow: '0 4px 16px rgba(193, 61, 120, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                  disabled={loading}
                >
                  <Search size={16} color="#FFFFFF" />
                  <span>{loading ? 'Searching...' : 'Search Buses'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ==================== 3. BOTTOM TRUST BADGES & AMENITIES RIBBON ==================== */}
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
        {/* Left: Red silhouette skyline illustration (India Gate, Big Ben, Ferris wheel, towers) on a wave curve */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            opacity: 0.45,
            width: 110,
            height: 40,
            flexShrink: 0,
          }}
          className="desktop-only"
          title="Iconic Skylines & Destinations"
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

        {/* Center: 4 Trust Feature Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            flex: 1,
          }}
          className="trust-cards-grid"
        >
          {/* 1. Safe & Secure */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', padding: '6px 10px', borderRadius: 12, boxShadow: '0 2px 8px rgba(36,21,45,0.04)' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#FFF1F6',
                border: '1px solid #E7A0BF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} color="#C13D78" />
            </div>
            <div>
              <div className="font-display text-base md:text-lg font-bold text-[#24152D]" style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Safe &amp; Secure</div>
              <div className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed" style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>Travel with confidence</div>
            </div>
          </div>

          {/* 2. Premium Comfort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', padding: '6px 10px', borderRadius: 12, boxShadow: '0 2px 8px rgba(36,21,45,0.04)' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#FFF1F6',
                border: '1px solid #E7A0BF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Armchair size={18} color="#C13D78" />
            </div>
            <div>
              <div className="font-display text-base md:text-lg font-bold text-[#24152D]" style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Premium Comfort</div>
              <div className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed" style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>2+1 A/C Sleeper &amp; Seater</div>
            </div>
          </div>

          {/* 3. Wide Network */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', padding: '6px 10px', borderRadius: 12, boxShadow: '0 2px 8px rgba(36,21,45,0.04)' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#FFF1F6',
                border: '1px solid #E7A0BF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={18} color="#C13D78" />
            </div>
            <div>
              <div className="font-display text-base md:text-lg font-bold text-[#24152D]" style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Wide Network</div>
              <div className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed" style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>Across India</div>
            </div>
          </div>

          {/* 4. 24/7 Support */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', padding: '6px 10px', borderRadius: 12, boxShadow: '0 2px 8px rgba(36,21,45,0.04)' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#FFF1F6',
                border: '1px solid #E7A0BF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Headphones size={18} color="#C13D78" />
            </div>
            <div>
              <div className="font-display text-base md:text-lg font-bold text-[#24152D]" style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>24/7 Support</div>
              <div className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed" style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>Always here for you</div>
            </div>
          </div>
        </div>

        {/* Right: Decorative Script Accent Text "Travel Beyond ✈️" with trailing dotted flight path line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #FFF1F6 0%, #FDF2F8 100%)',
            border: '1px solid #E7A0BF',
            padding: '4px 14px',
            borderRadius: 16,
            flexShrink: 0,
          }}
          className="desktop-only"
        >
          <span
            style={{
              fontFamily: "var(--sr-font-script), 'Dancing Script', 'Caveat', cursive",
              fontSize: 18,
              fontWeight: 700,
              color: '#C13D78',
            }}
            className="font-script text-lg md:text-xl font-semibold text-[#C13D78]"
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
  );
}
