import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Compass,
  Clock,
  Milestone,
  Route as RouteIcon,
  Sparkles,
  Repeat,
  Eye,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api.js';
import PlaceAutocomplete from '../common/PlaceAutocomplete.jsx';
import { OPERATIONAL_CARAVAN_ROUTES } from '../../data/routesData.js';

/**
 * Standard Indian territorial boundary limits for latitude and longitude
 */
const INDIA_BOUNDS = {
  MIN_LAT: 8.0,
  MAX_LAT: 35.5,
  MIN_LNG: 68.0,
  MAX_LNG: 97.5,
};

/**
 * Known corridor stops registry for quick waypoint auto-suggestion
 */
const KNOWN_CORRIDOR_WAYPOINTS = {
  'coimbatore-tenkasi': [
    { name: 'Pollachi Old Bus Stand', city: 'Pollachi', state: 'Tamil Nadu', lat: 10.6609, lng: 77.0082, km: 45, mins: 55 },
    { name: 'Udumalapettai Central Bus Stand', city: 'Udumalpet', state: 'Tamil Nadu', lat: 10.5872, lng: 77.2476, km: 72, mins: 90 },
    { name: 'Palani Bus Stand', city: 'Palani', state: 'Tamil Nadu', lat: 10.4505, lng: 77.5164, km: 110, mins: 140 },
    { name: 'Srivilliputhur Bus Stand', city: 'Srivilliputhur', state: 'Tamil Nadu', lat: 9.5125, lng: 77.6348, km: 240, mins: 300 },
    { name: 'Rajapalayam Old Bus Stand', city: 'Rajapalayam', state: 'Tamil Nadu', lat: 9.4534, lng: 77.5565, km: 260, mins: 325 },
  ],
  'coimbatore-karaikudi': [
    { name: 'Palladam Bus Stand', city: 'Palladam', state: 'Tamil Nadu', lat: 10.9981, lng: 77.2912, km: 38, mins: 45 },
    { name: 'Dharapuram Old Bus Stand', city: 'Dharapuram', state: 'Tamil Nadu', lat: 10.7289, lng: 77.527, km: 76, mins: 95 },
    { name: 'Oddanchatram Bus Stand', city: 'Oddanchatram', state: 'Tamil Nadu', lat: 10.4851, lng: 77.7554, km: 115, mins: 145 },
    { name: 'Dindigul Bus Stand', city: 'Dindigul', state: 'Tamil Nadu', lat: 10.3673, lng: 77.9803, km: 145, mins: 185 },
    { name: 'Natham Bus Stand', city: 'Natham', state: 'Tamil Nadu', lat: 10.2205, lng: 78.2315, km: 182, mins: 235 },
    { name: 'Tiruppattur Bus Stand', city: 'Tiruppattur', state: 'Tamil Nadu', lat: 10.1125, lng: 78.618, km: 235, mins: 310 },
  ],
  'coimbatore-bengaluru': [
    { name: 'Avinashi Bypass', city: 'Avinashi', state: 'Tamil Nadu', lat: 11.1925, lng: 77.2694, km: 42, mins: 45 },
    { name: 'Perundurai Bypass', city: 'Perundurai', state: 'Tamil Nadu', lat: 11.275, lng: 77.585, km: 82, mins: 90 },
    { name: 'Salem New Bus Stand', city: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.146, km: 165, mins: 180 },
    { name: 'Dharmapuri Bus Stand', city: 'Dharmapuri', state: 'Tamil Nadu', lat: 12.1211, lng: 78.1582, km: 230, mins: 250 },
    { name: 'Hosur Bus Station', city: 'Hosur', state: 'Tamil Nadu', lat: 12.7409, lng: 77.8253, km: 325, mins: 340 },
    { name: 'Electronic City Toll Gate', city: 'Bengaluru', state: 'Karnataka', lat: 12.8399, lng: 77.677, km: 345, mins: 365 },
  ],
  'coimbatore-chennai': [
    { name: 'Tiruppur Old Bus Stand', city: 'Tiruppur', state: 'Tamil Nadu', lat: 11.1085, lng: 77.3411, km: 55, mins: 60 },
    { name: 'Erode Central Bus Terminal', city: 'Erode', state: 'Tamil Nadu', lat: 11.341, lng: 77.7172, km: 100, mins: 115 },
    { name: 'Salem New Bus Stand', city: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.146, km: 165, mins: 185 },
    { name: 'Villupuram Bus Stand', city: 'Villupuram', state: 'Tamil Nadu', lat: 11.9401, lng: 79.4861, km: 340, mins: 370 },
    { name: 'Chengalpattu Toll Plaza', city: 'Chengalpattu', state: 'Tamil Nadu', lat: 12.6924, lng: 79.9836, km: 445, mins: 470 },
  ],
  'bengaluru-chennai': [
    { name: 'Hosur Bus Stand', city: 'Hosur', state: 'Tamil Nadu', lat: 12.7409, lng: 77.8253, km: 40, mins: 45 },
    { name: 'Krishnagiri Toll Plaza', city: 'Krishnagiri', state: 'Tamil Nadu', lat: 12.5186, lng: 78.2137, km: 92, mins: 100 },
    { name: 'Vellore New Bus Stand', city: 'Vellore', state: 'Tamil Nadu', lat: 12.9165, lng: 79.1325, km: 215, mins: 220 },
    { name: 'Kanchipuram Bypass', city: 'Kanchipuram', state: 'Tamil Nadu', lat: 12.8342, lng: 79.7036, km: 278, mins: 290 },
    { name: 'Sriperumbudur Toll', city: 'Sriperumbudur', state: 'Tamil Nadu', lat: 12.9692, lng: 79.9442, km: 310, mins: 320 },
  ],
  'mumbai-pune': [
    { name: 'Vashi Highway Bus Stand', city: 'Navi Mumbai', state: 'Maharashtra', lat: 19.0771, lng: 72.9986, km: 28, mins: 35 },
    { name: 'Panvel Bus Terminus', city: 'Panvel', state: 'Maharashtra', lat: 18.9894, lng: 73.1175, km: 45, mins: 55 },
    { name: 'Lonavala Expressway Food Mall', city: 'Lonavala', state: 'Maharashtra', lat: 18.7557, lng: 73.4091, km: 85, mins: 110 },
    { name: 'Wakad Bridge Bus Stand', city: 'Pune', state: 'Maharashtra', lat: 18.5987, lng: 73.7684, km: 130, mins: 160 },
  ],
  'delhi-jaipur': [
    { name: 'Gurugram IFFCO Chowk', city: 'Gurugram', state: 'Haryana', lat: 28.4719, lng: 77.0725, km: 32, mins: 40 },
    { name: 'Dharuhera Bus Stand', city: 'Dharuhera', state: 'Haryana', lat: 28.2045, lng: 76.7915, km: 70, mins: 80 },
    { name: 'Behror Midway Flyover', city: 'Behror', state: 'Rajasthan', lat: 27.89, lng: 76.28, km: 130, mins: 150 },
    { name: 'Kotputli Bus Stand', city: 'Kotputli', state: 'Rajasthan', lat: 27.7, lng: 76.2, km: 160, mins: 185 },
    { name: 'Shahpura Flyover', city: 'Shahpura', state: 'Rajasthan', lat: 27.3889, lng: 75.9583, km: 215, mins: 245 },
  ],
  'hyderabad-vijayawada': [
    { name: 'LB Nagar Ring Road', city: 'Hyderabad', state: 'Telangana', lat: 17.3457, lng: 78.5522, km: 18, mins: 25 },
    { name: 'Choutuppal Toll Plaza', city: 'Choutuppal', state: 'Telangana', lat: 17.2472, lng: 78.8986, km: 58, mins: 65 },
    { name: 'Suryapet Bus Station', city: 'Suryapet', state: 'Telangana', lat: 17.1439, lng: 79.6236, km: 135, mins: 150 },
    { name: 'Kodad Bus Station', city: 'Kodad', state: 'Telangana', lat: 16.9961, lng: 79.9658, km: 180, mins: 195 },
    { name: 'Nandigama Bus Stand', city: 'Nandigama', state: 'Andhra Pradesh', lat: 16.7725, lng: 80.2933, km: 225, mins: 240 },
  ],
};

