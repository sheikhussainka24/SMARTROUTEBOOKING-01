import { isGoogleMapsConfigured } from '../google/googleMapsConfig.js';
import { isMapboxConfigured } from '../mapbox/mapboxConfig.js';

export const MAP_PROVIDERS = {
  LEAFLET: 'leaflet',
  GOOGLE: 'google',
  MAPBOX: 'mapbox',
};

export class MapFactory {
  static getProviderName(override) {
    const name = (override ||
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MAP_PROVIDER) ||
      (typeof process !== 'undefined' && process.env && process.env.MAP_PROVIDER) ||
      'leaflet').toLowerCase();

    if (name === 'google') return MAP_PROVIDERS.GOOGLE;
    if (name === 'mapbox') return MAP_PROVIDERS.MAPBOX;
    return MAP_PROVIDERS.LEAFLET;
  }

  static isConfigured(provider = MapFactory.getProviderName()) {
    if (provider === MAP_PROVIDERS.GOOGLE) {
      return isGoogleMapsConfigured();
    }
    if (provider === MAP_PROVIDERS.MAPBOX) {
      return isMapboxConfigured();
    }
    return true; // Leaflet requires no external credentials
  }
}

export default MapFactory;
