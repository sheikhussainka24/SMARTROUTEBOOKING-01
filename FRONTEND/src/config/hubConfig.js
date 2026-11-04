import { useState, useEffect } from 'react';
import api from '../services/api.js';

export const DEFAULT_HUB_CONFIG = Object.freeze({
  name: 'SMART ROUTE Central Bus Hub',
  line1: 'SMART ROUTE Central Bus Hub',
  line2: 'Palakkad – Ukkadam Highway',
  line3: 'K.G. Chavadi, Coimbatore – 641105',
  line4: 'Tamil Nadu, India.',
  formattedAddress: 'SMART ROUTE Central Bus Hub, Palakkad – Ukkadam Highway, K.G. Chavadi, Coimbatore – 641105, Tamil Nadu, India.',
  landmark: 'K.G. Chavadi',
  highway: 'Palakkad – Ukkadam Highway',
  city: 'Coimbatore',
  pincode: '641105',
  state: 'Tamil Nadu',
  country: 'India',
  helpline: '+91 8072065549',
  email: 'support@smartroutebooking.com',
  isVerifiedLocation: false,
});

export const HUB_CONFIG = { ...DEFAULT_HUB_CONFIG };

/**
 * React hook to access and synchronize the designated Central Bus Hub configuration
 */
export function useHubConfig() {
  const [hubConfig, setHubConfig] = useState(() => {
    try {
      const cached = sessionStorage.getItem('sr_hub_config');
      return cached ? JSON.parse(cached) : DEFAULT_HUB_CONFIG;
    } catch {
      return DEFAULT_HUB_CONFIG;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get('/config/hub')
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setHubConfig(res.data);
          Object.assign(HUB_CONFIG, res.data);
          try {
            sessionStorage.setItem('sr_hub_config', JSON.stringify(res.data));
          } catch {
            // Non-fatal
          }
        }
      })
      .catch(() => {
        // Fallback gracefully to DEFAULT_HUB_CONFIG
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateHubConfig = async (newConfig) => {
    setLoading(true);
    try {
      const res = await api.put('/admin/settings/hub', newConfig);
      if (res.success && res.data) {
        setHubConfig(res.data);
        Object.assign(HUB_CONFIG, res.data);
        sessionStorage.setItem('sr_hub_config', JSON.stringify(res.data));
        return res.data;
      }
      throw new Error(res.error || 'Failed to update hub settings');
    } finally {
      setLoading(false);
    }
  };

  return { hubConfig, updateHubConfig, loading };
}

export default HUB_CONFIG;
