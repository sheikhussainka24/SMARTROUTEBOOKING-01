import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Users,
  MapPin,
  Calendar,
  FileText,
  Settings,
  LogOut,
  ArrowLeft,
  Shield,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  Bus,
  Fuel,
  Star,
  FileSpreadsheet,
  LayoutDashboard,
} from 'lucide-react';
import BrandLogo from '../components/common/BrandLogo.jsx';

export default function DashboardLayout({ title, roleLabel, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isManagementRole = ['super_admin', 'admin', 'travel_owner', 'manager'].includes(user?.role);
  const basePath = (user?.role === 'super_admin' || user?.role === 'admin') ? '/admin' : '/operator';

  const managementNav = [
    { path: `${basePath}/dashboard`, label: 'Operations Overview', icon: LayoutDashboard },
    { path: `${basePath}/accounting`, label: 'Accounting Overview', icon: TrendingUp },
    { path: `${basePath}/accounting/buses`, label: 'Bus Accounts & Ledger', icon: Bus },
    { path: `${basePath}/accounting/routes`, label: 'Route Profitability', icon: MapPin },
    { path: `${basePath}/accounting/rankings`, label: 'Bus Rankings', icon: DollarSign },
    { path: `${basePath}/accounting/expenses`, label: 'Daily Expenses', icon: FileText },
    { path: `${basePath}/accounting/fuel`, label: 'Diesel & Mileage', icon: Fuel },
    { path: `${basePath}/accounting/payroll`, label: 'Staff Payroll', icon: Users },
    { path: `${basePath}/accounting/ratings`, label: 'Passenger Ratings', icon: Star },
    { path: `${basePath}/accounting/reports`, label: 'Reports & Exports', icon: FileSpreadsheet },
  ];

  return (
    <div className="dashboard-layout-container">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="dashboard-backdrop" 
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Responsive Sidebar */}
      <aside className={`dashboard-sidebar-aside ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '0 4px' }}>
          <BrandLogo
            variant="full"
            size="sm"
            roleBadge={roleLabel}
            subtitle="OPERATIONS PORTAL"
          />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="dashboard-menu-btn"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--sr-text-secondary)',
              padding: 4,
            }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              color: 'var(--sr-text-secondary)',
              fontSize: 13,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={15} /> Passenger Portal
          </Link>

          <div style={{ height: 1, background: 'var(--sr-border-card)', margin: '6px 0' }} />

          {isManagementRole && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ fontSize: 10, color: 'var(--sr-text-tertiary)', textTransform: 'uppercase', padding: '4px 12px', fontWeight: 800, letterSpacing: '0.05em' }}>
                Accounting & Fleet Analytics
              </div>

              {managementNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== `${basePath}/dashboard` && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      color: isActive ? '#C13D78' : '#6E5D73',
                      background: isActive ? '#FFF1F6' : 'transparent',
                      fontSize: 13,
                      textDecoration: 'none',
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} color={isActive ? '#C13D78' : '#8A7A8F'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div style={{ borderTop: '1px solid var(--sr-border-card)', paddingTop: 16, padding: '16px 8px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--sr-text-primary)', fontWeight: 700 }}>
            {user?.firstName} {user?.lastName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)', marginBottom: 12 }}>
            {user?.email || user?.mobile}
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ width: '100%', fontSize: 13, borderColor: 'rgba(239, 68, 68, 0.3)', color: '#DC2626' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main-content">
        <header
          style={{
            minHeight: 64,
            borderBottom: '1px solid var(--sr-border-card)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            boxShadow: 'var(--sr-shadow-sm)',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="dashboard-menu-btn"
              style={{
                background: 'var(--sr-bg-card)',
                border: '1px solid var(--sr-border-card)',
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                color: 'var(--sr-text-primary)',
              }}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <h2 style={{ fontSize: 18, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>{title}</h2>
          </div>
          <div className="badge badge-pink">{roleLabel}</div>
        </header>

        <main className="dashboard-main-body">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
