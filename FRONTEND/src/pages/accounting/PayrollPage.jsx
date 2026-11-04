/**
 * SMART ROUTE — Driver & Cleaner Salary / Payroll Accounting Page
 * Module 6: Monthly salaries, trip allowances, daily batty, and single-count allocation enforcement
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import accountingApi from '../../services/accountingService.js';
import {
  Users,
  Plus,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export default function PayrollPage() {
  const { user } = useAuth();
  const [payroll, setPayroll] = useState({ records: [], total_payable: 0, total_paid: 0, total_balance: 0 });
  const [buses, setBuses] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [periodMonth, setPeriodMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    staffName: '',
    role: 'driver',
    payrollType: 'monthly_salary',
    periodMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    amountPayable: '',
    amountPaid: '',
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  const formatCurrency = (amt) => {
    const val = Number(amt) || 0;
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const loadPayroll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [payRes, busRes] = await Promise.all([
        accountingApi.getPayroll({ role: roleFilter, periodMonth }),
        accountingApi.getBusesAccounting({ dateRange: 'all' }),
      ]);
      if (payRes.success) {
        setPayroll(payRes.data);
      }
      if (busRes.success) {
        setBuses(busRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payroll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayroll();
  }, [roleFilter, periodMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await accountingApi.recordPayroll({
        ...formData,
        travelId: user?.travelId || buses[0]?.travel_id,
      });
      if (res.success) {
        setSuccessMsg('Salary / Payroll transaction logged successfully with single-count protection.');
        setShowModal(false);
        setFormData({
          staffName: '',
          role: 'driver',
          payrollType: 'monthly_salary',
          periodMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          amountPayable: '',
          amountPaid: '',
          paymentMethod: 'bank_transfer',
          notes: '',
        });
        loadPayroll();
      }
    } catch (err) {
      setError(err.message || 'Failed to record payroll');
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', color: '#24152D' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#24152D' }}>
            Driver & Cleaner Payroll Accounting
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
            Base monthly salaries, trip batty, and crew allowances with guaranteed single-count expense protection
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            border: 'none',
            background: 'var(--sr-primary, #C13D78)',
            color: '#FFF',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 10px rgba(193, 61, 120, 0.25)',
          }}
        >
          <Plus size={16} /> Record Salary / Allowance
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A8F', textTransform: 'uppercase' }}>Total Payroll Payable</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#24152D', marginTop: 4 }}>
            {formatCurrency(payroll.total_payable)}
          </div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 2 }}>For period {periodMonth}</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A8F', textTransform: 'uppercase' }}>Total Amount Disbursed</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
            {formatCurrency(payroll.total_paid)}
          </div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 2 }}>Bank transfer & cash vouchers</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A8F', textTransform: 'uppercase' }}>Outstanding Balance</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: payroll.total_balance > 0 ? '#EF4444' : '#10B981', marginTop: 4 }}>
            {formatCurrency(payroll.total_balance)}
          </div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 2 }}>Pending crew settlement</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A8F', textTransform: 'uppercase' }}>Double-Count Safeguard</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={18} /> ACTIVE
          </div>
          <div style={{ fontSize: 11, color: '#8A7A8F', marginTop: 2 }}>Monthly base salary counted once</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: '#FFF',
          border: '1px solid #E7D7E0',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13, background: '#FFF' }}
        >
          <option value="">All Roles (Drivers & Cleaners)</option>
          <option value="driver">Commercial Drivers Only</option>
          <option value="cleaner">Cleaners / Helpers Only</option>
        </select>

        <input
          type="month"
          value={periodMonth}
          onChange={(e) => setPeriodMonth(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13, background: '#FFF' }}
        />
      </div>

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
              <th style={{ padding: '12px 8px' }}>Staff Name</th>
              <th style={{ padding: '12px 8px' }}>Role</th>
              <th style={{ padding: '12px 8px' }}>Payroll Type</th>
              <th style={{ padding: '12px 8px' }}>Period</th>
              <th style={{ padding: '12px 8px' }}>Payable</th>
              <th style={{ padding: '12px 8px' }}>Paid</th>
              <th style={{ padding: '12px 8px' }}>Balance</th>
              <th style={{ padding: '12px 8px' }}>Payment Date</th>
              <th style={{ padding: '12px 8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {payroll.records.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F4ECF0' }}>
                <td style={{ padding: '12px 8px', fontWeight: 700, color: '#24152D' }}>{p.staff_name}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span
                    style={{
                      background: p.role === 'driver' ? '#EFF6FF' : '#FDF2F8',
                      color: p.role === 'driver' ? '#3B82F6' : '#C13D78',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.role}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>
                  {p.payroll_type.replace(/_/g, ' ')}
                </td>
                <td style={{ padding: '12px 8px' }}>{p.period_month}</td>
                <td style={{ padding: '12px 8px', fontWeight: 700 }}>{formatCurrency(p.amount_payable)}</td>
                <td style={{ padding: '12px 8px', color: '#10B981', fontWeight: 700 }}>{formatCurrency(p.amount_paid)}</td>
                <td style={{ padding: '12px 8px', color: p.balance > 0 ? '#EF4444' : '#6E5D73', fontWeight: p.balance > 0 ? 700 : 400 }}>
                  {formatCurrency(p.balance)}
                </td>
                <td style={{ padding: '12px 8px', color: '#6E5D73' }}>{p.payment_date || 'Pending'}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span
                    style={{
                      background: p.payment_status === 'paid' ? '#ECFDF5' : '#FEF3C7',
                      color: p.payment_status === 'paid' ? '#065F46' : '#92400E',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {p.payment_status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECORD PAYROLL MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#24152D' }}>
                Record Crew Salary / Allowance
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#8A7A8F' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Staff Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. K. Murugan"
                    value={formData.staffName}
                    onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="driver">Driver</option>
                    <option value="cleaner">Cleaner</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Payroll Type *</label>
                  <select
                    value={formData.payrollType}
                    onChange={(e) => setFormData({ ...formData, payrollType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="monthly_salary">Base Monthly Salary</option>
                    <option value="per_trip">Per-Trip Salary / Batty</option>
                    <option value="daily_allowance">Daily Allowance</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Payroll Month *</label>
                  <input
                    type="month"
                    value={formData.periodMonth}
                    onChange={(e) => setFormData({ ...formData, periodMonth: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Amount Payable (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 30000"
                    value={formData.amountPayable}
                    onChange={(e) => setFormData({ ...formData, amountPayable: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Amount Paid (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 30000"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                >
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash Voucher</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ border: '1px solid #E7D7E0', background: '#FFF', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ border: 'none', background: 'var(--sr-primary, #C13D78)', color: '#FFF', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Salary Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
