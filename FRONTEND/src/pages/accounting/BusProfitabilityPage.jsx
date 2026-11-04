/**
 * SMART ROUTE — Bus Profitability Rankings Page
 * Module 9: Separate rankings for Total Profit vs Avg Profit Per Trip, Loss-making buses spotlight
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import accountingApi from '../../services/accountingService.js';
import {
  Bus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  Download,
  AlertTriangle,
  ArrowRight,
  Sliders,
} from 'lucide-react';

export default function BusProfitabilityPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [dateRange, setDateRange] = useState('all');
  const [rankingMode, setRankingMode] = useState('total_profit'); // 'total_profit' | 'avg_profit_per_trip' | 'loss_making' | 'occupancy'
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBusIds, setSelectedBusIds] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const toggleCompareBus = (busId) => {
    setSelectedBusIds((prev) => {
      if (prev.includes(busId)) {
        return prev.filter((id) => id !== busId);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 buses simultaneously.');
        return prev;
      }
      return [...prev, busId];
    });
  };

  const comparedBusesList = buses.filter((b) => selectedBusIds.includes(b.bus_id));

  const formatCurrency = (amt) => {
    const val = Number(amt) || 0;
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchBuses = async () => {
    try {
      setLoading(true);
      setError(null);

      const sortBy = rankingMode === 'avg_profit_per_trip' ? 'avg_profit_per_trip' : (rankingMode === 'occupancy' ? 'occupancy' : 'total_profit');
      const sortOrder = 'desc';

      const res = await accountingApi.getBusesAccounting({ dateRange, sortBy, sortOrder });
      if (res.success) {
        let list = res.data || [];
        if (rankingMode === 'loss_making') {
          list = list.filter((b) => b.is_loss_making);
        }
        setBuses(list);
      }
    } catch (err) {
      setError(err.message || 'Failed to load bus profitability rankings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, [dateRange, rankingMode]);

  const handleExport = async () => {
    try {
      await accountingApi.downloadExport('bus_profitability', { dateRange });
    } catch (err) {
      alert(`Export error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', color: '#24152D' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#24152D' }}>
            Bus-wise Profitability & Operational Rankings
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
            Distinct rankings: Total cumulative profit vs Average profit per operated trip (Module 9 Compliance)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Date Filter */}
          <div style={{ display: 'flex', background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 8, padding: 2 }}>
            {['all', 'today', 'this_week', 'this_month', 'this_year'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDateRange(p)}
                style={{
                  border: 'none',
                  background: dateRange === p ? 'var(--sr-primary, #C13D78)' : 'transparent',
                  color: dateRange === p ? '#FFF' : '#6E5D73',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {p.replace('_', ' ')}
              </button>
            ))}
          </div>

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
            }}
          >
            <Download size={15} /> Export Buses CSV
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs (Module 9: Distinct Total Profit vs Avg Profit Per Trip) */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'total_profit', label: '🏆 Rank by Total Profit', desc: 'Highest cumulative net operating profit' },
          { id: 'avg_profit_per_trip', label: '⚡ Rank by Avg Profit / Trip', desc: 'Highest efficiency per operated journey' },
          { id: 'loss_making', label: '⚠️ Loss-Making Buses', desc: 'Buses with negative operating margins' },
          { id: 'occupancy', label: '👥 Rank by Seat Occupancy', desc: 'Highest passenger load factor' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRankingMode(tab.id)}
            style={{
              border: rankingMode === tab.id ? '1px solid #C13D78' : '1px solid #E7D7E0',
              background: rankingMode === tab.id ? '#FFF1F6' : '#FFFFFF',
              color: rankingMode === tab.id ? '#C13D78' : '#6E5D73',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700 }}>{tab.label}</div>
            <div style={{ fontSize: 11, color: '#8A7A8F', marginTop: 2 }}>{tab.desc}</div>
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7D7E0',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E7D7E0', color: '#8A7A8F', textAlign: 'left' }}>
              <th style={{ padding: '12px 8px', width: 44, textAlign: 'center' }}>Compare</th>
              <th style={{ padding: '12px 8px' }}>Rank & Registration</th>
              <th style={{ padding: '12px 8px' }}>Carrier</th>
              <th style={{ padding: '12px 8px' }}>Trips Operated</th>
              <th style={{ padding: '12px 8px' }}>Net Revenue</th>
              <th style={{ padding: '12px 8px' }}>Total Expenses</th>
              <th style={{ padding: '12px 8px' }}>Total Profit / Loss</th>
              <th style={{ padding: '12px 8px' }}>Avg Profit / Trip</th>
              <th style={{ padding: '12px 8px' }}>Occupancy</th>
              <th style={{ padding: '12px 8px' }}>Rating</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buses.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '30px', textAlign: 'center', color: '#8A7A8F' }}>
                  No buses found matching the current ranking criteria.
                </td>
              </tr>
            ) : (
              buses.map((bus, idx) => (
                <tr key={bus.bus_id} style={{ borderBottom: '1px solid #F4ECF0', background: selectedBusIds.includes(bus.bus_id) ? '#FFF1F6' : 'transparent' }} className="clickable-row">
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedBusIds.includes(bus.bus_id)}
                      onChange={() => toggleCompareBus(bus.bus_id)}
                      style={{ cursor: 'pointer', accentColor: '#C13D78', width: 16, height: 16 }}
                      title="Select bus for side-by-side performance comparison"
                    />
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#8A7A8F', fontSize: 11, fontWeight: 700 }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 700, color: '#24152D' }}>{bus.registration_number}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#8A7A8F' }}>{bus.name}</div>
                  </td>
                  <td style={{ padding: '12px 8px', color: '#6E5D73' }}>{bus.travel_name}</td>
                  <td style={{ padding: '12px 8px' }}>{bus.trips_operated}</td>
                  <td style={{ padding: '12px 8px', color: '#10B981', fontWeight: 600 }}>
                    {formatCurrency(bus.net_ticket_revenue)}
                  </td>
                  <td style={{ padding: '12px 8px', color: '#EF4444' }}>
                    {formatCurrency(bus.total_operating_expenses)}
                  </td>
                  <td
                    style={{
                      padding: '12px 8px',
                      fontWeight: 700,
                      color: bus.operating_profit_loss >= 0 ? '#10B981' : '#DC2626',
                    }}
                  >
                    {formatCurrency(bus.operating_profit_loss)}
                  </td>
                  <td
                    style={{
                      padding: '12px 8px',
                      fontWeight: 700,
                      color: bus.avg_profit_per_trip >= 0 ? '#10B981' : '#DC2626',
                    }}
                  >
                    {formatCurrency(bus.avg_profit_per_trip)}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 600, color: '#10B981' }}>
                    {bus.occupancy_percentage}%
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {bus.average_rating ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#D97706', fontWeight: 700 }}>
                        <Star size={12} fill="#D97706" /> {bus.average_rating} ({bus.review_count})
                      </span>
                    ) : (
                      <span style={{ color: '#8A7A8F' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => navigate(isSuperAdmin ? `/admin/accounting/buses/${bus.bus_id}` : `/operator/accounting/buses/${bus.bus_id}`)}
                      style={{
                        border: '1px solid #C13D78',
                        background: '#FFF1F6',
                        color: '#C13D78',
                        borderRadius: 6,
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Ledger
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Comparison Drawer (Module 12) */}
      {selectedBusIds.length >= 2 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#24152D',
            color: '#FFFFFF',
            borderRadius: 14,
            padding: '12px 24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 999,
            animation: 'srFadeIn 0.2s ease-out',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            <span style={{ color: '#E7A0BF', fontWeight: 800 }}>{selectedBusIds.length} Buses</span> selected for comparison
          </div>

          <button
            type="button"
            onClick={() => setShowCompareModal(true)}
            style={{
              background: 'linear-gradient(135deg, #C13D78 0%, #A82B63 100%)',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sliders size={15} /> Compare Side-by-Side
          </button>

          <button
            type="button"
            onClick={() => setSelectedBusIds([])}
            style={{
              background: 'transparent',
              color: '#AB9CB0',
              border: 'none',
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Side-by-Side Comparison Modal (Module 12) */}
      {showCompareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 1000,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              border: '1.5px solid #F1EDFA',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #E7D7E0', paddingBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#24152D' }}>
                  Bus Performance Side-by-Side Comparison
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
                  Comparing operating profit, efficiency, revenue, fuel expenditure, and verified passenger feedback
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: '#6E5D73',
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E7A0BF', background: '#FFF1F6' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: '#6E5D73', fontWeight: 800 }}>Metric</th>
                    {comparedBusesList.map((b) => (
                      <th key={b.bus_id} style={{ padding: '12px 14px', textAlign: 'center', color: '#C13D78', fontWeight: 800 }}>
                        <div>{b.registration_number}</div>
                        <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>{b.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Operating Carrier</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center', color: '#6E5D73' }}>{b.travel_name}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0', background: '#FAFAFC' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Operating Profit / Loss</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: b.operating_profit_loss >= 0 ? '#10B981' : '#DC2626' }}>
                        {formatCurrency(b.operating_profit_loss)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Avg Profit / Operated Trip</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: b.avg_profit_per_trip >= 0 ? '#10B981' : '#DC2626' }}>
                        {formatCurrency(b.avg_profit_per_trip)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0', background: '#FAFAFC' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Trips Operated</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>{b.trips_operated} trips</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Net Ticket Revenue</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#10B981' }}>{formatCurrency(b.net_ticket_revenue)}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0', background: '#FAFAFC' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Total Operating Expenses</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#EF4444' }}>{formatCurrency(b.total_operating_expenses)}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Diesel Fuel Expenses</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center', color: '#D97706' }}>{formatCurrency(b.fuel_expenses)}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0', background: '#FAFAFC' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Seat Occupancy Rate</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#10B981' }}>{b.occupancy_percentage}%</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Passenger Average Rating</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {b.average_rating ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#D97706', fontWeight: 800 }}>
                            <Star size={14} fill="#D97706" /> {b.average_rating} ({b.review_count} reviews)
                          </span>
                        ) : (
                          <span style={{ color: '#8A7A8F' }}>No Ratings</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Profitability Health</td>
                    {comparedBusesList.map((b) => (
                      <td key={b.bus_id} style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {b.is_loss_making ? (
                          <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                            ⚠️ Loss Making
                          </span>
                        ) : (
                          <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                            ✓ Profitable
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: 13 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
