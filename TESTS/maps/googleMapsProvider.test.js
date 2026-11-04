import { jest } from '@jest/globals';
import config from '../../BACKEND/src/config/index.js';

import { MapProviderInterface } from '../../MAPS/providers/mapProviderInterface.js';
import { GoogleMapsProvider } from '../../MAPS/google/googleMapsProvider.js';
import { GOOGLE_MAPS_CONFIG, isGoogleMapsConfigured } from '../../MAPS/google/googleMapsConfig.js';
import { MapFactory, MAP_PROVIDERS } from '../../MAPS/providers/mapFactory.js';

describe('Google Maps Production Provider & Architecture Tests', () => {
  test('Backend config correctly loads Google Maps provider and key', () => {
    expect(config.map.provider).toBe('google');
    expect(typeof config.map.googleMapsKey).toBe('string');
    expect(config.map.googleMapsKey.length).toBeGreaterThan(10);
    expect(config.map.googleMapsKey).not.toBe('your_google_maps_api_key_here');
  });

  // 1. Provider Abstraction & Factory Validation
  test('MapFactory correctly resolves google when MAP_PROVIDER is set to google', () => {
    const providerName = MapFactory.getProviderName('google');
    expect(providerName).toBe(MAP_PROVIDERS.GOOGLE);
  });

  test('MapFactory preserves multi-provider abstraction for Leaflet and Mapbox', () => {
    expect(MapFactory.getProviderName('leaflet')).toBe(MAP_PROVIDERS.LEAFLET);
    expect(MapFactory.getProviderName('mapbox')).toBe(MAP_PROVIDERS.MAPBOX);
    expect(MapFactory.getProviderName('unknown')).toBe(MAP_PROVIDERS.LEAFLET);
  });

  test('Google Maps configuration is validated without exposing secret keys', () => {
    // API key must be populated in current environment and valid length
    expect(typeof GOOGLE_MAPS_CONFIG.apiKey).toBe('string');
    expect(GOOGLE_MAPS_CONFIG.apiKey.length).toBeGreaterThan(10);
    expect(GOOGLE_MAPS_CONFIG.apiKey).not.toBe('your_google_maps_api_key_here');
    expect(isGoogleMapsConfigured()).toBe(true);
    expect(MapFactory.isConfigured('google')).toBe(true);
  });

  test('GoogleMapsProvider adheres strictly to MapProviderInterface contract', () => {
    const provider = new GoogleMapsProvider();
    expect(provider).toBeInstanceOf(MapProviderInterface);

    // Verify all required methods exist on provider instance
    expect(typeof provider.initMap).toBe('function');
    expect(typeof provider.renderRealRoadRoute).toBe('function');
    expect(typeof provider.renderRoutePolyline).toBe('function');
    expect(typeof provider.addStopMarker).toBe('function');
    expect(typeof provider.updateStopProgress).toBe('function');
    expect(typeof provider.updateBusMarker).toBe('function');
    expect(typeof provider.calculateETA).toBe('function');
    expect(typeof provider.fitBounds).toBe('function');
    expect(typeof provider.destroy).toBe('function');
  });

  // 2. Interactive Map & Simulation Tests in Node Environment
  describe('Mocked Google Maps Services Behavior', () => {
    let mockMap;
    let mockDirectionsService;
    let mockDirectionsRenderer;
    let mockMarkers;
    let provider;

    beforeEach(() => {
      mockMarkers = [];
      mockMap = {
        panTo: jest.fn(),
        fitBounds: jest.fn(),
        setCenter: jest.fn(),
        setZoom: jest.fn(),
      };

      mockDirectionsRenderer = {
        setDirections: jest.fn(),
        setMap: jest.fn(),
      };

      mockDirectionsService = {
        route: jest.fn((req, callback) => {
          callback(
            {
              routes: [
                {
                  legs: [
                    {
                      distance: { text: '142 km', value: 142000 },
                      duration: { text: '2h 45m', value: 9900 },
                      start_address: 'Bangalore Majestic',
                      end_address: 'Hosur Bus Stand',
                    },
                    {
                      distance: { text: '206 km', value: 206000 },
                      duration: { text: '3h 30m', value: 12600 },
                      start_address: 'Hosur Bus Stand',
                      end_address: 'Salem Junction',
                    },
                  ],
                },
              ],
            },
            'OK'
          );
        }),
      };

      // Set up global window.google mocks
      global.window = {
        google: {
          maps: {
            Map: jest.fn(() => mockMap),
            DirectionsService: jest.fn(() => mockDirectionsService),
            DirectionsRenderer: jest.fn(() => mockDirectionsRenderer),
            DistanceMatrixService: jest.fn(() => ({
              getDistanceMatrix: jest.fn((opts, cb) => {
                cb(
                  {
                    rows: [
                      {
                        elements: [
                          {
                            status: 'OK',
                            distance: { text: '45 km', value: 45000 },
                            duration: { text: '52 mins', value: 3120 },
                          },
                        ],
                      },
                    ],
                  },
                  'OK'
                );
              }),
            })),
            LatLng: jest.fn((lat, lng) => ({ lat, lng })),
            LatLngBounds: jest.fn(() => ({
              extend: jest.fn(),
            })),
            Marker: jest.fn((opts) => {
              const marker = {
                ...opts,
                setPosition: jest.fn(),
                setIcon: jest.fn(),
                setOpacity: jest.fn(),
                setMap: jest.fn(),
                getIcon: jest.fn(() => opts.icon),
                addListener: jest.fn(),
              };
              mockMarkers.push(marker);
              return marker;
            }),
            InfoWindow: jest.fn((opts) => ({
              ...opts,
              open: jest.fn(),
              close: jest.fn(),
              setContent: jest.fn(),
            })),
            Circle: jest.fn((opts) => ({
              ...opts,
              setCenter: jest.fn(),
              setMap: jest.fn(),
            })),
            Polyline: jest.fn((opts) => ({
              ...opts,
              setMap: jest.fn(),
            })),
            SymbolPath: {
              CIRCLE: 'circle',
              FORWARD_CLOSED_ARROW: 'arrow',
            },
            TravelMode: { DRIVING: 'DRIVING' },
            DirectionsStatus: { OK: 'OK' },
            DistanceMatrixStatus: { OK: 'OK' },
          },
        },
      };

      provider = new GoogleMapsProvider();
      provider.map = mockMap;
      provider.directionsService = mockDirectionsService;
      provider.directionsRenderer = mockDirectionsRenderer;
      provider.distanceMatrixService = new global.window.google.maps.DistanceMatrixService();
    });

    afterEach(() => {
      if (provider) {
        provider.destroy();
      }
      delete global.window;
    });

    test('Renders real road routing via Google Directions Service and returns route stats', async () => {
      const stops = [
        { latitude: 12.9716, longitude: 77.5946, stop_name: 'Bangalore' },
        { latitude: 12.7409, longitude: 77.8253, stop_name: 'Hosur' },
        { latitude: 11.6643, longitude: 78.1460, stop_name: 'Salem' },
      ];

      const result = await provider.renderRealRoadRoute(stops);
      expect(result).not.toBeNull();
      expect(result.success).toBe(true);
      expect(result.totalDistanceKm).toBe('348.0 km');
      expect(result.totalDurationText).toBe('6h 15m');
      expect(result.legs.length).toBe(2);
      expect(mockDirectionsRenderer.setDirections).toHaveBeenCalled();
    });

    test('Adds Boarding, Dropping, and Intermediate stop markers with distinct styling', () => {
      const boardingMarker = provider.addStopMarker({
        id: 'stop-1',
        lat: 12.9716,
        lng: 77.5946,
        title: 'Majestic Bus Stand',
        type: 'boarding',
        stopOrder: 1,
        city: 'Bangalore',
      });
      expect(boardingMarker).toBeDefined();
      expect(boardingMarker.icon.fillColor).toBe('#10b981'); // Emerald green for boarding

      const intermediateMarker = provider.addStopMarker({
        id: 'stop-2',
        lat: 12.7409,
        lng: 77.8253,
        title: 'Hosur Bus Stand',
        type: 'stop',
        stopOrder: 2,
        city: 'Hosur',
      });
      expect(intermediateMarker.icon.fillColor).toBe('#38bdf8'); // Sky blue for intermediate

      const droppingMarker = provider.addStopMarker({
        id: 'stop-3',
        lat: 11.6643,
        lng: 78.1460,
        title: 'Salem Junction',
        type: 'dropping',
        stopOrder: 3,
        city: 'Salem',
      });
      expect(droppingMarker.icon.fillColor).toBe('#ef4444'); // Crimson red for dropping
    });

    test('Updates stop progress by dimming passed stops and highlighting upcoming stop', () => {
      provider.addStopMarker({ id: 's1', lat: 12.97, lng: 77.59, title: 'Stop 1', type: 'boarding', stopOrder: 1 });
      provider.addStopMarker({ id: 's2', lat: 12.74, lng: 77.82, title: 'Stop 2', type: 'stop', stopOrder: 2 });
      provider.addStopMarker({ id: 's3', lat: 11.66, lng: 78.14, title: 'Stop 3', type: 'dropping', stopOrder: 3 });

      provider.updateStopProgress(['s1'], 's2');

      const s1Marker = provider.markers.get('s1');
      const s2Marker = provider.markers.get('s2');

      expect(s1Marker.setOpacity).toHaveBeenCalledWith(0.55);
      expect(s1Marker.setIcon).toHaveBeenCalledWith(
        expect.objectContaining({ fillColor: '#64748b' }) // Passed stop slate color
      );
      expect(s2Marker.setIcon).toHaveBeenCalledWith(
        expect.objectContaining({ fillColor: '#f59e0b', scale: 15 }) // Next upcoming stop amber highlight
      );
    });

    test('Updates live GPS bus marker with heading rotation and telemetry info', () => {
      provider.updateBusMarker(12.85, 77.75, 135, {
        speed: 68,
        nextStop: 'Hosur',
        eta: '25 mins',
      });

      expect(provider.busMarker).not.toBeNull();
      expect(provider.busPulseCircle).not.toBeNull();
      expect(mockMap.panTo).toHaveBeenCalledWith({ lat: 12.85, lng: 77.75 });

      // Update location as bus moves
      provider.updateBusMarker(12.80, 77.78, 140, {
        speed: 72,
        nextStop: 'Hosur',
        eta: '18 mins',
      });
      expect(provider.busMarker.setPosition).toHaveBeenCalledWith({ lat: 12.8, lng: 77.78 });
    });

    test('Calculates real-time ETA via Google Distance Matrix Service', async () => {
      const eta = await provider.calculateETA({ lat: 12.85, lng: 77.75 }, { lat: 12.74, lng: 77.82 });
      expect(eta).not.toBeNull();
      expect(eta.distanceText).toBe('45 km');
      expect(eta.durationText).toBe('52 mins');
      expect(eta.durationSeconds).toBe(3120);
      expect(eta.etaTimestamp).toBeDefined();
    });

    test('Cleans up all markers, circles, and listeners on destroy()', () => {
      provider.addStopMarker({ id: 's1', lat: 12.97, lng: 77.59, title: 'Stop 1', stopOrder: 1 });
      provider.updateBusMarker(12.97, 77.59, 90);

      expect(provider.markers.size).toBe(1);
      expect(provider.busMarker).not.toBeNull();

      provider.destroy();

      expect(provider.markers.size).toBe(0);
      expect(provider.map).toBeNull();
    });
  });
});