export default function CommercialRouteConfigModal({
  isOpen,
  onClose,
  onRouteCreated,
  showToast,
  existingRoutes = [],
}) {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourcePlace, setSourcePlace] = useState(null);
  const [destPlace, setDestPlace] = useState(null);
  const [routeName, setRouteName] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [intermediateStops, setIntermediateStops] = useState([]);

  // New intermediate stop inputs
  const [newStopName, setNewStopName] = useState('');
  const [newStopCity, setNewStopCity] = useState('');
  const [newStopState, setNewStopState] = useState('');
  const [newStopLat, setNewStopLat] = useState('');
  const [newStopLng, setNewStopLng] = useState('');
  const [newStopKm, setNewStopKm] = useState('');
  const [newStopMins, setNewStopMins] = useState('');
  const [newStopBoarding, setNewStopBoarding] = useState(true);
  const [newStopDropping, setNewStopDropping] = useState(true);

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'preview'

  // Auto-generate Route Name & Code when Source or Destination changes
  useEffect(() => {
    if (source && destination) {
      const srcClean = source.trim();
      const dstClean = destination.trim();
      const defaultName = `${srcClean} ➔ ${dstClean} Commercial Express`;
      setRouteName((prev) => (!prev || prev.includes('➔') ? defaultName : prev));

      const srcCode = srcClean.slice(0, 3).toUpperCase();
      const dstCode = dstClean.slice(0, 3).toUpperCase();
      const defaultCode = `CR-${srcCode}-${dstCode}`;
      setRouteCode((prev) => (!prev || prev.startsWith('CR-') ? defaultCode : prev));

      // Try matching known operational caravan routes for authentic distance & duration
      const matched = OPERATIONAL_CARAVAN_ROUTES.find(
        (r) =>
          (r.from.toLowerCase().includes(srcClean.toLowerCase()) || srcClean.toLowerCase().includes(r.from.toLowerCase())) &&
          (r.to.toLowerCase().includes(dstClean.toLowerCase()) || dstClean.toLowerCase().includes(r.to.toLowerCase()))
      );

      if (matched) {
        const numDist = parseInt(matched.distance) || 300;
        setDistanceKm(String(numDist));
        const durStr = matched.duration || '6h';
        const hours = parseInt(durStr) || 6;
        setDurationHours(String(hours));
        setDurationMinutes(durStr.includes('m') ? String(parseInt(durStr.split('m')[0].split('h')[1]) || 30) : '0');
      } else if (!distanceKm) {
        setDistanceKm('320');
        setDurationHours('6');
        setDurationMinutes('30');
      }
    }
  }, [source, destination]);

  // Check corridor suggestions
  const corridorKey = useMemo(() => {
    if (!source || !destination) return '';
    const s = source.toLowerCase().trim();
    const d = destination.toLowerCase().trim();
    for (const k of Object.keys(KNOWN_CORRIDOR_WAYPOINTS)) {
      const [k1, k2] = k.split('-');
      if ((s.includes(k1) || k1.includes(s)) && (d.includes(k2) || k2.includes(d))) {
        return k;
      }
    }
    return '';
  }, [source, destination]);

  // Validation Checks
  const validationErrors = useMemo(() => {
    const errors = [];
    const cleanSrc = source.trim();
    const cleanDst = destination.trim();

    if (!cleanSrc) {
      errors.push('Origin (From) location is required');
    }
    if (!cleanDst) {
      errors.push('Destination (To) location is required');
    }
    if (cleanSrc && cleanDst && cleanSrc.toLowerCase() === cleanDst.toLowerCase()) {
      errors.push('Origin and Destination cannot be the same location');
    }

    // Intermediate stops validation
    const seenNames = new Set();
    intermediateStops.forEach((st, idx) => {
      const nameLower = st.name.trim().toLowerCase();
      if (!nameLower) {
        errors.push(`Intermediate stop #${idx + 1} must have a name`);
      } else if (cleanSrc && nameLower === cleanSrc.toLowerCase()) {
        errors.push(`Intermediate stop "${st.name}" cannot be identical to the Origin location`);
      } else if (cleanDst && nameLower === cleanDst.toLowerCase()) {
        errors.push(`Intermediate stop "${st.name}" cannot be identical to the Destination location`);
      } else if (seenNames.has(nameLower)) {
        errors.push(`Duplicate intermediate stop detected: "${st.name}" appears multiple times`);
      }
      seenNames.add(nameLower);

      if (st.latitude !== '' && st.latitude !== null && st.latitude !== undefined) {
        const lat = parseFloat(st.latitude);
        if (isNaN(lat) || lat < INDIA_BOUNDS.MIN_LAT || lat > INDIA_BOUNDS.MAX_LAT) {
          errors.push(`Stop "${st.name}" latitude (${st.latitude}) is outside Indian borders (8.0°N–35.5°N)`);
        }
      }
      if (st.longitude !== '' && st.longitude !== null && st.longitude !== undefined) {
        const lng = parseFloat(st.longitude);
        if (isNaN(lng) || lng < INDIA_BOUNDS.MIN_LNG || lng > INDIA_BOUNDS.MAX_LNG) {
          errors.push(`Stop "${st.name}" longitude (${st.longitude}) is outside Indian borders (68.0°E–97.5°E)`);
        }
      }
    });

    return errors;
  }, [source, destination, intermediateStops]);

  const isValid = validationErrors.length === 0 && source.trim() && destination.trim();

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    const tempSrc = source;
    const tempPlace = sourcePlace;
    setSource(destination);
    setSourcePlace(destPlace);
    setDestination(tempSrc);
    setDestPlace(tempPlace);
  };

  // Add an intermediate stop
  const handleAddIntermediateStop = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newStopName.trim()) {
      showToast?.('Please specify a stop name or terminal', 'error');
      return;
    }

    const latNum = parseFloat(newStopLat);
    const lngNum = parseFloat(newStopLng);

    const newStop = {
      id: `custom-stop-${Date.now()}-${intermediateStops.length + 1}`,
      name: newStopName.trim(),
      city: newStopCity.trim() || newStopName.trim(),
      state: newStopState.trim() || 'India',
      latitude: !isNaN(latNum) ? latNum : null,
      longitude: !isNaN(lngNum) ? lngNum : null,
      distance_from_start_km: Number(newStopKm) || (intermediateStops.length + 1) * 35,
      estimated_time_from_start_minutes: Number(newStopMins) || (intermediateStops.length + 1) * 45,
      is_boarding_point: newStopBoarding,
      is_dropping_point: newStopDropping,
      stop_order: intermediateStops.length + 1,
    };

    setIntermediateStops([...intermediateStops, newStop]);

    // Reset stop inputs
    setNewStopName('');
    setNewStopCity('');
    setNewStopState('');
    setNewStopLat('');
    setNewStopLng('');
    setNewStopKm('');
    setNewStopMins('');
    setNewStopBoarding(true);
    setNewStopDropping(true);
  };

  // Move stop up or down
  const handleMoveStop = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= intermediateStops.length) return;

    const updated = [...intermediateStops];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((st, idx) => ({
      ...st,
      stop_order: idx + 1,
    }));

    setIntermediateStops(reordered);
  };

  // Remove stop
  const handleRemoveStop = (index) => {
    const updated = intermediateStops.filter((_, idx) => idx !== index);
    const reordered = updated.map((st, idx) => ({
      ...st,
      stop_order: idx + 1,
    }));
    setIntermediateStops(reordered);
  };

  // Apply suggested corridor waypoints
  const handleApplySuggestedWaypoints = () => {
    if (!corridorKey || !KNOWN_CORRIDOR_WAYPOINTS[corridorKey]) return;
    const waypoints = KNOWN_CORRIDOR_WAYPOINTS[corridorKey].map((w, idx) => ({
      id: `waypoint-${corridorKey}-${idx + 1}`,
      name: w.name,
      city: w.city,
      state: w.state,
      latitude: w.lat,
      longitude: w.lng,
      distance_from_start_km: w.km,
      estimated_time_from_start_minutes: w.mins,
      is_boarding_point: true,
      is_dropping_point: true,
      stop_order: idx + 1,
    }));
    setIntermediateStops(waypoints);
    showToast?.(`Loaded ${waypoints.length} verified corridor stops in travel order`, 'success');
  };

  // Save the configured commercial route
  const handleSaveRoute = async () => {
    if (!isValid) {
      showToast?.(validationErrors[0] || 'Please resolve configuration errors before saving', 'error');
      return;
    }

    try {
      setSaving(true);

      const totalMins = (parseInt(durationHours) || 0) * 60 + (parseInt(durationMinutes) || 0);

      // Build complete sequential stop list: Origin -> Intermediate Stops -> Destination
      const allStopsPayload = [
        {
          name: sourcePlace?.mainText || `${source} Central Terminal`,
          city: source.trim(),
          latitude: sourcePlace?.lat || null,
          longitude: sourcePlace?.lng || null,
          stop_order: 1,
          distance_from_start_km: 0,
          estimated_time_from_start_minutes: 0,
          is_boarding_point: true,
          is_dropping_point: false,
        },
        ...intermediateStops.map((s, idx) => ({
          name: s.name,
          city: s.city || source.trim(),
          latitude: s.latitude,
          longitude: s.longitude,
          stop_order: idx + 2,
          distance_from_start_km: s.distance_from_start_km || (idx + 1) * 40,
          estimated_time_from_start_minutes: s.estimated_time_from_start_minutes || (idx + 1) * 50,
          is_boarding_point: Boolean(s.is_boarding_point),
          is_dropping_point: Boolean(s.is_dropping_point),
        })),
        {
          name: destPlace?.mainText || `${destination} Central Terminal`,
          city: destination.trim(),
          latitude: destPlace?.lat || null,
          longitude: destPlace?.lng || null,
          stop_order: intermediateStops.length + 2,
          distance_from_start_km: Number(distanceKm) || (intermediateStops.length + 1) * 50 + 50,
          estimated_time_from_start_minutes: totalMins || (intermediateStops.length + 1) * 60 + 60,
          is_boarding_point: false,
          is_dropping_point: true,
        },
      ];

      const payload = {
        name: routeName.trim(),
        code: routeCode.trim(),
        source: source.trim(),
        destination: destination.trim(),
        distanceKm: Number(distanceKm) || 100,
        estimatedDurationMinutes: totalMins || 180,
        stops: allStopsPayload,
      };

      const res = await api.post('/owner/routes', payload);

      if (res.success) {
        showToast?.('Assigned Commercial Route configured and saved successfully!', 'success');
        onRouteCreated?.(res.data?.route || res.route);
        onClose();
      } else {
        showToast?.(res.error || 'Failed to save commercial route', 'error');
      }
    } catch (err) {
      showToast?.(err.message || 'Error occurred while saving commercial route', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="sr-card"
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          background: 'var(--sr-bg-card, #1A1325)',
          border: '1px solid var(--sr-border-card, #2D223B)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--sr-border-card, #2D223B)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(193, 61, 120, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(193, 61, 120, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--sr-primary, #C13D78)',
              }}
            >
              <RouteIcon size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary, #FFFFFF)' }}>
                Configure Assigned Commercial Route
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--sr-text-secondary, #A098AE)' }}>
                Select route origins and destinations across India, configure ordered intermediate stops, and preview the commercial corridor.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View Switcher for Mobile / Tablet */}
            <div style={{ display: 'flex', background: 'var(--sr-bg-root, #120D1A)', borderRadius: 8, padding: 3 }}>
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`btn ${activeTab === 'config' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '5px 12px', fontSize: 12, border: 'none' }}
              >
                <Sliders size={13} style={{ marginRight: 4 }} /> Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`btn ${activeTab === 'preview' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '5px 12px', fontSize: 12, border: 'none' }}
              >
                <Eye size={13} style={{ marginRight: 4 }} /> Route Preview ({intermediateStops.length + 2} Stops)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--sr-text-secondary, #A098AE)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Validation Warning Alert */}
          {validationErrors.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#FCA5A5' }}>
                <strong style={{ display: 'block', marginBottom: 4, color: '#EF4444' }}>
                  Please resolve the following configuration issues:
                </strong>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {validationErrors.map((err, idx) => (
                    <li key={idx} style={{ marginBottom: 2 }}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: activeTab === 'preview' ? '1fr' : 'minmax(0, 1.25fr) minmax(0, 1fr)',
              gap: 24,
            }}
          >
            {/* LEFT COLUMN: Route Configuration & Stops Editor */}
            <div style={{ display: activeTab === 'preview' ? 'none' : 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section 1: Pan-India Origin and Destination */}
              <div
                className="sr-card"
                style={{
                  padding: 18,
                  border: '1px solid var(--sr-border-card, #2D223B)',
                  background: 'var(--sr-bg-root, #120D1A)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Compass size={16} color="var(--sr-primary, #C13D78)" />
                    <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sr-text-primary)' }}>
                      1. Pan-India Corridor Endpoints
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    title="Swap Origin and Destination"
                    style={{
                      background: 'rgba(193, 61, 120, 0.1)',
                      border: '1px solid rgba(193, 61, 120, 0.3)',
                      color: 'var(--sr-primary, #C13D78)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Repeat size={12} /> Swap (⇄)
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {/* Origin Field */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)', marginBottom: 6, display: 'block' }}>
                      From (Origin Location) *
                    </label>
                    <PlaceAutocomplete
                      id="commercial-route-origin"
                      value={source}
                      onChange={(val) => setSource(val)}
                      onSelectPlace={(place) => {
                        setSource(place.city || place.mainText);
                        setSourcePlace(place);
                      }}
                      placeholder="Search origin across India (e.g. Coimbatore, Bengaluru, Mumbai)..."
                      required
                    />
                    {sourcePlace?.state && (
                      <span style={{ fontSize: 10, color: 'var(--sr-emerald, #10B981)', display: 'block', marginTop: 4 }}>
                        ✓ {sourcePlace.state} &bull; {sourcePlace.lat ? `${sourcePlace.lat}°N, ${sourcePlace.lng}°E` : 'Verified Transit Terminal'}
                      </span>
                    )}
                  </div>

                  {/* Destination Field */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)', marginBottom: 6, display: 'block' }}>
                      To (Destination Location) *
                    </label>
                    <PlaceAutocomplete
                      id="commercial-route-destination"
                      value={destination}
                      onChange={(val) => setDestination(val)}
                      onSelectPlace={(place) => {
                        setDestination(place.city || place.mainText);
                        setDestPlace(place);
                      }}
                      placeholder="Search destination across India (e.g. Tenkasi, Chennai, Kochi)..."
                      required
                    />
                    {destPlace?.state && (
                      <span style={{ fontSize: 10, color: 'var(--sr-emerald, #10B981)', display: 'block', marginTop: 4 }}>
                        ✓ {destPlace.state} &bull; {destPlace.lat ? `${destPlace.lat}°N, ${destPlace.lng}°E` : 'Verified Transit Terminal'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Identical Origin & Destination Warning */}
                {source && destination && source.trim().toLowerCase() === destination.trim().toLowerCase() && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '8px 12px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      borderRadius: 6,
                      fontSize: 11,
                      color: '#F87171',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <AlertCircle size={14} /> Origin and destination cannot be the same city.
                  </div>
                )}
              </div>

              {/* Section 2: Commercial Route Metadata */}
              <div
                className="sr-card"
                style={{
                  padding: 18,
                  border: '1px solid var(--sr-border-card, #2D223B)',
                  background: 'var(--sr-bg-root, #120D1A)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Milestone size={16} color="var(--sr-primary, #C13D78)" />
                  <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sr-text-primary)' }}>
                    2. Commercial Route Metadata
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Assigned Commercial Route Name *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Coimbatore ➔ Tenkasi Highway Express"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Route Code *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. CR-CBE-TKS"
                      value={routeCode}
                      onChange={(e) => setRouteCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Estimated Highway Distance (km)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="320"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                      Estimated Transit Duration
                    </label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="6"
                        style={{ width: '50%' }}
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                      />
                      <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>hrs</span>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="30"
                        style={{ width: '50%' }}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                      />
                      <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>mins</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Ordered Intermediate Stops Configuration */}
              <div
                className="sr-card"
                style={{
                  padding: 18,
                  border: '1px solid var(--sr-border-card, #2D223B)',
                  background: 'var(--sr-bg-root, #120D1A)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Navigation size={16} color="var(--sr-primary, #C13D78)" />
                    <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sr-text-primary)' }}>
                      3. Intermediate Stops in Travel Order ({intermediateStops.length})
                    </span>
                  </div>

                  {corridorKey && (
                    <button
                      type="button"
                      onClick={handleApplySuggestedWaypoints}
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: 'var(--sr-emerald, #10B981)',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={12} /> Auto-Fill Verified Waypoints
                    </button>
                  )}
                </div>

                {/* Intermediate stops list */}
                {intermediateStops.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 8,
                      border: '1px dashed var(--sr-border-card, #2D223B)',
                      color: 'var(--sr-text-secondary)',
                      fontSize: 12,
                    }}
                  >
                    No intermediate stops configured yet. Use the form below to add towns, terminals, and boarding points in travel sequence.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {intermediateStops.map((st, idx) => (
                      <div
                        key={st.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--sr-border-card, #2D223B)',
                          borderRadius: 8,
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                          {/* Reorder Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveStop(idx, -1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                padding: 2,
                                color: idx === 0 ? 'var(--sr-border-card)' : 'var(--sr-text-secondary)',
                              }}
                              title="Move Stop Earlier in Journey"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === intermediateStops.length - 1}
                              onClick={() => handleMoveStop(idx, 1)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: idx === intermediateStops.length - 1 ? 'not-allowed' : 'pointer',
                                padding: 2,
                                color: idx === intermediateStops.length - 1 ? 'var(--sr-border-card)' : 'var(--sr-text-secondary)',
                              }}
                              title="Move Stop Later in Journey"
                            >
                              <ArrowDown size={13} />
                            </button>
                          </div>

                          {/* Order Badge */}
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: 'rgba(193, 61, 120, 0.15)',
                              color: 'var(--sr-primary, #C13D78)',
                              fontSize: 11,
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {idx + 1}
                          </div>

                          {/* Stop Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                                {st.name}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                                ({st.city})
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--sr-text-secondary)', marginTop: 2, display: 'flex', gap: 8 }}>
                              <span>+{st.distance_from_start_km} km</span>
                              <span>&bull;</span>
                              <span>+{st.estimated_time_from_start_minutes} mins</span>
                              {st.latitude && st.longitude && (
                                <>
                                  <span>&bull;</span>
                                  <span style={{ color: 'var(--sr-emerald)' }}>
                                    ✓ {Number(st.latitude).toFixed(3)}°N, {Number(st.longitude).toFixed(3)}°E
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badges & Remove */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {st.is_boarding_point && (
                            <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--sr-emerald)', fontWeight: 700 }}>
                              Boarding
                            </span>
                          )}
                          {st.is_dropping_point && (
                            <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontWeight: 700 }}>
                              Drop-off
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(idx)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                            title="Remove Stop"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Stop Form Row */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--sr-border-card, #2D223B)',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 8 }}>
                    + Append New Intermediate Stop in Travel Sequence
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <PlaceAutocomplete
                        id="new-intermediate-stop"
                        value={newStopName}
                        onChange={(val) => {
                          setNewStopName(val);
                          if (!newStopCity) setNewStopCity(val);
                        }}
                        onSelectPlace={(p) => {
                          setNewStopName(p.mainText || p.city);
                          setNewStopCity(p.city || p.mainText);
                          setNewStopState(p.state || '');
                          if (p.lat) setNewStopLat(String(p.lat));
                          if (p.lng) setNewStopLng(String(p.lng));
                          if (!newStopKm) setNewStopKm(String((intermediateStops.length + 1) * 40));
                          if (!newStopMins) setNewStopMins(String((intermediateStops.length + 1) * 50));
                        }}
                        placeholder="Search town, terminal, bypass..."
                      />
                    </div>

                    <input
                      type="text"
                      className="input-field"
                      placeholder="City / District (e.g. Salem)"
                      value={newStopCity}
                      onChange={(e) => setNewStopCity(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <input
                      type="number"
                      step="any"
                      className="input-field"
                      placeholder="Lat (8.0-35.5)"
                      value={newStopLat}
                      onChange={(e) => setNewStopLat(e.target.value)}
                    />
                    <input
                      type="number"
                      step="any"
                      className="input-field"
                      placeholder="Lng (68.0-97.5)"
                      value={newStopLng}
                      onChange={(e) => setNewStopLng(e.target.value)}
                    />
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Dist km"
                      value={newStopKm}
                      onChange={(e) => setNewStopKm(e.target.value)}
                    />
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Time mins"
                      value={newStopMins}
                      onChange={(e) => setNewStopMins(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: 'var(--sr-text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={newStopBoarding}
                          onChange={(e) => setNewStopBoarding(e.target.checked)}
                        />
                        Boarding
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: 'var(--sr-text-primary)' }}>
                        <input
                          type="checkbox"
                          checked={newStopDropping}
                          onChange={(e) => setNewStopDropping(e.target.checked)}
                        />
                        Drop-off
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleAddIntermediateStop}
                      style={{ padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} /> Add Stop to Order
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Live Commercial Route Preview */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                className="sr-card"
                style={{
                  padding: 20,
                  border: '1px solid var(--sr-border-card, #2D223B)',
                  background: 'var(--sr-bg-root, #120D1A)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={16} color="var(--sr-emerald, #10B981)" />
                    <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sr-text-primary)' }}>
                      Commercial Route Preview
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isValid ? 'var(--sr-emerald, #10B981)' : '#EF4444',
                    }}
                  >
                    {isValid ? 'READY TO SAVE' : 'INCOMPLETE'}
                  </span>
                </div>

                {/* Corridor Headline */}
                <div
                  style={{
                    background: 'rgba(193, 61, 120, 0.08)',
                    border: '1px solid rgba(193, 61, 120, 0.25)',
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--sr-text-primary)', marginBottom: 4 }}>
                    {source || 'Origin'} ➔ {destination || 'Destination'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>Code: <strong>{routeCode || 'CR-NEW'}</strong></span>
                    <span>&bull;</span>
                    <span>Distance: <strong>{distanceKm || 0} km</strong></span>
                    <span>&bull;</span>
                    <span>Duration: <strong>{durationHours || 0}h {durationMinutes || 0}m</strong></span>
                  </div>
                </div>

                {/* Visual Ordered Transit Timeline */}
                <div style={{ padding: '8px 4px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--sr-text-secondary)', marginBottom: 12 }}>
                    Sequential Passenger Transit Sequence
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                    {/* Origin Stop */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#10B981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        >
                          A
                        </div>
                        <div style={{ width: 2, height: 32, background: 'rgba(16, 185, 129, 0.4)' }} />
                      </div>
                      <div style={{ paddingBottom: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sr-text-primary)' }}>
                          {source || 'Select Origin Location'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--sr-text-secondary)' }}>
                          Origin Boarding Terminal &bull; 0 km &bull; 0 mins
                        </div>
                      </div>
                    </div>

                    {/* Intermediate Stops */}
                    {intermediateStops.map((st, idx) => (
                      <div key={st.id || idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: 'rgba(0, 242, 254, 0.2)',
                              border: '2px solid var(--sr-cyan, #00F2FE)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--sr-cyan, #00F2FE)',
                              fontSize: 9,
                              fontWeight: 900,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div style={{ width: 2, height: 32, background: 'rgba(0, 242, 254, 0.3)' }} />
                        </div>
                        <div style={{ paddingBottom: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                            {st.name} <span style={{ color: 'var(--sr-text-secondary)', fontWeight: 500 }}>({st.city})</span>
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--sr-text-secondary)' }}>
                            +{st.distance_from_start_km} km &bull; +{st.estimated_time_from_start_minutes} mins
                            {st.is_boarding_point && ' • Boarding'}
                            {st.is_dropping_point && ' • Drop-off'}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Destination Stop */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        >
                          B
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sr-text-primary)' }}>
                          {destination || 'Select Destination Location'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--sr-text-secondary)' }}>
                          Final Dropping Point &bull; {distanceKm || 0} km &bull; {durationHours || 0}h {durationMinutes || 0}m
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pre-save Verification Checklist */}
                <div
                  style={{
                    marginTop: 18,
                    padding: 12,
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 8,
                    border: '1px solid var(--sr-border-card, #2D223B)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--sr-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Route Pre-Flight Audit
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: source.trim() ? '#10B981' : '#A098AE' }}>
                      <CheckCircle2 size={13} /> Origin selected ({source.trim() || 'Missing'})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: destination.trim() ? '#10B981' : '#A098AE' }}>
                      <CheckCircle2 size={13} /> Destination selected ({destination.trim() || 'Missing'})
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        color: source.trim() && destination.trim() && source.trim().toLowerCase() !== destination.trim().toLowerCase() ? '#10B981' : '#EF4444',
                      }}
                    >
                      <CheckCircle2 size={13} /> Origin &amp; Destination are distinct
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981' }}>
                      <CheckCircle2 size={13} /> {intermediateStops.length} ordered intermediate waypoints
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sr-cyan)' }}>
                      <ShieldCheck size={13} /> Separation of concerns: Pure corridor configuration without bus/fare binding
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--sr-border-card, #2D223B)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>
            {isValid ? (
              <span style={{ color: 'var(--sr-emerald)' }}>
                ✓ Configuration valid. Ready to save commercial route to database.
              </span>
            ) : (
              <span style={{ color: '#EF4444' }}>
                ⚠️ Please provide valid Origin and distinct Destination before saving.
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveRoute}
              disabled={!isValid || saving}
              style={{
                opacity: !isValid || saving ? 0.6 : 1,
                cursor: !isValid || saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving ? 'Saving Route...' : 'Save Commercial Route'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
