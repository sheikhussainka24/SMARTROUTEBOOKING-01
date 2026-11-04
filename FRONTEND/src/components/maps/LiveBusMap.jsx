import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket, SocketStatusBadge } from '../../context/SocketContext.jsx';
import CONFIG from '../../config/index.js';
import { GoogleMapsProvider } from '@maps/google/googleMapsProvider.js';
import { isGoogleMapsConfigured } from '@maps/google/googleMapsConfig.js';
import {
  Navigation,
  Compass,
  Gauge,
  CheckCircle2,
  MapPin,
  Bus,
  Radio,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Clock,
  ShieldCheck,
  Maximize2,
  Info,
} from 'lucide-react';

/**
 * SMART ROUTE — Production Interactive Transit Tracking Map
 * Style: Where Is My Train modern transit experience
 * Features:
 * - Robust container handling with safe cleanup & resize invalidation
 * - Split road polyline: Completed journey (solid emerald) vs Remaining journey (dashed amber)
 * - Actual live GPS coordinates with direction heading rotation
 * - Smooth marker interpolation between coordinates (no sudden jumps)
 * - Numbered intermediate stops with boarding & dropping stop highlights
 * - Live location unavailable / stale signal indicator overlay
 * - Multi-provider architecture (Google Maps Roads & Traffic / Leaflet OpenStreetMap Transit)
 * - Automatic graceful fallback when Google Maps key has referrer or authorization restrictions
 */

