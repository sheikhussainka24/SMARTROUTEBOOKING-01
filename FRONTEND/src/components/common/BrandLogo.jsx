import React from 'react';
import { Bus } from 'lucide-react';
import officialLogoMaster from '../../assets/smart-route-official-logo.jpg';
import officialIconCrop from '../../assets/smart-route-icon-crop.png';

/**
 * SMART ROUTE BOOKING — Official Master Brand Logo Component
 * Uses the exact user-provided black-and-gold luxury coach master image.
 *
 * Variants:
 * - 'full': Wide high-res luxury coach with object-fit: contain
 * - 'icon': Square high-res icon crop focusing on bus & SMART ROUTE BOOKING branding
 * - 'badge': Red rounded logo container (White bus icon) + bold SMART ROUTE + subtext — BOOKING —
 * - 'hero': Large cinematic badge for login/register/empty states
 */
export default function BrandLogo({
  variant = 'icon', // 'icon' | 'badge' | 'full' | 'hero'
  size = 'md',      // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText = true,
  subtitle = null,
  roleBadge = null,
  className = '',
  style = {},
}) {
  // Dimensions map
  const dimensions = {
    xs: { width: 32, height: 32, fullW: 80, fullH: 36, fontSize: 13, subSize: 9 },
    sm: { width: 40, height: 40, fullW: 100, fullH: 44, fontSize: 15, subSize: 10 },
    md: { width: 48, height: 48, fullW: 120, fullH: 52, fontSize: 17, subSize: 11 },
    lg: { width: 64, height: 64, fullW: 160, fullH: 70, fontSize: 20, subSize: 12 },
    xl: { width: 88, height: 88, fullW: 220, fullH: 96, fontSize: 24, subSize: 13 },
  };

  const dim = dimensions[size] || dimensions.md;

  if (variant === 'badge') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          ...style,
        }}
      >
        <div
          style={{
            width: dim.width,
            height: dim.height,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
            boxShadow: '0 4px 14px rgba(193, 61, 120, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bus size={Math.round(dim.width * 0.55)} color="#FFFFFF" />
        </div>

        {showText && (
          <div>
            <div
              style={{
                fontSize: dim.fontSize,
                fontWeight: 900,
                color: '#24152D',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              SMART ROUTE
              {roleBadge && (
                <span
                  style={{
                    fontSize: dim.subSize,
                    fontWeight: 800,
                    color: '#E11D48',
                    background: 'rgba(225, 29, 72, 0.1)',
                    border: '1px solid rgba(225, 29, 72, 0.25)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {roleBadge}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: dim.subSize,
                color: '#6E5D73',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginTop: 1,
              }}
            >
              {subtitle || '— BOOKING —'}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          ...style,
        }}
      >
        <div
          style={{
            width: dim.fullW,
            height: dim.fullH,
            borderRadius: 10,
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #070B14 0%, #111A30 100%)',
            border: '1px solid rgba(225, 29, 72, 0.35)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4), 0 0 10px rgba(225, 29, 72, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2,
            flexShrink: 0,
          }}
        >
          <img
            src={officialLogoMaster || '/assets/smart-route-official-logo.jpg'}
            alt="SMART ROUTE BOOKING Official Logo"
            onError={(e) => { e.currentTarget.src = '/assets/smart-route-official-logo.jpg'; }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {showText && (
          <div>
            <div
              style={{
                fontSize: dim.fontSize,
                fontWeight: 900,
                color: 'var(--sr-text-primary, #0F172A)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              SMART ROUTE
              {roleBadge && (
                <span
                  style={{
                    fontSize: dim.subSize,
                    fontWeight: 800,
                    color: 'var(--sr-primary, #E11D48)',
                    background: 'rgba(225, 29, 72, 0.1)',
                    border: '1px solid rgba(225, 29, 72, 0.25)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {roleBadge}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: dim.subSize,
                color: 'var(--sr-text-secondary, #64748B)',
                fontWeight: 600,
                letterSpacing: '0.02em',
                marginTop: 2,
              }}
            >
              {subtitle || 'BOOKING & FLEET PLATFORM'}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          ...style,
        }}
      >
        {/* Full Official Image in Luxury Container */}
        <div
          style={{
            width: '100%',
            maxWidth: 240,
            aspectRatio: '16 / 9',
            borderRadius: 16,
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #090E1A 0%, #111A30 100%)',
            border: '1.5px solid rgba(225, 29, 72, 0.45)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(225, 29, 72, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            marginBottom: 12,
          }}
        >
          <img
            src={officialLogoMaster || '/assets/smart-route-official-logo.jpg'}
            alt="SMART ROUTE BOOKING Luxury Coach"
            onError={(e) => { e.currentTarget.src = '/assets/smart-route-official-logo.jpg'; }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {showText && (
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: 'var(--sr-text-primary, #0F172A)',
                letterSpacing: '-0.01em',
              }}
            >
              SMART ROUTE BOOKING
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--sr-text-secondary, #64748B)',
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default: Square icon badge with exact user branding
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        ...style,
      }}
    >
      <div
        style={{
          width: dim.width,
          height: dim.height,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #070B14 0%, #111A30 100%)',
          border: '1px solid rgba(225, 29, 72, 0.35)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35), 0 0 10px rgba(225, 29, 72, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src={officialIconCrop || '/assets/smart-route-icon-crop.png'}
          alt="SMART ROUTE Official Brand Icon"
          onError={(e) => { e.currentTarget.src = '/assets/smart-route-official-logo.jpg'; }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {showText && (
        <div>
          <div
            style={{
              fontSize: dim.fontSize,
              fontWeight: 900,
              color: 'var(--sr-text-primary, #0F172A)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            SMART ROUTE
            {roleBadge && (
              <span
                style={{
                  fontSize: dim.subSize,
                  fontWeight: 800,
                  color: 'var(--sr-primary, #E11D48)',
                  background: 'rgba(225, 29, 72, 0.1)',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {roleBadge}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: dim.subSize,
              color: 'var(--sr-text-secondary, #64748B)',
              fontWeight: 600,
              letterSpacing: '0.02em',
              marginTop: 1,
            }}
          >
            {subtitle || 'BOOKING PLATFORM'}
          </div>
        </div>
      )}
    </div>
  );
}
