import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Sparkles, Copy, Check, ArrowRight, ShieldCheck, Bus, Clock } from 'lucide-react';

const OFFERS = [
  {
    id: 'first15',
    code: 'SMARTFIRST',
    discount: '15% OFF',
    title: 'First Journey Special',
    description: 'Get flat 15% discount up to ₹150 on your very first intercity luxury bus booking.',
    validTill: 'Valid until 31 Dec 2026',
    route: 'All Intercity Routes',
    badge: 'Popular',
  },
  {
    id: 'roundtrip',
    code: 'ROUNDTRIP',
    discount: '₹150 OFF',
    title: 'Round Trip Savings',
    description: 'Save flat ₹150 when reserving your return journey together with your outbound ticket.',
    validTill: 'Valid on 2-way bookings',
    route: 'Coimbatore ⇄ All Destinations',
    badge: 'Best Value',
  },
  {
    id: 'sleeperlux',
    code: 'SLEEPERLUX',
    discount: '10% OFF',
    title: 'Volvo 9600 Sleeper Luxury',
    description: 'Enjoy 10% instant off on our flagship 2+1 AC Sleeper coaches across South India.',
    validTill: 'Mon - Thu departures',
    route: 'Volvo 9600 2+1 AC Sleeper',
    badge: 'Luxury',
  },
  {
    id: 'group4',
    code: 'SMARTGROUP',
    discount: '₹300 OFF',
    title: 'Group Booking Bonanza',
    description: 'Flat ₹300 off on bookings of 4 or more seats. Travel together, save together.',
    validTill: 'Minimum 4 passengers',
    route: 'All Fleet Services',
    badge: 'Group Deal',
  },
];

export default function OffersPage() {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 20px 80px', width: '100%' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFF1F6 0%, #FFFFFF 100%)',
          borderRadius: 24,
          border: '1.5px solid #F1EDFA',
          padding: '40px 32px',
          marginBottom: 40,
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(36, 21, 45, 0.04)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#FFF1F6',
            border: '1px solid #E7A0BF',
            color: '#F5222D',
            borderRadius: 20,
            padding: '5px 16px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          <Sparkles size={14} color="#F5222D" />
          <span>Exclusive Promotions</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 900,
            color: '#24152D',
            margin: '0 0 12px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Smart Route Deals &amp; Discounts
        </h1>
        <p style={{ fontSize: 16, color: '#6E5D73', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Enjoy transparent, zero-surcharge pricing and genuine savings on our luxury sleeper coach network.
        </p>
      </div>

      {/* Offers Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}
      >
        {OFFERS.map((offer) => (
          <div
            key={offer.id}
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px solid #F1EDFA',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(36, 21, 45, 0.05)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            {/* Top Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #F5222D 0%, #D4380D 100%)',
                  color: '#FFFFFF',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {offer.badge}
              </span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#F5222D' }}>
                {offer.discount}
              </span>
            </div>

            {/* Title & Description */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#24152D', margin: '0 0 8px 0' }}>
                {offer.title}
              </h3>
              <p style={{ fontSize: 13, color: '#6E5D73', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                {offer.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94A3B8' }}>
                <Clock size={13} color="#94A3B8" />
                <span>{offer.validTill}</span>
              </div>
            </div>

            {/* Coupon Code Strip */}
            <div
              style={{
                background: '#FFF1F6',
                border: '1.5px dashed #F5222D',
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>Coupon Code</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#24152D', letterSpacing: '0.06em' }}>{offer.code}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(offer.code)}
                style={{
                  background: copiedCode === offer.code ? '#10B981' : '#FFFFFF',
                  color: copiedCode === offer.code ? '#FFFFFF' : '#F5222D',
                  border: '1px solid #E7A0BF',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check size={13} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Action CTA */}
            <button
              type="button"
              onClick={() => navigate('/search-results')}
              style={{
                width: '100%',
                padding: '10px',
                background: '#F5222D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              <span>Book with Offer</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
