import { MapProviderInterface } from '../providers/mapProviderInterface.js';
import { GOOGLE_MAPS_CONFIG, isGoogleMapsConfigured } from './googleMapsConfig.js';

let googleMapsScriptPromise = null;

/**
 * Dynamically load Google Maps JavaScript API with libraries
 * Never logs or exposes the key value.
 */
export function loadGoogleMapsScript(apiKey = GOOGLE_MAPS_CONFIG.apiKey) {
  if (typeof window === 'undefined') return Promise.resolve(null);

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  const effectiveKey = apiKey || GOOGLE_MAPS_CONFIG.apiKey;
  if (!effectiveKey || effectiveKey === 'your_google_maps_api_key_here') {
    return Promise.reject(new Error('Google Maps API Key is not configured in environment'));
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    // Check again if script is already present in document
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', (err) => reject(new Error('Google Maps SDK failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${effectiveKey}&libraries=places,geometry,directions`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        googleMapsScriptPromise = null;
        reject(new Error('Google Maps SDK failed to initialize'));
      }
    };

    script.onerror = () => {
      googleMapsScriptPromise = null;
      reject(new Error('Failed to load Google Maps SDK script. Verify network connection and API key permissions.'));
    };

    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

/**
 * Production Google Maps Provider
 * High-performance, real road routing, live bus tracking, and stop-by-stop progress.
 */
export class GoogleMapsProvider extends MapProviderInterface {
  constructor() {
    super();
    this.map = null;
    this.markers = new Map();
    this.markerData = new Map();
    this.busMarker = null;
    this.busPulseCircle = null;
    this.directionsService = null;
    this.directionsRenderer = null;
    this.distanceMatrixService = null;
    this.polyline = null;
    this.routeSummary = null;
  }

  async initMap(container, options = {}) {
    if (!container) throw new Error('Map container element is required');

    // Register auth failure callback if provided
    if (typeof window !== 'undefined') {
      const prevAuthFailure = window.gm_authFailure;
      window.gm_authFailure = () => {
        console.warn('[GoogleMaps] Authentication failed: check API key restrictions, billing, or enabled APIs on Google Cloud Console.');
        if (typeof options.onAuthFailure === 'function') {
          options.onAuthFailure(new Error('Google Maps API key is not authorized for this origin/domain'));
        }
        if (typeof prevAuthFailure === 'function') {
          prevAuthFailure();
        }
      };
    }

    const maps = await loadGoogleMapsScript(options.apiKey);
    if (!maps) throw new Error('Google Maps is not available in current environment');

    const center = options.center || GOOGLE_MAPS_CONFIG.defaultCenter;
    const zoom = options.zoom || GOOGLE_MAPS_CONFIG.defaultZoom;

    // Dark-themed premium transit map style for SMART ROUTE
    const mapStyles = [
      { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#334155' }],
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#0284c7' }],
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#0369a1' }],
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#0f172a' }],
      },
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#1e293b' }],
      },
    ];

    this.container = container;
    this.map = new maps.Map(container, {
      center,
      zoom,
      styles: mapStyles,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: 'greedy',
    });

    if (this.map && typeof this.map.addListener === 'function' && typeof options.onTilesLoaded === 'function') {
      this.map.addListener('tilesloaded', () => {
        options.onTilesLoaded();
      });
    }

    this.directionsService = new maps.DirectionsService();
    this.distanceMatrixService = new maps.DistanceMatrixService();
    this.directionsRenderer = new maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#38bdf8',
        strokeWeight: 5,
        strokeOpacity: 0.9,
      },
    });

    return this.map;
  }

  /**
   * Render route on real road network using Google Directions Service
   * Calculates real driving distances, ETAs, and stop-to-stop legs.
   */
  async renderRealRoadRoute(stops = []) {
    if (!this.directionsService || stops.length < 2) return null;

    const validStops = stops.filter((s) => s.latitude && s.longitude);
    if (validStops.length < 2) return null;

    const origin = {
      lat: parseFloat(validStops[0].latitude),
      lng: parseFloat(validStops[0].longitude),
    };

    const destination = {
      lat: parseFloat(validStops[validStops.length - 1].latitude),
      lng: parseFloat(validStops[validStops.length - 1].longitude),
    };

    // Google Directions API supports max 25 waypoints in standard requests
    const intermediateStops = validStops.slice(1, -1);
    const waypoints = intermediateStops.slice(0, 23).map((s) => ({
      location: { lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) },
      stopover: true,
    }));

    return new Promise((resolve) => {
      try {
        const travelMode = (window.google?.maps?.TravelMode && window.google.maps.TravelMode.DRIVING)
          ? window.google.maps.TravelMode.DRIVING
          : 'DRIVING';

        const okStatus = (window.google?.maps?.DirectionsStatus && window.google.maps.DirectionsStatus.OK)
          ? window.google.maps.DirectionsStatus.OK
          : 'OK';

        this.directionsService.route(
          {
            origin,
            destination,
            waypoints,
            travelMode,
            optimizeWaypoints: false,
          },
          (result, status) => {
            if (status === okStatus && result) {
              if (this.directionsRenderer) {
                this.directionsRenderer.setDirections(result);
              }

              // Compute route distance and ETA summary from legs
              const route = result.routes && result.routes[0];
              let totalDistanceMeters = 0;
              let totalDurationSeconds = 0;
              const legSummaries = [];

              if (route && route.legs) {
                route.legs.forEach((leg, idx) => {
                  totalDistanceMeters += leg.distance?.value || 0;
                  totalDurationSeconds += leg.duration?.value || 0;
                  legSummaries.push({
                    legIndex: idx,
                    startAddress: leg.start_address,
                    endAddress: leg.end_address,
                    distanceText: leg.distance?.text || '',
                    distanceMeters: leg.distance?.value || 0,
                    durationText: leg.duration?.text || '',
                    durationSeconds: leg.duration?.value || 0,
                  });
                });
              }

              const formatDuration = (secs) => {
                const h = Math.floor(secs / 3600);
                const m = Math.floor((secs % 3600) / 60);
                return h > 0 ? `${h}h ${m}m` : `${m} mins`;
              };

              this.routeSummary = {
                success: true,
                totalDistanceKm: (totalDistanceMeters / 1000).toFixed(1) + ' km',
                totalDistanceMeters,
                totalDurationText: formatDuration(totalDurationSeconds),
                totalDurationSeconds,
                legs: legSummaries,
                directionsResult: result,
              };

              resolve(this.routeSummary);
            } else {
              // Graceful fallback to direct polyline if road routing hits quota or status != OK
              this.renderRoutePolyline(
                validStops.map((s) => ({ lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) }))
              );
              resolve(null);
            }
          }
        );
      } catch (err) {
        console.warn('[GoogleMaps] Directions service error:', err.message);
        this.renderRoutePolyline(
          validStops.map((s) => ({ lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) }))
        );
      }
    });
  }

  /**
   * Polyline fallback for direct routes
   */
  renderRoutePolyline(coordinates, style = {}) {
    if (!this.map || !window.google) return;

    if (this.polyline) {
      this.polyline.setMap(null);
    }

    const path = coordinates.map((c) => ({ lat: c.lat || c[0], lng: c.lng || c[1] }));
    this.polyline = new window.google.maps.Polyline({
      path,
      strokeColor: style.color || '#38bdf8',
      strokeWeight: style.weight || 5,
      strokeOpacity: style.opacity || 0.85,
      map: this.map,
    });

    this.fitBounds(path);
  }

  /**
   * Add interactive stop marker (Boarding, Dropping, or Intermediate)
   */
  addStopMarker({
    id,
    lat,
    lng,
    title,
    type = 'stop',
    stopOrder,
    city = '',
    scheduledTime = '',
    isPassed = false,
  }) {
    if (!this.map || !window.google) return null;

    const isStart = type === 'boarding' || stopOrder === 1;
    const isEnd = type === 'dropping';
    const pinColor = isPassed
      ? '#64748b'
      : isStart
      ? '#10b981'
      : isEnd
      ? '#ef4444'
      : '#38bdf8';

    const marker = new window.google.maps.Marker({
      position: { lat: parseFloat(lat), lng: parseFloat(lng) },
      map: this.map,
      title: title || `Stop ${stopOrder}`,
      opacity: isPassed ? 0.6 : 1.0,
      label: {
        text: String(stopOrder || ''),
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 'bold',
      },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: pinColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 12,
      },
    });

    const badgeStyle = isStart
      ? 'background: #10b981; color: white;'
      : isEnd
      ? 'background: #ef4444; color: white;'
      : 'background: #0284c7; color: white;';

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="color: #0f172a; padding: 8px; font-family: system-ui, sans-serif; min-width: 160px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <strong style="font-size: 13px;">${title}</strong>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; ${badgeStyle}">
              ${(type || 'STOP').toUpperCase()}
            </span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            ${city ? city + ' &bull; ' : ''}Stop #${stopOrder}
          </div>
          ${scheduledTime ? `<div style="font-size: 11px; color: #0284c7; margin-top: 4px; font-weight: 600;">⏰ Scheduled: ${scheduledTime}</div>` : ''}
          ${isPassed ? '<div style="font-size: 10px; color: #10b981; margin-top: 4px; font-weight: 600;">✓ Completed Stop</div>' : ''}
        </div>
      `,
    });

    marker.addListener('click', () => {
      infoWindow.open(this.map, marker);
    });

    this.markers.set(id, marker);
    this.markerData.set(id, { id, lat, lng, title, type, stopOrder, city, scheduledTime, isStart, isEnd });
    return marker;
  }

  /**
   * Update visual progress for stops (Dim completed stops, highlight upcoming)
   */
  updateStopProgress(passedStopIds = [], currentStopId = null) {
    if (!this.map || !window.google) return;

    this.markers.forEach((marker, id) => {
      const data = this.markerData.get(id);
      if (!data) return;

      const isPassed = passedStopIds.includes(id);
      const isCurrent = id === currentStopId;

      let color = data.isStart ? '#10b981' : data.isEnd ? '#ef4444' : '#38bdf8';
      let scale = 12;
      let opacity = 1.0;

      if (isPassed) {
        color = '#64748b'; // Slate gray for passed stops
        opacity = 0.55;
      } else if (isCurrent) {
        color = '#f59e0b'; // Amber for next upcoming stop
        scale = 15;
      }

      marker.setOpacity(opacity);
      marker.setIcon({
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: isCurrent ? 3 : 2,
        scale,
      });
    });
  }

  /**
   * Live GPS Bus Location Marker with Heading & Telemetry
   */
  updateBusMarker(lat, lng, heading = 0, telemetry = {}) {
    if (!this.map || !window.google) return;

    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };

    const speedDisplay = telemetry.speed ? `${telemetry.speed} km/h` : 'In Motion';
    const nextStopDisplay = telemetry.nextStop ? `Next: ${telemetry.nextStop}` : 'En Route';
    const etaDisplay = telemetry.eta ? `ETA: ${telemetry.eta}` : '';

    const popupContent = `
      <div style="color: #0f172a; padding: 8px; font-family: system-ui, sans-serif; min-width: 170px;">
        <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: #0284c7;">
          🚌 Live Bus GPS
        </div>
        <div style="font-size: 12px; font-weight: 600; color: #1e293b; margin-top: 4px;">
          ${speedDisplay} &bull; Heading ${Math.round(heading || 0)}°
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 3px;">
          ${nextStopDisplay}
        </div>
        ${etaDisplay ? `<div style="font-size: 11px; font-weight: 700; color: #10b981; margin-top: 3px;">${etaDisplay}</div>` : ''}
        <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">
          GPS: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}
        </div>
      </div>
    `;

    if (!this.busMarker) {
      // Create primary directional bus marker
      this.busMarker = new window.google.maps.Marker({
        position,
        map: this.map,
        title: 'Live Bus Location',
        zIndex: 999,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#eab308',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: heading || 0,
        },
      });

      // Pulse accuracy circle around live bus position
      this.busPulseCircle = new window.google.maps.Circle({
        strokeColor: '#eab308',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: '#eab308',
        fillOpacity: 0.15,
        map: this.map,
        center: position,
        radius: 120, // 120 meters
        zIndex: 998,
      });

      this.busInfoWindow = new window.google.maps.InfoWindow({
        content: popupContent,
      });

      this.busMarker.addListener('click', () => {
        this.busInfoWindow.open(this.map, this.busMarker);
      });
    } else {
      this.busMarker.setPosition(position);
      if (this.busPulseCircle) {
        this.busPulseCircle.setCenter(position);
      }

      const icon = this.busMarker.getIcon();
      if (icon) {
        icon.rotation = heading || 0;
        this.busMarker.setIcon(icon);
      }

      if (this.busInfoWindow) {
        this.busInfoWindow.setContent(popupContent);
      }
    }

    this.map.panTo(position);
  }

  /**
   * Real-time ETA Calculation between Coordinates using Google Distance Matrix
   */
  async calculateETA(origin, destination) {
    if (!this.distanceMatrixService || !window.google) return null;

    const originLatLng = new window.google.maps.LatLng(origin.lat, origin.lng);
    const destLatLng = new window.google.maps.LatLng(destination.lat, destination.lng);

    return new Promise((resolve) => {
      this.distanceMatrixService.getDistanceMatrix(
        {
          origins: [originLatLng],
          destinations: [destLatLng],
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
          if (status === window.google.maps.DistanceMatrixStatus.OK) {
            const element = response.rows[0]?.elements[0];
            if (element && element.status === 'OK') {
              resolve({
                distanceText: element.distance.text,
                distanceMeters: element.distance.value,
                durationText: element.duration.text,
                durationSeconds: element.duration.value,
                etaTimestamp: new Date(Date.now() + element.duration.value * 1000).toISOString(),
              });
              return;
            }
          }
          resolve(null);
        }
      );
    });
  }

  fitBounds(coordinates = []) {
    if (!this.map || !window.google || coordinates.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach((c) => {
      bounds.extend({ lat: c.lat || c[0], lng: c.lng || c[1] });
    });
    this.map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
  }

  destroy() {
    this.markers.forEach((m) => m.setMap(null));
    this.markers.clear();
    this.markerData.clear();
    if (this.busMarker) this.busMarker.setMap(null);
    if (this.busPulseCircle) this.busPulseCircle.setMap(null);
    if (this.polyline) this.polyline.setMap(null);
    if (this.directionsRenderer) this.directionsRenderer.setMap(null);
    this.map = null;
  }
}

export default GoogleMapsProvider;