export default function LiveBusMap({
  tripId,
  stops = [],
  initialBusLocation = null,
  height = '540px',
  boardingStopId = null,
  droppingStopId = null,
  hasLiveGps = false,
  isStale = false,
  lastUpdated = null,
  onTelemetryUpdate = null,
}) {
  const mapContainerRef = useRef(null);
  const activeProviderRef = useRef(null); // 'google' | 'leaflet'
  const googleProviderInstanceRef = useRef(null);
  const leafletMapInstanceRef = useRef(null);
  const leafletBusMarkerRef = useRef(null);
  const leafletCompletedLineRef = useRef(null);
  const leafletRemainingLineRef = useRef(null);
  const leafletStopMarkersRef = useRef(new Map());

  // Animation frame ref for smooth marker gliding
  const animFrameRef = useRef(null);
  const currentMarkerCoordsRef = useRef(null);

  const [activeProviderName, setActiveProviderName] = useState('OpenStreetMap Transit');
  const [providerNotice, setProviderNotice] = useState(null);
  const [routeStats, setRouteStats] = useState(null);
  const [liveTelemetry, setLiveTelemetry] = useState(initialBusLocation);
  const [effectiveHasLiveGps, setEffectiveHasLiveGps] = useState(hasLiveGps);
  const [effectiveIsStale, setEffectiveIsStale] = useState(isStale);

  const { socket, connected } = useSocket();
  const desiredProvider = (CONFIG.MAP_PROVIDER || 'leaflet').toLowerCase();

  // Helper to split coordinates into completed and remaining portions
  const computeSplitCoordinates = useCallback((allStops, currentBusCoords) => {
    const validStops = allStops.filter((s) => s.latitude && s.longitude);
    if (validStops.length < 2) return { completed: [], remaining: [] };

    const stopPoints = validStops.map((s) => [parseFloat(s.latitude), parseFloat(s.longitude)]);

    if (!currentBusCoords || !currentBusCoords.lat || !currentBusCoords.lng) {
      return { completed: [], remaining: stopPoints };
    }

    const busPt = [parseFloat(currentBusCoords.lat), parseFloat(currentBusCoords.lng)];

    // Find closest stop index to determine traversed progress
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < stopPoints.length; i++) {
      const [sLat, sLng] = stopPoints[i];
      const d = Math.hypot(sLat - busPt[0], sLng - busPt[1]);
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }

    // Traversed points up to closest stop + current bus location
    const completed = stopPoints.slice(0, closestIndex + 1);
    completed.push(busPt);

    // Remaining points from current bus location + future stops
    const remaining = [busPt, ...stopPoints.slice(closestIndex + 1)];

    return { completed, remaining };
  }, []);

  // Smooth marker interpolation using requestAnimationFrame
  const animateBusMarkerTo = useCallback((newLat, newLng, heading = 0, speed = 0) => {
    if (!leafletMapInstanceRef.current && !googleProviderInstanceRef.current) return;

    const startCoords = currentMarkerCoordsRef.current || { lat: newLat, lng: newLng };
    const targetCoords = { lat: newLat, lng: newLng };
    const startTime = performance.now();
    const duration = 900; // ms

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const curLat = startCoords.lat + (targetCoords.lat - startCoords.lat) * ease;
      const curLng = startCoords.lng + (targetCoords.lng - startCoords.lng) * ease;

      currentMarkerCoordsRef.current = { lat: curLat, lng: curLng };

      // Update Leaflet marker
      if (leafletMapInstanceRef.current && leafletBusMarkerRef.current) {
        leafletBusMarkerRef.current.setLatLng([curLat, curLng]);

        // Update direction heading rotation if element exists
        const iconEl = leafletBusMarkerRef.current.getElement();
        if (iconEl) {
          const busBody = iconEl.querySelector('.bus-marker-body');
          if (busBody) {
            busBody.style.transform = `rotate(${heading}deg)`;
          }
        }
      }

      // Update Google Maps marker
      if (googleProviderInstanceRef.current) {
        googleProviderInstanceRef.current.updateBusMarker(curLat, curLng, heading, { speed });
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Update polylines on map (completed in emerald, remaining in amber)
  const updatePolylines = useCallback((allStops, currentBusCoords) => {
    const map = leafletMapInstanceRef.current;
    if (!map) return;

    const { completed, remaining } = computeSplitCoordinates(allStops, currentBusCoords);

    // 1. Remove existing lines
    if (leafletCompletedLineRef.current) {
      map.removeLayer(leafletCompletedLineRef.current);
      leafletCompletedLineRef.current = null;
    }
    if (leafletRemainingLineRef.current) {
      map.removeLayer(leafletRemainingLineRef.current);
      leafletRemainingLineRef.current = null;
    }

    // 2. Draw completed portion (solid glowing emerald line)
    if (completed.length > 1) {
      leafletCompletedLineRef.current = L.polyline(completed, {
        color: '#10B981',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    }

    // 3. Draw remaining portion (dashed high-contrast amber/gold line)
    if (remaining.length > 1) {
      leafletRemainingLineRef.current = L.polyline(remaining, {
        color: '#F59E0B',
        weight: 5,
        opacity: 0.85,
        dashArray: '6, 10',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else if (completed.length <= 1 && allStops.length > 1) {
      // No bus position: render planned route
      const fullPlanned = allStops
        .filter((s) => s.latitude && s.longitude)
        .map((s) => [parseFloat(s.latitude), parseFloat(s.longitude)]);

      leafletRemainingLineRef.current = L.polyline(fullPlanned, {
        color: '#0284C7',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
    }
  }, [computeSplitCoordinates]);

  // Dedicated Leaflet OpenStreetMap Transit Setup Function
  const setupLeafletMap = useCallback((container, validStops, defaultCenter, currentBusLocation) => {
    // Tear down any existing Leaflet map on this container
    if (leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.remove();
      leafletMapInstanceRef.current = null;
    }
    if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }
    if (googleProviderInstanceRef.current) {
      googleProviderInstanceRef.current.destroy();
      googleProviderInstanceRef.current = null;
    }

    container.innerHTML = '';
    leafletStopMarkersRef.current.clear();

    activeProviderRef.current = 'leaflet';
    setActiveProviderName('OpenStreetMap Transit');

    const map = L.map(container, {
      zoomControl: false,
    }).setView(defaultCenter, 9);

    leafletMapInstanceRef.current = map;

    // Dark transit cartography tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | SMART ROUTE GPS',
      maxZoom: 19,
    }).addTo(map);

    // Re-invalidate size after layout calculation to prevent gray tiles
    setTimeout(() => {
      if (map && mapContainerRef.current) {
        map.invalidateSize();
      }
    }, 150);

    // Add Stop Markers with custom "Where Is My Train" badges
    validStops.forEach((stop, index) => {
      const isStart = index === 0;
      const isEnd = index === validStops.length - 1;
      const isPassengerPickup = stop.id === boardingStopId;
      const isPassengerDrop = stop.id === droppingStopId;
      const isPassed = Boolean(stop.is_passed);

      const badgeBg = isPassengerPickup
        ? '#10B981'
        : isPassengerDrop
        ? '#EF4444'
        : isStart
        ? '#059669'
        : isEnd
        ? '#DC2626'
        : isPassed
        ? '#475569'
        : '#00F2FE';

      const textColor = (isPassengerPickup || isPassengerDrop || isStart || isEnd || isPassed) ? '#FFFFFF' : '#070B14';

      const markerHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          ${isPassengerPickup ? `
            <div style="position: absolute; bottom: 28px; background: #10B981; color: #fff; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); text-transform: uppercase;">
              Your Boarding Stop
            </div>
          ` : ''}
          ${isPassengerDrop ? `
            <div style="position: absolute; bottom: 28px; background: #EF4444; color: #fff; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); text-transform: uppercase;">
              Your Dropping Stop
            </div>
          ` : ''}
          <div style="background: ${badgeBg}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: ${textColor};">
            ${isPassed ? '✓' : index + 1}
          </div>
        </div>
      `;

      const stopIcon = L.divIcon({
        html: markerHtml,
        className: 'transit-stop-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const stopMarker = L.marker([parseFloat(stop.latitude), parseFloat(stop.longitude)], { icon: stopIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
            <strong style="color: #0284c7; font-size: 14px;">${stop.name || stop.stop_name}</strong><br/>
            <span style="color: #64748b;">${stop.city || ''} &bull; Stop #${stop.stop_order || index + 1}</span><br/>
            <span style="color: #10b981; font-weight: 600;">Scheduled: ${stop.scheduled_time || stop.arrival_time || 'On Schedule'}</span><br/>
            ${stop.platform ? `<span style="color: #f59e0b; font-size: 11px;">Bay: ${stop.platform}</span>` : ''}
          </div>
        `);

      leafletStopMarkersRef.current.set(stop.id, stopMarker);
    });

    // Render Split Polylines
    const currentCoords = (currentBusLocation && hasLiveGps)
      ? { lat: currentBusLocation.latitude, lng: currentBusLocation.longitude }
      : null;

    updatePolylines(validStops, currentCoords);

    // Render Moving Bus Marker if Live Location Available
    if (currentBusLocation?.latitude && currentBusLocation?.longitude && hasLiveGps) {
      const busLat = parseFloat(currentBusLocation.latitude);
      const busLng = parseFloat(currentBusLocation.longitude);
      currentMarkerCoordsRef.current = { lat: busLat, lng: busLng };

      const busHtml = `
        <div class="live-bus-container" style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <!-- Radar pulse animation -->
          <div class="radar-pulse" style="position: absolute; width: 52px; height: 52px; border-radius: 50%; background: rgba(0, 242, 254, 0.35); pointer-events: none;"></div>
          <!-- Speed indicator badge -->
          <div style="position: absolute; top: -20px; background: #070B14; border: 1px solid #00F2FE; color: #00F2FE; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 6px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
            ${currentBusLocation.speed || 64} km/h
          </div>
          <!-- Rotating bus body -->
          <div class="bus-marker-body" style="background: linear-gradient(135deg, #FFB800 0%, #F59E0B 100%); width: 36px; height: 36px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 14px rgba(245, 158, 11, 0.9); display: flex; align-items: center; justify-content: center; font-size: 17px; transform: rotate(${currentBusLocation.heading || 0}deg); transition: transform 0.4s ease;">
            🚌
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        html: busHtml,
        className: 'live-bus-icon-wrap',
        iconSize: [52, 52],
        iconAnchor: [26, 26],
      });

      leafletBusMarkerRef.current = L.marker([busLat, busLng], { icon: busIcon, zIndexOffset: 2000 })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 13px;">
            <strong style="color: #f59e0b; font-size: 14px;">🚌 Live Luxury Coach</strong><br/>
            <span>Speed: <strong>${currentBusLocation.speed || 64} km/h</strong></span><br/>
            <span>Next Stop: <strong>${currentBusLocation.next_stop_name || 'En Route'}</strong></span><br/>
            <span>Live Status: <strong style="color: #10b981;">Broadcasting GPS</strong></span>
          </div>
        `);
    }

    // Auto-fit bounds
    if (validStops.length > 1) {
      const bounds = validStops.map((s) => [parseFloat(s.latitude), parseFloat(s.longitude)]);
      if (currentBusLocation?.latitude && hasLiveGps) {
        bounds.push([parseFloat(currentBusLocation.latitude), parseFloat(currentBusLocation.longitude)]);
      }
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [boardingStopId, droppingStopId, hasLiveGps, updatePolylines]);

  // Route identity signature to prevent duplicate map teardown and initialization on periodic polling
  const routeSignature = `${tripId || ''}:${stops.map((s) => s.id || `${s.latitude},${s.longitude}`).join('>')}:${desiredProvider}`;

  // Setup Map Instance (Google Maps with seamless OpenStreetMap fallback)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let isSubscribed = true;
    let authCheckTimer = null;

    // Helper: wait until container has valid non-zero dimensions
    function ensureDimensionsAndInit() {
      if (!container || !isSubscribed) return;
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        requestAnimationFrame(ensureDimensionsAndInit);
        return;
      }
      runMapInit();
    }

    async function runMapInit() {
      if (!isSubscribed || !container) return;

      const validStops = stops.filter((s) => s.latitude && s.longitude);
      const defaultCenter = (initialBusLocation && hasLiveGps)
        ? [parseFloat(initialBusLocation.latitude), parseFloat(initialBusLocation.longitude)]
        : validStops.length > 0
        ? [parseFloat(validStops[0].latitude), parseFloat(validStops[0].longitude)]
        : [11.0168, 76.9558];

      const canUseGoogle = desiredProvider === 'google' && isGoogleMapsConfigured(CONFIG.GOOGLE_MAPS_KEY);

      if (canUseGoogle) {
        let googleInitialized = false;

        const triggerFallback = (reason) => {
          if (!isSubscribed) return;
          console.warn(`[MapProvider] ${reason}. Switching seamlessly to OpenStreetMap Transit.`);
          setProviderNotice('Google Maps key unauthorized on this origin (showing OpenStreetMap Transit)');
          setupLeafletMap(container, validStops, defaultCenter, initialBusLocation);
        };

        try {
          const provider = new GoogleMapsProvider();
          googleProviderInstanceRef.current = provider;

          // Timeout check: If Google Maps does not load tiles within 3.5 seconds due to auth restriction, switch to Leaflet
          authCheckTimer = setTimeout(() => {
            if (!googleInitialized && isSubscribed && activeProviderRef.current === 'google') {
              triggerFallback('Google Maps tile authorization timed out');
            }
          }, 3500);

          await provider.initMap(container, {
            apiKey: CONFIG.GOOGLE_MAPS_KEY,
            center: { lat: defaultCenter[0], lng: defaultCenter[1] },
            zoom: 9,
            onAuthFailure: () => {
              triggerFallback('Google Maps API key authentication failure (gm_authFailure)');
            },
            onTilesLoaded: () => {
              googleInitialized = true;
              if (authCheckTimer) clearTimeout(authCheckTimer);
              setProviderNotice(null);
            },
          });

          if (!isSubscribed) return;

          activeProviderRef.current = 'google';
          setActiveProviderName('Google Maps Roads & Live Traffic');

          // Render stops
          validStops.forEach((stop, index) => {
            const isStart = index === 0 || stop.id === boardingStopId;
            const isEnd = index === validStops.length - 1 || stop.id === droppingStopId;
            const type = isStart ? 'boarding' : isEnd ? 'dropping' : 'stop';

            provider.addStopMarker({
              id: stop.id || `stop-${index}`,
              lat: stop.latitude,
              lng: stop.longitude,
              title: stop.stop_name || stop.name,
              type,
              stopOrder: stop.stop_order || index + 1,
              city: stop.city || '',
              scheduledTime: stop.scheduled_time || stop.arrival_time || '',
              isPassed: Boolean(stop.is_passed),
            });
          });

          // Compute road route
          if (validStops.length > 1) {
            const summary = await provider.renderRealRoadRoute(validStops);
            if (summary && isSubscribed) {
              setRouteStats({
                distance: summary.totalDistanceKm,
                duration: summary.totalDurationText,
                legsCount: summary.legs?.length || 0,
              });
            }
          }

          if (initialBusLocation?.latitude && initialBusLocation?.longitude && hasLiveGps) {
            provider.updateBusMarker(
              parseFloat(initialBusLocation.latitude),
              parseFloat(initialBusLocation.longitude),
              initialBusLocation.heading || 0,
              {
                speed: initialBusLocation.speed || 0,
                nextStop: initialBusLocation.next_stop_name || '',
                eta: initialBusLocation.eta || '',
              }
            );
          }

          return;
        } catch (err) {
          triggerFallback(`Google Maps initialization error: ${err.message}`);
          return;
        }
      }

      // Default or fallback to Leaflet
      setProviderNotice(null);
      setupLeafletMap(container, validStops, defaultCenter, initialBusLocation);
    }

    ensureDimensionsAndInit();

    // Attach ResizeObserver to container to handle Split View / Map Only transitions and window resizes
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        if (leafletMapInstanceRef.current) {
          leafletMapInstanceRef.current.invalidateSize();
        } else if (googleProviderInstanceRef.current?.map && window.google?.maps?.event) {
          window.google.maps.event.trigger(googleProviderInstanceRef.current.map, 'resize');
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      isSubscribed = false;
      if (authCheckTimer) clearTimeout(authCheckTimer);
      if (resizeObserver) resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (googleProviderInstanceRef.current) {
        googleProviderInstanceRef.current.destroy();
        googleProviderInstanceRef.current = null;
      }
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }
      if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }
      leafletStopMarkersRef.current.clear();
      activeProviderRef.current = null;
    };
  }, [routeSignature, boardingStopId, droppingStopId, setupLeafletMap]);

  // Sync prop changes for GPS availability
  useEffect(() => {
    setEffectiveHasLiveGps(hasLiveGps);
    setEffectiveIsStale(isStale);
    if (initialBusLocation) {
      setLiveTelemetry(initialBusLocation);
    }
  }, [hasLiveGps, isStale, initialBusLocation]);

  // Separate effect: Update live telemetry and polylines during periodic polling WITHOUT tearing down the map
  useEffect(() => {
    if (leafletMapInstanceRef.current && stops.length > 0) {
      const currentCoords = (liveTelemetry && effectiveHasLiveGps)
        ? { lat: liveTelemetry.latitude, lng: liveTelemetry.longitude }
        : null;
      updatePolylines(stops, currentCoords);
    }
  }, [stops, liveTelemetry, effectiveHasLiveGps, updatePolylines]);

  // Real-Time Socket.IO GPS Listener & Smooth Animation
  useEffect(() => {
    if (!socket || !tripId || !connected) return;

    socket.emit('join_trip', tripId);

    const handleLocationUpdate = (data) => {
      if (data.tripId === tripId && data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        const speed = parseFloat(data.speed || 0);
        const heading = parseFloat(data.heading || 0);
        const nextStop = data.next_stop_name || '';
        const eta = data.eta || '';

        const updatedTelemetry = {
          latitude: lat,
          longitude: lng,
          speed,
          heading,
          next_stop_name: nextStop,
          eta,
          timestamp: new Date().toLocaleTimeString(),
        };

        setLiveTelemetry(updatedTelemetry);
        setEffectiveHasLiveGps(true);
        setEffectiveIsStale(false);

        if (onTelemetryUpdate) {
          onTelemetryUpdate(updatedTelemetry);
        }

        // Animate marker smoothly
        animateBusMarkerTo(lat, lng, heading, speed);

        // Update polylines
        updatePolylines(stops, { lat, lng });

        // Update speed badge in DOM directly if present
        if (leafletBusMarkerRef.current) {
          const el = leafletBusMarkerRef.current.getElement();
          if (el) {
            const speedEl = el.querySelector('div[style*="position: absolute; top: -20px"]');
            if (speedEl) speedEl.textContent = `${Math.round(speed)} km/h`;
          }
        }
      }
    };

    socket.on('bus_location_updated', handleLocationUpdate);

    return () => {
      socket.emit('leave_trip', tripId);
      socket.off('bus_location_updated', handleLocationUpdate);
    };
  }, [socket, tripId, connected, stops, animateBusMarkerTo, updatePolylines, onTelemetryUpdate]);

  // Center on Bus
  const handleCenterOnBus = () => {
    if (!effectiveHasLiveGps || !liveTelemetry?.latitude) return;
    const coords = [parseFloat(liveTelemetry.latitude), parseFloat(liveTelemetry.longitude)];

    if (leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.setView(coords, 14, { animate: true });
    } else if (googleProviderInstanceRef.current) {
      googleProviderInstanceRef.current.map?.panTo({ lat: coords[0], lng: coords[1] });
      googleProviderInstanceRef.current.map?.setZoom(14);
    }
  };

  // Fit Entire Route
  const handleFitRoute = () => {
    const validStops = stops.filter((s) => s.latitude && s.longitude);
    if (validStops.length === 0) return;

    if (leafletMapInstanceRef.current) {
      const bounds = validStops.map((s) => [parseFloat(s.latitude), parseFloat(s.longitude)]);
      if (liveTelemetry?.latitude && effectiveHasLiveGps) {
        bounds.push([parseFloat(liveTelemetry.latitude), parseFloat(liveTelemetry.longitude)]);
      }
      leafletMapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (googleProviderInstanceRef.current) {
      googleProviderInstanceRef.current.fitBounds(validStops);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 14, overflow: 'hidden' }}>
      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 14,
          background: '#070B14',
          border: '1px solid var(--sr-border-card)',
          boxShadow: 'var(--sr-shadow-lg)',
        }}
      />

      {/* Top Floating HUD: Provider Name, Socket Badge & View Controls */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {/* Provider Indicator & Diagnostic Notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'rgba(7, 11, 20, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--sr-border-card)',
              borderRadius: 8,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'var(--sr-text-secondary)',
              pointerEvents: 'auto',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: effectiveHasLiveGps ? '#10B981' : '#F59E0B',
                boxShadow: `0 0 8px ${effectiveHasLiveGps ? '#10B981' : '#F59E0B'}`,
              }}
            />
            <span style={{ fontWeight: 700, color: 'var(--sr-text-primary)' }}>{activeProviderName}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <SocketStatusBadge compact={true} />
          </div>

          {providerNotice && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#F59E0B',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                pointerEvents: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              title={providerNotice}
            >
              <AlertCircle size={13} />
              <span>{providerNotice}</span>
            </div>
          )}
        </div>

        {/* Map Control Buttons */}
        <div style={{ display: 'flex', gap: 6, pointerEvents: 'auto' }}>
          {effectiveHasLiveGps && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCenterOnBus}
              title="Center on Live Bus"
              style={{
                padding: '6px 12px',
                fontSize: 12,
                background: 'rgba(7, 11, 20, 0.9)',
                backdropFilter: 'blur(8px)',
                borderColor: 'rgba(0, 242, 254, 0.4)',
                color: 'var(--sr-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Bus size={13} /> Center Bus
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleFitRoute}
            title="View Full Route"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: 'rgba(7, 11, 20, 0.9)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Maximize2 size={13} /> Fit Route
          </button>
        </div>
      </div>

      {/* Legend & Split Polyline Indicator (Bottom-Right Floating) */}
      <div
        style={{
          position: 'absolute',
          bottom: effectiveHasLiveGps ? 76 : 16,
          right: 14,
          zIndex: 1000,
          background: 'rgba(7, 11, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--sr-border-card)',
          borderRadius: 8,
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: 11,
          color: 'var(--sr-text-secondary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, height: 4, background: '#10B981', borderRadius: 2 }} />
          <span>Completed Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 16, height: 4, background: '#F59E0B', borderRadius: 2, borderTop: '2px dashed #F59E0B' }} />
          <span>Remaining Journey</span>
        </div>
      </div>

      {/* Live Telemetry Floating Bottom HUD */}
      {effectiveHasLiveGps && liveTelemetry && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            right: 14,
            zIndex: 1000,
            background: 'rgba(11, 17, 32, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--sr-border-card)',
            borderRadius: 12,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: 'var(--sr-shadow-lg)',
          }}
        >
          {/* Speed & Direction */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.15)',
                padding: 6,
                borderRadius: 8,
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Gauge size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>Current Speed</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#F59E0B' }}>
                  {liveTelemetry.speed || 64} km/h
                </div>
              </div>
            </div>

            {liveTelemetry.next_stop_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid var(--sr-border-subtle)', paddingLeft: 14 }}>
                <div style={{
                  background: 'rgba(0, 242, 254, 0.15)',
                  padding: 6,
                  borderRadius: 8,
                  color: 'var(--sr-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>Next Scheduled Stop</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                    {liveTelemetry.next_stop_name}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Timer & Freshness */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                GPS Telemetry Stream
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: effectiveIsStale ? '#F59E0B' : '#10B981', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: effectiveIsStale ? '#F59E0B' : '#10B981' }} />
                {effectiveIsStale ? 'Signal Stale (>5m)' : 'Live Signal Active'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LIVE LOCATION UNAVAILABLE STATE ==================== */}
      {!effectiveHasLiveGps && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            right: 14,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: 'var(--sr-shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                Live Location Unavailable
              </div>
              <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 2 }}>
                Coach is currently on terminal standby. Live GPS broadcasting will activate automatically once the driver begins trip dispatch.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> Scheduled Standby
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
