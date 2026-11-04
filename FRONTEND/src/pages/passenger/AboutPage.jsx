import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, ShieldCheck, Award, Users, MapPin, Phone, Mail, Sparkles, ArrowRight } from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import busCutoutDay from '../../assets/bus-cutout-day.png';
import { useHubConfig } from '../../config/hubConfig.js';

export default function AboutPage() {
  const { hubConfig } = useHubConfig();
  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 20px 80px', width: '100%' }}>
      {/* Hero Showcase */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFFBFD 0%, #FFFFFF 100%)',
          borderRadius: 24,
          border: '1.5px solid #F1EDFA',
          padding: '48px 36px',
          marginBottom: 48,
          boxShadow: '0 8px 32px rgba(36, 21, 45, 0.05)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 40,
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#FFF1F6',
              border: '1px solid #E7A0BF',
              color: '#F5222D',
              borderRadius: 20,
              padding: '5px 14px',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            <Sparkles size={13} color="#F5222D" />
            <span>PIONEERING MODERN INTERCITY TRAVEL</span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              color: '#24152D',
              margin: '0 0 16px 0',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            About{' '}
            <span style={{ color: '#F5222D' }}>Smart Route Booking</span>
          </h1>
          <p style={{ fontSize: 16, color: '#6E5D73', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            SMART ROUTE BOOKING was founded with a singular vision: to bring world-class sleeper coach comfort, real-time GPS telemetry radar tracking, and transparent intercity ticketing to travellers across India.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link
              to="/search-results"
              style={{
                background: '#F5222D',
                color: '#FFFFFF',
                padding: '12px 24px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(245, 34, 45, 0.3)',
              }}
            >
              <span>Explore Routes</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/contact"
              style={{
                background: '#FFFFFF',
                color: '#24152D',
                border: '1.5px solid #E2E8F0',
                padding: '12px 24px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Contact Team
            </Link>
          </div>
        </div>

        {/* Coach Artwork Presentation */}
        <div
          style={{
            background: 'linear-gradient(145deg, #070B14 0%, #111A30 100%)',
            borderRadius: 20,
            padding: 24,
            border: '2px solid rgba(245, 34, 45, 0.35)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
            textAlign: 'center',
          }}
        >
          <img
            src={busCutoutDay}
            alt="Official SMART ROUTE BOOKING Luxury Coach"
            style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
          />
          <div style={{ marginTop: 16, color: '#FFFFFF', fontWeight: 800, fontSize: 14, letterSpacing: '0.04em' }}>
            VOLVO 9600 MULTI-AXLE &bull; 2+1 A/C SLEEPER FLEET
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
          marginBottom: 48,
        }}
      >
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #F1EDFA', boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF1F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5222D', marginBottom: 14 }}>
            <ShieldCheck size={20} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#24152D', margin: '0 0 6px 0' }}>Safety First</h3>
          <p style={{ fontSize: 13, color: '#6E5D73', lineHeight: 1.5, margin: 0 }}>
            Every coach undergoes strict RTO vehicle fitness checks, equipped with emergency push exits, fire extinguishers, and speed limiters.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #F1EDFA', boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF1F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5222D', marginBottom: 14 }}>
            <Bus size={20} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#24152D', margin: '0 0 6px 0' }}>2+1 Luxury Layout</h3>
          <p style={{ fontSize: 13, color: '#6E5D73', lineHeight: 1.5, margin: 0 }}>
            Custom-built berths with memory foam bedding, individual curtains, Reading lamps, and 230V + USB charging ports.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #F1EDFA', boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF1F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5222D', marginBottom: 14 }}>
            <Award size={20} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#24152D', margin: '0 0 6px 0' }}>Zero Hidden Fees</h3>
          <p style={{ fontSize: 13, color: '#6E5D73', lineHeight: 1.5, margin: 0 }}>
            What you see is what you pay. No unexpected convenience surcharges or payment gateway markups.
          </p>
        </div>

        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #F1EDFA', boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF1F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5222D', marginBottom: 14 }}>
            <Users size={20} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#24152D', margin: '0 0 6px 0' }}>24/7 Dedicated Care</h3>
          <p style={{ fontSize: 13, color: '#6E5D73', lineHeight: 1.5, margin: 0 }}>
            Our operations team monitors every trip with radar telemetry, available 24 hours at +91 8072065549.
          </p>
        </div>
      </div>

      {/* Official Contact Details Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1.5px solid #F1EDFA',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(36, 21, 45, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#24152D', margin: '0 0 8px 0' }}>
            Official Registered Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: '#6E5D73' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={15} color="#F5222D" />
              <span>Helpline: <strong>+91 8072065549</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={15} color="#F5222D" />
              <span>Email: <strong>support@smartroutebooking.com</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={15} color="#F5222D" />
              <span>Hub: {hubConfig?.formattedAddress || 'SMART ROUTE Central Bus Hub, Palakkad – Ukkadam Highway, K.G. Chavadi, Coimbatore – 641105, Tamil Nadu, India.'}</span>
            </div>
          </div>
        </div>

        <Link
          to="/search-results"
          style={{
            background: '#F5222D',
            color: '#FFFFFF',
            padding: '12px 28px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          Book Your Journey
        </Link>
      </div>
    </div>
  );
}
