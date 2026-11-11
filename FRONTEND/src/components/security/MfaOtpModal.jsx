import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, KeyRound, Lock, X } from 'lucide-react';
import { maskMobile, maskEmail } from '../../utils/securityUtils.js';

/**
 * SMART ROUTE — Multi-Factor Authentication (MFA) Verification Component
 *
 * Implements a segmented 6-digit OTP input with automatic cursor advance,
 * paste distribution, countdown expiry, resend rate limiting, and brute-force attempt notices.
 */
export default function MfaOtpModal({
  isOpen = true,
  onClose,
  onSubmit,
  onResend,
  destination = '',
  destinationType = 'mobile', // 'mobile' or 'email'
  expirySeconds = 300,        // 5 minutes default
  resendCooldownSeconds = 60,
  maxAttempts = 5,
  attemptsUsed = 0,
  loading = false,
  error = null,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(expirySeconds);
  const [resendCooldown, setResendCooldown] = useState(resendCooldownSeconds);
  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Expiration countdown
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, resendCooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    // Single digit entry
    const nextDigits = [...digits];
    nextDigits[index] = cleaned[cleaned.length - 1]; // take latest char
    setDigits(nextDigits);

    // Auto-advance to next input
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are filled
    const fullCode = nextDigits.join('');
    if (fullCode.length === 6 && !nextDigits.includes('')) {
      onSubmit(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasted[i] || '';
    }
    setDigits(nextDigits);

    const targetFocus = Math.min(5, pasted.length);
    inputRefs.current[targetFocus]?.focus();

    if (pasted.length === 6) {
      onSubmit(pasted);
    }
  };

  const handleResendClick = () => {
    if (resendCooldown > 0) return;
    setDigits(['', '', '', '', '', '']);
    setTimeLeft(expirySeconds);
    setResendCooldown(resendCooldownSeconds);
    if (onResend) onResend();
    inputRefs.current[0]?.focus();
  };

  if (!isOpen) return null;

  const maskedTarget = destinationType === 'email' ? maskEmail(destination) : maskMobile(destination);
  const otpValue = digits.join('');
  const isComplete = otpValue.length === 6;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptsUsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E7A0BF] rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative overflow-hidden">
        {/* Close Button if closable */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors"
            aria-label="Close verification modal"
          >
            <X size={20} />
          </button>
        )}

        {/* Security Shield Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF1F6] border border-[#E7A0BF] mx-auto flex items-center justify-center mb-3 shadow-inner">
            <KeyRound size={26} className="text-[#C13D78]" />
          </div>
          <h3 className="text-xl font-black text-[#24152D]">
            Two-Factor Authentication (MFA)
          </h3>
          <p className="text-xs text-[#6E5D73] mt-1.5 leading-relaxed">
            Enter the 6-digit verification code sent to your registered {destinationType}:
            <br />
            <strong className="text-[#24152D] font-bold text-sm tracking-wide">
              {maskedTarget || 'registered device'}
            </strong>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* 6-Digit Segmented Input Boxes */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-6" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              autoComplete="one-time-code"
              spellCheck="false"
              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black text-[#24152D] bg-[#FFF1F6]/50 border-2 border-[#E7A0BF] rounded-xl focus:outline-none focus:border-[#C13D78] focus:bg-white focus:ring-4 focus:ring-[#C13D78]/20 transition-all shadow-xs"
            />
          ))}
        </div>

        {/* Expiry Timer & Resend Controls */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#6E5D73] mb-6 px-1">
          <div>
            {timeLeft > 0 ? (
              <span>
                Code expires in: <strong className="text-[#24152D] font-mono">{formatTimer(timeLeft)}</strong>
              </span>
            ) : (
              <span className="text-rose-600 font-bold">Code has expired</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleResendClick}
            disabled={resendCooldown > 0 || loading}
            className={`flex items-center gap-1 font-bold ${
              resendCooldown > 0 || loading
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-[#C13D78] hover:text-[#A0285D] hover:underline cursor-pointer'
            }`}
          >
            <RefreshCw size={12} className={resendCooldown > 0 ? 'animate-spin' : ''} />
            <span>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </span>
          </button>
        </div>

        {/* Submit Verification Button */}
        <button
          type="button"
          onClick={() => onSubmit(otpValue)}
          disabled={!isComplete || loading || timeLeft <= 0}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all ${
            !isComplete || loading || timeLeft <= 0
              ? 'bg-gray-300 cursor-not-allowed shadow-none'
              : 'bg-[#C13D78] hover:bg-[#A0285D] cursor-pointer hover:shadow-lg transform active:scale-[0.99]'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Verifying Security Code...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>Verify &amp; Authenticate</span>
            </>
          )}
        </button>

        {/* Security & Attempt Notices */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6E5D73]">
          <div className="flex items-center gap-1">
            <Lock size={12} className="text-[#C13D78]" />
            <span>End-to-End Encrypted Session</span>
          </div>
          {maxAttempts && (
            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {attemptsRemaining} of {maxAttempts} attempts remaining
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

