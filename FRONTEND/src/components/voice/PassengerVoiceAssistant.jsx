import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  PhoneCall,
  Radio,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * SMART ROUTE — Natural Passenger AI Voice Assistant
 * 
 * Features:
 * - Natural two-way conversation in Tamil, English, and Tanglish
 * - Interactive audio visualizer (Idle, Listening, Processing, Speaking)
 * - Interruption / Barge-in handling (cancels speech on interrupt)
 * - Mute / Unmute and End Call controls
 * - Real-time conversational transcripts
 * - Verified data cards (PNR, bus location, ETA, boarding points)
 * - Text fallback for devices without microphone permissions
 */
export default function PassengerVoiceAssistant({ isOpen, onClose }) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const showModal = isOpen !== undefined ? isOpen : internalOpen;

  const [state, setState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [language, setLanguage] = useState('tanglish'); // 'tanglish' | 'tamil' | 'english'
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Vanakkam! Smart Route Booking AI assistant pesuren. Sollunga, unga journey pathi eppadi help pannanum?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [textInput, setTextInput] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [sessionId] = useState(() => `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, state]);

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => setInternalOpen(true);
    window.addEventListener('sr-open-voice-assistant', handleOpen);
    return () => window.removeEventListener('sr-open-voice-assistant', handleOpen);
  }, []);

  // Handle Speech Synthesis Spoken Output (with barge-in cancellation)
  const speakResponse = (text) => {
    if (isMuted || !window.speechSynthesis) return;

    // Barge-in: cancel any currently speaking utterance first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best Indian voice (Hindi, Tamil, Indian English)
    const voices = window.speechSynthesis.getVoices();
    const targetLang = language === 'hindi' ? 'hi-IN' : (language === 'tamil' ? 'ta-IN' : 'en-IN');
    const indVoice = voices.find(
      (v) => v.lang === targetLang || v.lang === 'hi-IN' || v.lang === 'ta-IN' || v.lang === 'en-IN' || v.name.includes('Aditi') || v.name.includes('Kajal') || v.name.includes('India')
    );
    if (indVoice) utterance.voice = indVoice;

    utterance.onstart = () => {
      setState('speaking');
    };

    utterance.onend = () => {
      setState('idle');
    };

    utterance.onerror = () => {
      setState('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Barge-in: Immediately stops the assistant from speaking
  const handleBargeIn = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setState('idle');
  };

  // Start Voice Recognition (Microphone)
  const startListening = () => {
    setErrorMessage(null);

    // Stop speaking if assistant is currently talking (Barge-in on mic press)
    handleBargeIn();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Browser speech recognition is not supported on this browser. You can type in the chat below.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'tamil' ? 'ta-IN' : (language === 'hindi' ? 'hi-IN' : 'en-IN');

      recognition.onstart = () => {
        setState('listening');
      };

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        if (spoken) {
          handleSendQuery(spoken);
        }
      };

      recognition.onerror = (event) => {
        setState('idle');
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please grant permission or use the text box below.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (state === 'listening') {
          setState('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setState('idle');
      setErrorMessage(err.message || 'Could not start microphone.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState('idle');
  };

  // Send query to Backend Conversational API
  const handleSendQuery = async (queryText) => {
    const text = (queryText || textInput).trim();
    if (!text) return;

    setTextInput('');
    setErrorMessage(null);

    // Add user message to transcript
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTranscript((prev) => [...prev, userMsg]);
    setState('processing');

    try {
      const response = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          language,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMsg = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.textResponse,
          data: data.data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setTranscript((prev) => [...prev, assistantMsg]);
        speakResponse(data.textResponse);
      } else {
        throw new Error(data.error || 'Server could not process message.');
      }
    } catch (err) {
      setState('idle');
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Manninga, network error. Unga query-ai thirumba type pannunga.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTranscript((prev) => [...prev, errorMsg]);
      setErrorMessage(err.message);
    }
  };

  const handleEndConversation = () => {
    handleBargeIn();
    stopListening();
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };

  return (
    <>
      {/* ================= 1. FLOATING ACTION ENTRY POINT ================= */}
      {!showModal && (
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose(true);
            else setInternalOpen(true);
          }}
          className="voice-fab-btn"
          aria-label="Open SMART ROUTE AI Voice Assistant"
          style={{
            position: 'fixed',
            bottom: 84,
            right: 24,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'linear-gradient(135deg, #D44D8A 0%, #C13D78 60%, #A82F65 100%)',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: 30,
            boxShadow: '0 8px 28px rgba(193, 61, 120, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Mic size={18} color="#FFFFFF" />
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 6px #10B981',
              }}
            />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1.2 }}>
              AI Voice Assistant
            </div>
            <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 500 }}>
              Tamil • Hindi • English • Tanglish
            </div>
          </div>
        </button>
      )}

      {/* ================= 2. VOICE ASSISTANT MODAL / DRAWER ================= */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1050,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              height: '85vh',
              maxHeight: 720,
              background: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              margin: '0 auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #F1EDFA',
                background: 'linear-gradient(135deg, #FFF1F6 0%, #FFFFFF 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #D44D8A 0%, #C13D78 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(193, 61, 120, 0.3)',
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Smart Route Voice AI
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: '#DCFCE7',
                        color: '#166534',
                        padding: '2px 6px',
                        borderRadius: 6,
                      }}
                    >
                      LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Natural Conversational Voice</div>
                </div>
              </div>

              {/* Language Selector & Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <option value="tanglish">Tanglish</option>
                  <option value="tamil">தமிழ் (Tamil)</option>
                  <option value="hindi">हिन्दी (Hindi)</option>
                  <option value="english">English</option>
                </select>

                <button
                  type="button"
                  onClick={handleEndConversation}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                style={{
                  background: '#FEF2F2',
                  borderBottom: '1px solid #FCA5A5',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#991B1B',
                }}
              >
                <AlertCircle size={16} />
                <span style={{ flex: 1 }}>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Conversational Transcript Feed */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                background: '#FAF8FC',
              }}
            >
              {transcript.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <div
                    style={{
                      background: msg.sender === 'user' ? '#C13D78' : '#FFFFFF',
                      color: msg.sender === 'user' ? '#FFFFFF' : '#1E293B',
                      padding: '12px 16px',
                      borderRadius: 16,
                      borderBottomRightRadius: msg.sender === 'user' ? 4 : 16,
                      borderBottomLeftRadius: msg.sender === 'assistant' ? 4 : 16,
                      fontSize: 14,
                      lineHeight: 1.5,
                      boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(193, 61, 120, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      border: msg.sender === 'assistant' ? '1px solid #E2E8F0' : 'none',
                    }}
                  >
                    {msg.text}

                    {/* Inline Verified Data Cards */}
                    {msg.data?.booking && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 10,
                          borderRadius: 8,
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          fontSize: 12,
                          color: '#334155',
                        }}
                      >
                        <div style={{ fontWeight: 800, color: '#C13D78', marginBottom: 4 }}>
                          Verified Booking: PNR {msg.data.booking.pnr}
                        </div>
                        <div>Bus: {msg.data.booking.busNumber} ({msg.data.booking.travelName})</div>
                        <div>Route: {msg.data.booking.source} ➔ {msg.data.booking.destination}</div>
                      </div>
                    )}

                    {msg.data?.location?.hasLiveTracking && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 8,
                          borderRadius: 8,
                          background: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          fontSize: 12,
                          color: '#166534',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Radio size={14} color="#166534" />
                        <span>Live GPS: Next stop {msg.data.location.data.nextStop} (ETA: {msg.data.location.data.eta})</span>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#94A3B8',
                      marginTop: 4,
                      textAlign: msg.sender === 'user' ? 'right' : 'left',
                    }}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              ))}

              {state === 'processing' && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                  <div
                    style={{
                      background: '#FFFFFF',
                      padding: '12px 16px',
                      borderRadius: 16,
                      fontSize: 13,
                      color: '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <RotateCcw size={14} className="spin-animation" />
                    <span>Checking verified trip and tracking data...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Central Visualizer & Status Bar */}
            <div
              style={{
                padding: '12px 20px',
                background: '#FFFFFF',
                borderTop: '1px solid #F1EDFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Dynamic State Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background:
                      state === 'speaking'
                        ? '#C13D78'
                        : state === 'listening'
                        ? '#EF4444'
                        : state === 'processing'
                        ? '#F59E0B'
                        : '#10B981',
                    boxShadow:
                      state === 'speaking' || state === 'listening'
                        ? '0 0 10px rgba(193, 61, 120, 0.6)'
                        : 'none',
                    animation: state === 'speaking' || state === 'listening' ? 'pulse 1.2s infinite' : 'none',
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                  {state === 'listening' && 'Listening... Speak naturally'}
                  {state === 'speaking' && 'Speaking (Tap Interrupt to Barge-in)'}
                  {state === 'processing' && 'Checking Verified Route Data...'}
                  {state === 'idle' && 'Ready — Tap Mic or Type Below'}
                </span>
              </div>

              {/* Action Buttons: Barge-in / Stop & Mute */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {state === 'speaking' && (
                  <button
                    type="button"
                    onClick={handleBargeIn}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: '#FEE2E2',
                      color: '#991B1B',
                      border: '1px solid #FCA5A5',
                      padding: '4px 10px',
                      borderRadius: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Interrupt
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    background: isMuted ? '#FEE2E2' : '#F1F5F9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isMuted ? '#EF4444' : '#475569',
                  }}
                  title={isMuted ? 'Unmute Speaker' : 'Mute Speaker'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>

            {/* Input & Microphone Controls */}
            <div
              style={{
                padding: '12px 16px 20px',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={state === 'listening' ? stopListening : startListening}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: state === 'listening' ? '#EF4444' : 'linear-gradient(135deg, #D44D8A 0%, #C13D78 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: state === 'listening' ? '0 0 16px rgba(239, 68, 68, 0.6)' : '0 4px 14px rgba(193, 61, 120, 0.35)',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                aria-label={state === 'listening' ? 'Stop Listening' : 'Start Voice Input'}
              >
                {state === 'listening' ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {/* Text Fallback Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F1F5F9',
                  borderRadius: 24,
                  padding: '6px 14px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Ask bus location, PNR status, boarding time..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    color: '#1E293B',
                  }}
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || state === 'processing'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: textInput.trim() ? '#C13D78' : '#94A3B8',
                    cursor: textInput.trim() ? 'pointer' : 'default',
                    padding: 4,
                  }}
                  aria-label="Send query"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
