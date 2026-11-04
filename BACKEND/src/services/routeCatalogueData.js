/**
 * SMART ROUTE — Long-Distance Private Bus Route Catalogue & Presentation Data
 *
 * Comprehensive Route Catalogue originating from:
 * 1. Coimbatore, Tamil Nadu (23 Candidate Corridors)
 * 2. Bengaluru, Karnataka (38 Candidate Corridors)
 * Plus full Reverse-Direction Corridors, Intermediate Stops, and Alias Resolution.
 *
 * Excludes town buses, MTC services, local city buses, and government/RTC services.
 * Features long-distance private coaches: Sleeper, Seater-cum-Sleeper, and Premium Multi-Axle.
 */

// Internal verification statuses
export const STATUS = {
  CANDIDATE: 'CANDIDATE',                     // In catalogue, pending live service
  SEED: 'SEED',                               // Fictional data generated for presentation/testing
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',// Awaiting operator proof
  VERIFIED: 'VERIFIED',                       // Confirmed authorised operator data
  INACTIVE: 'INACTIVE',                       // Temporarily disabled
};

import { PAN_INDIA_CITY_ALIASES } from '../data/indiaTransitHubs.js';
import { PAN_INDIA_CORRIDORS } from '../data/panIndiaRoutes.js';

// ============================================================================
// 1. CITY ALIASES & NORMALIZATION MAP
// ============================================================================
export const CITY_ALIASES = {
  ...PAN_INDIA_CITY_ALIASES,
  coimbatore: ['coimbatore', 'kovai', 'cbe'],
  bengaluru: ['bengaluru', 'bangalore', 'blr'],
  chennai: ['chennai', 'madras', 'mas', 'che'],
  madurai: ['madurai', 'mdu'],
  tenkasi: ['tenkasi', 'tks'],
  tirunelveli: ['tirunelveli', 'nellai', 'tnv'],
  nagercoil: ['nagercoil', 'ngl'],
  thoothukudi: ['thoothukudi', 'tuticorin', 'tcr'],
  rameswaram: ['rameswaram', 'rameshwaram', 'rmm'],
  tiruchendur: ['tiruchendur', 'tcn'],
  tiruchirappalli: ['tiruchirappalli', 'trichy', 'tpj', 'trz'],
  thanjavur: ['thanjavur', 'tanjore', 'tj'],
  salem: ['salem', 'sa'],
  erode: ['erode', 'ed'],
  tiruppur: ['tiruppur', 'tirupur', 'tup'],
  hosur: ['hosur', 'hsr'],
  // Kerala Corridors: Kochi and Ernakulam are related destination hubs
  kochi: ['kochi', 'cochin', 'ernakulam', 'vytilla'],
  ernakulam: ['ernakulam', 'kochi', 'cochin', 'south railway'],
  thrissur: ['thrissur', 'trichur', 'tcr'],
  kozhikode: ['kozhikode', 'calicut', 'clt'],
  kannur: ['kannur', 'cannanore', 'can'],
  palakkad: ['palakkad', 'palghat', 'pgt'],
  thiruvananthapuram: ['thiruvananthapuram', 'trivandrum', 'tvm'],
  kollam: ['kollam', 'quilon', 'qln'],
  kottayam: ['kottayam', 'ktm'],
  // Andhra & Telangana
  hyderabad: ['hyderabad', 'secunderabad', 'hyd'],
  vijayawada: ['vijayawada', 'vja', 'bza'],
  visakhapatnam: ['visakhapatnam', 'vizag', 'vskp'],
  tirupati: ['tirupati', 'tpty'],
  guntur: ['guntur', 'gnt'],
  kurnool: ['kurnool', 'knl'],
  nellore: ['nellore', 'nlr'],
  // Karnataka
  mysuru: ['mysuru', 'mysore', 'mys'],
  mangaluru: ['mangaluru', 'mangalore', 'mlr', 'maq'],
  belagavi: ['belagavi', 'belgaum', 'bgm'],
  hubballi: ['hubballi', 'hubli', 'ubl'],
  // Goa & Maharashtra
  goa: ['goa', 'panaji', 'panjim', 'madgaon', 'margao'],
  mumbai: ['mumbai', 'bombay', 'bom'],
  pune: ['pune', 'poona', 'pnq'],
  shirdi: ['shirdi'],
  // Puducherry
  puducherry: ['puducherry', 'pondicherry', 'pondy', 'pdy'],
};

/**
 * Normalizes input city to master key
 */
export function normalizeCityName(input) {
  if (!input) return '';
  const clean = String(input).toLowerCase().trim();
  for (const [master, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.some((a) => clean === a || clean.includes(a))) {
      return master.charAt(0).toUpperCase() + master.slice(1);
    }
  }
  return input.trim();
}

/**
 * Checks if two city names match (direct or alias)
 */
export function isCityMatch(searchedCity, candidateCity) {
  if (!searchedCity || !candidateCity) return false;
  const s = String(searchedCity).toLowerCase().trim();
  const c = String(candidateCity).toLowerCase().trim();
  if (s === c) return true;
  if (s.length >= 3 && c.length >= 3 && (s.includes(c) || c.includes(s))) return true;

  for (const aliases of Object.values(CITY_ALIASES)) {
    const sMatch = aliases.some((a) => s === a || (a.length >= 3 && s.includes(a)));
    const cMatch = aliases.some((a) => c === a || (a.length >= 3 && c.includes(a)));
    if (sMatch && cMatch) return true;
  }
  return false;
}

// ============================================================================
// 2. MASTER ROUTE CATALOGUE DEFINITION
// ============================================================================

