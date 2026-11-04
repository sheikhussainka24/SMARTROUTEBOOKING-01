import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import { Building2, Globe, FileText, Phone, Mail, User, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function OwnerRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthSession } = useAuth();
  const prefill = location.state?.prefill || {};

  const [form, setForm] = useState({
    // Operator Admin Account
    fullName: prefill.fullName || '',
    email: prefill.email || '',
    mobile: prefill.mobile || '',
    password: '',
    confirmPassword: '',

    // Travel Company Details
    companyName: '',
    businessName: '',
    gstNumber: '',
    contactEmail: prefill.email || '',
    contactMobile: prefill.mobile || '',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641018',
    businessAddress: '',
    website: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!form.companyName.trim()) {
      setError('Company / Operator brand name is required.');
      return;
    }
    if (!form.fullName.trim()) {
      setError('Operator administrator name is required.');
      return;
    }
    const cleanMobile = String(form.mobile).replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/operator/register', {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: cleanMobile,
        password: form.password,
        companyName: form.companyName.trim(),
        businessName: form.businessName.trim() || form.companyName.trim(),
        gstNumber: form.gstNumber.trim() || undefined,
        contactEmail: form.contactEmail.trim().toLowerCase() || form.email.trim().toLowerCase(),
        contactMobile: form.contactMobile ? String(form.contactMobile).replace(/\D/g, '').slice(-10) : cleanMobile,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        businessAddress: form.businessAddress.trim() || undefined,
        website: form.website.trim() || undefined,
      });

      if (res.success) {
        const token = res.accessToken || res.tokens?.accessToken || res.data?.accessToken || res.data?.tokens?.accessToken;
        const refToken = res.refreshToken || res.tokens?.refreshToken || res.data?.refreshToken || res.data?.tokens?.refreshToken;
        const userData = res.user || res.data?.user;

        if (token && userData && typeof setAuthSession === 'function') {
          setAuthSession(userData, token, refToken);
          navigate('/operator/dashboard', {
            replace: true,
            state: {
              welcomeMessage: `Welcome to SMART ROUTE! Your company account "${form.companyName.trim()}" is now registered.`,
              isNewRegistration: true,
            },
          });
          return;
        }

        setSuccessData(res.data);
      } else {
        setError(res.error || 'Failed to submit registration. Please verify your information.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--sr-text-secondary)', fontSize: 13, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to passenger registration
        </Link>
      </div>

      <div className="sr-card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <BrandLogo variant="hero" showText={false} style={{ marginBottom: 16, display: 'inline-block' }} />
          <h1 style={{ fontSize: 24, color: 'var(--sr-text-primary)', margin: '0 0 8px', fontWeight: 800 }}>
            Bus Operator & Fleet Registration
          </h1>
          <p style={{ color: 'var(--sr-text-secondary)', fontSize: 14, margin: 0 }}>
            Register your travel company to manage fleet buses, routes, schedules, drivers, and bookings on SMART ROUTE.
          </p>
        </div>

        {successData ? (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: 14,
            border: '1px solid #10b981',
            padding: 28,
            textAlign: 'center',
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <CheckCircle2 size={32} color="#10b981" />
            </div>
            <h3 style={{ color: '#10b981', margin: '0 0 10px', fontSize: 20, fontWeight: 700 }}>
              Company Account Created Successfully
            </h3>
            <p style={{ color: 'var(--sr-text-primary)', fontSize: 14, margin: '0 0 12px', fontWeight: 600 }}>
              {successData.company?.name || form.companyName}
            </p>
            <div style={{
              display: 'inline-block',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              Verification Status: {successData.company?.verification_status === 'approved' ? 'Active' : 'Pending Admin Review'}
            </div>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 24px' }}>
              Your operator administrator account is registered under <strong>{form.email}</strong>.
              You can now sign in using your credentials to manage your fleet, schedules, and operations desk.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(successData.accessToken || successData.tokens?.accessToken) && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const token = successData.accessToken || successData.tokens?.accessToken;
                    const refToken = successData.refreshToken || successData.tokens?.refreshToken;
                    const userData = successData.user;
                    if (typeof setAuthSession === 'function' && token && userData) {
                      setAuthSession(userData, token, refToken);
                    }
                    navigate('/operator/dashboard', { replace: true });
                  }}
                  style={{ height: 44, padding: '0 24px' }}
                >
                  Launch Operator Console
                </button>
              )}
              <button
                type="button"
                className={(successData.accessToken || successData.tokens?.accessToken) ? "btn btn-secondary" : "btn btn-primary"}
                onClick={() => navigate('/login', {
                  state: {
                    email: form.email,
                    registeredMobile: form.mobile,
                    message: 'Account registered successfully. Enter your password to sign in.'
                  }
                })}
                style={{ height: 44, padding: '0 24px' }}
              >
                Sign In to Operator Console
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Dummy read-only trap fields to absorb browser password managers */}
            <input type="text" style={{ display: 'none' }} aria-hidden="true" autoComplete="off" tabIndex={-1} readOnly />
            <input type="password" style={{ display: 'none' }} aria-hidden="true" autoComplete="new-password" tabIndex={-1} readOnly />
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '12px 16px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#ef4444',
                fontSize: 13,
              }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Travel Company Information */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: '1px solid var(--sr-border-card)',
              }}>
                <Building2 size={18} color="var(--sr-primary)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--sr-text-primary)', margin: 0 }}>
                  1. Company & Fleet Details
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Travel / Brand Name *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      placeholder="e.g. Royal Express Travels"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Registered Business Entity
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Royal Express Mobility Pvt Ltd"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      GSTIN Identification
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 33AABCS8891M1ZT"
                      value={form.gstNumber}
                      onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Official Website (Optional)
                    </label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://royalexpress.in"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Headquarters City *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      placeholder="e.g. Coimbatore"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      State *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      placeholder="e.g. Tamil Nadu"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Pincode
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 641018"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Depot / Office Address
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 142 Avinashi Road, Omni Bus Stand Complex"
                    value={form.businessAddress}
                    onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Operator Admin Account */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: '1px solid var(--sr-border-card)',
              }}>
                <User size={18} color="var(--sr-primary)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--sr-text-primary)', margin: 0 }}>
                  2. Operator Administrator Account
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Administrator Full Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Administrator Work Email *
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      required
                      placeholder="operator@company.in"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Administrator Mobile *
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      required
                      placeholder="10-digit mobile number"
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Password (min 8 characters) *
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      required
                      placeholder="Secure operator password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      required
                      placeholder="Re-type password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: 48, marginTop: 8, fontSize: 15, fontWeight: 700 }}
              disabled={loading}
            >
              {loading ? 'Registering Operator Company...' : 'Register Travel Company & Administrator'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--sr-text-secondary)' }}>
              Already registered your travel company?{' '}
              <Link to="/login" style={{ color: 'var(--sr-primary)', fontWeight: 600 }}>
                Sign in to Operator Console
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
