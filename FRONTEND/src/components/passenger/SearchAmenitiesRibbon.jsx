import React from 'react';
import {
  ShieldCheck,
  Radio,
  Snowflake,
  Zap,
  PhoneCall,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const AMENITIES = [
  {
    id: 'fleet',
    icon: ShieldCheck,
    title: 'Verified Luxury Fleet',
    subtitle: 'Executive Sleeper & Semi-Sleeper',
    tag: 'RTO Certified',
  },
  {
    id: 'gps',
    icon: Radio,
    title: 'Live Radar GPS',
    subtitle: 'Real-time telemetry every 5s',
    tag: 'Live Tracking',
  },
  {
    id: 'ac',
    icon: Snowflake,
    title: 'Climate Controlled AC',
    subtitle: 'UV purified individual airflow',
    tag: 'Micro-Filtered',
  },
  {
    id: 'power',
    icon: Zap,
    title: '230V & USB-C Power',
    subtitle: 'Dedicated charging + reading lamps',
    tag: 'At Every Berth',
  },
  {
    id: 'sos',
    icon: PhoneCall,
    title: '24/7 Passenger SOS',
    subtitle: 'Direct operations control room',
    tag: 'Instant Help',
  },
];

export default function SearchAmenitiesRibbon() {
  return (
    <section
      aria-label="SMART ROUTE Service Amenities"
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1.5px solid #F1EDFA',
        padding: '12px 16px',
        boxShadow: 'var(--sr-shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top subtle micro header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: '1px solid #FFF1F6',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} color="#C13D78" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#24152D', letterSpacing: '0.01em' }}>
            SMART ROUTE LUXURY STANDARDS
          </span>
          <span
            style={{
              fontSize: 10,
              background: '#FFF1F6',
              color: '#C13D78',
              padding: '1px 6px',
              borderRadius: 8,
              fontWeight: 700,
              border: '1px solid #E7A0BF',
            }}
          >
            Assured Comfort
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6E5D73', fontWeight: 600 }}>
          <CheckCircle2 size={12} color="#10B981" />
          <span>Zero Commission Fees &bull; Instant WhatsApp M-Ticket</span>
        </div>
      </div>

      {/* Amenities Ribbon Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          alignItems: 'stretch',
        }}
      >
        {AMENITIES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: '#FFF1F6',
                borderRadius: 12,
                border: '1px solid #F1EDFA',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'default',
              }}
              className="amenity-chip-hover"
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#FFFFFF',
                  border: '1.5px solid #E7A0BF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(193, 61, 120, 0.1)',
                }}
              >
                <Icon size={16} color="#C13D78" />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#24152D',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.title}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#6E5D73',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: 1,
                  }}
                >
                  {item.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
