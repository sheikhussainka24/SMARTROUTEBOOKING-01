import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowLeftRight,
  ArrowRight,
  Route,
  Sparkles,
  Search,
  CheckCircle2,
  Navigation,
  Compass,
} from 'lucide-react';
import leadBusNight from '../../assets/bus-cutout-night.png';
import {
  OPERATIONAL_CARAVAN_ROUTES,
  ROUTE_CATEGORIES,
} from '../../data/routesData.js';

/**
 * Mechanical Hitch / Trailer Coupler Link SVG Component
 * Connects the lead bus to trailer #1, and connects consecutive route cards.
 * Features heavy gunmetal drawbars, pivot socket, red/amber pneumatic air hoses, and safety chains.
 */
function TrailerCoupler() {
  return (
    <div
      className="trailer-coupler"
      style={{
        width: 36,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 5,
        alignSelf: 'flex-end',
        marginBottom: 20,
      }}
      aria-hidden="true"
    >
      <svg width="36" height="30" viewBox="0 0 36 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Drawbar top steel arm */}
        <rect x="0" y="10" width="36" height="4" rx="2" fill="url(#metalGrad)" />
        {/* Drawbar bottom steel arm */}
        <rect x="0" y="16" width="36" height="4" rx="2" fill="url(#metalGrad)" />

        {/* Center spherical hitch joint / socket */}
        <circle cx="18" cy="15" r="5" fill="#24152D" stroke="#E7A0BF" strokeWidth="1.5" />
        <circle cx="18" cy="15" r="2.5" fill="#C13D78" />

        {/* Coiled pneumatic air brake hoses (Red & Amber) */}
        <path d="M4 8 Q 10 3, 18 8 T 32 8" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M4 22 Q 10 27, 18 22 T 32 22" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Hanging safety chain loops */}
        <path d="M2 17 C 8 26, 14 26, 18 17 C 22 26, 28 26, 34 17" stroke="#94A3B8" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />

        {/* Fastening bolts */}
        <circle cx="3" cy="12" r="1.5" fill="#E2E8F0" />
        <circle cx="3" cy="18" r="1.5" fill="#E2E8F0" />
        <circle cx="33" cy="12" r="1.5" fill="#E2E8F0" />
        <circle cx="33" cy="18" r="1.5" fill="#E2E8F0" />

        <defs>
          <linearGradient id="metalGrad" x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#332B3A" />
            <stop offset="0.5" stopColor="#6E5D73" />
            <stop offset="1" stopColor="#24152D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Trailer Bogie Wheels & Heavy Chassis Assembly Component
 * Renders twin rubber tyres with alloy rims, brake caliper details, and steel chassis beam beneath each route card.
 */
function TrailerBogieWheels({ isPaused = false }) {
  return (
    <div
      className="trailer-bogie-assembly"
      style={{
        width: '100%',
        height: 38,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 4,
      }}
      aria-hidden="true"
    >
      {/* Heavy Steel Chassis Platform Beam */}
      <div
        style={{
          width: '94%',
          height: 7,
          background: 'linear-gradient(180deg, #3D3346 0%, #201726 100%)',
          borderRadius: 3,
          border: '1px solid #4E4259',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {/* Safety reflector markers */}
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 4px #F59E0B' }} />
        <div style={{ height: 2, flex: 1, margin: '0 6px', background: 'rgba(231, 160, 191, 0.25)', borderRadius: 1 }} />
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C13D78', boxShadow: '0 0 4px #C13D78' }} />
      </div>

      {/* Twin Bogie Wheels (Left & Right Tyres) */}
      <div
        style={{
          width: '82%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: -2,
        }}
      >
        {/* Left Wheel */}
        <div className="wheel-unit" style={{ position: 'relative' }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className={isPaused ? '' : 'tyre-spin-anim'}
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}
          >
            {/* Outer Rubber Tyre */}
            <circle cx="14" cy="14" r="13" fill="#1C1824" stroke="#372F42" strokeWidth="2" />
            {/* Tyre tread markings */}
            <circle cx="14" cy="14" r="10.5" stroke="#4B3F5A" strokeWidth="1" strokeDasharray="3 2" fill="none" />
            {/* Chrome/Silver Alloy Rim */}
            <circle cx="14" cy="14" r="8" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            {/* 5 Wheel Lug Nuts */}
            <circle cx="14" cy="8.5" r="1" fill="#475569" />
            <circle cx="19" cy="12" r="1" fill="#475569" />
            <circle cx="17.5" cy="18" r="1" fill="#475569" />
            <circle cx="10.5" cy="18" r="1" fill="#475569" />
            <circle cx="9" cy="12" r="1" fill="#475569" />
            {/* Center Hub Cap with Rose Accent */}
            <circle cx="14" cy="14" r="3.2" fill="#C13D78" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="14" cy="14" r="1.2" fill="#FFFFFF" />
          </svg>
          {/* Ground Contact Shadow */}
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              left: 2,
              width: 24,
              height: 4,
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Trailer Suspension Spring Detail */}
        <div
          style={{
            width: 20,
            height: 4,
            background: 'repeating-linear-gradient(90deg, #64748B, #64748B 2px, #334155 2px, #334155 4px)',
            borderRadius: 2,
            marginTop: 4,
          }}
        />

        {/* Right Wheel */}
        <div className="wheel-unit" style={{ position: 'relative' }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className={isPaused ? '' : 'tyre-spin-anim'}
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}
          >
            {/* Outer Rubber Tyre */}
            <circle cx="14" cy="14" r="13" fill="#1C1824" stroke="#372F42" strokeWidth="2" />
            {/* Tyre tread markings */}
            <circle cx="14" cy="14" r="10.5" stroke="#4B3F5A" strokeWidth="1" strokeDasharray="3 2" fill="none" />
            {/* Chrome/Silver Alloy Rim */}
            <circle cx="14" cy="14" r="8" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            {/* 5 Wheel Lug Nuts */}
            <circle cx="14" cy="8.5" r="1" fill="#475569" />
            <circle cx="19" cy="12" r="1" fill="#475569" />
            <circle cx="17.5" cy="18" r="1" fill="#475569" />
            <circle cx="10.5" cy="18" r="1" fill="#475569" />
            <circle cx="9" cy="12" r="1" fill="#475569" />
            {/* Center Hub Cap with Rose Accent */}
            <circle cx="14" cy="14" r="3.2" fill="#C13D78" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="14" cy="14" r="1.2" fill="#FFFFFF" />
          </svg>
          {/* Ground Contact Shadow */}
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              left: 2,
              width: 24,
              height: 4,
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Lead Flagship Luxury Coach Component
 * Munnadi lead pannitu pogum official SMART ROUTE black and gold double-decker bus.
 * Features glowing LED headlight beam radiating forward (leftward) and rear tow hitch.
 */
function LeadCoachUnit({ badgeText = 'FLAGSHIP LEAD COACH', isMaster = true }) {
  return (
    <div
      className="lead-coach-unit"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexShrink: 0,
        position: 'relative',
        zIndex: 6,
        paddingRight: 6,
      }}
    >
      {/* Lead Coach Container */}
      <div
        style={{
          position: 'relative',
          width: 250,
          height: 142,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {/* Forward Headlight Beam Glow Effect (Radiating leftwards into the travel direction) */}
        <div
          className="headlight-beam-glow"
          style={{
            position: 'absolute',
            left: -130,
            bottom: 6,
            width: 170,
            height: 90,
            background: 'radial-gradient(ellipse at 100% 60%, rgba(254, 240, 138, 0.45) 0%, rgba(254, 240, 138, 0.18) 45%, transparent 75%)',
            pointerEvents: 'none',
            zIndex: 1,
            transform: 'rotate(-5deg)',
          }}
        />

        {/* Official SMART ROUTE Black & Gold Luxury Coach Cutout (Flipped to face Leftward motion) */}
        <img
          src={leadBusNight}
          alt={`SMART ROUTE ${badgeText}`}
          style={{
            width: 250,
            height: 'auto',
            maxHeight: 140,
            objectFit: 'contain',
            transform: 'scaleX(-1)', // Flips bus so front cockpit faces left (direction of travel)
            filter: 'drop-shadow(0 8px 18px rgba(0, 0, 0, 0.35)) drop-shadow(0 0 12px rgba(193, 61, 120, 0.25))',
            position: 'relative',
            zIndex: 2,
          }}
          loading="eager"
        />

        {/* Lead Vehicle Flagship Badge overlay on top */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            right: 10,
            background: isMaster
              ? 'linear-gradient(135deg, #1A1420 0%, #2A1D33 100%)'
              : 'linear-gradient(135deg, #24152D 0%, #3D1E3A 100%)',
            border: isMaster ? '1.5px solid #C13D78' : '1.5px solid #E7A0BF',
            color: '#FFFFFF',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(193, 61, 120, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            zIndex: 3,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: isMaster ? '#10B981' : '#F59E0B',
              boxShadow: `0 0 6px ${isMaster ? '#10B981' : '#F59E0B'}`,
            }}
          />
          <span>{badgeText}</span>
        </div>
      </div>

      {/* Lead Bus Chassis Ground Contact Shadow */}
      <div
        style={{
          width: 230,
          height: 10,
          background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 85%)',
          borderRadius: '50%',
          marginTop: -4,
          marginBottom: 10,
        }}
      />
    </div>
  );
}

/**
 * Individual Route Trailer Card Component
 * Formatted with Soft-Pink tokens, bogie wheels beneath, and interactive click-to-search handlers.
 */
function RouteTrailerCard({
  route,
  isPaused,
  onSelectRoute,
}) {
  const handleClick = (e) => {
    e.preventDefault();
    if (onSelectRoute) {
      onSelectRoute(route);
    }
  };

  return (
    <div
      className="route-trailer-unit"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 5,
        cursor: 'pointer',
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e);
        }
      }}
      aria-label={`Select Route ${route.from} to ${route.to}, distance ${route.distance}`}
    >
      {/* Route Card Body (Sitting on the trailer chassis) */}
      <div
        className="route-card-surface"
        style={{
          width: 236,
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1.5px solid #F1EDFA',
          padding: '12px 14px',
          boxShadow: '0 6px 18px rgba(36, 21, 45, 0.05), 0 2px 4px rgba(193, 61, 120, 0.03)',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Master Route Highlight Ribbon */}
        {route.isMaster && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #C13D78, #E7A0BF, #C13D78)',
            }}
          />
        )}

        {/* Card Top: Region Pill Badge & Distance */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#C13D78',
                background: '#FFF1F6',
                border: '1px solid #E7A0BF',
                padding: '1px 6px',
                borderRadius: 8,
                letterSpacing: '0.02em',
              }}
            >
              {route.stateBadge}
            </span>
            {route.popular && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#10B981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '1px 5px',
                  borderRadius: 6,
                }}
              >
                Popular
              </span>
            )}
          </div>

          <span style={{ fontSize: 11, fontWeight: 700, color: '#6E5D73' }}>
            {route.distance}
          </span>
        </div>

        {/* Card Middle: From City ⇄ To City */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            padding: '2px 0',
          }}
        >
          {/* Origin City */}
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#24152D',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={route.from}
            >
              {route.from}
            </div>
            <div style={{ fontSize: 9, color: '#6E5D73', fontWeight: 600 }}>Origin</div>
          </div>

          {/* Dynamic Transfer Arrow Icon */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#FFF1F6',
              border: '1.2px solid #E7A0BF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(193, 61, 120, 0.12)',
              transition: 'transform 0.2s ease',
            }}
            className="transfer-arrow-badge"
          >
            {route.isTwoWay ? (
              <ArrowLeftRight size={13} color="#C13D78" />
            ) : (
              <ArrowRight size={13} color="#C13D78" />
            )}
          </div>

          {/* Destination City */}
          <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#24152D',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={route.to}
            >
              {route.to}
            </div>
            <div style={{ fontSize: 9, color: '#6E5D73', fontWeight: 600 }}>Destination</div>
          </div>
        </div>

        {/* Card Bottom: Service Duration & Action Link */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 6,
            borderTop: '1px solid #FFF1F6',
            marginTop: 2,
          }}
        >
          <span style={{ fontSize: 10, color: '#6E5D73', fontWeight: 600 }}>
            ⏱️ {route.duration} &bull; {route.frequency ? route.frequency.split(' ')[0] : 'Daily'}
          </span>

          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#C13D78',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            Book <ArrowRight size={10} color="#C13D78" />
          </span>
        </div>
      </div>

      {/* Bogie Assembly & Rubber Tyres Beneath Card */}
      <TrailerBogieWheels isPaused={isPaused} />
    </div>
  );
}

