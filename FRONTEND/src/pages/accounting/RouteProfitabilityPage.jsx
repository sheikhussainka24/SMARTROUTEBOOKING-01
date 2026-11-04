/**
 * SMART ROUTE — Route-wise Profitability Analysis Page
 * Module 8: Route rankings, scheduled vs operated trips, profit per trip, occupancy
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import accountingApi from '../../services/accountingService.js';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Filter,
  Star,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export default function RouteProfitabilityPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('total_profit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRouteIds, setSelectedRouteIds] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const toggleCompareRoute = (routeId) => {
    setSelectedRouteIds((prev) => {
      if (prev.includes(routeId)) {
        return prev.filter((id) => id !== routeId);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 routes simultaneously.');
        return prev;
      }
      return [...prev, routeId];
    });
  };

  const comparedRoutesList = routes.filter((r) => selectedRouteIds.includes(r.route_id));

  const formatCurrency = (amt) => {
    const val = Number(amt) || 0;
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await accountingApi.getRoutesAccounting({ dateRange, sortBy, sortOrder });
      if (res.success) {
        setRoutes(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load route profitability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [dateRange, sortBy, sortOrder]);

  const handleExport = async () => {
    try {
      await accountingApi.downloadExport('route_profitability', { dateRange });
    } catch (err) {
      alert(`Export error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', color: '#24152D' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#24152D' }}>
            Route-wise Profitability & Corridors Performance
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
            Rank routes by total profit, average profit per trip, or seat occupancy across operated corridors
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

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '7px 12px',
              border: '1px solid #E7D7E0',
              borderRadius: 8,
              fontSize: 13,
              background: '#FFF',
              color: '#24152D',
              outline: 'none',
              fontWeight: 600,
            }}
          >
            <option value="total_profit">Rank by Total Profit</option>
            <option value="avg_profit_per_trip">Rank by Avg Profit / Trip</option>
            <option value="occupancy">Rank by Seat Occupancy</option>
            <option value="revenue">Rank by Net Revenue</option>
          </select>

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
            <Download size={15} /> Export Routes CSV
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Routes Table */}
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
              <th style={{ padding: '12px 8px' }}>Route Corridor</th>
              <th style={{ padding: '12px 8px' }}>Carrier</th>
              <th style={{ padding: '12px 8px' }}>Distance</th>
              <th style={{ padding: '12px 8px' }}>Trips (Sched / Oper)</th>
              <th style={{ padding: '12px 8px' }}>Net Revenue</th>
              <th style={{ padding: '12px 8px' }}>Expenses</th>
              <th style={{ padding: '12px 8px' }}>Total Profit / Loss</th>
              <th style={{ padding: '12px 8px' }}>Avg / Trip</th>
              <th style={{ padding: '12px 8px' }}>Occupancy</th>
              <th style={{ padding: '12px 8px' }}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '30px', textAlign: 'center', color: '#8A7A8F' }}>
                  No operated commercial corridors found for the selected filter period.
                </td>
              </tr>
            ) : (
              routes.map((r, idx) => (
                <tr key={r.route_id} style={{ borderBottom: '1px solid #F4ECF0', background: selectedRouteIds.includes(r.route_id) ? '#FFF1F6' : 'transparent' }}>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedRouteIds.includes(r.route_id)}
                      onChange={() => toggleCompareRoute(r.route_id)}
                      style={{ cursor: 'pointer', accentColor: '#C13D78', width: 16, height: 16 }}
                      title="Select route for side-by-side performance comparison"
                    />
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#8A7A8F', fontSize: 11, fontWeight: 700 }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 700, color: '#24152D' }}>{r.source} ➔ {r.destination}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#8A7A8F' }}>{r.name}</div>
                  </td>
                  <td style={{ padding: '12px 8px', color: '#6E5D73' }}>{r.travel_name}</td>
                  <td style={{ padding: '12px 8px' }}>{r.distance_km} km</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ fontWeight: 600 }}>{r.operated_trips}</span>
                    <span style={{ color: '#8A7A8F' }}> / {r.scheduled_trips}</span>
                  </td>
                  <td style={{ padding: '12px 8px', color: '#10B981', fontWeight: 600 }}>
                    {formatCurrency(r.net_ticket_revenue)}
                  </td>
                  <td style={{ padding: '12px 8px', color: '#EF4444' }}>
                    {formatCurrency(r.total_operating_expenses)}
                  </td>
                  <td
                    style={{
                      padding: '12px 8px',
                      fontWeight: 700,
                      color: r.operating_profit_loss >= 0 ? '#10B981' : '#DC2626',
                    }}
                  >
                    {formatCurrency(r.operating_profit_loss)}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                    {formatCurrency(r.avg_profit_per_trip)}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 600, color: '#10B981' }}>
                    {r.occupancy_percentage}%
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {r.average_rating ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#D97706', fontWeight: 700 }}>
                        <Star size={12} fill="#D97706" /> {r.average_rating} ({r.review_count})
                      </span>
                    ) : (
                      <span style={{ color: '#8A7A8F' }}>N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Comparison Drawer (Module 12) */}
      {selectedRouteIds.length >= 2 && (
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
            <span style={{ color: '#E7A0BF', fontWeight: 800 }}>{selectedRouteIds.length} Routes</span> selected for comparison
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
            Compare Corridors Side-by-Side
          </button>

          <button
            type="button"
            onClick={() => setSelectedRouteIds([])}
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

      {/* Side-by-Side Route Comparison Modal (Module 12) */}
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
              maxWidth: 1050,
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
                  Commercial Route & Corridor Comparison
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
                  Comparing corridor profit margins, average journey efficiency, distance, scheduled operations, and passenger satisfaction
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
                    {comparedRoutesList.map((r) => (
                      <th key={r.route_id} style={{ padding: '12px 14px', textAlign: 'center', color: '#C13D78', fontWeight: 800 }}>
                        <div>{r.source} ➔ {r.destination}</div>
                        <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 500 }}>{r.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Operating Carrier</td>
                    {comparedRoutesList.map((r) => (
                      <td key={r.route_id} style={{ padding: '10px 14px', textAlign: 'center', color: '#6E5D73' }}>{r.travel_name}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0', background: '#FAFAFC' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Route Distance</td>
                    {comparedRoutesList.map((r) => (
                      <td key={r.route_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>{r.distance_km} km</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Operating Profit / Loss</td>
                    {comparedRoutesList.map((r) => (
                      <td key={r.route_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: r.operating_profit_loss >= 0 ? '#10B981' : '#DC2626' }}>
                        {formatCurrency(r.operating_profit_loss)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0', background: '#FAFAFC' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Avg Profit / Operated Trip</td>
                    {comparedRoutesList.map((r) => (
                      <td key={r.route_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: r.avg_profit_per_trip >= 0 ? '#10B981' : '#DC2626' }}>
                        {formatCurrency(r.avg_profit_per_trip)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Trips (Operated / Scheduled)</td>
                    {comparedRoutesList.map((r) => (
                      <td key={r.route_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700 }}>{r.operated_trips} / {r.scheduled_trips}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0', background: '#FAFAFC' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Net Ticket Revenue</td>
                    {comparedRoutesList.map((r) => (
                      <td key={r.route_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#10B981' }}>{formatCurrency(r.net_ticket_revenue)}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Total Operating Expenses</td>
                    {comparedRoutesList.map((r) => (
                      <td key={r.route_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#EF4444' }}>{formatCurrency(r.total_operating_expenses)}</td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F4ECF0', background: '#FAFAFC' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Seat Occupancy Rate</td>
                    {comparedRoutesList.map((r) => (
                      <td key={r.route_id} style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#10B981' }}>{r.occupancy_percentage}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#24152D' }}>Passenger Rating & Feedback</td>
                    {comparedRoutesList.map((r) => (
                      <td key={r.route_id} style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {r.average_rating ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#D97706', fontWeight: 800 }}>
                            <Star size={14} fill="#D97706" /> {r.average_rating} ({r.review_count} reviews)
                          </span>
                        ) : (
                          <span style={{ color: '#8A7A8F' }}>No Ratings</span>
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
