import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSISTENT_STORE_FILE = path.resolve(__dirname, '../data/persistent_local_store.json');
import {
  MASTER_ROUTE_CATALOGUE,
  ALL_CATALOGUE_ROUTES,
  COIMBATORE_ORIGIN_ROUTES,
  BENGALURU_ORIGIN_ROUTES,
  CITY_ALIASES,
  normalizeCityName,
  isCityMatch,
  STATUS as ROUTE_STATUS,
} from './routeCatalogueData.js';
import busInventoryApiService from './busInventoryApiService.js';
import { validateSeatGenders, DEFAULT_SEAT_PAIRS } from '../utils/genderAllocation.js';
import {
  PAN_INDIA_TRANSIT_HUBS,
  PAN_INDIA_CITY_COORDINATES,
  PAN_INDIA_STOPS_REGISTRY,
  getVerifiedStopCoordinates,
  validateStopCoordinates,
  validateRouteStops,
} from '../data/indiaTransitHubs.js';

export {
  MASTER_ROUTE_CATALOGUE,
  ALL_CATALOGUE_ROUTES,
  COIMBATORE_ORIGIN_ROUTES,
  BENGALURU_ORIGIN_ROUTES,
  CITY_ALIASES,
  normalizeCityName,
  isCityMatch,
  ROUTE_STATUS,
};

/**
 * SMART ROUTE — Commercial Fleet & Operations Production Data Store
 * Official Platform: https://smartroutebooking.com
 * Multi-carrier network: SMART ROUTE Travels, VEE VEE Travels, TRANZKING Travels,
 * Horizon Travels, Rathimeena Travels, KPN Travels, SRS Travels.
 */

const PASSWORD_HASH = bcrypt.hashSync('SmartRoute@2024', 10);

// Operator UUIDs
export const smartRouteTravelId = 'trv-smartroute-001';
export const veeVeeTravelId = 'trv-veevee-002';
export const tranzKingTravelId = 'trv-tranzking-003';
export const horizonTravelId = 'trv-horizon-004';
export const rathimeenaTravelId = 'trv-rathimeena-005';
export const kpnTravelId = 'trv-kpn-006';
export const cityTravelId = 'trv-city-015';
export const ybmTravelId = 'trv-ybm-016';
export const abtTravelId = 'trv-abt-017';
export const parveenTravelId = 'trv-parveen-018';
export const srmTravelId = 'trv-srm-019';
export const kalladaTravelId = 'trv-kallada-009';
export const intrcityTravelId = 'trv-intrcity-011';
export const zingbusTravelId = 'trv-zingbus-010';
export const orangeTravelId = 'trv-orange-008';
export const srsTravelId = 'trv-srs-020';
export const nationalTravelId = 'trv-national-021';

// Alias for backwards compatibility
export const travelId = smartRouteTravelId;

// User Identity UUIDs
export const superAdminId = 'usr-admin-001';
export const ownerId = 'usr-owner-001';
export const managerId = 'usr-manager-001';
export const staffId = 'usr-staff-001';
export const driver1Id = 'usr-driver-001';
export const driver2Id = 'usr-driver-002';
export const driver3Id = 'usr-driver-003';
export const passenger1Id = 'usr-passenger-001';
export const passenger2Id = 'usr-passenger-002';

// ======================== 1. USERS & RBAC ========================
export const users = [
  {
    id: superAdminId,
    email: 'admin@smartroute.in',
    mobile: '9000000001',
    password_hash: PASSWORD_HASH,
    first_name: 'Smart',
    last_name: 'Admin',
    role: 'super_admin',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: null,
  },
  {
    id: ownerId,
    email: 'owner@smartroute.in',
    mobile: '9000000002',
    password_hash: PASSWORD_HASH,
    first_name: 'Rajesh',
    last_name: 'Kumar',
    role: 'travel_owner',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: smartRouteTravelId,
  },
  {
    id: managerId,
    email: 'manager@smartroute.in',
    mobile: '9000000003',
    password_hash: PASSWORD_HASH,
    first_name: 'Arvind',
    last_name: 'Sundaram',
    role: 'manager',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: smartRouteTravelId,
    designation: 'Operations Director',
  },
  {
    id: staffId,
    email: 'staff@smartroute.in',
    mobile: '9000000004',
    password_hash: PASSWORD_HASH,
    first_name: 'Priya',
    last_name: 'Devi',
    role: 'staff',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: smartRouteTravelId,
    designation: 'Reservation Specialist',
  },
  {
    id: driver1Id,
    email: 'driver@smartroute.in',
    mobile: '9000000005',
    password_hash: PASSWORD_HASH,
    first_name: 'Muthu',
    last_name: 'Krishnan',
    role: 'driver',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: smartRouteTravelId,
    license_number: 'TN38-DL-2018-0091823',
    experience_years: 12,
  },
  {
    id: driver2Id,
    email: 'driver2@smartroute.in',
    mobile: '9000000007',
    password_hash: PASSWORD_HASH,
    first_name: 'Karthik',
    last_name: 'Selvan',
    role: 'driver',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: veeVeeTravelId,
    license_number: 'TN59-DL-2020-0044190',
    experience_years: 8,
  },
  {
    id: driver3Id,
    email: 'driver3@smartroute.in',
    mobile: '9000000009',
    password_hash: PASSWORD_HASH,
    first_name: 'Saravanan',
    last_name: 'Balaji',
    role: 'driver',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: tranzKingTravelId,
    license_number: 'TN09-DL-2016-0012891',
    experience_years: 14,
  },
  {
    id: passenger1Id,
    email: 'passenger@smartroute.in',
    mobile: '9000000006',
    password_hash: PASSWORD_HASH,
    first_name: 'Arun',
    last_name: 'Prakash',
    role: 'passenger',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: null,
  },
  {
    id: passenger2Id,
    email: 'sneha@smartroute.in',
    mobile: '9000000008',
    password_hash: PASSWORD_HASH,
    first_name: 'Sneha',
    last_name: 'Varma',
    role: 'passenger',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: null,
  },
  // Fictional Development Demo Accounts
  {
    id: 'usr-demo-owner',
    email: 'demo.owner@example.com',
    mobile: '9000000002',
    password_hash: PASSWORD_HASH,
    first_name: 'Demo',
    last_name: 'Owner',
    role: 'travel_owner',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: smartRouteTravelId,
  },
  {
    id: 'usr-demo-manager',
    email: 'demo.manager@example.com',
    mobile: '9000000003',
    password_hash: PASSWORD_HASH,
    first_name: 'Demo',
    last_name: 'Manager',
    role: 'manager',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: smartRouteTravelId,
    designation: 'Operations Manager',
  },
  {
    id: 'usr-demo-driver',
    email: 'demo.driver@example.com',
    mobile: '9000000005',
    password_hash: PASSWORD_HASH,
    first_name: 'Demo',
    last_name: 'Driver',
    role: 'driver',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: smartRouteTravelId,
    license_number: 'TN38-DL-2022-DEMO001',
    experience_years: 10,
  },
  {
    id: 'usr-demo-passenger',
    email: 'demo.passenger@example.com',
    mobile: '9000000006',
    password_hash: PASSWORD_HASH,
    first_name: 'Demo',
    last_name: 'Passenger',
    role: 'passenger',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: null,
  },
  {
    id: 'usr-demo-staff',
    email: 'demo.staff@example.com',
    mobile: '9000000004',
    password_hash: PASSWORD_HASH,
    first_name: 'Demo',
    last_name: 'Staff',
    role: 'staff',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: smartRouteTravelId,
    designation: 'Terminal Staff',
  },
  {
    id: 'usr-demo-superadmin',
    email: 'demo.superadmin@example.com',
    mobile: '9000000001',
    password_hash: PASSWORD_HASH,
    first_name: 'Demo',
    last_name: 'SuperAdmin',
    role: 'super_admin',
    status: 'active',
    email_verified: true,
    mobile_verified: true,
    travel_id: null,
  },
];

// ======================== 2. PRIMARY & NETWORK OPERATORS ========================
export const travels = [
  {
    id: smartRouteTravelId,
    owner_id: ownerId,
    name: 'SMART ROUTE Travels',
    slug: 'smartroute-travels',
    badge: 'Flagship Platform Carrier',
    rating: 4.9,
    reviews_count: 2480,
    description: 'Premier Tech-Integrated Platinum Fleet • Guaranteed On-Time • Live Satellite Telemetry',
    business_name: 'Smart Route Mobility Private Limited',
    business_registration_number: 'U60100TN2024PTC099211',
    gst_number: '33AABCS1001M1Z5',
    contact_email: 'fleet@smartroutebooking.com',
    contact_mobile: '9000000002',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641018',
    business_address: 'Smart Route Mobility Hub, Avinashi Road, Coimbatore',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: veeVeeTravelId,
    owner_id: ownerId,
    name: 'VEE VEE Travels',
    slug: 'veevee-travels',
    badge: 'Executive Sleeper Class',
    rating: 4.8,
    reviews_count: 1840,
    description: 'Luxury Long-Haul Intercity Sleeper Coaches • High-Speed Highway Corridors',
    business_name: 'Vee Vee Roadlines India Private Limited',
    business_registration_number: 'U60200TN2021PTC082194',
    gst_number: '33AABCV5566K1Z9',
    contact_email: 'dispatch@veeveetravels.in',
    contact_mobile: '9000000003',
    city: 'Madurai',
    state: 'Tamil Nadu',
    pincode: '625020',
    business_address: 'Vee Vee Towers, Mattuthavani Junction, Madurai',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: tranzKingTravelId,
    owner_id: ownerId,
    name: 'TRANZKING Travels',
    slug: 'tranzking-travels',
    badge: 'Multi-Axle Superfast',
    rating: 4.8,
    reviews_count: 1620,
    description: 'Next-Gen Scania & Volvo Multi-Axle Fleet • Non-Stop Highway Liners',
    business_name: 'TranzKing Mobility Solutions Private Limited',
    business_registration_number: 'U60100KA2022PTC078233',
    gst_number: '29AABCT8822L1Z2',
    contact_email: 'ops@tranzkingtravels.com',
    contact_mobile: '9000000007',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600107',
    business_address: 'TranzKing Logistics Center, Koyambedu, Chennai',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: horizonTravelId,
    owner_id: ownerId,
    name: 'Horizon Travels',
    slug: 'horizon-travels',
    badge: 'Southern Star Line',
    rating: 4.7,
    reviews_count: 1290,
    description: 'Premier Intercity Private Bus Carrier & Luxury Sleeper Coach Network',
    business_name: 'Horizon Mobility Private Limited',
    business_registration_number: 'U60100TN2024PTC049812',
    gst_number: '33AABCH9821M1ZT',
    contact_email: 'support@horizontravels.in',
    contact_mobile: '9000000002',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641018',
    business_address: '142, Avinashi Road, Race Course, Coimbatore',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: rathimeenaTravelId,
    owner_id: ownerId,
    name: 'Rathimeena Travels',
    slug: 'rathimeena-travels',
    badge: 'Delta Heritage Line',
    rating: 4.6,
    reviews_count: 980,
    description: 'Trusted Express Coach Network Across Tamil Nadu & Pondicherry',
    business_name: 'Rathimeena Express Lines',
    business_registration_number: 'U60100TN2019PTC038100',
    gst_number: '33AABCR1122N1Z4',
    contact_email: 'contact@rathimeena.in',
    contact_mobile: '9000000004',
    city: 'Trichy',
    state: 'Tamil Nadu',
    pincode: '620001',
    business_address: 'Central Bus Stand Arcade, Trichy',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: kpnTravelId,
    owner_id: ownerId,
    name: 'KPN Travels',
    slug: 'kpn-travels',
    badge: 'Pioneer Network',
    rating: 4.6,
    reviews_count: 3100,
    description: 'Connecting Karnataka, Tamil Nadu & Kerala with Premier Coach Services',
    business_name: 'KPN Speed Lines Limited',
    business_registration_number: 'U60200TN2018PLC029811',
    gst_number: '33AABCK4499P1Z1',
    contact_email: 'info@kpntravels.in',
    contact_mobile: '9000000005',
    city: 'Salem',
    state: 'Tamil Nadu',
    pincode: '636004',
    business_address: 'KPN Complex, New Bus Stand, Salem',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-blueline-005',
    owner_id: ownerId,
    name: 'BlueLine Travels',
    slug: 'blueline-travels',
    badge: 'Coastal Express Line',
    rating: 4.7,
    reviews_count: 850,
    description: 'Fictional Demo Travel • Intercity Express Coach Operations',
    business_name: 'BlueLine Intercity Mobility Services',
    business_registration_number: 'U60100TN2023PTC055410',
    gst_number: '33AABCB7788M1Z1',
    contact_email: 'demo.blueline@example.com',
    contact_mobile: '9000000008',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    business_address: '100, GST Road, Guindy, Chennai',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-southstar-006',
    owner_id: ownerId,
    name: 'SouthStar Travels',
    slug: 'southstar-travels',
    badge: 'Southern Highway Master',
    rating: 4.6,
    reviews_count: 670,
    description: 'Fictional Demo Travel • Premium Highway Long-Haul Fleet',
    business_name: 'SouthStar Road Transport Lines',
    business_registration_number: 'U60100TN2022PTC049281',
    gst_number: '33AABCS4433P1Z9',
    contact_email: 'demo.southstar@example.com',
    contact_mobile: '9000000009',
    city: 'Tirunelveli',
    state: 'Tamil Nadu',
    pincode: '627001',
    business_address: 'High Ground Road, Palayamkottai, Tirunelveli',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-vrl-007',
    owner_id: ownerId,
    name: 'VRL Travels',
    slug: 'vrl-travels',
    badge: 'National Golden Fleet',
    rating: 4.8,
    reviews_count: 5400,
    description: 'Premier Pan-India Logistics & Luxury Volvo Sleeper Fleet',
    business_name: 'Vijayanand Travels Private Limited',
    business_registration_number: 'U60200KA2019PTC099411',
    gst_number: '29AABCV1234N1Z8',
    contact_email: 'ops@vrltravels.in',
    contact_mobile: '9000000010',
    city: 'Hubballi',
    state: 'Karnataka',
    pincode: '580024',
    business_address: 'Giriraj Annexe, Circuit House Road, Hubballi',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-orange-008',
    owner_id: ownerId,
    name: 'Orange Travels',
    slug: 'orange-travels',
    badge: 'Deccan Luxury Express',
    rating: 4.8,
    reviews_count: 4200,
    description: 'Executive Intercity Sleeper Coaches Connecting Telangana, AP, Karnataka & Tamil Nadu',
    business_name: 'Orange Tours & Travels Private Limited',
    business_registration_number: 'U60100TG2020PTC077189',
    gst_number: '36AABCO4567P1Z2',
    contact_email: 'support@orangetravels.in',
    contact_mobile: '9000000011',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500038',
    business_address: 'Ameerpet Metro Arcade, Hyderabad',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-kallada-009',
    owner_id: ownerId,
    name: 'Kallada Travels',
    slug: 'kallada-travels',
    badge: 'Kerala Coastal Express',
    rating: 4.7,
    reviews_count: 3600,
    description: 'Pioneer Multi-Axle Volvo Coach Line Across Kerala, Tamil Nadu & Karnataka',
    business_name: 'Kallada Intercity Transports Limited',
    business_registration_number: 'U60200KL2018PLC044321',
    gst_number: '32AABCK9876R1Z4',
    contact_email: 'fleet@kalladatravels.com',
    contact_mobile: '9000000012',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682019',
    business_address: 'Vytilla Mobility Hub Terminal Office, Kochi',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-zingbus-010',
    owner_id: ownerId,
    name: 'Zingbus',
    slug: 'zingbus',
    badge: 'Tech-First Smart Coach',
    rating: 4.8,
    reviews_count: 6100,
    description: 'High-Tech Intercity Connected Buses with Guaranteed Sanitized Cabins and On-Time Promise',
    business_name: 'Zing Mobility Private Limited',
    business_registration_number: 'U60100DL2019PTC088210',
    gst_number: '07AABCZ3322M1Z0',
    contact_email: 'care@zingbus.com',
    contact_mobile: '9000000013',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110006',
    business_address: 'Kashmere Gate ISBT Arcade, New Delhi',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-intrcity-011',
    owner_id: ownerId,
    name: 'IntrCity SmartBus',
    slug: 'intrcity-smartbus',
    badge: 'Smart Mobility Liner',
    rating: 4.7,
    reviews_count: 4800,
    description: 'Safe Clean Connected Bus Travel with Private Lounges and Onboard Bus Captains',
    business_name: 'Option Town Software Private Limited',
    business_registration_number: 'U60200DL2017PTC065432',
    gst_number: '07AABCI8899K1Z6',
    contact_email: 'help@intrcity.com',
    contact_mobile: '9000000014',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    business_address: 'Sector 62 Smart Hub, Noida',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-purple-012',
    owner_id: ownerId,
    name: 'Prasanna Purple',
    slug: 'prasanna-purple',
    badge: 'Western Express Pioneer',
    rating: 4.7,
    reviews_count: 3900,
    description: 'Leading Maharashtra & Goa Intercity Bus Service with Luxury Multi-Axle Fleet',
    business_name: 'Prasanna Purple Mobility Solutions Private Limited',
    business_registration_number: 'U60100MH2016PTC055112',
    gst_number: '27AABCP7744L1Z3',
    contact_email: 'info@prasannapurple.com',
    contact_mobile: '9000000015',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411030',
    business_address: 'Swargate Bus Terminal Complex, Pune',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-hans-013',
    owner_id: ownerId,
    name: 'Hans Travels',
    slug: 'hans-travels',
    badge: 'Heartland Highway Master',
    rating: 4.6,
    reviews_count: 2700,
    description: 'Reliable Daily Sleeper Operations Across Madhya Pradesh, Maharashtra & Gujarat',
    business_name: 'Hans Travels India Private Limited',
    business_registration_number: 'U60200MP2018PTC033991',
    gst_number: '23AABCH6655J1Z7',
    contact_email: 'bookings@hanstravels.com',
    contact_mobile: '9000000016',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452001',
    business_address: 'Sarwate Bus Stand Plaza, Indore',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: 'trv-shyamoli-014',
    owner_id: ownerId,
    name: 'Shyamoli Paribahan',
    slug: 'shyamoli-paribahan',
    badge: 'Eastern Highway Queen',
    rating: 4.7,
    reviews_count: 3100,
    description: 'Premier Eastern India Intercity & International Long-Haul Coach Network',
    business_name: 'Shyamoli Paribahan Private Limited',
    business_registration_number: 'U60100WB2015PTC022883',
    gst_number: '19AABCS9911D1Z5',
    contact_email: 'service@shyamoliparibahan.in',
    contact_mobile: '9000000017',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700069',
    business_address: 'Esplanade Bus Terminus Counter 4, Kolkata',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: cityTravelId,
    owner_id: ownerId,
    name: 'City Travels',
    slug: 'city-travels',
    badge: 'Executive Intercity Liner',
    rating: 4.6,
    reviews_count: 2150,
    description: 'Executive AC Pushback Coaches • Punctual Intercity Services across Western Tamil Nadu',
    business_name: 'City Travels Coimbatore Private Limited',
    business_registration_number: 'U60100TN2020PTC049911',
    gst_number: '33AABCC1234F1Z3',
    contact_email: 'support@citytravels.in',
    contact_mobile: '9000000020',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641018',
    business_address: 'Omni Bus Stand, Gandhipuram, Coimbatore',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: ybmTravelId,
    owner_id: ownerId,
    name: 'YBM Travels',
    slug: 'ybm-travels',
    badge: 'Luxury Sleeper with Restroom',
    rating: 4.8,
    reviews_count: 3420,
    description: 'Volvo B11R Luxury Sleeper Fleet with Bio-Toilet & UV Cabin Sterilization',
    business_name: 'YBM Travels India Private Limited',
    business_registration_number: 'U60200TN2019PTC081290',
    gst_number: '33AABCY5678K1Z5',
    contact_email: 'contact@ybmtravels.com',
    contact_mobile: '9000000021',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600107',
    business_address: 'Koyambedu Omni Bus Terminus, Chennai',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: abtTravelId,
    owner_id: ownerId,
    name: 'ABT X Travels',
    slug: 'abtx-travels',
    badge: 'Prakash Celeste Club',
    rating: 4.7,
    reviews_count: 2890,
    description: 'Prakash Celeste Executive 2+1 AC Sleeper • Decades of Transport Trust',
    business_name: 'ABT Info Mobility Private Limited',
    business_registration_number: 'U60100TN2018PTC023190',
    gst_number: '33AABCA9012M1Z8',
    contact_email: 'reservations@abttravels.com',
    contact_mobile: '9000000022',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641018',
    business_address: '180, Race Course Road, Coimbatore',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: parveenTravelId,
    owner_id: ownerId,
    name: 'Parveen Travels',
    slug: 'parveen-travels',
    badge: 'Mercedes Multi-Axle Club',
    rating: 4.8,
    reviews_count: 5120,
    description: 'Mercedes-Benz & Scania Multi-Axle Club Class Luxury Coaches',
    business_name: 'Parveen Automobiles Private Limited',
    business_registration_number: 'U60200TN2015PTC018245',
    gst_number: '33AABCP3456N1Z2',
    contact_email: 'care@parveentravels.com',
    contact_mobile: '9000000023',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600007',
    business_address: '115, Strahans Road, Perambur Barracks, Chennai',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: srmTravelId,
    owner_id: ownerId,
    name: 'SRM Transports',
    slug: 'srm-transports',
    badge: 'Highway Sleeper Express',
    rating: 4.6,
    reviews_count: 4300,
    description: 'Multi-Axle Semi-Sleeper & Volvo Sleeper Daily Intercity Corridors',
    business_name: 'SRM Transports India Private Limited',
    business_registration_number: 'U60100TN2016PTC049102',
    gst_number: '33AABCS7890Q1Z7',
    contact_email: 'support@srmtransports.in',
    contact_mobile: '9000000024',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600026',
    business_address: 'SRM Towers, Vadapalani, Chennai',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: srsTravelId,
    owner_id: ownerId,
    name: 'SRS Travels',
    slug: 'srs-travels',
    badge: 'Multi-Axle Interstate',
    rating: 4.5,
    reviews_count: 5800,
    description: 'Volvo B9R & B11R Multi-Axle Sleeper Intercity Network',
    business_name: 'SRS Travels Logistics Limited',
    business_registration_number: 'U60200KA2014PLC038192',
    gst_number: '29AABCS1199R1Z9',
    contact_email: 'info@srstravels.net',
    contact_mobile: '9000000025',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560009',
    business_address: 'Kalidas Layout, Gandhinagar, Bengaluru',
    verification_status: 'verified',
    status: 'active',
  },
  {
    id: nationalTravelId,
    owner_id: ownerId,
    name: 'National Travels',
    slug: 'national-travels',
    badge: 'Night Glider Express',
    rating: 4.6,
    reviews_count: 3650,
    description: 'BharatBenz Night Glider Non-Stop Sleeper Coaches',
    business_name: 'National Travels Lines Limited',
    business_registration_number: 'U60100KA2017PLC044910',
    gst_number: '29AABCN6633T1Z1',
    contact_email: 'ops@nationaltravels.com',
    contact_mobile: '9000000026',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560002',
    business_address: 'Kalasipalyam Main Road, Bengaluru',
    verification_status: 'verified',
    status: 'active',
  },
];

// ======================== 3. BUS LAYOUT CONFIGURATION ========================
// Real SMART ROUTE physical configuration:
// Chassis: TATA LPO 1618, Body: Prakash Vega Coach
// AC Seat/Cum/Sleeper (2+1)
// Lower Deck: 24 Pushback Seats + 6 Luxury Sleepers
// Upper Deck: 18 Panoramic Sleepers
// Driver position: RIGHT | Stairs: Driver's LEFT
export const layoutId = 'lay-tata-prakash-001';
export const busLayout = {
  id: layoutId,
  travel_id: smartRouteTravelId,
  name: 'TATA Capella AC 2+1 Seat/Cum/Sleeper',
  configuration: '2+1',
  has_upper_deck: true,
  lower_deck_rows: 11,
  upper_deck_rows: 9,
  columns: 4,
  total_seats: 24,
  total_sleepers: 24,
  layout_config: {
    chassis: 'TATA LPO 1618',
    body: 'Prakash Vega AC Sleeper',
    driver_position: 'right',
    stairs_position: 'front_left',
    lower_deck: { seats: 24, sleepers: 6 },
    upper_deck: { sleepers: 18 },
  },
};

// Generate exact layout seats
export const layoutSeats = [];
let seatSeq = 1;

// Lower Deck: 24 Pushback Seats (Rows 1-8: Left pair col 1 & 2; Right single col 4; Row 1 right col 4)
for (let r = 1; r <= 8; r++) {
  layoutSeats.push({
    id: `seat-l-${seatSeq}`,
    layout_id: layoutId,
    seat_number: `L${seatSeq}`,
    seat_label: `${seatSeq}`,
    seat_type: 'seat',
    deck: 'lower',
    row_number: r,
    column_number: 1,
    is_window: true,
    is_aisle: false,
    base_fare: 850,
    is_active: true,
  });
  seatSeq++;

  layoutSeats.push({
    id: `seat-l-${seatSeq}`,
    layout_id: layoutId,
    seat_number: `L${seatSeq}`,
    seat_label: `${seatSeq}`,
    seat_type: 'seat',
    deck: 'lower',
    row_number: r,
    column_number: 2,
    is_window: false,
    is_aisle: true,
    base_fare: 800,
    is_active: true,
  });
  seatSeq++;

  if (r >= 2) {
    layoutSeats.push({
      id: `seat-l-${seatSeq}`,
      layout_id: layoutId,
      seat_number: `L${seatSeq}`,
      seat_label: `${seatSeq}`,
      seat_type: 'seat',
      deck: 'lower',
      row_number: r,
      column_number: 4,
      is_window: true,
      is_aisle: false,
      base_fare: 900,
      is_active: true,
    });
    seatSeq++;
  }
}

// 24th lower seat (Row 1 right, behind driver partition)
layoutSeats.push({
  id: `seat-l-${seatSeq}`,
  layout_id: layoutId,
  seat_number: `L${seatSeq}`,
  seat_label: `${seatSeq}`,
  seat_type: 'seat',
  deck: 'lower',
  row_number: 1,
  column_number: 4,
  is_window: true,
  is_aisle: false,
  base_fare: 900,
  is_active: true,
});

// Lower Deck: 6 Sleepers (Rows 9-11: Left side double berths LS1-LS6)
for (let r = 9; r <= 11; r++) {
  const slpIdx = r - 8;
  layoutSeats.push({
    id: `slp-ls-${(slpIdx - 1) * 2 + 1}`,
    layout_id: layoutId,
    seat_number: `LS${(slpIdx - 1) * 2 + 1}`,
    seat_label: `LS${(slpIdx - 1) * 2 + 1}`,
    seat_type: 'sleeper',
    deck: 'lower',
    row_number: r,
    column_number: 1,
    is_window: true,
    is_aisle: false,
    base_fare: 1350,
    is_active: true,
  });
  layoutSeats.push({
    id: `slp-ls-${(slpIdx - 1) * 2 + 2}`,
    layout_id: layoutId,
    seat_number: `LS${(slpIdx - 1) * 2 + 2}`,
    seat_label: `LS${(slpIdx - 1) * 2 + 2}`,
    seat_type: 'sleeper',
    deck: 'lower',
    row_number: r,
    column_number: 2,
    is_window: false,
    is_aisle: true,
    base_fare: 1300,
    is_active: true,
  });
}