export const COIMBATORE_ORIGIN_ROUTES = [
  // A. Tamil Nadu (11)
  {
    id: 'cat-cbe-che',
    code: 'CBE-CHE',
    source: 'Coimbatore',
    destination: 'Chennai',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 510,
    durationMins: 510, // ~8.5 hours
    category: 'long_distance_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Gandhipuram Terminal', city: 'Coimbatore', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 20 },
      { name: 'Hope College Bypass', city: 'Coimbatore', order: 3, isBoarding: true, isDropping: false, minsFromOrigin: 40 },
      { name: 'Tiruppur Bypass', city: 'Tiruppur', order: 4, isBoarding: true, isDropping: true, minsFromOrigin: 75 },
      { name: 'Erode Perundurai Toll', city: 'Erode', order: 5, isBoarding: true, isDropping: true, minsFromOrigin: 130 },
      { name: 'Salem New Bus Stand', city: 'Salem', order: 6, isBoarding: true, isDropping: true, minsFromOrigin: 210 },
      { name: 'Villupuram Bypass', city: 'Villupuram', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Perungalathur Terminal', city: 'Chennai', order: 8, isBoarding: false, isDropping: true, minsFromOrigin: 470 },
      { name: 'Koyambedu Omni Bus Stand (CMBT)', city: 'Chennai', order: 9, isBoarding: false, isDropping: true, minsFromOrigin: 510 },
    ],
  },
  {
    id: 'cat-cbe-mdu',
    code: 'CBE-MDU',
    source: 'Coimbatore',
    destination: 'Madurai',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 215,
    durationMins: 270, // ~4.5 hours
    category: 'intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Singanallur Bus Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Palladam Bus Stand', city: 'Palladam', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 45 },
      { name: 'Dharapuram Old Bus Stand', city: 'Dharapuram', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 110 },
      { name: 'Oddanchatram Bypass', city: 'Oddanchatram', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 165 },
      { name: 'Dindigul Bus Stand', city: 'Dindigul', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 200 },
      { name: 'Mattuthavani Integrated Bus Stand (MIBT)', city: 'Madurai', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
    ],
  },
  {
    id: 'cat-cbe-tnv',
    code: 'CBE-TNV',
    source: 'Coimbatore',
    destination: 'Tirunelveli',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 360,
    durationMins: 420, // ~7 hours
    category: 'long_distance_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Singanallur', city: 'Coimbatore', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 20 },
      { name: 'Madurai Mattuthavani', city: 'Madurai', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 250 },
      { name: 'Virudhunagar Toll', city: 'Virudhunagar', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 310 },
      { name: 'Sattur Bypass', city: 'Sattur', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 345 },
      { name: 'Kovilpatti New Bus Stand', city: 'Kovilpatti', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 375 },
      { name: 'Tirunelveli New Bus Stand', city: 'Tirunelveli', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
    ],
  },
  {
    id: 'cat-cbe-tks',
    code: 'CBE-TKS',
    source: 'Coimbatore',
    destination: 'Tenkasi',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 320,
    durationMins: 480, // ~8 hours
    category: 'long_distance_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Gandhipuram Terminal', city: 'Coimbatore', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 20 },
      { name: 'Singanallur Bus Terminal', city: 'Coimbatore', order: 3, isBoarding: true, isDropping: false, minsFromOrigin: 45 },
      { name: 'Pollachi Bus Stand', city: 'Pollachi', order: 4, isBoarding: true, isDropping: true, minsFromOrigin: 90 },
      { name: 'Udumalapettai Central Stand', city: 'Udumalapettai', order: 5, isBoarding: true, isDropping: true, minsFromOrigin: 135 },
      { name: 'Palani Bus Stand', city: 'Palani', order: 6, isBoarding: true, isDropping: true, minsFromOrigin: 185 },
      { name: 'Srivilliputhur Bypass', city: 'Srivilliputhur', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 340 },
      { name: 'Rajapalayam Old Bus Stand', city: 'Rajapalayam', order: 8, isBoarding: false, isDropping: true, minsFromOrigin: 375 },
      { name: 'Kadayanallur Bypass', city: 'Kadayanallur', order: 9, isBoarding: false, isDropping: true, minsFromOrigin: 435 },
      { name: 'Tenkasi New Bus Stand', city: 'Tenkasi', order: 10, isBoarding: false, isDropping: true, minsFromOrigin: 480 },
    ],
  },
  {
    id: 'cat-cbe-ngl',
    code: 'CBE-NGL',
    source: 'Coimbatore',
    destination: 'Nagercoil',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 430,
    durationMins: 510, // ~8.5 hours
    category: 'long_distance_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Madurai Bypass', city: 'Madurai', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 250 },
      { name: 'Tirunelveli New Bus Stand', city: 'Tirunelveli', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
      { name: 'Valliyur Bypass', city: 'Valliyur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 465 },
      { name: 'Nagercoil Vadasery Bus Stand', city: 'Nagercoil', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 510 },
    ],
  },
  {
    id: 'cat-cbe-tcr',
    code: 'CBE-TCR',
    source: 'Coimbatore',
    destination: 'Thoothukudi',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 340,
    durationMins: 420, // ~7 hours
    category: 'long_distance_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Singanallur Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Madurai Ring Road', city: 'Madurai', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 250 },
      { name: 'Aruppukottai Bypass', city: 'Aruppukottai', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 310 },
      { name: 'Ettayapuram Bypass', city: 'Ettayapuram', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 370 },
      { name: 'Thoothukudi Old Bus Stand', city: 'Thoothukudi', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
    ],
  },
  {
    id: 'cat-cbe-rmm',
    code: 'CBE-RMM',
    source: 'Coimbatore',
    destination: 'Rameswaram',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 380,
    durationMins: 480, // ~8 hours
    category: 'long_distance_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Madurai Mattuthavani', city: 'Madurai', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 260 },
      { name: 'Paramakudi Bypass', city: 'Paramakudi', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 340 },
      { name: 'Ramanathapuram Bus Stand', city: 'Ramanathapuram', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 395 },
      { name: 'Rameswaram Temple Stand', city: 'Rameswaram', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 480 },
    ],
  },
  {
    id: 'cat-cbe-tcn',
    code: 'CBE-TCN',
    source: 'Coimbatore',
    destination: 'Tiruchendur',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 380,
    durationMins: 480, // ~8 hours
    category: 'long_distance_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Omni Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Tirunelveli Bypass', city: 'Tirunelveli', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
      { name: 'Tiruchendur Temple Bus Stand', city: 'Tiruchendur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 480 },
    ],
  },
  {
    id: 'cat-cbe-trz',
    code: 'CBE-TRZ',
    source: 'Coimbatore',
    destination: 'Trichy',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 220,
    durationMins: 270, // ~4.5 hours
    category: 'intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Singanallur Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Palladam Stand', city: 'Palladam', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 40 },
      { name: 'Kangeyam Stand', city: 'Kangeyam', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 95 },
      { name: 'Karur Bus Stand', city: 'Karur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 175 },
      { name: 'Trichy Central Bus Stand', city: 'Trichy', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
    ],
  },
  {
    id: 'cat-cbe-thn',
    code: 'CBE-THN',
    source: 'Coimbatore',
    destination: 'Thanjavur',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 270,
    durationMins: 330, // ~5.5 hours
    category: 'intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Singanallur Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Trichy Central Bus Stand', city: 'Trichy', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 260 },
      { name: 'Thanjavur New Bus Stand', city: 'Thanjavur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 330 },
    ],
  },
  {
    id: 'cat-cbe-sal',
    code: 'CBE-SAL',
    source: 'Coimbatore',
    destination: 'Salem',
    sourceState: 'Tamil Nadu',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 165,
    durationMins: 210, // ~3.5 hours
    category: 'intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Gandhipuram Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Tiruppur Avinashi Stand', city: 'Tiruppur', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 60 },
      { name: 'Erode Perundurai Toll', city: 'Erode', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 110 },
      { name: 'Salem New Bus Stand', city: 'Salem', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
    ],
  },

  // B. Kerala (5)
  {
    id: 'cat-cbe-koc',
    code: 'CBE-KOC',
    source: 'Coimbatore',
    destination: 'Kochi',
    sourceState: 'Tamil Nadu',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 190,
    durationMins: 270, // ~4.5 hours
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Ukkadam Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Palakkad KSRTC Stand', city: 'Palakkad', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 75 },
      { name: 'Thrissur Round', city: 'Thrissur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 165 },
      { name: 'Aluva Flyover', city: 'Aluva', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 235 },
      { name: 'Vytilla Mobility Hub', city: 'Kochi', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
    ],
  },
  {
    id: 'cat-cbe-ekm',
    code: 'CBE-EKM',
    source: 'Coimbatore',
    destination: 'Ernakulam',
    sourceState: 'Tamil Nadu',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 185,
    durationMins: 270,
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Ukkadam Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Palakkad KSRTC Stand', city: 'Palakkad', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 75 },
      { name: 'Thrissur KSRTC Stand', city: 'Thrissur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 165 },
      { name: 'Ernakulam South KSRTC Terminal', city: 'Ernakulam', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
    ],
  },
  {
    id: 'cat-cbe-tcr-ker',
    code: 'CBE-TCR-K',
    source: 'Coimbatore',
    destination: 'Thrissur',
    sourceState: 'Tamil Nadu',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 115,
    durationMins: 150, // ~2.5 hours
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Ukkadam Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Palakkad KSRTC Stand', city: 'Palakkad', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 70 },
      { name: 'Thrissur KSRTC Terminal', city: 'Thrissur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 150 },
    ],
  },
  {
    id: 'cat-cbe-clt',
    code: 'CBE-CLT',
    source: 'Coimbatore',
    destination: 'Kozhikode',
    sourceState: 'Tamil Nadu',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 180,
    durationMins: 270, // ~4.5 hours
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Ukkadam Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Palakkad Bypass', city: 'Palakkad', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 75 },
      { name: 'Malappuram Stand', city: 'Malappuram', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 180 },
      { name: 'Kozhikode Mavoor Road Stand', city: 'Kozhikode', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
    ],
  },
  {
    id: 'cat-cbe-tvm',
    code: 'CBE-TVM',
    source: 'Coimbatore',
    destination: 'Thiruvananthapuram',
    sourceState: 'Tamil Nadu',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 390,
    durationMins: 540, // ~9 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Ukkadam Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Thrissur Bypass', city: 'Thrissur', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 160 },
      { name: 'Ernakulam Vytilla', city: 'Ernakulam', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 260 },
      { name: 'Alappuzha Stand', city: 'Alappuzha', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 360 },
      { name: 'Kollam Stand', city: 'Kollam', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 450 },
      { name: 'Thiruvananthapuram Thampanoor', city: 'Thiruvananthapuram', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 540 },
    ],
  },

  // C. Karnataka (3)
  {
    id: 'cat-cbe-blr',
    code: 'CBE-BLR',
    source: 'Coimbatore',
    destination: 'Bengaluru',
    sourceState: 'Tamil Nadu',
    destState: 'Karnataka',
    region: 'Karnataka',
    distanceKm: 365,
    durationMins: 360, // ~6 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Gandhipuram Terminal', city: 'Coimbatore', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 20 },
      { name: 'Tiruppur Bypass', city: 'Tiruppur', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 65 },
      { name: 'Salem New Bus Stand', city: 'Salem', order: 4, isBoarding: true, isDropping: true, minsFromOrigin: 160 },
      { name: 'Dharmapuri Bypass', city: 'Dharmapuri', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 230 },
      { name: 'Hosur Bus Stand', city: 'Hosur', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 300 },
      { name: 'Electronic City Toll', city: 'Bengaluru', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 330 },
      { name: 'Silk Board Junction', city: 'Bengaluru', order: 8, isBoarding: false, isDropping: true, minsFromOrigin: 345 },
      { name: 'Majestic Kempegowda Bus Station', city: 'Bengaluru', order: 9, isBoarding: false, isDropping: true, minsFromOrigin: 360 },
    ],
  },
  {
    id: 'cat-cbe-mys',
    code: 'CBE-MYS',
    source: 'Coimbatore',
    destination: 'Mysuru',
    sourceState: 'Tamil Nadu',
    destState: 'Karnataka',
    region: 'Karnataka',
    distanceKm: 200,
    durationMins: 270, // ~4.5 hours
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Gandhipuram Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Mettupalayam Stand', city: 'Mettupalayam', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 50 },
      { name: 'Ooty Central Stand', city: 'Ooty', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 130 },
      { name: 'Gundlupet Stand', city: 'Gundlupet', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 200 },
      { name: 'Mysuru Suburb Bus Stand', city: 'Mysuru', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
    ],
  },
  {
    id: 'cat-cbe-mlr',
    code: 'CBE-MLR',
    source: 'Coimbatore',
    destination: 'Mangaluru',
    sourceState: 'Tamil Nadu',
    destState: 'Karnataka',
    region: 'Karnataka',
    distanceKm: 410,
    durationMins: 540, // ~9 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Omni Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Palakkad Bypass', city: 'Palakkad', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 75 },
      { name: 'Kozhikode Stand', city: 'Kozhikode', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
      { name: 'Kannur Stand', city: 'Kannur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Mangaluru KSRTC Bejai Stand', city: 'Mangaluru', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 540 },
    ],
  },

  // D. Telangana (1)
  {
    id: 'cat-cbe-hyd',
    code: 'CBE-HYD',
    source: 'Coimbatore',
    destination: 'Hyderabad',
    sourceState: 'Tamil Nadu',
    destState: 'Telangana',
    region: 'Andhra Pradesh & Telangana',
    distanceKm: 930,
    durationMins: 930, // ~15.5 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Salem New Bus Stand', city: 'Salem', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 180 },
      { name: 'Bengaluru Electronic City', city: 'Bengaluru', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 360 },
      { name: 'Anantapur Bypass', city: 'Anantapur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 580 },
      { name: 'Kurnool Toll', city: 'Kurnool', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 720 },
      { name: 'Hyderabad MGBS Terminal', city: 'Hyderabad', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 930 },
    ],
  },

  // E. Goa and Maharashtra (3)
  {
    id: 'cat-cbe-goa',
    code: 'CBE-GOA',
    source: 'Coimbatore',
    destination: 'Goa',
    sourceState: 'Tamil Nadu',
    destState: 'Goa',
    region: 'Goa & Maharashtra',
    distanceKm: 760,
    durationMins: 840, // ~14 hours
    category: 'interstate_long_haul',
    status: STATUS.CANDIDATE, // Candidate route in catalogue
    hasActiveService: false,
    intermediateStops: [
      { name: 'Coimbatore Omni Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Mangaluru Stand', city: 'Mangaluru', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 510 },
      { name: 'Udupi Service Bus Stand', city: 'Udupi', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 590 },
      { name: 'Karwar Stand', city: 'Karwar', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 740 },
      { name: 'Madgaon KSRTC Stand', city: 'Goa', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 840 },
    ],
  },
  {
    id: 'cat-cbe-bom',
    code: 'CBE-BOM',
    source: 'Coimbatore',
    destination: 'Mumbai',
    sourceState: 'Tamil Nadu',
    destState: 'Maharashtra',
    region: 'Goa & Maharashtra',
    distanceKm: 1320,
    durationMins: 1320, // ~22 hours
    category: 'interstate_long_haul',
    status: STATUS.CANDIDATE,
    hasActiveService: false,
    intermediateStops: [
      { name: 'Coimbatore Omni Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Bengaluru Majestic', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 360 },
      { name: 'Hubballi Bypass', city: 'Hubballi', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 720 },
      { name: 'Pune Katraj Tunnel', city: 'Pune', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 1140 },
      { name: 'Mumbai Borivali Terminal', city: 'Mumbai', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 1320 },
    ],
  },
  {
    id: 'cat-cbe-pnq',
    code: 'CBE-PNQ',
    source: 'Coimbatore',
    destination: 'Pune',
    sourceState: 'Tamil Nadu',
    destState: 'Maharashtra',
    region: 'Goa & Maharashtra',
    distanceKm: 1180,
    durationMins: 1170, // ~19.5 hours
    category: 'interstate_long_haul',
    status: STATUS.CANDIDATE,
    hasActiveService: false,
    intermediateStops: [
      { name: 'Coimbatore Omni Stand', city: 'Coimbatore', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Bengaluru Electronic City', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 360 },
      { name: 'Hubballi Stand', city: 'Hubballi', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 720 },
      { name: 'Kolhapur Stand', city: 'Kolhapur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 960 },
      { name: 'Pune Swargate Stand', city: 'Pune', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 1170 },
    ],
  },
];

export const BENGALURU_ORIGIN_ROUTES = [
  // A. Tamil Nadu (14)
  {
    id: 'cat-blr-cbe',
    code: 'BLR-CBE',
    source: 'Bengaluru',
    destination: 'Coimbatore',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 365,
    durationMins: 360,
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda Bus Station', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Shantinagar Bus Station', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 20 },
      { name: 'Madiwala Bus Stand', city: 'Bengaluru', order: 3, isBoarding: true, isDropping: false, minsFromOrigin: 40 },
      { name: 'Silk Board Junction', city: 'Bengaluru', order: 4, isBoarding: true, isDropping: false, minsFromOrigin: 50 },
      { name: 'Electronic City Toll Gate', city: 'Bengaluru', order: 5, isBoarding: true, isDropping: false, minsFromOrigin: 65 },
      { name: 'Hosur Bus Stand', city: 'Hosur', order: 6, isBoarding: true, isDropping: true, minsFromOrigin: 90 },
      { name: 'Salem New Bus Stand', city: 'Salem', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 220 },
      { name: 'Tiruppur Bypass', city: 'Tiruppur', order: 8, isBoarding: false, isDropping: true, minsFromOrigin: 310 },
      { name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', order: 9, isBoarding: false, isDropping: true, minsFromOrigin: 360 },
    ],
  },
  {
    id: 'cat-blr-che',
    code: 'BLR-CHE',
    source: 'Bengaluru',
    destination: 'Chennai',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 350,
    durationMins: 360,
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Indiranagar Metro', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 30 },
      { name: 'KR Puram Bridge', city: 'Bengaluru', order: 3, isBoarding: true, isDropping: false, minsFromOrigin: 55 },
      { name: 'Hosakote Toll', city: 'Bengaluru', order: 4, isBoarding: true, isDropping: false, minsFromOrigin: 75 },
      { name: 'Vellore New Bus Stand', city: 'Vellore', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
      { name: 'Kanchipuram Bypass', city: 'Kanchipuram', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 290 },
      { name: 'Poonamallee Stand', city: 'Chennai', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 330 },
      { name: 'Koyambedu CMBT', city: 'Chennai', order: 8, isBoarding: false, isDropping: true, minsFromOrigin: 360 },
    ],
  },
  {
    id: 'cat-blr-mdu',
    code: 'BLR-MDU',
    source: 'Bengaluru',
    destination: 'Madurai',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 440,
    durationMins: 450, // ~7.5 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Madiwala', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 35 },
      { name: 'Electronic City', city: 'Bengaluru', order: 3, isBoarding: true, isDropping: false, minsFromOrigin: 55 },
      { name: 'Hosur Stand', city: 'Hosur', order: 4, isBoarding: true, isDropping: true, minsFromOrigin: 80 },
      { name: 'Salem New Stand', city: 'Salem', order: 5, isBoarding: true, isDropping: true, minsFromOrigin: 220 },
      { name: 'Namakkal Bypass', city: 'Namakkal', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 275 },
      { name: 'Karur Stand', city: 'Karur', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 330 },
      { name: 'Dindigul Stand', city: 'Dindigul', order: 8, isBoarding: false, isDropping: true, minsFromOrigin: 395 },
      { name: 'Madurai Mattuthavani MIBT', city: 'Madurai', order: 9, isBoarding: false, isDropping: true, minsFromOrigin: 450 },
    ],
  },
  {
    id: 'cat-blr-tnv',
    code: 'BLR-TNV',
    source: 'Bengaluru',
    destination: 'Tirunelveli',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 585,
    durationMins: 570, // ~9.5 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Madiwala', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 35 },
      { name: 'Salem New Stand', city: 'Salem', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 220 },
      { name: 'Madurai MIBT', city: 'Madurai', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
      { name: 'Virudhunagar Toll', city: 'Virudhunagar', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 480 },
      { name: 'Kovilpatti Stand', city: 'Kovilpatti', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 525 },
      { name: 'Tirunelveli New Stand', city: 'Tirunelveli', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 570 },
    ],
  },
  {
    id: 'cat-blr-ngl',
    code: 'BLR-NGL',
    source: 'Bengaluru',
    destination: 'Nagercoil',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 650,
    durationMins: 660, // ~11 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Madiwala', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 35 },
      { name: 'Salem Stand', city: 'Salem', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 220 },
      { name: 'Madurai MIBT', city: 'Madurai', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 430 },
      { name: 'Tirunelveli New Stand', city: 'Tirunelveli', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 570 },
      { name: 'Valliyur Stand', city: 'Valliyur', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 615 },
      { name: 'Nagercoil Vadasery Stand', city: 'Nagercoil', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 660 },
    ],
  },
  {
    id: 'cat-blr-sal',
    code: 'BLR-SAL',
    source: 'Bengaluru',
    destination: 'Salem',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 205,
    durationMins: 210, // ~3.5 hours
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Electronic City', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 45 },
      { name: 'Hosur Stand', city: 'Hosur', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 75 },
      { name: 'Dharmapuri Stand', city: 'Dharmapuri', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 145 },
      { name: 'Salem New Bus Stand', city: 'Salem', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
    ],
  },
  {
    id: 'cat-blr-ero',
    code: 'BLR-ERO',
    source: 'Bengaluru',
    destination: 'Erode',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 260,
    durationMins: 270, // ~4.5 hours
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Electronic City', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 45 },
      { name: 'Salem New Stand', city: 'Salem', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
      { name: 'Sankari Bypass', city: 'Sankari', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 240 },
      { name: 'Erode Central Bus Stand', city: 'Erode', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
    ],
  },
  {
    id: 'cat-blr-tup',
    code: 'BLR-TUP',
    source: 'Bengaluru',
    destination: 'Tiruppur',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 315,
    durationMins: 330, // ~5.5 hours
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Electronic City', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 45 },
      { name: 'Salem Stand', city: 'Salem', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
      { name: 'Perundurai Stand', city: 'Perundurai', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
      { name: 'Tiruppur Old Bus Stand', city: 'Tiruppur', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 330 },
    ],
  },
  {
    id: 'cat-blr-trz',
    code: 'BLR-TRZ',
    source: 'Bengaluru',
    destination: 'Trichy',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 335,
    durationMins: 360, // ~6 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Madiwala', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 35 },
      { name: 'Salem Stand', city: 'Salem', order: 3, isBoarding: true, isDropping: true, minsFromOrigin: 210 },
      { name: 'Namakkal Stand', city: 'Namakkal', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
      { name: 'Trichy Central Bus Stand', city: 'Trichy', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 360 },
    ],
  },
  {
    id: 'cat-blr-thn',
    code: 'BLR-THN',
    source: 'Bengaluru',
    destination: 'Thanjavur',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 390,
    durationMins: 420, // ~7 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Salem Stand', city: 'Salem', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 210 },
      { name: 'Trichy Stand', city: 'Trichy', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 350 },
      { name: 'Thanjavur New Stand', city: 'Thanjavur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
    ],
  },
  {
    id: 'cat-blr-tks',
    code: 'BLR-TKS',
    source: 'Bengaluru',
    destination: 'Tenkasi',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 550,
    durationMins: 570, // ~9.5 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Madiwala', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 35 },
      { name: 'Madurai Ring Road', city: 'Madurai', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
      { name: 'Rajapalayam Stand', city: 'Rajapalayam', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 495 },
      { name: 'Kadayanallur Stand', city: 'Kadayanallur', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 540 },
      { name: 'Tenkasi New Bus Stand', city: 'Tenkasi', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 570 },
    ],
  },
  {
    id: 'cat-blr-tcr',
    code: 'BLR-TCR',
    source: 'Bengaluru',
    destination: 'Thoothukudi',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 570,
    durationMins: 570, // ~9.5 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Salem Stand', city: 'Salem', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
      { name: 'Madurai Stand', city: 'Madurai', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
      { name: 'Thoothukudi Old Stand', city: 'Thoothukudi', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 570 },
    ],
  },
  {
    id: 'cat-blr-rmm',
    code: 'BLR-RMM',
    source: 'Bengaluru',
    destination: 'Rameswaram',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 610,
    durationMins: 630, // ~10.5 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Salem Stand', city: 'Salem', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
      { name: 'Madurai Stand', city: 'Madurai', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 430 },
      { name: 'Ramanathapuram Stand', city: 'Ramanathapuram', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 540 },
      { name: 'Rameswaram Temple Stand', city: 'Rameswaram', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 630 },
    ],
  },
  {
    id: 'cat-blr-hsr',
    code: 'BLR-HSR',
    source: 'Bengaluru',
    destination: 'Hosur',
    sourceState: 'Karnataka',
    destState: 'Tamil Nadu',
    region: 'Tamil Nadu',
    distanceKm: 45,
    durationMins: 70, // ~1.2 hours
    category: 'intercity_day_coach', // As specified: intercity day coach, not default sleeper
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Electronic City Toll', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 40 },
      { name: 'Hosur Bus Stand', city: 'Hosur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 70 },
    ],
  },

  // B. Kerala (9)
  {
    id: 'cat-blr-koc',
    code: 'BLR-KOC',
    source: 'Bengaluru',
    destination: 'Kochi',
    sourceState: 'Karnataka',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 540,
    durationMins: 570, // ~9.5 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Madiwala', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 35 },
      { name: 'Salem Stand', city: 'Salem', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
      { name: 'Palakkad Stand', city: 'Palakkad', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Thrissur Stand', city: 'Thrissur', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 480 },
      { name: 'Aluva Stand', city: 'Aluva', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 540 },
      { name: 'Vytilla Mobility Hub', city: 'Kochi', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 570 },
    ],
  },
  {
    id: 'cat-blr-ekm',
    code: 'BLR-EKM',
    source: 'Bengaluru',
    destination: 'Ernakulam',
    sourceState: 'Karnataka',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 535,
    durationMins: 570,
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Palakkad Stand', city: 'Palakkad', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Thrissur Stand', city: 'Thrissur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 480 },
      { name: 'Ernakulam South Terminal', city: 'Ernakulam', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 570 },
    ],
  },
  {
    id: 'cat-blr-tcr-ker',
    code: 'BLR-TCR-K',
    source: 'Bengaluru',
    destination: 'Thrissur',
    sourceState: 'Karnataka',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 470,
    durationMins: 480, // ~8 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Electronic City', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 45 },
      { name: 'Palakkad Bypass', city: 'Palakkad', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Thrissur KSRTC Terminal', city: 'Thrissur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 480 },
    ],
  },
  {
    id: 'cat-blr-clt',
    code: 'BLR-CLT',
    source: 'Bengaluru',
    destination: 'Kozhikode',
    sourceState: 'Karnataka',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 360,
    durationMins: 450, // ~7.5 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Mysuru Stand', city: 'Mysuru', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 150 },
      { name: 'Gundlupet Stand', city: 'Gundlupet', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 220 },
      { name: 'Sulthan Bathery', city: 'Wayanad', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 300 },
      { name: 'Kozhikode Mavoor Road Stand', city: 'Kozhikode', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 450 },
    ],
  },
  {
    id: 'cat-blr-can',
    code: 'BLR-CAN',
    source: 'Bengaluru',
    destination: 'Kannur',
    sourceState: 'Karnataka',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 320,
    durationMins: 420, // ~7 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Virajpet Stand', city: 'Virajpet', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
      { name: 'Iritty Stand', city: 'Iritty', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 340 },
      { name: 'Kannur Old Bus Stand', city: 'Kannur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
    ],
  },
  {
    id: 'cat-blr-pgt',
    code: 'BLR-PGT',
    source: 'Bengaluru',
    destination: 'Palakkad',
    sourceState: 'Karnataka',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 415,
    durationMins: 420, // ~7 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Salem Stand', city: 'Salem', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
      { name: 'Coimbatore Bypass', city: 'Coimbatore', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 340 },
      { name: 'Palakkad KSRTC Stand', city: 'Palakkad', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 420 },
    ],
  },
  {
    id: 'cat-blr-tvm',
    code: 'BLR-TVM',
    source: 'Bengaluru',
    destination: 'Thiruvananthapuram',
    sourceState: 'Karnataka',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 680,
    durationMins: 720, // ~12 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Salem Stand', city: 'Salem', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
      { name: 'Ernakulam Vytilla', city: 'Ernakulam', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 510 },
      { name: 'Kollam Stand', city: 'Kollam', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 640 },
      { name: 'Thiruvananthapuram Thampanoor', city: 'Thiruvananthapuram', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 720 },
    ],
  },
  {
    id: 'cat-blr-qln',
    code: 'BLR-QLN',
    source: 'Bengaluru',
    destination: 'Kollam',
    sourceState: 'Karnataka',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 625,
    durationMins: 660, // ~11 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Ernakulam Stand', city: 'Ernakulam', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 510 },
      { name: 'Alappuzha Stand', city: 'Alappuzha', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 590 },
      { name: 'Kollam KSRTC Stand', city: 'Kollam', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 660 },
    ],
  },
  {
    id: 'cat-blr-ktm',
    code: 'BLR-KTM',
    source: 'Bengaluru',
    destination: 'Kottayam',
    sourceState: 'Karnataka',
    destState: 'Kerala',
    region: 'Kerala',
    distanceKm: 565,
    durationMins: 630, // ~10.5 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Palakkad Stand', city: 'Palakkad', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Thrissur Stand', city: 'Thrissur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 470 },
      { name: 'Kottayam KSRTC Terminal', city: 'Kottayam', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 630 },
    ],
  },

  // C. Andhra Pradesh and Telangana (7)
  {
    id: 'cat-blr-hyd',
    code: 'BLR-HYD',
    source: 'Bengaluru',
    destination: 'Hyderabad',
    sourceState: 'Karnataka',
    destState: 'Telangana',
    region: 'Andhra Pradesh & Telangana',
    distanceKm: 570,
    durationMins: 510, // ~8.5 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Hebbal Flyover', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 30 },
      { name: 'Yelahanka Bypass', city: 'Bengaluru', order: 3, isBoarding: true, isDropping: false, minsFromOrigin: 50 },
      { name: 'Anantapur Clock Tower', city: 'Anantapur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 230 },
      { name: 'Kurnool New Stand', city: 'Kurnool', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 350 },
      { name: 'Jadcherla Bypass', city: 'Jadcherla', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 440 },
      { name: 'Hyderabad MGBS Terminal', city: 'Hyderabad', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 510 },
    ],
  },
  {
    id: 'cat-blr-vja',
    code: 'BLR-VJA',
    source: 'Bengaluru',
    destination: 'Vijayawada',
    sourceState: 'Karnataka',
    destState: 'Andhra Pradesh',
    region: 'Andhra Pradesh & Telangana',
    distanceKm: 650,
    durationMins: 630, // ~10.5 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Tirupati Alipiri', city: 'Tirupati', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
      { name: 'Nellore Stand', city: 'Nellore', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Guntur Stand', city: 'Guntur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 560 },
      { name: 'Vijayawada PNBS Terminal', city: 'Vijayawada', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 630 },
    ],
  },
  {
    id: 'cat-blr-vskp',
    code: 'BLR-VSKP',
    source: 'Bengaluru',
    destination: 'Visakhapatnam',
    sourceState: 'Karnataka',
    destState: 'Andhra Pradesh',
    region: 'Andhra Pradesh & Telangana',
    distanceKm: 1000,
    durationMins: 990, // ~16.5 hours
    category: 'interstate_long_haul',
    status: STATUS.CANDIDATE,
    hasActiveService: false,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Vijayawada PNBS', city: 'Vijayawada', order: 2, isBoarding: true, isDropping: true, minsFromOrigin: 600 },
      { name: 'Rajahmundry Stand', city: 'Rajahmundry', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 760 },
      { name: 'Visakhapatnam RTC Complex', city: 'Visakhapatnam', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 990 },
    ],
  },
  {
    id: 'cat-blr-tpty',
    code: 'BLR-TPTY',
    source: 'Bengaluru',
    destination: 'Tirupati',
    sourceState: 'Karnataka',
    destState: 'Andhra Pradesh',
    region: 'Andhra Pradesh & Telangana',
    distanceKm: 250,
    durationMins: 270, // ~4.5 hours
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Kolar Gold Fields Bypass', city: 'Kolar', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 80 },
      { name: 'Chittoor Bus Stand', city: 'Chittoor', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 190 },
      { name: 'Tirupati Central Bus Stand', city: 'Tirupati', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
    ],
  },
  {
    id: 'cat-blr-gnt',
    code: 'BLR-GNT',
    source: 'Bengaluru',
    destination: 'Guntur',
    sourceState: 'Karnataka',
    destState: 'Andhra Pradesh',
    region: 'Andhra Pradesh & Telangana',
    distanceKm: 620,
    durationMins: 600, // ~10 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Kurnool Stand', city: 'Kurnool', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 360 },
      { name: 'Guntur NTR Bus Station', city: 'Guntur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 600 },
    ],
  },
  {
    id: 'cat-blr-knl',
    code: 'BLR-KNL',
    source: 'Bengaluru',
    destination: 'Kurnool',
    sourceState: 'Karnataka',
    destState: 'Andhra Pradesh',
    region: 'Andhra Pradesh & Telangana',
    distanceKm: 360,
    durationMins: 330, // ~5.5 hours
    category: 'interstate_intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Anantapur Stand', city: 'Anantapur', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 210 },
      { name: 'Kurnool Bus Stand', city: 'Kurnool', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 330 },
    ],
  },
  {
    id: 'cat-blr-nlr',
    code: 'BLR-NLR',
    source: 'Bengaluru',
    destination: 'Nellore',
    sourceState: 'Karnataka',
    destState: 'Andhra Pradesh',
    region: 'Andhra Pradesh & Telangana',
    distanceKm: 385,
    durationMins: 390, // ~6.5 hours
    category: 'interstate_long_distance',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Tirupati Alipiri', city: 'Tirupati', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 270 },
      { name: 'Nellore Atmakur Stand', city: 'Nellore', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
    ],
  },

  // D. Karnataka (4)
  {
    id: 'cat-blr-mys',
    code: 'BLR-MYS',
    source: 'Bengaluru',
    destination: 'Mysuru',
    sourceState: 'Karnataka',
    destState: 'Karnataka',
    region: 'Karnataka',
    distanceKm: 145,
    durationMins: 150, // ~2.5 hours via Expressway
    category: 'intercity',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Kengeri TTMC', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 30 },
      { name: 'Bidadi Toll', city: 'Bidadi', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 60 },
      { name: 'Mandya Stand', city: 'Mandya', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 105 },
      { name: 'Mysuru Suburb Stand', city: 'Mysuru', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 150 },
    ],
  },
  {
    id: 'cat-blr-mlr',
    code: 'BLR-MLR',
    source: 'Bengaluru',
    destination: 'Mangaluru',
    sourceState: 'Karnataka',
    destState: 'Karnataka',
    region: 'Karnataka',
    distanceKm: 350,
    durationMins: 450, // ~7.5 hours
    category: 'intercity_sleeper',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Yeshwantpur TTMC', city: 'Bengaluru', order: 2, isBoarding: true, isDropping: false, minsFromOrigin: 25 },
      { name: 'Kunigal Bypass', city: 'Kunigal', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 80 },
      { name: 'Hassan Bus Stand', city: 'Hassan', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 200 },
      { name: 'Sakleshpur Stand', city: 'Sakleshpur', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 260 },
      { name: 'Mangaluru KSRTC Bejai', city: 'Mangaluru', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 450 },
    ],
  },
  {
    id: 'cat-blr-bgm',
    code: 'BLR-BGM',
    source: 'Bengaluru',
    destination: 'Belagavi',
    sourceState: 'Karnataka',
    destState: 'Karnataka',
    region: 'Karnataka',
    distanceKm: 510,
    durationMins: 510, // ~8.5 hours
    category: 'intercity_sleeper',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Tumakuru Stand', city: 'Tumakuru', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 75 },
      { name: 'Hubballi Stand', city: 'Hubballi', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Dharwad Stand', city: 'Dharwad', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 425 },
      { name: 'Belagavi CBT Stand', city: 'Belagavi', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 510 },
    ],
  },
  {
    id: 'cat-blr-ubl',
    code: 'BLR-UBL',
    source: 'Bengaluru',
    destination: 'Hubballi',
    sourceState: 'Karnataka',
    destState: 'Karnataka',
    region: 'Karnataka',
    distanceKm: 415,
    durationMins: 390, // ~6.5 hours
    category: 'intercity_sleeper',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Davangere Stand', city: 'Davangere', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 260 },
      { name: 'Hubballi Old Bus Stand', city: 'Hubballi', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
    ],
  },

  // E. Goa and Maharashtra (4)
  {
    id: 'cat-blr-goa',
    code: 'BLR-GOA',
    source: 'Bengaluru',
    destination: 'Goa',
    sourceState: 'Karnataka',
    destState: 'Goa',
    region: 'Goa & Maharashtra',
    distanceKm: 560,
    durationMins: 630, // ~10.5 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Hubballi Bypass', city: 'Hubballi', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Dharwad Bypass', city: 'Dharwad', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 425 },
      { name: 'Madgaon KSRTC Stand', city: 'Goa', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 580 },
      { name: 'Panaji Bus Stand', city: 'Goa', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 630 },
    ],
  },
  {
    id: 'cat-blr-bom',
    code: 'BLR-BOM',
    source: 'Bengaluru',
    destination: 'Mumbai',
    sourceState: 'Karnataka',
    destState: 'Maharashtra',
    region: 'Goa & Maharashtra',
    distanceKm: 985,
    durationMins: 960, // ~16 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Hubballi Bypass', city: 'Hubballi', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Belagavi Bypass', city: 'Belagavi', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 490 },
      { name: 'Kolhapur Stand', city: 'Kolhapur', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 620 },
      { name: 'Pune Katraj Bypass', city: 'Pune', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 810 },
      { name: 'Vashi Plaza', city: 'Navi Mumbai', order: 6, isBoarding: false, isDropping: true, minsFromOrigin: 910 },
      { name: 'Mumbai Borivali East', city: 'Mumbai', order: 7, isBoarding: false, isDropping: true, minsFromOrigin: 960 },
    ],
  },
  {
    id: 'cat-blr-pnq',
    code: 'BLR-PNQ',
    source: 'Bengaluru',
    destination: 'Pune',
    sourceState: 'Karnataka',
    destState: 'Maharashtra',
    region: 'Goa & Maharashtra',
    distanceKm: 840,
    durationMins: 810, // ~13.5 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Hubballi Bypass', city: 'Hubballi', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Kolhapur Stand', city: 'Kolhapur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 620 },
      { name: 'Satara Bypass', city: 'Satara', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 720 },
      { name: 'Pune Swargate Bus Stand', city: 'Pune', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 810 },
    ],
  },
  {
    id: 'cat-blr-sdi',
    code: 'BLR-SDI',
    source: 'Bengaluru',
    destination: 'Shirdi',
    sourceState: 'Karnataka',
    destState: 'Maharashtra',
    region: 'Goa & Maharashtra',
    distanceKm: 1020,
    durationMins: 990, // ~16.5 hours
    category: 'interstate_long_haul',
    status: STATUS.SEED,
    hasActiveService: true,
    intermediateStops: [
      { name: 'Majestic Kempegowda', city: 'Bengaluru', order: 1, isBoarding: true, isDropping: false, minsFromOrigin: 0 },
      { name: 'Hubballi Bypass', city: 'Hubballi', order: 2, isBoarding: false, isDropping: true, minsFromOrigin: 390 },
      { name: 'Solapur Stand', city: 'Solapur', order: 3, isBoarding: false, isDropping: true, minsFromOrigin: 650 },
      { name: 'Ahmednagar Stand', city: 'Ahmednagar', order: 4, isBoarding: false, isDropping: true, minsFromOrigin: 870 },
      { name: 'Shirdi Temple Bus Stand', city: 'Shirdi', order: 5, isBoarding: false, isDropping: true, minsFromOrigin: 990 },
    ],
  },
];

