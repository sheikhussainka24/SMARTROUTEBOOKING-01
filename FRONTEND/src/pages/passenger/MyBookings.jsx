import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import PassengerReviewModal from '../../components/accounting/PassengerReviewModal.jsx';
import {
  Ticket,
  Bus,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  XCircle,
  Printer,
  Radio,
  Star,
  Download,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

export default function MyBookings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewingBooking, setReviewingBooking] = useState(null);

  // Status Filter Tabs: 'upcoming', 'cancelled', 'completed', 'all'
  const tabParam = (searchParams.get('tab') || 'upcoming').toLowerCase();
  const initialTab = tabParam === 'cancel' ? 'cancelled' : tabParam;
  const [activeTab, setActiveTab] = useState(
    ['upcoming', 'cancelled', 'completed', 'all'].includes(initialTab) ? initialTab : 'upcoming'
  );

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab === 'cancel') {
      setActiveTab('cancelled');
    } else if (currentTab && ['upcoming', 'cancelled', 'completed', 'all'].includes(currentTab.toLowerCase())) {
      setActiveTab(currentTab.toLowerCase());
    }
  }, [searchParams]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/bookings/my-bookings');
      const list = res.bookings || res.data?.bookings || [];
      setBookings(list);
    } catch (err) {
      setError(err.message || 'Failed to load booking history.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  const handleCancel = async (bookingId, pnr, totalFare) => {
    const estFee = Math.round(Number(totalFare || 850) * 0.1);
    const estRefund = Number(totalFare || 850) - estFee;
    const confirmMsg = `Are you sure you want to cancel ticket PNR: ${pnr}?\n\n` +
      `• Total Fare: ₹${totalFare}\n` +
      `• Cancellation Fee (10%): ₹${estFee}\n` +
      `• Estimated Refund Amount: ₹${estRefund}\n\n` +
      `Refund will be processed to your original payment method.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const res = await api.post(`/bookings/${bookingId}/cancel`, {
        reason: 'Passenger requested cancellation from My Tickets portal',
      });
      if (res.success) {
        alert(`Booking cancelled successfully!\nRefund of ₹${res.refund?.amount || estRefund} has been processed.\nRefund Reference: ${res.refund?.refund_id || res.refund?.reference || 'REF-' + pnr}`);
        loadBookings();
      } else {
        alert(res.error || 'Unable to cancel booking.');
      }
    } catch (err) {
      alert(err.message || 'Cancellation request failed.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadPdf = async (pnr) => {
    try {
      const token = localStorage.getItem('smartroute_token') || localStorage.getItem('sr_access_token');
      const pdfUrl = `/api/bookings/pnr/${pnr}/pdf`;
      const response = await fetch(pdfUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error('PDF download failed. Status ' + response.status);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SMART-ROUTE-Ticket-${pnr}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      window.open(`/api/bookings/pnr/${pnr}/pdf`, '_blank');
    }
  };

  // Group and count bookings by status
  const counts = useMemo(() => {
    const c = { upcoming: 0, cancelled: 0, completed: 0, all: bookings.length };
    bookings.forEach((b) => {
      const s = b.computed_status || (b.status === 'cancelled' ? 'cancelled' : 'upcoming');
      if (s === 'cancelled') c.cancelled++;
      else if (s === 'completed') c.completed++;
      else c.upcoming++;
    });
    return c;
  }, [bookings]);

  // Filter bookings according to active tab
  const displayedBookings = useMemo(() => {
    if (activeTab === 'all') return bookings;
    return bookings.filter((b) => {
      const s = b.computed_status || (b.status === 'cancelled' ? 'cancelled' : 'upcoming');
      if (activeTab === 'upcoming') return s === 'upcoming' || s === 'confirmed';
      if (activeTab === 'cancelled') return s === 'cancelled';
      if (activeTab === 'completed') return s === 'completed';
      return true;
    });
  }, [bookings, activeTab]);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, width: '100%', padding: '8px 16px' }}>
      {/* Top Banner / Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)', fontWeight: 600 }}>Passenger Account</span>
            <span style={{ fontSize: 12, color: '#CBD5E1' }}>/</span>
            <span style={{ fontSize: 12, color: '#E11D48', fontWeight: 700 }}>My Tickets &amp; Bookings</span>
          </div>
          <h1 style={{ fontSize: 26, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>
            My Tickets
          </h1>
          <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginTop: 4, margin: 0 }}>
            Manage your confirmed itineraries, download electronic boarding passes, and review refund status
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={loadBookings}
            disabled={loading}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: 13, gap: 6 }}
            title="Refresh ticket records"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 13, gap: 6 }}>
            <Bus size={15} /> Book New Trip
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: '#FFFFFF',
          border: '1.5px solid #F1EDFA',
          padding: 6,
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(36, 21, 45, 0.04)',
          overflowX: 'auto',
        }}
      >
        {[
          { key: 'upcoming', label: 'Upcoming / Confirmed', count: counts.upcoming, badgeColor: '#10B981' },
          { key: 'cancelled', label: 'Cancelled', count: counts.cancelled, badgeColor: '#EF4444' },
          { key: 'completed', label: 'Completed', count: counts.completed, badgeColor: '#6366F1' },
          { key: 'all', label: 'All Tickets', count: counts.all, badgeColor: '#6E5D73' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              style={{
                flex: 1,
                minWidth: 150,
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, #FFF1F6 0%, #FFE4EE 100%)' : 'transparent',
                color: isActive ? '#C13D78' : '#6E5D73',
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 6px rgba(193, 61, 120, 0.12)' : 'none',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? '#C13D78' : '#F1EDFA',
                  color: isActive ? '#FFFFFF' : '#6E5D73',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', padding: 14, borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <BrandLogo variant="icon" size="lg" showText={false} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sr-text-secondary)' }}>
            Retrieving verified electronic tickets &amp; trip schedules...
          </div>
        </div>
      ) : displayedBookings.length === 0 ? (
        /* Empty State */
        <div className="sr-card" style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: '#FFF1F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            <Ticket size={32} color="#C13D78" />
          </div>
          <h3 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>
            {activeTab === 'upcoming' && 'No Upcoming Bookings'}
            {activeTab === 'cancelled' && 'No Cancelled Bookings'}
            {activeTab === 'completed' && 'No Completed Journeys'}
            {activeTab === 'all' && 'No Reservations Found'}
          </h3>
          <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, maxWidth: 440, margin: 0, lineHeight: 1.5 }}>
            {activeTab === 'upcoming' && 'You have no active upcoming bus trips scheduled. Explore available routes with real-time GPS radar.'}
            {activeTab === 'cancelled' && 'You have no cancelled tickets. Any cancelled itineraries and refund references will appear here.'}
            {activeTab === 'completed' && 'You have not completed any journeys yet. Once your bus reaches its destination, it will appear here.'}
            {activeTab === 'all' && 'You haven’t booked any bus trips yet. Search South Indian corridors and reserve seats instantly.'}
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 10, padding: '10px 24px', fontSize: 14 }}>
            <Bus size={16} /> Search Available Buses
          </Link>
        </div>
      ) : (
        /* Tickets List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {displayedBookings.map((b) => {
            const pnr = b.pnr_number || b.pnr || b.booking_number;
            const status = b.computed_status || (b.status === 'cancelled' ? 'cancelled' : 'upcoming');
            const isConfirmed = status === 'upcoming' || status === 'confirmed';
            const isCancelled = status === 'cancelled';
            const isCompleted = status === 'completed';

            const operatorName = b.operator_name || b.travel_name || 'SMART ROUTE Travels';
            const busName = b.bus_name || 'TATA Capella 2+1 AC Sleeper';
            const busReg = b.registration_number || b.bus_number || '';
            const serviceNo = b.service_number || b.trip_number || 'SR-101';
            const originCity = b.source_city || b.source || 'Coimbatore';
            const destCity = b.destination_city || b.destination || 'Tenkasi';
            const journeyDate = b.journey_date || b.travel_date || b.departure_date || 'Today';
            const depTime = b.departure_time || '21:30';
            const arrTime = b.arrival_time || b.estimated_arrival_time || '05:30';
            const boardingStop = b.boarding_stop_name || 'Boarding Point';
            const droppingStop = b.dropping_stop_name || 'Dropping Point';
            const totalFare = Number(b.total_fare || b.total_amount || 850);
            const paxList = b.passengers || [];
            const seatList = b.seats || paxList.map((p) => p.seat_number || p.seatNumber).filter(Boolean);
            const bookingDate = b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Confirmed';

            return (
              <div
                key={b.id || pnr}
                className="sr-card"
                style={{
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  borderLeft: isCancelled ? '4px solid #EF4444' : (isCompleted ? '4px solid #6366F1' : '4px solid #10B981'),
                  boxShadow: '0 3px 12px rgba(36, 21, 45, 0.05)',
                }}
              >
                {/* 1. Ticket Top Row: Operator Logo/Info + PNR + Status Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1EDFA', paddingBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#FFF1F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #E7A0BF',
                      }}
                    >
                      <Bus size={22} color="#C13D78" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h3 style={{ fontWeight: 800, fontSize: 17, color: 'var(--sr-text-primary)', margin: 0 }}>
                          {operatorName}
                        </h3>
                        {busReg && (
                          <span style={{ fontSize: 11, background: '#F1EDFA', color: '#6E5D73', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                            {busReg}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 2 }}>
                        {busName} &bull; Service #{serviceNo}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Status Badge */}
                    {isCancelled && (
                      <span className="badge badge-warning" style={{ background: '#FEE2E2', color: '#B91C1C', borderColor: '#FCA5A5', fontWeight: 800 }}>
                        <XCircle size={12} style={{ marginRight: 4 }} /> Cancelled
                      </span>
                    )}
                    {isCompleted && (
                      <span className="badge" style={{ background: '#EEF2FF', color: '#4338CA', borderColor: '#C7D2FE', fontWeight: 800 }}>
                        <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Journey Completed
                      </span>
                    )}
                    {isConfirmed && (
                      <span className="badge badge-success" style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0', fontWeight: 800 }}>
                        <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Confirmed &amp; Paid
                      </span>
                    )}

                    {/* PNR Code Pill */}
                    <div style={{ background: '#FFF1F6', border: '1.5px solid #E7A0BF', padding: '5px 12px', borderRadius: 8 }}>
                      <span style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, marginRight: 6 }}>PNR:</span>
                      <strong style={{ fontSize: 14, color: '#C13D78', letterSpacing: '0.06em' }}>{pnr}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Journey Details Grid: Route, Timing, Seats, Fare */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                  {/* Origin & Destination Corridor */}
                  <div>
                    <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Journey Corridor
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#24152D', marginTop: 4 }}>
                      {originCity} <span style={{ color: '#C13D78' }}>➔</span> {destCity}
                    </div>
                    <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <MapPin size={13} color="#C13D78" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div>Boarding: <strong style={{ color: '#24152D' }}>{boardingStop}</strong></div>
                        <div style={{ marginTop: 2 }}>Dropping: <strong style={{ color: '#24152D' }}>{droppingStop}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Date & Schedule */}
                  <div>
                    <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Departure &amp; Arrival Schedule
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#24152D', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} color="#C13D78" />
                      <span>{journeyDate}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#24152D', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} color="#10B981" />
                        <span>Dep: <strong>{depTime}</strong></span>
                      </div>
                      <span style={{ color: '#CBD5E1' }}>&bull;</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} color="#6366F1" />
                        <span>Arr: <strong>{arrTime}</strong></span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#6E5D73', marginTop: 4 }}>
                      Booked on: {bookingDate}
                    </div>
                  </div>

                  {/* Seat & Passenger Info */}
                  <div>
                    <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Seats &amp; Passengers
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                      {seatList.map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: '#FFF1F6',
                            border: '1px solid #E7A0BF',
                            color: '#C13D78',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          Seat {s}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 6 }}>
                      {paxList.length || seatList.length || 1} Passenger(s) &bull; Payment: <strong style={{ color: isCancelled ? '#EF4444' : '#10B981', textTransform: 'uppercase' }}>{b.payment_status || 'PAID'}</strong>
                    </div>
                  </div>

                  {/* Total Fare / Refund Info */}
                  <div>
                    <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {isCancelled ? 'Refund Summary' : 'Total Fare'}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: isCancelled ? '#EF4444' : '#C13D78', marginTop: 4 }}>
                      ₹{totalFare}
                    </div>
                    {isCancelled && (
                      <div style={{ fontSize: 11, color: '#6E5D73', marginTop: 4, background: '#F8FAFC', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                        <div>Refund: <strong style={{ color: '#10B981' }}>₹{b.refund_amount || Math.round(totalFare * 0.9)}</strong> ({b.refund_status || 'completed'})</div>
                        {b.refund_reference && <div style={{ fontSize: 10, color: '#6E5D73', marginTop: 2 }}>Ref: {b.refund_reference}</div>}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Action Buttons Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, borderTop: '1px solid #F1EDFA', paddingTop: 14, flexWrap: 'wrap' }}>
                  {/* View E-Ticket */}
                  <Link
                    to={`/ticket-confirmation/${pnr}`}
                    className="btn btn-outline"
                    style={{ padding: '7px 14px', fontSize: 12, gap: 6, color: '#24152D', borderColor: '#CBD5E1' }}
                  >
                    <Printer size={14} color="#6E5D73" /> View E-Ticket
                  </Link>

                  {/* Download PDF E-Ticket */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(pnr)}
                    className="btn btn-outline"
                    style={{ padding: '7px 14px', fontSize: 12, gap: 6, color: '#C13D78', borderColor: '#E7A0BF' }}
                  >
                    <Download size={14} color="#C13D78" /> Download PDF
                  </button>

                  {/* Live Radar */}
                  <Link
                    to={`/track?pnr=${pnr}`}
                    className="btn btn-outline"
                    style={{ padding: '7px 14px', fontSize: 12, gap: 6, borderColor: 'rgba(16, 185, 129, 0.4)', color: '#059669', background: '#F0FDF4' }}
                  >
                    <Radio size={14} color="#059669" /> Live Bus Radar
                  </Link>

                  {/* Rate Journey */}
                  {(isConfirmed || isCompleted) && (
                    <button
                      type="button"
                      onClick={() => setReviewingBooking(b)}
                      className="btn btn-outline"
                      style={{ padding: '7px 14px', fontSize: 12, gap: 6, borderColor: '#F59E0B', color: '#D97706', fontWeight: 700 }}
                    >
                      <Star size={14} fill="#D97706" /> Rate Journey
                    </button>
                  )}

                  {/* Cancel Booking (Only enabled for upcoming/confirmed) */}
                  {isConfirmed && (
                    <button
                      type="button"
                      onClick={() => handleCancel(b.id, pnr, totalFare)}
                      disabled={cancellingId === b.id}
                      className="btn btn-outline"
                      style={{ padding: '7px 14px', fontSize: 12, borderColor: 'rgba(239, 68, 68, 0.4)', color: '#DC2626', background: '#FEF2F2' }}
                    >
                      <XCircle size={14} /> {cancellingId === b.id ? 'Processing...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verified Passenger Review Modal */}
      {reviewingBooking && (
        <PassengerReviewModal
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onSuccess={() => {
            alert('Thank you! Your verified rating and feedback have been published.');
            setReviewingBooking(null);
          }}
        />
      )}
    </div>
  );
}
