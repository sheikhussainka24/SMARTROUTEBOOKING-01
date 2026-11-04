/**
 * SMART ROUTE — Individual Bus Accounting & Ledger Drill-Down Page
 * Module 3: Bus-wise Accounts with trip-by-trip inspection and historical tracking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import accountingApi from '../../services/accountingService.js';
import {
  Bus,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Fuel,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react';

export default function BusAccountingPage() {
  const { busId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [dateRange, setDateRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [busesList, setBusesList] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (amt) => {
    const val = Number(amt) || 0;
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Load either the list of buses or the selected bus details
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (busId) {
        const res = await accountingApi.getBusDetails(busId, { dateRange });
        if (res.success) {
          setSelectedBus(res.data);
        }
      } else {
        const res = await accountingApi.getBusesAccounting({ dateRange, sortBy: 'total_profit', sortOrder: 'desc' });
        if (res.success) {
          setBusesList(res.data || []);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load bus accounting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [busId, dateRange]);

  const filteredBuses = busesList.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.registration_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', color: '#24152D' }}>
      {/* Top Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {busId && (
            <button
              type="button"
              onClick={() => navigate(isSuperAdmin ? '/admin/accounting/buses' : '/operator/accounting/buses')}
              style={{
                border: '1px solid #E7D7E0',
                background: '#FFF',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: '#6E5D73',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} /> All Buses
            </button>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#24152D' }}>
            {busId ? `Bus Ledger: ${selectedBus?.registration_number || 'Loading...'}` : 'Bus-wise Accounts & Ledgers'}
          </h1>
        </div>

        {/* Date Range Selector */}
        <div
          style={{
            display: 'flex',
            background: '#FFF',
            border: '1px solid #E7D7E0',
            borderRadius: 8,
            padding: 2,
          }}
        >
          {['all', 'today', 'this_week', 'this_month', 'this_year'].map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDateRange(period)}
              style={{
                border: 'none',
                background: dateRange === period ? 'var(--sr-primary, #C13D78)' : 'transparent',
                color: dateRange === period ? '#FFF' : '#6E5D73',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {period.replace('_', ' ')}
            </button>
          ))}
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
          }}
        >
          {error}
        </div>
      )}

      {/* DETAIL VIEW FOR A SINGLE BUS */}
      {busId && selectedBus ? (
        <div>
          {/* Header Card for this Bus */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E7D7E0',
              borderRadius: 12,
              padding: 22,
              marginBottom: 24,
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#24152D' }}>
                    {selectedBus.name}
                  </h2>
                  <span
                    style={{
                      background: '#FFF1F6',
                      color: '#C13D78',
                      padding: '3px 10px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {selectedBus.registration_number}
                  </span>
                  <span
                    style={{
                      background: '#ECFDF5',
                      color: '#10B981',
                      padding: '3px 10px',
                      borderRadius: 16,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {selectedBus.travel_name}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6E5D73' }}>
                  {selectedBus.bus_type.replace(/_/g, ' ').toUpperCase()} • Capacity: {selectedBus.total_capacity} Seats • {selectedBus.trips_operated} Trips in Selected Period
                </p>
              </div>

              {/* Rating Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedBus.average_rating ? (
                  <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '8px 14px', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#D97706', fontSize: 16, fontWeight: 800 }}>
                      <Star size={18} fill="#D97706" /> {selectedBus.average_rating}
                    </div>
                    <div style={{ fontSize: 11, color: '#92400E' }}>{selectedBus.review_count} Verified Reviews</div>
                  </div>
                ) : (
                  <div style={{ background: '#F3F4F6', padding: '8px 14px', borderRadius: 8, textAlign: 'center', color: '#6B7280', fontSize: 12 }}>
                    No passenger reviews yet
                  </div>
                )}
              </div>
            </div>

            {/* Financial Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 20 }}>
              <div style={{ background: '#FFF1F6', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>Gross Ticket Sales</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#24152D', marginTop: 4 }}>
                  {formatCurrency(selectedBus.gross_ticket_sales)}
                </div>
                <div style={{ fontSize: 11, color: '#8A7A8F', marginTop: 2 }}>
                  Discounts: -{formatCurrency(selectedBus.discounts)} | Refunds: -{formatCurrency(selectedBus.refunds)}
                </div>
              </div>

              <div style={{ background: '#ECFDF5', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>Net Ticket Revenue</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
                  {formatCurrency(selectedBus.net_ticket_revenue)}
                </div>
                <div style={{ fontSize: 11, color: '#8A7A8F', marginTop: 2 }}>
                  Actual Collected: {formatCurrency(selectedBus.actual_collections)}
                </div>
              </div>

              <div style={{ background: '#FEF2F2', padding: 14, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>Total Operating Expenses</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#EF4444', marginTop: 4 }}>
                  {formatCurrency(selectedBus.total_operating_expenses)}
                </div>
                <div style={{ fontSize: 11, color: '#8A7A8F', marginTop: 2 }}>
                  Fuel: {formatCurrency(selectedBus.fuel_expenses)} | Toll: {formatCurrency(selectedBus.toll_parking_expenses)}
                </div>
              </div>

              <div
                style={{
                  background: selectedBus.operating_profit_loss >= 0 ? '#EFF6FF' : '#FEE2E2',
                  padding: 14,
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 11, color: '#8A7A8F', textTransform: 'uppercase', fontWeight: 700 }}>Operating Profit / Loss</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: selectedBus.operating_profit_loss >= 0 ? '#3B82F6' : '#DC2626',
                    marginTop: 4,
                  }}
                >
                  {formatCurrency(selectedBus.operating_profit_loss)}
                </div>
                <div style={{ fontSize: 11, color: '#8A7A8F', marginTop: 2 }}>
                  Avg / Trip: {formatCurrency(selectedBus.avg_profit_per_trip)}
                </div>
              </div>
            </div>
          </div>

          {/* Trip-by-Trip Detailed Ledger */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E7D7E0',
              borderRadius: 12,
              padding: 22,
              marginBottom: 24,
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', color: '#24152D' }}>
              Trip Accounting Ledger ({selectedBus.trip_ledgers.length} Trips)
            </h3>

            {selectedBus.trip_ledgers.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#8A7A8F', fontSize: 14 }}>
                No trips operated by this bus in the selected reporting period.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E7D7E0', color: '#8A7A8F', textAlign: 'left' }}>
                      <th style={{ padding: '10px 8px' }}>Date & Trip #</th>
                      <th style={{ padding: '10px 8px' }}>Route Service</th>
                      <th style={{ padding: '10px 8px' }}>Occupancy</th>
                      <th style={{ padding: '10px 8px' }}>Gross Sales</th>
                      <th style={{ padding: '10px 8px' }}>Net Revenue</th>
                      <th style={{ padding: '10px 8px' }}>Trip Expenses</th>
                      <th style={{ padding: '10px 8px' }}>Operating Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBus.trip_ledgers.map((trip) => (
                      <tr key={trip.trip_id} style={{ borderBottom: '1px solid #F4ECF0' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 700, color: '#24152D' }}>{trip.departure_date}</div>
                          <div style={{ fontSize: 11, color: '#8A7A8F' }}>{trip.trip_number} ({trip.departure_time})</div>
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{trip.route_name}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ fontWeight: 700, color: '#10B981' }}>{trip.occupancy_percentage}%</span>
                          <div style={{ fontSize: 11, color: '#8A7A8F' }}>{trip.booked_seats} of {trip.total_seats} seats</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{formatCurrency(trip.gross_ticket_sales)}</td>
                        <td style={{ padding: '12px 8px', color: '#10B981', fontWeight: 600 }}>
                          {formatCurrency(trip.net_ticket_revenue)}
                        </td>
                        <td style={{ padding: '12px 8px', color: '#EF4444' }}>
                          {formatCurrency(trip.total_operating_expenses)}
                        </td>
                        <td
                          style={{
                            padding: '12px 8px',
                            fontWeight: 700,
                            color: trip.trip_profit_loss >= 0 ? '#10B981' : '#DC2626',
                          }}
                        >
                          {formatCurrency(trip.trip_profit_loss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ALL BUSES LIST TABLE */
        <div>
          {/* Search Bar */}
          <div style={{ marginBottom: 16, position: 'relative', maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#8A7A8F' }} />
            <input
              type="text"
              placeholder="Search by bus name or registration..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                border: '1px solid #E7D7E0',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

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
                  <th style={{ padding: '10px 8px' }}>Registration / Bus</th>
                  <th style={{ padding: '10px 8px' }}>Carrier</th>
                  <th style={{ padding: '10px 8px' }}>Trips</th>
                  <th style={{ padding: '10px 8px' }}>Net Revenue</th>
                  <th style={{ padding: '10px 8px' }}>Expenses</th>
                  <th style={{ padding: '10px 8px' }}>Operating Profit</th>
                  <th style={{ padding: '10px 8px' }}>Avg / Trip</th>
                  <th style={{ padding: '10px 8px' }}>Occupancy</th>
                  <th style={{ padding: '10px 8px' }}>Rating</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuses.map((bus) => (
                  <tr
                    key={bus.bus_id}
                    style={{ borderBottom: '1px solid #F4ECF0' }}
                    className="clickable-row"
                  >
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: 700, color: '#24152D' }}>{bus.registration_number}</div>
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
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {formatCurrency(bus.avg_profit_per_trip)}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#10B981', fontWeight: 600 }}>
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
                          padding: '5px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
