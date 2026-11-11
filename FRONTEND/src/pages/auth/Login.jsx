import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import PasswordStrengthMeter from '../../components/security/PasswordStrengthMeter.jsx';
import { getSafeErrorMessage } from '../../utils/securityUtils.js';
import {
  Lock,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';

import { getRoleRedirect } from '../../utils/roleRoutes.js';
export { getRoleRedirect };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyLoginOtp, isAuthenticated, user, setAuthSession } = useAuth();

  // Step state: 1 = Credentials (Phone/Email + Password), 2 = OTP Verification
  const [step, setStep] = useState(1);

  // Step 1 Form fields: Unified Credential (Mobile or Email) + Password
  const [credential, setCredential] = useState(() => {
    return location.state?.email || location.state?.registeredEmail || location.state?.registeredMobile || location.state?.mobile || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 Form fields: OTP
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [maskedMobile, setMaskedMobile] = useState('');
  const [targetMobile, setTargetMobile] = useState('');
  const [smsStatus, setSmsStatus] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & notifications
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(location.state?.message || null);

  // Forgot Password Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotDevOtp, setForgotDevOtp] = useState(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  const forgotPasswordCriteria = {
    length: forgotNewPassword.length >= 8,
    upper: /[A-Z]/.test(forgotNewPassword),
    lower: /[a-z]/.test(forgotNewPassword),
    digit: /[0-9]/.test(forgotNewPassword),
    special: /[!@#$%^&*(),.?":{}|<>_~`\-+=\[\]\\\/]/.test(forgotNewPassword),
  };
  const isForgotNewPasswordValid = Object.values(forgotPasswordCriteria).every(Boolean);

  const handleRequestForgotOtp = async (e) => {
    e?.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered mobile number or email address');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      const res = await api.post('/auth/forgot-password', { identifier: forgotIdentifier.trim() });
      if (res.data?.success) {
        setForgotStep(2);
        setForgotSuccess(res.data.message || 'Reset code sent to your contact.');
        if (res.data.devOtp) {
          setForgotDevOtp(res.data.devOtp);
        }
      } else {
        setForgotError(res.data?.error || 'Failed to request reset code');
      }
    } catch (err) {
      setForgotError(getSafeErrorMessage(err, 'forgot_password'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e?.preventDefault();
    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotError('Please enter a valid 6-digit reset code');
      return;
    }
    if (!isForgotNewPasswordValid) {
      setForgotError('Password does not meet the security criteria');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await api.post('/auth/reset-password', {
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
        confirmPassword: forgotConfirmPassword,
      });
      if (res.data?.success) {
        setForgotSuccess('Password reset successfully! You can now sign in with your new password.');
        setPassword(forgotNewPassword);
        setCredential(forgotIdentifier.trim());
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotStep(1);
          setForgotOtp('');
          setForgotNewPassword('');
          setForgotConfirmPassword('');
          setForgotDevOtp(null);
          setForgotSuccess(null);
        }, 1800);
      } else {
        setForgotError(res.data?.error || 'Failed to reset password');
      }
    } catch (err) {
      setForgotError(getSafeErrorMessage(err, 'general'));
    } finally {
      setForgotLoading(false);
    }
  };

  // Auto-fill from registration redirect
  useEffect(() => {
    const prefill = location.state?.email || location.state?.registeredEmail || location.state?.registeredMobile || location.state?.mobile;
    if (prefill) {
      setCredential(prefill);
      setPassword('');
    }
  }, [location.state]);

  const getDestination = (role) => {
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect') || location.state?.redirect;
    if (redirectParam && (role === 'passenger' || !role)) {
      try {
        return decodeURIComponent(redirectParam);
      } catch {
        return redirectParam;
      }
    }
    return getRoleRedirect(role);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDestination(user.role || 'passenger'), { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.search]);

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

  // Step 1: Submit Credentials (Phone/Email + Password)
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanInput = credential.trim();
    if (!cleanInput) {
      setError('Please enter your mobile phone number or email address.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        identifier: cleanInput,
        password,
      });

      if (res.requireOtp) {
        setStep(2);
        setMaskedMobile(res.maskedMobile || res.mobile);
        setTargetMobile(res.mobile || cleanInput);
        setDevOtp(res.devOtp || null);
        setSmsStatus(res.smsDelivery || null);
        setResendCooldown(30);
        setOtp('');
      } else if (res.success && (res.accessToken || res.tokens?.accessToken || res.data?.accessToken || res.data?.tokens?.accessToken)) {
        // Operational role (Driver, Owner, Manager, Admin) authenticated directly
        const token = res.accessToken || res.tokens?.accessToken || res.data?.accessToken || res.data?.tokens?.accessToken;
        const refToken = res.refreshToken || res.tokens?.refreshToken || res.data?.refreshToken || res.data?.tokens?.refreshToken;
        const userData = res.user || res.data?.user;

        if (token && userData) {
          if (typeof setAuthSession === 'function') {
            setAuthSession(userData, token, refToken);
          } else {
            localStorage.setItem('smartroute_token', token);
            localStorage.setItem('sr_access_token', token);
            if (refToken) {
              localStorage.setItem('smartroute_refresh_token', refToken);
              localStorage.setItem('sr_refresh_token', refToken);
            }
            localStorage.setItem('smartroute_user', JSON.stringify(userData));
            localStorage.setItem('sr_user', JSON.stringify(userData));
          }
        }

        const role = userData?.role || 'passenger';
        navigate(getDestination(role), { replace: true });
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError(getSafeErrorMessage(err, 'login'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit 6-digit OTP
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mobileToVerify = targetMobile || credential.replace(/\D/g, '').slice(-10);
      const verifiedUser = await verifyLoginOtp(mobileToVerify, otp.trim());
      navigate(getDestination(verifiedUser.role || 'passenger'), { replace: true });
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);

    try {
      const mobileToResend = targetMobile || credential.replace(/\D/g, '').slice(-10);
      const res = await api.post('/auth/login/resend-otp', {
        mobile: mobileToResend,
      });

      if (res.success) {
        setResendCooldown(30);
        if (res.devOtp) {
          setDevOtp(res.devOtp);
        }
        setInfoMessage('A new verification code has been dispatched.');
      } else {
        setError(res.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Desktop Left Column Showcase */}
      <div className="auth-split-showcase">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FFF1F6', border: '1px solid #E7A0BF', borderRadius: 20, padding: '6px 16px', color: '#C13D78', fontSize: 12, fontWeight: 800, width: 'fit-content' }}>
          <Sparkles size={14} color="#C13D78" />
          <span>OFFICIAL SMART ROUTE PORTAL</span>
        </div>
        <h2 style={{ fontSize: 36, fontWeight: 900, color: 'var(--sr-text-primary)', lineHeight: 1.2, margin: 0, letterSpacing: '-0.02em' }}>
          Seamless Intercity Bus Booking &amp; Live Journey Tracking
        </h2>
        <p style={{ fontSize: 15, color: 'var(--sr-text-secondary)', lineHeight: 1.6, margin: 0 }}>
          Join thousands of travelers enjoying real-time seat availability, guaranteed digital passes, live GPS radar telemetry, and verified luxury bus operators across India.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 12, border: '1px solid var(--sr-border-card)', boxShadow: 'var(--sr-shadow-sm)' }}>
            <div style={{ fontWeight: 800, color: 'var(--sr-primary)', fontSize: 18, marginBottom: 2 }}>100% Verified</div>
            <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Licensed commercial operators and verified bus fleets</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 12, border: '1px solid var(--sr-border-card)', boxShadow: 'var(--sr-shadow-sm)' }}>
            <div style={{ fontWeight: 800, color: 'var(--sr-primary)', fontSize: 18, marginBottom: 2 }}>Single-Page Pass</div>
            <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Printable instant A4 digital boarding pass</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 12, border: '1px solid var(--sr-border-card)', boxShadow: 'var(--sr-shadow-sm)' }}>
            <div style={{ fontWeight: 800, color: 'var(--sr-primary)', fontSize: 18, marginBottom: 2 }}>Live GPS Radar</div>
            <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Real-time location, ETA, and speed telemetry</div>
          </div>
          <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: 12, border: '1px solid var(--sr-border-card)', boxShadow: 'var(--sr-shadow-sm)' }}>
            <div style={{ fontWeight: 800, color: 'var(--sr-primary)', fontSize: 18, marginBottom: 2 }}>24x7 Assistance</div>
            <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Dedicated passenger support and quick query resolution</div>
          </div>
        </div>
      </div>

      {/* Auth Card Container */}
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div className="sr-card" style={{ padding: '36px 32px' }}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <BrandLogo variant="hero" showText={false} style={{ marginBottom: 16 }} />
            <h1 style={{ fontSize: 22, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>
            {step === 1 ? 'Sign In to SMART ROUTE' : 'Two-Step Verification'}
          </h1>
          <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginTop: 6, marginBottom: 10 }}>
            {step === 1
              ? 'Enter your registered phone number or email address and password'
              : 'Enter the 6-digit OTP code sent to your registered phone'}
          </p>
        </div>

        {/* Step Progress Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 12,
              background: step === 1 ? 'var(--sr-primary)' : 'rgba(225, 29, 72, 0.12)',
              color: step === 1 ? '#FFFFFF' : 'var(--sr-primary)',
            }}
          >
            1. Credentials
          </div>
          <ArrowRight size={14} color="#94A3B8" />
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 12,
              background: step === 2 ? 'var(--sr-primary)' : 'var(--sr-bg-canvas)',
              color: step === 2 ? '#FFFFFF' : 'var(--sr-text-secondary)',
              border: step === 2 ? 'none' : '1px solid var(--sr-border-card)',
            }}
          >
            2. Verification
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              color: '#DC2626',
              fontSize: 13,
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Info Notification */}
        {infoMessage && (
          <div
            style={{
              color: '#065F46',
              fontSize: 13,
              background: '#ECFDF5',
              border: '1px solid #6EE7B7',
              padding: '10px 14px',
              borderRadius: 10,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} color="#059669" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1 FORM: Phone Number / Email + Password */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Dummy read-only trap fields to absorb browser password managers */}
            <input type="text" style={{ display: 'none' }} aria-hidden="true" autoComplete="off" tabIndex={-1} readOnly />
            <input type="password" style={{ display: 'none' }} aria-hidden="true" autoComplete="new-password" tabIndex={-1} readOnly />

            <div>
              <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 6, display: 'block', fontWeight: 600 }}>
                Mobile Number or Email Address <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter 10-digit mobile number or email"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--sr-text-tertiary)', marginTop: 2, display: 'block' }}>
                Unified sign-in: System automatically identifies your verified role.
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', fontWeight: 600 }}>
                  Password <span style={{ color: '#E11D48' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(credential);
                    setShowForgotPassword(true);
                    setForgotError(null);
                    setForgotSuccess(null);
                    setForgotStep(1);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--sr-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: 40 }}
                  required
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
                    right: 12,
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
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: 46, marginTop: 4, fontSize: 14 }}
              disabled={loading}
            >
              {loading ? 'Verifying Credentials...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* STEP 2 FORM: 6-Digit OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Dummy read-only trap fields to absorb browser password managers */}
            <input type="text" style={{ display: 'none' }} aria-hidden="true" autoComplete="off" tabIndex={-1} readOnly />
            <input type="password" style={{ display: 'none' }} aria-hidden="true" autoComplete="new-password" tabIndex={-1} readOnly />

            <div
              style={{
                background: 'var(--sr-bg-canvas)',
                border: '1px solid var(--sr-border-card)',
                padding: '12px 16px',
                borderRadius: 10,
                fontSize: 13,
                color: 'var(--sr-text-secondary)',
              }}
            >
              Credentials verified! Verification OTP dispatched to:
              <div style={{ fontWeight: 700, color: 'var(--sr-text-primary)', marginTop: 2 }}>
                +91 {maskedMobile}
              </div>
            </div>

            {/* Honest SMS Gateway Notification */}
            {smsStatus && !smsStatus.sent && (
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
                <strong>Notice:</strong> {smsStatus.message}
              </div>
            )}

            {/* Development OTP Quick-Fill Badge */}
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
                  onClick={() => setOtp(devOtp)}
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

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'var(--sr-text-secondary)',
                  marginBottom: 6,
                  display: 'block',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                Enter 6-Digit OTP Code
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="------"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
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
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: 46, fontSize: 14 }}
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Validating OTP...' : 'Verify OTP & Proceed'}
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
                onClick={() => { setStep(1); setError(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--sr-text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                &larr; Change Credentials
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? '#94A3B8' : 'var(--sr-primary)',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}

        {/* Links to Register */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--sr-text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--sr-primary)', fontWeight: 700, textDecoration: 'none' }}>
            Create Account
          </Link>
        </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--sr-text-primary)' }}>
                  {forgotStep === 1 ? 'Reset Your Password' : 'Set New Secure Password'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--sr-text-secondary)', margin: '4px 0 0 0' }}>
                  {forgotStep === 1 ? 'Enter your registered contact to receive a 6-digit OTP' : 'Enter the code and choose a new password'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotError(null);
                  setForgotSuccess(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--sr-text-secondary)',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div
                style={{
                  background: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  color: '#BE123C',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#15803D',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestForgotOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--sr-text-secondary)', marginBottom: 6, display: 'block' }}>
                    Registered Mobile Number or Email Address
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 9876543210 or user@example.com"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: 13, height: 40 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading || !forgotIdentifier.trim()}
                    style={{ fontSize: 13, height: 40 }}
                  >
                    {forgotLoading ? 'Sending Code...' : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {forgotDevOtp && (
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: '#4F46E5',
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} />
                      <span>[DEV] Reset Code: <strong>{forgotDevOtp}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotOtp(forgotDevOtp)}
                      style={{
                        background: '#4F46E5',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 4,
                        padding: '3px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      Fill
                    </button>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--sr-text-secondary)', marginBottom: 6, display: 'block' }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="------"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    style={{ letterSpacing: '0.25em', textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--sr-text-secondary)', marginBottom: 6, display: 'block' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="At least 8 chars with upper, lower, digit, symbol"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      style={{ paddingRight: 36 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--sr-text-dim)',
                        padding: 2,
                      }}
                    >
                      {showForgotNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Password Strength Meter & Security Policy Checklist */}
                  <PasswordStrengthMeter password={forgotNewPassword} showChecklist={true} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--sr-text-secondary)', marginBottom: 6, display: 'block' }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      className="input-field"
                      placeholder="Re-enter your new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      style={{ paddingRight: 36 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--sr-text-dim)',
                        padding: 2,
                      }}
                    >
                      {showForgotConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotError(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      color: 'var(--sr-text-secondary)',
                      padding: 0,
                    }}
                  >
                    &larr; Back
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading || !isForgotNewPasswordValid || forgotOtp.length !== 6 || forgotNewPassword !== forgotConfirmPassword}
                    style={{ fontSize: 13, height: 40 }}
                  >
                    {forgotLoading ? 'Updating Password...' : 'Reset & Save Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
