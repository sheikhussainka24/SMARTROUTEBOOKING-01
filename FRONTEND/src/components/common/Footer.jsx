import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowRight,
  Headphones,
} from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';
import { useHubConfig } from '../../config/hubConfig.js';

/**
 * SMART ROUTE — Modern Dark Teal/Slate 4-Column Footer
 * Palette: Deep Dark Slate (#0F172A) & Dark Teal (#042F2E)
 * Features:
 * - Wavy top divider border
 * - Column 1: Useful Links (Home, My Tickets, About Us, Contact Us, Boarding Points)
 * - Column 2: Support (Feedback, Agent Registration, Privacy Policy, Cancellation & Refund Policy, Terms & Conditions)
 * - Column 3: Get In Touch (Office Address, Email ID, 24/7 Helpline)
 * - Column 4: Social & Legal (Social icons, verified badges, copyright notice)
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { hubConfig } = useHubConfig();

  return (
    <footer
      style={{
        background: '#0F172A',
        color: '#E2E8F0',
        position: 'relative',
        marginTop: 'auto',
        width: '100%',
      }}
      className="footer-dark-teal"
    >
      {/* Wavy Top Divider Border SVG */}
      <div style={{ overflow: 'hidden', lineHeight: 0, width: '100%' }}>
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            height: 48,
            fill: '#FFFFFF',
          }}
        >
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,40 L1200,0 L0,0 Z" fill="#FFFFFF" />
        </svg>
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '40px 24px 60px',
        }}
      >
        {/* Main 4 Columns Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 36,
            marginBottom: 40,
          }}
          className="footer-grid-4col"
        >
          {/* Column 1: Useful Links */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                }}
              >
                <Bus size={18} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Useful Links
              </h4>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>
                <Link to="/" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s ease' }}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s ease' }}>
                  My Tickets
                </Link>
              </li>
              <li>
                <Link to="/about" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s ease' }}>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s ease' }}>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/search-results" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s ease' }}>
                  Boarding Points &amp; Routes
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Support */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                }}
              >
                <Headphones size={18} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Support &amp; Policies
              </h4>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>
                <Link to="/offers" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13 }}>
                  Promotions &amp; Offers
                </Link>
              </li>
              <li>
                <a href="#feedback" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13 }}>
                  Customer Feedback
                </a>
              </li>
              <li>
                <a href="#privacy" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13 }}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#cancellation" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13 }}>
                  Cancellation &amp; Refund Policy
                </a>
              </li>
              <li>
                <a href="#terms" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 13 }}>
                  Terms &amp; Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Get In Touch */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60A5FA',
                }}
              >
                <Phone size={18} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Get In Touch
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: '#94A3B8' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={16} color="#F5222D" style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={{ lineHeight: 1.5 }}>
                  {hubConfig?.line1 || 'SMART ROUTE Central Bus Hub'},<br />
                  {hubConfig?.line2 || 'Palakkad – Ukkadam Highway'},<br />
                  {hubConfig?.line3 || 'K.G. Chavadi, Coimbatore – 641105'},<br />
                  {hubConfig?.line4 || 'Tamil Nadu, India.'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} color="#F5222D" style={{ flexShrink: 0 }} />
                <a href="mailto:support@smartroutebooking.com" style={{ color: '#E2E8F0', textDecoration: 'none', fontWeight: 600 }}>
                  support@smartroutebooking.com
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} color="#10B981" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ color: '#FFFFFF', fontWeight: 700 }}>+91 8072065549</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Toll-Free 24/7 Helpline: +91 8072065549</div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Social & Legal */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BrandLogo variant="full" size="xs" subtitle="SMART ROUTE BOOKING" />
            </div>

            <p style={{ fontSize: 12, lineHeight: 1.6, color: '#94A3B8', margin: '0 0 16px 0' }}>
              India&apos;s leading intercity bus ticketing platform connecting 120+ major destinations with real-time GPS radar tracking and instant e-ticketing.
            </p>

            {/* Social Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
                aria-label="Twitter"
              >
                <Twitter size={16} />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
                aria-label="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
            </div>

            {/* Compliance Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: 11,
                color: '#34D399',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={14} /> 100% Secure Payment &bull; SSL 256-bit
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 12,
            color: '#64748B',
          }}
        >
          <div>
            &copy; {currentYear} SMART ROUTE Mobility Platform. All rights reserved. Direct Operator Settlement Compliant.
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <span>RTO Certified Fleet</span>
            <span>&bull;</span>
            <span>Zero Booking Surcharge</span>
            <span>&bull;</span>
            <span>Instant GPS Radar</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
