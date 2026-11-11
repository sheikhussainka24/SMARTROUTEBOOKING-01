import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { SESSION_CONFIG } from '../utils/securityUtils.js';

/**
 * SMART ROUTE — Automatic Session Inactivity Timeout Hook
 *
 * Monitors user interaction events (mouse, keyboard, touch, scroll).
 * If user is inactive for INACTIVITY_TIMEOUT_MS (default 15 minutes),
 * triggers a 60-second warning countdown modal.
 * If no response, securely terminates session and logs out.
 */
export function useSessionTimeout({
  timeoutMs = SESSION_CONFIG.INACTIVITY_TIMEOUT_MS,
  warningDurationMs = SESSION_CONFIG.WARNING_DURATION_MS,
  enabled = true,
} = {}) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(Math.round(warningDurationMs / 1000));

  const lastActivityRef = useRef(Date.now());
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const handleLogoutDueToInactivity = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    try {
      await logout();
    } catch {
      // Ignore network errors on logout
    }
    navigate('/login', {
      replace: true,
      state: {
        reason: 'session_expired',
        message: 'Your session has expired due to inactivity. Please log in again to continue.',
      },
    });
  }, [clearAllTimers, logout, navigate]);

  const resetActivity = useCallback(() => {
    if (!isAuthenticated || !enabled) return;

    lastActivityRef.current = Date.now();

    // If warning was active, hide it
    if (showWarning) {
      setShowWarning(false);
    }

    clearAllTimers();

    // Time until warning modal appears
    const timeUntilWarning = Math.max(1000, timeoutMs - warningDurationMs);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(Math.round(warningDurationMs / 1000));

      // Countdown interval for warning modal
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Final logout timer
      logoutTimerRef.current = setTimeout(() => {
        handleLogoutDueToInactivity();
      }, warningDurationMs);
    }, timeUntilWarning);
  }, [isAuthenticated, enabled, showWarning, clearAllTimers, timeoutMs, warningDurationMs, handleLogoutDueToInactivity]);

  // Set up event listeners for user activity
  useEffect(() => {
    if (!isAuthenticated || !enabled) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    resetActivity();

    const handleUserActivity = () => {
      // Throttle activity checks to prevent performance degradation on high-frequency events (mousemove)
      const now = Date.now();
      if (now - lastActivityRef.current > 2000) {
        if (!showWarning) {
          resetActivity();
        }
      }
    };

    const events = SESSION_CONFIG.ACTIVITY_EVENTS;
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      clearAllTimers();
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [isAuthenticated, enabled, showWarning, resetActivity, clearAllTimers]);

  return {
    showWarning,
    secondsRemaining,
    stayLoggedIn: resetActivity,
    logoutNow: handleLogoutDueToInactivity,
  };
}

