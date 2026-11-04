/**
 * SMART ROUTE — Daily Expense Management & Approvals Page
 * Module 4: 12 Categories, validation, approval/correction workflows, and audit trail
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import accountingApi from '../../services/accountingService.js';
import {
  DollarSign,
  Plus,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  FileText,
  Filter,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'diesel_fuel', label: '1. Diesel / Fuel' },
  { id: 'driver_salary', label: '2. Driver Salary' },
  { id: 'cleaner_salary', label: '3. Cleaner Salary' },
  { id: 'driver_allowance', label: '4. Driver Trip Allowance' },
  { id: 'cleaner_allowance', label: '5. Cleaner Trip Allowance' },
  { id: 'toll', label: '6. Toll Charges' },
  { id: 'parking', label: '7. Parking Charges' },
  { id: 'maintenance', label: '8. Maintenance & Repairs' },
  { id: 'tyres_spares', label: '9. Tyres & Spare Parts' },
  { id: 'insurance_permits', label: '10. Insurance & Permits' },
  { id: 'staff_food', label: '11. Staff Food & Approved Allowance' },
  { id: 'other', label: '12. Other Operating Expenses' },
];

export default function ExpenseManagementPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    busId: '',
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'diesel_fuel',
    amount: '',
    quantity: '',
    unitPrice: '',
    vendor: '',
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  const formatCurrency = (amt) => {
    const val = Number(amt) || 0;
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expRes, busRes] = await Promise.all([
        accountingApi.getExpenses({ category: categoryFilter, status: statusFilter, dateRange }),
        accountingApi.getBusesAccounting({ dateRange: 'all' }),
      ]);
      if (expRes.success) {
        setExpenses(expRes.data || []);
      }
      if (busRes.success) {
        setBuses(busRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [categoryFilter, statusFilter, dateRange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await accountingApi.createExpense({
        ...formData,
        travelId: user?.travelId || buses[0]?.travel_id,
      });
      if (res.success) {
        setSuccessMsg('Operating expense recorded successfully and added to audit ledger.');
        setShowModal(false);
        setFormData({
          busId: '',
          expenseDate: new Date().toISOString().split('T')[0],
          category: 'diesel_fuel',
          amount: '',
          quantity: '',
          unitPrice: '',
          vendor: '',
          paymentMethod: 'bank_transfer',
          notes: '',
        });
        loadExpenses();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit expense');
    }
  };

  const handleAction = async (id, action) => {
    try {
      const reason = window.prompt(`Enter verification note or reason for ${action}:`);
      if (reason === null) return;
      await accountingApi.updateExpenseApproval(id, { action, reason });
      setSuccessMsg(`Expense marked as ${action} with immutable audit log.`);
      loadExpenses();
    } catch (err) {
      setError(err.message || `Failed to ${action} expense`);
    }
  };

  const totalExpenseAmount = expenses
    .filter((e) => e.approval_status === 'approved')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', color: '#24152D' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#24152D' }}>
            Daily Operating Expense Management & Audit
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
            Record expenses against fleet, trips, or carrier operations with dual-approval and reversal audit trails
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
          <Plus size={16} /> Record New Expense
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

      {/* Filter Toolbar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7D7E0',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13, background: '#FFF' }}
          >
            <option value="">All 12 Expense Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13, background: '#FFF' }}
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
            <option value="reversed">Reversed</option>
          </select>

          {/* Date Range Tabs */}
          <div style={{ display: 'flex', background: '#F9F5F8', borderRadius: 8, padding: 2 }}>
            {['all', 'today', 'this_week', 'this_month', 'this_year'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDateRange(p)}
                style={{
                  border: 'none',
                  background: dateRange === p ? 'var(--sr-primary, #C13D78)' : 'transparent',
                  color: dateRange === p ? '#FFF' : '#6E5D73',
                  padding: '6px 10px',
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
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: '#24152D' }}>
          Approved Total: <span style={{ color: '#EF4444' }}>{formatCurrency(totalExpenseAmount)}</span>
        </div>
      </div>

      {/* Expense List Table */}
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
              <th style={{ padding: '10px 8px' }}>Date</th>
              <th style={{ padding: '10px 8px' }}>Category</th>
              <th style={{ padding: '10px 8px' }}>Amount</th>
              <th style={{ padding: '10px 8px' }}>Bus / Unit</th>
              <th style={{ padding: '10px 8px' }}>Vendor / Payee</th>
              <th style={{ padding: '10px 8px' }}>Payment Method</th>
              <th style={{ padding: '10px 8px' }}>Status</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#8A7A8F' }}>
                  No expense records found matching the current filters.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => {
                const bus = buses.find((b) => b.bus_id === exp.bus_id || b.id === exp.bus_id);
                return (
                  <tr key={exp.id} style={{ borderBottom: '1px solid #F4ECF0' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: '#24152D' }}>
                      {exp.expense_date}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        style={{
                          background: '#FFF1F6',
                          color: '#C13D78',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {exp.category.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 700, color: '#EF4444' }}>
                      {formatCurrency(exp.amount)}
                      {exp.is_salary_allocation && (
                        <div style={{ fontSize: 10, color: '#8A7A8F', fontWeight: 400 }}>Trip Allocation (Single-Count)</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {bus ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#24152D' }}>{bus.registration_number}</div>
                          <div style={{ fontSize: 11, color: '#8A7A8F' }}>{bus.name}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#8A7A8F' }}>General Fleet</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#6E5D73' }}>
                      {exp.vendor || 'Direct Expense'}
                      {exp.notes && (
                        <div style={{ fontSize: 11, color: '#8A7A8F', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', color: '#6E5D73', textTransform: 'capitalize' }}>
                      {exp.payment_method?.replace('_', ' ')}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            exp.approval_status === 'approved'
                              ? '#ECFDF5'
                              : exp.approval_status === 'reversed'
                              ? '#FEF2F2'
                              : '#FEF3C7',
                          color:
                            exp.approval_status === 'approved'
                              ? '#065F46'
                              : exp.approval_status === 'reversed'
                              ? '#991B1B'
                              : '#92400E',
                        }}
                      >
                        {exp.approval_status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      {exp.approval_status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleAction(exp.id, 'approve')}
                          style={{
                            border: '1px solid #10B981',
                            background: '#ECFDF5',
                            color: '#10B981',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginRight: 6,
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {exp.approval_status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleAction(exp.id, 'reverse')}
                          title="Reverse this transaction with full audit trail"
                          style={{
                            border: '1px solid #FCA5A5',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* RECORD EXPENSE MODAL */}
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
              maxWidth: 540,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#24152D' }}>
                Record Fleet / Operational Expense
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
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Expense Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Amount (INR ₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 12500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Assigned Bus (Optional)
                </label>
                <select
                  value={formData.busId}
                  onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                >
                  <option value="">General Fleet / Unassigned</option>
                  {buses.map((b) => (
                    <option key={b.bus_id || b.id} value={b.bus_id || b.id}>
                      {b.registration_number} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Vendor / Service Provider
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Oil Plaza"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                  >
                    <option value="bank_transfer">Bank Transfer / NEFT</option>
                    <option value="fuel_card">Commercial Fuel Card</option>
                    <option value="upi">UPI / Instant Pay</option>
                    <option value="cash">Cash Voucher</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Notes & Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Invoice number, slip notes, or maintenance reason..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    border: '1px solid #E7D7E0',
                    background: '#FFF',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    border: 'none',
                    background: 'var(--sr-primary, #C13D78)',
                    color: '#FFF',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