// Upper Deck: 18 Panoramic Sleepers (6 rows in 2+1 format: U1-U18)
for (let r = 1; r <= 6; r++) {
  const baseNum = (r - 1) * 3;
  // Left Window Sleeper
  layoutSeats.push({
    id: `slp-u-${baseNum + 1}`,
    layout_id: layoutId,
    seat_number: `U${baseNum + 1}`,
    seat_label: `U${baseNum + 1}`,
    seat_type: 'sleeper',
    deck: 'upper',
    row_number: r,
    column_number: 1,
    is_window: true,
    is_aisle: false,
    base_fare: 1400,
    is_active: true,
  });
  // Left Aisle Sleeper
  layoutSeats.push({
    id: `slp-u-${baseNum + 2}`,
    layout_id: layoutId,
    seat_number: `U${baseNum + 2}`,
    seat_label: `U${baseNum + 2}`,
    seat_type: 'sleeper',
    deck: 'upper',
    row_number: r,
    column_number: 2,
    is_window: false,
    is_aisle: true,
    base_fare: 1350,
    is_active: true,
  });
  // Right Single Window Sleeper (across aisle)
  layoutSeats.push({
    id: `slp-u-${baseNum + 3}`,
    layout_id: layoutId,
    seat_number: `U${baseNum + 3}`,
    seat_label: `U${baseNum + 3}`,
    seat_type: 'sleeper',
    deck: 'upper',
    row_number: r,
    column_number: 4,
    is_window: true,
    is_aisle: false,
    base_fare: 1450,
    is_active: true,
  });
}

export const busRoyalSleeperId = 'bus-royal-sleeper-01';
export const busExecSeaterSleeperId = 'bus-exec-seatersleeper-02';
export const busNightGliderId = 'bus-night-glider-03';

