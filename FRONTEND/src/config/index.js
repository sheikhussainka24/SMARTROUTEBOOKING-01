export const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || window.location.origin,
  MAP_PROVIDER: import.meta.env.VITE_MAP_PROVIDER || 'leaflet',
  GOOGLE_MAPS_KEY: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
};

export default CONFIG;
