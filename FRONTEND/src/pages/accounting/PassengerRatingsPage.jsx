/**
 * SMART ROUTE — Passenger Ratings & Bus Reviews Engine
 * Module 11: Star ratings, cleanliness, comfort, punctuality, staff, complaints, and moderation
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import accountingApi from '../../services/accountingService.js';
import {
  Star,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Filter,
  Shield,
  ThumbsUp,
  Bus,
} from 'lucide-react';

export default function PassengerRatingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [reviews, setReviews] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [statusFilter, setStatusFilter] = useState('published');
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReviewsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [revRes, busRes] = await Promise.all([
        accountingApi.getReviews({ busId: selectedBusId, status: statusFilter }),
        accountingApi.getBusesAccounting({ dateRange: 'all' }),
      ]);

      if (revRes.success) {
        setReviews(revRes.data || []);
      }
      if (busRes.success) {
        setBuses(busRes.data || []);
      }

      if (selectedBusId) {
        const sumRes = await accountingApi.getBusRatingSummary(selectedBusId);
        if (sumRes.success) setRatingSummary(sumRes.data);
      } else {
        setRatingSummary(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, [selectedBusId, statusFilter]);

  const totalReviews = reviews.length;
  const avgOverall = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.overall_rating, 0) / totalReviews).toFixed(1)
    : null;

  const starDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const s = Math.min(5, Math.max(1, r.overall_rating));
    starDistribution[s] = (starDistribution[s] || 0) + 1;
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', color: '#24152D' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#24152D' }}>
            Passenger Ratings & Verified Bus Reviews
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
            Verified post-trip feedback: Cleanliness, seat comfort, punctuality, staff behavior, and complaint follow-up
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13, background: '#FFF' }}
          >
            <option value="">All Fleet Buses</option>
            {buses.map((b) => (
              <option key={b.bus_id || b.id} value={b.bus_id || b.id}>
                {b.registration_number} — {b.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13, background: '#FFF' }}
          >
            <option value="published">Published Reviews</option>
            <option value="flagged">Flagged / Complaints</option>
            <option value="all">All Submissions</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Aggregate Overview Banner */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7D7E0',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        {/* Star Rating Metric */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              background: '#FFF1F6',
              border: '2px solid #E7A0BF',
              borderRadius: 16,
              width: 100,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 900, color: '#C13D78', lineHeight: 1 }}>
              {avgOverall || '0.0'}
            </div>
            <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={12}
                  fill={s <= Math.round(Number(avgOverall) || 0) ? '#D97706' : '#E5E7EB'}
                  color={s <= Math.round(Number(avgOverall) || 0) ? '#D97706' : '#E5E7EB'}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#8A7A8F', marginTop: 2 }}>{totalReviews} ratings</div>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#24152D' }}>
              Passenger Satisfaction Index
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#6E5D73', maxWidth: 280 }}>
              Calculated exclusively from verified completed bookings. Unverified or duplicate submissions are blocked.
            </p>
          </div>
        </div>

        {/* 1 to 5 Star Distribution Bars */}
        <div>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = starDistribution[star] || 0;
            const pct = totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(0) : 0;
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, fontSize: 12 }}>
                <span style={{ width: 44, color: '#6E5D73', fontWeight: 600 }}>{star} Stars</span>
                <div style={{ flex: 1, background: '#F3F4F6', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      background: star >= 4 ? '#10B981' : (star === 3 ? '#F59E0B' : '#EF4444'),
                      height: '100%',
                    }}
                  />
                </div>
                <span style={{ width: 32, textAlign: 'right', color: '#8A7A8F' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {reviews.length === 0 ? (
          <div style={{ background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 12, padding: 40, textAlign: 'center', color: '#8A7A8F' }}>
            No verified passenger reviews found matching the selected filter.
          </div>
        ) : (
          reviews.map((rev) => {
            const bus = buses.find((b) => (b.bus_id || b.id) === rev.bus_id);
            return (
              <div
                key={rev.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E7D7E0',
                  borderRadius: 12,
                  padding: 18,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#24152D' }}>{rev.passenger_name}</span>
                      <span style={{ background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                        PNR: {rev.pnr_number} (Verified)
                      </span>
                      {rev.complaint_category && rev.complaint_category !== 'none' && (
                        <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                          Complaint: {rev.complaint_category.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 3 }}>
                      Bus: {bus?.registration_number || rev.bus_id} ({bus?.name || 'Verified Fleet'}) • {new Date(rev.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        fill={s <= rev.overall_rating ? '#D97706' : '#E5E7EB'}
                        color={s <= rev.overall_rating ? '#D97706' : '#E5E7EB'}
                      />
                    ))}
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#D97706', marginLeft: 4 }}>
                      {rev.overall_rating}.0
                    </span>
                  </div>
                </div>

                {/* Subcategory Scores */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, background: '#FDFBFC', padding: '8px 12px', borderRadius: 8, fontSize: 11, color: '#6E5D73', marginBottom: 10 }}>
                  <span>Cleanliness: <strong>{rev.cleanliness_rating} ★</strong></span>
                  <span>Seat Comfort: <strong>{rev.seat_comfort_rating} ★</strong></span>
                  <span>Punctuality: <strong>{rev.punctuality_rating} ★</strong></span>
                  <span>Staff Behavior: <strong>{rev.staff_behaviour_rating} ★</strong></span>
                </div>

                {/* Written Review */}
                {rev.review_text && (
                  <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                    "{rev.review_text}"
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