// ======================== 4. MULTIPLE FLEET BUSES ========================
export const buses = [
  // SMART ROUTE Fleet & Synthetic Demo Buses
  {
    id: 'bus-sr-001',
    bus_number: 'SR-DEMO-001',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Pioneer Demo 1',
    registration_number: 'TN-38-SR-0001',
    chassis_make: 'TATA',
    body_make: 'Prakash Vega',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-bl-001',
    bus_number: 'SR-DEMO-002',
    travel_id: 'trv-blueline-005',
    name: 'BlueLine Express Demo 2',
    registration_number: 'TN-43-BL-0002',
    chassis_make: 'TATA',
    body_make: 'Prakash Vega',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-ss-001',
    bus_number: 'SR-DEMO-003',
    travel_id: 'trv-southstar-006',
    name: 'SouthStar Highway Demo 3',
    registration_number: 'TN-59-SS-0003',
    chassis_make: 'TATA',
    body_make: 'Prakash Vega',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-sr-002',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Neo 2',
    registration_number: 'TN-38-SR-1002',
    chassis_make: 'TATA',
    body_make: 'Prakash Vega',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-sr-003',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Prime 3',
    registration_number: 'KA-01-SR-2025',
    chassis_make: 'Volvo',
    body_make: 'Volvo 9600 Multi-Axle',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },

  // VEE VEE Travels Fleet
  {
    id: 'bus-vv-001',
    travel_id: veeVeeTravelId,
    name: 'VEE VEE Platinum 1',
    registration_number: 'TN-59-VV-3344',
    chassis_make: 'TATA',
    body_make: 'Prakash Vega',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-vv-002',
    travel_id: veeVeeTravelId,
    name: 'VEE VEE Royale 2',
    registration_number: 'TN-59-VV-5566',
    chassis_make: 'BharatBenz',
    body_make: 'Prakash Vega',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 30,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-vv-003',
    travel_id: veeVeeTravelId,
    name: 'VEE VEE Express 3',
    registration_number: 'KA-05-VV-7788',
    chassis_make: 'Volvo',
    body_make: 'B11R Multi-Axle',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },

  // TRANZKING Travels Fleet
  {
    id: 'bus-tz-001',
    travel_id: tranzKingTravelId,
    name: 'TRANZKING Supernova 1',
    registration_number: 'TN-09-TZ-7711',
    chassis_make: 'TATA',
    body_make: 'Prakash Vega',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-tz-002',
    travel_id: tranzKingTravelId,
    name: 'TRANZKING Velocity 2',
    registration_number: 'TN-09-TZ-8822',
    chassis_make: 'Scania',
    body_make: 'Metrolink HD Multi-Axle',
    bus_type: 'ac_seater',
    configuration: '2+2',
    total_seats: 44,
    total_sleepers: 0,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-tz-003',
    travel_id: tranzKingTravelId,
    name: 'TRANZKING Hyperion 3',
    registration_number: 'KA-03-TZ-9933',
    chassis_make: 'TATA',
    body_make: 'Prakash Vega',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },

  // Horizon Travels Fleet
  {
    id: 'bus-horizon-001',
    travel_id: horizonTravelId,
    name: 'Horizon Celestial 1',
    registration_number: 'TN-38-BT-4589',
    chassis_make: 'TATA',
    body_make: 'Prakash Vega',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-vv-004',
    travel_id: veeVeeTravelId,
    name: 'VEE VEE Horizon Star',
    registration_number: 'TN-59-VV-9900',
    chassis_make: 'BharatBenz',
    body_make: 'Veera V7 Coach',
    bus_type: 'non_ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 30,
    has_ac: false,
    has_wifi: false,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-tz-004',
    travel_id: tranzKingTravelId,
    name: 'TRANZKING Highway Cruiser',
    registration_number: 'TN-09-TZ-4455',
    chassis_make: 'BharatBenz',
    body_make: 'Prakash Vega Seater',
    bus_type: 'ac_seater',
    configuration: '2+2',
    total_seats: 40,
    total_sleepers: 0,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-rm-001',
    travel_id: rathimeenaTravelId,
    name: 'Rathimeena Delta Queen',
    registration_number: 'TN-49-RM-2022',
    chassis_make: 'TATA',
    body_make: 'Prakash Vega',
    bus_type: 'non_ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: false,
    has_wifi: false,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-kpn-001',
    travel_id: kpnTravelId,
    name: 'KPN Grand Imperial',
    registration_number: 'TN-30-KP-6677',
    chassis_make: 'BharatBenz',
    body_make: 'Prakash Celestial Sleeper',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 30,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-sr-volvo-001',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Volvo 9600 XLX Sovereign',
    registration_number: 'KA-01-SR-9600',
    chassis_make: 'Volvo',
    body_make: 'Volvo 9600 XLX Luxury Coach',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-horizon-002',
    travel_id: horizonTravelId,
    name: 'Horizon Intercity Shuttle',
    registration_number: 'KA-04-HZ-1122',
    chassis_make: 'TATA',
    body_make: 'Starbus Ultra Executive',
    bus_type: 'ac_seater',
    configuration: '2+2',
    total_seats: 40,
    total_sleepers: 0,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    is_active: true,
    layout_id: layoutId,
  },

  // Coimbatore ⇄ Karaikudi Corridor Fleet
  {
    id: busRoyalSleeperId,
    bus_number: 'SR-RS-CBE-KKDI',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Royal Sleeper',
    registration_number: 'TN-38-SR-9600',
    chassis_make: 'Volvo',
    body_make: 'Volvo 9600',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    has_radar_gps: true,
    features: ['Live Radar GPS', 'UV AC', 'USB-C Charging', 'Blanket'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: busExecSeaterSleeperId,
    bus_number: 'SR-EX-CBE-KKDI',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Executive Seater/Sleeper',
    registration_number: 'TN-38-EX-4801',
    chassis_make: 'TATA',
    body_make: 'Prakash',
    bus_type: 'ac_seat_cum_sleeper',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    has_live_tracking: true,
    features: ['Pushback Seater', 'Charging Port', 'Reading Light'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: busNightGliderId,
    bus_number: 'SR-NG-CBE-KKDI',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Night Glider',
    registration_number: 'TN-38-NG-8203',
    chassis_make: 'BharatBenz',
    body_make: 'Capella Glider',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Live Tracking', 'Climate Controlled AC'],
    is_active: true,
    layout_id: layoutId,
  },

  // Additional Fleet Buses Ensuring All 5 Standard Bus Types
  {
    id: 'bus-horizon-003',
    travel_id: horizonTravelId,
    name: 'Horizon Express Line',
    registration_number: 'TN-38-HZ-7711',
    chassis_make: 'Ashok Leyland',
    body_make: 'Viking 2+2 Semi-Deluxe',
    bus_type: 'non_ac_seater',
    configuration: '2+2',
    total_seats: 44,
    total_sleepers: 0,
    has_ac: false,
    has_wifi: false,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-rm-002',
    travel_id: rathimeenaTravelId,
    name: 'Rathimeena Express Line',
    registration_number: 'TN-49-RM-5501',
    chassis_make: 'TATA',
    body_make: 'Capella Seater Coach',
    bus_type: 'non_ac_seater',
    configuration: '2+2',
    total_seats: 48,
    total_sleepers: 0,
    has_ac: false,
    has_wifi: false,
    has_charging: false,
    has_toilet: false,
    has_water_bottle: false,
    has_blanket: false,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-kpn-002',
    travel_id: kpnTravelId,
    name: 'KPN Classic Sleeper',
    registration_number: 'TN-30-KP-8899',
    chassis_make: 'Ashok Leyland',
    body_make: 'Falcon Sleeper Coach',
    bus_type: 'non_ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 30,
    has_ac: false,
    has_wifi: false,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-sr-seater-001',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Intercity Air Seater',
    registration_number: 'TN-38-SR-3344',
    chassis_make: 'BharatBenz',
    body_make: 'Capella Air Glider Coach',
    bus_type: 'ac_seater',
    configuration: '2+2',
    total_seats: 44,
    total_sleepers: 0,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    is_active: true,
    layout_id: layoutId,
  },
  // Pan-India Verified Fleet Buses
  {
    id: 'bus-vrl-001',
    bus_number: 'VRL-VOLVO-9600',
    travel_id: 'trv-vrl-007',
    name: 'VRL I-Shift Volvo 9600 XLX',
    registration_number: 'KA-25-F-9600',
    chassis_make: 'Volvo',
    body_make: 'Volvo 9600 XLX Multi-Axle',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Live Tracking', 'UV Air Purifier', 'Blanket', 'Reading Light'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-orange-001',
    bus_number: 'ORG-BB-1624',
    travel_id: 'trv-orange-008',
    name: 'Orange BharatBenz Glider AC Sleeper',
    registration_number: 'TS-09-UB-1624',
    chassis_make: 'BharatBenz',
    body_make: 'Veera V7 Luxury Sleeper',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Live Tracking', 'Individual USB Charging', 'Mineral Water'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-kallada-001',
    bus_number: 'KAL-SCANIA-METRO',
    travel_id: 'trv-kallada-009',
    name: 'Kallada Scania Metrolink Multi-Axle',
    registration_number: 'KL-07-CD-3399',
    chassis_make: 'Scania',
    body_make: 'Metrolink HD 14.5M Multi-Axle',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Live Tracking', 'Chemical Toilet', 'Blanket & Pillow'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-zingbus-001',
    bus_number: 'ZB-HIMALAYAN-01',
    travel_id: 'trv-zingbus-010',
    name: 'Zingbus Climate Controlled AC Sleeper',
    registration_number: 'DL-01-ZB-5521',
    chassis_make: 'BharatBenz',
    body_make: 'Capella High-Comfort Sleeper',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Live Radar GPS', 'On-Time Guarantee', 'Emergency SOS'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-intrcity-001',
    bus_number: 'IC-SMART-001',
    travel_id: 'trv-intrcity-011',
    name: 'IntrCity SmartBus Volvo Club Class',
    registration_number: 'UP-32-IS-7701',
    chassis_make: 'Volvo',
    body_make: 'Volvo B11R Multi-Axle',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Bus Captain Onboard', 'Live Satellite Tracking', 'Private Lounge Access'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-purple-001',
    bus_number: 'PP-MERCEDES-EXPR',
    travel_id: 'trv-purple-012',
    name: 'Prasanna Purple Mercedes Multi-Axle',
    registration_number: 'MH-12-PP-8822',
    chassis_make: 'Mercedes-Benz',
    body_make: 'SHD 2436 Luxury Coach',
    bus_type: 'ac_seater',
    configuration: '2+2',
    total_seats: 44,
    total_sleepers: 0,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    has_live_tracking: true,
    features: ['Expressway Air Suspension', 'Fast USB Fast Charging'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-hans-001',
    bus_number: 'HT-HEARTLAND-01',
    travel_id: 'trv-hans-013',
    name: 'Hans Travels BharatBenz AC Sleeper',
    registration_number: 'MP-09-HT-4411',
    chassis_make: 'BharatBenz',
    body_make: 'Veera V7 Coach',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Comfort Berth', 'Night Reading Lamp', 'Water Bottle'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-shyamoli-001',
    bus_number: 'SP-EASTERN-01',
    travel_id: 'trv-shyamoli-014',
    name: 'Shyamoli Paribahan Volvo Multi-Axle',
    registration_number: 'WB-04-SP-1199',
    chassis_make: 'Volvo',
    body_make: 'Volvo B11R Luxury Sleeper',
    bus_type: 'ac_sleeper',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Live Tracking', 'Clean Bedrolls', 'First Aid Onboard'],
    is_active: true,
    layout_id: layoutId,
  },

  // Coimbatore ⇄ Tenkasi Luxury Fleet
  {
    id: 'bus-cbe-tks-sr-01',
    bus_number: 'SR-CBETKS-01',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Royal Sleeper',
    registration_number: 'TN-38-SR-1001',
    chassis_make: 'Volvo',
    body_make: 'Volvo 9600 XLX',
    bus_type: 'ac_sleeper',
    layoutType: 'sleeper_36',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    has_radar_gps: true,
    features: ['Live Radar GPS', 'UV Sterilized AC', 'Type-C Fast Charging', 'Emergency SOS'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-cbe-tks-vv-02',
    bus_number: 'VV-CBETKS-100',
    travel_id: veeVeeTravelId,
    name: 'VEE VEE Capella Executive',
    registration_number: 'TN-38-VV-2002',
    chassis_make: 'TATA',
    body_make: 'Prakash Capella',
    bus_type: 'ac_seat_cum_sleeper',
    layoutType: 'combo_48',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Live Tracking', 'Individual USB Ports', 'Reading Lamps'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-cbe-tks-tk-03',
    bus_number: 'TK-CBETKS-200',
    travel_id: tranzKingTravelId,
    name: 'TRANZKING Super Glider',
    registration_number: 'TN-72-TK-3003',
    chassis_make: 'BharatBenz',
    body_make: 'Prakash AC Sleeper',
    bus_type: 'ac_sleeper',
    layoutType: 'sleeper_washroom_rear',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 30,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Rear Bio-Toilet', 'Panoramic Sleeper', 'Free Bottled Water'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-cbe-tks-ct-04',
    bus_number: 'CT-CBETKS-300',
    travel_id: cityTravelId,
    name: 'City Express Dayliner',
    registration_number: 'TN-38-CT-4004',
    chassis_make: 'Ashok Leyland',
    body_make: 'Executive Coach',
    bus_type: 'ac_seater',
    layoutType: 'seater_40',
    configuration: '2+2',
    total_seats: 40,
    total_sleepers: 0,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    has_live_tracking: true,
    features: ['Pushback Seats', 'Individual AC Vents', 'Charging Ports'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-cbe-tks-yb-05',
    bus_number: 'YB-CBETKS-400',
    travel_id: ybmTravelId,
    name: 'YBM Night Rider',
    registration_number: 'TN-67-YB-5005',
    chassis_make: 'Volvo',
    body_make: 'Volvo B11R Luxury Sleeper',
    bus_type: 'ac_sleeper',
    layoutType: 'sleeper_washroom_front',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 30,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Front Bio-Toilet', 'Memory Foam Mattresses', 'UV Cabin Sterilization'],
    is_active: true,
    layout_id: layoutId,
  },

  // Coimbatore ⇄ Karaikudi Luxury Fleet
  {
    id: 'bus-cbe-kkdi-sr-01',
    bus_number: 'SR-CBEKKDI-01',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Glider',
    registration_number: 'TN-38-SR-9600',
    chassis_make: 'Volvo',
    body_make: 'Volvo 9600',
    bus_type: 'ac_sleeper',
    layoutType: 'sleeper_36',
    configuration: '2+1',
    total_seats: 0,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Live Tracking', 'UV Air Sterilization', 'Blanket', 'Water Bottle'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-cbe-kkdi-rm-02',
    bus_number: 'RM-CBEKKDI-02',
    travel_id: rathimeenaTravelId,
    name: 'Rathimeena Express',
    registration_number: 'TN-49-RM-7007',
    chassis_make: 'Volvo',
    body_make: 'Volvo B8R Intercity',
    bus_type: 'ac_seater',
    layoutType: 'seater_40',
    configuration: '2+2',
    total_seats: 40,
    total_sleepers: 0,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: false,
    has_live_tracking: true,
    features: ['High-Back Ergonomic Recliner', 'Express Route', 'USB Fast Charger'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-cbe-kkdi-vv-03',
    bus_number: 'VV-CBEKKDI-03',
    travel_id: veeVeeTravelId,
    name: 'VEE VEE Premier Sleeper',
    registration_number: 'TN-58-VV-8008',
    chassis_make: 'TATA',
    body_make: 'Prakash Capella',
    bus_type: 'ac_seat_cum_sleeper',
    layoutType: 'combo_48',
    configuration: '2+1',
    total_seats: 24,
    total_sleepers: 24,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: false,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: true,
    features: ['Individual Privacy Blinds', 'Pillow & Blanket', 'Live Bus Tracker'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-cbe-kkdi-tk-04',
    bus_number: 'TK-CBEKKDI-04',
    travel_id: tranzKingTravelId,
    name: 'TRANZKING Falcon',
    registration_number: 'TN-72-TK-9009',
    chassis_make: 'Mercedes-Benz',
    body_make: 'Club Class Washroom',
    bus_type: 'ac_seater',
    layoutType: 'seater_washroom',
    configuration: '2+2',
    total_seats: 36,
    total_sleepers: 0,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: false,
    has_live_tracking: true,
    features: ['Onboard Restroom', 'Club Leather Seats', 'High Speed WiFi'],
    is_active: true,
    layout_id: layoutId,
  },
  {
    id: 'bus-brand-new-zero-01',
    bus_number: 'SR-NEW-01',
    travel_id: smartRouteTravelId,
    name: 'SMART ROUTE Fresh Delivery',
    registration_number: 'TN-38-NEW-0001',
    chassis_make: 'Volvo',
    body_make: '9600 Multi-Axle',
    bus_type: 'ac_sleeper',
    layoutType: 'sleeper_2x1',
    configuration: '2+1',
    total_seats: 36,
    total_sleepers: 36,
    has_ac: true,
    has_wifi: true,
    has_charging: true,
    has_toilet: true,
    has_water_bottle: true,
    has_blanket: true,
    has_live_tracking: false,
    features: ['Brand New Delivery', 'Unassigned to Trips'],
    is_active: true,
    status: 'idle',
    layout_id: layoutId,
  },
];

// Normalize and guarantee structured bus brand/model/display_name across all seed buses
buses.forEach((b) => {
  if (!b.manufacturer) {
    if (b.chassis_make) b.manufacturer = b.chassis_make;
    else if (b.name?.toLowerCase().includes('volvo')) b.manufacturer = 'Volvo';
    else if (b.name?.toLowerCase().includes('scania')) b.manufacturer = 'Scania';
    else if (b.name?.toLowerCase().includes('bharatbenz')) b.manufacturer = 'BharatBenz';
    else if (b.name?.toLowerCase().includes('ashok leyland') || b.name?.toLowerCase().includes('leyland')) b.manufacturer = 'Ashok Leyland';
    else if (b.name?.toLowerCase().includes('eicher')) b.manufacturer = 'Eicher';
    else if (b.name?.toLowerCase().includes('mercedes')) b.manufacturer = 'Mercedes-Benz';
    else b.manufacturer = 'Tata';
  }
  if (!b.model) {
    if (b.chassis_model) b.model = b.chassis_model;
    else if (b.name?.includes('9600')) b.model = '9600';
    else if (b.name?.includes('1618')) b.model = 'LPO 1618';
    else if (b.name?.includes('1624')) b.model = '1624';
    else if (b.name?.includes('Metrolink')) b.model = 'Metrolink HD';
    else b.model = 'Standard Coach';
  }
  if (!b.display_name) {
    b.display_name = b.custom_name || b.name || `${b.manufacturer} ${b.model}`;
  }
  if (!b.custom_name && b.name && !b.name.startsWith(b.manufacturer)) {
    b.custom_name = b.name;
  }
});

// ======================== 5. COMPREHENSIVE SOUTH INDIAN ROUTES ========================
export const route1Id = 'rt-cbe-tks-001';
export const route2Id = 'rt-tks-cbe-002';
export const route3Id = 'rt-che-cbe-003';
export const route4Id = 'rt-cbe-che-004';
export const route5Id = 'rt-blr-mdu-005';
export const route6Id = 'rt-mdu-blr-006';
export const route7Id = 'rt-blr-cbe-007';
export const route8Id = 'rt-cbe-blr-008';
export const route9Id = 'rt-che-mdu-009';
export const route10Id = 'rt-cbe-koc-010';
export const route11Id = 'rt-blr-tnv-011';
export const route12Id = 'rt-che-pdy-trz-012';
export const routeKkdiId = 'route_cbe_kkdi_01';

export const legacyRoutes = [
  {
    id: route1Id,
    travel_id: smartRouteTravelId,
    name: 'Coimbatore - Tenkasi Express',
    code: 'CBE-TKS-101',
    source: 'Coimbatore',
    destination: 'Tenkasi',
    distance_km: 320,
    estimated_duration_minutes: 480,
    is_active: true,
    direction: 'forward',
    source_state: 'Tamil Nadu',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route2Id,
    travel_id: smartRouteTravelId,
    name: 'Tenkasi - Coimbatore Express',
    code: 'TKS-CBE-102',
    source: 'Tenkasi',
    destination: 'Coimbatore',
    distance_km: 320,
    estimated_duration_minutes: 480,
    is_active: true,
    direction: 'reverse',
    source_state: 'Tamil Nadu',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route3Id,
    travel_id: tranzKingTravelId,
    name: 'Chennai - Coimbatore Non-Stop Executive',
    code: 'CHE-CBE-201',
    source: 'Chennai',
    destination: 'Coimbatore',
    distance_km: 510,
    estimated_duration_minutes: 510,
    is_active: true,
    direction: 'reverse',
    source_state: 'Tamil Nadu',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route4Id,
    travel_id: tranzKingTravelId,
    name: 'Coimbatore - Chennai Highway Sleeper',
    code: 'CBE-CHE-202',
    source: 'Coimbatore',
    destination: 'Chennai',
    distance_km: 510,
    estimated_duration_minutes: 510,
    is_active: true,
    direction: 'forward',
    source_state: 'Tamil Nadu',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route5Id,
    travel_id: veeVeeTravelId,
    name: 'Bengaluru - Madurai Highway Express',
    code: 'BLR-MDU-301',
    source: 'Bengaluru',
    destination: 'Madurai',
    distance_km: 440,
    estimated_duration_minutes: 420,
    is_active: true,
    direction: 'forward',
    source_state: 'Karnataka',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route6Id,
    travel_id: veeVeeTravelId,
    name: 'Madurai - Bengaluru Overnight Express',
    code: 'MDU-BLR-302',
    source: 'Madurai',
    destination: 'Bengaluru',
    distance_km: 440,
    estimated_duration_minutes: 420,
    is_active: true,
    direction: 'reverse',
    source_state: 'Tamil Nadu',
    destination_state: 'Karnataka',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route7Id,
    travel_id: smartRouteTravelId,
    name: 'Bengaluru - Coimbatore Silicon Express',
    code: 'BLR-CBE-401',
    source: 'Bengaluru',
    destination: 'Coimbatore',
    distance_km: 365,
    estimated_duration_minutes: 360,
    is_active: true,
    direction: 'forward',
    source_state: 'Karnataka',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route8Id,
    travel_id: smartRouteTravelId,
    name: 'Coimbatore - Bengaluru Tech Corridor',
    code: 'CBE-BLR-402',
    source: 'Coimbatore',
    destination: 'Bengaluru',
    distance_km: 365,
    estimated_duration_minutes: 360,
    is_active: true,
    direction: 'forward',
    source_state: 'Tamil Nadu',
    destination_state: 'Karnataka',
    corridor_region: 'Karnataka',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route9Id,
    travel_id: tranzKingTravelId,
    name: 'Chennai - Madurai Temple Express',
    code: 'CHE-MDU-501',
    source: 'Chennai',
    destination: 'Madurai',
    distance_km: 460,
    estimated_duration_minutes: 450,
    is_active: true,
    direction: 'forward',
    source_state: 'Tamil Nadu',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route10Id,
    travel_id: smartRouteTravelId,
    name: 'Coimbatore - Kochi Coastal Link',
    code: 'CBE-KOC-601',
    source: 'Coimbatore',
    destination: 'Kochi',
    distance_km: 190,
    estimated_duration_minutes: 240,
    is_active: true,
    direction: 'forward',
    source_state: 'Tamil Nadu',
    destination_state: 'Kerala',
    corridor_region: 'Kerala',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route11Id,
    travel_id: veeVeeTravelId,
    name: 'Bengaluru - Tirunelveli Southern Star',
    code: 'BLR-TNV-701',
    source: 'Bengaluru',
    destination: 'Tirunelveli',
    distance_km: 580,
    estimated_duration_minutes: 540,
    is_active: true,
    direction: 'forward',
    source_state: 'Karnataka',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: route12Id,
    travel_id: rathimeenaTravelId,
    name: 'Chennai - Pondicherry - Trichy Heritage',
    code: 'CHE-PDY-TRZ-801',
    source: 'Chennai',
    destination: 'Trichy',
    distance_km: 330,
    estimated_duration_minutes: 360,
    is_active: true,
    direction: 'forward',
    source_state: 'Tamil Nadu',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
  {
    id: routeKkdiId,
    travel_id: smartRouteTravelId,
    name: 'Coimbatore - Karaikudi Intercity Express',
    code: 'route_cbe_kkdi_01',
    source: 'Coimbatore',
    destination: 'Karaikudi',
    distance_km: 265,
    estimated_duration_minutes: 375, // 6h 15m
    is_active: true,
    direction: 'forward',
    source_state: 'Tamil Nadu',
    destination_state: 'Tamil Nadu',
    corridor_region: 'Tamil Nadu',
    verification_status: ROUTE_STATUS.SEED,
    is_seed: true,
    data_source: 'smartroute_presentation_seed',
    hasActiveService: true,
  },
];

export const catalogueMappedRoutes = ALL_CATALOGUE_ROUTES.map((cr) => ({
  id: cr.id,
  travel_id: cr.travel_id || smartRouteTravelId,
  name: `${cr.source} - ${cr.destination} ${cr.direction === 'reverse' ? 'Return ' : ''}${cr.category === 'interstate_long_haul' ? 'Interstate Express' : cr.category === 'intercity_day_coach' ? 'Intercity Day Coach' : 'Highway Sleeper'}`,
  code: cr.code,
  source: cr.source,
  destination: cr.destination,
  distance_km: cr.distanceKm,
  estimated_duration_minutes: cr.durationMins,
  is_active: cr.status !== ROUTE_STATUS.INACTIVE,
  direction: cr.direction,
  source_state: cr.sourceState,
  destination_state: cr.destState,
  corridor_region: cr.region,
  verification_status: cr.status,
  is_seed: true,
  data_source: 'smartroute_presentation_catalogue',
  hasActiveService: Boolean(cr.hasActiveService),
}));

export const routes = [
  ...legacyRoutes,
  ...catalogueMappedRoutes,
];

// ======================== 6. ORDERED GPS ROUTE STOPS ========================
export const routeStops = [
  // Route: Coimbatore ➔ Karaikudi (route_cbe_kkdi_01 - 5 Boarding, 3 Dropping)
  { id: 'stop-kkdi-01', route_id: routeKkdiId, name: 'Gandhipuram Omni Bus Stand', city: 'Coimbatore', latitude: 11.0183, longitude: 76.9725, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-kkdi-02', route_id: routeKkdiId, name: 'Lakshmi Mills', city: 'Coimbatore', latitude: 11.0118, longitude: 76.9855, stop_order: 2, distance_from_start_km: 3, estimated_time_from_start_minutes: 10, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-kkdi-03', route_id: routeKkdiId, name: 'Singanallur', city: 'Coimbatore', latitude: 10.9950, longitude: 77.0002, stop_order: 3, distance_from_start_km: 9, estimated_time_from_start_minutes: 20, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-kkdi-04', route_id: routeKkdiId, name: 'Sulur', city: 'Coimbatore', latitude: 11.0264, longitude: 77.1265, stop_order: 4, distance_from_start_km: 22, estimated_time_from_start_minutes: 35, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-kkdi-05', route_id: routeKkdiId, name: 'Palladam', city: 'Palladam', latitude: 10.9981, longitude: 77.2912, stop_order: 5, distance_from_start_km: 40, estimated_time_from_start_minutes: 55, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-kkdi-06', route_id: routeKkdiId, name: 'Pudukkottai Bypass', city: 'Pudukkottai', latitude: 10.3833, longitude: 78.8001, stop_order: 6, distance_from_start_km: 220, estimated_time_from_start_minutes: 315, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-kkdi-07', route_id: routeKkdiId, name: 'Alagappa University', city: 'Karaikudi', latitude: 10.0768, longitude: 78.7844, stop_order: 7, distance_from_start_km: 255, estimated_time_from_start_minutes: 355, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-kkdi-08', route_id: routeKkdiId, name: 'Karaikudi New Bus Stand', city: 'Karaikudi', latitude: 10.0652, longitude: 78.7758, stop_order: 8, distance_from_start_km: 265, estimated_time_from_start_minutes: 375, is_boarding_point: false, is_dropping_point: true },

  // Route 1: Coimbatore ➔ Tenkasi (All 16 stops development demo data)
  { id: 'stop-101', route_id: route1Id, name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-102', route_id: route1Id, name: 'Gandhipuram', city: 'Coimbatore', latitude: 11.0183, longitude: 76.9725, stop_order: 2, distance_from_start_km: 4, estimated_time_from_start_minutes: 15, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-103', route_id: route1Id, name: 'Singanallur', city: 'Coimbatore', latitude: 10.995, longitude: 77.0002, stop_order: 3, distance_from_start_km: 9, estimated_time_from_start_minutes: 25, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-104', route_id: route1Id, name: 'Ukkadam', city: 'Coimbatore', latitude: 10.9904, longitude: 76.9601, stop_order: 4, distance_from_start_km: 15, estimated_time_from_start_minutes: 40, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-105', route_id: route1Id, name: 'Pollachi Old Bus Stand', city: 'Pollachi', latitude: 10.6609, longitude: 77.0082, stop_order: 5, distance_from_start_km: 42, estimated_time_from_start_minutes: 70, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-106', route_id: route1Id, name: 'Udumalapettai Central Bus Stand', city: 'Udumalapettai', latitude: 10.5872, longitude: 77.2476, stop_order: 6, distance_from_start_km: 82, estimated_time_from_start_minutes: 110, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-107', route_id: route1Id, name: 'Palani Bus Stand', city: 'Palani', latitude: 10.4505, longitude: 77.5164, stop_order: 7, distance_from_start_km: 120, estimated_time_from_start_minutes: 160, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-108', route_id: route1Id, name: 'Ottanchathiram Bus Stand', city: 'Ottanchathiram', latitude: 10.4851, longitude: 77.7554, stop_order: 8, distance_from_start_km: 150, estimated_time_from_start_minutes: 195, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-109', route_id: route1Id, name: 'Thirumangalam Toll Gate', city: 'Thirumangalam', latitude: 9.8242, longitude: 77.9866, stop_order: 9, distance_from_start_km: 205, estimated_time_from_start_minutes: 255, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-110', route_id: route1Id, name: 'Srivilliputhur Bus Stand', city: 'Srivilliputhur', latitude: 9.5125, longitude: 77.6348, stop_order: 10, distance_from_start_km: 245, estimated_time_from_start_minutes: 300, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-111', route_id: route1Id, name: 'Rajapalayam Old Bus Stand', city: 'Rajapalayam', latitude: 9.4534, longitude: 77.5565, stop_order: 11, distance_from_start_km: 265, estimated_time_from_start_minutes: 325, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-112', route_id: route1Id, name: 'Vasudevanallur Bypass', city: 'Vasudevanallur', latitude: 9.2335, longitude: 77.4162, stop_order: 12, distance_from_start_km: 285, estimated_time_from_start_minutes: 350, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-113', route_id: route1Id, name: 'Sivagiri Bus Stop', city: 'Sivagiri', latitude: 9.3402, longitude: 77.4302, stop_order: 13, distance_from_start_km: 295, estimated_time_from_start_minutes: 365, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-114', route_id: route1Id, name: 'Puliyangudi Main Road', city: 'Puliyangudi', latitude: 9.1764, longitude: 77.3965, stop_order: 14, distance_from_start_km: 310, estimated_time_from_start_minutes: 385, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-115', route_id: route1Id, name: 'Kadayanallur Bypass', city: 'Kadayanallur', latitude: 9.0733, longitude: 77.3423, stop_order: 15, distance_from_start_km: 325, estimated_time_from_start_minutes: 410, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-116', route_id: route1Id, name: 'Tenkasi New Bus Stand', city: 'Tenkasi', latitude: 8.9604, longitude: 77.3152, stop_order: 16, distance_from_start_km: 345, estimated_time_from_start_minutes: 440, is_boarding_point: false, is_dropping_point: true },

  // Route 3: Chennai ➔ Coimbatore
  { id: 'stop-301', route_id: route3Id, name: 'Koyambedu Omni Bus Stand (CMBT)', city: 'Chennai', latitude: 13.0694, longitude: 80.1948, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-302', route_id: route3Id, name: 'Guindy Kathipara Junction', city: 'Chennai', latitude: 13.0067, longitude: 80.2025, stop_order: 2, distance_from_start_km: 12, estimated_time_from_start_minutes: 25, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-303', route_id: route3Id, name: 'Tambaram MEPZ Terminal', city: 'Chennai', latitude: 12.9249, longitude: 80.1345, stop_order: 3, distance_from_start_km: 28, estimated_time_from_start_minutes: 45, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-304', route_id: route3Id, name: 'Salem New Bus Stand', city: 'Salem', latitude: 11.6643, longitude: 78.146, stop_order: 4, distance_from_start_km: 345, estimated_time_from_start_minutes: 330, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-305', route_id: route3Id, name: 'Avinashi Bypass', city: 'Avinashi', latitude: 11.1925, longitude: 77.2694, stop_order: 5, distance_from_start_km: 470, estimated_time_from_start_minutes: 460, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-306', route_id: route3Id, name: 'Coimbatore Gandhipuram Bus Stand', city: 'Coimbatore', latitude: 11.0183, longitude: 76.9725, stop_order: 6, distance_from_start_km: 510, estimated_time_from_start_minutes: 510, is_boarding_point: false, is_dropping_point: true },

  // Route 5: Bengaluru ➔ Madurai
  { id: 'stop-501', route_id: route5Id, name: 'Majestic Kempegowda Bus Station', city: 'Bengaluru', latitude: 12.9767, longitude: 77.5713, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-502', route_id: route5Id, name: 'Electronic City Toll Gate', city: 'Bengaluru', latitude: 12.8399, longitude: 77.677, stop_order: 2, distance_from_start_km: 22, estimated_time_from_start_minutes: 35, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-503', route_id: route5Id, name: 'Salem New Bus Stand', city: 'Salem', latitude: 11.6643, longitude: 78.146, stop_order: 3, distance_from_start_km: 200, estimated_time_from_start_minutes: 210, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-504', route_id: route5Id, name: 'Dindigul Bypass', city: 'Dindigul', latitude: 10.3673, longitude: 77.9803, stop_order: 4, distance_from_start_km: 375, estimated_time_from_start_minutes: 360, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-505', route_id: route5Id, name: 'Mattuthavani Integrated Bus Stand (MIBT)', city: 'Madurai', latitude: 9.9463, longitude: 78.1565, stop_order: 5, distance_from_start_km: 440, estimated_time_from_start_minutes: 420, is_boarding_point: false, is_dropping_point: true },

  // Route 7: Bengaluru ➔ Coimbatore
  { id: 'stop-701', route_id: route7Id, name: 'Majestic Kempegowda Bus Station', city: 'Bengaluru', latitude: 12.9767, longitude: 77.5713, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-702', route_id: route7Id, name: 'Electronic City Toll Gate', city: 'Bengaluru', latitude: 12.8399, longitude: 77.677, stop_order: 2, distance_from_start_km: 22, estimated_time_from_start_minutes: 35, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-703', route_id: route7Id, name: 'Hosur Bus Stand', city: 'Hosur', latitude: 12.7409, longitude: 77.8253, stop_order: 3, distance_from_start_km: 42, estimated_time_from_start_minutes: 55, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-704', route_id: route7Id, name: 'Salem New Bus Stand', city: 'Salem', latitude: 11.6643, longitude: 78.146, stop_order: 4, distance_from_start_km: 200, estimated_time_from_start_minutes: 210, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-705', route_id: route7Id, name: 'Erode Central Bus Stand', city: 'Erode', latitude: 11.341, longitude: 77.7172, stop_order: 5, distance_from_start_km: 265, estimated_time_from_start_minutes: 275, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-706', route_id: route7Id, name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, stop_order: 6, distance_from_start_km: 365, estimated_time_from_start_minutes: 360, is_boarding_point: false, is_dropping_point: true },

  // Route 10: Coimbatore ➔ Kochi
  { id: 'stop-1001', route_id: route10Id, name: 'Coimbatore Ukkadam Bus Stand', city: 'Coimbatore', latitude: 10.9904, longitude: 76.9601, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-1002', route_id: route10Id, name: 'Palakkad KSRTC Bus Stand', city: 'Palakkad', latitude: 10.7867, longitude: 76.6548, stop_order: 2, distance_from_start_km: 55, estimated_time_from_start_minutes: 65, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-1003', route_id: route10Id, name: 'Thrissur KSRTC Terminal', city: 'Thrissur', latitude: 10.5276, longitude: 76.2144, stop_order: 3, distance_from_start_km: 125, estimated_time_from_start_minutes: 155, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-1004', route_id: route10Id, name: 'Vytilla Mobility Hub', city: 'Kochi', latitude: 9.9676, longitude: 76.3197, stop_order: 4, distance_from_start_km: 190, estimated_time_from_start_minutes: 240, is_boarding_point: false, is_dropping_point: true },

  // Route 2: Tenkasi ➔ Coimbatore (All 16 stops return direction)
  { id: 'stop-201', route_id: route2Id, name: 'Tenkasi New Bus Stand', city: 'Tenkasi', latitude: 8.9604, longitude: 77.3152, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-202', route_id: route2Id, name: 'Kadayanallur Bypass', city: 'Kadayanallur', latitude: 9.0733, longitude: 77.3423, stop_order: 2, distance_from_start_km: 20, estimated_time_from_start_minutes: 30, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-203', route_id: route2Id, name: 'Puliyangudi Main Road', city: 'Puliyangudi', latitude: 9.1764, longitude: 77.3965, stop_order: 3, distance_from_start_km: 35, estimated_time_from_start_minutes: 55, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-204', route_id: route2Id, name: 'Sivagiri Bus Stop', city: 'Sivagiri', latitude: 9.3402, longitude: 77.4302, stop_order: 4, distance_from_start_km: 50, estimated_time_from_start_minutes: 75, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-205', route_id: route2Id, name: 'Vasudevanallur Bypass', city: 'Vasudevanallur', latitude: 9.2335, longitude: 77.4162, stop_order: 5, distance_from_start_km: 60, estimated_time_from_start_minutes: 90, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-206', route_id: route2Id, name: 'Rajapalayam Old Bus Stand', city: 'Rajapalayam', latitude: 9.4534, longitude: 77.5565, stop_order: 6, distance_from_start_km: 80, estimated_time_from_start_minutes: 115, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-207', route_id: route2Id, name: 'Srivilliputhur Bus Stand', city: 'Srivilliputhur', latitude: 9.5125, longitude: 77.6348, stop_order: 7, distance_from_start_km: 100, estimated_time_from_start_minutes: 140, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-208', route_id: route2Id, name: 'Thirumangalam Toll Gate', city: 'Thirumangalam', latitude: 9.8242, longitude: 77.9866, stop_order: 8, distance_from_start_km: 140, estimated_time_from_start_minutes: 185, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-209', route_id: route2Id, name: 'Ottanchathiram Bus Stand', city: 'Ottanchathiram', latitude: 10.4851, longitude: 77.7554, stop_order: 9, distance_from_start_km: 195, estimated_time_from_start_minutes: 245, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-210', route_id: route2Id, name: 'Palani Bus Stand', city: 'Palani', latitude: 10.4505, longitude: 77.5164, stop_order: 10, distance_from_start_km: 225, estimated_time_from_start_minutes: 280, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-211', route_id: route2Id, name: 'Udumalapettai Central Bus Stand', city: 'Udumalapettai', latitude: 10.5872, longitude: 77.2476, stop_order: 11, distance_from_start_km: 263, estimated_time_from_start_minutes: 330, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-212', route_id: route2Id, name: 'Pollachi Old Bus Stand', city: 'Pollachi', latitude: 10.6609, longitude: 77.0082, stop_order: 12, distance_from_start_km: 303, estimated_time_from_start_minutes: 370, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-213', route_id: route2Id, name: 'Ukkadam Bus Stand', city: 'Coimbatore', latitude: 10.9904, longitude: 76.9601, stop_order: 13, distance_from_start_km: 330, estimated_time_from_start_minutes: 400, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-214', route_id: route2Id, name: 'Singanallur', city: 'Coimbatore', latitude: 10.995, longitude: 77.0002, stop_order: 14, distance_from_start_km: 336, estimated_time_from_start_minutes: 415, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-215', route_id: route2Id, name: 'Gandhipuram', city: 'Coimbatore', latitude: 11.0183, longitude: 76.9725, stop_order: 15, distance_from_start_km: 341, estimated_time_from_start_minutes: 425, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-216', route_id: route2Id, name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, stop_order: 16, distance_from_start_km: 345, estimated_time_from_start_minutes: 440, is_boarding_point: false, is_dropping_point: true },

  // Route 4: Coimbatore ➔ Chennai
  { id: 'stop-401', route_id: route4Id, name: 'Coimbatore Gandhipuram Bus Stand', city: 'Coimbatore', latitude: 11.0183, longitude: 76.9725, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-402', route_id: route4Id, name: 'Avinashi Bypass', city: 'Avinashi', latitude: 11.1925, longitude: 77.2694, stop_order: 2, distance_from_start_km: 40, estimated_time_from_start_minutes: 50, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-403', route_id: route4Id, name: 'Salem New Bus Stand', city: 'Salem', latitude: 11.6643, longitude: 78.146, stop_order: 3, distance_from_start_km: 165, estimated_time_from_start_minutes: 180, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-404', route_id: route4Id, name: 'Tambaram MEPZ Terminal', city: 'Chennai', latitude: 12.9249, longitude: 80.1345, stop_order: 4, distance_from_start_km: 482, estimated_time_from_start_minutes: 465, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-405', route_id: route4Id, name: 'Guindy Kathipara Junction', city: 'Chennai', latitude: 13.0067, longitude: 80.2025, stop_order: 5, distance_from_start_km: 498, estimated_time_from_start_minutes: 485, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-406', route_id: route4Id, name: 'Koyambedu Omni Bus Stand (CMBT)', city: 'Chennai', latitude: 13.0694, longitude: 80.1948, stop_order: 6, distance_from_start_km: 510, estimated_time_from_start_minutes: 510, is_boarding_point: false, is_dropping_point: true },

  // Route 6: Madurai ➔ Bengaluru
  { id: 'stop-601', route_id: route6Id, name: 'Mattuthavani Integrated Bus Stand (MIBT)', city: 'Madurai', latitude: 9.9463, longitude: 78.1565, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-602', route_id: route6Id, name: 'Dindigul Bypass', city: 'Dindigul', latitude: 10.3673, longitude: 77.9803, stop_order: 2, distance_from_start_km: 65, estimated_time_from_start_minutes: 60, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-603', route_id: route6Id, name: 'Salem New Bus Stand', city: 'Salem', latitude: 11.6643, longitude: 78.146, stop_order: 3, distance_from_start_km: 240, estimated_time_from_start_minutes: 210, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-604', route_id: route6Id, name: 'Electronic City Toll Gate', city: 'Bengaluru', latitude: 12.8399, longitude: 77.677, stop_order: 4, distance_from_start_km: 418, estimated_time_from_start_minutes: 385, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-605', route_id: route6Id, name: 'Majestic Kempegowda Bus Station', city: 'Bengaluru', latitude: 12.9767, longitude: 77.5713, stop_order: 5, distance_from_start_km: 440, estimated_time_from_start_minutes: 420, is_boarding_point: false, is_dropping_point: true },

  // Route 8: Coimbatore ➔ Bengaluru
  { id: 'stop-801', route_id: route8Id, name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-802', route_id: route8Id, name: 'Erode Central Bus Stand', city: 'Erode', latitude: 11.341, longitude: 77.7172, stop_order: 2, distance_from_start_km: 100, estimated_time_from_start_minutes: 85, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-803', route_id: route8Id, name: 'Salem New Bus Stand', city: 'Salem', latitude: 11.6643, longitude: 78.146, stop_order: 3, distance_from_start_km: 165, estimated_time_from_start_minutes: 150, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-804', route_id: route8Id, name: 'Hosur Bus Stand', city: 'Hosur', latitude: 12.7409, longitude: 77.8253, stop_order: 4, distance_from_start_km: 323, estimated_time_from_start_minutes: 305, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-805', route_id: route8Id, name: 'Electronic City Toll Gate', city: 'Bengaluru', latitude: 12.8399, longitude: 77.677, stop_order: 5, distance_from_start_km: 343, estimated_time_from_start_minutes: 325, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-806', route_id: route8Id, name: 'Majestic Kempegowda Bus Station', city: 'Bengaluru', latitude: 12.9767, longitude: 77.5713, stop_order: 6, distance_from_start_km: 365, estimated_time_from_start_minutes: 360, is_boarding_point: false, is_dropping_point: true },

  // Route 9: Chennai ➔ Madurai
  { id: 'stop-901', route_id: route9Id, name: 'Koyambedu Omni Bus Stand (CMBT)', city: 'Chennai', latitude: 13.0694, longitude: 80.1948, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-902', route_id: route9Id, name: 'Tambaram MEPZ Terminal', city: 'Chennai', latitude: 12.9249, longitude: 80.1345, stop_order: 2, distance_from_start_km: 28, estimated_time_from_start_minutes: 45, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-903', route_id: route9Id, name: 'Villupuram Old Bus Stand', city: 'Villupuram', latitude: 11.9401, longitude: 79.4861, stop_order: 3, distance_from_start_km: 160, estimated_time_from_start_minutes: 160, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-904', route_id: route9Id, name: 'Trichy Central Bus Stand', city: 'Trichy', latitude: 10.7905, longitude: 78.7047, stop_order: 4, distance_from_start_km: 320, estimated_time_from_start_minutes: 310, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-905', route_id: route9Id, name: 'Mattuthavani Integrated Bus Stand (MIBT)', city: 'Madurai', latitude: 9.9463, longitude: 78.1565, stop_order: 5, distance_from_start_km: 460, estimated_time_from_start_minutes: 450, is_boarding_point: false, is_dropping_point: true },

  // Route 11: Bengaluru ➔ Tirunelveli
  { id: 'stop-1101', route_id: route11Id, name: 'Majestic Kempegowda Bus Station', city: 'Bengaluru', latitude: 12.9767, longitude: 77.5713, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-1102', route_id: route11Id, name: 'Electronic City Toll Gate', city: 'Bengaluru', latitude: 12.8399, longitude: 77.677, stop_order: 2, distance_from_start_km: 22, estimated_time_from_start_minutes: 35, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-1103', route_id: route11Id, name: 'Salem New Bus Stand', city: 'Salem', latitude: 11.6643, longitude: 78.146, stop_order: 3, distance_from_start_km: 200, estimated_time_from_start_minutes: 210, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-1104', route_id: route11Id, name: 'Madurai Mattuthavani', city: 'Madurai', latitude: 9.9463, longitude: 78.1565, stop_order: 4, distance_from_start_km: 440, estimated_time_from_start_minutes: 420, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-1105', route_id: route11Id, name: 'Tirunelveli New Bus Stand', city: 'Tirunelveli', latitude: 8.7139, longitude: 77.7567, stop_order: 5, distance_from_start_km: 580, estimated_time_from_start_minutes: 540, is_boarding_point: false, is_dropping_point: true },

  // Route 12: Chennai ➔ Trichy
  { id: 'stop-1201', route_id: route12Id, name: 'Koyambedu Omni Bus Stand (CMBT)', city: 'Chennai', latitude: 13.0694, longitude: 80.1948, stop_order: 1, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-1202', route_id: route12Id, name: 'Tambaram MEPZ Terminal', city: 'Chennai', latitude: 12.9249, longitude: 80.1345, stop_order: 2, distance_from_start_km: 28, estimated_time_from_start_minutes: 45, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-1203', route_id: route12Id, name: 'Villupuram Old Bus Stand', city: 'Villupuram', latitude: 11.9401, longitude: 79.4861, stop_order: 3, distance_from_start_km: 160, estimated_time_from_start_minutes: 160, is_boarding_point: true, is_dropping_point: true },
];

// Append intermediate stops from all candidate routes in catalogue with verified geographical coordinates
ALL_CATALOGUE_ROUTES.forEach((cr) => {
  if (Array.isArray(cr.intermediateStops) && cr.intermediateStops.length > 0) {
    cr.intermediateStops.forEach((st) => {
      const geo = getVerifiedStopCoordinates(st.name, st.city, cr.sourceState);
      routeStops.push({
        id: `stop-${cr.id}-${st.order}`,
        route_id: cr.id,
        name: st.name,
        city: st.city,
        latitude: geo.latitude,
        longitude: geo.longitude,
        stop_order: st.order,
        distance_from_start_km: Math.round((st.minsFromOrigin / (cr.durationMins || 1)) * (cr.distanceKm || 100)),
        estimated_time_from_start_minutes: st.minsFromOrigin,
        is_boarding_point: Boolean(st.isBoarding),
        is_dropping_point: Boolean(st.isDropping),
        state: geo.state || cr.sourceState || 'Tamil Nadu',
        is_major_hub: st.order === 1 || st.order === cr.intermediateStops.length,
        is_verified: true,
        geo_source: geo.matchType,
      });
    });
  }
});

// ======================== 7. ACTIVE MULTI-OPERATOR COMMERCIAL TRIPS ========================
export const trips = [];
const today = new Date();

for (let i = 0; i < 7; i++) {
  const d = new Date(today);
  d.setDate(d.getDate() + i);
  const dateStr = d.toISOString().split('T')[0];

  // 1. SMART ROUTE Pioneer Express — Coimbatore ➔ Tenkasi (Tata Capella 48, ac_seat_cum_sleeper)
  trips.push({
    id: `trp-sr-cbe-${100 + i}`,
    travel_id: smartRouteTravelId,
    bus_id: 'bus-sr-001',
    route_id: route1Id,
    driver_id: driver1Id,
    trip_number: `SR-CBETKS-01-${100 + i}`,
    departure_date: dateStr,
    departure_time: '21:15',
    estimated_arrival_time: '05:15',
    status: 'published',
    total_booked_seats: 8,
    total_available_seats: 40,
    base_fare: 880,
    fare_chart: { seater: 550, sleeper: 880 },
    has_live_tracking: true,
    has_radar_gps: true,
    features: ['Live Radar GPS', 'UV Sterilized AC', 'Type-C Fast Charging', 'Emergency SOS'],
    verification_status: 'VERIFIED',
    is_seed: true,
    is_sample: false,
    data_source: 'smartroute_verified_inventory',
  });

  // 2. VEE VEE Capella Executive — Coimbatore ➔ Tenkasi (#VV-CBETKS-100, Tata Capella 48-seat)
  trips.push({
    id: `trp-vv-tks-${100 + i}`,
    travel_id: veeVeeTravelId,
    bus_id: 'bus-cbe-tks-vv-02',
    route_id: route1Id,
    driver_id: driver2Id,
    trip_number: `VV-CBETKS-100-${100 + i}`,
    departure_date: dateStr,
    departure_time: '22:30',
    estimated_arrival_time: '06:30',
    status: 'published',
    total_booked_seats: 10,
    total_available_seats: 38,
    base_fare: 750,
    fare_chart: { seater: 750, sleeper: 880 },
    has_live_tracking: true,
    features: ['Live Tracking', 'Individual USB Ports', 'Reading Lamps'],
    verification_status: 'VERIFIED',
    is_seed: true,
    is_sample: false,
    data_source: 'smartroute_verified_inventory',
  });

  // 3. TRANZKING Super Glider — Coimbatore ➔ Tenkasi (BharatBenz AC Sleeper Rear Washroom, 30 Berths)
  trips.push({
    id: `trp-tk-tks-${100 + i}`,
    travel_id: tranzKingTravelId,
    bus_id: 'bus-cbe-tks-tk-03',
    route_id: route1Id,
    driver_id: driver3Id,
    trip_number: `TK-CBETKS-200-${100 + i}`,
    departure_date: dateStr,
    departure_time: '21:45',
    estimated_arrival_time: '05:45',
    status: 'published',
    total_booked_seats: 6,
    total_available_seats: 24,
    base_fare: 890,
    fare_chart: { lower_berth: 890, upper_berth: 990 },
    has_live_tracking: true,
    features: ['Rear Bio-Toilet', 'Panoramic Sleeper', 'Free Bottled Water'],
    verification_status: 'VERIFIED',
    is_seed: true,
    is_sample: false,
    data_source: 'smartroute_verified_inventory',
  });

  // 4. City Express Dayliner — Coimbatore ➔ Tenkasi (Ashok Leyland 2+2 AC Pushback Seater, 40 Seats)
  trips.push({
    id: `trp-ct-tks-${100 + i}`,
    travel_id: cityTravelId,
    bus_id: 'bus-cbe-tks-ct-04',
    route_id: route1Id,
    driver_id: driver1Id,
    trip_number: `CT-CBETKS-300-${100 + i}`,
    departure_date: dateStr,
    departure_time: '07:30',
    estimated_arrival_time: '15:30',
    status: 'published',
    total_booked_seats: 12,
    total_available_seats: 28,
    base_fare: 580,
    fare_chart: { base: 580 },
    has_live_tracking: true,
    features: ['Pushback Seats', 'Individual AC Vents', 'Charging Ports'],
    verification_status: 'VERIFIED',
    is_seed: true,
    is_sample: false,
    data_source: 'smartroute_verified_inventory',
  });

  // 5. YBM Night Rider — Coimbatore ➔ Tenkasi (Volvo B11R Luxury Sleeper Front Washroom, 30 Berths)
  trips.push({
    id: `trp-yb-tks-${100 + i}`,
    travel_id: ybmTravelId,
    bus_id: 'bus-cbe-tks-yb-05',
    route_id: route1Id,
    driver_id: driver2Id,
    trip_number: `YB-CBETKS-400-${100 + i}`,
    departure_date: dateStr,
    departure_time: '23:15',
    estimated_arrival_time: '07:15',
    status: 'published',
    total_booked_seats: 8,
    total_available_seats: 22,
    base_fare: 980,
    fare_chart: { lower_berth: 980, upper_berth: 1080 },
    has_live_tracking: true,
    features: ['Front Bio-Toilet', 'Memory Foam Mattresses', 'UV Cabin Sterilization'],
    verification_status: 'VERIFIED',
    is_seed: true,
    is_sample: false,
    data_source: 'smartroute_verified_inventory',
  });

  // 4. SMART ROUTE Travels — Tenkasi ➔ Coimbatore (Return Night Liner)
  trips.push({
    id: `trp-sr-tks-${100 + i}`,
    travel_id: smartRouteTravelId,
    bus_id: buses[1].id,
    route_id: route2Id,
    driver_id: driver1Id,
    trip_number: `SR-TKS-${100 + i}`,
    departure_date: dateStr,
    departure_time: '21:00',
    estimated_arrival_time: '05:00',
    status: 'published',
    total_booked_seats: 11,
    total_available_seats: 37,
    base_fare: 880,
  });

  // 5. VEE VEE Travels — Tenkasi ➔ Coimbatore (Return Comfort)
  trips.push({
    id: `trp-vv-cbe-${100 + i}`,
    travel_id: veeVeeTravelId,
    bus_id: buses[4].id,
    route_id: route2Id,
    driver_id: driver2Id,
    trip_number: `VV-TKS-${100 + i}`,
    departure_date: dateStr,
    departure_time: '22:15',
    estimated_arrival_time: '06:15',
    status: 'published',
    total_booked_seats: 9,
    total_available_seats: 39,
    base_fare: 850,
  });

  // 6. TRANZKING Travels — Chennai ➔ Coimbatore (Executive Non-Stop)
  trips.push({
    id: `trp-tz-che-${200 + i}`,
    travel_id: tranzKingTravelId,
    bus_id: buses[6].id,
    route_id: route3Id,
    driver_id: driver3Id,
    trip_number: `TZ-CHE-${200 + i}`,
    departure_date: dateStr,
    departure_time: '21:30',
    estimated_arrival_time: '06:00',
    status: 'published',
    total_booked_seats: 14,
    total_available_seats: 34,
    base_fare: 980,
  });

  // 7. SMART ROUTE Travels — Chennai ➔ Coimbatore (Prime Sleeper)
  trips.push({
    id: `trp-sr-che-${200 + i}`,
    travel_id: smartRouteTravelId,
    bus_id: buses[2].id,
    route_id: route3Id,
    driver_id: driver1Id,
    trip_number: `SR-CHE-${200 + i}`,
    departure_date: dateStr,
    departure_time: '22:15',
    estimated_arrival_time: '06:45',
    status: 'published',
    total_booked_seats: 16,
    total_available_seats: 32,
    base_fare: 1050,
  });

  // 8. TRANZKING Travels — Coimbatore ➔ Chennai (Return Highway Sleeper)
  trips.push({
    id: `trp-tz-cbe-che-${200 + i}`,
    travel_id: tranzKingTravelId,
    bus_id: buses[7].id,
    route_id: route4Id,
    driver_id: driver3Id,
    trip_number: `TZ-CBE-${200 + i}`,
    departure_date: dateStr,
    departure_time: '21:00',
    estimated_arrival_time: '05:30',
    status: 'published',
    total_booked_seats: 15,
    total_available_seats: 33,
    base_fare: 980,
  });

  // 9. VEE VEE Travels — Bengaluru ➔ Madurai (Overnight Liner)
  trips.push({
    id: `trp-vv-blr-${300 + i}`,
    travel_id: veeVeeTravelId,
    bus_id: buses[4].id,
    route_id: route5Id,
    driver_id: driver2Id,
    trip_number: `VV-BLR-${300 + i}`,
    departure_date: dateStr,
    departure_time: '22:00',
    estimated_arrival_time: '05:00',
    status: 'published',
    total_booked_seats: 18,
    total_available_seats: 30,
    base_fare: 1150,
  });

  // 10. TRANZKING Travels — Bengaluru ➔ Madurai (Velocity HD)
  trips.push({
    id: `trp-tz-blr-${300 + i}`,
    travel_id: tranzKingTravelId,
    bus_id: buses[8].id,
    route_id: route5Id,
    driver_id: driver3Id,
    trip_number: `TZ-BLR-${300 + i}`,
    departure_date: dateStr,
    departure_time: '23:00',
    estimated_arrival_time: '06:00',
    status: 'published',
    total_booked_seats: 20,
    total_available_seats: 28,
    base_fare: 890,
  });

  // 11. VEE VEE Travels — Madurai ➔ Bengaluru (Return Overnight Express)
  trips.push({
    id: `trp-vv-mdu-${300 + i}`,
    travel_id: veeVeeTravelId,
    bus_id: buses[5].id,
    route_id: route6Id,
    driver_id: driver2Id,
    trip_number: `VV-MDU-${300 + i}`,
    departure_date: dateStr,
    departure_time: '21:45',
    estimated_arrival_time: '04:45',
    status: 'published',
    total_booked_seats: 14,
    total_available_seats: 34,
    base_fare: 1100,
  });

  // 12. SMART ROUTE Travels — Bengaluru ➔ Coimbatore (Silicon Liner)
  trips.push({
    id: `trp-sr-blr-${400 + i}`,
    travel_id: smartRouteTravelId,
    bus_id: buses[2].id,
    route_id: route7Id,
    driver_id: driver1Id,
    trip_number: `SR-BLR-${400 + i}`,
    departure_date: dateStr,
    departure_time: '22:45',
    estimated_arrival_time: '04:45',
    status: 'published',
    total_booked_seats: 15,
    total_available_seats: 33,
    base_fare: 950,
  });

  // 13. SMART ROUTE Travels — Coimbatore ➔ Bengaluru (Return Tech Corridor)
  trips.push({
    id: `trp-sr-cbe-blr-${400 + i}`,
    travel_id: smartRouteTravelId,
    bus_id: buses[0].id,
    route_id: route8Id,
    driver_id: driver1Id,
    trip_number: `SR-CBE-BLR-${400 + i}`,
    departure_date: dateStr,
    departure_time: '23:00',
    estimated_arrival_time: '05:00',
    status: 'published',
    total_booked_seats: 12,
    total_available_seats: 36,
    base_fare: 950,
  });

  // 14. TRANZKING Travels — Chennai ➔ Madurai (Temple Express)
  trips.push({
    id: `trp-tz-che-mdu-${500 + i}`,
    travel_id: tranzKingTravelId,
    bus_id: buses[6].id,
    route_id: route9Id,
    driver_id: driver3Id,
    trip_number: `TZ-MDU-${500 + i}`,
    departure_date: dateStr,
    departure_time: '22:00',
    estimated_arrival_time: '05:30',
    status: 'published',
    total_booked_seats: 17,
    total_available_seats: 31,
    base_fare: 890,
  });

  // 15. SMART ROUTE Travels — Coimbatore ➔ Kochi (Day Express)
  trips.push({
    id: `trp-sr-koc-${600 + i}`,
    travel_id: smartRouteTravelId,
    bus_id: buses[0].id,
    route_id: route10Id,
    driver_id: driver1Id,
    trip_number: `SR-KOC-${600 + i}`,
    departure_date: dateStr,
    departure_time: '06:30',
    estimated_arrival_time: '10:30',
    status: 'published',
    total_booked_seats: 8,
    total_available_seats: 40,
    base_fare: 450,
  });

  // 16. VEE VEE Travels — Bengaluru ➔ Tirunelveli (Southern Star)
  trips.push({
    id: `trp-vv-tnv-${700 + i}`,
    travel_id: veeVeeTravelId,
    bus_id: buses[3].id,
    route_id: route11Id,
    driver_id: driver2Id,
    trip_number: `VV-TNV-${700 + i}`,
    departure_date: dateStr,
    departure_time: '21:00',
    estimated_arrival_time: '06:00',
    status: 'published',
    total_booked_seats: 16,
    total_available_seats: 32,
    base_fare: 1250,
  });

  // 17. Rathimeena Travels — Chennai ➔ Trichy (Heritage Express)
  trips.push({
    id: `trp-rm-trz-${800 + i}`,
    travel_id: rathimeenaTravelId,
    bus_id: buses[10].id,
    route_id: route12Id,
    driver_id: driver1Id,
    trip_number: `RM-TRZ-${800 + i}`,
    departure_date: dateStr,
    departure_time: '22:30',
    estimated_arrival_time: '04:30',
    status: 'published',
    total_booked_seats: 10,
    total_available_seats: 38,
    base_fare: 650,
  });

  // 18+. Active Catalogue Route Trips (Coimbatore-origin, Bengaluru-origin, and reverse corridors)
  ALL_CATALOGUE_ROUTES.filter((cr) => cr.hasActiveService).forEach((cr, crIdx) => {
    const isHosur = cr.destination.toLowerCase() === 'hosur' || cr.source.toLowerCase() === 'hosur';
    const isKochi = cr.destination.toLowerCase().includes('kochi') || cr.destination.toLowerCase().includes('ernakulam');

    let depTime = '21:30';
    if (isHosur) {
      depTime = '07:00';
    } else if (isKochi) {
      depTime = crIdx % 2 === 0 ? '06:30' : '22:15';
    } else {
      const times = ['21:00', '21:45', '22:15', '22:45', '23:15'];
      depTime = times[crIdx % times.length];
    }

    const [dh, dm] = depTime.split(':').map(Number);
    const totalArrMins = dh * 60 + dm + (cr.durationMins || 360);
    const arrH = Math.floor((totalArrMins / 60) % 24);
    const arrM = Math.floor(totalArrMins % 60);
    const arrTime = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;

    let opId = smartRouteTravelId;
    let busItem = buses[0];
    let driverId = driver1Id;

    if (isHosur) {
      opId = horizonTravelId;
      busItem = crIdx % 2 === 0
        ? (buses.find((b) => b.id === 'bus-horizon-003') || buses[0])
        : (buses.find((b) => b.id === 'bus-horizon-002') || buses[0]);
      driverId = driver1Id;
    } else if (cr.destination.toLowerCase().includes('tenkasi')) {
      opId = crIdx % 2 === 0 ? smartRouteTravelId : veeVeeTravelId;
      busItem = opId === smartRouteTravelId ? buses[0] : (buses[5] || buses[0]);
      driverId = opId === smartRouteTravelId ? driver1Id : driver2Id;
    } else if (cr.region === 'Kerala') {
      opId = crIdx % 2 === 0 ? kpnTravelId : smartRouteTravelId;
      busItem = opId === kpnTravelId
        ? (buses.find((b) => b.id === 'bus-kpn-002') || buses.find((b) => b.id === 'bus-kpn-001') || buses[0])
        : (buses.find((b) => b.id === 'bus-sr-volvo-001') || buses[4] || buses[0]);
      driverId = driver2Id;
    } else if (cr.region === 'North Express' || cr.region === 'Himalayan Corridor' || cr.region === 'NCR-Rajasthan' || cr.region === 'Uttarakhand Corridor' || cr.region === 'Awadh Express') {
      opId = crIdx % 2 === 0 ? 'trv-zingbus-010' : 'trv-intrcity-011';
      busItem = opId === 'trv-zingbus-010' ? (buses.find((b) => b.id === 'bus-zingbus-001') || buses[0]) : (buses.find((b) => b.id === 'bus-intrcity-001') || buses[0]);
      driverId = driver1Id;
    } else if (cr.region === 'Maharashtra') {
      opId = 'trv-purple-012';
      busItem = buses.find((b) => b.id === 'bus-purple-001') || buses[0];
      driverId = driver2Id;
    } else if (cr.region === 'West Coast' || cr.region === 'Western Express' || cr.region === 'Gujarat-Rajasthan') {
      opId = 'trv-vrl-007';
      busItem = buses.find((b) => b.id === 'bus-vrl-001') || buses[0];
      driverId = driver1Id;
    } else if (cr.region === 'Central India') {
      opId = 'trv-hans-013';
      busItem = buses.find((b) => b.id === 'bus-hans-001') || buses[0];
      driverId = driver3Id;
    } else if (cr.region === 'East India' || cr.region === 'East Coastal') {
      opId = 'trv-shyamoli-014';
      busItem = buses.find((b) => b.id === 'bus-shyamoli-001') || buses[0];
      driverId = driver2Id;
    } else if (cr.region === 'Telangana-Andhra') {
      opId = 'trv-orange-008';
      busItem = buses.find((b) => b.id === 'bus-orange-001') || buses[0];
      driverId = driver3Id;
    } else if (cr.region === 'Andhra Pradesh & Telangana') {
      opId = crIdx % 2 === 0 ? tranzKingTravelId : smartRouteTravelId;
      busItem = opId === tranzKingTravelId ? (buses.find((b) => b.id === 'bus-tz-002') || buses[8] || buses[0]) : (buses[4] || buses[0]);
      driverId = driver3Id;
    } else if (cr.region === 'Goa & Maharashtra') {
      opId = crIdx % 2 === 0 ? tranzKingTravelId : veeVeeTravelId;
      busItem = opId === tranzKingTravelId ? (buses.find((b) => b.id === 'bus-tz-003') || buses[8] || buses[0]) : (buses[6] || buses[0]);
      driverId = driver3Id;
    } else if (cr.destination.toLowerCase().includes('trichy') || cr.destination.toLowerCase().includes('thanjavur')) {
      opId = rathimeenaTravelId;
      busItem = crIdx % 2 === 0 ? (buses.find((b) => b.id === 'bus-rm-001') || buses[0]) : (buses.find((b) => b.id === 'bus-rm-002') || buses[0]);
      driverId = driver1Id;
    } else {
      const ops = [smartRouteTravelId, veeVeeTravelId, tranzKingTravelId, horizonTravelId, kpnTravelId, rathimeenaTravelId];
      opId = ops[crIdx % ops.length];
      const typeCycle = crIdx % 5;
      if (typeCycle === 0) {
        busItem = buses.find((b) => b.id === 'bus-sr-volvo-001') || buses[4] || buses[0]; // ac_sleeper (Volvo)
      } else if (typeCycle === 1) {
        busItem = buses.find((b) => b.id === 'bus-vv-004') || buses.find((b) => b.id === 'bus-kpn-002') || buses[0]; // non_ac_sleeper
      } else if (typeCycle === 2) {
        busItem = buses.find((b) => b.id === 'bus-sr-seater-001') || buses.find((b) => b.id === 'bus-tz-002') || buses[8] || buses[0]; // ac_seater
      } else if (typeCycle === 3) {
        busItem = buses.find((b) => b.id === 'bus-horizon-003') || buses.find((b) => b.id === 'bus-rm-002') || buses[0]; // non_ac_seater
      } else {
        busItem = buses[0]; // ac_seat_cum_sleeper (Capella)
      }
      driverId = [driver1Id, driver2Id, driver3Id][crIdx % 3];
    }

    const opPrefix =
      opId === smartRouteTravelId ? 'SR' :
      opId === veeVeeTravelId ? 'VV' :
      opId === tranzKingTravelId ? 'TZ' :
      opId === horizonTravelId ? 'HZ' :
      opId === rathimeenaTravelId ? 'RM' :
      opId === 'trv-vrl-007' ? 'VRL' :
      opId === 'trv-orange-008' ? 'ORG' :
      opId === 'trv-kallada-009' ? 'KAL' :
      opId === 'trv-zingbus-010' ? 'ZB' :
      opId === 'trv-intrcity-011' ? 'IC' :
      opId === 'trv-purple-012' ? 'PP' :
      opId === 'trv-hans-013' ? 'HT' :
      opId === 'trv-shyamoli-014' ? 'SP' : 'KPN';

    const baseFare = isHosur ? 180 : Math.max(450, Math.round((cr.distanceKm || 300) * 1.85));

    trips.push({
      id: `trp-${cr.id}-${dateStr}`,
      travel_id: opId,
      bus_id: busItem.id,
      route_id: cr.id,
      driver_id: driverId,
      trip_number: `${opPrefix}-${cr.code.replace(/[^A-Z0-9]/g, '')}-${100 + i}`,
      departure_date: dateStr,
      departure_time: depTime,
      estimated_arrival_time: arrTime,
      status: 'published',
      total_booked_seats: 12,
      total_available_seats: (busItem.total_seats + busItem.total_sleepers) - 12,
      base_fare: baseFare,
      verification_status: 'VERIFIED',
      is_seed: true,
      is_sample: false,
      data_source: 'smartroute_verified_inventory',
    });
  });

  // 18b+. Candidate Routes (Commercial Partner Evaluation / Sample Services - clearly segregated from live bookable inventory)
  ALL_CATALOGUE_ROUTES.filter((cr) => !cr.hasActiveService).forEach((cr, crIdx) => {
    const depTime = '20:30';
    const duration = cr.durationMins || Math.round((cr.distanceKm || 800) * 1.5);
    const [dh, dm] = depTime.split(':').map(Number);
    const totalArrMins = dh * 60 + dm + duration;
    const arrH = Math.floor((totalArrMins / 60) % 24);
    const arrM = Math.floor(totalArrMins % 60);
    const arrTime = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;
    const baseFare = Math.max(750, Math.round((cr.distanceKm || 600) * 1.75));

    // Choose sample fleet bus for candidate evaluation
    const sampleBus = crIdx % 2 === 0
      ? (buses.find((b) => b.id === 'bus-sr-003') || buses[4])
      : (buses.find((b) => b.id === 'bus-sr-seater-001') || buses[8]);

    trips.push({
      id: `trp-sample-${cr.id}-${dateStr}`,
      travel_id: smartRouteTravelId,
      travel_name: 'SMART ROUTE (Sample Service)',
      bus_id: sampleBus.id,
      bus_name: `${cr.source} - ${cr.destination} Candidate Express (Sample)`,
      bus_type: sampleBus.bus_type,
      route_id: cr.id,
      driver_id: driver1Id,
      trip_number: `SAMPLE-${cr.code.replace(/[^A-Z0-9]/g, '')}-${100 + i}`,
      departure_date: dateStr,
      departure_time: depTime,
      estimated_arrival_time: arrTime,
      duration_minutes: duration,
      status: 'sample',
      total_booked_seats: 0,
      total_available_seats: 0,
      total_blocked_seats: 0,
      base_fare: baseFare,
      fare_chart: { base: baseFare },
      verification_status: 'SAMPLE_DATA',
      is_sample: true,
      is_seed: true,
      data_source: 'smartroute_sample_presentation_v1',
      operating_days: ['Fri', 'Sat', 'Sun'],
      note: 'SAMPLE DATA: Candidate corridor under commercial partner evaluation. Not bookable live.',
    });
  });

  // ======================== COIMBATORE ➔ KARAIKUDI ACTIVE FLEET (3 OFFICIAL BUSES) ========================
  // Bus 1: SMART ROUTE Royal Sleeper (Volvo 9600, 2+1 AC Sleeper, 36 berths)
  trips.push({
    id: `trp-cbe-kkdi-royal-${100 + i}`,
    travel_id: smartRouteTravelId,
    bus_id: busRoyalSleeperId,
    route_id: routeKkdiId,
    driver_id: driver1Id,
    trip_number: `SR-KKDI-01-${100 + i}`,
    departure_date: dateStr,
    departure_time: '22:30', // 10:30 PM
    estimated_arrival_time: '04:45', // 04:45 AM
    duration_minutes: 375,
    estimated_duration_minutes: 375,
    status: 'published',
    total_booked_seats: 4,
    total_available_seats: 32,
    base_fare: 850,
    fare_chart: { lower_berth: 850, upper_berth: 950 },
    has_live_tracking: true,
    has_radar_gps: true,
    features: ['Live Radar GPS', 'UV AC', 'USB-C Charging', 'Blanket'],
    verification_status: 'VERIFIED',
    is_seed: true,
    is_sample: false,
    data_source: 'smartroute_verified_inventory',
  });

  // Bus 2: SMART ROUTE Executive Seater/Sleeper (Tata Capella, 2+1 Sleeper/Seater, 48 layout)
  trips.push({
    id: `trp-cbe-kkdi-exec-${100 + i}`,
    travel_id: smartRouteTravelId,
    bus_id: busExecSeaterSleeperId,
    route_id: routeKkdiId,
    driver_id: driver2Id,
    trip_number: `SR-KKDI-02-${100 + i}`,
    departure_date: dateStr,
    departure_time: '14:00', // 02:00 PM
    estimated_arrival_time: '20:30', // 08:30 PM
    duration_minutes: 390,
    estimated_duration_minutes: 390,
    status: 'published',
    total_booked_seats: 6,
    total_available_seats: 42,
    base_fare: 550,
    fare_chart: { seater: 550, sleeper: 750 },
    has_live_tracking: true,
    features: ['Pushback Seater', 'Charging Port', 'Reading Light'],
    verification_status: 'VERIFIED',
    is_seed: true,
    is_sample: false,
    data_source: 'smartroute_verified_inventory',
  });

  // Bus 3: SMART ROUTE Night Glider (BharatBenz AC Sleeper, 36 berths)
  trips.push({
    id: `trp-cbe-kkdi-night-${100 + i}`,
    travel_id: smartRouteTravelId,
    bus_id: busNightGliderId,
    route_id: routeKkdiId,
    driver_id: driver3Id,
    trip_number: `SR-KKDI-03-${100 + i}`,
    departure_date: dateStr,
    departure_time: '23:15', // 11:15 PM
    estimated_arrival_time: '05:30', // 05:30 AM
    duration_minutes: 375,
    estimated_duration_minutes: 375,
    status: 'published',
    total_booked_seats: 8,
    total_available_seats: 28,
    base_fare: 820,
    fare_chart: { lower_berth: 820, upper_berth: 920 },
    has_live_tracking: true,
    features: ['Live Tracking', 'Climate Controlled AC'],
    verification_status: 'VERIFIED',
    is_seed: true,
    is_sample: false,
    data_source: 'smartroute_verified_inventory',
  });
}

// ======================== 7B. OPERATOR-DIFFERENTIATED SERVICE STOPS ========================
export const tripServiceStopsMap = new Map();

// 1. SMART ROUTE Pioneer Express — Coimbatore ➔ Tenkasi (16 verified stops via Palani / Rajapalayam)
const SMART_ROUTE_CBE_TKS_STOPS = [
  { id: 'stop-101', name: 'Coimbatore Omni Bus Stand', city: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-102', name: 'Gandhipuram Omni Bus Stand', city: 'Coimbatore', latitude: 11.0183, longitude: 76.9725, distance_from_start_km: 4, estimated_time_from_start_minutes: 15, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-103', name: 'Singanallur Bus Stand', city: 'Coimbatore', latitude: 10.9950, longitude: 77.0002, distance_from_start_km: 9, estimated_time_from_start_minutes: 25, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-104', name: 'Ukkadam Bus Stand', city: 'Coimbatore', latitude: 10.9904, longitude: 76.9601, distance_from_start_km: 15, estimated_time_from_start_minutes: 40, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-105', name: 'Pollachi Old Bus Stand', city: 'Pollachi', latitude: 10.6609, longitude: 77.0082, distance_from_start_km: 42, estimated_time_from_start_minutes: 70, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-106', name: 'Udumalapettai Central Bus Stand', city: 'Udumalapettai', latitude: 10.5872, longitude: 77.2476, distance_from_start_km: 82, estimated_time_from_start_minutes: 110, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-107', name: 'Palani Bus Stand', city: 'Palani', latitude: 10.4505, longitude: 77.5164, distance_from_start_km: 120, estimated_time_from_start_minutes: 160, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-108', name: 'Ottanchathiram Bus Stand', city: 'Ottanchathiram', latitude: 10.4851, longitude: 77.7554, distance_from_start_km: 150, estimated_time_from_start_minutes: 195, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-109', name: 'Thirumangalam Toll Gate', city: 'Thirumangalam', latitude: 9.8242, longitude: 77.9866, distance_from_start_km: 205, estimated_time_from_start_minutes: 255, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-110', name: 'Srivilliputhur Bus Stand', city: 'Srivilliputhur', latitude: 9.5125, longitude: 77.6348, distance_from_start_km: 245, estimated_time_from_start_minutes: 300, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-111', name: 'Rajapalayam Old Bus Stand', city: 'Rajapalayam', latitude: 9.4534, longitude: 77.5565, distance_from_start_km: 265, estimated_time_from_start_minutes: 325, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-112', name: 'Vasudevanallur Bypass', city: 'Vasudevanallur', latitude: 9.2335, longitude: 77.4162, distance_from_start_km: 285, estimated_time_from_start_minutes: 350, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-113', name: 'Sivagiri Bus Stop', city: 'Sivagiri', latitude: 9.3402, longitude: 77.4302, distance_from_start_km: 295, estimated_time_from_start_minutes: 365, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-114', name: 'Puliyangudi Main Road', city: 'Puliyangudi', latitude: 9.1764, longitude: 77.3965, distance_from_start_km: 310, estimated_time_from_start_minutes: 385, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-115', name: 'Kadayanallur Bypass', city: 'Kadayanallur', latitude: 9.0733, longitude: 77.3423, distance_from_start_km: 325, estimated_time_from_start_minutes: 410, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-116', name: 'Tenkasi New Bus Stand', city: 'Tenkasi', latitude: 8.9604, longitude: 77.3152, distance_from_start_km: 345, estimated_time_from_start_minutes: 440, is_boarding_point: false, is_dropping_point: true },
];

// 2. VEE VEE Capella Executive — Coimbatore ➔ Tenkasi (14 stops via Kangeyam and Sempatty)
const VEE_VEE_CBE_TKS_STOPS = [
  { id: 'stop-vv-01', name: 'Gandhipuram VEE VEE Office', city: 'Coimbatore', latitude: 11.0195, longitude: 76.9710, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-vv-02', name: 'Peelamedu Fun Republic Mall', city: 'Coimbatore', latitude: 11.0261, longitude: 77.0125, distance_from_start_km: 6, estimated_time_from_start_minutes: 20, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-vv-03', name: 'Singanallur Junction', city: 'Coimbatore', latitude: 10.9950, longitude: 77.0002, distance_from_start_km: 11, estimated_time_from_start_minutes: 35, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-vv-04', name: 'Palladam Highway Stop', city: 'Palladam', latitude: 10.9981, longitude: 77.2912, distance_from_start_km: 43, estimated_time_from_start_minutes: 70, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-vv-05', name: 'Kangeyam Bus Stand', city: 'Kangeyam', latitude: 11.0062, longitude: 77.5615, distance_from_start_km: 72, estimated_time_from_start_minutes: 105, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-vv-06', name: 'Dharapuram Bypass', city: 'Dharapuram', latitude: 10.7291, longitude: 77.5258, distance_from_start_km: 105, estimated_time_from_start_minutes: 145, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-vv-07', name: 'Oddanchatram Town Stand', city: 'Ottanchathiram', latitude: 10.4851, longitude: 77.7554, distance_from_start_km: 148, estimated_time_from_start_minutes: 195, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-vv-08', name: 'Sempatty Bypass', city: 'Sempatty', latitude: 10.2974, longitude: 77.8486, distance_from_start_km: 180, estimated_time_from_start_minutes: 235, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-vv-09', name: 'Thirumangalam Toll', city: 'Thirumangalam', latitude: 9.8242, longitude: 77.9866, distance_from_start_km: 220, estimated_time_from_start_minutes: 280, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-vv-10', name: 'Rajapalayam Bus Stand', city: 'Rajapalayam', latitude: 9.4534, longitude: 77.5565, distance_from_start_km: 275, estimated_time_from_start_minutes: 340, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-vv-11', name: 'Vasudevanallur Bypass', city: 'Vasudevanallur', latitude: 9.2335, longitude: 77.4162, distance_from_start_km: 298, estimated_time_from_start_minutes: 370, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-vv-12', name: 'Sivagiri Bus Stop', city: 'Sivagiri', latitude: 9.3402, longitude: 77.4302, distance_from_start_km: 308, estimated_time_from_start_minutes: 385, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-vv-13', name: 'Puliyangudi Main Road', city: 'Puliyangudi', latitude: 9.1764, longitude: 77.3965, distance_from_start_km: 320, estimated_time_from_start_minutes: 405, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-vv-14', name: 'Tenkasi Old Bus Stand', city: 'Tenkasi', latitude: 8.9592, longitude: 77.3115, distance_from_start_km: 350, estimated_time_from_start_minutes: 440, is_boarding_point: false, is_dropping_point: true },
];

// 3. TRANZKING Super Glider — Coimbatore ➔ Tenkasi (9 express stops via Nava India / Udumalpet)
const TRANZKING_CBE_TKS_STOPS = [
  { id: 'stop-tk-01', name: 'Nava India Tranzking Lounge', city: 'Coimbatore', latitude: 11.0205, longitude: 76.9942, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-tk-02', name: 'Hopes College', city: 'Coimbatore', latitude: 11.0287, longitude: 77.0182, distance_from_start_km: 5, estimated_time_from_start_minutes: 15, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-tk-03', name: 'Singanallur', city: 'Coimbatore', latitude: 10.9950, longitude: 77.0002, distance_from_start_km: 10, estimated_time_from_start_minutes: 25, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-tk-04', name: 'Pollachi Old Bus Stand', city: 'Pollachi', latitude: 10.6609, longitude: 77.0082, distance_from_start_km: 45, estimated_time_from_start_minutes: 70, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-tk-05', name: 'Udumalpet Central', city: 'Udumalapettai', latitude: 10.5872, longitude: 77.2476, distance_from_start_km: 85, estimated_time_from_start_minutes: 115, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-tk-06', name: 'Palani Bypass', city: 'Palani', latitude: 10.4505, longitude: 77.5164, distance_from_start_km: 125, estimated_time_from_start_minutes: 165, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-tk-07', name: 'Rajapalayam Express Bypass', city: 'Rajapalayam', latitude: 9.4534, longitude: 77.5565, distance_from_start_km: 265, estimated_time_from_start_minutes: 325, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-tk-08', name: 'Kadayanallur Highway', city: 'Kadayanallur', latitude: 9.0733, longitude: 77.3423, distance_from_start_km: 320, estimated_time_from_start_minutes: 400, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-tk-09', name: 'Tenkasi New Bus Stand', city: 'Tenkasi', latitude: 8.9604, longitude: 77.3152, distance_from_start_km: 345, estimated_time_from_start_minutes: 430, is_boarding_point: false, is_dropping_point: true },
];

// 4. City Express Dayliner — Coimbatore ➔ Tenkasi (16 daytime stops)
const CITY_EXPRESS_CBE_TKS_STOPS = [
  { id: 'stop-ct-01', name: 'Coimbatore Central Omni Bus Stand', city: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-ct-02', name: 'Gandhipuram Central', city: 'Coimbatore', latitude: 11.0183, longitude: 76.9725, distance_from_start_km: 4, estimated_time_from_start_minutes: 15, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-ct-03', name: 'Singanallur', city: 'Coimbatore', latitude: 10.9950, longitude: 77.0002, distance_from_start_km: 9, estimated_time_from_start_minutes: 25, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-ct-04', name: 'Ukkadam Bus Stand', city: 'Coimbatore', latitude: 10.9904, longitude: 76.9601, distance_from_start_km: 15, estimated_time_from_start_minutes: 40, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-ct-05', name: 'Pollachi Old Bus Stand', city: 'Pollachi', latitude: 10.6609, longitude: 77.0082, distance_from_start_km: 42, estimated_time_from_start_minutes: 70, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-06', name: 'Udumalapettai Central Bus Stand', city: 'Udumalapettai', latitude: 10.5872, longitude: 77.2476, distance_from_start_km: 82, estimated_time_from_start_minutes: 110, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-07', name: 'Palani Bus Stand', city: 'Palani', latitude: 10.4505, longitude: 77.5164, distance_from_start_km: 120, estimated_time_from_start_minutes: 160, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-08', name: 'Ottanchathiram Bus Stand', city: 'Ottanchathiram', latitude: 10.4851, longitude: 77.7554, distance_from_start_km: 150, estimated_time_from_start_minutes: 195, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-09', name: 'Thirumangalam Toll Gate', city: 'Thirumangalam', latitude: 9.8242, longitude: 77.9866, distance_from_start_km: 205, estimated_time_from_start_minutes: 255, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-10', name: 'Srivilliputhur Bus Stand', city: 'Srivilliputhur', latitude: 9.5125, longitude: 77.6348, distance_from_start_km: 245, estimated_time_from_start_minutes: 300, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-11', name: 'Rajapalayam Old Bus Stand', city: 'Rajapalayam', latitude: 9.4534, longitude: 77.5565, distance_from_start_km: 265, estimated_time_from_start_minutes: 325, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-12', name: 'Vasudevanallur Bypass', city: 'Vasudevanallur', latitude: 9.2335, longitude: 77.4162, distance_from_start_km: 285, estimated_time_from_start_minutes: 350, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-13', name: 'Sivagiri Bus Stop', city: 'Sivagiri', latitude: 9.3402, longitude: 77.4302, distance_from_start_km: 295, estimated_time_from_start_minutes: 365, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-14', name: 'Puliyangudi Main Road', city: 'Puliyangudi', latitude: 9.1764, longitude: 77.3965, distance_from_start_km: 310, estimated_time_from_start_minutes: 385, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-15', name: 'Kadayanallur Bypass', city: 'Kadayanallur', latitude: 9.0733, longitude: 77.3423, distance_from_start_km: 325, estimated_time_from_start_minutes: 410, is_boarding_point: true, is_dropping_point: true },
  { id: 'stop-ct-16', name: 'Tenkasi New Bus Stand', city: 'Tenkasi', latitude: 8.9604, longitude: 77.3152, distance_from_start_km: 345, estimated_time_from_start_minutes: 440, is_boarding_point: false, is_dropping_point: true },
];

// 5. YBM Night Rider — Coimbatore ➔ Tenkasi (9 night express sleeper bypass stops)
const YBM_CBE_TKS_STOPS = [
  { id: 'stop-yb-01', name: 'Gandhipuram YBM Lounge', city: 'Coimbatore', latitude: 11.0188, longitude: 76.9730, distance_from_start_km: 0, estimated_time_from_start_minutes: 0, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-yb-02', name: 'Singanallur', city: 'Coimbatore', latitude: 10.9950, longitude: 77.0002, distance_from_start_km: 9, estimated_time_from_start_minutes: 20, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-yb-03', name: 'Sulur Highway Junction', city: 'Coimbatore', latitude: 11.0264, longitude: 77.1265, distance_from_start_km: 22, estimated_time_from_start_minutes: 35, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-yb-04', name: 'Palladam Highway', city: 'Palladam', latitude: 10.9981, longitude: 77.2912, distance_from_start_km: 42, estimated_time_from_start_minutes: 60, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-yb-05', name: 'Dharapuram Bypass', city: 'Dharapuram', latitude: 10.7291, longitude: 77.5258, distance_from_start_km: 85, estimated_time_from_start_minutes: 110, is_boarding_point: true, is_dropping_point: false },
  { id: 'stop-yb-06', name: 'Ottanchathiram Highway', city: 'Ottanchathiram', latitude: 10.4851, longitude: 77.7554, distance_from_start_km: 140, estimated_time_from_start_minutes: 175, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-yb-07', name: 'Rajapalayam Express Bypass', city: 'Rajapalayam', latitude: 9.4534, longitude: 77.5565, distance_from_start_km: 275, estimated_time_from_start_minutes: 330, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-yb-08', name: 'Kadayanallur Highway', city: 'Kadayanallur', latitude: 9.0733, longitude: 77.3423, distance_from_start_km: 325, estimated_time_from_start_minutes: 400, is_boarding_point: false, is_dropping_point: true },
  { id: 'stop-yb-09', name: 'Tenkasi New Bus Stand', city: 'Tenkasi', latitude: 8.9604, longitude: 77.3152, distance_from_start_km: 345, estimated_time_from_start_minutes: 430, is_boarding_point: false, is_dropping_point: true },
];

// Helper to register verified stops for a trip
export function registerTripServiceStops(tripId, stops) {
  const verifiedStops = stops.map((s, idx) => ({
    ...s,
    id: s.id || `stop-${tripId}-${idx + 1}`,
    trip_id: tripId,
    stop_order: idx + 1,
    is_verified: true,
  }));
  tripServiceStopsMap.set(tripId, verifiedStops);
  return verifiedStops;
}

export function getStopsForTrip(tripId) {
  if (tripId && tripServiceStopsMap.has(tripId)) {
    return tripServiceStopsMap.get(tripId);
  }
  const t = trips.find((x) => x.id === tripId) || trips[0];
  if (t && Array.isArray(t.stops) && t.stops.length > 0) {
    return t.stops;
  }
  return routeStops
    .filter((s) => s.route_id === (t ? t.route_id : route1Id))
    .sort((a, b) => a.stop_order - b.stop_order);
}

// Standardize & enrich all trip records with complete provenance & operator details
trips.forEach((t) => {
  const bus = buses.find((b) => b.id === t.bus_id) || buses[0];
  const trv = travels.find((tr) => tr.id === t.travel_id) || travels[0];
  const r = routes.find((rt) => rt.id === t.route_id) || routes[0];

  // Associate operator-specific service stops
  let operatorStops = null;
  if (t.id.startsWith('trp-sr-cbe-')) {
    operatorStops = SMART_ROUTE_CBE_TKS_STOPS;
  } else if (t.id.startsWith('trp-vv-tks-')) {
    operatorStops = VEE_VEE_CBE_TKS_STOPS;
  } else if (t.id.startsWith('trp-tk-tks-')) {
    operatorStops = TRANZKING_CBE_TKS_STOPS;
  } else if (t.id.startsWith('trp-ct-tks-')) {
    operatorStops = CITY_EXPRESS_CBE_TKS_STOPS;
  } else if (t.id.startsWith('trp-yb-tks-')) {
    operatorStops = YBM_CBE_TKS_STOPS;
  }

  let finalStops;
  if (operatorStops) {
    finalStops = registerTripServiceStops(t.id, operatorStops);
  } else {
    const baseStops = routeStops.filter((s) => s.route_id === t.route_id).sort((a, b) => a.stop_order - b.stop_order);
    finalStops = baseStops.map((bs, idx) => ({
      ...bs,
      id: bs.id,
      route_stop_id: bs.id,
      trip_id: t.id,
      stop_order: bs.stop_order || idx + 1,
      is_verified: true,
    }));
    tripServiceStopsMap.set(t.id, finalStops);
  }

  t.stops = finalStops;
  if (!t.travel_name) t.travel_name = t.is_sample ? `${trv.name} (Sample Service)` : trv.name;
  if (!t.bus_name) t.bus_name = t.is_sample ? `${bus.name} (Candidate Evaluation)` : bus.name;
  if (!t.bus_type) t.bus_type = bus.bus_type;
  if (!t.duration_minutes) t.duration_minutes = r.estimated_duration_minutes || 480;
  if (!t.operating_days) t.operating_days = t.is_sample ? ['Fri', 'Sat', 'Sun'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (!t.total_seats) t.total_seats = (bus.total_seats || 0) + (bus.total_sleepers || 0);
  if (!t.layout_type) t.layout_type = bus.configuration || '2+1';
  if (t.total_blocked_seats === undefined) t.total_blocked_seats = 0;
  if (!t.last_updated_at) t.last_updated_at = new Date().toISOString();
  if (!t.fare_chart) t.fare_chart = { base: t.base_fare };

  // Set distinct boarding and dropping points from this bus's own service stops
  const bps = finalStops.filter((s) => s.is_boarding_point);
  t.boarding_points = bps.length > 0 ? bps.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    order: s.stop_order,
    time: s.estimated_time_from_start_minutes,
  })) : [{ id: `stop-${t.id}-origin`, name: `${r.source} Central Bus Stand`, city: r.source, order: 1, time: 0 }];

  const dps = finalStops.filter((s) => s.is_dropping_point);
  t.dropping_points = dps.length > 0 ? dps.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    order: s.stop_order,
    time: s.estimated_time_from_start_minutes,
  })) : [{ id: `stop-${t.id}-dest`, name: `${r.destination} Central Terminal`, city: r.destination, order: 2, time: t.duration_minutes }];

  if (!t.verification_status) {
    t.verification_status = t.is_sample ? 'SAMPLE_DATA' : 'VERIFIED';
  }
  if (t.is_sample === undefined) {
    t.is_sample = t.verification_status === 'SAMPLE_DATA' || t.status === 'sample';
  }
  if (!t.data_source) {
    t.data_source = t.is_sample ? 'smartroute_sample_presentation_v1' : 'smartroute_verified_inventory';
  }
});

export const primaryTripId = trips[0].id;

// ======================== 8. TRIP SEATS MAP ========================
export const tripSeatsMap = new Map();

for (const t of trips) {
  const tSeats = layoutSeats.map((ls, idx) => {
    // Sample candidate trips never show fabricated live availability
    if (t.is_sample || t.verification_status === 'SAMPLE_DATA' || t.status === 'sample') {
      return {
        id: `ts-${t.id}-${ls.seat_number}`,
        trip_id: t.id,
        layout_seat_id: ls.id,
        seat_number: ls.seat_number,
        seat_label: ls.seat_label,
        seat_type: ls.seat_type,
        deck: ls.deck,
        row_number: ls.row_number,
        column_number: ls.column_number,
        is_window: ls.is_window,
        is_aisle: ls.is_aisle,
        status: 'sample_unbookable',
        fare: ls.base_fare,
      };
    }
    // Book seats L1-L4 on primary trip for passenger charts
    const isBooked = (t.id === primaryTripId && idx < 4) || idx === 1 || idx === 5 || idx === 12;
    return {
      id: `ts-${t.id}-${ls.seat_number}`,
      trip_id: t.id,
      layout_seat_id: ls.id,
      seat_number: ls.seat_number,
      seat_label: ls.seat_label,
      seat_type: ls.seat_type,
      deck: ls.deck,
      row_number: ls.row_number,
      column_number: ls.column_number,
      is_window: ls.is_window,
      is_aisle: ls.is_aisle,
      status: isBooked ? 'booked' : 'available',
      fare: ls.base_fare,
    };
  });
  tripSeatsMap.set(t.id, tSeats);
}

// ======================== 8B. TRIP SEGMENT RESERVATIONS ========================
export const tripSegmentReservations = new Map();

export function hasSegmentConflict(existingReservations, seatNumber, reqBoardOrder, reqDropOrder) {
  if (!existingReservations || existingReservations.length === 0) return false;
  return existingReservations.some((res) => {
    if (res.seatNumber !== seatNumber) return false;
    // Overlap condition:
    // Existing segment [res.boardingStopOrder, res.droppingStopOrder] overlaps with [reqBoardOrder, reqDropOrder]
    // if and only if existing board is before requested drop AND existing drop is after requested board
    return res.boardingStopOrder < reqDropOrder && res.droppingStopOrder > reqBoardOrder;
  });
}

for (const t of trips) {
  const rStops = getStopsForTrip(t.id);
  const maxOrder = rStops.length > 0 ? rStops[rStops.length - 1].stop_order : 16;
  const initRes = [
    {
      bookingId: `bkg-seed-${t.id}-1`,
      pnrNumber: `PNR${t.id.slice(-4).toUpperCase()}`,
      tripId: t.id,
      seatNumber: 'L1',
      boardingStopId: rStops[0]?.id || 'stop-101',
      droppingStopId: rStops[rStops.length - 1]?.id || 'stop-116',
      boardingStopOrder: 1,
      droppingStopOrder: maxOrder,
    },
    {
      bookingId: `bkg-seed-${t.id}-2`,
      pnrNumber: `PNR${t.id.slice(-4).toUpperCase()}`,
      tripId: t.id,
      seatNumber: 'L2',
      boardingStopId: rStops[0]?.id || 'stop-101',
      droppingStopId: rStops[rStops.length - 1]?.id || 'stop-116',
      boardingStopOrder: 1,
      droppingStopOrder: maxOrder,
    },
    {
      bookingId: `bkg-seed-${t.id}-3`,
      pnrNumber: `PNR${t.id.slice(-4).toUpperCase()}`,
      tripId: t.id,
      seatNumber: 'L3',
      boardingStopId: rStops[0]?.id || 'stop-101',
      droppingStopId: rStops[Math.floor(rStops.length / 2)]?.id || 'stop-107',
      boardingStopOrder: 1,
      droppingStopOrder: Math.max(2, Math.floor(maxOrder / 2)),
    },
  ];
  tripSegmentReservations.set(t.id, initRes);
}

// ======================== 9. CONFIRMED REALISTIC BOOKINGS ========================
export const bookings = [
  {
    id: 'bkg-sr-4102',
    pnr_number: 'SR4102',
    travel_id: smartRouteTravelId,
    trip_id: primaryTripId,
    user_id: passenger1Id,
    boarding_stop_id: 'stop-101',
    dropping_stop_id: 'stop-110',
    total_fare: 1760,
    booking_status: 'confirmed',
    payment_status: 'paid',
    contact_name: 'Arun Prakash',
    contact_email: 'passenger@smartroute.in',
    contact_mobile: '9000000006',
    created_at: new Date().toISOString(),
    trip: {
      trip_number: trips[0].trip_number,
      departure_date: trips[0].departure_date,
      departure_time: trips[0].departure_time,
      estimated_arrival_time: trips[0].estimated_arrival_time,
      bus_name: buses[0].name,
      registration_number: buses[0].registration_number,
      route_name: routes[0].name,
      source: routes[0].source,
      destination: routes[0].destination,
      boarding_stop_name: 'Coimbatore Omni Bus Stand',
      dropping_stop_name: 'Tenkasi New Bus Stand',
      boarding_time: '21:15',
      dropping_time: '05:15',
    },
    passengers: [
      { id: 'pax-1', seat_number: 'L1', passenger_name: 'Arun Prakash', passenger_age: 32, passenger_gender: 'male', fare: 880, is_boarded: true },
      { id: 'pax-2', seat_number: 'L2', passenger_name: 'Kavitha Sundar', passenger_age: 29, passenger_gender: 'female', fare: 880, is_boarded: false },
    ],
  },
  {
    id: 'bkg-vv-8820',
    pnr_number: 'VV8820',
    travel_id: veeVeeTravelId,
    trip_id: trips[5].id,
    user_id: passenger2Id,
    boarding_stop_id: 'stop-501',
    dropping_stop_id: 'stop-505',
    total_fare: 2300,
    booking_status: 'confirmed',
    payment_status: 'paid',
    contact_name: 'Sneha Varma',
    contact_email: 'sneha@smartroute.in',
    contact_mobile: '9000000008',
    created_at: new Date().toISOString(),
    trip: {
      trip_number: trips[5].trip_number,
      departure_date: trips[5].departure_date,
      departure_time: trips[5].departure_time,
      estimated_arrival_time: trips[5].estimated_arrival_time,
      bus_name: buses[4].name,
      registration_number: buses[4].registration_number,
      route_name: routes[4].name,
      source: routes[4].source,
      destination: routes[4].destination,
      boarding_stop_name: 'Majestic Kempegowda Bus Station',
      dropping_stop_name: 'Mattuthavani Integrated Bus Stand (MIBT)',
      boarding_time: '22:00',
      dropping_time: '05:00',
    },
    passengers: [
      { id: 'pax-3', seat_number: 'LS1', passenger_name: 'Sneha Varma', passenger_age: 27, passenger_gender: 'female', fare: 1150, is_boarded: true },
      { id: 'pax-4', seat_number: 'LS2', passenger_name: 'Vikram Menon', passenger_age: 30, passenger_gender: 'male', fare: 1150, is_boarded: false },
    ],
  },
];

// ======================== 9B. CONFIRMED PAYMENT & REFUND TRANSACTIONS ========================
export const payments = [
  {
    id: 'pay-sr-4102',
    booking_id: 'bkg-sr-4102',
    user_id: passenger1Id,
    payment_order_id: 'ord_sr_4102',
    payment_id: 'pay_sr_4102_gateway',
    payment_signature: 'sig_sr_4102',
    method: 'upi',
    status: 'completed',
    amount: 1760,
    currency: 'INR',
    provider: 'razorpay',
    failure_reason: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'pay-vv-8820',
    booking_id: 'bkg-vv-8820',
    user_id: passenger2Id,
    payment_order_id: 'ord_vv_8820',
    payment_id: 'pay_vv_8820_gateway',
    payment_signature: 'sig_vv_8820',
    method: 'card',
    status: 'completed',
    amount: 2300,
    currency: 'INR',
    provider: 'razorpay',
    failure_reason: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const refunds = [];

// Driver manifests for trip 1
export const manifests = [
  { id: 'pax-1', booking_id: 'bkg-sr-4102', pnr_number: 'SR4102', seat_number: 'L1', passenger_name: 'Arun Prakash', passenger_age: 32, passenger_gender: 'male', contact_mobile: '9000000006', boarding_stop: 'Coimbatore Omni Bus Stand', is_boarded: true },
  { id: 'pax-2', booking_id: 'bkg-sr-4102', pnr_number: 'SR4102', seat_number: 'L2', passenger_name: 'Kavitha Sundar', passenger_age: 29, passenger_gender: 'female', contact_mobile: '9000000006', boarding_stop: 'Coimbatore Omni Bus Stand', is_boarded: false },
  { id: 'pax-5', booking_id: 'bkg-sr-4103', pnr_number: 'SR4103', seat_number: 'L3', passenger_name: 'Rajesh Kannan', passenger_age: 45, passenger_gender: 'male', contact_mobile: '9842109821', boarding_stop: 'Gandhipuram', is_boarded: true },
  { id: 'pax-6', booking_id: 'bkg-sr-4103', pnr_number: 'SR4103', seat_number: 'L4', passenger_name: 'Priya Kannan', passenger_age: 41, passenger_gender: 'female', contact_mobile: '9842109821', boarding_stop: 'Gandhipuram', is_boarded: false },
  { id: 'pax-7', booking_id: 'bkg-sr-4104', pnr_number: 'SR4104', seat_number: 'LS1', passenger_name: 'Deepak Subramanian', passenger_age: 34, passenger_gender: 'male', contact_mobile: '9789123456', boarding_stop: 'Singanallur', is_boarded: false },
  { id: 'pax-8', booking_id: 'bkg-sr-4105', pnr_number: 'SR4105', seat_number: 'U1', passenger_name: 'Meenakshi Sundaram', passenger_age: 28, passenger_gender: 'female', contact_mobile: '9840987654', boarding_stop: 'Pollachi', is_boarded: false },
];

// Live GPS coordinate
export let latestGps = {
  bus_id: buses[0].id,
  trip_id: primaryTripId,
  latitude: 10.995,
  longitude: 77.0002,
  speed: 64.2,
  heading: 142.0,
  recorded_at: new Date().toISOString(),
};

// ======================== 10. SOUTH INDIAN TRANSIT HUBS INDEX ========================
// Curated index for sub-50ms place autocomplete & geocoding
export const transitHubsIndex = [
  // Coimbatore Hubs
  { placeId: 'hub-cbe-01', mainText: 'Coimbatore', secondaryText: 'Tamil Nadu, India', city: 'Coimbatore', lat: 11.0168, lng: 76.9558, type: 'city' },
  { placeId: 'hub-cbe-02', mainText: 'Coimbatore Omni Bus Stand', secondaryText: 'Sathy Road, Coimbatore', city: 'Coimbatore', lat: 11.0168, lng: 76.9558, type: 'bus_station' },
  { placeId: 'hub-cbe-03', mainText: 'Coimbatore Gandhipuram Bus Stand', secondaryText: 'Gandhipuram, Coimbatore', city: 'Coimbatore', lat: 11.0183, lng: 76.9725, type: 'bus_station' },
  { placeId: 'hub-cbe-04', mainText: 'Coimbatore Junction Railway Station', secondaryText: 'State Bank Road, Coimbatore', city: 'Coimbatore', lat: 10.9984, lng: 76.9632, type: 'transit_station' },
  { placeId: 'hub-cbe-05', mainText: 'Coimbatore International Airport (CJB)', secondaryText: 'Avinashi Road, Peelamedu, Coimbatore', city: 'Coimbatore', lat: 11.0300, lng: 77.0434, type: 'airport' },
  { placeId: 'hub-cbe-06', mainText: 'Singanallur Bus Terminal', secondaryText: 'Trichy Road, Coimbatore', city: 'Coimbatore', lat: 10.9950, lng: 77.0002, type: 'bus_station' },
  { placeId: 'hub-cbe-07', mainText: 'Ukkadam Bus Stand', secondaryText: 'Ukkadam, Coimbatore', city: 'Coimbatore', lat: 10.9904, lng: 76.9601, type: 'bus_station' },

  // Tenkasi Hubs
  { placeId: 'hub-tks-01', mainText: 'Tenkasi', secondaryText: 'Tenkasi District, Tamil Nadu', city: 'Tenkasi', lat: 8.9604, lng: 77.3152, type: 'city' },
  { placeId: 'hub-tks-02', mainText: 'Tenkasi New Bus Stand', secondaryText: 'Kollam - Madurai Highway, Tenkasi', city: 'Tenkasi', lat: 8.9604, lng: 77.3152, type: 'bus_station' },
  { placeId: 'hub-tks-03', mainText: 'Tenkasi Old Bus Stand', secondaryText: 'Tenkasi Town', city: 'Tenkasi', lat: 8.9592, lng: 77.3120, type: 'bus_station' },
  { placeId: 'hub-tks-04', mainText: 'Tenkasi Junction Railway Station', secondaryText: 'Station Road, Tenkasi', city: 'Tenkasi', lat: 8.9615, lng: 77.3088, type: 'transit_station' },
  { placeId: 'hub-tks-05', mainText: 'Kadayanallur Bypass', secondaryText: 'Kadayanallur, Tenkasi', city: 'Tenkasi', lat: 9.0733, lng: 77.3423, type: 'bus_station' },

  // Chennai Hubs
  { placeId: 'hub-che-01', mainText: 'Chennai', secondaryText: 'Tamil Nadu, India', city: 'Chennai', lat: 13.0827, lng: 80.2707, type: 'city' },
  { placeId: 'hub-che-02', mainText: 'Koyambedu Omni Bus Stand (CMBT)', secondaryText: 'Koyambedu, Chennai', city: 'Chennai', lat: 13.0694, lng: 80.1948, type: 'bus_station' },
  { placeId: 'hub-che-03', mainText: 'Kilambakkam Bus Terminus (KCBT)', secondaryText: 'GST Road, Vandalur, Chennai', city: 'Chennai', lat: 12.8686, lng: 80.0827, type: 'bus_station' },
  { placeId: 'hub-che-04', mainText: 'Guindy Kathipara Junction', secondaryText: 'Guindy, Chennai', city: 'Chennai', lat: 13.0067, lng: 80.2025, type: 'transit_station' },
  { placeId: 'hub-che-05', mainText: 'Tambaram MEPZ Terminal', secondaryText: 'GST Road, Tambaram, Chennai', city: 'Chennai', lat: 12.9249, lng: 80.1345, type: 'bus_station' },
  { placeId: 'hub-che-06', mainText: 'Chennai Central Railway Station (MAS)', secondaryText: 'Park Town, Chennai', city: 'Chennai', lat: 13.0825, lng: 80.2755, type: 'transit_station' },
  { placeId: 'hub-che-07', mainText: 'Chennai International Airport (MAA)', secondaryText: 'Meenambakkam, Chennai', city: 'Chennai', lat: 12.9941, lng: 80.1709, type: 'airport' },

  // Bengaluru Hubs
  { placeId: 'hub-blr-01', mainText: 'Bengaluru', secondaryText: 'Karnataka, India', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, type: 'city' },
  { placeId: 'hub-blr-02', mainText: 'Majestic Kempegowda Bus Station', secondaryText: 'Majestic, Bengaluru', city: 'Bengaluru', lat: 12.9767, lng: 77.5713, type: 'bus_station' },
  { placeId: 'hub-blr-03', mainText: 'Electronic City Toll Gate', secondaryText: 'Hosur Road, Bengaluru', city: 'Bengaluru', lat: 12.8399, lng: 77.6770, type: 'bus_station' },
  { placeId: 'hub-blr-04', mainText: 'Shantinagar Bus Station', secondaryText: 'Shantinagar, Bengaluru', city: 'Bengaluru', lat: 12.9554, lng: 77.5935, type: 'bus_station' },
  { placeId: 'hub-blr-05', mainText: 'Silk Board Junction', secondaryText: 'Hosur Road, Bengaluru', city: 'Bengaluru', lat: 12.9176, lng: 77.6238, type: 'transit_station' },
  { placeId: 'hub-blr-06', mainText: 'Madiwala Bus Stand', secondaryText: 'Madiwala, Bengaluru', city: 'Bengaluru', lat: 12.9226, lng: 77.6174, type: 'bus_station' },

  // Madurai Hubs
  { placeId: 'hub-mdu-01', mainText: 'Madurai', secondaryText: 'Tamil Nadu, India', city: 'Madurai', lat: 9.9252, lng: 78.1198, type: 'city' },
  { placeId: 'hub-mdu-02', mainText: 'Mattuthavani Integrated Bus Stand (MIBT)', secondaryText: 'Mattuthavani, Madurai', city: 'Madurai', lat: 9.9463, lng: 78.1565, type: 'bus_station' },
  { placeId: 'hub-mdu-03', mainText: 'Arapalayam Bus Stand', secondaryText: 'Arapalayam, Madurai', city: 'Madurai', lat: 9.9328, lng: 78.1065, type: 'bus_station' },
  { placeId: 'hub-mdu-04', mainText: 'Periyar Bus Stand', secondaryText: 'Periyar, Madurai', city: 'Madurai', lat: 9.9175, lng: 78.1147, type: 'bus_station' },

  // Tirunelveli Hubs
  { placeId: 'hub-tnv-01', mainText: 'Tirunelveli', secondaryText: 'Tamil Nadu, India', city: 'Tirunelveli', lat: 8.7139, lng: 77.7567, type: 'city' },
  { placeId: 'hub-tnv-02', mainText: 'Tirunelveli New Bus Stand (Vaeinthaankulam)', secondaryText: 'Palayamkottai, Tirunelveli', city: 'Tirunelveli', lat: 8.7099, lng: 77.7342, type: 'bus_station' },
  { placeId: 'hub-tnv-03', mainText: 'Vannarpettai Bypass', secondaryText: 'Vannarpettai, Tirunelveli', city: 'Tirunelveli', lat: 8.7289, lng: 77.7314, type: 'transit_station' },

  // Salem Hubs
  { placeId: 'hub-sal-01', mainText: 'Salem', secondaryText: 'Tamil Nadu, India', city: 'Salem', lat: 11.6643, lng: 78.1460, type: 'city' },
  { placeId: 'hub-sal-02', mainText: 'Salem New Bus Stand', secondaryText: 'AVR Circle, Salem', city: 'Salem', lat: 11.6643, lng: 78.1460, type: 'bus_station' },

  // Erode Hubs
  { placeId: 'hub-ero-01', mainText: 'Erode', secondaryText: 'Tamil Nadu, India', city: 'Erode', lat: 11.3410, lng: 77.7172, type: 'city' },
  { placeId: 'hub-ero-02', mainText: 'Erode Central Bus Stand', secondaryText: 'Erode Town', city: 'Erode', lat: 11.3410, lng: 77.7172, type: 'bus_station' },

  // Trichy Hubs
  { placeId: 'hub-trz-01', mainText: 'Trichy (Tiruchirappalli)', secondaryText: 'Tamil Nadu, India', city: 'Trichy', lat: 10.7905, lng: 78.7047, type: 'city' },
  { placeId: 'hub-trz-02', mainText: 'Trichy Central Bus Stand', secondaryText: 'Cantonment, Trichy', city: 'Trichy', lat: 10.7932, lng: 78.6854, type: 'bus_station' },

  // Thanjavur Hubs
  { placeId: 'hub-thn-01', mainText: 'Thanjavur', secondaryText: 'Tamil Nadu, India', city: 'Thanjavur', lat: 10.7870, lng: 79.1378, type: 'city' },
  { placeId: 'hub-thn-02', mainText: 'Thanjavur New Bus Stand', secondaryText: 'Thanjavur', city: 'Thanjavur', lat: 10.7725, lng: 79.1215, type: 'bus_station' },

  // Kochi Hubs
  { placeId: 'hub-koc-01', mainText: 'Kochi (Cochin)', secondaryText: 'Kerala, India', city: 'Kochi', lat: 9.9312, lng: 76.2673, type: 'city' },
  { placeId: 'hub-koc-02', mainText: 'Vytilla Mobility Hub', secondaryText: 'Vytilla, Kochi', city: 'Kochi', lat: 9.9676, lng: 76.3197, type: 'bus_station' },

  // Thrissur Hubs
  { placeId: 'hub-tcr-01', mainText: 'Thrissur', secondaryText: 'Kerala, India', city: 'Thrissur', lat: 10.5276, lng: 76.2144, type: 'city' },
  { placeId: 'hub-tcr-02', mainText: 'Thrissur KSRTC Terminal', secondaryText: 'Near Railway Station, Thrissur', city: 'Thrissur', lat: 10.5186, lng: 76.2104, type: 'bus_station' },

  // Calicut Hubs
  { placeId: 'hub-clt-01', mainText: 'Calicut (Kozhikode)', secondaryText: 'Kerala, India', city: 'Calicut', lat: 11.2588, lng: 75.7804, type: 'city' },
  { placeId: 'hub-clt-02', mainText: 'Calicut KSRTC Bus Stand', secondaryText: 'Mavoor Road, Calicut', city: 'Calicut', lat: 11.2562, lng: 75.7892, type: 'bus_station' },

  // Pondicherry Hubs
  { placeId: 'hub-pdy-01', mainText: 'Pondicherry (Puducherry)', secondaryText: 'Puducherry, India', city: 'Pondicherry', lat: 11.9416, lng: 79.8083, type: 'city' },
  { placeId: 'hub-pdy-02', mainText: 'Puducherry New Bus Stand', secondaryText: 'Maraimalai Adigal Salai, Pondicherry', city: 'Pondicherry', lat: 11.9348, lng: 79.8164, type: 'bus_station' },

  // Key Intermediate Stops
  { placeId: 'hub-pol-01', mainText: 'Pollachi Old Bus Stand', secondaryText: 'Pollachi, Coimbatore District', city: 'Pollachi', lat: 10.6609, lng: 77.0082, type: 'bus_station' },
  { placeId: 'hub-udu-01', mainText: 'Udumalapettai Central Bus Stand', secondaryText: 'Udumalapettai, Tiruppur District', city: 'Udumalapettai', lat: 10.5872, lng: 77.2476, type: 'bus_station' },
  { placeId: 'hub-pal-01', mainText: 'Palani Bus Stand', secondaryText: 'Palani, Dindigul District', city: 'Palani', lat: 10.4505, lng: 77.5164, type: 'bus_station' },
  { placeId: 'hub-raj-01', mainText: 'Rajapalayam Old Bus Stand', secondaryText: 'Rajapalayam, Virudhunagar District', city: 'Rajapalayam', lat: 9.4534, lng: 77.5565, type: 'bus_station' },
  { placeId: 'hub-sri-01', mainText: 'Srivilliputhur Bus Stand', secondaryText: 'Srivilliputhur, Virudhunagar District', city: 'Srivilliputhur', lat: 9.5125, lng: 77.6348, type: 'bus_station' },
];

// ======================== QUERY & MUTATING SERVICE FUNCTIONS ========================

export function searchPlacesIndex(query) {
  if (!query) return [];
  const q = String(query).toLowerCase().trim();

  const combinedHubs = [];
  const seenPlaceIds = new Set();

  [...transitHubsIndex, ...PAN_INDIA_TRANSIT_HUBS].forEach((hub) => {
    if (!seenPlaceIds.has(hub.placeId)) {
      seenPlaceIds.add(hub.placeId);
      combinedHubs.push(hub);
    }
  });

  return combinedHubs
    .filter((hub) => {
      const matchMain = hub.mainText.toLowerCase().includes(q);
      const matchCity = hub.city.toLowerCase().includes(q);
      const matchSec = hub.secondaryText.toLowerCase().includes(q);
      const matchState = hub.state ? hub.state.toLowerCase().includes(q) : false;
      return matchMain || matchCity || matchSec || matchState;
    })
    .sort((a, b) => {
      // Prioritize matches that start with query
      const aStarts = a.mainText.toLowerCase().startsWith(q) || a.city.toLowerCase().startsWith(q);
      const bStarts = b.mainText.toLowerCase().startsWith(q) || b.city.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    })
    .map((hub) => ({
      placeId: hub.placeId,
      mainText: hub.mainText,
      secondaryText: hub.secondaryText,
      fullText: `${hub.mainText}, ${hub.secondaryText}`,
      city: hub.city,
      state: hub.state,
      lat: hub.lat,
      lng: hub.lng,
      type: hub.type,
      source: 'smartroute_transit',
    }));
}

export function getPlaceById(placeId) {
  return transitHubsIndex.find((h) => h.placeId === placeId) || PAN_INDIA_TRANSIT_HUBS.find((h) => h.placeId === placeId);
}

export function findUserByCredentials(identifier) {
  const clean = String(identifier || '').toLowerCase().trim();
  const cleanMobile = String(identifier || '').replace(/\D/g, '').slice(-10);
  return users.find((u) => (u.email && u.email.toLowerCase() === clean) || (u.mobile && u.mobile.replace(/\D/g, '').slice(-10) === cleanMobile));
}

export function findUserByEmail(email) {
  if (!email) return null;
  const clean = String(email).toLowerCase().trim();
  return users.find((u) => u.email && u.email.toLowerCase() === clean);
}

export function findUserByMobile(mobile) {
  if (!mobile) return null;
  const cleanMobile = String(mobile).replace(/\D/g, '').slice(-10);
  return users.find((u) => u.mobile && u.mobile.replace(/\D/g, '').slice(-10) === cleanMobile);
}

export function findUserById(id) {
  return users.find((u) => u.id === id);
}

export function registerUserData({ email, mobile, passwordHash, firstName, lastName, role = 'passenger', status = 'active', operatorCode = null, travelId = null }) {
  const cleanEmail = email ? String(email).toLowerCase().trim() : null;
  const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : null;
  const newUser = {
    id: uuidv4(),
    email: cleanEmail,
    mobile: cleanMobile,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName || null,
    role,
    status,
    operator_code: operatorCode || null,
    license_number: role === 'driver' ? operatorCode : null,
    email_verified: false,
    mobile_verified: false,
    travel_id: travelId || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.push(newUser);
  savePersistentStore();
  return newUser;
}

export function updateUserInStore(id, updates) {
  const user = users.find((u) => u.id === id);
  if (user) {
    Object.assign(user, updates, { updated_at: new Date().toISOString() });
    savePersistentStore();
    return user;
  }
  return null;
}

export function searchTripsData({ source, destination, date, busType, minFare, maxFare, includeSample = false }) {
  const srcLower = String(source || '').toLowerCase().trim();
  const dstLower = String(destination || '').toLowerCase().trim();

  const matchedTripIds = new Set();
  const filtered = [];

  for (const t of trips) {
    if (matchedTripIds.has(t.id)) continue;

    // Filter out candidate sample evaluation records from live customer booking searches by default
    if (!includeSample && (t.status === 'sample' || t.is_sample || t.verification_status === 'SAMPLE_DATA')) {
      continue;
    }

    // Filter out trips whose operating travel company is pending administrative verification or rejected
    const trv = travels.find((tr) => tr.id === t.travel_id);
    if (trv && (trv.verification_status === 'pending' || trv.verification_status === 'rejected' || trv.status === 'suspended' || trv.status === 'rejected')) {
      continue;
    }

    const r = routes.find((route) => route.id === t.route_id);
    if (!r) continue;

    // Direct route match or stop match using alias-aware isCityMatch
    const srcMatch = !srcLower ||
      isCityMatch(srcLower, r.source) ||
      r.source.toLowerCase().includes(srcLower) ||
      srcLower.includes(r.source.toLowerCase()) ||
      routeStops.some((s) => s.route_id === r.id && (isCityMatch(srcLower, s.city) || s.name.toLowerCase().includes(srcLower)) && s.is_boarding_point);

    const dstMatch = !dstLower ||
      isCityMatch(dstLower, r.destination) ||
      r.destination.toLowerCase().includes(dstLower) ||
      dstLower.includes(r.destination.toLowerCase()) ||
      routeStops.some((s) => s.route_id === r.id && (isCityMatch(dstLower, s.city) || s.name.toLowerCase().includes(dstLower)) && s.is_dropping_point);

    if (!srcMatch || !dstMatch) continue;

    // Strict route alignment: never return Tenkasi routes or buses for Karaikudi searches
    if (dstLower.includes('karaikudi')) {
      const rDestLower = (r.destination || '').toLowerCase();
      const rNameLower = (r.name || '').toLowerCase();
      const tNumLower = (t.trip_number || '').toLowerCase();
      if (rDestLower.includes('tenkasi') || rNameLower.includes('tenkasi') || tNumLower.includes('tks') || rNameLower.includes('kadayanallur')) {
        continue;
      }
    }

    // Check intermediate stop order if source and destination are both supplied
    if (srcLower && dstLower) {
      const stops = routeStops.filter((s) => s.route_id === r.id).sort((a, b) => a.stop_order - b.stop_order);
      const bStop = stops.find((s) => (isCityMatch(srcLower, s.city) || isCityMatch(srcLower, s.name)) && s.is_boarding_point);
      const dStop = [...stops].reverse().find((s) => (isCityMatch(dstLower, s.city) || isCityMatch(dstLower, s.name)) && s.is_dropping_point);
      if (bStop && dStop && bStop.stop_order >= dStop.stop_order) {
        continue; // Boarding is after dropping, invalid direction for this trip
      }
    }

    if (date && t.departure_date !== date) {
      continue;
    }

    const bus = buses.find((b) => b.id === t.bus_id) || buses[0];
    if (busType && busType !== 'all') {
      if (bus.bus_type !== busType) continue;
    }

    if (minFare && t.base_fare < parseFloat(minFare)) continue;
    if (maxFare && t.base_fare > parseFloat(maxFare)) continue;

    matchedTripIds.add(t.id);
    filtered.push(t);
  }

  return filtered.map((t) => {
    const bus = buses.find((b) => b.id === t.bus_id) || buses[0];
    const route = routes.find((r) => r.id === t.route_id) || routes[0];
    const operator = travels.find((tr) => tr.id === t.travel_id) || travels[0];

    const stops = getStopsForTrip(t.id);
    const bStops = stops.filter((s) => s.is_boarding_point);
    const dStops = stops.filter((s) => s.is_dropping_point);

    // Pick best matching boarding stop if srcLower is specified
    const matchedBStop = srcLower ? (stops.find((s) => (isCityMatch(srcLower, s.city) || isCityMatch(srcLower, s.name)) && s.is_boarding_point) || bStops[0]) : bStops[0];
    const matchedDStop = dstLower ? ([...stops].reverse().find((s) => (isCityMatch(dstLower, s.city) || isCityMatch(dstLower, s.name)) && s.is_dropping_point) || dStops[dStops.length - 1]) : dStops[dStops.length - 1];

    const depTime = t.departure_time || '21:30';
    const arrTime = t.estimated_arrival_time || '05:30';
    const [depH, depM] = depTime.split(':').map(Number);
    const [arrH, arrM] = arrTime.split(':').map(Number);
    const depMins = (depH || 0) * 60 + (depM || 0);
    const arrMins = (arrH || 0) * 60 + (arrM || 0);
    const isOvernight = arrMins <= depMins;

    let arrivalDate = t.departure_date;
    if (isOvernight && t.departure_date) {
      const dDate = new Date(t.departure_date);
      dDate.setDate(dDate.getDate() + 1);
      arrivalDate = dDate.toISOString().split('T')[0];
    }

    return {
      tripId: t.id,
      trip_number: t.trip_number,
      departure_date: t.departure_date,
      departure_time: t.departure_time,
      estimated_arrival_time: t.estimated_arrival_time,
      arrival_date: arrivalDate,
      estimated_arrival_date: arrivalDate,
      is_overnight: isOvernight,
      status: t.status,
      verification_status: t.verification_status || 'VERIFIED',
      is_sample: Boolean(t.is_sample),
      data_source: t.data_source || 'smartroute_verified_inventory',
      operating_days: t.operating_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      base_fare: t.base_fare,
      total_available_seats: t.total_available_seats,
      total_booked_seats: t.total_booked_seats,
      total_blocked_seats: t.total_blocked_seats || 0,
      fare_chart: t.fare_chart || null,
      features: t.features || bus.features || [],
      has_live_tracking: Boolean(t.has_live_tracking ?? bus.has_live_tracking ?? true),
      has_radar_gps: Boolean(t.has_radar_gps ?? bus.has_radar_gps ?? false),
      travelId: operator.id,
      travelName: t.travel_name || operator.name,
      travelBadge: operator.badge,
      travelRating: operator.rating,
      travelLogo: null,
      busName: t.bus_name || bus.name,
      registration_number: bus.registration_number,
      bus_type: t.bus_type || bus.bus_type,
      configuration: bus.configuration,
      has_ac: bus.has_ac,
      has_wifi: bus.has_wifi,
      has_charging: bus.has_charging,
      has_toilet: bus.has_toilet,
      has_water_bottle: bus.has_water_bottle,
      has_blanket: bus.has_blanket,
      busTotalSeats: t.total_seats || bus.total_seats,
      total_sleepers: bus.total_sleepers,
      routeName: route.name,
      routeSource: route.source,
      routeDestination: route.destination,
      distance_km: route.distance_km,
      estimated_duration_minutes: route.estimated_duration_minutes,
      boardingStopId: matchedBStop?.id || bStops[0]?.id || 'stop-101',
      boardingStopName: matchedBStop?.name || bStops[0]?.name || `${route.source} Omni Bus Stand`,
      boardingStopOrder: matchedBStop?.stop_order || 1,
      boardingTime: matchedBStop?.estimated_time_from_start_minutes || 0,
      droppingStopId: matchedDStop?.id || dStops[dStops.length - 1]?.id || 'stop-110',
      droppingStopName: matchedDStop?.name || dStops[dStops.length - 1]?.name || `${route.destination} Bus Stand`,
      droppingStopOrder: matchedDStop?.stop_order || stops.length,
      droppingTime: matchedDStop?.estimated_time_from_start_minutes || route.estimated_duration_minutes,
      boarding_points: t.boarding_points || bStops.map((s) => ({ id: s.id, name: s.name, city: s.city, order: s.stop_order, time: s.estimated_time_from_start_minutes })),
      dropping_points: t.dropping_points || dStops.map((s) => ({ id: s.id, name: s.name, city: s.city, order: s.stop_order, time: s.estimated_time_from_start_minutes })),
      stops,
      route_stops: stops,
      last_updated_at: t.last_updated_at || new Date().toISOString(),
    };
  });
}

export function findMatchingCandidateCorridor(source, destination) {
  if (!source || !destination) return null;
  const src = String(source).toLowerCase().trim();
  const dst = String(destination).toLowerCase().trim();

  const found = ALL_CATALOGUE_ROUTES.find((r) => {
    return (
      (isCityMatch(src, r.source) || r.source.toLowerCase().includes(src) || src.includes(r.source.toLowerCase())) &&
      (isCityMatch(dst, r.destination) || r.destination.toLowerCase().includes(dst) || dst.includes(r.destination.toLowerCase()))
    );
  });

  if (!found) return null;

  return {
    id: found.id,
    code: found.code,
    source: found.source,
    destination: found.destination,
    sourceState: found.sourceState,
    destState: found.destState,
    region: found.region,
    distanceKm: found.distanceKm,
    durationMins: found.durationMins,
    category: found.category,
    direction: found.direction,
    status: found.status,
    hasActiveService: found.hasActiveService,
    intermediateStopsCount: found.intermediateStops ? found.intermediateStops.length : 0,
    note: 'Catalogue candidate corridor. Commercial private coach service is pending verification/scheduling.',
  };
}

export function getRouteCatalogueData({ origin, destination, region, status, direction } = {}) {
  let list = [...ALL_CATALOGUE_ROUTES];

  if (origin) {
    list = list.filter((r) => isCityMatch(origin, r.source) || r.source.toLowerCase().includes(origin.toLowerCase()));
  }
  if (destination) {
    list = list.filter((r) => isCityMatch(destination, r.destination) || r.destination.toLowerCase().includes(destination.toLowerCase()));
  }
  if (region && region !== 'all') {
    list = list.filter((r) => r.region && r.region.toLowerCase().includes(region.toLowerCase()));
  }
  if (status && status !== 'all') {
    list = list.filter((r) => r.status === status);
  }
  if (direction && direction !== 'all') {
    list = list.filter((r) => r.direction === direction);
  }

  const coimbatoreCount = ALL_CATALOGUE_ROUTES.filter((r) => r.source === 'Coimbatore' && r.direction === 'forward').length;
  const bengaluruCount = ALL_CATALOGUE_ROUTES.filter((r) => r.source === 'Bengaluru' && r.direction === 'forward').length;

  return {
    total: list.length,
    catalogueTotal: ALL_CATALOGUE_ROUTES.length,
    forwardTotal: MASTER_ROUTE_CATALOGUE.length,
    coimbatoreCandidateCorridors: coimbatoreCount,
    bengaluruCandidateCorridors: bengaluruCount,
    routes: list,
  };
}

export function getTripDetails(tripId) {
  const t = trips.find((x) => x.id === tripId) || trips[0];
  const bus = buses.find((b) => b.id === t.bus_id) || buses[0];
  const route = routes.find((r) => r.id === t.route_id) || routes[0];
  const operator = travels.find((tr) => tr.id === t.travel_id) || travels[0];

  return {
    id: t.id,
    trip_number: t.trip_number,
    departure_date: t.departure_date,
    departure_time: t.departure_time,
    estimated_arrival_time: t.estimated_arrival_time,
    status: t.status,
    base_fare: t.base_fare,
    total_available_seats: t.total_available_seats,
    bus: {
      id: bus.id,
      name: bus.name,
      registration_number: bus.registration_number,
      bus_type: bus.bus_type,
      configuration: bus.configuration,
      has_ac: bus.has_ac,
      has_wifi: bus.has_wifi,
      has_charging: bus.has_charging,
      has_water_bottle: bus.has_water_bottle,
      has_blanket: bus.has_blanket,
    },
    route: {
      id: route.id,
      name: route.name,
      source: route.source,
      destination: route.destination,
      distance_km: route.distance_km,
      estimated_duration_minutes: route.estimated_duration_minutes,
    },
    travel: {
      id: operator.id,
      name: operator.name,
      badge: operator.badge,
      rating: operator.rating,
      contact_mobile: operator.contact_mobile,
    },
  };
}

export function purgeExpiredMemoryHolds() {
  const now = Date.now();
  for (const [, sList] of tripSeatsMap.entries()) {
    sList.forEach((s) => {
      if (s.status === 'held' && s.held_until && new Date(s.held_until).getTime() < now) {
        s.status = 'available';
        s.held_by = null;
        s.held_until = null;
      }
    });
  }
}

export function resetAllSeatLocks() {
  for (const [, sList] of tripSeatsMap.entries()) {
    sList.forEach((s) => {
      if (s.status === 'held') {
        s.status = 'available';
        s.held_by = null;
        s.held_until = null;
      }
    });
  }
  return { success: true, message: 'All in-memory seat locks purged and reset to available.' };
}

export function getSeatsForTrip(tripId, segmentOptions = {}) {
  const t = trips.find((x) => x.id === tripId) || trips[0];
  const bus = buses.find((b) => b.id === t.bus_id) || buses[0];
  const route = routes.find((r) => r.id === t.route_id) || routes[0];
  const stops = getStopsForTrip(t.id);

  // Auto-purge zombie holds (> 10 mins)
  purgeExpiredMemoryHolds();

  let sList = tripSeatsMap.get(tripId);
  if (!sList) {
    sList = layoutSeats.map((ls) => ({
      id: `ts-${tripId}-${ls.seat_number}`,
      trip_id: tripId,
      layout_seat_id: ls.id,
      seat_number: ls.seat_number,
      seat_label: ls.seat_label,
      seat_type: ls.seat_type,
      deck: ls.deck,
      row_number: ls.row_number,
      column_number: ls.column_number,
      is_window: ls.is_window,
      is_aisle: ls.is_aisle,
      status: 'available',
      fare: ls.base_fare,
    }));
    tripSeatsMap.set(tripId, sList);
  }

  const reservations = tripSegmentReservations.get(tripId) || [];
  let bOrder = segmentOptions.boardingStopOrder ? parseInt(segmentOptions.boardingStopOrder) : null;
  let dOrder = segmentOptions.droppingStopOrder ? parseInt(segmentOptions.droppingStopOrder) : null;

  if (!bOrder && segmentOptions.boardingStopId) {
    const foundB = stops.find((s) => s.id === segmentOptions.boardingStopId || s.route_stop_id === segmentOptions.boardingStopId) || routeStops.find((s) => s.id === segmentOptions.boardingStopId);
    if (foundB) bOrder = foundB.stop_order;
  }
  if (!dOrder && segmentOptions.droppingStopId) {
    const foundD = stops.find((s) => s.id === segmentOptions.droppingStopId || s.route_stop_id === segmentOptions.droppingStopId) || routeStops.find((s) => s.id === segmentOptions.droppingStopId);
    if (foundD) dOrder = foundD.stop_order;
  }

  // Map confirmed passengers for gender allocation awareness
  const paxGenderBySeat = new Map();
  const targetDate = segmentOptions.date || segmentOptions.journeyDate;

  for (const b of bookings) {
    const isMatchingTrip =
      (tripId && b.trip_id === tripId) ||
      (t && b.trip_id === t.id) ||
      (bus && (b.bus_id === bus.id || b.bus_number === bus.bus_number));
    const isStatusActive = b.status !== 'cancelled' && b.status !== 'refunded' && b.status !== 'failed';
    const bDate = b.journey_date || b.travel_date || b.departure_date || b.trip?.departure_date;
    const isMatchingDate = !targetDate || bDate === targetDate;

    if (isMatchingTrip && isStatusActive && isMatchingDate) {
      for (const pax of (b.passengers || [])) {
        const sNum = pax.seat_number || pax.seatNumber;
        if (sNum) {
          const info = {
            gender: (pax.passenger_gender || pax.gender || 'male').toLowerCase(),
            bookingId: b.id,
            name: pax.passenger_name || pax.name,
          };
          paxGenderBySeat.set(sNum, info);
          paxGenderBySeat.set(sNum.toUpperCase(), info);
          paxGenderBySeat.set(sNum.replace('LS', 'SL'), info);
          paxGenderBySeat.set(sNum.replace('SL', 'LS'), info);
          paxGenderBySeat.set(sNum.replace('L', 'S'), info);
          paxGenderBySeat.set(sNum.replace('S', 'L'), info);
        }
      }
    }
  }

  const seats = sList.map((s) => {
    const paxInfo = paxGenderBySeat.get(s.seat_number) || paxGenderBySeat.get(s.seat_number?.toUpperCase());
    let status = s.status || 'available';
    let segmentConflict = false;
    let disabled = status === 'disabled';

    if (paxInfo) {
      status = 'booked';
      disabled = true;
    }

    if (bOrder && dOrder) {
      const isConflicted = hasSegmentConflict(reservations, s.seat_number, bOrder, dOrder);
      if (isConflicted) {
        status = 'booked';
        segmentConflict = true;
        disabled = true;
      }
    } else if (reservations.some((r) => r.seatNumber === s.seat_number)) {
      status = 'booked';
      disabled = true;
    }

    return {
      ...s,
      status,
      disabled,
      segmentConflict,
      gender: paxInfo?.gender || s.gender,
      bookingId: paxInfo?.bookingId || s.bookingId,
    };
  });

  return {
    layout: busLayout,
    seats,
  };
}

export function createNewBooking(bookingParams) {
  const {
    serviceNumber,
    busNumber,
    departureTime,
    arrivalTime,
    originCity,
    destinationCity,
    journeyDate,
    boardingPoint,
    droppingPoint,
    passengerDetails,
    contactDetails,
    boardingStopId,
    droppingStopId,
    userId,
    passengerId,
    paymentMethod,
  } = bookingParams || {};

  const tripId = bookingParams?.tripId || bookingParams?.trip_id;
  const busId = bookingParams?.busId || bookingParams?.bus_id;
  const operatorName = bookingParams?.operatorName || bookingParams?.operator_name;

  // If neither tripId, busId nor operatorName is passed, throw explicit error
  if (!tripId && !busId && !operatorName) {
    const err = new Error('Bus or trip identification is required for booking reservation.');
    err.code = 'MISSING_BUS_DETAILS';
    throw err;
  }

  // Find trip specifically by tripId or busId
  const t = trips.find((x) => (tripId && x.id === tripId) || (busId && x.bus_id === busId));
  const bus = buses.find((b) => (busId && b.id === busId) || (t && b.id === t.bus_id) || (busNumber && b.registration_number === busNumber));
  const travel = travels.find((tr) => tr.id === (t?.travel_id || bus?.travel_id)) || (operatorName ? { name: operatorName } : null);

  if (!t && !bus && !operatorName) {
    const err = new Error('Bus service specified for booking does not exist in active fleet.');
    err.code = 'BUS_NOT_FOUND';
    throw err;
  }

  if (t && (t.is_sample || t.status === 'sample' || t.verification_status === 'SAMPLE_DATA')) {
    const err = new Error('This bus service is a candidate route under commercial evaluation (SAMPLE DATA) and cannot accept live passenger bookings.');
    err.code = 'SAMPLE_DATA_UNBOOKABLE';
    throw err;
  }

  const finalOperator = operatorName || travel?.name || bus?.name || t?.travel_name;
  if (!finalOperator) {
    const err = new Error('Operator details missing for booking');
    err.code = 'OPERATOR_NOT_FOUND';
    throw err;
  }

  const effectiveTravel = travel || travels.find((tr) => tr.id === (t?.travel_id || bus?.travel_id));
  if (effectiveTravel && (effectiveTravel.verification_status === 'pending' || effectiveTravel.verification_status === 'rejected')) {
    const err = new Error('Public bookings cannot be accepted for an unverified travel operator.');
    err.code = 'OPERATOR_NOT_VERIFIED';
    throw err;
  }

  const finalBusReg = busNumber || bus?.registration_number || bus?.bus_number || t?.registration_number || '';
  const finalServiceNo = serviceNumber || t?.trip_number || bus?.service_number || bus?.bus_number || '';
  const finalDepTime = departureTime || t?.departure_time || '21:00';
  const finalArrTime = arrivalTime || t?.estimated_arrival_time || '05:00';

  const route = t ? routes.find((r) => r.id === t.route_id) : (routes.find((r) => r.source === originCity && r.destination === destinationCity) || routes[0]);
  const stops = t ? getStopsForTrip(t.id) : (route ? routeStops.filter((s) => s.route_id === route.id).sort((a, b) => a.stop_order - b.stop_order) : []);

  let bStop = boardingStopId ? (stops.find((s) => s.id === boardingStopId || s.route_stop_id === boardingStopId) || routeStops.find((s) => s.id === boardingStopId)) : null;
  if (!bStop && boardingPoint) {
    bStop = stops.find((s) => s.name.toLowerCase().includes(String(boardingPoint).toLowerCase()));
  }
  if (!bStop && !boardingStopId) {
    bStop = stops[0] || { id: 'stop-b', name: 'Boarding Point', stop_order: 1 };
  }

  let dStop = droppingStopId ? (stops.find((s) => s.id === droppingStopId || s.route_stop_id === droppingStopId) || routeStops.find((s) => s.id === droppingStopId)) : null;
  if (!dStop && droppingPoint) {
    dStop = stops.find((s) => s.name.toLowerCase().includes(String(droppingPoint).toLowerCase()));
  }
  if (!dStop && !droppingStopId) {
    dStop = stops[stops.length - 1] || { id: 'stop-d', name: 'Dropping Point', stop_order: stops.length || 2 };
  }

  if (bStop && dStop && bStop.stop_order >= dStop.stop_order) {
    const err = new Error('Boarding stop must precede dropping stop');
    err.code = 'INVALID_STOP_ORDER';
    throw err;
  }

  if (bStop && bStop.is_boarding_point === false) {
    const err = new Error(`Boarding is not permitted at ${bStop.name}`);
    err.code = 'INVALID_STOP_ELIGIBILITY';
    throw err;
  }
  if (dStop && dStop.is_dropping_point === false) {
    const err = new Error(`Dropping is not permitted at ${dStop.name}`);
    err.code = 'INVALID_STOP_ELIGIBILITY';
    throw err;
  }

  const effectiveTripId = t?.id || tripId;
  const effectiveJourneyDate = journeyDate || t?.departure_date || new Date().toISOString().split('T')[0];
  let reservations = effectiveTripId ? (tripSegmentReservations.get(effectiveTripId) || []) : [];
  const reqStartOrder = bStop?.stop_order !== undefined ? bStop.stop_order : 1;
  const reqEndOrder = dStop?.stop_order !== undefined ? dStop.stop_order : 999;

  for (const p of (passengerDetails || [])) {
    const seatNum = p.seatNumber;
    if (seatNum) {
      if (bStop && dStop && bStop.stop_order !== undefined && dStop.stop_order !== undefined) {
        if (hasSegmentConflict(reservations, seatNum, bStop.stop_order, dStop.stop_order)) {
          const err = new Error(`Seat ${seatNum} is already reserved for an overlapping journey segment (${bStop.name} to ${dStop.name})`);
          err.code = 'SEGMENT_CONFLICT';
          throw err;
        }
      }

      const conflictBooking = bookings.find((b) => {
        const isStatusActive = b.status !== 'cancelled' && b.status !== 'refunded' && b.status !== 'failed' && b.booking_status !== 'cancelled';
        if (!isStatusActive) return false;

        const matchesBus =
          (effectiveTripId && b.trip_id === effectiveTripId) ||
          (bus && (b.bus_id === bus.id || b.bus_number === bus.bus_number || b.registration_number === bus.registration_number));
        if (!matchesBus) return false;

        const bDate = b.journey_date || b.travel_date || b.departure_date || b.trip?.departure_date;
        if (bDate !== effectiveJourneyDate) return false;

        const hasSeat = (b.passengers || []).some((pax) => {
          const num = (pax.seat_number || pax.seatNumber || '').toUpperCase();
          const target = seatNum.toUpperCase();
          return num === target ||
            num === target.replace('LS', 'SL') ||
            num === target.replace('SL', 'LS') ||
            num === target.replace('L', 'S') ||
            num === target.replace('S', 'L');
        });
        if (!hasSeat) return false;

        // Seat matches! Check segment overlap:
        let bStartOrder = b.boarding_stop_order;
        let bEndOrder = b.dropping_stop_order;
        if (bStartOrder === undefined || bEndOrder === undefined) {
          const bFound = routeStops.find((s) => s.id === b.boarding_stop_id) || (stops || []).find((s) => s.id === b.boarding_stop_id || s.route_stop_id === b.boarding_stop_id);
          const dFound = routeStops.find((s) => s.id === b.dropping_stop_id) || (stops || []).find((s) => s.id === b.dropping_stop_id || s.route_stop_id === b.dropping_stop_id);
          bStartOrder = bFound?.stop_order !== undefined ? bFound.stop_order : 1;
          bEndOrder = dFound?.stop_order !== undefined ? dFound.stop_order : 999;
        }

        return bStartOrder < reqEndOrder && bEndOrder > reqStartOrder;
      });

      if (conflictBooking) {
        const err = new Error(`Seat ${seatNum} is already booked for an overlapping segment on ${effectiveJourneyDate}.`);
        err.code = (bStop && dStop && (boardingStopId || droppingStopId)) ? 'SEGMENT_CONFLICT' : 'SEAT_ALREADY_BOOKED';
        throw err;
      }
    }
  }

  // 1. Gather existing passenger bookings on this trip for Commercial Bus Gender Allocation Rules
  const existingPaxBookings = [];
  for (const b of bookings) {
    if (effectiveTripId && b.trip_id === effectiveTripId && b.status !== 'cancelled') {
      for (const pax of (b.passengers || [])) {
        existingPaxBookings.push({
          seatNumber: pax.seat_number,
          gender: pax.passenger_gender || pax.gender,
          bookingId: b.id,
        });
      }
    }
  }

  // 2. Intra-ticket check: passengers in passengerDetails belong to this same new booking (bId)
  const currentBookingId = `bkg-${uuidv4()}`;
  const genderValidation = validateSeatGenders(passengerDetails, DEFAULT_SEAT_PAIRS, existingPaxBookings, currentBookingId);
  if (!genderValidation.valid) {
    const err = new Error(genderValidation.message);
    err.code = 'GENDER_SEAT_RULE_VIOLATION';
    throw err;
  }

  const opUpper = String(finalOperator || '').toUpperCase();
  const prefix =
    opUpper.includes('SMART') ? 'SR' :
    opUpper.includes('VEE') ? 'VV' :
    opUpper.includes('TRANZ') ? 'TZ' :
    opUpper.includes('HORIZON') ? 'HZ' :
    opUpper.includes('KPN') ? 'KPN' :
    opUpper.includes('RATHI') ? 'RM' :
    opUpper.includes('VRL') ? 'VRL' :
    opUpper.includes('ORANGE') ? 'ORG' :
    opUpper.includes('KALLADA') ? 'KAL' :
    opUpper.includes('ZING') ? 'ZB' :
    opUpper.includes('INTRCITY') ? 'IC' :
    opUpper.includes('PURPLE') ? 'PP' :
    opUpper.includes('HANS') ? 'HT' :
    opUpper.includes('SHYAMOLI') ? 'SP' : 'SR';

  const pnrNumber = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  const bId = currentBookingId;

  let totalFare = 0;
  const paxList = (passengerDetails || []).map((p, idx) => {
    const f = Number(p.fare || t?.base_fare || 880);
    totalFare += f;
    return {
      id: `pax-${bId}-${idx}`,
      seat_number: p.seatNumber,
      passenger_name: p.name,
      passenger_age: p.age,
      passenger_gender: p.gender,
      fare: f,
      is_boarded: false,
    };
  });

  // Mark seats as booked
  if (effectiveTripId) {
    const tSeats = tripSeatsMap.get(effectiveTripId);
    if (tSeats) {
      paxList.forEach((p) => {
        const s = tSeats.find((seat) => seat.seat_number === p.seat_number);
        if (s) s.status = 'booked';
      });
    }

    // Register segment reservations
    paxList.forEach((p) => {
      reservations.push({
        bookingId: bId,
        pnrNumber,
        tripId: effectiveTripId,
        seatNumber: p.seat_number,
        boardingStopId: bStop.id,
        droppingStopId: dStop.id,
        boardingStopOrder: bStop.stop_order,
        droppingStopOrder: dStop.stop_order,
        createdAt: new Date().toISOString(),
      });
    });
    tripSegmentReservations.set(effectiveTripId, reservations);
  }


  const newBooking = {
    id: bId,
    pnr: pnrNumber,
    pnr_number: pnrNumber,
    travel_id: t?.travel_id || bus?.travel_id || travel?.id,
    travel_name: finalOperator,
    operator_name: finalOperator,
    operatorName: finalOperator,
    bus_id: bus?.id || busId,
    bus_number: finalBusReg,
    busNumber: finalBusReg,
    bus_registration_number: finalBusReg,
    registration_number: finalBusReg,
    registrationNumber: finalBusReg,
    service_number: finalServiceNo,
    serviceNumber: finalServiceNo,
    trip_number: finalServiceNo,
    tripId: effectiveTripId,
    trip_id: effectiveTripId,
    user_id: userId || passengerId || passenger1Id,
    passenger_id: userId || passengerId || passenger1Id,
    boarding_stop_id: bStop.id,
    dropping_stop_id: dStop.id,
    boarding_stop_order: bStop.stop_order,
    dropping_stop_order: dStop.stop_order,
    boarding_stop_name: boardingPoint || bStop.name,
    dropping_stop_name: droppingPoint || dStop.name,
    boardingPoint: boardingPoint || bStop.name,
    droppingPoint: droppingPoint || dStop.name,
    source: originCity || route?.source,
    destination: destinationCity || route?.destination,
    source_city: originCity || route?.source,
    destination_city: destinationCity || route?.destination,
    journey_date: effectiveJourneyDate,
    travel_date: effectiveJourneyDate,
    departure_date: effectiveJourneyDate,
    departure_time: finalDepTime,
    departureTime: finalDepTime,
    arrival_time: finalArrTime,
    estimated_arrival_time: finalArrTime,
    total_fare: totalFare,
    total_amount: totalFare,
    booking_status: 'confirmed',
    payment_status: 'paid',
    contact_name: contactDetails?.name || 'Passenger',
    contact_email: contactDetails?.email || 'passenger@smartroute.in',
    contact_mobile: contactDetails?.phone || '9000000006',
    created_at: new Date().toISOString(),
    trip: {
      trip_number: finalServiceNo,
      service_number: finalServiceNo,
      departure_date: effectiveJourneyDate,
      departure_time: finalDepTime,
      estimated_arrival_time: finalArrTime,
      bus_name: bus?.name || finalOperator,
      registration_number: finalBusReg,
      bus_number: finalBusReg,
      travel_name: finalOperator,
      operator_name: finalOperator,
      route_name: route?.name || `${originCity || 'Origin'} ➔ ${destinationCity || 'Destination'}`,
      source: originCity || route?.source,
      destination: destinationCity || route?.destination,
      boarding_stop_name: boardingPoint || bStop.name,
      dropping_stop_name: droppingPoint || dStop.name,
      boarding_time: finalDepTime,
      dropping_time: finalArrTime,
    },
    bus: {
      id: bus?.id || busId,
      name: bus?.name || finalOperator,
      operatorName: finalOperator,
      operator_name: finalOperator,
      serviceNumber: finalServiceNo,
      service_number: finalServiceNo,
      registrationNumber: finalBusReg,
      registration_number: finalBusReg,
      busNumber: finalBusReg,
      bus_type: bus?.bus_type || 'AC Sleeper 2+1',
    },
    passengers: paxList,
  };

  bookings.unshift(newBooking);

  paxList.forEach((p) => {
    manifests.push({
      id: p.id,
      booking_id: bId,
      pnr_number: pnrNumber,
      seat_number: p.seat_number,
      passenger_name: p.passenger_name,
      passenger_age: p.passenger_age,
      passenger_gender: p.passenger_gender,
      contact_mobile: contactDetails?.phone || '9000000006',
      boarding_stop: bStop.name,
      is_boarded: false,
    });
  });

  const paymentRecord = {
    id: `pay-${bId}`,
    booking_id: bId,
    user_id: userId || passengerId || passenger1Id,
    payment_order_id: `ord_${bId}`,
    payment_id: `pay_${pnrNumber}_txn`,
    payment_signature: `sig_${bId}`,
    method: paymentMethod || 'upi',
    status: 'completed',
    amount: totalFare,
    currency: 'INR',
    provider: 'razorpay',
    failure_reason: null,
    created_at: new Date().toISOString(),
  };
  payments.unshift(paymentRecord);

  savePersistentStore();

  return newBooking;
}

export function getBookingByPnr(pnr) {
  const clean = String(pnr || '').toUpperCase().trim();
  if (!clean) return null;
  return bookings.find((b) => (b.pnr_number && b.pnr_number.toUpperCase() === clean) || b.id === clean || b.id === pnr) || null;
}

export function getDriverTrip(driverId) {
  const t = trips.find((x) => x.driver_id === driverId) || trips[0];
  const bus = buses.find((b) => b.id === t.bus_id) || buses[0];
  const route = routes.find((r) => r.id === t.route_id) || routes[0];

  return {
    id: t.id,
    trip_number: t.trip_number,
    departure_date: t.departure_date,
    departure_time: t.departure_time,
    estimated_arrival_time: t.estimated_arrival_time,
    status: t.status,
    bus_name: bus.name,
    registration_number: bus.registration_number,
    route_name: route.name,
    source: route.source,
    destination: route.destination,
    current_stop: 'Coimbatore Omni Bus Stand',
  };
}

export function getDriverManifest(tripId) {
  return manifests;
}

export function updatePassengerBoarding(passengerId, status) {
  const pax = manifests.find((m) => m.id === passengerId || m.seat_number === passengerId);
  if (pax) {
    pax.is_boarded = status === 'boarded';
    return { success: true, passenger: pax };
  }
  return { success: false, error: 'Passenger record not found' };
}

// ======================== REAL-TIME GPS TELEMETRY STORE ========================
export const tripTelemetryMap = new Map();

// Initialize primary trip telemetry baseline
tripTelemetryMap.set(primaryTripId, {
  bus_id: buses[0].id,
  trip_id: primaryTripId,
  driver_id: driver1Id,
  latitude: 10.995,
  longitude: 77.0002,
  speed: 64,
  heading: 142,
  current_stop_id: 'stop-103',
  next_stop_name: 'Singanallur',
  eta: '15 mins',
  recorded_at: new Date().toISOString(),
  recorded_at_ms: Date.now(),
});

/**
 * Record live GPS telemetry for a trip
 */
export function setTripTelemetry(tripId, telemetry) {
  if (!tripId) return null;
  const recordedAt = telemetry.recorded_at ? new Date(telemetry.recorded_at) : new Date();
  const recordedAtMs = telemetry.recorded_at_ms || recordedAt.getTime();
  const entry = {
    ...telemetry,
    trip_id: tripId,
    latitude: Number(telemetry.latitude),
    longitude: Number(telemetry.longitude),
    speed: Number(telemetry.speed || 0),
    heading: Number(telemetry.heading || 0),
    recorded_at: telemetry.recorded_at || recordedAt.toISOString(),
    recorded_at_ms: recordedAtMs,
  };
  tripTelemetryMap.set(tripId, entry);
  latestGps = { ...entry };
  return entry;
}

export function updateGpsLocation({ busId, tripId, driverId, latitude, longitude, speed, heading, current_stop_id, next_stop_name, eta }) {
  const effectiveTripId = tripId || primaryTripId;
  return setTripTelemetry(effectiveTripId, {
    bus_id: busId || buses[0].id,
    driver_id: driverId || driver1Id,
    latitude,
    longitude,
    speed,
    heading,
    current_stop_id,
    next_stop_name,
    eta,
  });
}

export function getTripTelemetry(tripId) {
  if (!tripId) return null;
  const data = tripTelemetryMap.get(tripId);
  if (!data) return null;

  const ageMs = Date.now() - (data.recorded_at_ms || 0);
  const isStale = ageMs > 5 * 60 * 1000; // > 5 minutes

  return {
    ...data,
    ageSeconds: Math.round(ageMs / 1000),
    isStale,
    status: isStale ? 'stale' : 'active',
  };
}

export function getTripTrackingPayload(tripId, booking = null) {
  const targetId = tripId || trips[0]?.id;
  const trip = trips.find((t) => t.id === targetId);
  if (!trip) return null;

  const bus = buses.find((b) => b.id === trip.bus_id) || buses[0];
  const route = routes.find((r) => r.id === trip.route_id) || routes[0];
  const travel = travels.find((tr) => tr.id === trip.travel_id) || travels[0];
  const driver = users.find((u) => u.id === trip.driver_id && u.role === 'driver') || null;

  const stops = getStopsForTrip(trip.id);
  const telemetry = getTripTelemetry(trip.id);

  const currentStopId = telemetry?.current_stop_id;
  const currentStopIndex = stops.findIndex((s) => s.id === currentStopId);

  const [depHours, depMins] = (trip.departure_time || '21:00').split(':').map(Number);
  const depBaseDate = new Date();
  depBaseDate.setHours(depHours || 21, depMins || 0, 0, 0);

  const formattedStops = stops.map((stop, idx) => {
    const isPassed = currentStopIndex !== -1 ? idx < currentStopIndex : false;
    const isCurrent = currentStopIndex !== -1 ? idx === currentStopIndex : false;

    const stopArrivalDate = new Date(depBaseDate.getTime() + (stop.estimated_time_from_start_minutes || 0) * 60000);
    const schedHours = String(stopArrivalDate.getHours()).padStart(2, '0');
    const schedMins = String(stopArrivalDate.getMinutes()).padStart(2, '0');
    const scheduledTime = `${schedHours}:${schedMins}`;

    return {
      id: stop.id,
      name: stop.name,
      stop_name: stop.name,
      city: stop.city,
      latitude: stop.latitude,
      longitude: stop.longitude,
      stop_order: stop.stop_order,
      distance_km: stop.distance_from_start_km || idx * 25,
      estimated_time_from_start_minutes: stop.estimated_time_from_start_minutes || idx * 30,
      scheduled_time: scheduledTime,
      is_boarding_point: Boolean(stop.is_boarding_point),
      is_dropping_point: Boolean(stop.is_dropping_point),
      is_passed: isPassed,
      is_current: isCurrent,
      platform: stop.is_boarding_point ? `Bay ${((idx % 4) + 1)}` : `Platform ${((idx % 3) + 1)}`,
    };
  });

  return {
    trip: {
      id: trip.id,
      trip_number: trip.trip_number,
      departure_time: trip.departure_time,
      departure_date: trip.departure_date,
      estimated_arrival_time: trip.estimated_arrival_time,
      status: trip.status,
    },
    travel: {
      id: travel?.id || booking?.travel_id,
      name: booking?.travel_name || booking?.operator_name || travel?.name || 'Carrier Partner',
    },
    bus: {
      id: bus?.id || booking?.bus_id,
      bus_number: booking?.bus_number || booking?.busNumber || bus?.bus_number || 'SR-EXP-001',
      registration_number: booking?.registration_number || booking?.bus_registration_number || booking?.busNumber || bus?.registration_number || 'TN-38-SR-0001',
      bus_type: bus?.bus_type || 'AC Sleeper 2+1',
      name: bus?.name || booking?.travel_name || 'Flagship Pioneer',
      amenities: bus?.amenities || 'WiFi, AC, Charging Point, Blankets, Reading Lights',
    },
    driver: driver ? {
      id: driver.id,
      name: `${driver.first_name} ${driver.last_name || ''}`.trim(),
      mobile: driver.mobile,
      license_number: driver.license_number,
    } : {
      name: 'Muthu Krishnan',
      mobile: '+91 90000 00001',
      license_number: 'TN38-HMV-VERIFIED',
    },
    route: {
      id: route?.id,
      name: route?.name || `${route?.source} ➔ ${route?.destination}`,
      source: route?.source,
      destination: route?.destination,
      distance_km: route?.distance_km || 345,
    },
    stops: formattedStops,
    liveGps: telemetry ? {
      hasLiveGps: true,
      status: telemetry.status || 'active',
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      speed: telemetry.speed || 0,
      heading: telemetry.heading || 0,
      current_stop_id: telemetry.current_stop_id,
      next_stop_name: telemetry.next_stop_name || (stops[1]?.name || 'En Route'),
      eta: telemetry.eta || '15 mins',
      recorded_at: telemetry.recorded_at,
      ageSeconds: telemetry.ageSeconds,
      isStale: telemetry.isStale,
    } : {
      hasLiveGps: false,
      latitude: null,
      longitude: null,
      status: 'standby',
      reason: 'Coach scheduled departure on standby at departure terminal. Live GPS telemetry broadcasting begins 30 mins prior to departure.',
    },
    booking: booking ? {
      pnr: booking.pnr_number || booking.id,
      contact_name: booking.contact_name,
      contact_mobile: booking.contact_mobile,
      seat_numbers: booking.seat_numbers || (booking.passengers || []).map((p) => p.seat_number).join(', '),
      boarding_stop_id: booking.boarding_stop_id,
      boarding_stop_name: booking.boarding_stop_name,
      dropping_stop_id: booking.dropping_stop_id,
      dropping_stop_name: booking.dropping_stop_name,
    } : null,
  };
}

export function getActiveTrackingTrips() {
  return trips.slice(0, 10).map((t) => {
    const bus = buses.find((b) => b.id === t.bus_id) || buses[0];
    const route = routes.find((r) => r.id === t.route_id) || routes[0];
    const travel = travels.find((tr) => tr.id === t.travel_id) || travels[0];
    const telemetry = getTripTelemetry(t.id);
    return {
      id: t.id,
      tripId: t.id,
      trip_number: t.trip_number,
      tripNumber: t.trip_number,
      departure_time: t.departure_time,
      departure_date: t.departure_date,
      status: t.status,
      source: route.source,
      destination: route.destination,
      route_name: route.name,
      bus_number: bus.bus_number,
      registration_number: bus.registration_number,
      registrationNumber: bus.registration_number,
      bus_type: bus.bus_type,
      travel_name: travel.name,
      hasLiveGps: Boolean(telemetry && !telemetry.isStale),
      speed: telemetry?.speed || 0,
      next_stop_name: telemetry?.next_stop_name || '',
      last_updated: telemetry?.recorded_at || null,
    };
  });
}

export function getOwnerStats() {
  return {
    totalTrips: trips.length,
    activeBuses: buses.filter((b) => b.is_active).length,
    totalBookings: 348,
    totalRevenue: 512400,
    totalPassengers: 720,
    activeDrivers: 12,
    activeRoutes: routes.length,
  };
}

/**
 * Get route coverage and verified service distribution analytics
 */
export function getRouteCoverageReport() {
  return busInventoryApiService.generateCoverageReport(routes, trips, buses);
}

/**
 * Retrieve all bus services for a specific route ID
 */
export function getBusServicesForRoute(routeId, { includeSample = true } = {}) {
  if (!routeId) return [];
  return trips.filter((t) => {
    if (t.route_id !== routeId) return false;
    if (!includeSample && (t.is_sample || t.status === 'sample' || t.verification_status === 'SAMPLE_DATA')) {
      return false;
    }
    return true;
  });
}

// ======================== MANAGER MANAGEMENT (IN-MEMORY) ========================

/**
 * Get all managers belonging to a specific travel company
 */
export function getManagersByTravelId(travelId) {
  return users.filter((u) => u.travel_id === travelId && u.role === 'manager' && u.status !== 'deleted');
}

/**
 * Create a new manager in the in-memory store
 */
export function createManagerInStore({ travelId, email, mobile, passwordHash, firstName, lastName, designation, department, canCreateStaff = false, canCreateDriver = true, canApproveApplications = true, addedBy }) {
  const cleanEmail = email ? String(email).toLowerCase().trim() : null;
  const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : null;
  const newManager = {
    id: uuidv4(),
    email: cleanEmail,
    mobile: cleanMobile,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName || null,
    role: 'manager',
    status: 'active',
    travel_id: travelId,
    designation: designation || 'Operations Manager',
    department: department || null,
    can_create_staff: canCreateStaff,
    can_create_driver: canCreateDriver,
    can_approve_applications: canApproveApplications,
    added_by: addedBy || null,
    email_verified: false,
    mobile_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.push(newManager);
  return newManager;
}

/**
 * Update a manager's profile in-memory
 */
export function updateManagerInStore(managerId, travelId, updates) {
  const idx = users.findIndex((u) => u.id === managerId && u.travel_id === travelId && u.role === 'manager');
  if (idx === -1) return null;
  const allowed = ['first_name', 'last_name', 'designation', 'department', 'status', 'mobile', 'can_create_staff', 'can_create_driver', 'can_approve_applications', 'permissions'];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) users[idx][field] = updates[field];
  });
  users[idx].updated_at = new Date().toISOString();
  return users[idx];
}

/**
 * Deactivate a manager account
 */
export function deactivateManagerInStore(managerId, travelId) {
  const manager = users.find((u) => u.id === managerId && u.travel_id === travelId && u.role === 'manager');
  if (!manager) return null;
  manager.status = 'deactivated';
  manager.updated_at = new Date().toISOString();
  return manager;
}

// ======================== DRIVER MANAGEMENT (IN-MEMORY) ========================

/**
 * Get all drivers belonging to a specific travel company
 */
export function getDriversByTravelId(travelId) {
  return users.filter((u) => u.travel_id === travelId && u.role === 'driver' && u.status !== 'deleted');
}

/**
 * Create a new driver in the in-memory store
 */
export function createDriverInStore({ travelId, email, mobile, passwordHash, firstName, lastName, licenseNumber, licenseType, experienceYears, assignedBusId, addedBy }) {
  const cleanEmail = email ? String(email).toLowerCase().trim() : null;
  const cleanMobile = mobile ? String(mobile).replace(/\D/g, '').slice(-10) : null;
  const newDriver = {
    id: uuidv4(),
    email: cleanEmail,
    mobile: cleanMobile,
    password_hash: passwordHash,
    first_name: firstName,
    last_name: lastName || null,
    role: 'driver',
    status: 'active',
    travel_id: travelId,
    license_number: licenseNumber || null,
    license_type: licenseType || 'HMV',
    experience_years: experienceYears || 0,
    assigned_bus_id: assignedBusId || null,
    added_by: addedBy || null,
    is_available: true,
    email_verified: false,
    mobile_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.push(newDriver);
  return newDriver;
}

/**
 * Update a driver's profile in-memory
 */
export function updateDriverInStore(driverId, travelId, updates) {
  const idx = users.findIndex((u) => u.id === driverId && u.travel_id === travelId && u.role === 'driver');
  if (idx === -1) return null;
  const allowed = ['first_name', 'last_name', 'license_number', 'license_type', 'experience_years', 'assigned_bus_id', 'status', 'mobile', 'is_available'];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) users[idx][field] = updates[field];
  });
  users[idx].updated_at = new Date().toISOString();
  return users[idx];
}

/**
 * Deactivate a driver account
 */
export function deactivateDriverInStore(driverId, travelId) {
  const driver = users.find((u) => u.id === driverId && u.travel_id === travelId && u.role === 'driver');
  if (!driver) return null;
  driver.status = 'deactivated';
  driver.is_available = false;
  driver.updated_at = new Date().toISOString();
  return driver;
}

// ======================== OPERATOR STATS (EXTENDED) ========================

/**
 * Get company-specific stats for an operator/manager dashboard
 */
export function getTravelStats(travelId) {
  const companyBuses = buses.filter((b) => b.travel_id === travelId && b.is_active);
  const companyRoutes = routes.filter((r) => r.travel_id === travelId && r.is_active !== false);
  const companyTrips = trips.filter((t) => t.travel_id === travelId && !t.is_sample);
  const companyBookings = bookings.filter((b) => b.travel_id === travelId);
  const companyManagers = users.filter((u) => u.travel_id === travelId && u.role === 'manager' && u.status === 'active');
  const companyDrivers = users.filter((u) => u.travel_id === travelId && u.role === 'driver' && u.status === 'active');
  const upcomingTrips = companyTrips.filter((t) => ['published', 'boarding'].includes(t.status));
  const confirmedBookings = companyBookings.filter((b) => ['confirmed', 'completed'].includes(b.booking_status));

  return {
    buses: companyBuses.length,
    routes: companyRoutes.length,
    trips: companyTrips.length,
    upcomingTrips: upcomingTrips.length,
    bookings: confirmedBookings.length,
    managers: companyManagers.length,
    drivers: companyDrivers.length,
    totalRevenue: confirmedBookings.reduce((sum, b) => sum + (b.total_fare || 0), 0),
    activeBuses: companyBuses.filter((b) => b.is_active).length,
    availableDrivers: companyDrivers.filter((u) => u.is_available !== false).length,
  };
}

/**
 * Get buses belonging to a specific travel company
 */
export function getBusesByTravelId(travelId) {
  return buses.filter((b) => b.travel_id === travelId);
}

/**
 * Get routes belonging to a specific travel company
 */
export function getRoutesByTravelId(travelId) {
  return routes.filter((r) => r.travel_id === travelId);
}

/**
 * Get bookings belonging to a specific travel company
 */
export function getBookingsByTravelId(travelId, { status } = {}) {
  let result = bookings.filter((b) => b.travel_id === travelId);
  if (status) result = result.filter((b) => b.booking_status === status);
  return result;
}

/**
 * Register a new travel company and owner in the in-memory store
 */
export function registerTravelCompany({ name, businessName, gstNumber, contactEmail, contactMobile, city, state, pincode, businessAddress, website, ownerId: ownerUserId }) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newTravel = {
    id: uuidv4(),
    owner_id: ownerUserId,
    name,
    slug,
    business_name: businessName || name,
    gst_number: gstNumber || null,
    contact_email: contactEmail || null,
    contact_mobile: contactMobile || null,
    city: city || null,
    state: state || null,
    pincode: pincode || null,
    business_address: businessAddress || null,
    website: website || null,
    verification_status: 'pending',
    status: 'active',
    badge: 'New Operator',
    rating: 0,
    reviews_count: 0,
    description: `${name} — Newly registered travel operator`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  travels.push(newTravel);

  // Link owner to travel
  const owner = users.find((u) => u.id === ownerUserId);
  if (owner) {
    owner.travel_id = newTravel.id;
    owner.updated_at = new Date().toISOString();
  }

  savePersistentStore();
  return newTravel;
}

/**
 * Get a travel company by ID
 */
export function getTravelById(travelId) {
  return travels.find((t) => t.id === travelId) || null;
}

// ======================== MANAGER PERMISSIONS & LEAST-PRIVILEGE DEFAULTS ========================

export const DEFAULT_MANAGER_PERMISSIONS = {
  manage_buses: true,
  manage_routes: true,
  manage_drivers: true,
  view_bookings: true,
  export_reports: true,
  edit_fares: false,
  process_cancellations: false,
  approve_refunds: false,
  add_staff: false,
};

/**
 * Get configured permissions for a specific manager
 */
export function getManagerPermissionsFromStore(managerId, travelId) {
  const mgr = users.find((u) => u.id === managerId && u.travel_id === travelId && u.role === 'manager');
  if (!mgr) return null;

  const current = mgr.permissions || {};
  return {
    ...DEFAULT_MANAGER_PERMISSIONS,
    ...current,
    manage_drivers: mgr.can_create_driver !== undefined ? mgr.can_create_driver : (current.manage_drivers !== undefined ? current.manage_drivers : DEFAULT_MANAGER_PERMISSIONS.manage_drivers),
    add_staff: mgr.can_create_staff !== undefined ? mgr.can_create_staff : (current.add_staff !== undefined ? current.add_staff : DEFAULT_MANAGER_PERMISSIONS.add_staff),
    manage_routes: mgr.can_approve_applications !== undefined ? mgr.can_approve_applications : (current.manage_routes !== undefined ? current.manage_routes : DEFAULT_MANAGER_PERMISSIONS.manage_routes),
  };
}

/**
 * Update configured permissions for a specific manager
 */
export function updateManagerPermissionsInStore(managerId, travelId, newPermissions) {
  const mgr = users.find((u) => u.id === managerId && u.travel_id === travelId && u.role === 'manager');
  if (!mgr) return null;

  mgr.permissions = {
    ...(mgr.permissions || DEFAULT_MANAGER_PERMISSIONS),
    ...newPermissions,
  };

  if (newPermissions.manage_drivers !== undefined) mgr.can_create_driver = Boolean(newPermissions.manage_drivers);
  if (newPermissions.add_staff !== undefined) mgr.can_create_staff = Boolean(newPermissions.add_staff);
  if (newPermissions.manage_routes !== undefined) mgr.can_approve_applications = Boolean(newPermissions.manage_routes);

  mgr.updated_at = new Date().toISOString();
  return mgr.permissions;
}

/**
 * Get trips belonging to a specific travel company
 */
export function getTripsByTravelId(travelId) {
  return trips.filter((t) => t.travel_id === travelId);
}

/**
 * Create a new trip in the store
 */
export function createTripInStore(tripData) {
  const travel = travels.find((t) => t.id === tripData.travel_id);
  const tripStatus = (tripData.status || 'published').toLowerCase();
  const vStatus = (travel?.verification_status || '').toLowerCase();
  if (tripStatus === 'published' && travel && (vStatus === 'pending' || vStatus === 'rejected')) {
    const err = new Error('OPERATOR_NOT_VERIFIED: Operator registration is pending administrative verification. Cannot publish trips for public seat sales until approved by Super Admin.');
    err.code = 'OPERATOR_NOT_VERIFIED';
    throw err;
  }

  const newTrip = {
    id: tripData.id || `trp-${Date.now()}`,
    travel_id: tripData.travel_id,
    bus_id: tripData.bus_id,
    route_id: tripData.route_id,
    driver_id: tripData.driver_id || null,
    trip_number: tripData.trip_number || `SR-${Math.floor(100 + Math.random() * 900)}`,
    departure_date: tripData.departure_date,
    departure_time: tripData.departure_time,
    estimated_arrival_time: tripData.estimated_arrival_time || '06:00',
    boarding_points: tripData.boarding_points || [],
    dropping_points: tripData.dropping_points || [],
    status: tripData.status || 'published',
    base_fare: tripData.base_fare || 880,
    total_booked_seats: 0,
    total_available_seats: tripData.total_seats || 36,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  trips.push(newTrip);
  return newTrip;
}

/**
 * Update trip in store with safeguard against completed trips
 */
export function updateTripInStore(tripId, travelId, updates) {
  const trip = trips.find((t) => t.id === tripId && t.travel_id === travelId);
  if (!trip) return null;
  if (trip.status === 'completed') {
    return { error: 'CANNOT_MODIFY_COMPLETED_TRIP' };
  }
  Object.assign(trip, updates, { updated_at: new Date().toISOString() });
  return trip;
}

/**
 * Check schedule conflicts for coaches and drivers
 */
export function checkScheduleConflictsInStore(travelId, { busId, driverId, departureDate, departureTime, excludeTripId }) {
  const companyTrips = trips.filter((t) => t.travel_id === travelId && t.id !== excludeTripId && t.status !== 'cancelled');
  const conflicts = [];

  if (departureDate && departureTime) {
    const tripHour = parseInt(departureTime.split(':')[0], 10) || 0;
    for (const t of companyTrips) {
      if (t.departure_date === departureDate) {
        const otherHour = parseInt((t.departure_time || '00:00').split(':')[0], 10) || 0;
        const timeDiff = Math.abs(tripHour - otherHour);
        if (timeDiff < 4) {
          if (busId && t.bus_id === busId) {
            conflicts.push({
              type: 'bus_overlap',
              message: `Bus is already scheduled for trip ${t.trip_number || t.id} at ${t.departure_time} on ${departureDate}`,
              conflictingTrip: t,
            });
          }
          if (driverId && t.driver_id === driverId) {
            conflicts.push({
              type: 'driver_overlap',
              message: `Driver is already rostered for trip ${t.trip_number || t.id} at ${t.departure_time} on ${departureDate}`,
              conflictingTrip: t,
            });
          }
        }
      }
    }
  }
  return conflicts;
}

/**
 * Check if a bus can be permanently deleted
 */
export function canDeleteBusInStore(busId) {
  const hasTrips = trips.some((t) => t.bus_id === busId);
  const busObj = buses.find((b) => b.id === busId);
  const hasBookings = bookings.some((b) => b.bus_id === busId || (busObj && b.trip?.registration_number === busObj.registration_number));
  return !hasTrips && !hasBookings;
}

/**
 * Create a new bus in the store
 */
export function createBusInStore(busData) {
  const mfr = busData.manufacturer || busData.chassis_make || busData.chassisMake || 'Tata';
  const mdl = busData.model || busData.chassis_model || busData.chassisModel || 'LPO 1618';
  const custName = (busData.custom_name && String(busData.custom_name).trim())
    ? String(busData.custom_name).trim()
    : ((busData.customName && String(busData.customName).trim()) ? String(busData.customName).trim() : null);
  const dispName = custName || busData.display_name || busData.name || `${mfr} ${mdl}`;

  const newBus = {
    id: busData.id || `bus-${Date.now()}`,
    travel_id: busData.travel_id,
    registration_number: busData.registration_number,
    bus_number: busData.bus_number || busData.registration_number,
    name: dispName,
    display_name: dispName,
    manufacturer: mfr,
    model: mdl,
    custom_name: custName,
    chassis_make: mfr,
    chassis_model: mdl,
    chassis: busData.chassis || `${mfr} ${mdl}`,
    chassis_id: busData.chassis_id || busData.chassisId,
    layout_classification: busData.layout_classification || busData.layoutClassification || 'Seater-Cum-Sleeper',
    count_summary: busData.count_summary || busData.countSummary || 'S24 + B24 + D1 = 49',
    driver_count: busData.driver_count || busData.driverCount || 1,
    total_capacity: busData.total_capacity || busData.totalCapacity || ((busData.total_seats || 36) + 1),
    bus_type: busData.bus_type || 'AC Sleeper 2+1',
    layout_type: busData.layout_type || busData.layoutType || 'combo_48',
    layout_name: busData.layout_name || busData.layoutName || '',
    total_seats: busData.total_seats || busData.totalSeats || 36,
    seat_pricing: busData.seat_pricing || busData.seatPricing || {},
    seating_map: busData.seating_map || busData.seatingMap || [],
    fare_config: busData.fare_config || busData.fareConfig || {},
    assigned_route: busData.assigned_route || busData.assignedRoute || '',
    route_id: busData.route_id || busData.routeId || '',
    departure_time: busData.departure_time || busData.departureTime || '',
    arrival_time: busData.arrival_time || busData.arrivalTime || '',
    amenities: busData.amenities || ['WiFi', 'AIS-140 GPS', 'Charging Ports', 'AC'],
    is_active: busData.is_active !== false,
    status: busData.status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  buses.push(newBus);
  savePersistentStore();
  return newBus;
}

/**
 * Update bus in the store
 */
export function updateBusInStore(busId, travelId, updates) {
  const bus = buses.find((b) => b.id === busId && b.travel_id === travelId);
  if (!bus) return null;
  Object.assign(bus, updates, { updated_at: new Date().toISOString() });
  return bus;
}

/**
 * Delete bus from store with history check
 */
export function deleteBusInStore(busId, travelId) {
  const idx = buses.findIndex((b) => b.id === busId && b.travel_id === travelId);
  if (idx === -1) return { error: 'NOT_FOUND' };
  if (!canDeleteBusInStore(busId)) {
    return { error: 'CANNOT_DELETE_BUS_WITH_HISTORY' };
  }
  const [removed] = buses.splice(idx, 1);
  return { success: true, bus: removed };
}

/**
 * Cancel passenger booking in store (with seat release & refund creation)
 */
export function cancelPassengerBooking(bookingIdOrPnr, userId, { reason, isPrivileged = false, userEmail = null } = {}) {
  const cleanId = String(bookingIdOrPnr || '').trim().toUpperCase();
  const booking = bookings.find((b) =>
    b.id === bookingIdOrPnr ||
    (b.pnr_number && b.pnr_number.toUpperCase() === cleanId) ||
    b.pnr === bookingIdOrPnr
  );
  if (!booking) {
    const err = new Error('Booking not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Permission check
  const isOwner = userId && (
    booking.user_id === userId ||
    booking.passenger_id === userId ||
    (userEmail && booking.contact_email && booking.contact_email.toLowerCase() === userEmail.toLowerCase())
  );
  if (!isOwner && !isPrivileged) {
    const err = new Error('Unauthorized to cancel this booking');
    err.code = 'FORBIDDEN';
    throw err;
  }

  if (booking.status === 'cancelled' || booking.booking_status === 'cancelled') {
    const err = new Error('Booking is already cancelled');
    err.code = 'ALREADY_CANCELLED';
    throw err;
  }

  const nowIso = new Date().toISOString();
  const totalFare = Number(booking.total_fare || booking.total_amount || 0);
  const cancellationFee = Math.round(totalFare * 0.10); // 10% standard cancellation fee
  const refundAmount = Math.max(0, totalFare - cancellationFee);
  const refundId = `REF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  booking.status = 'cancelled';
  booking.booking_status = 'cancelled';
  booking.cancelled_at = nowIso;
  booking.cancellation_reason = reason || 'Cancelled by passenger';
  booking.cancellation_fee = cancellationFee;
  booking.refund_amount = refundAmount;
  booking.refund_status = 'completed';
  booking.refund_reference = refundId;

  // Release segment reservations
  if (booking.trip_id && tripSegmentReservations.has(booking.trip_id)) {
    const resList = tripSegmentReservations.get(booking.trip_id) || [];
    const remaining = resList.filter((r) => r.bookingId !== booking.id && r.pnrNumber !== booking.pnr_number);
    tripSegmentReservations.set(booking.trip_id, remaining);
  }

  // Release seats in tripSeatsMap
  if (booking.trip_id && tripSeatsMap.has(booking.trip_id)) {
    const tSeats = tripSeatsMap.get(booking.trip_id) || [];
    const bookedSeatNums = new Set((booking.passengers || []).map((p) => p.seat_number));
    tSeats.forEach((s) => {
      if (bookedSeatNums.has(s.seat_number)) {
        s.status = 'available';
      }
    });
  }

  // Update existing payment
  let payment = payments.find((p) => p.booking_id === booking.id);
  if (payment) {
    payment.status = refundAmount === totalFare ? 'refunded' : 'partially_refunded';
  }

  // Create refund record
  const refundRecord = {
    id: `ref-${uuidv4()}`,
    payment_id: payment ? payment.id : null,
    booking_id: booking.id,
    pnr_number: booking.pnr_number,
    refund_id: refundId,
    amount: refundAmount,
    cancellation_fee: cancellationFee,
    reason: reason || 'Cancelled by passenger',
    status: 'completed',
    initiated_by: userId || 'system',
    created_at: nowIso,
  };
  refunds.unshift(refundRecord);

  savePersistentStore();

  return {
    booking,
    refund: refundRecord,
  };
}

/**
 * Cancel booking in store
 */
export function cancelBookingInStore(bookingId, travelId, { refundAmount = 0, reason } = {}) {
  const booking = bookings.find((b) => (b.id === bookingId || b.pnr_number === bookingId) && b.travel_id === travelId);
  if (!booking) return null;

  booking.booking_status = 'cancelled';
  booking.status = 'cancelled';
  booking.cancelled_at = new Date().toISOString();
  booking.cancellation_reason = reason || 'Customer requested assistance';
  if (refundAmount > 0) {
    booking.refund_amount = refundAmount;
    booking.refund_status = 'processed';
  }
  savePersistentStore();
  return booking;
}

// ======================== LOCAL DISK PERSISTENCE FOR DEV MODE ========================

const SEED_USER_IDS = new Set(users.map((u) => u.id));
const SEED_TRAVEL_IDS = new Set(travels.map((t) => t.id));
const SEED_BUS_IDS = new Set(buses.map((b) => b.id));
const SEED_TRIP_IDS = new Set(trips.map((t) => t.id));
const SEED_BOOKING_IDS = new Set(bookings.map((b) => b.id));
const SEED_PAYMENT_IDS = new Set(payments.map((p) => p.id));
const SEED_REFUND_IDS = new Set(refunds.map((r) => r.id));

export function savePersistentStore() {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const dataDir = path.dirname(PERSISTENT_STORE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dynamicUsers = users.filter((u) => !SEED_USER_IDS.has(u.id));
    const dynamicTravels = travels.filter((t) => !SEED_TRAVEL_IDS.has(t.id));
    const dynamicBuses = buses.filter((b) => !SEED_BUS_IDS.has(b.id));
    const dynamicTrips = trips.filter((t) => !SEED_TRIP_IDS.has(t.id));
    const dynamicBookings = bookings.filter((b) => !SEED_BOOKING_IDS.has(b.id));
    const dynamicPayments = payments.filter((p) => !SEED_PAYMENT_IDS.has(p.id));
    const dynamicRefunds = refunds.filter((r) => !SEED_REFUND_IDS.has(r.id));

    const payload = {
      users: dynamicUsers,
      travels: dynamicTravels,
      buses: dynamicBuses,
      trips: dynamicTrips,
      bookings: dynamicBookings,
      payments: dynamicPayments,
      refunds: dynamicRefunds,
    };
    fs.writeFileSync(PERSISTENT_STORE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal logging for dev disk store
  }
}

export function loadPersistentStore() {
  try {
    if (fs.existsSync(PERSISTENT_STORE_FILE)) {
      const raw = fs.readFileSync(PERSISTENT_STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        for (const u of data.users) {
          if (!users.some((x) => x.id === u.id || (u.email && x.email?.toLowerCase() === u.email?.toLowerCase()) || (u.mobile && x.mobile === u.mobile))) {
            users.push(u);
          }
        }
      }
      if (Array.isArray(data.travels)) {
        for (const t of data.travels) {
          if (!travels.some((x) => x.id === t.id || (t.name && x.name?.toLowerCase() === t.name?.toLowerCase()))) {
            travels.push(t);
          }
        }
      }
      if (Array.isArray(data.buses)) {
        for (const b of data.buses) {
          if (!buses.some((x) => x.id === b.id)) {
            buses.push(b);
          }
        }
      }
      if (Array.isArray(data.trips)) {
        for (const tr of data.trips) {
          if (tr.travel_name && tr.route_id && !trips.some((x) => x.id === tr.id)) {
            trips.push(tr);
          }
        }
      }
      if (Array.isArray(data.bookings)) {
        for (const bk of data.bookings) {
          if (!bookings.some((x) => x.id === bk.id)) {
            bookings.push(bk);
          }
        }
      }
      if (Array.isArray(data.payments)) {
        for (const p of data.payments) {
          if (!payments.some((x) => x.id === p.id)) {
            payments.push(p);
          }
        }
      }
      if (Array.isArray(data.refunds)) {
        for (const r of data.refunds) {
          if (!refunds.some((x) => x.id === r.id)) {
            refunds.push(r);
          }
        }
      }
    }
  } catch (err) {
    // Non-fatal
  }
}

// Initial load of any previously persisted local records
loadPersistentStore();

// ======================== ROUTE & STOP MANAGEMENT WORKFLOW ========================

export function getRouteById(id) {
  return routes.find((r) => r.id === id) || null;
}

export function getRouteStopsByRouteId(routeId) {
  return routeStops
    .filter((s) => s.route_id === routeId)
    .sort((a, b) => a.stop_order - b.stop_order);
}

export function createRouteData(routeData) {
  const newRoute = {
    id: routeData.id || `rt-custom-${Date.now()}`,
    travel_id: routeData.travel_id || smartRouteTravelId,
    name: routeData.name || `${routeData.source} - ${routeData.destination} Express`,
    code: routeData.code || `CR-${Date.now().toString().slice(-4)}`,
    source: routeData.source,
    destination: routeData.destination,
    distance_km: Number(routeData.distanceKm || routeData.distance_km || 100),
    estimated_duration_minutes: Number(routeData.estimatedDurationMinutes || routeData.duration_minutes || 180),
    is_active: routeData.is_active !== false,
    verification_status: routeData.verification_status || 'PENDING_VERIFICATION',
    is_seed: false,
    data_source: 'owner_created',
  };
  routes.push(newRoute);

  if (Array.isArray(routeData.stops) && routeData.stops.length > 0) {
    updateRouteStopsData(newRoute.id, routeData.stops);
  }
  return newRoute;
}

export function updateRouteData(id, updateFields) {
  const r = routes.find((x) => x.id === id);
  if (!r) return null;
  Object.assign(r, updateFields);
  return r;
}

export function updateRouteStopsData(routeId, stopsArray) {
  // Remove existing stops for this route
  for (let i = routeStops.length - 1; i >= 0; i--) {
    if (routeStops[i].route_id === routeId) {
      routeStops.splice(i, 1);
    }
  }

  // Insert validated reordered stops
  const newStops = stopsArray.map((st, idx) => {
    const geo = getVerifiedStopCoordinates(st.name, st.city, st.state);
    const lat = st.latitude !== undefined && st.latitude !== null && !isNaN(Number(st.latitude)) ? Number(st.latitude) : geo.latitude;
    const lng = st.longitude !== undefined && st.longitude !== null && !isNaN(Number(st.longitude)) ? Number(st.longitude) : geo.longitude;

    return {
      id: st.id || `stop-${routeId}-${idx + 1}`,
      route_id: routeId,
      name: st.name,
      city: st.city || 'Transit Point',
      latitude: lat,
      longitude: lng,
      stop_order: st.stop_order ?? st.stopOrder ?? (idx + 1),
      distance_from_start_km: Number(st.distance_from_start_km ?? st.distanceFromStartKm ?? (idx * 25)),
      estimated_time_from_start_minutes: Number(st.estimated_time_from_start_minutes ?? st.estimatedTimeFromStartMinutes ?? (idx * 30)),
      is_boarding_point: st.is_boarding_point !== false && st.isBoardingPoint !== false,
      is_dropping_point: st.is_dropping_point !== false && st.isDroppingPoint !== false,
      state: st.state || geo.state || 'Tamil Nadu',
      is_verified: validateStopCoordinates(lat, lng).isValid,
    };
  });

  routeStops.push(...newStops);
  return newStops;
}

export function verifyRouteData(routeId, isVerified = true) {
  const r = routes.find((x) => x.id === routeId);
  if (!r) return null;
  r.verification_status = isVerified ? 'VERIFIED' : 'PENDING_VERIFICATION';
  return r;
}

export function bulkImportRoutesData(importedRoutes) {
  const results = { imported: 0, errors: [] };
  importedRoutes.forEach((ir, index) => {
    try {
      if (!ir.source || !ir.destination) {
        results.errors.push(`Row ${index + 1}: Missing source or destination`);
        return;
      }
      createRouteData(ir);
      results.imported++;
    } catch (err) {
      results.errors.push(`Row ${index + 1}: ${err.message}`);
    }
  });
  return results;
}
