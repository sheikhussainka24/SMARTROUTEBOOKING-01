/**
 * SMART ROUTE — Unified Map Provider Interface
 * All map providers (Leaflet, Google Maps, Mapbox) must adhere to this interface.
 */

export class MapProviderInterface {
  initMap(containerId, options = {}) {
    throw new Error('initMap() must be implemented');
  }

  renderRoutePolyline(coordinates, style = {}) {
    throw new Error('renderRoutePolyline() must be implemented');
  }

  renderRealRoadRoute(stops = []) {
    // Default fallback to polyline
    const coords = stops.map((s) => ({
      lat: parseFloat(s.latitude),
      lng: parseFloat(s.longitude),
    }));
    return this.renderRoutePolyline(coords);
  }

  addStopMarker({ id, lat, lng, title, type, stopOrder, isPassed }) {
    throw new Error('addStopMarker() must be implemented');
  }

  updateStopProgress(passedStopIds = [], currentStopId = null) {
    // Optional provider implementation
  }

  updateBusMarker(lat, lng, heading = 0, telemetry = {}) {
    throw new Error('updateBusMarker() must be implemented');
  }

  calculateETA(fromCoord, toCoord) {
    return Promise.resolve(null);
  }

  fitBounds(bounds) {
    throw new Error('fitBounds() must be implemented');
  }

  destroy() {
    throw new Error('destroy() must be implemented');
  }
}

export default MapProviderInterface;
