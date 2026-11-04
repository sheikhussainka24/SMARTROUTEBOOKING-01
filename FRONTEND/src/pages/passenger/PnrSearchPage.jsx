import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import {
  Search,
  Ticket,
  Bus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  Download,
  Radio,
  Shield,
  ArrowRight,
  User,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

export default function PnrSearchPage() {
  const [pnrInput, setPnrInput] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const clean = pnrInput.trim().toUpperCase();

    if (!clean) {
      setError('Please enter a PNR code to search.');
      return;
    }

    const pnrRegex = /^[A-Z0-9_-]{4,15}$/;
    if (!pnrRegex.test(clean)) {
      setError('Invalid PNR format. PNR must be 4 to 15 alphanumeric characters (e.g. SR4102, VV8820).');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    setTicket(null);

    try {
      const res = await api.get(`/bookings/pnr-search/${clean}`);
      if (res.success && res.ticket) {
        setTicket(res.ticket);
      } else {
        setError(res.error || `No booking found with PNR: ${clean}. Please verify the code and try again.`);
      }
    } catch (err) {
      setError(err.message || `No booking found with PNR: ${clean}. Please verify the code and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (pnr) => {
    if (!pnr) return;
    try {
      const token = localStorage.getItem('smartroute_token') || localStorage.getItem('sr_access_token');
      const res = await fetch(`/api/bookings/pnr/${pnr}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SMART-ROUTE-Ticket-${pnr}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(`/api/bookings/pnr/${pnr}/pdf`, '_blank');
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, width: '100%', padding: '16px' }}>
      {/* Search Header Banner */}
      <div
        style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg, #FFF1F6 0%, #FFFFFF 100%)',
          border: '1.5px solid #F1EDFA',
          padding: '36px 28px',
          boxShadow: '0 4px 20px rgba(36, 21, 45, 0.05)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E11D48 0%, #C13D78 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(193, 61, 120, 0.3)',
          }}
        >
          <Ticket size={24} color="#FFFFFF" />
        </div>

        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--sr-text-primary)', margin: 0 }}>
            Track Your Booking &amp; E-Ticket
          </h1>
          <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginTop: 4, maxWidth: 480 }}>
            Enter your Passenger Name Record (PNR) number to retrieve your real-time itinerary, seat allocations, live GPS radar, and cancellation/refund details.
          </p>
        </div>

        {/* PNR Search Form */}
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            maxWidth: 520,
            marginTop: 8,
          }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="#C13D78" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              value={pnrInput}
              onChange={(e) => {
                setPnrInput(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="Enter PNR Number (e.g. SR4102)"
              style={{
                paddingLeft: 40,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.06em',
                height: 46,
                textTransform: 'uppercase',
                background: '#FFFFFF',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ height: 46, padding: '0 24px', fontSize: 14, fontWeight: 800, flexShrink: 0 }}
          >
            {loading ? 'Searching...' : 'Search PNR'}
          </button>
        </form>

        {/* Privacy Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6E5D73', marginTop: 4 }}>
          <Lock size={12} color="#10B981" />
          <span>Strict Passenger Privacy &bull; Contact info is cryptographically masked for non-owners</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1.5px solid #FCA5A5',
            color: '#B91C1C',
            padding: 16,
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertCircle size={18} color="#B91C1C" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Details Result Card */}
      {ticket && (
        <div
          className="sr-card"
          style={{
            padding: 26,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            borderLeft: ticket.computed_status === 'cancelled'
              ? '4px solid #EF4444'
              : (ticket.computed_status === 'completed' ? '4px solid #6366F1' : '4px solid #10B981'),
            boxShadow: '0 4px 18px rgba(36, 21, 45, 0.06)',
          }}
        >
          {/* Top Bar: Operator & Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #F1EDFA', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#FFF1F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E7A0BF',
                }}
              >
                <Bus size={24} color="#C13D78" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--sr-text-primary)', margin: 0 }}>
                  {ticket.operator_name || 'SMART ROUTE Travels'}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 2 }}>
                  {ticket.bus_name} &bull; Service #{ticket.service_number} &bull; {ticket.bus_number}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Lifecycle Status Badge */}
              {ticket.computed_status === 'cancelled' && (
                <span className="badge badge-warning" style={{ background: '#FEE2E2', color: '#B91C1C', borderColor: '#FCA5A5', fontWeight: 800 }}>
                  <XCircle size={12} style={{ marginRight: 4 }} /> Cancelled
                </span>
              )}
              {ticket.computed_status === 'completed' && (
                <span className="badge" style={{ background: '#EEF2FF', color: '#4338CA', borderColor: '#C7D2FE', fontWeight: 800 }}>
                  <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Journey Completed
                </span>
              )}
              {ticket.computed_status === 'upcoming' && (
                <span className="badge badge-success" style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0', fontWeight: 800 }}>
                  <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Confirmed &amp; Active
                </span>
              )}

              {/* PNR Code Pill */}
              <div style={{ background: '#FFF1F6', border: '1.5px solid #E7A0BF', padding: '6px 14px', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, marginRight: 6 }}>PNR:</span>
                <strong style={{ fontSize: 15, color: '#C13D78', letterSpacing: '0.06em' }}>{ticket.pnr}</strong>
              </div>
            </div>
          </div>

          {/* Journey Corridor Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {/* Origin & Destination */}
            <div>
              <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                Route Corridor
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#24152D', marginTop: 3 }}>
                {ticket.source_city} <span style={{ color: '#C13D78' }}>➔</span> {ticket.destination_city}
              </div>
              <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <MapPin size={14} color="#C13D78" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div>Boarding: <strong style={{ color: '#24152D' }}>{ticket.boarding_stop_name}</strong></div>
                  <div style={{ marginTop: 2 }}>Dropping: <strong style={{ color: '#24152D' }}>{ticket.dropping_stop_name}</strong></div>
                </div>
              </div>
            </div>

            {/* Timings */}
            <div>
              <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                Date &amp; Schedule
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#24152D', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="#C13D78" />
                <span>{ticket.journey_date}</span>
              </div>
              <div style={{ fontSize: 13, color: '#24152D', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} color="#10B981" />
                  <span>Dep: <strong>{ticket.departure_time}</strong></span>
                </div>
                <span style={{ color: '#CBD5E1' }}>&bull;</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} color="#6366F1" />
                  <span>Arr: <strong>{ticket.arrival_time}</strong></span>
                </div>
              </div>
            </div>

            {/* Seat & Passenger */}
            <div>
              <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                Allocated Seats
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {ticket.seats?.map((s, idx) => (
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
                {ticket.passengers_count || ticket.seats?.length || 1} Passenger(s) &bull; Fare: <strong>₹{ticket.total_fare}</strong>
              </div>
            </div>

            {/* Privacy & Contact Info */}
            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Shield size={12} color="#10B981" />
                <span>Passenger Contact (Protected)</span>
              </div>
              <div style={{ fontSize: 12, color: '#24152D', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={12} color="#6E5D73" />
                <span>Phone: <strong>{ticket.contact_mobile}</strong></span>
              </div>
              <div style={{ fontSize: 12, color: '#24152D', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={12} color="#6E5D73" />
                <span>Email: <strong>{ticket.contact_email}</strong></span>
              </div>
            </div>
          </div>

          {/* Cancellation & Refund Notice if cancelled */}
          {ticket.computed_status === 'cancelled' && (
            <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', padding: 14, borderRadius: 10, fontSize: 13 }}>
              <div style={{ fontWeight: 800, color: '#9F1239', marginBottom: 4 }}>Cancellation &amp; Refund Notice</div>
              <div style={{ color: '#4C0519' }}>
                This ticket was cancelled. Reason: <em>{ticket.cancellation_reason || 'Passenger requested cancellation'}</em>.
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, fontWeight: 700, color: '#9F1239' }}>
                <span>Refund Amount: ₹{ticket.refund_amount}</span>
                <span>Refund Status: {ticket.refund_status?.toUpperCase()}</span>
                {ticket.refund_reference && <span>Refund Ref: {ticket.refund_reference}</span>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, borderTop: '1px solid #F1EDFA', paddingTop: 14, flexWrap: 'wrap' }}>
            <Link
              to={`/ticket-confirmation/${ticket.pnr}`}
              className="btn btn-outline"
              style={{ padding: '7px 16px', fontSize: 13, gap: 6 }}
            >
              <Printer size={14} /> View Full E-Ticket
            </Link>

            <button
              type="button"
              onClick={() => handleDownloadPdf(ticket.pnr)}
              className="btn btn-outline"
              style={{ padding: '7px 16px', fontSize: 13, gap: 6, color: '#C13D78', borderColor: '#E7A0BF' }}
            >
              <Download size={14} color="#C13D78" /> Download PDF E-Ticket
            </button>

            <Link
              to={`/track?pnr=${ticket.pnr}`}
              className="btn btn-outline"
              style={{ padding: '7px 16px', fontSize: 13, gap: 6, borderColor: 'rgba(16, 185, 129, 0.4)', color: '#059669', background: '#F0FDF4' }}
            >
              <Radio size={14} color="#059669" /> Live GPS Bus Radar
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

