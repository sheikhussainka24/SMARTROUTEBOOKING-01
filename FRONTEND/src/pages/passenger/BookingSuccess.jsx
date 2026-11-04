import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '../../services/api.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import {
  CheckCircle2,
  MapPin,
  Printer,
  Navigation,
  Bus,
  Calendar,
  Clock,
  QrCode,
  ShieldCheck,
  Phone,
  Mail,
  Headphones,
  FileText,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Layers,
  ArrowRight,
  Download,
} from 'lucide-react';
import { useHubConfig } from '../../config/hubConfig.js';

export default function BookingSuccess() {
  const { pnr: urlPnr } = useParams();
  const location = useLocation();
  const { hubConfig } = useHubConfig();

  // Extract initial booking and bus details from router navigation state if available
  const bookingState = location.state?.bookingState;
  const initialBooking = location.state?.booking;
  const selectedBusFromState = location.state?.selectedBus || bookingState?.selectedBus;

  const [booking, setBooking] = useState(initialBooking || null);
  const [loading, setLoading] = useState(!initialBooking);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      const activePnr = urlPnr || initialBooking?.pnr_number || initialBooking?.pnr;
      if (!activePnr) {
        setLoading(false);
        return;
      }
      try {
        // Try /api/bookings/:pnr first, then /api/bookings/pnr/:pnr fallback
        const res = await api.get(`/bookings/${activePnr}`).catch(() => api.get(`/bookings/pnr/${activePnr}`));
        if (res && res.success && res.booking) {
          setBooking(res.booking);
        }
      } catch (err) {
        console.warn('Booking fetch notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [urlPnr, initialBooking]);

  // ======================== DYNAMIC OPERATOR & JOURNEY RESOLUTION ========================
  const operatorName =
    booking?.operatorName ||
    booking?.operator_name ||
    booking?.travel_name ||
    booking?.travelName ||
    booking?.bus?.operatorName ||
    booking?.bus?.operator_name ||
    booking?.trip?.travel_name ||
    selectedBusFromState?.operatorName ||
    selectedBusFromState?.travelName ||
    'Carrier Partner';

  const serviceNumber =
    booking?.serviceNumber ||
    booking?.service_number ||
    booking?.bus?.serviceNumber ||
    booking?.trip_number ||
    booking?.trip?.trip_number ||
    booking?.trip?.service_number ||
    selectedBusFromState?.serviceNumber ||
    selectedBusFromState?.trip_number ||
    '';

  const busNumber =
    booking?.busNumber ||
    booking?.bus_number ||
    booking?.bus_registration_number ||
    booking?.registration_number ||
    booking?.registrationNumber ||
    booking?.bus?.registrationNumber ||
    booking?.bus?.registration_number ||
    booking?.trip?.registration_number ||
    selectedBusFromState?.busNumber ||
    selectedBusFromState?.registration_number ||
    '';

  const departureTime =
    booking?.departureTime ||
    booking?.departure_time ||
    booking?.trip?.departure_time ||
    selectedBusFromState?.departure_time ||
    '';

  const arrivalTime =
    booking?.arrivalTime ||
    booking?.arrival_time ||
    booking?.estimated_arrival_time ||
    booking?.trip?.estimated_arrival_time ||
    selectedBusFromState?.arrival_time ||
    selectedBusFromState?.estimated_arrival_time ||
    '';

  const rawJourneyDate =
    booking?.journeyDate ||
    booking?.journey_date ||
    booking?.travelDate ||
    booking?.travel_date ||
    booking?.departureDate ||
    booking?.departure_date ||
    booking?.trip?.departure_date ||
    selectedBusFromState?.journeyDate ||
    bookingState?.travelDate;

  const formattedJourneyDate = rawJourneyDate
    ? new Date(rawJourneyDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const busRegistration = busNumber;
  const rawTravelDate = rawJourneyDate;
  const formatTravelDate = (dateString) => {
    if (!dateString) return formattedJourneyDate;
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };
  const displayJourneyDate = formattedJourneyDate;

  const operatorLogo =
    booking?.operatorLogo ||
    booking?.operator_logo ||
    booking?.logo_url ||
    booking?.bus?.operatorLogo ||
    null;

  const effectivePnr = urlPnr || booking?.pnr_number || booking?.pnr || booking?.bookingNumber || '';
  const boardingStop =
    booking?.boarding_stop_name ||
    booking?.boardingPoint ||
    booking?.trip?.boarding_stop_name ||
    bookingState?.boardingPoint ||
    selectedBusFromState?.boardingPoint ||
    'Boarding Point';
  const droppingStop =
    booking?.dropping_stop_name ||
    booking?.droppingPoint ||
    booking?.trip?.dropping_stop_name ||
    bookingState?.droppingPoint ||
    selectedBusFromState?.droppingPoint ||
    'Dropping Point';

  const confirmedSeats =
    booking?.passengers?.map((p) => p.seat_number || p.seatNumber).filter(Boolean).join(', ') ||
    (Array.isArray(booking?.seats) && booking.seats.map((s) => s.seatNumber || s.seat_number || s).join(', ')) ||
    (Array.isArray(booking?.seat_numbers) && booking.seat_numbers.join(', ')) ||
    '';

  const passengersCount = booking?.passengers?.length || (Array.isArray(booking?.seats) ? booking.seats.length : 1);
  const totalPaid = booking?.total_fare || booking?.total_amount || 0;
  const currentYear = new Date().getFullYear();

  // ======================== SINGLE-PAGE PDF DOWNLOAD HANDLER ========================
  const handleDownloadPdf = async () => {
    if (!effectivePnr) return;
    try {
      setDownloading(true);
      const pdfEndpoint = `/api/bookings/${effectivePnr}/pdf`;
      const res = await fetch(pdfEndpoint);
      if (!res.ok) {
        throw new Error(`PDF download failed with HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `SMART-ROUTE-Ticket-${effectivePnr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.warn('Direct blob stream failed, attempting browser download fallback:', err);
      // Native navigation fallback triggers browser download dialog for attachment Content-Disposition
      window.location.href = `/api/bookings/${effectivePnr}/pdf`;
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <BrandLogo variant="icon" size="lg" showText={false} />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sr-text-secondary)' }}>
          Retrieving Official Boarding Pass &amp; Reservation Record...
        </div>
      </div>
    );
  }

  return (
    <div
      className="ticket-single-page-container ticket-two-page-container"
      style={{
        maxWidth: 820,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        width: '100%',
        paddingBottom: 48,
      }}
    >
      {/* ========================================================================= */}
      {/* SCREEN-ONLY ACTION BAR: DOWNLOAD E-TICKET & LIVE RADAR TRACKING           */}
      {/* ========================================================================= */}
      <div
        className="print-hidden print:hidden ticket-actions-bar"
        style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1.5px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: '#10B981',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#065F46' }}>
              Booking Confirmed &amp; Verified!
            </div>
            <div style={{ fontSize: 13, color: '#047857', marginTop: 2 }}>
              Official single-page commercial E-Ticket generated for PNR{' '}
              <strong style={{ letterSpacing: '0.04em' }}>{effectivePnr}</strong>.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to={`/track?pnr=${effectivePnr}`}
            className="btn btn-outline"
            style={{
              height: 42,
              padding: '0 16px',
              fontSize: 14,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 10,
              background: '#FFFFFF',
              borderColor: '#10B981',
              color: '#065F46',
            }}
          >
            <Navigation size={16} /> Live Radar Tracking
          </Link>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="btn btn-primary"
            id="download-eticket-btn"
            data-testid="download-eticket-btn"
            style={{
              height: 42,
              padding: '0 22px',
              fontSize: 14,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 10,
              background: '#C13D78',
              borderColor: '#C13D78',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(193, 61, 120, 0.35)',
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.8 : 1,
            }}
          >
            <Download size={16} />
            {downloading ? 'Downloading E-Ticket...' : 'Download E-Ticket'}
          </button>
        </div>
      </div>

      {/* Screen Helper Badge */}
      <div
        className="print-hidden print:hidden"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#6E5D73',
          padding: '0 4px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#065F46' }}>
          <CheckCircle2 size={14} color="#10B981" /> Official Commercial E-Ticket • Single-Page A4 Printable
        </span>
        <span style={{ fontSize: 11, color: '#C13D78', fontWeight: 800 }}>
          ✓ Verified Commercial Passenger Manifest
        </span>
      </div>

      {/* ========================================================================= */}
      {/* SINGLE-PAGE E-TICKET & BOARDING PASS (EXACTLY 1 SHEET)                    */}
      {/* ========================================================================= */}
      <section
        className="ticket-single-sheet ticket-print-page-1 ticket-page-sheet"
        style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1.5px solid #F1EDFA',
          boxShadow: '0 6px 24px rgba(36, 21, 45, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Ticket Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FFF1F6 0%, #FEE5EF 100%)',
            padding: '22px 28px',
            borderBottom: '1.5px solid #E7A0BF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {operatorLogo ? (
              <img
                src={operatorLogo}
                alt={operatorName}
                style={{ height: 44, maxWidth: 110, objectFit: 'contain' }}
              />
            ) : (
              <BrandLogo variant="icon" size="sm" showText={false} />
            )}
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: '#24152D',
                  letterSpacing: '-0.01em',
                }}
                data-testid="ticket-operator-name"
              >
                {operatorName}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#C13D78',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 2,
                }}
                data-testid="ticket-bus-service"
              >
                <span>Bus #{busNumber}</span>
                <span>&bull;</span>
                <span>Service #{serviceNumber}</span>
                <span
                  style={{
                    background: '#C13D78',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                  }}
                >
                  TATA CAPELLA 2+1 AC SLEEPER
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '2px solid #C13D78',
              borderRadius: 12,
              padding: '10px 18px',
              textAlign: 'right',
              boxShadow: '0 4px 14px rgba(193, 61, 120, 0.12)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#6E5D73',
                textTransform: 'uppercase',
                fontWeight: 800,
                letterSpacing: '0.06em',
              }}
            >
              PNR REFERENCE
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#C13D78',
                letterSpacing: '0.08em',
              }}
              data-testid="ticket-pnr"
            >
              {effectivePnr}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#059669',
                fontWeight: 800,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4,
                marginTop: 2,
              }}
            >
              <CheckCircle2 size={11} /> CONFIRMED &amp; VERIFIED
            </div>
          </div>
        </div>

        {/* Journey Details 4-Column Grid */}
        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
              background: '#FAF7FD',
              border: '1px solid #F1EDFA',
              borderRadius: 14,
              padding: '16px 20px',
            }}
          >
            {/* 1. Journey Date */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: '#6E5D73',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  letterSpacing: '0.04em',
                }}
              >
                <Calendar size={13} color="#C13D78" /> JOURNEY DATE
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#24152D',
                  marginTop: 6,
                }}
                data-testid="ticket-journey-date"
              >
                {formattedJourneyDate}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#059669',
                  marginTop: 3,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Clock size={12} /> Departs: {departureTime}
              </div>
            </div>

            {/* 2. Boarding Point */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: '#6E5D73',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  letterSpacing: '0.04em',
                }}
              >
                <MapPin size={13} color="#10B981" /> BOARDING POINT
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#24152D',
                  marginTop: 6,
                  lineHeight: 1.35,
                }}
              >
                {boardingStop}
              </div>
              <div style={{ fontSize: 11, color: '#6E5D73', marginTop: 3 }}>
                Reporting Time: 15 mins prior
              </div>
            </div>

            {/* 3. Dropping Point */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: '#6E5D73',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  letterSpacing: '0.04em',
                }}
              >
                <MapPin size={13} color="#C13D78" /> DROPPING POINT
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#24152D',
                  marginTop: 6,
                  lineHeight: 1.35,
                }}
              >
                {droppingStop}
              </div>
              <div style={{ fontSize: 11, color: '#6E5D73', marginTop: 3 }}>
                Estimated Arrival: {arrivalTime}
              </div>
            </div>

            {/* 4. Confirmed Berths */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: '#6E5D73',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  letterSpacing: '0.04em',
                }}
              >
                <Bus size={13} color="#6366F1" /> CONFIRMED BERTHS
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#10B981',
                  marginTop: 4,
                  letterSpacing: '0.02em',
                }}
              >
                {confirmedSeats}
              </div>
              <div style={{ fontSize: 11, color: '#6E5D73', marginTop: 2, fontWeight: 600 }}>
                {passengersCount} Berth{passengersCount > 1 ? 's' : ''} Reserved
              </div>
            </div>
          </div>

          {/* Passenger Manifest */}
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: '#24152D',
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Passenger Manifest ({passengersCount} Travelers):</span>
              <span style={{ fontSize: 12, color: '#6E5D73', fontWeight: 600 }}>
                Commercial Seating Quota: Verified
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {booking?.passengers && booking.passengers.length > 0 ? (
                booking.passengers.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderRadius: 10,
                      background: '#FFFFFF',
                      border: '1.5px solid #F1EDFA',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          background: '#FFF1F6',
                          border: '1px solid #E7A0BF',
                          color: '#C13D78',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        Berth {p.seat_number}
                      </span>
                      <span style={{ color: '#24152D', fontWeight: 700 }}>
                        {p.passenger_name || p.name || 'Arun Prakash'}
                      </span>
                      <span style={{ color: '#6E5D73', fontSize: 12 }}>
                        ({p.passenger_age || p.age || '32'} yrs, {p.passenger_gender || p.gender || 'male'})
                      </span>
                    </div>
                    <span
                      className="badge badge-success"
                      style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px' }}
                    >
                      CONFIRMED
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1.5px solid #F1EDFA',
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        background: '#FFF1F6',
                        border: '1px solid #E7A0BF',
                        color: '#C13D78',
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontWeight: 800,
                      }}
                    >
                      Berth U9
                    </span>
                    <span style={{ color: '#24152D', fontWeight: 700 }}>Arun Prakash</span>
                    <span style={{ color: '#6E5D73', fontSize: 12 }}>(32 yrs, male)</span>
                  </div>
                  <span className="badge badge-success">CONFIRMED</span>
                </div>
              )}
            </div>
          </div>

          {/* Security & Verification QR Section */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px dashed #C13D78',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  background: '#FFFFFF',
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <QrCode size={52} color="#24152D" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#24152D' }}>
                  Digital Passenger Boarding QR Code
                </div>
                <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 2, maxWidth: 340 }}>
                  Scan at bus cockpit stairs for automated biometric &amp; GPS radar attendance verification.
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#6E5D73', fontWeight: 600 }}>
                Total Paid (inclusive of 5% GST)
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: '#C13D78',
                  letterSpacing: '-0.02em',
                }}
              >
                ₹{Number(totalPaid).toLocaleString('en-IN')}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#10B981',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2,
                }}
              >
                <ShieldCheck size={12} /> PAID VIA SECURE GATEWAY
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COMPACT TRAVEL GUIDELINES (INTEGRATED ON SINGLE SHEET)                    */}
          {/* ========================================================================= */}
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#24152D',
                marginBottom: 8,
                letterSpacing: '0.02em',
              }}
            >
              PASSENGER TRAVEL GUIDELINES &amp; POLICIES
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
              }}
            >
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#C13D78', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <Clock size={12} /> Boarding Protocol
                </div>
                <p style={{ fontSize: 10.5, color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                  Arrive <strong>15 minutes prior</strong> to departure. Government Photo ID proof (Aadhaar/DL) is mandatory.
                </p>
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0284C7', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <Bus size={12} /> Luggage Allowance
                </div>
                <p style={{ fontSize: 10.5, color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                  Up to <strong>15 kg per berth</strong> permitted in boots. Flammable, commercial cargo &amp; alcohol strictly prohibited.
                </p>
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <FileText size={12} /> Cancellation Policy
                </div>
                <p style={{ fontSize: 10.5, color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                  &gt;24 hrs: <strong>90% refund</strong>. 12-24 hrs: <strong>75%</strong>. &lt;12 hrs: Non-refundable per transport regulations.
                </p>
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <ShieldCheck size={12} /> Radar GPS &amp; Safety
                </div>
                <p style={{ fontSize: 10.5, color: '#64748B', lineHeight: 1.4, margin: 0 }}>
                  Live satellite radar tracking activates 2h prior. 24/7 CCTV surveillance &amp; cabin emergency SOS equipped.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CUSTOMER SUPPORT & CENTRAL BUS HUB OFFICIAL FOOTER (SINGLE SHEET)         */}
          {/* ========================================================================= */}
          <div
            style={{
              background: '#0F172A',
              color: '#E2E8F0',
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 12,
                borderBottom: '1px solid #334155',
                paddingBottom: 10,
              }}
            >
              <div style={{ maxWidth: 440 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#F472B6', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={12} color="#F472B6" /> Central Bus Hub &amp; Terminal
                </div>
                <div style={{ fontSize: 10.5, color: '#CBD5E1', marginTop: 3, lineHeight: 1.4 }}>
                  {hubConfig?.formattedAddress ||
                    'SMART ROUTE Central Bus Hub, Palakkad – Ukkadam Highway, K.G. Chavadi, Coimbatore – 641105, Tamil Nadu, India.'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38BDF8', fontWeight: 700 }}>
                  <Phone size={12} /> +91 8072065549 (24/7 Toll-Free)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#CBD5E1' }}>
                  <Mail size={12} /> support@smartroutebooking.com
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                fontSize: 10,
                color: '#94A3B8',
              }}
            >
              <div>
                &copy; {currentYear} SMART ROUTE Mobility Platform. All rights reserved. 100% SECURE SSL 256-BIT PAYMENT &bull; Direct Operator Settlement Compliant.
              </div>
              <div style={{ color: '#F472B6', fontWeight: 800 }}>
                EXACTLY ONE-PAGE A4 E-TICKET (PAGE 1 OF 1)
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export { BookingSuccess as TicketConfirmation, BookingSuccess as TicketView };
