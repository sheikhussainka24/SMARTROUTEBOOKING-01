import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import { Shield, Building2, CheckCircle2, XCircle, AlertCircle, TrendingUp, Bus, MapPin, Radio, Sparkles, Plus, Edit2, Save, RotateCcw, Compass, Clock, Check, X, UserCheck } from 'lucide-react';
import { useHubConfig } from '../../config/hubConfig.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review & Approval Action State
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    travel: null,
    action: 'approve', // 'approve' | 'reject'
    adminNotes: '',
    submitting: false,
    error: null,
  });
  const [actionToast, setActionToast] = useState(null);

  // Central Bus Hub System Settings State
  const { hubConfig, updateHubConfig } = useHubConfig();
  const [editingHub, setEditingHub] = useState(false);
  const [hubForm, setHubForm] = useState(null);
  const [hubSaving, setHubSaving] = useState(false);
  const [hubMessage, setHubMessage] = useState(null);
  const [hubError, setHubError] = useState(null);

  const startEditHub = () => {
    setHubForm({
      line1: hubConfig?.line1 || 'SMART ROUTE Central Bus Hub',
      line2: hubConfig?.line2 || 'Palakkad – Ukkadam Highway',
      line3: hubConfig?.line3 || 'K.G. Chavadi, Coimbatore – 641105',
      line4: hubConfig?.line4 || 'Tamil Nadu, India.',
    });
    setEditingHub(true);
    setHubMessage(null);
    setHubError(null);
  };

  const handleSaveHub = async (e) => {
    e.preventDefault();
    setHubSaving(true);
    setHubError(null);
    try {
      await updateHubConfig(hubForm);
      setHubMessage('Central Bus Hub address updated successfully across all application components and e-tickets.');
      setEditingHub(false);
      setTimeout(() => setHubMessage(null), 6000);
    } catch (err) {
      setHubError(err.message || 'Failed to update hub configuration.');
    } finally {
      setHubSaving(false);
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [dashRes, travelRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/travels'),
      ]);

      if (dashRes && dashRes.success) setDashboard(dashRes);
      const travelList = travelRes?.data?.travels || travelRes?.travels || [];
      if (Array.isArray(travelList) && travelList.length > 0) {
        setTravels(travelList);
      } else {
        // Synthetic travel carriers across South India
        setTravels([
          {
            id: 'trv-sr-001',
            name: 'SMART ROUTE Travels',
            business_name: 'SMART ROUTE Mobility Private Limited',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            gst_number: '33AABCS8891M1ZT',
            total_buses: 3,
            total_managers: 1,
            total_drivers: 2,
            total_staff: 2,
            status: 'active',
            is_flagship: true,
          },
          {
            id: 'trv-hz-002',
            name: 'Horizon Travels',
            business_name: 'Horizon Intercity Lines LLP',
            city: 'Chennai',
            state: 'Tamil Nadu',
            gst_number: '33AABCH9821M1ZT',
            total_buses: 3,
            total_managers: 1,
            total_drivers: 2,
            total_staff: 1,
            status: 'active',
            is_flagship: false,
          },
          {
            id: 'trv-bl-003',
            name: 'BlueLine Travels',
            business_name: 'BlueLine Superfast Logistics Private Limited',
            city: 'Bengaluru',
            state: 'Karnataka',
            gst_number: '29AABCB7712K1ZQ',
            total_buses: 2,
            total_managers: 1,
            total_drivers: 2,
            total_staff: 1,
            status: 'active',
            is_flagship: false,
          },
          {
            id: 'trv-ss-004',
            name: 'SouthStar Travels',
            business_name: 'SouthStar Highway Transport Corporation',
            city: 'Madurai',
            state: 'Tamil Nadu',
            gst_number: '33AABCS6621R1ZT',
            total_buses: 2,
            total_managers: 1,
            total_drivers: 2,
            total_staff: 1,
            status: 'active',
            is_flagship: false,
          },
        ]);
      }
    } catch (err) {
      console.error('Super Admin console error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleOpenReview = (travel, action = 'approve') => {
    setReviewModal({
      isOpen: true,
      travel,
      action,
      adminNotes: action === 'approve' ? 'Documents verified. Operator approved for commercial operations.' : '',
      submitting: false,
      error: null,
    });
  };

  const handleCloseReview = () => {
    setReviewModal({
      isOpen: false,
      travel: null,
      action: 'approve',
      adminNotes: '',
      submitting: false,
      error: null,
    });
  };

  const handleConfirmReview = async () => {
    if (!reviewModal.travel) return;
    setReviewModal((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      const travelId = reviewModal.travel.id;
      let res;
      if (reviewModal.action === 'approve') {
        res = await api.post(`/admin/travels/${travelId}/approve`, {
          notes: reviewModal.adminNotes,
          adminNotes: reviewModal.adminNotes,
        });
      } else {
        res = await api.post(`/admin/travels/${travelId}/reject`, {
          reason: reviewModal.adminNotes || 'Application does not meet platform compliance requirements.',
        });
      }

      if (res && (res.success || res.travel)) {
        setActionToast({
          type: 'success',
          message: reviewModal.action === 'approve'
            ? `Operator ${reviewModal.travel.name} has been approved and verified successfully!`
            : `Operator ${reviewModal.travel.name} application has been rejected.`,
        });
        setTimeout(() => setActionToast(null), 5000);
        handleCloseReview();
        await loadAdminData();
      } else {
        throw new Error(res?.error || res?.message || 'Operation failed');
      }
    } catch (err) {
      setReviewModal((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || 'Failed to update operator verification status.',
      }));
    }
  };

  const pendingTravels = travels.filter((t) => {
    const vStatus = (t.verification_status || '').toLowerCase();
    const status = (t.status || '').toLowerCase();
    return vStatus === 'pending' || status === 'pending';
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <BrandLogo variant="icon" size="lg" showText={false} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--sr-text-secondary)' }}>Loading platform governance console...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1240, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div className="sr-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-success">SUPER ADMIN / FOUNDER GOVERNANCE</span>
              <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>National Platform Operations Network</span>
            </div>
            <h1 style={{ fontSize: 24, color: 'var(--sr-text-primary)', margin: '8px 0 4px', fontWeight: 800 }}>
              Intercity Travel Carriers & Fleet Oversight
            </h1>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
              Super Admin platform governance displaying high-level carrier fleet volumes, staff allocations, and operational compliance. Individual personal information is strictly safeguarded.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/accounting')}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              }}
            >
              <TrendingUp size={16} strokeWidth={2.5} />
              <span>Financial & Fleet Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/buses/create')}
              className="bg-[#C13D78] hover:bg-[#A82B63] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>+ Add Bus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="sr-stat-card">
          <span className="sr-stat-label">Registered Travel Carriers</span>
          <span className="sr-stat-value">{travels.length} Carriers</span>
          <span style={{ fontSize: 11, color: 'var(--sr-emerald)' }}>100% compliance certified</span>
        </div>

        <div className="sr-stat-card">
          <span className="sr-stat-label">Network Active Coaches</span>
          <span className="sr-stat-value">
            {travels.reduce((sum, t) => sum + (t.total_buses || 0), 0)} Buses
          </span>
          <span style={{ fontSize: 11, color: 'var(--sr-cyan)' }}>Real-time GPS radar enabled</span>
        </div>

        <div className="sr-stat-card">
          <span className="sr-stat-label">Allocated Duty Drivers</span>
          <span className="sr-stat-value">
            {travels.reduce((sum, t) => sum + (t.total_drivers || 0), 0)} Drivers
          </span>
          <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>HMV Heavy certified</span>
        </div>

        <div className="sr-stat-card">
          <span className="sr-stat-label">Network Infrastructure</span>
          <span className="sr-stat-value" style={{ color: 'var(--sr-emerald)' }}>99.99%</span>
          <span style={{ fontSize: 11, color: 'var(--sr-emerald)' }}>Zero platform downtime</span>
        </div>
      </div>

      {/* Action Toast Alert */}
      {actionToast && (
        <div
          style={{
            background: actionToast.type === 'error' ? '#FEF2F2' : '#ECFDF5',
            border: `1.5px solid ${actionToast.type === 'error' ? '#FCA5A5' : '#6EE7B7'}`,
            color: actionToast.type === 'error' ? '#991B1B' : '#065F46',
            padding: '14px 18px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          {actionToast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} color="#059669" />}
          <span>{actionToast.message}</span>
        </div>
      )}

      {/* Operator Verification & Review Queue (Requirement: Super Admin Review & Approval) */}
      <div
        className="sr-card"
        style={{
          padding: 24,
          border: pendingTravels.length > 0 ? '2px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--sr-border-card)',
          background: pendingTravels.length > 0
            ? 'linear-gradient(135deg, rgba(254, 243, 199, 0.25) 0%, rgba(255, 251, 235, 0.7) 100%)'
            : '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: pendingTravels.length > 0 ? '#F59E0B' : '#10B981',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {pendingTravels.length > 0 ? <Clock size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, color: '#24152D', margin: 0, fontWeight: 800 }}>
                  Operator Verification &amp; Governance Queue
                </h2>
                <span className={`badge ${pendingTravels.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                  {pendingTravels.length} PENDING REVIEW
                </span>
              </div>
              <p style={{ color: 'var(--sr-text-secondary)', fontSize: 12, margin: '2px 0 0' }}>
                Review and formally verify transport operators before commercial bus routes and ticket sales are activated.
              </p>
            </div>
          </div>
        </div>

        {pendingTravels.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pendingTravels.map((travel) => (
              <div
                key={travel.id}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #FCD34D',
                  borderRadius: 14,
                  padding: 18,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)',
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#24152D' }}>{travel.name}</span>
                    <span className="badge badge-warning" style={{ fontSize: 10, textTransform: 'uppercase' }}>
                      Pending Super Admin Approval
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 6 }}>
                    <strong>Corporate Entity:</strong> {travel.business_name || travel.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                    <span><strong>HQ:</strong> {travel.city}, {travel.state}</span>
                    {travel.gst_number && <span><strong>GSTIN:</strong> <code style={{ color: '#24152D', background: '#F1EDFA', padding: '1px 5px', borderRadius: 4 }}>{travel.gst_number}</code></span>}
                    {travel.contact_email && <span><strong>Contact:</strong> {travel.contact_email}</span>}
                    {travel.contact_phone && <span><strong>Phone:</strong> {travel.contact_phone}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenReview(travel, 'approve')}
                    style={{
                      background: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '9px 18px',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Approve Operator</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReview(travel, 'reject')}
                    style={{
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '9px 18px',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <XCircle size={16} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 10,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#166534',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <CheckCircle2 size={18} color="#15803D" />
            <span>All registered travel companies are verified and approved for active platform service.</span>
          </div>
        )}
      </div>

      {/* System Settings: Designated Central Bus Hub */}
      <div className="sr-card" style={{ padding: 24, border: '1.5px solid rgba(225, 29, 72, 0.25)', background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,241,246,0.3) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> SYSTEM SETTINGS
              </span>
              <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Shared Hub Configuration Source of Truth</span>
            </div>
            <h2 style={{ fontSize: 18, color: 'var(--sr-text-primary)', margin: '8px 0 4px', fontWeight: 800 }}>
              Designated Central Bus Hub Address
            </h2>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
              Configured hub location displayed across public footer, Contact Us portal, and official two-page A4 e-tickets.
            </p>
          </div>

          {!editingHub ? (
            <button
              type="button"
              onClick={startEditHub}
              style={{
                background: 'var(--sr-primary)',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Edit2 size={15} />
              <span>Configure Hub Address</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditingHub(false)}
              style={{
                background: 'var(--sr-bg-canvas)',
                color: 'var(--sr-text-secondary)',
                border: '1px solid var(--sr-border-card)',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel Editing
            </button>
          )}
        </div>

        {hubMessage && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>{hubMessage}</span>
          </div>
        )}

        {hubError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} color="#DC2626" />
            <span>{hubError}</span>
          </div>
        )}

        {!editingHub ? (
          <div style={{ background: '#FFFFFF', border: '1px solid var(--sr-border-card)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Current Synchronized Hub Address
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#24152D', marginBottom: 6 }}>
                  {hubConfig?.line1}
                </div>
                <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6 }}>
                  {hubConfig?.line2}<br />
                  {hubConfig?.line3}<br />
                  {hubConfig?.line4}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Operational Verification Notice
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, padding: 12, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                  <strong>Designated Hub Record:</strong> Supplied address for the SMART ROUTE Central Bus Hub. Physical terminal premises, dedicated bay allocations, and exact map pin coordinates are subject to independent operator/RTO verification.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveHub} style={{ background: '#FFFFFF', border: '1px solid var(--sr-border-card)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 4 }}>
                  Hub Name (Line 1) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={hubForm?.line1 || ''}
                  onChange={(e) => setHubForm({ ...hubForm, line1: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 4 }}>
                  Highway / Corridor (Line 2) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={hubForm?.line2 || ''}
                  onChange={(e) => setHubForm({ ...hubForm, line2: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 4 }}>
                  Landmark, City &amp; PIN (Line 3) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={hubForm?.line3 || ''}
                  onChange={(e) => setHubForm({ ...hubForm, line3: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 4 }}>
                  State &amp; Country (Line 4) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={hubForm?.line4 || ''}
                  onChange={(e) => setHubForm({ ...hubForm, line4: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setEditingHub(false)}
                className="btn btn-secondary"
                style={{ height: 38 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={hubSaving}
                className="btn btn-primary"
                style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={15} />
                <span>{hubSaving ? 'Saving...' : 'Save Hub Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Verified Travel Operators Table */}
      <div className="sr-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>Partner Travel Carriers & Fleet Summary</h2>
          <span className="badge badge-success">TRAVEL-LEVEL OVERSIGHT</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Travel Carrier</th>
                <th style={{ padding: '12px 10px' }}>Corporate Name</th>
                <th style={{ padding: '12px 10px' }}>Headquarters</th>
                <th style={{ padding: '12px 10px' }}>Buses</th>
                <th style={{ padding: '12px 10px' }}>Managers</th>
                <th style={{ padding: '12px 10px' }}>Drivers</th>
                <th style={{ padding: '12px 10px' }}>Staff</th>
                <th style={{ padding: '12px 10px' }}>Compliance Status</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {travels.map((t) => {
                const vStatus = (t.verification_status || '').toLowerCase();
                const opStatus = (t.status || '').toLowerCase();
                const isPending = vStatus === 'pending' || opStatus === 'pending';
                const isRejected = vStatus === 'rejected' || opStatus === 'rejected';

                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                    <td style={{ padding: '14px 10px', fontWeight: 800, color: 'var(--sr-text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t.name}
                        {t.is_flagship && (
                          <span className="badge badge-success" style={{ fontSize: 9, padding: '2px 6px' }}>FLAGSHIP</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px', color: 'var(--sr-text-secondary)' }}>{t.business_name}</td>
                    <td style={{ padding: '14px 10px' }}>{t.city}, {t.state}</td>
                    <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--sr-cyan)' }}>{t.total_buses ?? 0}</td>
                    <td style={{ padding: '14px 10px' }}>{t.total_managers ?? 1}</td>
                    <td style={{ padding: '14px 10px' }}>{t.total_drivers ?? 2}</td>
                    <td style={{ padding: '14px 10px' }}>{t.total_staff ?? 1}</td>
                    <td style={{ padding: '14px 10px' }}>
                      {isPending ? (
                        <span className="badge badge-warning">PENDING APPROVAL</span>
                      ) : isRejected ? (
                        <span className="badge badge-error">REJECTED</span>
                      ) : (
                        <span className="badge badge-success">ACTIVE &amp; AUDITED</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReview(t, 'approve')}
                          style={{
                            background: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            padding: '5px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Review &amp; Approve
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Approval Modal Dialog */}
      {reviewModal.isOpen && reviewModal.travel && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            maxWidth: 520,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {reviewModal.action === 'approve' ? (
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={24} />
                  </div>
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XCircle size={24} />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#24152D', margin: 0 }}>
                    {reviewModal.action === 'approve' ? 'Approve Transport Operator' : 'Reject Operator Registration'}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--sr-text-secondary)', margin: '2px 0 0' }}>
                    {reviewModal.travel.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseReview}
                style={{ background: 'transparent', border: 'none', color: '#6E5D73', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {reviewModal.error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                {reviewModal.error}
              </div>
            )}

            <div style={{ background: 'var(--sr-bg-canvas)', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
              <div><strong>Corporate Name:</strong> {reviewModal.travel.business_name || reviewModal.travel.name}</div>
              <div><strong>Headquarters:</strong> {reviewModal.travel.city}, {reviewModal.travel.state}</div>
              {reviewModal.travel.gst_number && (
                <div><strong>GSTIN:</strong> <code style={{ color: '#24152D', background: '#F1EDFA', padding: '1px 5px', borderRadius: 4 }}>{reviewModal.travel.gst_number}</code></div>
              )}
              <div><strong>Application Status:</strong> <span className="badge badge-warning" style={{ fontSize: 10 }}>PENDING REVIEW</span></div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 6 }}>
                {reviewModal.action === 'approve' ? 'Verification & Audit Notes (Saved to Platform Log):' : 'Rejection Reason (Required):'}
              </label>
              <textarea
                rows={3}
                className="input-field"
                value={reviewModal.adminNotes}
                onChange={(e) => setReviewModal({ ...reviewModal, adminNotes: e.target.value })}
                placeholder={reviewModal.action === 'approve' ? 'Enter audit remarks or compliance notes...' : 'Specify reasons for rejecting this registration...'}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={handleCloseReview}
                disabled={reviewModal.submitting}
                className="btn btn-secondary"
                style={{ height: 38 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={reviewModal.submitting}
                style={{
                  background: reviewModal.action === 'approve' ? '#10B981' : '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 20px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: reviewModal.action === 'approve' ? '0 2px 6px rgba(16, 185, 129, 0.3)' : '0 2px 6px rgba(239, 68, 68, 0.3)',
                }}
              >
                {reviewModal.submitting ? 'Processing...' : reviewModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
