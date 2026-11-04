import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, MicOff, X, Check, Star, ShieldCheck, Zap, BedDouble, Armchair, Clock, Radio, Award } from 'lucide-react';

/**
 * AI Smart Filter & Quick Filter Pills Bar
 * Inspired by RedBus and Abhibus AI conversational and one-tap filter experiences.
 */
export default function AiSmartFilter({
  searchKeyword,
  onKeywordChange,
  quickPills = [],
  onTogglePill,
  pillCounts = {},
  onClearKeyword,
}) {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState('');

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const instance = new SpeechRecognition();
      instance.continuous = false;
      instance.interimResults = false;
      instance.lang = 'en-IN';

      instance.onstart = () => {
        setIsListening(true);
        setVoiceNotice('Listening... speak now (e.g. "Morning bus under 800")');
      };

      instance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onKeywordChange(transcript);
          setVoiceNotice(`Heard: "${transcript}"`);
          setTimeout(() => setVoiceNotice(''), 3000);
        }
      };

      instance.onerror = (err) => {
        console.warn('Speech recognition error:', err.error);
        setIsListening(false);
        setVoiceNotice('Voice input error. You can type keywords directly.');
        setTimeout(() => setVoiceNotice(''), 3500);
      };

      instance.onend = () => {
        setIsListening(false);
      };

      setRecognitionInstance(instance);
    }
  }, [onKeywordChange]);

  const toggleVoiceSearch = () => {
    if (!speechSupported || !recognitionInstance) {
      setVoiceNotice('Voice recognition is not supported in this browser. Please type keywords directly.');
      setTimeout(() => setVoiceNotice(''), 3500);
      return;
    }

    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
    } else {
      try {
        recognitionInstance.start();
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const PILL_DEFINITIONS = [
    { key: 'primo', label: 'Smart Assured / Primo', icon: '⭐' },
    { key: 'cancellation', label: 'Free Cancellation', icon: '🛡️' },
    { key: 'ac', label: 'AC', icon: '❄️' },
    { key: 'sleeper', label: 'SLEEPER', icon: '🛏️' },
    { key: 'single', label: 'Single Seats', icon: '🪟' },
    { key: 'seater', label: 'SEATER', icon: '💺' },
    { key: 'non_ac', label: 'NON-AC', icon: '🚫' },
    { key: 'night', label: '18:00 - 24:00', icon: '🌙' },
    { key: 'high_rated', label: 'High Rated Buses', icon: '🌟' },
    { key: 'live_tracking', label: 'Live Tracking', icon: '📍' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 1. AI Smart Filter Bar */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1.5px solid #F1EDFA',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Sparkle icon badge */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFF1F6 0%, #FDF2F8 100%)',
            border: '1px solid #E7A0BF',
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C13D78',
            flexShrink: 0,
          }}
        >
          <Sparkles size={18} />
        </div>

        {/* Input Field */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Try 'Morning bus under ₹800' or 'Sleeper to Tenkasi'"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 500,
              color: '#24152D',
              paddingRight: searchKeyword ? 28 : 0,
            }}
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={onClearKeyword}
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#F1EDFA',
                border: 'none',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#6E5D73',
              }}
              title="Clear keyword"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Voice Input Action Button */}
        <button
          type="button"
          onClick={toggleVoiceSearch}
          style={{
            background: isListening ? '#C13D78' : '#FFF1F6',
            border: '1px solid',
            borderColor: isListening ? '#C13D78' : '#E7A0BF',
            color: isListening ? '#FFFFFF' : '#C13D78',
            borderRadius: 10,
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            boxShadow: isListening ? '0 0 12px rgba(193, 61, 120, 0.4)' : 'none',
          }}
          title={isListening ? 'Stop listening' : 'Search with Voice'}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      </div>

      {/* Voice Status Notice */}
      {voiceNotice && (
        <div
          style={{
            fontSize: 12,
            color: '#C13D78',
            fontWeight: 600,
            background: '#FFF1F6',
            border: '1px solid #E7A0BF',
            padding: '4px 12px',
            borderRadius: 8,
            display: 'inline-block',
          }}
        >
          {voiceNotice}
        </div>
      )}

      {/* 2. Quick Filter Pill Buttons (Horizontally Scrollable) */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="quick-pills-scroll"
      >
        {PILL_DEFINITIONS.map((pill) => {
          const isActive = quickPills.includes(pill.key);
          const count = pillCounts[pill.key] ?? 0;

          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => onTogglePill(pill.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: isActive ? '#C13D78' : '#F1EDFA',
                background: isActive ? '#C13D78' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#6E5D73',
                fontSize: 12,
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                boxShadow: isActive ? '0 4px 12px rgba(193, 61, 120, 0.25)' : '0 1px 3px rgba(36, 21, 45, 0.03)',
                flexShrink: 0,
              }}
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
              <span
                style={{
                  fontSize: 11,
                  opacity: isActive ? 0.9 : 0.75,
                  fontWeight: 700,
                  marginLeft: 2,
                }}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
