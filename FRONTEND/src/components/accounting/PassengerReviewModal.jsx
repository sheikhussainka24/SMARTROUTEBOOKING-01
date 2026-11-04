/**
 * SMART ROUTE — Passenger Verified Review Submission Modal
 * Module 11: 1-5 Star Ratings, cleanliness, comfort, punctuality, staff, written comments, complaint categories
 */

import React, { useState } from 'react';
import accountingApi from '../../services/accountingService.js';
import { Star, MessageSquare, AlertTriangle, CheckCircle, X } from 'lucide-react';

const COMPLAINT_CATEGORIES = [
  { id: 'none', label: 'None (Positive / Neutral Trip)' },
  { id: 'ac_issue', label: 'AC Cooling / Heating Issue' },
  { id: 'delays', label: 'Trip Delay / Punctuality Concern' },
  { id: 'staff_rude', label: 'Driver / Cleaner Staff Behaviour' },
  { id: 'seat_broken', label: 'Seat / Berth Condition Issue' },
  { id: 'hygiene', label: 'Cleanliness / Washroom Hygiene' },
  { id: 'luggage_lost', label: 'Luggage / Cargo Baggage Concern' },
];

export default function PassengerReviewModal({ booking, onClose, onSuccess }) {
  const [ratings, setRatings] = useState({
    overall: 5,
    cleanliness: 5,
    seat_comfort: 5,
    punctuality: 5,
    staff_behaviour: 5,
  });
  const [reviewText, setReviewText] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStarClick = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const res = await accountingApi.submitReview({
        bookingId: booking.id,
        pnrNumber: booking.pnr_number,
        ratings,
        reviewText,
        complaintCategory,
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.data.review);
        if (onClose) onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStarSelector = (category, currentVal, label) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 13, color: '#24152D', fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(category, star)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <Star
              size={18}
              fill={star <= currentVal ? '#D97706' : '#E5E7EB'}
              color={star <= currentVal ? '#D97706' : '#E5E7EB'}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: 24,
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#24152D' }}>
              Rate Your Journey
            </h3>
            <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 2 }}>
              Verified Booking PNR: <strong>{booking.pnr_number}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#8A7A8F' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Star Category Ratings */}
          <div style={{ background: '#FDFBFC', border: '1px solid #F4ECF0', padding: 14, borderRadius: 10 }}>
            {renderStarSelector('overall', ratings.overall, 'Overall Journey Rating')}
            {renderStarSelector('cleanliness', ratings.cleanliness, 'Bus Cleanliness & Hygiene')}
            {renderStarSelector('seat_comfort', ratings.seat_comfort, 'Seat & Berth Comfort')}
            {renderStarSelector('punctuality', ratings.punctuality, 'Punctuality & Timeliness')}
            {renderStarSelector('staff_behaviour', ratings.staff_behaviour, 'Staff & Driver Politeness')}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Structured Complaint Category (Optional)
            </label>
            <select
              value={complaintCategory}
              onChange={(e) => setComplaintCategory(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
            >
              {COMPLAINT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
              Written Feedback (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Tell other passengers about your experience with this bus service..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ border: '1px solid #E7D7E0', background: '#FFF', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                border: 'none',
                background: 'var(--sr-primary, #C13D78)',
                color: '#FFF',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Submitting...' : 'Submit Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
