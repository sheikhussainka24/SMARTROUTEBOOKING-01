import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  RotateCcw,
  RefreshCw,
  ArrowRight,
  Printer,
  Download,
  Calendar,
  Bus,
  Search,
  ExternalLink,
} from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs = [
    { key: 'all', label: 'All Transactions' },
    { key: 'successful', label: 'Successful' },
    { key: 'pending', label: 'Pending' },
    { key: 'failed', label: 'Failed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'refund_pending', label: 'Refund Pending' },
    { key: 'refund_completed', label: 'Refund Completed' },
  ];

  useEffect(() => {
    loadTransactions();
  }, [selectedFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/bookings/transactions?status=${selectedFilter}`);
      const list = res.transactions || res.data?.transactions || [];
      setTransactions(list);
    } catch (err) {
      setError(err.message || 'Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (pnr) => {
    if (!pnr) return;
    try {
      const token = localStorage.getItem('smartroute_token') || localStorage.getItem('sr_access_token');
      const res = await fetch(`/api/bookings/pnr/${pnr}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Receipt generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SMART-ROUTE-Receipt-${pnr}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      window.open(`/api/bookings/pnr/${pnr}/pdf`, '_blank');
    }
  };

  // Client-side search by PNR, Transaction Ref, Operator, or Corridor
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase().trim();
    return transactions.filter((t) => {
      const pnr = (t.pnr_number || t.pnr || '').toLowerCase();
      const ref = (t.transaction_reference || t.transaction_id || '').toLowerCase();
      const op = (t.operator_name || '').toLowerCase();
      const src = (t.source_city || '').toLowerCase();
      const dst = (t.destination_city || '').toLowerCase();
      const method = (t.payment_method || '').toLowerCase();
      return pnr.includes(q) || ref.includes(q) || op.includes(q) || src.includes(q) || dst.includes(q) || method.includes(q);
    });
  }, [transactions, searchQuery]);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20, width: '100%', padding: '8px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)', fontWeight: 600 }}>Passenger Account</span>
            <span style={{ fontSize: 12, color: '#CBD5E1' }}>/</span>
            <span style={{ fontSize: 12, color: '#E11D48', fontWeight: 700 }}>Payments &amp; Transactions</span>
          </div>
          <h1 style={{ fontSize: 26, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>
            Transaction History
          </h1>
          <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginTop: 4, margin: 0 }}>
            Review booking payments, cancellations, and real-time refund status with permanent transaction references
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={loadTransactions}
            disabled={loading}
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: 13, gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/my-tickets" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 13, gap: 6 }}>
            <span>View My Tickets</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Filter Tabs Bar & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            background: '#FFFFFF',
            border: '1.5px solid #F1EDFA',
            padding: 6,
            borderRadius: 14,
            boxShadow: '0 2px 8px rgba(36, 21, 45, 0.04)',
            overflowX: 'auto',
          }}
        >
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedFilter(tab.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, #FFF1F6 0%, #FFE4EE 100%)' : 'transparent',
                  color: isActive ? '#C13D78' : '#6E5D73',
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 4px rgba(193, 61, 120, 0.15)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions by PNR, Transaction Ref, Operator, or City..."
            style={{ paddingLeft: 38, fontSize: 13, height: 42, background: '#FFFFFF' }}
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', padding: 14, borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <BrandLogo variant="icon" size="lg" showText={false} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sr-text-secondary)' }}>
            Retrieving payment records and transaction logs...
          </div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        /* Empty State */
        <div className="sr-card" style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#FFF1F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={30} color="#C13D78" />
          </div>
          <h3 style={{ fontSize: 18, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>
            No Transactions Found
          </h3>
          <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, maxWidth: 440, margin: 0 }}>
            {selectedFilter === 'all'
              ? 'No payments or booking transactions recorded yet. Complete a reservation to view receipt history here.'
              : `No transactions matching "${selectedFilter.replace('_', ' ')}" criteria found.`}
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>
            <Bus size={15} /> Book a Journey
          </Link>
        </div>
      ) : (
        /* Transactions List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredTransactions.map((t) => {
            const pnr = t.pnr_number || t.pnr || 'PNR';
            const isCancelled = t.cancellation_status === 'cancelled' || t.booking_status === 'cancelled';
            const isSuccess = t.payment_status === 'completed' || t.payment_status === 'paid';
            const isRefundCompleted = t.refund_status === 'completed' || t.refund_status === 'processed';
            const isRefundPending = t.refund_status === 'pending';

            const txDate = t.created_at || t.date
              ? new Date(t.created_at || t.date).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Confirmed';

            return (
              <div
                key={t.id || t.transaction_id}
                className="sr-card"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  borderLeft: isCancelled
                    ? '4px solid #EF4444'
                    : (isSuccess ? '4px solid #10B981' : '4px solid #F59E0B'),
                  boxShadow: '0 2px 10px rgba(36, 21, 45, 0.04)',
                }}
              >
                {/* Top Row: Transaction ID, PNR, and Status Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #F1EDFA', paddingBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                        TXN REF:
                      </span>
                      <strong style={{ fontSize: 13, color: '#24152D', letterSpacing: '0.04em' }}>
                        {t.transaction_reference || t.transaction_id || t.id}
                      </strong>
                      <span style={{ color: '#CBD5E1' }}>&bull;</span>
                      <span style={{ fontSize: 12, color: '#6E5D73' }}>{txDate}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Payment Status Badge */}
                    {isSuccess && (
                      <span className="badge badge-success" style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}>
                        <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Payment Paid
                      </span>
                    )}
                    {t.payment_status === 'pending' && (
                      <span className="badge" style={{ background: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A' }}>
                        <Clock size={12} style={{ marginRight: 4 }} /> Payment Pending
                      </span>
                    )}
                    {t.payment_status === 'failed' && (
                      <span className="badge badge-warning" style={{ background: '#FEE2E2', color: '#B91C1C', borderColor: '#FCA5A5' }}>
                        <XCircle size={12} style={{ marginRight: 4 }} /> Payment Failed
                      </span>
                    )}

                    {/* Booking Status Badge */}
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontWeight: 700,
                        background: isCancelled ? '#FEE2E2' : '#EEF2FF',
                        color: isCancelled ? '#B91C1C' : '#4338CA',
                        border: isCancelled ? '1px solid #FCA5A5' : '1px solid #C7D2FE',
                      }}
                    >
                      Booking: {isCancelled ? 'Cancelled' : (t.booking_status || 'Confirmed')}
                    </span>

                    {/* Refund Badge if applicable */}
                    {isRefundCompleted && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                          background: '#ECFDF5',
                          color: '#047857',
                          border: '1px solid #A7F3D0',
                        }}
                      >
                        Refund Completed
                      </span>
                    )}
                    {isRefundPending && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 700,
                          background: '#FEF3C7',
                          color: '#92400E',
                          border: '1px solid #FCD34D',
                        }}
                      >
                        Refund Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Grid: Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  {/* Journey & Operator */}
                  <div>
                    <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                      Corridor &amp; Operator
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#24152D', marginTop: 2 }}>
                      {t.source_city} <span style={{ color: '#C13D78' }}>➔</span> {t.destination_city}
                    </div>
                    <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 3 }}>
                      {t.operator_name || 'SMART ROUTE Travels'}
                    </div>
                  </div>

                  {/* PNR & Journey Date */}
                  <div>
                    <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                      PNR &amp; Travel Date
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#C13D78', background: '#FFF1F6', padding: '2px 8px', borderRadius: 6, border: '1px solid #E7A0BF' }}>
                        {pnr}
                      </span>
                      <span style={{ fontSize: 12, color: '#24152D', fontWeight: 600 }}>
                        {t.journey_date} ({t.departure_time})
                      </span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div>
                    <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                      Amount &amp; Method
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#24152D', marginTop: 2 }}>
                      ₹{t.amount}
                    </div>
                    <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 2 }}>
                      Method: <strong style={{ color: '#24152D' }}>{t.payment_method || 'UPI'}</strong>
                    </div>
                  </div>

                  {/* Refund Information */}
                  {isCancelled && (
                    <div style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                        Refund Record
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#047857', marginTop: 2 }}>
                        ₹{t.refund_amount || Math.round(t.amount * 0.9)} ({t.refund_status || 'completed'})
                      </div>
                      {t.refund_reference && (
                        <div style={{ fontSize: 11, color: '#6E5D73', marginTop: 2 }}>
                          Ref: <strong style={{ color: '#24152D' }}>{t.refund_reference}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action Links */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, borderTop: '1px solid #F1EDFA', paddingTop: 10, flexWrap: 'wrap' }}>
                  <Link
                    to={`/ticket-confirmation/${pnr}`}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: 12, gap: 5 }}
                  >
                    <Printer size={13} /> View Ticket
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(pnr)}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: 12, gap: 5, color: '#C13D78', borderColor: '#E7A0BF' }}
                  >
                    <Download size={13} color="#C13D78" /> Download Receipt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