/**
 * Main Bus Routes Caravan Component
 * Features Highway Track, Lead Bus, Mechanical Couplers, 70 Route Cards, and Seamless Infinite Marquee.
 */
export default function BusRoutesCaravan({ onSelectRoute }) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [caravanKey, setCaravanKey] = useState(0);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCaravanKey((k) => k + 1);
  };

  // Guarantee animation starts from lead coach on initial browser mount
  useEffect(() => {
    setCaravanKey((k) => k + 1);
  }, []);

  // Filter routes based on category and search text
  const filteredRoutes = useMemo(() => {
    let list = OPERATIONAL_CARAVAN_ROUTES;

    if (selectedCategory !== 'all') {
      list = list.filter((r) => r.category === selectedCategory);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.from.toLowerCase().includes(q) ||
          r.to.toLowerCase().includes(q) ||
          (r.region && r.region.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedCategory, searchFilter]);

  // Click-to-Search Navigation Handler (Real Page Transition to dedicated Search Results)
  const handleCardClick = (route) => {
    const origin = route.searchFrom || route.from;
    const destination = route.searchTo || route.to;

    setSelectedNotification(`${route.from} ➔ ${route.to}`);
    setTimeout(() => {
      setSelectedNotification(null);
    }, 2500);

    if (onSelectRoute) {
      onSelectRoute(route);
    } else {
      navigate(`/search-results?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}`);
    }
  };

  // Highway milestones placed periodically along the highway
  const milestoneLabels = ['NH 544 &bull; KM 0', 'NH 44 &bull; KM 365', 'NH 744 &bull; KM 320', 'SMART ROUTE EXPRESS'];

  // Pure uninterrupted 60fps infinite marquee duration scaled smoothly by corridor dataset
  const animationDurationSeconds = Math.max(
    30,
    Math.round((filteredRoutes.length * 3.5) + 20)
  );

  // Helper to render convoy squadrons led by official Lead Coaches
  const renderConvoySquadrons = (routes, category, isPausedState, clickHandler, setPrefix = 'set1') => {
    // If specific category is selected, render lead coach for that category + trailers
    if (category !== 'all') {
      const catObj = ROUTE_CATEGORIES.find((c) => c.id === category);
      const catLabel = catObj ? catObj.label : 'Regional';
      return (
        <div
          className="caravan-convoy-set"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            paddingLeft: 'min(440px, 36vw)',
          }}
        >
          <LeadCoachUnit
            badgeText={`${catLabel.toUpperCase()} LEAD COACH`}
            isMaster={category === 'master'}
          />
          <TrailerCoupler />
          {routes.map((route, idx) => (
            <React.Fragment key={`${setPrefix}-${route.id}`}>
              <RouteTrailerCard
                route={route}
                isPaused={isPausedState}
                onSelectRoute={clickHandler}
              />
              {idx < routes.length - 1 && <TrailerCoupler />}
            </React.Fragment>
          ))}
          <TrailerCoupler />
        </div>
      );
    }

    // All routes: organize into 5 regional squadrons, each preceded by its official Lead Coach:
    const squadrons = [
      {
        badge: 'FLAGSHIP LEAD COACH',
        isMaster: true,
        routes: routes.filter((r) => r.category === 'master' || r.category === 'tn'),
      },
      {
        badge: 'INTERSTATE LEAD COACH',
        isMaster: false,
        routes: routes.filter((r) => r.category === 'ka'),
      },
      {
        badge: 'MALABAR LEAD COACH',
        isMaster: false,
        routes: routes.filter((r) => r.category === 'kl'),
      },
      {
        badge: 'DECCAN LEAD COACH',
        isMaster: false,
        routes: routes.filter((r) => r.category === 'ap_ts'),
      },
      {
        badge: 'PAN-INDIA LEAD COACH',
        isMaster: false,
        routes: routes.filter((r) => r.category === 'west'),
      },
    ].filter((s) => s.routes.length > 0);

    return (
      <div
        className="caravan-convoy-set"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          paddingLeft: 'min(440px, 36vw)',
        }}
      >
        {squadrons.map((sq, sqIdx) => (
          <React.Fragment key={`${setPrefix}-sq-${sqIdx}`}>
            {/* Official Lead Coach leading this squadron */}
            <LeadCoachUnit badgeText={sq.badge} isMaster={sq.isMaster} />
            <TrailerCoupler />

            {/* Squadron Route Trailer Cards */}
            {sq.routes.map((route, rIdx) => (
              <React.Fragment key={`${setPrefix}-${route.id}`}>
                <RouteTrailerCard
                  route={route}
                  isPaused={isPausedState}
                  onSelectRoute={clickHandler}
                />
                {(rIdx < sq.routes.length - 1 || sqIdx < squadrons.length - 1) && (
                  <TrailerCoupler />
                )}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
        <TrailerCoupler />
      </div>
    );
  };

  return (
    <section
      aria-label="SMART ROUTE Operating Bus Routes Caravan"
      style={{
        background: '#FFF1F6',
        borderRadius: 20,
        border: '1.5px solid #F1EDFA',
        padding: '24px 0 20px',
        boxShadow: 'var(--sr-shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ==================== 1. CENTER-ALIGNED SECTION HEADER ==================== */}
      <div style={{ textAlign: 'center', padding: '0 20px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#FFFFFF',
            border: '1.5px solid #E7A0BF',
            padding: '4px 14px',
            borderRadius: 20,
            marginBottom: 8,
            boxShadow: '0 2px 8px rgba(193, 61, 120, 0.08)',
          }}
        >
          <Route size={15} color="#C13D78" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#C13D78', letterSpacing: '0.04em' }}>
            OPERATING CARAVAN TRAIN
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
          <div className="eyebrow-accent-badge font-script text-2xl md:text-3xl font-semibold text-[#24152D]">
            <span className="first-letter-dot" />
            Our Routes
          </div>
        </div>

        {/* Section Headline */}
        <h2
          className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-[#24152D] leading-snug"
          style={{
            margin: '0 auto 6px',
            textAlign: 'center',
            maxWidth: 780,
          }}
        >
          Our Extensive Bus Routes Connect You To Major Cities And Destinations
        </h2>

        {/* Section Subtitle */}
        <p
          className="font-sans text-xs md:text-sm font-normal text-[#6E5D73] leading-relaxed"
          style={{
            maxWidth: 720,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          Ensuring A Convenient And Comfortable Journey Across South &amp; Western India
        </p>
      </div>

      {/* ==================== CATEGORY FILTER BAR & SPEED CONTROLS ==================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          padding: '0 20px',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {ROUTE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 16,
                  border: '1.2px solid',
                  borderColor: isSelected ? '#C13D78' : '#F1EDFA',
                  background: isSelected ? '#C13D78' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#24152D',
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 600,
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 8px rgba(193, 61, 120, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 10,
                    background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#FFF1F6',
                    color: isSelected ? '#FFFFFF' : '#C13D78',
                    fontWeight: 800,
                  }}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search Input & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Quick Search in Caravan */}
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              color="#6E5D73"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Find city or route..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                height: 32,
                padding: '0 10px 0 28px',
                borderRadius: 16,
                border: '1px solid #E7A0BF',
                background: '#FFFFFF',
                fontSize: 11,
                color: '#24152D',
                outline: 'none',
                width: 160,
              }}
            />
          </div>
        </div>
      </div>

      {/* Active Route Selection Notification Toast */}
      {selectedNotification && (
        <div
          style={{
            alignSelf: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#FFFFFF',
            border: '1.5px solid #C13D78',
            borderRadius: 20,
            padding: '4px 14px',
            boxShadow: '0 4px 14px rgba(193, 61, 120, 0.2)',
            fontSize: 12,
            fontWeight: 700,
            color: '#24152D',
            animation: 'fadeInUp 0.25s ease',
          }}
        >
          <CheckCircle2 size={14} color="#10B981" />
          <span>Selected Corridor: <strong>{selectedNotification}</strong> &bull; Loading available coaches...</span>
        </div>
      )}

      {/* ==================== 2. THE HIGHWAY CARAVAN TRACK (SEAMLESS 60FPS MARQUEE) ==================== */}
      <div
        className="highway-track-wrapper"
        style={{
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          paddingTop: 10,
        }}
      >
        {/* Upper Highway Verge / Grass Shoulder Accent */}
        <div
          style={{
            height: 3,
            width: '100%',
            background: 'linear-gradient(90deg, #E7A0BF, #F1EDFA, #E7A0BF)',
          }}
        />

        {/* Highway Asphalt Road Bed */}
        <div
          className="highway-asphalt-bed"
          style={{
            background: 'linear-gradient(180deg, #1C1724 0%, #292032 35%, #241A2D 85%, #18131E 100%)',
            position: 'relative',
            paddingTop: 22,
            paddingBottom: 0,
            boxShadow: 'inset 0 6px 12px rgba(0, 0, 0, 0.4), inset 0 -6px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Subtle Ambient Street Lamp Glows along the highway */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              width: 140,
              height: 140,
              background: 'radial-gradient(circle, rgba(254, 240, 138, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '60%',
              width: 140,
              height: 140,
              background: 'radial-gradient(circle, rgba(254, 240, 138, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Marquee Track Container (Hover pauses glide) */}
          <div
            className={`caravan-marquee-container ${isPaused ? 'paused-track' : ''}`}
            style={{
              display: 'flex',
              width: '100%',
              overflow: 'hidden',
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            {/* The Infinite Gliding Stream (Contains 2 exact sets for 0px glitch-free loop) */}
            <div
              key={`caravan-stream-${caravanKey}-${selectedCategory}-${searchFilter}`}
              className="caravan-stream"
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                width: 'max-content',
                animation: `caravanGlide ${animationDurationSeconds}s linear infinite`,
                animationPlayState: isPaused ? 'paused' : 'running',
                willChange: 'transform',
              }}
            >
              {/* SET 1: Lead Bus + Couplers + Route Cards in Squadrons */}
              {renderConvoySquadrons(filteredRoutes, selectedCategory, isPaused, handleCardClick, 'set1')}

              {/* SET 2: Identical Duplicate for Continuous Seamless Wrap */}
              {renderConvoySquadrons(filteredRoutes, selectedCategory, isPaused, handleCardClick, 'set2')}
            </div>
          </div>

          {/* Highway Road Surface & Center Dashed Lane Divider (Underneath the Tyres) */}
          <div
            className="highway-lane-surface"
            style={{
              height: 24,
              width: '100%',
              background: '#1A1420',
              borderTop: '2px solid rgba(231, 160, 191, 0.4)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Center Dashed White/Yellow Line */}
            <div
              className={`road-dashed-line ${isPaused ? 'paused-road' : ''}`}
              style={{
                width: '100%',
                height: 3,
                background: 'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.85) 0, rgba(255, 255, 255, 0.85) 24px, transparent 24px, transparent 48px)',
              }}
            />
          </div>

          {/* Lower Highway Curb / Milestone Strip */}
          <div
            style={{
              height: 8,
              width: '100%',
              background: 'repeating-linear-gradient(90deg, #E7A0BF 0, #E7A0BF 30px, #24152D 30px, #24152D 60px)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </div>

      {/* ==================== 3. SECTION FOOTER HELPER ==================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          padding: '0 20px',
          fontSize: 11,
          color: '#6E5D73',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={13} color="#C13D78" />
          <span>Uninterrupted 60fps Caravan Marquee &bull; Click any route trailer card to navigate directly to buses</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Active Operations: <strong>{filteredRoutes.length} Configured Routes</strong></span>
        </div>
      </div>
    </section>
  );
}
