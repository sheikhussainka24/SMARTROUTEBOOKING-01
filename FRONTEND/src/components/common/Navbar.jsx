import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Bus,
  User,
  LogOut,
  Shield,
  Compass,
  Radio,
  Menu,
  X,
  Ticket,
  Sparkles,
  Mail,
  Phone,
  Smartphone,
  Tag,
  Info,
  PhoneCall,
  Mic,
  Download,
  MessageSquare,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';
import { SocketStatusBadge } from '../../context/SocketContext.jsx';

// Official brand accent palette: Coral Red (#EF4444) & Legacy Plum Accent (#C13D78)
const BRAND_ACCENT_CORAL = '#EF4444';
const BRAND_ACCENT_ROSE = '#C13D78';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isTicketPage =
    location.pathname.startsWith('/booking-success') ||
    location.pathname.startsWith('/ticket') ||
    location.pathname.startsWith('/ticket-view') ||
    location.pathname.startsWith('/ticket-confirmation');

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%' }}>
      {/* ==================== 1. TOP UTILITY BAR (TOP-MOST STRIP) ==================== */}
      {!isTicketPage && (
        <div
          style={{
            background: '#FFFFFF',
            color: '#24152D',
            fontSize: 12,
            padding: '6px 24px',
            borderBottom: '1px solid #F1EDFA',
          }}
          className="top-utility-contact-bar top-utility-bar top-utility-strip print:hidden print-hidden"
        >
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {/* Left Section: Email | Phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {/* Email icon + support email */}
            <a
              href="mailto:support@smartroutebooking.com"
              style={{
                color: '#6E5D73',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E11D48')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6E5D73')}
            >
              <Mail size={13} color="#C13D78" />
              <span>support@smartroutebooking.com</span>
            </a>

            {/* Vertical separator */}
            <span style={{ color: '#E7A0BF', fontWeight: 300 }}>|</span>

            {/* Phone icon + phone number */}
            <a
              href="tel:+918072065549"
              style={{
                color: '#6E5D73',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E11D48')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6E5D73')}
            >
              <Phone size={13} color="#C13D78" />
              <span>+91 8072065549</span>
            </a>
          </div>

          {/* Right Section: Real-time Socket status + Store Download Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <SocketStatusBadge compact={false} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* GET IT ON Google Play badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#FFF1F6',
                  padding: '3px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#24152D',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid #E7A0BF',
                  boxShadow: '0 1px 3px rgba(225, 29, 72, 0.08)',
                }}
                title="Download on Google Play (Android)"
              >
                <Smartphone size={12} color="#C13D78" />
                <span>GET IT ON <strong>Google Play</strong></span>
              </span>

              {/* Download on the App Store badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#FFF1F6',
                  padding: '3px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#24152D',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid #E7A0BF',
                  boxShadow: '0 1px 3px rgba(225, 29, 72, 0.08)',
                }}
                title="Download on App Store (iOS)"
              >
                <Download size={12} color="#C13D78" />
                <span>Download on the <strong>App Store</strong></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ==================== 2. MAIN BRAND NAVBAR ==================== */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #F1EDFA',
          padding: '12px 24px',
          boxShadow: '0 2px 10px rgba(36, 21, 45, 0.04)',
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left Logo: Red rounded logo container (White bus icon) + bold SMART ROUTE + subtext — BOOKING — */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            <BrandLogo variant="badge" size="sm" subtitle="— BOOKING —" />
          </Link>

          {/* Center Navigation Links: Home, Buses, Offers, About Us, Contact in Deep Plum (#24152D), active: #C13D78, hover: #E11D48 */}
          <nav className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            {/* Home */}
            <Link
              to="/"
              style={{
                color: isActive('/') ? '#C13D78' : '#24152D',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                position: 'relative',
                padding: '6px 4px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E11D48')}
              onMouseLeave={(e) => (e.currentTarget.style.color = isActive('/') ? '#C13D78' : '#24152D')}
            >
              <span>Home</span>
              {isActive('/') && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: 3,
                    borderRadius: 9999,
                    background: '#C13D78',
                  }}
                />
              )}
            </Link>

            {/* Buses */}
            <Link
              to="/search-results"
              style={{
                color: (isActive('/search-results') || isActive('/buses') || isActive('/search')) ? '#C13D78' : '#24152D',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                position: 'relative',
                padding: '6px 4px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E11D48')}
              onMouseLeave={(e) => (e.currentTarget.style.color = (isActive('/search-results') || isActive('/buses') || isActive('/search')) ? '#C13D78' : '#24152D')}
            >
              <span>Buses</span>
              {(isActive('/search-results') || isActive('/buses') || isActive('/search')) && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: 3,
                    borderRadius: 9999,
                    background: '#C13D78',
                  }}
                />
              )}
            </Link>

            {/* Offers */}
            <Link
              to="/offers"
              style={{
                color: isActive('/offers') ? '#C13D78' : '#24152D',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                position: 'relative',
                padding: '6px 4px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E11D48')}
              onMouseLeave={(e) => (e.currentTarget.style.color = isActive('/offers') ? '#C13D78' : '#24152D')}
            >
              <span>Offers</span>
              {isActive('/offers') && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: 3,
                    borderRadius: 9999,
                    background: '#C13D78',
                  }}
                />
              )}
            </Link>

            {/* About Us */}
            <Link
              to="/about"
              style={{
                color: isActive('/about') ? '#C13D78' : '#24152D',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                position: 'relative',
                padding: '6px 4px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E11D48')}
              onMouseLeave={(e) => (e.currentTarget.style.color = isActive('/about') ? '#C13D78' : '#24152D')}
            >
              <span>About Us</span>
              {isActive('/about') && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: 3,
                    borderRadius: 9999,
                    background: '#C13D78',
                  }}
                />
              )}
            </Link>

            {/* Contact */}
            <Link
              to="/contact"
              style={{
                color: isActive('/contact') ? '#C13D78' : '#24152D',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                position: 'relative',
                padding: '6px 4px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E11D48')}
              onMouseLeave={(e) => (e.currentTarget.style.color = isActive('/contact') ? '#C13D78' : '#24152D')}
            >
              <span>Contact</span>
              {isActive('/contact') && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: 3,
                    borderRadius: 9999,
                    background: '#C13D78',
                  }}
                />
              )}
            </Link>

            {/* Quick Ticket Management / Utility Links (Hidden on Tablets to keep header uncluttered) */}
            <div className="tablet-hide" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginLeft: 8, paddingLeft: 14, borderLeft: '1px solid #F1EDFA' }}>
              <Link
                to="/my-tickets"
                style={{
                  color: isActive('/my-tickets') || isActive('/my-bookings') ? '#C13D78' : '#6E5D73',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F5222D')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive('/my-tickets') || isActive('/my-bookings') ? '#C13D78' : '#6E5D73')}
              >
                My Tickets
              </Link>

              <Link
                to="/my-tickets?tab=cancelled"
                style={{
                  color: '#6E5D73',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F5222D')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6E5D73')}
              >
                Cancel &amp; Refund
              </Link>

              <Link
                to="/transactions"
                style={{
                  color: isActive('/transactions') ? '#C13D78' : '#6E5D73',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F5222D')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive('/transactions') ? '#C13D78' : '#6E5D73')}
              >
                Transactions
              </Link>

              <Link
                to="/pnr-search"
                style={{
                  color: isActive('/pnr-search') || isActive('/pnr') ? '#C13D78' : '#6E5D73',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F5222D')}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive('/pnr-search') || isActive('/pnr') ? '#C13D78' : '#6E5D73')}
              >
                PNR Search
              </Link>
            </div>
          </nav>

          {/* Right: AI Voice Button + User Profile or Sign In / Register */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* AI Voice Assistant Trigger */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('sr-open-voice-assistant'))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #FFF1F6 0%, #FDF2F8 100%)',
                border: '1px solid #E7A0BF',
                padding: '6px 14px',
                borderRadius: 20,
                color: '#C13D78',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#C13D78';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FFF1F6 0%, #FDF2F8 100%)';
                e.currentTarget.style.color = '#C13D78';
              }}
              title="Speak with SMART ROUTE AI Voice Assistant"
            >
              <Mic size={14} />
              <span>AI Voice</span>
            </button>

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#F8FAFC',
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: '#F5222D',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {(user?.first_name || user?.name || 'U')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                    {user?.first_name || user?.name || 'Account'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link
                  to="/login"
                  style={{
                    padding: '7px 14px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 8,
                    color: '#0F172A',
                    textDecoration: 'none',
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: '7px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 8,
                    background: '#F5222D',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(245, 34, 45, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              className="mobile-only"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0F172A',
                cursor: 'pointer',
                padding: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="mobile-only"
            style={{
              padding: '16px 8px 12px',
              borderTop: '1px solid #E2E8F0',
              flexDirection: 'column',
              gap: 12,
              width: '100%',
            }}
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: isActive('/') ? '#F5222D' : '#0F172A', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              Home
            </Link>
            <Link
              to="/search-results"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Buses
            </Link>
            <Link
              to="/offers"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Offers
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Contact
            </Link>
            <Link
              to="/my-tickets"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              My Tickets
            </Link>
            <Link
              to="/transactions"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Transactions
            </Link>
            <Link
              to="/pnr-search"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#0F172A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              PNR Search
            </Link>
            {!isAuthenticated && (
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    color: '#0F172A',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px',
                    borderRadius: 8,
                    background: '#F5222D',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    color: '#FFFFFF',
                  }}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
