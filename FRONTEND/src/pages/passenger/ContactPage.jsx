import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, CheckCircle2, AlertCircle, Sparkles, Send } from 'lucide-react';
import { useHubConfig } from '../../config/hubConfig.js';

export default function ContactPage() {
  const { hubConfig } = useHubConfig();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Booking Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 20px 80px', width: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#FFF1F6',
            border: '1px solid #E7A0BF',
            color: '#F5222D',
            borderRadius: 20,
            padding: '5px 16px',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          <Sparkles size={14} color="#F5222D" />
          <span>24/7 CUSTOMER HELPLINE</span>
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 900,
            color: '#24152D',
            margin: '0 0 12px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Contact Smart Route Booking
        </h1>
        <p style={{ fontSize: 16, color: '#6E5D73', maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
          Have a question regarding bus departure times, boarding points, or seat selection? Our support team is here to assist 24 hours a day.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 36,
        }}
      >
        {/* Left Column: Official Contact Channels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Phone Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px solid #F1EDFA',
              padding: '24px 28px',
              boxShadow: '0 4px 20px rgba(36, 21, 45, 0.04)',
              display: 'flex',
              gap: 18,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: '#FFF1F6',
                border: '1px solid #E7A0BF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F5222D',
                flexShrink: 0,
              }}
            >
              <Phone size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                Customer Care &amp; WhatsApp
              </div>
              <a
                href="tel:+918072065549"
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#24152D',
                  textDecoration: 'none',
                  display: 'block',
                  margin: '4px 0 6px 0',
                }}
              >
                +91 8072065549
              </a>
              <p style={{ fontSize: 13, color: '#6E5D73', margin: 0, lineHeight: 1.4 }}>
                Direct passenger helpline for booking confirmation, boarding point assistance, and live coach GPS tracking.
              </p>
            </div>
          </div>

          {/* Email Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px solid #F1EDFA',
              padding: '24px 28px',
              boxShadow: '0 4px 20px rgba(36, 21, 45, 0.04)',
              display: 'flex',
              gap: 18,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: '#FFF1F6',
                border: '1px solid #E7A0BF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F5222D',
                flexShrink: 0,
              }}
            >
              <Mail size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase' }}>
                Support Email ID
              </div>
              <a
                href="mailto:support@smartroutebooking.com"
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#24152D',
                  textDecoration: 'none',
                  display: 'block',
                  margin: '4px 0 6px 0',
                }}
              >
                support@smartroutebooking.com
              </a>
              <p style={{ fontSize: 13, color: '#6E5D73', margin: 0, lineHeight: 1.4 }}>
                For refund inquiries, e-ticket resends, Corporate bookings, and travel feedback. Response within 2 hours.
              </p>
            </div>
          </div>

          {/* Central Hub Address Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px solid #F1EDFA',
              padding: '24px 28px',
              boxShadow: '0 4px 20px rgba(36, 21, 45, 0.04)',
              display: 'flex',
              gap: 18,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: '#FFF1F6',
                border: '1px solid #E7A0BF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F5222D',
                flexShrink: 0,
              }}
            >
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6E5D73', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Central Bus Hub
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#24152D', margin: '4px 0 6px 0' }}>
                {hubConfig?.line1 || 'SMART ROUTE Central Bus Hub'}
              </div>
              <p style={{ fontSize: 13, color: '#6E5D73', margin: 0, lineHeight: 1.6 }}>
                {hubConfig?.line2 || 'Palakkad – Ukkadam Highway'},<br />
                {hubConfig?.line3 || 'K.G. Chavadi, Coimbatore – 641105'},<br />
                {hubConfig?.line4 || 'Tamil Nadu, India.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Inquiry Message Form */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1.5px solid #F1EDFA',
            padding: '32px',
            boxShadow: '0 4px 24px rgba(36, 21, 45, 0.05)',
          }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#24152D', margin: '0 0 8px 0' }}>
            Send Us a Message
          </h3>
          <p style={{ fontSize: 13, color: '#6E5D73', margin: '0 0 24px 0' }}>
            Fill in the details below and an operations representative will reach back immediately.
          </p>

          {submitted ? (
            <div
              style={{
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 14,
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: 18, fontWeight: 800, color: '#065F46', margin: '0 0 6px 0' }}>
                Inquiry Received Successfully!
              </h4>
              <p style={{ fontSize: 13, color: '#047857', margin: '0 0 16px 0' }}>
                Thank you for reaching out. We have logged your request and our helpline desk will contact you shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', subject: 'Booking Inquiry', message: '' });
                }}
                style={{
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    padding: '0 12px',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      height: 44,
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      padding: '0 12px',
                      fontSize: 13,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      height: 44,
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      padding: '0 12px',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
                  Subject
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    padding: '0 12px',
                    fontSize: 13,
                    background: '#FFFFFF',
                  }}
                >
                  <option value="Booking Inquiry">Booking Inquiry</option>
                  <option value="Cancellation / Refund">Cancellation / Refund</option>
                  <option value="Boarding Point Assistance">Boarding Point Assistance</option>
                  <option value="General Feedback">General Feedback</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
                  Your Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry or booking reference number..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    padding: '12px',
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#F5222D',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  height: 46,
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(245, 34, 45, 0.35)',
                  transition: 'background 0.15s ease',
                }}
              >
                <Send size={15} />
                <span>{loading ? 'Sending Message...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
