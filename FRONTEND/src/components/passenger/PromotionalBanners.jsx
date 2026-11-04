import React from 'react';
import { ShieldCheck, Star, Sparkles, Tag } from 'lucide-react';

/**
 * Promotional Banners Carousel / Ribbon
 * Highlights Primo guarantees, flash deals, and passenger exclusive offers.
 */
export default function PromotionalBanners({ onSelectPromo }) {
  const BANNERS = [
    {
      id: 'primo',
      title: 'SMART Assured',
      subtitle: 'On-time guarantee & 150% refund on delays',
      badge: 'Primo Fleet',
      icon: <ShieldCheck size={18} color="#C13D78" />,
      bg: 'linear-gradient(135deg, #FFF1F6 0%, #FCE7F3 100%)',
      border: '#E7A0BF',
      badgeBg: '#C13D78',
      badgeColor: '#FFFFFF',
      filterKey: 'primo',
    },
    {
      id: 'ratings',
      title: 'Highest Rated Buses',
      subtitle: '4.8★+ verified luxury sleeper & seater coaches',
      badge: 'Top Rated',
      icon: <Star size={18} color="#D97706" fill="#D97706" />,
      bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      border: '#FDE68A',
      badgeBg: '#D97706',
      badgeColor: '#FFFFFF',
      filterKey: 'high_rated',
    },
    {
      id: 'women',
      title: 'Women Exclusive Offer',
      subtitle: 'Flat ₹100 OFF on single/window berths • SMARTWOMEN',
      badge: 'Flat ₹100 OFF',
      icon: <Sparkles size={18} color="#9333EA" />,
      bg: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
      border: '#E9D5FF',
      badgeBg: '#9333EA',
      badgeColor: '#FFFFFF',
      filterKey: 'single',
    },
    {
      id: 'flash',
      title: 'Flash Express Offers',
      subtitle: 'Instant ₹60 OFF with coupon SMARTROUTE',
      badge: 'Code: SMARTROUTE',
      icon: <Tag size={18} color="#059669" />,
      bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
      border: '#BBF7D0',
      badgeBg: '#059669',
      badgeColor: '#FFFFFF',
      filterKey: 'offers',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 10,
        width: '100%',
      }}
      className="promo-banners-grid"
    >
      {BANNERS.map((banner) => (
        <div
          key={banner.id}
          onClick={() => onSelectPromo && onSelectPromo(banner.filterKey)}
          style={{
            background: banner.bg,
            border: `1.5px solid ${banner.border}`,
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            cursor: onSelectPromo ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(36, 21, 45, 0.03)',
          }}
          className="promo-banner-card"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {banner.icon}
              <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>
                {banner.title}
              </span>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                background: banner.badgeBg,
                color: banner.badgeColor,
                padding: '2px 7px',
                borderRadius: 12,
              }}
            >
              {banner.badge}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500, lineHeight: 1.35 }}>
            {banner.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
