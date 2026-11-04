import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar.jsx';
import Footer from '../components/common/Footer.jsx';
import PassengerVoiceAssistant from '../components/voice/PassengerVoiceAssistant.jsx';
import { Compass, Radio, User, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function MainLayout() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const getConsoleLink = () => {
    if (!isAuthenticated || !user) return '/login';
    switch (user.role) {
      case 'super_admin': return '/superadmin';
      case 'travel_owner': return '/owner';
      case 'manager': return '/manager';
      case 'driver': return '/driver';
      case 'staff': return '/staff';
      default: return '/my-bookings';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 'env(safe-area-inset-bottom)', background: 'var(--sr-bg-root)' }}>
      <Navbar />

      <main className="main-content-layout">
        <Outlet />
      </main>

      {/* Global AI Voice Assistant for In-App Passenger Assistance */}
      <PassengerVoiceAssistant />

      <Footer />

      {/* Mobile App Bottom Navigation Bar - Only displayed on mobile viewports <= 768px */}
      <div
        className="mobile-only"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255, 255, 255, 0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--sr-border-card)',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 12px calc(8px + env(safe-area-inset-bottom))',
          zIndex: 1000,
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: location.pathname === '/' ? 'var(--sr-primary)' : 'var(--sr-text-secondary)',
            textDecoration: 'none',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <Compass size={20} color={location.pathname === '/' ? 'var(--sr-primary)' : 'var(--sr-text-dim)'} />
          <span>Search</span>
        </Link>

        <Link
          to="/my-bookings"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: location.pathname === '/my-bookings' ? 'var(--sr-primary)' : 'var(--sr-text-secondary)',
            textDecoration: 'none',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <Ticket size={20} color={location.pathname === '/my-bookings' ? 'var(--sr-primary)' : 'var(--sr-text-dim)'} />
          <span>Tickets</span>
        </Link>

        <Link
          to="/track"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: location.pathname === '/track' ? 'var(--sr-primary)' : 'var(--sr-text-secondary)',
            textDecoration: 'none',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <Radio size={20} color={location.pathname === '/track' ? '#059669' : 'var(--sr-text-dim)'} />
          <span>Radar</span>
        </Link>

        <Link
          to={getConsoleLink()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: location.pathname.startsWith('/owner') || location.pathname.startsWith('/driver') || location.pathname.startsWith('/manager') ? 'var(--sr-primary)' : 'var(--sr-text-secondary)',
            textDecoration: 'none',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <User size={20} color={isAuthenticated ? 'var(--sr-primary)' : 'var(--sr-text-dim)'} />
          <span>{isAuthenticated ? (user?.role === 'passenger' ? 'Account' : 'Console') : 'Sign In'}</span>
        </Link>
      </div>
    </div>
  );
}