// Export aliases for backward and test compatibility
export const COIMBATORE_ROUTES = COIMBATORE_ORIGIN_ROUTES;
export const BENGALURU_ROUTES = BENGALURU_ORIGIN_ROUTES;

// Combine all candidate routes into master catalogue with full provenance metadata
export const MASTER_ROUTE_CATALOGUE = [
  ...COIMBATORE_ORIGIN_ROUTES.map((r) => ({
    ...r,
    originCity: 'Coimbatore',
    direction: 'forward',
    isSeed: true,
    dataSource: 'smartroute_presentation_v1',
    corridorRegion: r.region,
  })),
  ...BENGALURU_ORIGIN_ROUTES.map((r) => ({
    ...r,
    originCity: 'Bengaluru',
    direction: 'forward',
    isSeed: true,
    dataSource: 'smartroute_presentation_v1',
    corridorRegion: r.region,
  })),
];

// Helper to generate reverse routes
export function generateReverseRoutes(forwardRoutes) {
  return forwardRoutes.map((f) => {
    const revStops = [...(f.intermediateStops || [])]
      .reverse()
      .map((st, idx, arr) => ({
        ...st,
        order: idx + 1,
        // In reverse, original dropping becomes boarding and vice versa
        isBoarding: st.isDropping,
        isDropping: st.isBoarding,
        minsFromOrigin: idx === 0 ? 0 : f.durationMins - st.minsFromOrigin,
      }));

    return {
      id: `${f.id}-rev`,
      code: `${f.destination.slice(0, 3).toUpperCase()}-${f.source.slice(0, 3).toUpperCase()}`,
      source: f.destination,
      destination: f.source,
      sourceState: f.destState,
      destState: f.sourceState,
      region: f.region,
      corridorRegion: f.region,
      originCity: f.destination,
      distanceKm: f.distanceKm,
      durationMins: f.durationMins,
      category: f.category,
      direction: 'reverse',
      status: f.status,
      isSeed: true,
      dataSource: 'smartroute_presentation_v1',
      hasActiveService: f.hasActiveService,
      intermediateStops: revStops,
    };
  });
}

export const ALL_CATALOGUE_ROUTES = [
  ...MASTER_ROUTE_CATALOGUE,
  ...generateReverseRoutes(MASTER_ROUTE_CATALOGUE),
];

export const ALL_PAN_INDIA_ROUTES = [
  ...PAN_INDIA_CORRIDORS.map((r) => ({
    ...r,
    originCity: r.source,
    direction: r.direction || 'forward',
    isSeed: false,
    verificationStatus: 'VERIFIED',
    dataSource: 'smartroute_verified_inventory',
    corridorRegion: r.region,
  })),
  ...generateReverseRoutes(PAN_INDIA_CORRIDORS).map((r) => ({
    ...r,
    originCity: r.source,
    direction: 'reverse',
    isSeed: false,
    verificationStatus: 'VERIFIED',
    dataSource: 'smartroute_verified_inventory',
    corridorRegion: r.region,
  })),
];

