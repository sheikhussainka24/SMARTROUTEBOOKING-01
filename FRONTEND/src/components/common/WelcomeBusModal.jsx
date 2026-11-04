import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bus, Clock, Sun, Moon, Sparkles, CheckCircle2, ChevronRight, RotateCcw, X, Shield, ArrowRight } from 'lucide-react';
import dayBusCutout from '../../assets/bus-cutout-day.png';
import nightBusCutout from '../../assets/bus-cutout-night.png';
import highwayBgDay from '../../assets/highway-bg-day.jpg';
import highwayBgNight from '../../assets/highway-bg-night.jpg';

export default function WelcomeBusModal({ forceOpen = false, onClose = null }) {
  // Determine if current real time is between 6:00 AM (06:00) and 6:00 PM (18:00)
  const checkIsDaytime = () => {
    const currentHour = new Date().getHours();
    return currentHour >= 6 && currentHour < 18;
  };

  const [isOpen, setIsOpen] = useState(true);
  const [isDaytime, setIsDaytime] = useState(checkIsDaytime);
  const [previewMode, setPreviewMode] = useState(null); // null = auto time, 'day', 'night'
  const [animStage, setAnimStage] = useState('driving'); // 'driving' -> 'arrived' -> 'popped'
  const [animKey, setAnimKey] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Effective time mode: either user preview override or real system time
  const effectiveIsDay = previewMode !== null ? previewMode === 'day' : isDaytime;

  // Format real clock time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setIsDaytime(checkIsDaytime());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for custom trigger event from Navbar or anywhere in app
  useEffect(() => {
    const handleTrigger = (e) => {
      setIsOpen(true);
      restartAnimation();
      if (e?.detail?.mode) {
        setPreviewMode(e.detail.mode);
      }
    };
    window.addEventListener('sr-show-welcome-bus', handleTrigger);
    return () => window.removeEventListener('sr-show-welcome-bus', handleTrigger);
  }, []);

  // Run staged driving and popup animation
  const restartAnimation = () => {
    setAnimKey((prev) => prev + 1);
    setAnimStage('driving');
    const t1 = setTimeout(() => {
      setAnimStage('arrived');
    }, 1800);
    const t2 = setTimeout(() => {
      setAnimStage('popped');
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  useEffect(() => {
    if (isOpen) {
      const cleanup = restartAnimation();
      return cleanup;
    }
  }, [isOpen, previewMode]);

  // Ensure active input focus is blurred when the modal opens to eliminate intrusive browser autofill popups
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const blurTimer = setTimeout(() => {
        if (document.activeElement && document.activeElement instanceof HTMLElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) {
          document.activeElement.blur();
        }
      }, 50);
      return () => clearTimeout(blurTimer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen && !forceOpen) return null;

  const currentBusCutout = effectiveIsDay
    ? (dayBusCutout || '/assets/bus-cutout-day.png')
    : (nightBusCutout || '/assets/bus-cutout-night.png');

  const currentHighwayBg = effectiveIsDay
    ? (highwayBgDay || '/assets/highway-bg-day.jpg')
    : (highwayBgNight || '/assets/highway-bg-night.jpg');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to SMART ROUTE Bus Showcase"
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(7, 11, 20, 0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'srFadeIn 0.3s ease-out forwards',
        overflowY: 'auto',
      }}
    >
      {/* Cinematic Modal Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          background: 'linear-gradient(145deg, #0D1424 0%, #111A30 50%, #090E1A 100%)',
          border: '1px solid rgba(225, 29, 72, 0.35)',
          borderRadius: 24,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(225, 29, 72, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Top Bar with Time Badge & Controls */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Active Schedule Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: effectiveIsDay ? '#F59E0B' : '#818CF8',
                boxShadow: effectiveIsDay ? '0 0 10px #F59E0B' : '0 0 10px #818CF8',
              }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
                {effectiveIsDay ? (
                  <>
                    <Sun size={15} color="#F59E0B" /> DAYTIME ROYAL COACH (06:00 AM – 06:00 PM)
                  </>
                ) : (
                  <>
                    <Moon size={15} color="#818CF8" /> NIGHT CRUISER COACH (06:00 PM – 06:00 AM)
                  </>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                System Clock: <strong>{currentTimeStr || '11:32 AM'}</strong> &middot;{' '}
                {isDaytime ? 'Day Schedule Active' : 'Evening Schedule Active'}
              </div>
            </div>
          </div>

            {/* Controls: Time Mode Toggle & Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Interactive Day/Night Tester Toggle */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 20,
                  padding: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPreviewMode('day')}
                  style={{
                    background: effectiveIsDay ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'transparent',
                    color: effectiveIsDay ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    borderRadius: 16,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s',
                  }}
                  title="Preview Morning 6:00 to Evening 6:00 coach"
                >
                  <Sun size={12} /> Day Bus
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('night')}
                  style={{
                    background: !effectiveIsDay ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : 'transparent',
                    color: !effectiveIsDay ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    borderRadius: 16,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.2s',
                  }}
                  title="Preview Evening 6:00 to Morning 6:00 coach"
                >
                  <Moon size={12} /> Night Bus
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#E2E8F0',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Close and continue to app"
              >
                <X size={16} />
              </button>
            </div>
        </div>

        {/* Cinematic Scenic Highway Animation Arena */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '380px',
            backgroundImage: `url(${currentHighwayBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            overflow: 'hidden',
            padding: '24px 20px 18px 20px',
          }}
        >
          {/* Subtle Atmospheric Sky Lighting Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: effectiveIsDay
                ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.15) 0%, transparent 45%, rgba(15, 23, 42, 0.35) 100%)'
                : 'linear-gradient(180deg, rgba(3, 7, 18, 0.25) 0%, transparent 40%, rgba(3, 7, 18, 0.5) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* Contact Tire Shadow on the Natural Asphalt Highway Road */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              width: '74%',
              maxWidth: '560px',
              height: '22px',
              background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 45%, transparent 75%)',
              animation: 'tireShadowBounce 1.8s ease-in-out infinite',
              zIndex: 4,
            }}
          />

          {/* THE CUTOUT BUS: Driving Realistically on the Scenic Highway Road */}
          <motion.div
            key={`${effectiveIsDay ? 'day' : 'night'}-${animKey}`}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '0%', opacity: 1 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            style={{
              position: 'relative',
              zIndex: 10,
              maxWidth: '680px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            {/* Chassis Suspension Bounce & Engine Vibration */}
            <div
              style={{
                animation: 'chassisBounce 1.8s ease-in-out infinite',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Transparent Cutout Bus Running on the Highway */}
              <img
                src={currentBusCutout}
                alt="SMART ROUTE Luxury Volvo Coach"
                onError={(e) => {
                  e.currentTarget.src = effectiveIsDay
                    ? '/assets/bus-cutout-day.png'
                    : '/assets/bus-cutout-night.png';
                }}
                style={{
                  width: '100%',
                  maxWidth: '630px',
                  height: 'auto',
                  display: 'block',
                  filter: !effectiveIsDay
                    ? 'drop-shadow(0 15px 25px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 20px rgba(99, 102, 241, 0.45))'
                    : 'drop-shadow(0 15px 22px rgba(0, 0, 0, 0.8))',
                }}
              />

              {/* Headlight Beam Casting on Highway Road Surface Ahead */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '14%',
                  right: '2%',
                  width: '210px',
                  height: '70px',
                  borderRadius: '50%',
                  background: effectiveIsDay
                    ? 'radial-gradient(ellipse, rgba(254, 240, 138, 0.32) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse, rgba(254, 240, 138, 0.6) 0%, rgba(255, 255, 255, 0.8) 25%, transparent 75%)',
                  filter: 'blur(10px)',
                  pointerEvents: 'none',
                  animation: 'lightBeamPulse 1.8s ease-in-out infinite alternate',
                }}
              />
            </div>
          </motion.div>

          {/* Evening / Night Coach Active Indicator */}
          {!effectiveIsDay && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                right: 20,
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(129, 140, 248, 0.45)',
                backdropFilter: 'blur(8px)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 700,
                color: '#E0E7FF',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
              }}
            >
              <Moon size={13} color="#A5B4FC" /> Evening Star Cruiser Active (06:00 PM – 06:00 AM)
            </div>
          )}
        </div>

        {/* POPUP MESSAGE AREA: "Welcome to SMART ROUTE BOOKING" */}
        <div
          style={{
            padding: '24px 28px',
            background: 'linear-gradient(180deg, rgba(13, 20, 36, 0.98) 0%, #090E1A 100%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 16,
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: animStage === 'popped' ? 'translateY(0)' : 'translateY(20px)',
            opacity: animStage === 'popped' ? 1 : 0.8,
          }}
        >
          {/* Gold Luxury Crown Header Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 20,
              padding: '6px 18px',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#F59E0B',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow: '0 0 12px rgba(245, 158, 11, 0.5)',
              }}
            >
              👑 A/C and Non-A/C, SEATER &amp; SLEEPER COACHES &bull; LUXURY &amp; COMFORT 👑
            </span>
          </div>

          {/* Welcome to SMART ROUTE BOOKING Title */}
          <div>
            <h2
              style={{
                fontSize: 'clamp(24px, 4vw, 34px)',
                fontWeight: 900,
                margin: 0,
                letterSpacing: '0.04em',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FFE4E6 40%, #E11D48 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                textTransform: 'uppercase',
                animation: 'srFloatGlow 3.5s ease-in-out infinite',
              }}
            >
              Welcome to SMART ROUTE BOOKING
            </h2>

            {/* Official Tagline from Bus Livery */}
            <p
              style={{
                fontSize: 'clamp(13px, 2vw, 15px)',
                fontWeight: 600,
                color: '#CBD5E1',
                margin: '8px 0 0 0',
                letterSpacing: '0.02em',
              }}
            >
              &ldquo;Comfort Begins with Smart Booking, Your Journey, Our Promise.&rdquo;
            </p>
          </div>

          {/* Service Specifications Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'center',
              marginTop: 4,
            }}
          >
            <div
              style={{
                background: 'rgba(225, 29, 72, 0.12)',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                color: '#FDA4AF',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Clock size={14} color="#F43F5E" />
              {effectiveIsDay ? 'Active 06:00 AM – 06:00 PM' : 'Active 06:00 PM – 06:00 AM'}
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                color: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={14} color="#F59E0B" /> Official smartroutebooking.com Flagship
            </div>
          </div>

          {/* Action CTA */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              maxWidth: 360,
              marginTop: 6,
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-primary"
              tabIndex={0}
              style={{
                width: '100%',
                height: 48,
                fontSize: 15,
                fontWeight: 800,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(225, 29, 72, 0.35)',
                cursor: 'pointer',
              }}
            >
              Enter SMART ROUTE <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
