import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useSocket, SocketStatusBadge } from '../../context/SocketContext.jsx';
import LiveBusMap from '../../components/maps/LiveBusMap.jsx';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import {
  Search,
  MapPin,
  Bus,
  Radio,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Phone,
  Navigation,
  Compass,
  ArrowRight,
  ShieldCheck,
  Share2,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  Map,
  ListOrdered,
} from 'lucide-react';

export default function LiveTracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialPnr = searchParams.get('pnr') || '';
  const initialTripId = searchParams.get('tripId') || '';

  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [selectedTripId, setSelectedTripId] = useState(initialTripId);
  const [activeTripsList, setActiveTripsList] = useState([]);

  // Loaded tracking state
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'timeline'

  // Time-since-last-update counter
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const lastUpdateTimestampRef = useRef(Date.now());

  const { socket, connected } = useSocket();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch list of active commercial services for the quick-selector
  useEffect(() => {
    async function loadActiveTrips() {
      try {
        const res = await api.get('/trips/active/live-tracking');
        if (res.success && res.trips) {
          setActiveTripsList(res.trips);
        }
      } catch (e) {
        // Fallback
      }
    }
    loadActiveTrips();
  }, []);

  // Fetch Tracking Data (by PNR or Trip ID)
  const fetchTracking = useCallback(async (pnrCode = '', tripId = '', isSilentRefresh = false) => {
    if (!pnrCode && !tripId) return;

    if (!isSilentRefresh) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      let res = null;
      if (pnrCode) {
        res = await api.get(`/bookings/pnr/${encodeURIComponent(pnrCode.trim().toUpperCase())}/tracking`);
      } else if (tripId) {
        res = await api.get(`/trips/${encodeURIComponent(tripId)}/tracking`);
      }

      if (res && res.success && res.tracking) {
        setTrackingData(res.tracking);
        lastUpdateTimestampRef.current = Date.now();
        setSecondsSinceUpdate(0);

        if (res.tracking.trip?.id) {
          setSelectedTripId(res.tracking.trip.id);
        }
      } else {
        setError(res?.error || 'Tracking details unavailable for this reference.');
      }
    } catch (err) {
      console.warn('Tracking fetch error:', err.message);
      setError(err.message || 'Error loading live tracking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load on mount or query param change
  useEffect(() => {
    if (initialPnr) {
      fetchTracking(initialPnr, '');
    } else if (initialTripId) {
      fetchTracking('', initialTripId);
    } else if (activeTripsList && activeTripsList.length > 0) {
      fetchTracking('', activeTripsList[0].id);
    }
  }, [initialPnr, initialTripId, fetchTracking, activeTripsList]);

  // Periodic automatic refresh every 10 seconds to catch live updates & maintain accuracy
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (trackingData?.booking?.pnr) {
        fetchTracking(trackingData.booking.pnr, '', true);
      } else if (trackingData?.trip?.id) {
        fetchTracking('', trackingData.trip.id, true);
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [trackingData, fetchTracking]);

  // Seconds elapsed ticker for live telemetry display
  useEffect(() => {
    const ticker = setInterval(() => {
      setSecondsSinceUpdate(Math.round((Date.now() - lastUpdateTimestampRef.current) / 1000));
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // Socket listener to update live telemetry and seconds counter immediately
  const handleLiveTelemetryUpdate = useCallback((newTelemetry) => {
    lastUpdateTimestampRef.current = Date.now();
    setSecondsSinceUpdate(0);
    setTrackingData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        liveGps: {
          ...prev.liveGps,
          hasLiveGps: true,
          latitude: newTelemetry.latitude,
          longitude: newTelemetry.longitude,
          speed: newTelemetry.speed,
          heading: newTelemetry.heading,
          next_stop_name: newTelemetry.next_stop_name || prev.liveGps?.next_stop_name,
          eta: newTelemetry.eta || prev.liveGps?.eta,
          isStale: false,
          status: 'active',
          recorded_at: new Date().toISOString(),
        },
      };
    });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!pnrInput.trim()) return;
    setSearchParams({ pnr: pnrInput.trim().toUpperCase() });
    fetchTracking(pnrInput.trim().toUpperCase(), '');
  };

  const handleSelectService = (tripId) => {
    setSelectedTripId(tripId);
    setPnrInput('');
    setSearchParams({ tripId });
    fetchTracking('', tripId);
  };

  const handleShareTracking = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Live tracking link copied to clipboard!');
    }
  };

  const hasLiveGps = Boolean(trackingData?.liveGps?.hasLiveGps);
  const isStale = Boolean(trackingData?.liveGps?.isStale);
  const currentSpeed = trackingData?.liveGps?.speed || 0;
  const nextStopName = trackingData?.liveGps?.next_stop_name || (trackingData?.stops && trackingData.stops[1]?.name) || 'En Route';
  const etaText = trackingData?.liveGps?.eta || 'On Schedule';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1240, margin: '0 auto', width: '100%', padding: '0 12px' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: toast.type === 'error' ? '#EF4444' : '#10B981',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <CheckCircle2 size={16} /> {toast.msg}
        </div>
      )}

      {/* Top Search & Active Service Selector Bar */}
      <div className="sr-card" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Radio size={12} /> LIVE GPS RADAR
              </span>
              <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>
                Real Road Telemetry &bull; Where Is My Train Experience
              </span>
            </div>
            <h1 style={{ fontSize: 22, color: 'var(--sr-text-primary)', margin: '6px 0 2px', fontWeight: 800 }}>
              Live Bus Transit Radar
            </h1>
          </div>

          {/* Quick PNR Input Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--sr-text-secondary)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Enter PNR (e.g. SR4102)"
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
                style={{ paddingLeft: 32, width: 170, textTransform: 'uppercase', fontSize: 13 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '8px 14px', fontSize: 13 }}>
              Track
            </button>

            {/* Quick Active Trips Dropdown */}
            <select
              className="input-field"
              value={selectedTripId}
              onChange={(e) => handleSelectService(e.target.value)}
              style={{ fontSize: 13, width: 200 }}
            >
              <option value="">-- Active Commercial Buses --</option>
              {activeTripsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.trip_number || t.id} ({t.source} ➔ {t.destination})
                </option>
              ))}
            </select>
          </form>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)', fontWeight: 600 }}>Quick Sample PNRs:</span>
          {[
            { label: 'SR4102 (Flagship Pioneer)', pnr: 'SR4102' },
            { label: 'VV8820 (BlueLine Express)', pnr: 'VV8820' },
            { label: 'SR4103 (Kannan Family)', pnr: 'SR4103' },
          ].map((chip) => (
            <button
              key={chip.pnr}
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setPnrInput(chip.pnr);
                setSearchParams({ pnr: chip.pnr });
                fetchTracking(chip.pnr, '');
              }}
              style={{ padding: '3px 9px', fontSize: 11, borderRadius: 6 }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !trackingData && (
        <div style={{ textAlign: 'center', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <BrandLogo variant="icon" size="lg" showText={false} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--sr-text-secondary)' }}>
            Connecting to coach GPS satellite radar & telemetry stream...
          </div>
        </div>
      )}

      {error && !trackingData && (
        <div className="sr-card" style={{ padding: 24, textAlign: 'center', color: '#EF4444' }}>
          <AlertCircle size={28} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>{error}</div>
          <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 4 }}>
            Verify the PNR code or select an active trip from the dropdown above.
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (pnrInput) fetchTracking(pnrInput, '');
              else if (selectedTripId) fetchTracking('', selectedTripId);
              else if (activeTripsList && activeTripsList.length > 0) fetchTracking('', activeTripsList[0].id);
            }}
            style={{ marginTop: 12, padding: '6px 16px', fontSize: 13 }}
          >
            <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry Connection
          </button>
        </div>
      )}

      {trackingData && (
        <>
          {/* ==================== "WHERE IS MY TRAIN" VEHICLE HEADER ==================== */}
          <div className="sr-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              {/* Bus & Journey Identification */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-primary" style={{ fontWeight: 800 }}>
                    {trackingData.bus?.registration_number || 'TN-38-SR-0001'}
                  </span>
                  <span className="badge badge-cyan">
                    {trackingData.trip?.trip_number || 'SR-101'}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--sr-text-secondary)' }}>
                    {trackingData.travel?.name || 'SMART ROUTE Travels'} &bull; {trackingData.bus?.bus_type || '2+1 A/C Sleeper'}
                  </span>
                </div>

                <h2 style={{ fontSize: 22, color: 'var(--sr-text-primary)', margin: '8px 0 4px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>{trackingData.route?.source || 'Coimbatore'}</span>
                  <ArrowRight size={18} color="var(--sr-cyan)" />
                  <span>{trackingData.route?.destination || 'Tenkasi'}</span>
                </h2>

                <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span>Route Distance: <strong style={{ color: 'var(--sr-text-primary)' }}>{trackingData.route?.distance_km || 345} km</strong></span>
                  <span>&bull;</span>
                  <span>Scheduled Departure: <strong style={{ color: 'var(--sr-cyan)' }}>{trackingData.trip?.departure_time || '21:00'}</strong></span>
                  <span>&bull;</span>
                  <span>Driver: <strong style={{ color: 'var(--sr-text-primary)' }}>{trackingData.driver?.name || 'Muthu Krishnan'}</strong></span>
                </div>
              </div>

              {/* Live Status Badge & Header Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                {/* Live Status Indicator */}
                <div style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: hasLiveGps
                    ? isStale
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(148, 163, 184, 0.12)',
                  color: hasLiveGps
                    ? isStale
                      ? '#F59E0B'
                      : '#10B981'
                    : 'var(--sr-text-secondary)',
                  border: `1px solid ${
                    hasLiveGps
                      ? isStale
                        ? 'rgba(245, 158, 11, 0.3)'
                        : 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(148, 163, 184, 0.2)'
                  }`,
                }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: hasLiveGps ? (isStale ? '#F59E0B' : '#10B981') : '#94A3B8',
                      boxShadow: hasLiveGps ? `0 0 8px ${isStale ? '#F59E0B' : '#10B981'}` : 'none',
                    }}
                  />
                  <span>
                    {hasLiveGps
                      ? isStale
                        ? `Signal Stale (Updated ${secondsSinceUpdate}s ago)`
                        : `Live GPS Broadcasting • ${currentSpeed} km/h`
                      : 'Coach on Terminal Standby'}
                  </span>
                </div>

                {/* Refresh and Share Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      if (trackingData.booking?.pnr) fetchTracking(trackingData.booking.pnr, '', true);
                      else if (trackingData.trip?.id) fetchTracking('', trackingData.trip.id, true);
                    }}
                    disabled={refreshing}
                    style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
                    {refreshing ? 'Updating...' : `Updated ${secondsSinceUpdate}s ago`}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleShareTracking}
                    style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    title="Share Live Tracking Link"
                  >
                    <Share2 size={13} /> Share
                  </button>
                </div>
              </div>
            </div>

            {/* Passenger Booking Callout (if passenger booked this bus) */}
            {trackingData.booking && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                background: 'rgba(0, 242, 254, 0.06)',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={20} color="var(--sr-cyan)" />
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Confirmed Passenger Reservation
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                      PNR: <span style={{ color: 'var(--sr-cyan)' }}>{trackingData.booking.pnr}</span> &bull; {trackingData.booking.contact_name || 'Passenger'} &bull; Seats: <span style={{ color: 'var(--sr-emerald)' }}>{trackingData.booking.seat_numbers}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--sr-text-secondary)' }}>Pickup: </span>
                    <strong style={{ color: 'var(--sr-emerald)' }}>{trackingData.booking.boarding_stop_name || 'Omni Bus Stand'}</strong>
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--sr-text-secondary)' }}>Drop: </span>
                    <strong style={{ color: '#EF4444' }}>{trackingData.booking.dropping_stop_name || 'Tenkasi'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Next Stop Highlight Banner */}
            <div style={{
              marginTop: 14,
              padding: '12px 18px',
              background: 'var(--sr-bg-inset)',
              border: '1px solid var(--sr-border-card)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  background: 'rgba(0, 242, 254, 0.15)',
                  padding: 8,
                  borderRadius: 8,
                  color: 'var(--sr-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Next Route Milestone
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--sr-text-primary)' }}>
                    {nextStopName}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>Estimated Stop ETA</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sr-emerald)' }}>
                    {etaText}
                  </div>
                </div>

                {hasLiveGps && (
                  <div style={{ borderLeft: '1px solid var(--sr-border-subtle)', paddingLeft: 18 }}>
                    <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>GPS Speed</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#F59E0B' }}>
                      {currentSpeed} km/h
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <div style={{
                display: 'flex',
                gap: 4,
                background: 'var(--sr-bg-root)',
                padding: 4,
                borderRadius: 8,
                border: '1px solid var(--sr-border-card)',
              }}>
                <button
                  type="button"
                  className={`btn ${viewMode === 'split' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setViewMode('split')}
                  style={{ padding: '4px 10px', fontSize: 11 }}
                >
                  <Layers size={13} style={{ marginRight: 4 }} /> Split View
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setViewMode('map')}
                  style={{ padding: '4px 10px', fontSize: 11 }}
                >
                  <Map size={13} style={{ marginRight: 4 }} /> Map Only
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === 'timeline' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setViewMode('timeline')}
                  style={{ padding: '4px 10px', fontSize: 11 }}
                >
                  <ListOrdered size={13} style={{ marginRight: 4 }} /> Timeline
                </button>
              </div>
            </div>
          </div>

          {/* ==================== MAIN CONTENT: MAP + WHERE IS MY TRAIN TIMELINE ==================== */}
          <div
            className="live-tracking-split-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'map' ? '1fr' : viewMode === 'timeline' ? '1fr' : '1.35fr 1fr',
              gap: 20,
            }}
          >
            {/* 1. Live Interactive Transit Map */}
            {viewMode !== 'timeline' && (
              <div>
                <LiveBusMap
                  tripId={trackingData.trip?.id}
                  stops={trackingData.stops || []}
                  initialBusLocation={trackingData.liveGps?.hasLiveGps ? trackingData.liveGps : null}
                  height={viewMode === 'map' ? '650px' : '620px'}
                  boardingStopId={trackingData.booking?.boarding_stop_id}
                  droppingStopId={trackingData.booking?.dropping_stop_id}
                  hasLiveGps={hasLiveGps}
                  isStale={isStale}
                  lastUpdated={trackingData.liveGps?.recorded_at}
                  onTelemetryUpdate={handleLiveTelemetryUpdate}
                />
              </div>
            )}

            {/* 2. Iconic "Where Is My Train" Vertical Stop-by-Stop Track Line */}
            {viewMode !== 'map' && (
              <div className="sr-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', height: viewMode === 'timeline' ? 'auto' : '620px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 16, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Navigation size={16} color="var(--sr-cyan)" /> Route Track & Station Milestones
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                    {trackingData.stops?.length || 0} Scheduled Stops
                  </span>
                </div>

                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  position: 'relative',
                }}>
                  {(trackingData.stops || []).map((stop, index, arr) => {
                    const isFirst = index === 0;
                    const isLast = index === arr.length - 1;
                    const isPassengerPickup = stop.id === trackingData.booking?.boarding_stop_id;
                    const isPassengerDrop = stop.id === trackingData.booking?.dropping_stop_id;
                    const isPassed = Boolean(stop.is_passed);
                    const isCurrent = Boolean(stop.is_current);

                    // Determine if the bus is currently traveling towards this stop
                    const isNextStop = stop.name === nextStopName || stop.stop_name === nextStopName;

                    return (
                      <div key={stop.id || index} style={{ position: 'relative' }}>
                        {/* If bus is moving between previous stop and this next stop, display the moving bus pill */}
                        {isNextStop && hasLiveGps && !isPassed && (
                          <div style={{
                            margin: '4px 0 10px 38px',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: 8,
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            animation: 'pulse 2s infinite',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }}>🚌</span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#F59E0B' }}>
                                  Coach In Transit ({currentSpeed} km/h)
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                                  Approaching {stop.name || stop.stop_name} &bull; ETA {etaText}
                                </div>
                              </div>
                            </div>
                            <span className="badge badge-warning" style={{ fontSize: 10 }}>EN ROUTE</span>
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 14,
                          padding: '10px 0',
                          position: 'relative',
                        }}>
                          {/* Left Column: Scheduled & Estimated Time */}
                          <div style={{ width: 65, textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isPassed ? 'var(--sr-text-secondary)' : isNextStop ? 'var(--sr-cyan)' : 'var(--sr-text-primary)' }}>
                              {stop.scheduled_time || '21:00'}
                            </div>
                            <div style={{ fontSize: 10, color: isPassed ? '#10B981' : isNextStop ? 'var(--sr-cyan)' : 'var(--sr-text-secondary)', fontWeight: 600 }}>
                              {isPassed ? '✓ Passed' : isNextStop ? etaText : 'Scheduled'}
                            </div>
                          </div>

                          {/* Center Track Node and Vertical Line */}
                          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
                            {/* Vertical connecting line */}
                            {!isLast && (
                              <div style={{
                                position: 'absolute',
                                top: 22,
                                bottom: -16,
                                width: 3,
                                background: isPassed
                                  ? '#10B981'
                                  : isNextStop
                                  ? '#F59E0B'
                                  : 'var(--sr-border-card)',
                                zIndex: 1,
                              }} />
                            )}

                            {/* Node icon */}
                            <div style={{
                              width: isNextStop ? 24 : 18,
                              height: isNextStop ? 24 : 18,
                              borderRadius: '50%',
                              background: isPassengerPickup
                                ? '#10B981'
                                : isPassengerDrop
                                ? '#EF4444'
                                : isPassed
                                ? '#10B981'
                                : isNextStop
                                ? '#F59E0B'
                                : 'var(--sr-bg-root)',
                              border: `2px solid ${
                                isPassengerPickup
                                  ? '#10B981'
                                  : isPassengerDrop
                                  ? '#EF4444'
                                  : isPassed
                                  ? '#10B981'
                                  : isNextStop
                                  ? '#F59E0B'
                                  : 'var(--sr-border-card)'
                              }`,
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isNextStop ? '0 0 10px #F59E0B' : 'none',
                              color: '#fff',
                              fontSize: 9,
                              fontWeight: 800,
                            }}>
                              {isPassed ? '✓' : isNextStop ? '●' : ''}
                            </div>
                          </div>

                          {/* Right Column: Stop Name, City, Platform & Distance */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{
                                fontSize: 14,
                                fontWeight: isPassengerPickup || isPassengerDrop || isNextStop ? 800 : 600,
                                color: isPassengerPickup
                                  ? '#10B981'
                                  : isPassengerDrop
                                  ? '#EF4444'
                                  : isNextStop
                                  ? 'var(--sr-cyan)'
                                  : isPassed
                                  ? 'var(--sr-text-secondary)'
                                  : 'var(--sr-text-primary)',
                              }}>
                                {stop.name || stop.stop_name}
                              </span>

                              {isPassengerPickup && (
                                <span className="badge badge-success" style={{ fontSize: 9 }}>YOUR PICKUP</span>
                              )}
                              {isPassengerDrop && (
                                <span className="badge badge-danger" style={{ fontSize: 9 }}>YOUR DROP</span>
                              )}
                              {isFirst && !isPassengerPickup && (
                                <span className="badge badge-cyan" style={{ fontSize: 9 }}>ORIGIN</span>
                              )}
                              {isLast && !isPassengerDrop && (
                                <span className="badge badge-warning" style={{ fontSize: 9 }}>DESTINATION</span>
                              )}
                            </div>

                            <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              <span>{stop.city}</span>
                              <span>&bull;</span>
                              <span>{stop.distance_km || index * 25} km from start</span>
                              {stop.platform && (
                                <>
                                  <span>&bull;</span>
                                  <span style={{ color: '#F59E0B', fontWeight: 600 }}>{stop.platform}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
