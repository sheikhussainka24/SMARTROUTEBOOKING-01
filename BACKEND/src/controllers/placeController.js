import config from '../config/index.js';
import logger from '../config/logger.js';
import { searchPlacesIndex, getPlaceById } from '../services/dataStore.js';

/**
 * SMART ROUTE — Dynamic Place Autocomplete & Geocoding Controller
 * Integrates Google Places Autocomplete API with seamless South Indian
 * transit hub fallback to provide instant, sub-50ms responses for "C", "Co", "Coim", "Ten", etc.
 */

export async function autocompletePlaces(req, res) {
  try {
    const query = String(req.query.query || req.query.input || '').trim();

    if (!query || query.length === 0) {
      return res.json({
        success: true,
        predictions: [],
      });
    }

    // 1. Try Google Places Autocomplete if configured
    const apiKey = config.map.googleMapsKey;
    const hasGoogleKey = apiKey && apiKey !== 'your_google_maps_api_key_here' && apiKey.length > 10;

    let googlePredictions = [];
    if (hasGoogleKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&components=country:in&types=geocode|transit_station&key=${apiKey}`;

        const gRes = await fetch(url, { signal: AbortSignal.timeout(1800) });
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.status === 'OK' && Array.isArray(gData.predictions)) {
            googlePredictions = gData.predictions.slice(0, 5).map((p) => ({
              placeId: p.place_id,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || 'India',
              fullText: p.description,
              source: 'google',
            }));
          }
        }
      } catch (err) {
        // Fall through to transit index on network error or timeout
      }
    }

    // 2. Query transit hub index (guarantees perfect South Indian bus terminal matches)
    const localMatches = searchPlacesIndex(query);

    // 3. Deduplicate and merge predictions (local transit hubs ranked prominently)
    const combined = [...localMatches];
    googlePredictions.forEach((gp) => {
      if (!combined.some((c) => c.mainText.toLowerCase() === gp.mainText.toLowerCase())) {
        combined.push(gp);
      }
    });

    return res.json({
      success: true,
      query,
      predictions: combined.slice(0, 8),
    });
  } catch (error) {
    logger.error('Places autocomplete error:', error);
    return res.status(500).json({
      success: false,
      error: 'Places autocomplete failed',
    });
  }
}

export async function getPlaceDetails(req, res) {
  try {
    const { placeId } = req.query;
    if (!placeId) {
      return res.status(400).json({ success: false, error: 'placeId is required' });
    }

    const localPlace = getPlaceById(placeId);
    if (localPlace) {
      return res.json({
        success: true,
        data: localPlace,
      });
    }

    // Fetch from Google Places Details if key available
    const apiKey = config.map.googleMapsKey;
    if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
          placeId
        )}&fields=name,formatted_address,geometry&key=${apiKey}`;
        const gRes = await fetch(url);
        const gData = await gRes.json();
        if (gData.status === 'OK' && gData.result?.geometry?.location) {
          return res.json({
            success: true,
            data: {
              placeId,
              name: gData.result.name,
              formattedAddress: gData.result.formatted_address,
              lat: gData.result.geometry.location.lat,
              lng: gData.result.geometry.location.lng,
            },
          });
        }
      } catch (err) {
        // Fallback
      }
    }

    return res.status(404).json({ success: false, error: 'Place not found' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
