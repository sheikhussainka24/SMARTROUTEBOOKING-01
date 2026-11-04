import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import {
  User,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Building2,
  FileCheck,
} from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  // Form states
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'passenger', // Default role must be passenger
    operatorCode: '',
    licenseNumber: '',
    invitationToken: '',
    agreeTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verification-pending state
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [smtpStatus, setSmtpStatus] = useState(null);

  // Driver submitted pending approval state
  const [driverSubmitted, setDriverSubmitted] = useState(false);

  // OTP form
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password rules validation
  const passwordCriteria = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    digit: /[0-9]/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);
  const isPasswordMatch = form.password && form.password === form.confirmPassword;
  const isMobileValid = String(form.mobile).replace(/\D/g, '').length === 10;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!isMobileValid) {
      setError('Please provide a valid 10-digit Indian mobile number.');
      return;
    }
    if (!isEmailValid) {
      setError('Please provide a valid email address (e.g. name@example.com).');
      return;
    }
    if (!isPasswordValid) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }
    if (!form.agreeTerms) {
      setError('You must agree to the Terms of Service & Privacy Policy to create an account.');
      return;
    }

    // Role-specific validations
    if (form.role === 'travel_owner') {
      navigate('/owner/register', {
        state: { prefill: { email: form.email, mobile: form.mobile, fullName: form.fullName } },
      });
      return;
    }

    if (form.role === 'driver') {
      if (!form.licenseNumber.trim() && !form.operatorCode.trim()) {
        setError('Commercial driving license number or operator invitation code is required for driver registration.');
        return;
      }
    }

    if (form.role === 'manager') {
      if (!form.invitationToken.trim()) {
        setError('Travel Manager registration requires an authorized operator invitation code.');
        return;
      }
    }

    setLoading(true);

    try {
      const cleanMobile = String(form.mobile).replace(/\D/g, '').slice(-10);
      const cleanEmail = form.email.trim().toLowerCase();

      const res = await api.post('/auth/register', {
        fullName: form.fullName.trim(),
        mobile: cleanMobile,
        email: cleanEmail,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        operatorCode: form.operatorCode.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || form.operatorCode.trim() || undefined,
        invitationToken: form.invitationToken.trim() || undefined,
        agreeTerms: true,
      });

      if (res.success) {
        if (form.role === 'driver') {
          setDriverSubmitted(true);
        } else {
          setRegisteredEmail(cleanEmail);
          setRegisteredMobile(cleanMobile);
          setDevOtp(res.data?.devVerificationOtp || null);
          setSmtpStatus(res.data?.emailDelivery || null);
          setVerificationPending(true);
          setResendCooldown(30);
        }
      } else {
        if (res.code === 'OPERATOR_USE_DEDICATED_PORTAL') {
          navigate('/owner/register');
          return;
        }
        if (res.code === 'INVITATION_REQUIRED') {
          setError(res.error || 'This role requires an authorized operator invitation. Contact your company operator.');
          return;
        }
        if (res.code === 'ADMIN_REGISTRATION_FORBIDDEN') {
          setError('Admin and Super Admin accounts cannot be created via public registration. Platform administrator accounts must be provisioned through secure administrative channels.');
          return;
        }
        setError(res.error || 'Registration failed. Please check inputs.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await api.post('/auth/verify-email', {
        email: registeredEmail,
        otp: otpCode.trim(),
      });

      if (res.success) {
        setOtpSuccess(true);
        setTimeout(() => {
          navigate('/login', {
            state: {
              registeredMobile,
              message: 'Email verified! Sign in using your registered mobile number.',
            },
          });
        }, 1800);
      } else {
        setOtpError(res.error || 'Verification failed. Please check the code.');
      }
    } catch (err) {
      setOtpError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await api.post('/auth/resend-verification', {
        email: registeredEmail,
      });

      if (res.success) {
        setResendCooldown(30);
        if (res.devVerificationOtp) {
          setDevOtp(res.devVerificationOtp);
        }
      } else {
        setOtpError(res.error || 'Failed to resend code.');
      }
    } catch (err) {
      setOtpError(err.message || 'Failed to resend code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Roles available for public workflows
  const PUBLIC_ROLE_OPTIONS = [
    { id: 'passenger', label: 'Passenger', desc: 'Book buses & travel', icon: '👤' },
    { id: 'driver', label: 'Driver', desc: 'Commercial license', icon: '🛞' },
    { id: 'travel_owner', label: 'Travel Owner', desc: 'Company onboarding', icon: '🏢' },
    { id: 'manager', label: 'Travel Manager', desc: 'Accept invitation', icon: '📋' },
  ];

  return (
    <div className="auth-split-layout">
      {/* Desktop Left Column Showcase */}
      <div className="auth-split-showcase">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF1F6', border: '1px solid #E7A0BF', borderRadius: 20, padding: '6px 16px', color: '#C13D78', fontSize: 12, fontWeight: 800, width: 'fit-content' }}>
          <Sparkles size={14} color="#C13D78" />
          <span>JOIN SMART ROUTE</span>
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 900, color: 'var(--sr-text-primary)', lineHeight: 1.2, margin: 0, letterSpacing: '-0.02em' }}>
          Next-Generation Intercity Bus Travel Across India
        </h2>
        <p style={{ fontSize: 15, color: 'var(--sr-text-secondary)', lineHeight: 1.6, margin: 0 }}>
          Create your account today for priority seat reservations, verified coach operators, real-time trip GPS radar updates, and instant single-page printable passes.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 12, border: '1px solid var(--sr-border-card)', boxShadow: 'var(--sr-shadow-sm)' }}>
            <div style={{ fontWeight: 800, color: 'var(--sr-primary)', fontSize: 18, marginBottom: 2 }}>Instant Booking</div>
            <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Direct seat lock &amp; instant booking confirmation</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 12, border: '1px solid var(--sr-border-card)', boxShadow: 'var(--sr-shadow-sm)' }}>
            <div style={{ fontWeight: 800, color: 'var(--sr-primary)', fontSize: 18, marginBottom: 2 }}>Zero Hassle</div>
            <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Single-page paperless or printable boarding passes</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 12, border: '1px solid var(--sr-border-card)', boxShadow: 'var(--sr-shadow-sm)' }}>
            <div style={{ fontWeight: 800, color: 'var(--sr-primary)', fontSize: 18, marginBottom: 2 }}>Safety First</div>
            <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Verified professional drivers and emergency support</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 12, border: '1px solid var(--sr-border-card)', boxShadow: 'var(--sr-shadow-sm)' }}>
            <div style={{ fontWeight: 800, color: 'var(--sr-primary)', fontSize: 18, marginBottom: 2 }}>Flexible Roles</div>
            <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Dedicated portals for passengers, drivers &amp; operators</div>
          </div>
        </div>
      </div>

      {/* Auth Card Container */}
      <div style={{ width: '100%', maxWidth: 490 }}>
        <div className="sr-card" style={{ padding: '36px 32px' }}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <BrandLogo variant="hero" showText={false} style={{ marginBottom: 14 }} />
            <h1 style={{ fontSize: 22, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>
            {verificationPending
              ? 'Verify Your Email'
              : driverSubmitted
              ? 'Driver Registration Submitted'
              : form.role === 'driver'
              ? 'Register Driver Account'
              : form.role === 'manager'
              ? 'Activate Manager Account'
              : 'Create Passenger Account'}
          </h1>
          <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginTop: 4 }}>
            {verificationPending
              ? 'Enter the 6-digit verification code to activate your account'
              : driverSubmitted
              ? 'Your license credentials are pending operator verification and approval'
              : form.role === 'driver'
              ? 'Commercial driving license and operator affiliation required'
              : form.role === 'manager'
              ? 'Redeem authorized operator invitation to activate your management portal'
              : 'Direct bus booking, live tracking, and digital passenger passes'}
          </p>
        </div>

        {/* STAGE 3: Driver Submitted / Pending Approval View */}
        {driverSubmitted ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                color: '#0369A1',
                padding: '24px 20px',
                borderRadius: 12,
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
                  background: '#E0F2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileCheck size={28} color="#0284C7" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
                Application Pending Operator Review
              </div>
              <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                Your commercial driver account has been created with status <strong>Pending Approval</strong>.
                Your fleet operator administrator must verify your driving license before operational transit access is activated.
              </p>
              <div
                style={{
                  fontSize: 12,
                  background: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid #E2E8F0',
                  color: '#64748B',
                  marginTop: 4,
                }}
              >
                You will receive an SMS and email notification once your license is approved.
              </div>
            </div>

            <Link
              to="/login"
              className="btn btn-primary"
              style={{ width: '100%', height: 46, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Return to Sign In Portal
            </Link>
          </div>
        ) : verificationPending ? (
          /* STAGE 2: Email Verification Pending Screen */
          <div>
            {otpSuccess ? (
              <div
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #6EE7B7',
                  color: '#065F46',
                  padding: 20,
                  borderRadius: 12,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <CheckCircle2 size={32} color="#059669" />
                <div style={{ fontWeight: 800, fontSize: 16 }}>Email Verified Successfully!</div>
                <div style={{ fontSize: 13, color: '#047857' }}>
                  Your account is fully activated. Redirecting you to the Passenger Sign In portal...
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Dummy read-only trap fields to absorb browser password managers */}
                <input type="text" style={{ display: 'none' }} aria-hidden="true" autoComplete="off" tabIndex={-1} readOnly />
                <input type="password" style={{ display: 'none' }} aria-hidden="true" autoComplete="new-password" tabIndex={-1} readOnly />
                <div
                  style={{
                    background: 'var(--sr-bg-canvas)',
                    border: '1px solid var(--sr-border-card)',
                    padding: '14px 16px',
                    borderRadius: 10,
                    fontSize: 13,
                    color: 'var(--sr-text-secondary)',
                  }}
                >
                  A 6-digit confirmation code was dispatched to:
                  <div style={{ fontWeight: 700, color: 'var(--sr-text-primary)', marginTop: 2 }}>{registeredEmail}</div>
                </div>

                {/* Honest SMTP Provider Status Notification */}
                {smtpStatus && !smtpStatus.sent && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#B45309',
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Notice:</strong> {smtpStatus.message}
                    <div style={{ fontSize: 11, marginTop: 4, color: '#92400E' }}>
                      To enable live email dispatch, configure <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, and <code>SMTP_PASSWORD</code> in your environment.
                    </div>
                  </div>
                )}

                {/* Development Mode Quick Code Banner */}
                {devOtp && (
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: '#4F46E5',
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={15} />
                      <span>[DEV] Verification Code: <strong>{devOtp}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtp)}
                      style={{
                        background: '#4F46E5',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Use Code
                    </button>
                  </div>
                )}

                {otpError && (
                  <div
                    style={{
                      color: '#DC2626',
                      background: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      padding: 10,
                      borderRadius: 8,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{otpError}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="otpCodeInput"
                    style={{
                      fontSize: 12,
                      color: 'var(--sr-text-secondary)',
                      marginBottom: 6,
                      display: 'block',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    id="otpCodeInput"
                    type="text"
                    className="input-field"
                    placeholder="------"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    style={{
                      textAlign: 'center',
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: '0.35em',
                      height: 50,
                    }}
                    required
                    autoComplete="one-time-code"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    aria-label="6-digit verification code"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: 46, fontSize: 14 }}
                  disabled={otpLoading || otpCode.length !== 6}
                >
                  {otpLoading ? 'Verifying...' : 'Verify Email & Activate'}
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--sr-text-secondary)',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || otpLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? '#94A3B8' : 'var(--sr-primary)',
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Verification Code'}
                  </button>

                  <Link
                    to="/login"
                    style={{
                      color: 'var(--sr-text-primary)',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Skip to Sign In &rarr;
                  </Link>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* STAGE 1: Registration Form */
          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Dummy read-only trap fields to absorb browser password managers */}
            <input type="text" style={{ display: 'none' }} aria-hidden="true" autoComplete="off" tabIndex={-1} readOnly />
            <input type="password" style={{ display: 'none' }} aria-hidden="true" autoComplete="new-password" tabIndex={-1} readOnly />
            {error && (
              <div
                style={{
                  color: '#DC2626',
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Public Role Selection */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 6, display: 'block', fontWeight: 700 }}>
                Select Your Platform Role <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 8, marginBottom: 8 }}>
                {PUBLIC_ROLE_OPTIONS.map((r) => {
                  const isSelected = form.role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setError(null);
                        setForm({ ...form, role: r.id });
                      }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 10,
                        border: isSelected ? '2px solid #C13D78' : '1.5px solid #F1EDFA',
                        background: isSelected ? '#FFF1F6' : '#FFFFFF',
                        color: isSelected ? '#24152D' : '#6E5D73',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(193, 61, 120, 0.15)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{r.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: isSelected ? 800 : 600, color: isSelected ? '#C13D78' : '#24152D' }}>
                        {r.label}
                      </span>
                      <span style={{ fontSize: 10, color: '#6E5D73' }}>{r.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Informative Platform Admin Notice (Non-interactive, never selected) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#64748B',
                  marginBottom: 10,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ fontSize: 14 }}>🛡️</span>
                <span>
                  <strong>Platform Administrator accounts:</strong> Admin and Super Admin accounts require secure offline provisioning and cannot be registered publicly.
                </span>
              </div>

              {/* Role Explanations */}
              {form.role === 'passenger' && (
                <div style={{ fontSize: 12, color: '#059669', background: '#ECFDF5', padding: '8px 12px', borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                  ✓ Instant self-registration enabled for passenger bus booking and seat reservations.
                </div>
              )}

              {form.role === 'driver' && (
                <div style={{ fontSize: 12, color: '#0284C7', background: '#F0F9FF', padding: '8px 12px', borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                  🛞 Driver accounts require operator association and commercial license verification before active driving operations are enabled.
                </div>
              )}

              {form.role === 'travel_owner' && (
                <div style={{ fontSize: 12, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '14px 14px', borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4, color: '#78350F' }}>
                    🏢 Travel Operator Company Registration Required
                  </div>
                  <div style={{ marginBottom: 10, lineHeight: 1.4 }}>
                    Travel operators must register their business details, fleet, and GST verification. Company accounts require Super Admin approval before activation.
                  </div>
                  <Link
                    to="/owner/register"
                    state={{ prefill: { email: form.email, mobile: form.mobile, fullName: form.fullName } }}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      height: 36,
                      padding: '0 14px',
                      textDecoration: 'none',
                    }}
                  >
                    Open Operator Registration Portal &rarr;
                  </Link>
                </div>
              )}

              {form.role === 'manager' && (
                <div style={{ fontSize: 12, color: '#7C3AED', background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '10px 12px', borderRadius: 6, marginBottom: 8, lineHeight: 1.4 }}>
                  📋 Travel Manager accounts require a valid single-use invitation issued by an authorized Travel Owner or administrator.
                </div>
              )}
            </div>

            {/* Travel Owner Redirect View (If Owner is selected, form inputs are replaced by portal access) */}
            {form.role === 'travel_owner' ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <p style={{ fontSize: 13, color: 'var(--sr-text-secondary)', marginBottom: 16 }}>
                  Click below to proceed to the dedicated bus operator onboarding flow.
                </p>
                <Link
                  to="/owner/register"
                  state={{ prefill: { email: form.email, mobile: form.mobile, fullName: form.fullName } }}
                  className="btn btn-primary"
                  style={{ width: '100%', height: 46, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Continue to Operator Portal &rarr;
                </Link>
              </div>
            ) : (
              <>
                {/* Manager-Specific Field: Invitation Token */}
                {form.role === 'manager' && (
                  <div>
                    <label htmlFor="invitationToken" style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Operator Invitation Code <span style={{ color: '#E11D48' }}>*</span>
                    </label>
                    <input
                      id="invitationToken"
                      type="text"
                      className="input-field"
                      placeholder="e.g. INV-MGR-..."
                      required
                      value={form.invitationToken}
                      onChange={(e) => setForm({ ...form, invitationToken: e.target.value })}
                    />
                    <span style={{ fontSize: 11, color: 'var(--sr-text-tertiary)', marginTop: 2, display: 'block' }}>
                      Issued by your company travel operator via their operator console
                    </span>
                  </div>
                )}

                {/* Driver-Specific Fields: Commercial DL & Fleet Code */}
                {form.role === 'driver' && (
                  <>
                    <div>
                      <label htmlFor="licenseNumber" style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                        Commercial Driving License (DL) Number <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <input
                        id="licenseNumber"
                        type="text"
                        className="input-field"
                        placeholder="e.g. TN38-DL-2022-0049182"
                        required
                        value={form.licenseNumber}
                        onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label htmlFor="operatorCode" style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                        Fleet / Operator Association Code <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <input
                        id="operatorCode"
                        type="text"
                        className="input-field"
                        placeholder="e.g. SMART-OP-01 or Travel Operator ID"
                        required
                        value={form.operatorCode}
                        onChange={(e) => setForm({ ...form, operatorCode: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Full Name <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Arun Prakash"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label htmlFor="mobileNumber" style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Mobile Phone Number <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div
                      style={{
                        background: 'var(--sr-bg-canvas)',
                        border: '1px solid var(--sr-border-card)',
                        borderRadius: 8,
                        padding: '0 12px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--sr-text-secondary)',
                      }}
                    >
                      +91
                    </div>
                    <input
                      id="mobileNumber"
                      type="tel"
                      className="input-field"
                      required
                      placeholder="10-digit mobile (e.g. 9876543210)"
                      maxLength={10}
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--sr-text-tertiary)', marginTop: 2, display: 'block' }}>
                    Used as your primary Sign In identifier
                  </span>
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="emailAddress" style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Email Address <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <input
                    id="emailAddress"
                    type="email"
                    className="input-field"
                    placeholder="name@example.com"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <span style={{ fontSize: 11, color: 'var(--sr-text-tertiary)', marginTop: 2, display: 'block' }}>
                    Used for ticket dispatch and email verification
                  </span>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="createPassword" style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Create Password <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="createPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      required
                      placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      style={{ paddingRight: 38 }}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--sr-text-dim)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength checklist */}
                  {form.password && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6, fontSize: 11 }}>
                      <span style={{ color: passwordCriteria.length ? '#059669' : '#94A3B8' }}>
                        {passwordCriteria.length ? '✓' : '•'} 8+ characters
                      </span>
                      <span style={{ color: passwordCriteria.upper ? '#059669' : '#94A3B8' }}>
                        {passwordCriteria.upper ? '✓' : '•'} Uppercase letter
                      </span>
                      <span style={{ color: passwordCriteria.lower ? '#059669' : '#94A3B8' }}>
                        {passwordCriteria.lower ? '✓' : '•'} Lowercase letter
                      </span>
                      <span style={{ color: passwordCriteria.digit && passwordCriteria.special ? '#059669' : '#94A3B8' }}>
                        {passwordCriteria.digit && passwordCriteria.special ? '✓' : '•'} Number &amp; Symbol
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Confirm Password <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="input-field"
                      required
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      style={{ paddingRight: 38 }}
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--sr-text-dim)',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.confirmPassword && (
                    <span
                      style={{
                        fontSize: 11,
                        color: isPasswordMatch ? '#059669' : '#DC2626',
                        marginTop: 2,
                        display: 'block',
                      }}
                    >
                      {isPasswordMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                    </span>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={form.agreeTerms}
                    onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                    style={{ marginTop: 3, cursor: 'pointer' }}
                    required
                  />
                  <label
                    htmlFor="agreeTerms"
                    style={{ fontSize: 12, color: 'var(--sr-text-secondary)', lineHeight: 1.4, cursor: 'pointer' }}
                  >
                    I agree to the SMART ROUTE{' '}
                    <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: 'var(--sr-primary)', fontWeight: 600 }}>
                      Terms of Service
                    </a>
                    , Privacy Policy, and Ticketing Guidelines.
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: 46, marginTop: 8, fontSize: 14 }}
                  disabled={loading || !form.agreeTerms}
                >
                  {loading
                    ? 'Processing...'
                    : form.role === 'driver'
                    ? 'Submit Driver Registration'
                    : form.role === 'manager'
                    ? 'Activate Manager Account'
                    : 'Complete Registration'}
                </button>
              </>
            )}
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--sr-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--sr-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Sign In with Mobile
          </Link>
        </div>
      </div>
    </div>
  </div>
);
}
