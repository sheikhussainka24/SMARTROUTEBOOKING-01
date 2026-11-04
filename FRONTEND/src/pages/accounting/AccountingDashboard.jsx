/**
 * SMART ROUTE — Executive Accounting & Financial Analytics Dashboard
 * Modules 1 & 2: Super Admin Consolidated & Travel Owner Company-Scoped Views
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import accountingApi from '../../services/accountingService.js';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bus,
  MapPin,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Fuel,
  Users,
  Star,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function AccountingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financials, setFinancials] = useState(null);
  const [fleet, setFleet] = useState(null);
  const [topBuses, setTopBuses] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, busesRes, routesRes] = await Promise.all([
        accountingApi.getSummary({ dateRange }),
        accountingApi.getBusesAccounting({ dateRange, sortBy: 'total_profit', sortOrder: 'desc' }),
        accountingApi.getRoutesAccounting({ dateRange, sortBy: 'total_profit', sortOrder: 'desc' }),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setFinancials(summaryRes.data.financials);
        setFleet(summaryRes.data.fleet);
      }
      if (busesRes.success && busesRes.data) {
        setTopBuses(busesRes.data.slice(0, 5));
      }
      if (routesRes.success && routesRes.data) {
        setTopRoutes(routesRes.data.slice(0, 5));
      }
    } catch (err) {
      setError(err.message || 'Failed to load financial analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleExport = async () => {
    try {
      await accountingApi.downloadExport('summary', { dateRange });
    } catch (err) {
      alert(`Export error: ${err.message}`);
    }
  };

  const formatCurrency = (amt) => {
    const val = Number(amt) || 0;
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', color: '#24152D' }}>
      {/* Top Header & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--sr-text-primary, #24152D)' }}>
              {isSuperAdmin ? 'Platform Consolidated Accounting & Fleet Analytics' : 'Company Financial & Fleet Ledger'}
            </h1>
            <span
              style={{
                background: 'var(--sr-primary-bg, rgba(193, 61, 120, 0.1))',
                color: 'var(--sr-primary, #C13D78)',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {financials?.organization || (isSuperAdmin ? 'All Carriers' : 'Authorized Carrier')}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
            Production-grade double-entry ledger • Indian Rupee ₹ Accruals • Strict RBAC Scoped
          </p>
        </div>

        {/* Date Filter & Export CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              background: '#FFF',
              border: '1px solid var(--sr-border-card, #E7D7E0)',
              borderRadius: 8,
              padding: 2,
            }}
          >
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'this_year', label: 'This Year' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateRange(tab.id)}
                style={{
                  border: 'none',
                  background: dateRange === tab.id ? 'var(--sr-primary, #C13D78)' : 'transparent',
                  color: dateRange === tab.id ? '#FFF' : '#6E5D73',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchData}
            title="Refresh Ledger"
            style={{
              border: '1px solid #E7D7E0',
              background: '#FFF',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#6E5D73',
              fontSize: 13,
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Refresh
          </button>

          <button
            type="button"
            onClick={handleExport}
            style={{
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFF',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
            }}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* KPI Headline Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Net Ticket Revenue */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E7D7E0',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6E5D73', textTransform: 'uppercase' }}>
              Net Ticket Revenue
            </span>
            <div style={{ background: '#ECFDF5', color: '#10B981', padding: 6, borderRadius: 8 }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>
            {loading ? '...' : formatCurrency(financials?.net_ticket_revenue)}
          </div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 4 }}>
            Gross: {formatCurrency(financials?.gross_ticket_sales)} • Discounts: -{formatCurrency(financials?.discounts)} • Refunds: -{formatCurrency(financials?.refunds)}
          </div>
        </div>

        {/* Operating Expenses */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E7D7E0',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6E5D73', textTransform: 'uppercase' }}>
              Operating Expenses
            </span>
            <div style={{ background: '#FEF2F2', color: '#EF4444', padding: 6, borderRadius: 8 }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#EF4444' }}>
            {loading ? '...' : formatCurrency(financials?.total_operating_expenses)}
          </div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 4 }}>
            Fuel: {formatCurrency(financials?.fuel_expenses)} • Crew: {formatCurrency(financials?.driver_cleaner_salaries)} • Toll: {formatCurrency(financials?.toll_parking_expenses)}
          </div>
        </div>

        {/* Operating Profit / Loss */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E7D7E0',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6E5D73', textTransform: 'uppercase' }}>
              Operating Profit / Loss
            </span>
            <div
              style={{
                background: (financials?.operating_profit_loss ?? 0) >= 0 ? '#EFF6FF' : '#FEF2F2',
                color: (financials?.operating_profit_loss ?? 0) >= 0 ? '#3B82F6' : '#EF4444',
                padding: 6,
                borderRadius: 8,
              }}
            >
              <DollarSign size={16} />
            </div>
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: (financials?.operating_profit_loss ?? 0) >= 0 ? '#10B981' : '#DC2626',
            }}
          >
            {loading ? '...' : formatCurrency(financials?.operating_profit_loss)}
          </div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 4 }}>
            Net Revenue minus Eligible Expenses
          </div>
        </div>

        {/* Collections vs Outstanding */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E7D7E0',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6E5D73', textTransform: 'uppercase' }}>
              Actual Collections
            </span>
            <div style={{ background: '#FDF2F8', color: '#C13D78', padding: 6, borderRadius: 8 }}>
              <ShieldCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#C13D78' }}>
            {loading ? '...' : formatCurrency(financials?.actual_collections)}
          </div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 4 }}>
            Pending Collections: {formatCurrency(financials?.pending_payments)}
          </div>
        </div>
      </div>

      {/* Fleet & Seat Occupancy Summary */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7D7E0',
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#24152D' }}>
            Fleet Operational Status & Seat Occupancy
          </h2>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>
            Occupancy: {fleet?.seat_occupancy_percentage ?? 0}%
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div style={{ background: '#FFF1F6', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>Total Buses</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#C13D78', marginTop: 2 }}>{fleet?.total_registered_buses ?? 0}</div>
          </div>
          <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>Operating Today</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981', marginTop: 2 }}>{fleet?.buses_operating_today ?? 0}</div>
          </div>
          <div style={{ background: '#EFF6FF', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>On Trips</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#3B82F6', marginTop: 2 }}>{fleet?.buses_on_trips ?? 0}</div>
          </div>
          <div style={{ background: '#FEF3C7', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>Idle / Spare</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706', marginTop: 2 }}>{fleet?.buses_idle ?? 0}</div>
          </div>
          <div style={{ background: '#FEE2E2', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>In Maintenance</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#EF4444', marginTop: 2 }}>{fleet?.buses_under_maintenance ?? 0}</div>
          </div>
          <div style={{ background: '#F5F3FF', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>Seats Booked / Total</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED', marginTop: 2 }}>
              {fleet?.total_booked_seats ?? 0} / {fleet?.total_seats_offered ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top Performing Buses & Top Routes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Bus Profitability Quick View */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E7D7E0',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#24152D' }}>
              Top Bus Accounts by Profit
            </h3>
            <Link
              to={isSuperAdmin ? '/admin/accounting/buses' : '/operator/accounting/buses'}
              style={{ fontSize: 12, color: 'var(--sr-primary, #C13D78)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              View All Buses <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E7D7E0', color: '#8A7A8F', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px' }}>Bus Registration</th>
                  <th style={{ padding: '8px 4px' }}>Net Revenue</th>
                  <th style={{ padding: '8px 4px' }}>Expenses</th>
                  <th style={{ padding: '8px 4px' }}>Operating Profit</th>
                  <th style={{ padding: '8px 4px' }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {topBuses.map((b) => (
                  <tr
                    key={b.bus_id}
                    onClick={() => navigate(isSuperAdmin ? `/admin/accounting/buses/${b.bus_id}` : `/operator/accounting/buses/${b.bus_id}`)}
                    style={{ borderBottom: '1px solid #F4ECF0', cursor: 'pointer', transition: 'background 0.15s' }}
                    className="clickable-row"
                  >
                    <td style={{ padding: '10px 4px', fontWeight: 700, color: '#24152D' }}>
                      {b.registration_number}
                      <div style={{ fontSize: 11, color: '#8A7A8F', fontWeight: 400 }}>{b.name}</div>
                    </td>
                    <td style={{ padding: '10px 4px', color: '#10B981', fontWeight: 600 }}>{formatCurrency(b.net_ticket_revenue)}</td>
                    <td style={{ padding: '10px 4px', color: '#EF4444' }}>{formatCurrency(b.total_operating_expenses)}</td>
                    <td style={{ padding: '10px 4px', fontWeight: 700, color: b.operating_profit_loss >= 0 ? '#10B981' : '#DC2626' }}>
                      {formatCurrency(b.operating_profit_loss)}
                    </td>
                    <td style={{ padding: '10px 4px' }}>
                      {b.average_rating ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#D97706', fontWeight: 700 }}>
                          <Star size={12} fill="#D97706" /> {b.average_rating}
                        </span>
                      ) : (
                        <span style={{ color: '#8A7A8F' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Route Profitability Quick View */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E7D7E0',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#24152D' }}>
              Route Profitability Rankings
            </h3>
            <Link
              to={isSuperAdmin ? '/admin/accounting/routes' : '/operator/accounting/routes'}
              style={{ fontSize: 12, color: 'var(--sr-primary, #C13D78)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              View All Routes <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E7D7E0', color: '#8A7A8F', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px' }}>Route</th>
                  <th style={{ padding: '8px 4px' }}>Trips</th>
                  <th style={{ padding: '8px 4px' }}>Net Revenue</th>
                  <th style={{ padding: '8px 4px' }}>Operating Profit</th>
                  <th style={{ padding: '8px 4px' }}>Avg/Trip</th>
                </tr>
              </thead>
              <tbody>
                {topRoutes.map((r) => (
                  <tr key={r.route_id} style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 4px', fontWeight: 700, color: '#24152D' }}>
                      {r.source} ➔ {r.destination}
                      <div style={{ fontSize: 11, color: '#8A7A8F', fontWeight: 400 }}>{r.name}</div>
                    </td>
                    <td style={{ padding: '10px 4px' }}>{r.operated_trips}</td>
                    <td style={{ padding: '10px 4px', color: '#10B981', fontWeight: 600 }}>{formatCurrency(r.net_ticket_revenue)}</td>
                    <td style={{ padding: '10px 4px', fontWeight: 700, color: r.operating_profit_loss >= 0 ? '#10B981' : '#DC2626' }}>
                      {formatCurrency(r.operating_profit_loss)}
                    </td>
                    <td style={{ padding: '10px 4px', fontWeight: 600 }}>{formatCurrency(r.avg_profit_per_trip)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Accounting Quick Actions Toolbar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <Link
          to={isSuperAdmin ? '/admin/accounting/expenses' : '/operator/accounting/expenses'}
          style={{
            background: '#FFF',
            border: '1px solid #E7D7E0',
            borderRadius: 8,
            padding: 14,
            textDecoration: 'none',
            color: '#24152D',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <div style={{ background: '#FFF1F6', color: '#C13D78', padding: 8, borderRadius: 8 }}>
            <DollarSign size={16} />
          </div>
          Expense Management
        </Link>

        <Link
          to={isSuperAdmin ? '/admin/accounting/fuel' : '/operator/accounting/fuel'}
          style={{
            background: '#FFF',
            border: '1px solid #E7D7E0',
            borderRadius: 8,
            padding: 14,
            textDecoration: 'none',
            color: '#24152D',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <div style={{ background: '#ECFDF5', color: '#10B981', padding: 8, borderRadius: 8 }}>
            <Fuel size={16} />
          </div>
          Diesel & Fuel Ledger
        </Link>

        <Link
          to={isSuperAdmin ? '/admin/accounting/payroll' : '/operator/accounting/payroll'}
          style={{
            background: '#FFF',
            border: '1px solid #E7D7E0',
            borderRadius: 8,
            padding: 14,
            textDecoration: 'none',
            color: '#24152D',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <div style={{ background: '#EFF6FF', color: '#3B82F6', padding: 8, borderRadius: 8 }}>
            <Users size={16} />
          </div>
          Crew & Staff Payroll
        </Link>

        <Link
          to={isSuperAdmin ? '/admin/accounting/ratings' : '/operator/accounting/ratings'}
          style={{
            background: '#FFF',
            border: '1px solid #E7D7E0',
            borderRadius: 8,
            padding: 14,
            textDecoration: 'none',
            color: '#24152D',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <div style={{ background: '#FEF3C7', color: '#D97706', padding: 8, borderRadius: 8 }}>
            <Star size={16} />
          </div>
          Passenger Ratings & Reviews
        </Link>

        <Link
          to={isSuperAdmin ? '/admin/accounting/reports' : '/operator/accounting/reports'}
          style={{
            background: '#FFF',
            border: '1px solid #E7D7E0',
            borderRadius: 8,
            padding: 14,
            textDecoration: 'none',
            color: '#24152D',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          <div style={{ background: '#F5F3FF', color: '#7C3AED', padding: 8, borderRadius: 8 }}>
            <Download size={16} />
          </div>
          Reports & CSV Downloads
        </Link>
      </div>
    </div>
  );
}
