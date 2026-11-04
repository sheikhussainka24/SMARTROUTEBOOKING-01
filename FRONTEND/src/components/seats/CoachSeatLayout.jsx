import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import AuthContext from '../../context/AuthContext.jsx';
import { analyzeBusLayout } from '../../utils/busLayoutEngine.js';
import {
  Compass,
  Footprints,
  Lock,
  BedDouble,
  Armchair,
  Check,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  Info,
  X,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Tag,
  ArrowRight,
} from 'lucide-react';

/**
 * SMART ROUTE — Authentic 2+1 Vertical Sleeper & Seater Coach Layout
 * 48-Seat Tata Capella Executive Configuration & Volvo 9600 36-Berth Full Sleeper
 *
 * Physical Layout Specifications:
 * 1. LOWER DECK (30 positions):
 *    - Left Column: 6 Single Vertical Sleepers (SL1 to SL6) @ ₹850
 *      * Aspect ratio ~1:2 (w-10 h-20 / w-[44px] h-[84px]) with pillow at top
 *      * SL5 has test state (booked / female / male)
 *    - Middle: Walking Gangway / Aisle
 *    - Right Column: 6 sets of 4 Pushback Seater Chairs (Total 24 seats: S1 to S24) @ ₹550
 *      * Two rows of seats (S1-S2, S3-S4) vertically align with the exact height of 1 vertical sleeper (SL1)
 *      * Dimensions: Compact rounded chair (w-10 h-9) with headrest line
 * 2. UPPER DECK (18 positions):
 *    - Left Column: 6 Single Vertical Sleepers (U1 to U6) @ ₹1150 / ₹950
 *      * Tall vertical rectangle (w-10 h-20) with pillow at top
 *    - Middle: Walking Gangway / Aisle
 *    - Right Column: 6 sets of 2 Double Vertical Sleepers side-by-side (U7-U18, Total 12 berths) @ ₹950
 *      * Two vertical sleepers placed side-by-side with an individual berth partition
 *
 * Layout 2: Volvo 9600 36-Berth Full Sleeper Coach
 * - Lower Deck (18 berths): L1-L6 single vertical sleepers @ ₹950, L7-L18 double vertical sleepers @ ₹850
 * - Upper Deck (18 berths): U1-U6 single vertical sleepers @ ₹1150, U7-U18 double vertical sleepers @ ₹1050
 * - Visual Styling & Soft-Pink Tokens:
 *   * Available Berth: Pure White (#FFFFFF) with border (#E7A0BF), light pink headrest (#FCE7F3), Deep Plum text (#24152D)
 *   * Selected Berth: Rose Pink (#C13D78) with border (#9E1B55), white bold text, glow shadow
 *   * Booked Berth: Muted Gray (#F3F4F6) with border (#D1D5DB), disabled pointer events
 *   * Ladies Berth: Soft Rose tint (#FFF1F2) with pink border (#FDA4AF)
 *
 * Layout 3: Fully 2+2 A/C Pushback Seater Coach (Lower Deck Only - 40 Seats)
 * - 40-Seat 2+2 Intercity Configuration
 * - 40 Seats (S1 to S40) across 10 Rows (2+2 Grid Seating Array)
 * - Single Deck Behavior: Upper Deck completely hidden, Lower Deck centered horizontally (max-w-xl mx-auto)
 * - Middle Walking Gangway / Aisle: gap-8 md:gap-12
 * - Base Price: ₹550 per seat
 * - Tokens:
 *   * Pure White card: bg-white rounded-2xl border border-[#F1EDFA] p-6 shadow-sm max-w-xl mx-auto
 *   * Header: "LOWER DECK ONLY" in deep plum (#24152D), driver steering icon only
 *   * Visual map: Clean seat numbers only, no badges or unwanted labels
 *   * Available Seater: bg-white border-1.5 border-[#E7A0BF] text-[#24152D] rounded-md hover:border-[#C13D78] transition-all
 *   * Selected Seater: bg-[#C13D78] border-[#9E1B55] text-white font-bold scale-105 shadow-md
 *   * Booked: bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none
 *   * Ladies Seat: bg-rose-50 border-rose-300 text-rose-500
 *
 * Layout 4: Volvo 9600 Club Class with Onboard Washroom (34 Berths)
 * - bus.layoutType === 'sleeper_washroom' or amenity includes 'washroom'
 * - Lower Deck (16 Berths + 1 Washroom Cubicle):
 *   * Left Column: 6 Single Vertical Sleepers (L1 to L6) @ ₹1050
 *   * Middle: Walking Gangway / Aisle
 *   * Right Column: Rows 1-5 Double Vertical Sleepers (L7-L8 to L15-L16) @ ₹950
 *   * Row 6 (Rear Right Corner): Dedicated ONBOARD RESTROOM (Washroom / WC Cubicle)
 *   * Restroom Box: Soft blue/slate card (bg-sky-50 border border-sky-200), non-clickable, Restroom WC icon, bold "RESTROOM / WC", micro-tag "Sanitized Bio-Toilet"
 *   * Adjacent Berths (L6, L15, L16) have subtle "Near WC" indicator
 * - Upper Deck (18 Berths):
 *   * Left Column: 6 Single Vertical Sleepers (U1 to U6) @ ₹1200 (Panoramic)
 *   * Middle: Walking Gangway / Aisle
 *   * Right Column: 6 pairs of Double Vertical Sleepers (U7-U18) @ ₹1050
 *
 * Layout 5: Volvo 9600 Club Class with Front Onboard Restroom (Replacing L1) (35 Berths)
 * - bus.layoutType === 'sleeper_washroom_front'
 * - Lower Deck (17 Berths + 1 Front Washroom):
 *   * Left Column: Row 1 Front Restroom WC Box (Replacing L1, w-11 h-20), Rows 2-6 Single Vertical Sleepers (L2-L6) @ ₹1050
 *   * Middle: Walking Gangway / Aisle
 *   * Right Column: 6 pairs of Double Vertical Sleepers (L7-L8 to L17-L18) @ ₹950 (Total 12 berths)
 *   * Restroom Box: Soft blue tint (bg-sky-50 border border-sky-300), Restroom WC icon, bold "REST" & "ROOM" / "WC", non-selectable pointer-events-none
 * - Upper Deck (18 Berths):
 *   * Left Column: 6 Single Vertical Sleepers (U1 to U6) @ ₹1200
 *   * Middle: Walking Gangway / Aisle
 *   * Right Column: 6 pairs of Double Vertical Sleepers (U7-U18) @ ₹1050
 *
 * Layout 6: BharatBenz / Volvo 2+2 Pushback Seater with Onboard Restroom (Single Deck - 38 Seats + 1 WC)
 * - bus.layoutType === 'seater_washroom'
 * - Single Deck Only (Upper Deck & Deck View Switcher tabs hidden)
 * - Rows 1 to 9 (36 Seats: S1 to S36 @ ₹650): 2 Pushback Seaters (Window & Aisle) + Aisle + 2 Pushback Seaters (Aisle & Window)
 * - Row 10 (2 Seats: S37, S38 @ ₹650 + Onboard Restroom): 2 Pushback Seaters (Window & Aisle) + Aisle + Dedicated Restroom / WC Box
 * - Restroom Box: Spans 2 seats (col-span-2), soft blue tint (bg-sky-50 border border-sky-300 rounded-lg p-2 text-center pointer-events-none select-none), Restroom WC icon, "RESTROOM / WC", "Sanitized Bio-Toilet"
 *
 * Theme & Tokens:
 * - Cards: bg-white rounded-2xl border border-[#F1EDFA] p-5 shadow-sm
 * - Headers: Clean deck headers (#24152D), driver steering icon only
 * - Visual map: Clean seat & berth numbers only, no branding, no staircase/landing markers, no fare tags inside map
 * - Available Seater: bg-white border-1.5 border-[#E7A0BF] text-[#24152D] hover:border-[#C13D78]
 * - Available Sleeper: bg-white border-1.5 border-[#E7A0BF] text-[#24152D] rounded-md relative hover:shadow-md
 * - Selected: bg-[#C13D78] border-[#9E1B55] text-white font-bold scale-105 transition-all shadow-md
 * - Booked: bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none
 * - Ladies Berth: bg-rose-50 border-rose-300 text-rose-500
 */

// Steering Wheel SVG Icon
function SteeringWheelIcon({ className = 'w-5 h-5 text-[#6E5D73]' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Driver Steering Wheel"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6" />
      <path d="M4 14.5l5.5-2" />
      <path d="M20 14.5l-5.5-2" />
    </svg>
  );
}

// Onboard Restroom / WC SVG Icon
function RestroomWCIcon({ className = 'w-5 h-5 text-sky-600' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Restroom WC"
    >
      <circle cx="7" cy="5" r="2" />
      <path d="M7 9v6" />
      <path d="M5 11h4" />
      <path d="M5 21l2-6 2 6" />
      <circle cx="17" cy="5" r="2" />
      <path d="M15 9h4l1.5 6h-7z" />
      <path d="M16 17v4" />
      <path d="M18 17v4" />
    </svg>
  );
}

export default function CoachSeatLayout({
  bus = null,
  trip = null,
  layoutType = null,
  selectedSeats: controlledSelectedSeats = null,
  onSeatToggle = null,
  onSelectionChange = null,
  onProceed = null,
  initialBoardingStopId = '',
  initialDroppingStopId = '',
  searchDate = '',
  showFloatingBar = true,
  onClose = null,
  seatPricing = null,
  onSeatClick = null,
  previewMode = false,
  showLayoutSwitcher = null,
  user: userProp = null,
  isAuthorizedStaff: staffProp = null,
  activeDeckTab: propActiveDeckTab = null,
  onDeckTabChange = null,
}) {
  const navigate = useNavigate();
  const tripId = trip?.tripId || trip?.id || trip?.busId || 'trip_cbe_kkdi_01';

  // Bus Type Determination & Active Layout Mode (Dynamic Routing for all 3 Layouts):
  // - If bus.layoutType === 'combo' ➔ Layout 1: 2+1 Seater + Sleeper (Tata Capella 48 Seats)
  // - If bus.layoutType === 'sleeper' ➔ Layout 2: 2+1 Fully Sleeper (Volvo 9600 36 Berths)
  // - If bus.layoutType === 'seater' ➔ Layout 3: 2+2 Fully Seater (Single Deck 40 Seats)
  const resolvedLayoutProp =
    bus?.layoutType ||
    bus?.busType ||
    trip?.bus?.layoutType ||
    trip?.bus?.busType ||
    layoutType ||
    '';

  const propBusType =
    bus?.type ||
    trip?.bus?.type ||
    trip?.bus_type ||
    trip?.busType ||
    resolvedLayoutProp ||
    '';

  const hasWashroomAmenity =
    (Array.isArray(bus?.amenities) &&
      bus.amenities.some(
        (a) =>
          typeof a === 'string' &&
          (a.toLowerCase().includes('washroom') ||
            a.toLowerCase().includes('restroom') ||
            a.toLowerCase().includes('toilet'))
      )) ||
    (Array.isArray(trip?.amenities) &&
      trip.amenities.some(
        (a) =>
          typeof a === 'string' &&
          (a.toLowerCase().includes('washroom') ||
            a.toLowerCase().includes('restroom') ||
            a.toLowerCase().includes('toilet'))
      ));

  const getInitialLayout = () => {
    // 1. Direct layoutType & busType checks
    if (
      bus?.layoutType === 'seater_washroom' ||
      bus?.busType === 'seater_washroom' ||
      layoutType === 'seater_washroom' ||
      bus?.type === 'seater_washroom' ||
      bus?.type === '2+2 Seater + Washroom'
    ) {
      return 'seater_washroom';
    }
    if (
      bus?.layoutType === 'sleeper_washroom_front' ||
      bus?.busType === 'sleeper_washroom_front' ||
      layoutType === 'sleeper_washroom_front' ||
      bus?.type === 'sleeper_washroom_front' ||
      bus?.type === '2+1 Sleeper + Front Washroom' ||
      String(propBusType).toLowerCase().includes('washroom_front') ||
      String(propBusType).toLowerCase().includes('front washroom') ||
      String(propBusType).toLowerCase().includes('front restroom')
    ) {
      return 'sleeper_washroom_front';
    }
    if (
      bus?.layoutType === 'sleeper_washroom_rear' ||
      bus?.layoutType === 'sleeper_washroom' ||
      bus?.busType === 'sleeper_washroom_rear' ||
      bus?.busType === 'sleeper_washroom' ||
      layoutType === 'sleeper_washroom_rear' ||
      layoutType === 'sleeper_washroom' ||
      bus?.type === 'sleeper_washroom_rear' ||
      bus?.type === 'sleeper_washroom' ||
      bus?.type === '2+1 Sleeper + Washroom' ||
      hasWashroomAmenity
    ) {
      return 'sleeper_washroom';
    }
    if (
      bus?.layoutType === 'seater' ||
      bus?.layoutType === 'seater_40' ||
      bus?.busType === 'seater' ||
      bus?.busType === 'seater_40' ||
      layoutType === 'seater' ||
      layoutType === 'seater_40' ||
      layoutType === 'fully_seater'
    ) {
      return 'seater';
    }
    if (
      bus?.layoutType === 'sleeper' ||
      bus?.layoutType === 'sleeper_36' ||
      bus?.busType === 'sleeper' ||
      bus?.busType === 'sleeper_36' ||
      layoutType === 'sleeper' ||
      layoutType === 'sleeper_36' ||
      bus?.type === 'Fully Sleeper' ||
      layoutType === 'Fully Sleeper'
    ) {
      return 'Fully Sleeper';
    }
    if (
      bus?.layoutType === 'combo' ||
      bus?.layoutType === 'combo_48' ||
      bus?.busType === 'combo' ||
      bus?.busType === 'combo_48' ||
      layoutType === 'combo' ||
      layoutType === 'combo_48' ||
      bus?.type === '2+1 Sleeper/Seater' ||
      layoutType === '2+1 Sleeper/Seater'
    ) {
      return '2+1 Sleeper/Seater';
    }

    // 2. Bus type strings
    const lower = String(propBusType).toLowerCase();
    if (
      lower === 'seater_washroom' ||
      lower.includes('seater_washroom') ||
      (lower.includes('seater') && (lower.includes('washroom') || lower.includes('restroom') || lower.includes('toilet')))
    ) {
      return 'seater_washroom';
    }
    if (
      lower.includes('washroom_front') ||
      lower.includes('front washroom') ||
      lower.includes('front restroom')
    ) {
      return 'sleeper_washroom_front';
    }
    if (
      lower.includes('washroom') ||
      lower.includes('restroom') ||
      lower.includes('toilet')
    ) {
      return 'sleeper_washroom';
    }
    if (
      lower === 'fully_seater' ||
      lower === 'seater' ||
      lower.includes('fully seater') ||
      lower.includes('bharatbenz') ||
      lower.includes('ashok leyland') ||
      lower.includes('2+2') ||
      (lower.includes('seater') && !lower.includes('sleeper'))
    ) {
      return 'seater';
    }
    if (
      lower.includes('fully sleeper') ||
      lower.includes('royal sleeper') ||
      lower.includes('volvo') ||
      lower === 'ac_sleeper' ||
      lower === 'sleeper'
    ) {
      return 'Fully Sleeper';
    }
    return '2+1 Sleeper/Seater';
  };

  const [activeLayout, setActiveLayout] = useState(getInitialLayout);

  // Synchronize when bus.layoutType, bus.busType, bus.type, amenities or layoutType changes dynamically
  useEffect(() => {
    if (
      bus?.layoutType === 'seater_washroom' ||
      bus?.busType === 'seater_washroom' ||
      layoutType === 'seater_washroom' ||
      bus?.type === 'seater_washroom' ||
      bus?.type === '2+2 Seater + Washroom'
    ) {
      setActiveLayout('seater_washroom');
    } else if (
      bus?.layoutType === 'sleeper_washroom_front' ||
      bus?.busType === 'sleeper_washroom_front' ||
      layoutType === 'sleeper_washroom_front' ||
      bus?.type === 'sleeper_washroom_front' ||
      bus?.type === '2+1 Sleeper + Front Washroom' ||
      String(propBusType).toLowerCase().includes('washroom_front') ||
      String(propBusType).toLowerCase().includes('front washroom') ||
      String(propBusType).toLowerCase().includes('front restroom')
    ) {
      setActiveLayout('sleeper_washroom_front');
    } else if (
      bus?.layoutType === 'sleeper_washroom_rear' ||
      bus?.layoutType === 'sleeper_washroom' ||
      bus?.busType === 'sleeper_washroom_rear' ||
      bus?.busType === 'sleeper_washroom' ||
      layoutType === 'sleeper_washroom_rear' ||
      layoutType === 'sleeper_washroom' ||
      bus?.type === 'sleeper_washroom_rear' ||
      bus?.type === 'sleeper_washroom' ||
      bus?.type === '2+1 Sleeper + Washroom' ||
      hasWashroomAmenity
    ) {
      setActiveLayout('sleeper_washroom');
    } else if (
      bus?.layoutType === 'seater' ||
      bus?.layoutType === 'seater_40' ||
      bus?.busType === 'seater' ||
      bus?.busType === 'seater_40' ||
      layoutType === 'seater' ||
      layoutType === 'seater_40' ||
      layoutType === 'fully_seater'
    ) {
      setActiveLayout('seater');
    } else if (
      bus?.layoutType === 'sleeper' ||
      bus?.layoutType === 'sleeper_36' ||
      bus?.busType === 'sleeper' ||
      bus?.busType === 'sleeper_36' ||
      layoutType === 'sleeper' ||
      layoutType === 'sleeper_36' ||
      bus?.type === 'Fully Sleeper' ||
      layoutType === 'Fully Sleeper'
    ) {
      setActiveLayout('Fully Sleeper');
    } else if (
      bus?.layoutType === 'combo' ||
      bus?.layoutType === 'combo_48' ||
      bus?.busType === 'combo' ||
      bus?.busType === 'combo_48' ||
      layoutType === 'combo' ||
      layoutType === 'combo_48' ||
      bus?.type === '2+1 Sleeper/Seater' ||
      layoutType === '2+1 Sleeper/Seater'
    ) {
      setActiveLayout('2+1 Sleeper/Seater');
    } else if (propBusType) {
      const lower = String(propBusType).toLowerCase();
      if (
        lower === 'seater_washroom' ||
        lower.includes('seater_washroom') ||
        (lower.includes('seater') && (lower.includes('washroom') || lower.includes('restroom') || lower.includes('toilet')))
      ) {
        setActiveLayout('seater_washroom');
      } else if (
        lower.includes('washroom_front') ||
        lower.includes('front washroom') ||
        lower.includes('front restroom')
      ) {
        setActiveLayout('sleeper_washroom_front');
      } else if (
        lower.includes('washroom') ||
        lower.includes('restroom') ||
        lower.includes('toilet')
      ) {
        setActiveLayout('sleeper_washroom');
      } else if (
        lower === 'fully_seater' ||
        lower === 'seater' ||
        lower.includes('fully seater') ||
        lower.includes('bharatbenz') ||
        lower.includes('ashok leyland') ||
        lower.includes('2+2') ||
        (lower.includes('seater') && !lower.includes('sleeper'))
      ) {
        setActiveLayout('seater');
      } else if (
        lower.includes('fully sleeper') ||
        lower.includes('royal sleeper') ||
        lower.includes('volvo') ||
        lower === 'ac_sleeper' ||
        lower === 'sleeper'
      ) {
        setActiveLayout('Fully Sleeper');
      } else {
        setActiveLayout('2+1 Sleeper/Seater');
      }
    }
  }, [bus?.layoutType, bus?.busType, bus?.type, bus?.amenities, trip?.amenities, layoutType, propBusType]);

  const isWashroomSeaterLayout =
    activeLayout === 'seater_washroom' ||
    activeLayout === '2+2 Seater + Washroom';

  const isFrontWashroomSleeperLayout =
    activeLayout === 'sleeper_washroom_front' ||
    activeLayout === '2+1 Sleeper + Front Washroom';

  const isWashroomSleeperLayout =
    activeLayout === 'sleeper_washroom_rear' ||
    activeLayout === 'sleeper_washroom' ||
    activeLayout === '2+1 Sleeper + Washroom' ||
    activeLayout === 'washroom';

  const isSeaterLayout =
    activeLayout === 'seater' ||
    activeLayout === 'fully_seater' ||
    activeLayout === 'Fully Seater';

  const isSleeperLayout =
    activeLayout === 'Fully Sleeper' ||
    activeLayout === 'sleeper';

  const isComboLayout =
    activeLayout === '2+1 Sleeper/Seater' ||
    activeLayout === 'combo' ||
    (!isSeaterLayout && !isWashroomSeaterLayout && !isSleeperLayout && !isWashroomSleeperLayout && !isFrontWashroomSleeperLayout);

  // Deck view switcher tab: 'both' | 'lower' | 'upper'
  const [internalDeckTab, setInternalDeckTab] = useState('both');
  const activeDeckTab = (propActiveDeckTab !== null && propActiveDeckTab !== undefined)
    ? propActiveDeckTab
    : internalDeckTab;

  const setActiveDeckTab = (tab) => {
    setInternalDeckTab(tab);
    if (onDeckTabChange) onDeckTabChange(tab);
  };

  // Auth context & Role-Based Access Control (RBAC) determination:
  // Layout switcher container is exclusively accessible to Travel Admin, Travel Owner, and Managers.
  const authContext = useContext(AuthContext);
  const authUser = userProp || authContext?.user || null;

  const isAuthorizedStaff = staffProp !== null
    ? Boolean(staffProp)
    : showLayoutSwitcher !== null
    ? Boolean(showLayoutSwitcher)
    : Boolean(
        authUser && (
          authUser.role === 'admin' || 
          authUser.role === 'owner' || 
          authUser.role === 'manager' ||
          authUser.userType === 'travel_admin' ||
          authUser.role === 'travel_owner' ||
          authUser.role === 'super_admin' ||
          authUser.role === 'travel_admin'
        )
      );

  // Internal selection state if not controlled by parent
  const [internalSelectedSeats, setInternalSelectedSeats] = useState([]);
  const selectedSeats = controlledSelectedSeats !== null ? controlledSelectedSeats : internalSelectedSeats;

  // Real backend inventory & stops state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stops, setStops] = useState([]);
  const [rawBackendSeats, setRawBackendSeats] = useState([]);

  // Selected boarding & dropping stop
  const [boardingStopId, setBoardingStopId] = useState(initialBoardingStopId || trip?.boardingStopId || '');
  const [droppingStopId, setDroppingStopId] = useState(initialDroppingStopId || trip?.droppingStopId || '');

  // Derived travel metadata
  const travelDate =
    searchDate ||
    trip?.travelDate ||
    trip?.travel_date ||
    trip?.journey_date ||
    trip?.departure_date ||
    new Date().toISOString().split('T')[0];

  const operatorName =
    trip?.operatorName ||
    trip?.travelName ||
    trip?.travel_name ||
    'SMART ROUTE Travels';

  const serviceNumber =
    trip?.serviceNumber ||
    trip?.trip_number ||
    trip?.bus_number ||
    'SR-101';

  const fromCity =
    trip?.fromCity ||
    trip?.routeSource ||
    trip?.source ||
    trip?.from_city ||
    'Coimbatore';

  const toCity =
    trip?.toCity ||
    trip?.routeDestination ||
    trip?.destination ||
    trip?.to_city ||
    'Karaikudi';

  // Fetch stops and authoritative inventory for this trip if available
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!tripId) return;
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (boardingStopId) queryParams.set('boardingStopId', boardingStopId);
        if (droppingStopId) queryParams.set('droppingStopId', droppingStopId);

        const queryDate = searchDate || trip?.departure_date || trip?.travel_date || trip?.journey_date || new Date().toISOString().split('T')[0];
        if (queryDate) {
          queryParams.set('date', queryDate);
          queryParams.set('journeyDate', queryDate);
        }

        const qStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const busIdentifier = bus?.id || bus?.bus_number || trip?.bus_id || trip?.busNumber || trip?.serviceNumber || tripId;

        const [seatsRes, busSeatsRes, stopsRes] = await Promise.allSettled([
          api.get(`/seats/trip/${tripId}${qStr}`),
          api.get(`/buses/${busIdentifier}/seat-layout?date=${queryDate}`),
          api.get(`/trips/${tripId}/stops`),
        ]);

        if (!isMounted) return;

        if (busSeatsRes.status === 'fulfilled' && (busSeatsRes.value?.data?.seats || busSeatsRes.value?.seats)?.length > 0) {
          const list = busSeatsRes.value?.data?.seats || busSeatsRes.value?.seats;
          setRawBackendSeats(list);
        } else if (seatsRes.status === 'fulfilled') {
          const list = seatsRes.value?.data?.seats || seatsRes.value?.seats || [];
          if (Array.isArray(list) && list.length > 0) {
            setRawBackendSeats(list);
          }
        }

        if (stopsRes.status === 'fulfilled') {
          const stopList = stopsRes.value?.data?.stops || stopsRes.value?.stops || [];
          if (Array.isArray(stopList) && stopList.length > 0) {
            setStops(stopList);
            const boardings = stopList.filter((s) => s.is_boarding_point);
            const droppings = stopList.filter((s) => s.is_dropping_point);
            if (!boardingStopId && boardings.length > 0) {
              setBoardingStopId(boardings[0].id);
            }
            if (!droppingStopId && droppings.length > 0) {
              setDroppingStopId(droppings[droppings.length - 1].id);
            }
          }
        }
      } catch (err) {
        console.warn('Backend seat load notice (using authentic layout):', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [tripId, boardingStopId, droppingStopId]);

  // Construct the authoritative coach seating matrix across all layouts
  const {
    lowerDeckRows,
    upperDeckRows,
    layout2LowerDeckRows,
    layout2UpperDeckRows,
    layout3SeaterRows,
    layout4LowerDeckRows,
    layout4UpperDeckRows,
    layout5LowerDeckRows,
    layout5UpperDeckRows,
    layout6SeaterRows,
    seatLookup,
  } = useMemo(() => {
    const backendMap = new Map();
    (rawBackendSeats || []).forEach((s) => {
      if (s.seat_number) backendMap.set(s.seat_number, s);
      if (s.id) backendMap.set(s.id, s);
    });

    const lookup = new Map();

    const applyPricingOverride = (seatObj) => {
      if (!seatObj) return seatObj;
      const id = seatObj.id || seatObj.seat_number;
      if (seatPricing && typeof seatPricing === 'function') {
        const custom = seatPricing(seatObj);
        if (custom !== undefined && custom !== null && !isNaN(custom)) {
          seatObj.price = Number(custom);
          seatObj.fare = Number(custom);
        }
      } else if (seatPricing && seatPricing[id] !== undefined) {
        seatObj.price = Number(seatPricing[id]);
        seatObj.fare = Number(seatPricing[id]);
      } else if (bus?.seatPricing && bus.seatPricing[id] !== undefined) {
        seatObj.price = Number(bus.seatPricing[id]);
        seatObj.fare = Number(bus.seatPricing[id]);
      } else if (bus?.seat_pricing && bus.seat_pricing[id] !== undefined) {
        seatObj.price = Number(bus.seat_pricing[id]);
        seatObj.fare = Number(bus.seat_pricing[id]);
      }
      if (previewMode && seatObj.status !== 'blocked') {
        seatObj.status = 'available';
      }
      return seatObj;
    };

    // ==================== 1. LOWER DECK (30 POSITIONS) ====================
    // Left: 6 Vertical Single Sleepers (SL1 to SL6) @ ₹850
    // Right: 6 Sets of 4 Pushback Seats (S1 to S24) @ ₹550
    const lowerRows = [];

    for (let r = 0; r < 6; r++) {
      const slNum = `SL${r + 1}`;
      const lsNum = `LS${r + 1}`;
      const backendSleeper = backendMap.get(slNum) || backendMap.get(lsNum);

      // Default test states for Lower Sleeper: SL5 is booked / female
      let sleeperStatus = backendSleeper?.status || 'available';
      let sleeperGender = backendSleeper?.gender || (r % 2 === 0 ? 'male' : 'female');
      if (!backendSleeper && r === 4) {
        sleeperStatus = 'booked';
        sleeperGender = 'female'; // SL5 booked / female test state
      }

      const singleSleeper = {
        id: slNum,
        seat_number: slNum,
        type: 'sleeper_lower',
        deck: 'LOWER',
        price: backendSleeper?.fare ? Number(backendSleeper.fare) : 850,
        fare: backendSleeper?.fare ? Number(backendSleeper.fare) : 850,
        status: sleeperStatus,
        gender: sleeperGender,
        isSleeper: true,
        label: slNum,
      };
      lookup.set(slNum, singleSleeper);

      // Right Column: 4 Seats per row (S1..S4 for row 0, S5..S8 for row 1, etc.)
      const seatSet = [];
      for (let sIdx = 1; sIdx <= 4; sIdx++) {
        const sNum = `S${r * 4 + sIdx}`;
        const lNum = `L${r * 4 + sIdx}`;
        const backendSeat = backendMap.get(sNum) || backendMap.get(lNum);

        let seatStatus = backendSeat?.status || 'available';
        let seatGender = backendSeat?.gender || (sIdx % 2 === 0 ? 'female' : 'male');
        // Test booked state on S4 & S14
        if (!backendSeat && (r * 4 + sIdx === 4 || r * 4 + sIdx === 14)) {
          seatStatus = 'booked';
          seatGender = r * 4 + sIdx === 4 ? 'male' : 'female';
        }

        const seatObj = {
          id: sNum,
          seat_number: sNum,
          type: 'seater',
          deck: 'LOWER',
          price: backendSeat?.fare ? Number(backendSeat.fare) : 550,
          fare: backendSeat?.fare ? Number(backendSeat.fare) : 550,
          status: seatStatus,
          gender: seatGender,
          isSleeper: false,
          label: sNum,
        };
        lookup.set(sNum, seatObj);
        seatSet.push(seatObj);
      }

      // Group the 4 seats into two rows of 2 (subRow1: S1, S2; subRow2: S3, S4)
      const subRow1 = [seatSet[0], seatSet[1]];
      const subRow2 = [seatSet[2], seatSet[3]];

      lowerRows.push({
        rowNumber: r + 1,
        sleeper: singleSleeper,
        subRow1,
        subRow2,
      });
    }

    // ==================== 2. UPPER DECK (18 POSITIONS) ====================
    // Left: 6 Vertical Single Sleepers (U1 to U6) @ ₹1150 / ₹950
    // Right: 6 Sets of 2 Double Sleepers side-by-side (U7-U8, U9-U10, etc.) @ ₹950
    const upperRows = [];

    for (let r = 0; r < 6; r++) {
      const uSingleNum = `U${r + 1}`;
      const backendSingle = backendMap.get(uSingleNum);

      let uSingleStatus = backendSingle?.status || 'available';
      let uSingleGender = backendSingle?.gender || (r % 2 === 0 ? 'female' : 'male');
      if (!backendSingle && r === 1) {
        uSingleStatus = 'booked'; // U2 booked test state
      }

      const singleUpperSleeper = {
        id: uSingleNum,
        seat_number: uSingleNum,
        type: 'sleeper_upper_single',
        deck: 'UPPER',
        price: backendSingle?.fare ? Number(backendSingle.fare) : 1150,
        fare: backendSingle?.fare ? Number(backendSingle.fare) : 1150,
        status: uSingleStatus,
        gender: uSingleGender,
        isSleeper: true,
        label: uSingleNum,
      };
      lookup.set(uSingleNum, singleUpperSleeper);

      // Right Double Sleeper (U7-U8, U9-U10, etc.)
      const d1Num = `U${r * 2 + 7}`;
      const d2Num = `U${r * 2 + 8}`;
      const bD1 = backendMap.get(d1Num);
      const bD2 = backendMap.get(d2Num);

      const doubleSleeper1 = {
        id: d1Num,
        seat_number: d1Num,
        type: 'sleeper_upper_double',
        deck: 'UPPER',
        price: bD1?.fare ? Number(bD1.fare) : 950,
        fare: bD1?.fare ? Number(bD1.fare) : 950,
        status: bD1?.status || 'available',
        gender: bD1?.gender || 'female',
        isSleeper: true,
        label: d1Num,
      };

      let d2Status = bD2?.status || 'available';
      if (!bD2 && r === 3) {
        d2Status = 'booked'; // U14 booked test state
      }

      const doubleSleeper2 = {
        id: d2Num,
        seat_number: d2Num,
        type: 'sleeper_upper_double',
        deck: 'UPPER',
        price: bD2?.fare ? Number(bD2.fare) : 950,
        fare: bD2?.fare ? Number(bD2.fare) : 950,
        status: d2Status,
        gender: bD2?.gender || 'male',
        isSleeper: true,
        label: d2Num,
      };

      lookup.set(d1Num, doubleSleeper1);
      lookup.set(d2Num, doubleSleeper2);

      upperRows.push({
        rowNumber: r + 1,
        singleSleeper: singleUpperSleeper,
        doubleSleepers: [doubleSleeper1, doubleSleeper2],
      });
    }

    // =========================================================================
    // LAYOUT 2: 36-BERTH SLEEPER MATRIX (18 Lower + 18 Upper)
    // =========================================================================
    // 1. LOWER DECK (18 Sleeper Berths):
    //    - Left Column: 6 Single Vertical Sleepers (L1 to L6) @ ₹950
    //    - Middle: Walking Gangway / Aisle
    //    - Right Column: 6 pairs of Double Vertical Sleepers side-by-side:
    //      (L7-L8, L9-L10, L11-L12, L13-L14, L15-L16, L17-L18) @ ₹850
    const l2LowerRows = [];
    for (let r = 0; r < 6; r++) {
      const lSingleNum = `L${r + 1}`;
      const backendLSingle = backendMap.get(lSingleNum);

      let lSingleStatus = backendLSingle?.status || 'available';
      let lSingleGender = backendLSingle?.gender || (r % 2 === 0 ? 'male' : 'female');
      if (!backendLSingle && r === 4) {
        lSingleStatus = 'booked';
        lSingleGender = 'female'; // L5 booked / ladies reserved
      }

      const singleLowerSleeper = {
        id: lSingleNum,
        seat_number: lSingleNum,
        type: 'sleeper_lower_single',
        deck: 'LOWER',
        price: backendLSingle?.fare ? Number(backendLSingle.fare) : 950,
        fare: backendLSingle?.fare ? Number(backendLSingle.fare) : 950,
        status: lSingleStatus,
        gender: lSingleGender,
        isSleeper: true,
        label: lSingleNum,
      };

      const d1Num = `L${r * 2 + 7}`;
      const d2Num = `L${r * 2 + 8}`;
      const bD1 = backendMap.get(d1Num);
      const bD2 = backendMap.get(d2Num);

      const doubleLower1 = {
        id: d1Num,
        seat_number: d1Num,
        type: 'sleeper_lower_double',
        deck: 'LOWER',
        price: bD1?.fare ? Number(bD1.fare) : 850,
        fare: bD1?.fare ? Number(bD1.fare) : 850,
        status: bD1?.status || 'available',
        gender: bD1?.gender || 'female',
        isSleeper: true,
        label: d1Num,
      };

      let d2Status = bD2?.status || 'available';
      if (!bD2 && r === 3) {
        d2Status = 'booked'; // L14 booked test state
      }

      const doubleLower2 = {
        id: d2Num,
        seat_number: d2Num,
        type: 'sleeper_lower_double',
        deck: 'LOWER',
        price: bD2?.fare ? Number(bD2.fare) : 850,
        fare: bD2?.fare ? Number(bD2.fare) : 850,
        status: d2Status,
        gender: bD2?.gender || 'male',
        isSleeper: true,
        label: d2Num,
      };

      lookup.set(lSingleNum, singleLowerSleeper);
      lookup.set(d1Num, doubleLower1);
      lookup.set(d2Num, doubleLower2);

      l2LowerRows.push({
        rowNumber: r + 1,
        singleSleeper: singleLowerSleeper,
        doubleSleepers: [doubleLower1, doubleLower2],
      });
    }

    // 2. UPPER DECK (18 Sleeper Berths):
    //    - Left Column: 6 Single Vertical Sleepers (U1 to U6) @ ₹1150 (Panoramic)
    //    - Middle: Walking Gangway / Aisle
    //    - Right Column: 6 pairs of Double Vertical Sleepers side-by-side:
    //      (U7-U8, U9-U10, U11-U12, U13-U14, U15-U16, U17-U18) @ ₹1050
    const l2UpperRows = [];
    for (let r = 0; r < 6; r++) {
      const uSingleNum = `U${r + 1}`;
      const backendSingle = backendMap.get(uSingleNum);

      let uSingleStatus = backendSingle?.status || 'available';
      let uSingleGender = backendSingle?.gender || (r % 2 === 0 ? 'female' : 'male');
      if (!backendSingle && r === 1) {
        uSingleStatus = 'booked'; // U2 booked test state
      }

      const singleUpperSleeper = {
        id: uSingleNum,
        seat_number: uSingleNum,
        type: 'sleeper_upper_single',
        deck: 'UPPER',
        price: backendSingle?.fare ? Number(backendSingle.fare) : 1150,
        fare: backendSingle?.fare ? Number(backendSingle.fare) : 1150,
        status: uSingleStatus,
        gender: uSingleGender,
        isSleeper: true,
        label: uSingleNum,
      };

      const d1Num = `U${r * 2 + 7}`;
      const d2Num = `U${r * 2 + 8}`;
      const bD1 = backendMap.get(d1Num);
      const bD2 = backendMap.get(d2Num);

      const doubleUpper1 = {
        id: d1Num,
        seat_number: d1Num,
        type: 'sleeper_upper_double',
        deck: 'UPPER',
        price: bD1?.fare ? Number(bD1.fare) : (activeLayout === 'Fully Sleeper' ? 1050 : 950),
        fare: bD1?.fare ? Number(bD1.fare) : (activeLayout === 'Fully Sleeper' ? 1050 : 950),
        status: bD1?.status || 'available',
        gender: bD1?.gender || 'female',
        isSleeper: true,
        label: d1Num,
      };

      let d2Status = bD2?.status || 'available';
      if (!bD2 && r === 3) {
        d2Status = 'booked'; // U14 booked test state
      }

      const doubleUpper2 = {
        id: d2Num,
        seat_number: d2Num,
        type: 'sleeper_upper_double',
        deck: 'UPPER',
        price: bD2?.fare ? Number(bD2.fare) : (activeLayout === 'Fully Sleeper' ? 1050 : 950),
        fare: bD2?.fare ? Number(bD2.fare) : (activeLayout === 'Fully Sleeper' ? 1050 : 950),
        status: d2Status,
        gender: bD2?.gender || 'male',
        isSleeper: true,
        label: d2Num,
      };

      if (activeLayout === 'Fully Sleeper') {
        lookup.set(d1Num, doubleUpper1);
        lookup.set(d2Num, doubleUpper2);
      }

      l2UpperRows.push({
        rowNumber: r + 1,
        singleSleeper: singleUpperSleeper,
        doubleSleepers: [doubleUpper1, doubleUpper2],
      });
    }

    // =========================================================================
    // LAYOUT 3: FULLY 2+2 A/C PUSHBACK SEATER (40 Seats: S1 to S40, 10 Rows)
    // =========================================================================
    const l3Rows = [];
    for (let r = 0; r < 10; r++) {
      const leftSeats = [];
      const rightSeats = [];

      // Left 2 seats: Window (s1), Aisle (s2)
      for (let sIdx = 1; sIdx <= 2; sIdx++) {
        const sNum = `S${r * 4 + sIdx}`;
        const backendSeat = backendMap.get(sNum);

        let seatStatus = backendSeat?.status || 'available';
        let seatGender = backendSeat?.gender || (sIdx % 2 === 0 ? 'female' : 'male');
        if (!backendSeat && (r * 4 + sIdx === 4 || r * 4 + sIdx === 14)) {
          seatStatus = 'booked';
          seatGender = 'male';
        }

        const seatObj = {
          id: sNum,
          seat_number: sNum,
          type: 'seater',
          deck: 'LOWER',
          price: backendSeat?.fare ? Number(backendSeat.fare) : 550,
          fare: backendSeat?.fare ? Number(backendSeat.fare) : 550,
          status: seatStatus,
          gender: seatGender,
          isSleeper: false,
          label: sNum,
        };
        lookup.set(sNum, seatObj);
        leftSeats.push(seatObj);
      }

      // Right 2 seats: Aisle (s3), Window (s4)
      for (let sIdx = 3; sIdx <= 4; sIdx++) {
        const sNum = `S${r * 4 + sIdx}`;
        const backendSeat = backendMap.get(sNum);

        let seatStatus = backendSeat?.status || 'available';
        let seatGender = backendSeat?.gender || (sIdx % 2 === 0 ? 'female' : 'male');
        if (!backendSeat && (r * 4 + sIdx === 4 || r * 4 + sIdx === 14)) {
          seatStatus = 'booked';
          seatGender = 'female';
        } else if (!backendSeat && r * 4 + sIdx === 18) {
          seatStatus = 'booked';
          seatGender = 'female'; // Ladies seat test state
        }

        const seatObj = {
          id: sNum,
          seat_number: sNum,
          type: 'seater',
          deck: 'LOWER',
          price: backendSeat?.fare ? Number(backendSeat.fare) : 550,
          fare: backendSeat?.fare ? Number(backendSeat.fare) : 550,
          status: seatStatus,
          gender: seatGender,
          isSleeper: false,
          label: sNum,
        };
        lookup.set(sNum, seatObj);
        rightSeats.push(seatObj);
      }

      l3Rows.push({
        rowNumber: r + 1,
        leftSeats,
        rightSeats,
      });
    }

    // =========================================================================
    // LAYOUT 4: 34-BERTH SLEEPER WITH ONBOARD WASHROOM (34 Berths)
    // 1. LOWER DECK (16 Berths + 1 Washroom Cubicle):
    //    - Left Column: 6 Single Vertical Sleepers (L1-L6) @ ₹1050 (L6 Near WC)
    //    - Middle: Walking Gangway / Aisle
    //    - Right Column: Rows 1-5 Double Vertical Sleepers (L7-L16) @ ₹950 (L15-L16 Near WC)
    //    - Row 6 (Rear Right Corner): Dedicated ONBOARD RESTROOM (Washroom / WC Cubicle)
    // 2. UPPER DECK (18 Sleeper Berths):
    //    - Left Column: 6 Single Vertical Sleepers (U1-U6) @ ₹1200 (Panoramic)
    //    - Middle: Walking Gangway / Aisle
    //    - Right Column: 6 pairs of Double Vertical Sleepers (U7-U18) @ ₹1050
    // =========================================================================
    const l4LowerRows = [];
    for (let r = 0; r < 6; r++) {
      const lSingleNum = `L${r + 1}`;
      const backendLSingle = backendMap.get(lSingleNum);

      let lSingleStatus = backendLSingle?.status || 'available';
      let lSingleGender = backendLSingle?.gender || (r % 2 === 0 ? 'male' : 'female');
      if (!backendLSingle && r === 4) {
        lSingleStatus = 'booked';
        lSingleGender = 'female'; // L5 booked / ladies reserved
      }

      const singleLowerSleeper = {
        id: lSingleNum,
        seat_number: lSingleNum,
        type: 'sleeper_lower_single',
        deck: 'LOWER',
        price: backendLSingle?.fare ? Number(backendLSingle.fare) : 1050,
        fare: backendLSingle?.fare ? Number(backendLSingle.fare) : 1050,
        status: lSingleStatus,
        gender: lSingleGender,
        isSleeper: true,
        label: lSingleNum,
        isNearWashroom: r === 5, // L6 adjacent to restroom
      };

      let doubleSleepers = null;
      if (r < 5) {
        // Rows 1 to 5: 5 pairs of Double Vertical Sleepers (L7-L8, L9-L10, L11-L12, L13-L14, L15-L16)
        const d1Num = `L${r * 2 + 7}`;
        const d2Num = `L${r * 2 + 8}`;
        const bD1 = backendMap.get(d1Num);
        const bD2 = backendMap.get(d2Num);

        const doubleLower1 = {
          id: d1Num,
          seat_number: d1Num,
          type: 'sleeper_lower_double',
          deck: 'LOWER',
          price: bD1?.fare ? Number(bD1.fare) : 950,
          fare: bD1?.fare ? Number(bD1.fare) : 950,
          status: bD1?.status || 'available',
          gender: bD1?.gender || 'female',
          isSleeper: true,
          label: d1Num,
          isNearWashroom: r === 4, // L15 adjacent to restroom
        };

        let d2Status = bD2?.status || 'available';
        if (!bD2 && r === 3) {
          d2Status = 'booked'; // L14 booked test state
        }

        const doubleLower2 = {
          id: d2Num,
          seat_number: d2Num,
          type: 'sleeper_lower_double',
          deck: 'LOWER',
          price: bD2?.fare ? Number(bD2.fare) : 950,
          fare: bD2?.fare ? Number(bD2.fare) : 950,
          status: d2Status,
          gender: bD2?.gender || 'male',
          isSleeper: true,
          label: d2Num,
          isNearWashroom: r === 4, // L16 adjacent to restroom
        };

        if (activeLayout === 'sleeper_washroom') {
          lookup.set(d1Num, doubleLower1);
          lookup.set(d2Num, doubleLower2);
        }
        doubleSleepers = [doubleLower1, doubleLower2];
      }

      if (activeLayout === 'sleeper_washroom') {
        lookup.set(lSingleNum, singleLowerSleeper);
      }

      l4LowerRows.push({
        rowNumber: r + 1,
        singleSleeper: singleLowerSleeper,
        doubleSleepers,
        isRestroom: r === 5, // Row 6 Rear Right: Dedicated Onboard Restroom
      });
    }

    const l4UpperRows = [];
    for (let r = 0; r < 6; r++) {
      const uSingleNum = `U${r + 1}`;
      const backendSingle = backendMap.get(uSingleNum);

      let uSingleStatus = backendSingle?.status || 'available';
      let uSingleGender = backendSingle?.gender || (r % 2 === 0 ? 'female' : 'male');
      if (!backendSingle && r === 1) {
        uSingleStatus = 'booked'; // U2 booked test state
      }

      const singleUpperSleeper = {
        id: uSingleNum,
        seat_number: uSingleNum,
        type: 'sleeper_upper_single',
        deck: 'UPPER',
        price: backendSingle?.fare ? Number(backendSingle.fare) : 1200,
        fare: backendSingle?.fare ? Number(backendSingle.fare) : 1200,
        status: uSingleStatus,
        gender: uSingleGender,
        isSleeper: true,
        label: uSingleNum,
      };

      const d1Num = `U${r * 2 + 7}`;
      const d2Num = `U${r * 2 + 8}`;
      const bD1 = backendMap.get(d1Num);
      const bD2 = backendMap.get(d2Num);

      const doubleUpper1 = {
        id: d1Num,
        seat_number: d1Num,
        type: 'sleeper_upper_double',
        deck: 'UPPER',
        price: bD1?.fare ? Number(bD1.fare) : 1050,
        fare: bD1?.fare ? Number(bD1.fare) : 1050,
        status: bD1?.status || 'available',
        gender: bD1?.gender || 'female',
        isSleeper: true,
        label: d1Num,
      };

      let d2Status = bD2?.status || 'available';
      if (!bD2 && r === 3) {
        d2Status = 'booked'; // U14 booked test state
      }

      const doubleUpper2 = {
        id: d2Num,
        seat_number: d2Num,
        type: 'sleeper_upper_double',
        deck: 'UPPER',
        price: bD2?.fare ? Number(bD2.fare) : 1050,
        fare: bD2?.fare ? Number(bD2.fare) : 1050,
        status: d2Status,
        gender: bD2?.gender || 'male',
        isSleeper: true,
        label: d2Num,
      };

      if (activeLayout === 'sleeper_washroom') {
        lookup.set(uSingleNum, singleUpperSleeper);
        lookup.set(d1Num, doubleUpper1);
        lookup.set(d2Num, doubleUpper2);
      }

      l4UpperRows.push({
        rowNumber: r + 1,
        singleSleeper: singleUpperSleeper,
        doubleSleepers: [doubleUpper1, doubleUpper2],
      });
    }

    // =========================================================================
    // LAYOUT 5: VOLVO 9600 CLUB CLASS WITH FRONT ONBOARD RESTROOM (35 Berths)
    // (Replacing Berth L1 in Front Left Cabin Entry)
    // 1. LOWER DECK (17 Berths + 1 Front Restroom):
    //    - Left Column:
    //      * Row 1: Dedicated Front Restroom / WC Box (Replacing L1, w-11 h-20)
    //      * Rows 2-6: 5 Single Vertical Sleepers (L2-L6) @ ₹1050 (L2 Near WC)
    //    - Middle: Walking Gangway / Aisle
    //    - Right Column: 6 pairs of Double Vertical Sleepers (L7-L18) @ ₹950 (L7, L8 Near WC)
    // 2. UPPER DECK (18 Sleeper Berths):
    //    - Left Column: 6 Single Vertical Sleepers (U1-U6) @ ₹1200 (Panoramic)
    //    - Middle: Walking Gangway / Aisle
    //    - Right Column: 6 pairs of Double Vertical Sleepers (U7-U18) @ ₹1050
    // =========================================================================
    const l5LowerRows = [];
    for (let r = 0; r < 6; r++) {
      const isRow1 = r === 0;
      let singleLowerSleeper = null;

      if (!isRow1) {
        // Rows 2 to 6: 5 Single Vertical Sleepers (L2, L3, L4, L5, L6) @ ₹1050
        const lSingleNum = `L${r + 1}`;
        const backendLSingle = backendMap.get(lSingleNum);

        let lSingleStatus = backendLSingle?.status || 'available';
        let lSingleGender = backendLSingle?.gender || (r % 2 === 0 ? 'male' : 'female');
        if (!backendLSingle && r === 4) {
          lSingleStatus = 'booked';
          lSingleGender = 'female'; // L5 booked / ladies reserved
        }

        singleLowerSleeper = {
          id: lSingleNum,
          seat_number: lSingleNum,
          type: 'sleeper_lower_single',
          deck: 'LOWER',
          price: backendLSingle?.fare ? Number(backendLSingle.fare) : 1050,
          fare: backendLSingle?.fare ? Number(backendLSingle.fare) : 1050,
          status: lSingleStatus,
          gender: lSingleGender,
          isSleeper: true,
          label: lSingleNum,
          isNearWashroom: r === 1, // L2 adjacent to front restroom
        };

        if (activeLayout === 'sleeper_washroom_front') {
          lookup.set(lSingleNum, singleLowerSleeper);
        }
      }

      // Right Column: All 6 rows have double vertical sleepers (L7-L8 to L17-L18) @ ₹950
      const d1Num = `L${r * 2 + 7}`;
      const d2Num = `L${r * 2 + 8}`;
      const bD1 = backendMap.get(d1Num);
      const bD2 = backendMap.get(d2Num);

      const doubleLower1 = {
        id: d1Num,
        seat_number: d1Num,
        type: 'sleeper_lower_double',
        deck: 'LOWER',
        price: bD1?.fare ? Number(bD1.fare) : 950,
        fare: bD1?.fare ? Number(bD1.fare) : 950,
        status: bD1?.status || 'available',
        gender: bD1?.gender || 'female',
        isSleeper: true,
        label: d1Num,
        isNearWashroom: isRow1, // L7 adjacent to front restroom across aisle
      };

      let d2Status = bD2?.status || 'available';
      if (!bD2 && r === 3) {
        d2Status = 'booked'; // L14 booked test state
      }

      const doubleLower2 = {
        id: d2Num,
        seat_number: d2Num,
        type: 'sleeper_lower_double',
        deck: 'LOWER',
        price: bD2?.fare ? Number(bD2.fare) : 950,
        fare: bD2?.fare ? Number(bD2.fare) : 950,
        status: d2Status,
        gender: bD2?.gender || 'male',
        isSleeper: true,
        label: d2Num,
        isNearWashroom: isRow1, // L8 adjacent to front restroom across aisle
      };

      if (activeLayout === 'sleeper_washroom_front') {
        lookup.set(d1Num, doubleLower1);
        lookup.set(d2Num, doubleLower2);
      }

      l5LowerRows.push({
        rowNumber: r + 1,
        singleSleeper: singleLowerSleeper,
        doubleSleepers: [doubleLower1, doubleLower2],
        isRestroom: isRow1, // Row 1 Left: Dedicated Front Restroom replacing L1
      });
    }

    const l5UpperRows = [];
    for (let r = 0; r < 6; r++) {
      const uSingleNum = `U${r + 1}`;
      const backendSingle = backendMap.get(uSingleNum);

      let uSingleStatus = backendSingle?.status || 'available';
      let uSingleGender = backendSingle?.gender || (r % 2 === 0 ? 'female' : 'male');
      if (!backendSingle && r === 1) {
        uSingleStatus = 'booked'; // U2 booked test state
      }

      const singleUpperSleeper = {
        id: uSingleNum,
        seat_number: uSingleNum,
        type: 'sleeper_upper_single',
        deck: 'UPPER',
        price: backendSingle?.fare ? Number(backendSingle.fare) : 1200,
        fare: backendSingle?.fare ? Number(backendSingle.fare) : 1200,
        status: uSingleStatus,
        gender: uSingleGender,
        isSleeper: true,
        label: uSingleNum,
      };

      const d1Num = `U${r * 2 + 7}`;
      const d2Num = `U${r * 2 + 8}`;
      const bD1 = backendMap.get(d1Num);
      const bD2 = backendMap.get(d2Num);

      const doubleUpper1 = {
        id: d1Num,
        seat_number: d1Num,
        type: 'sleeper_upper_double',
        deck: 'UPPER',
        price: bD1?.fare ? Number(bD1.fare) : 1050,
        fare: bD1?.fare ? Number(bD1.fare) : 1050,
        status: bD1?.status || 'available',
        gender: bD1?.gender || 'female',
        isSleeper: true,
        label: d1Num,
      };

      let d2Status = bD2?.status || 'available';
      if (!bD2 && r === 3) {
        d2Status = 'booked'; // U14 booked test state
      }

      const doubleUpper2 = {
        id: d2Num,
        seat_number: d2Num,
        type: 'sleeper_upper_double',
        deck: 'UPPER',
        price: bD2?.fare ? Number(bD2.fare) : 1050,
        fare: bD2?.fare ? Number(bD2.fare) : 1050,
        status: d2Status,
        gender: bD2?.gender || 'male',
        isSleeper: true,
        label: d2Num,
      };

      if (activeLayout === 'sleeper_washroom_front') {
        lookup.set(uSingleNum, singleUpperSleeper);
        lookup.set(d1Num, doubleUpper1);
        lookup.set(d2Num, doubleUpper2);
      }

      l5UpperRows.push({
        rowNumber: r + 1,
        singleSleeper: singleUpperSleeper,
        doubleSleepers: [doubleUpper1, doubleUpper2],
      });
    }

    // =========================================================================
    // LAYOUT 6: FULLY 2+2 A/C PUSHBACK SEATER WITH ONBOARD RESTROOM (38 Seats)
    // Single Deck Only: 10 Rows
    // Rows 1 to 9 (S1 to S36): 2 Left + Central Gangway + 2 Right @ ₹650
    // Row 10 (S37, S38 + Washroom): 2 Left (S37, S38) @ ₹650 + Central Gangway + Dedicated Rear Restroom
    // =========================================================================
    const l6Rows = [];
    for (let r = 0; r < 10; r++) {
      const leftSeats = [];
      const isRow10 = r === 9;

      // Left 2 seats: Window (s1), Aisle (s2)
      for (let sIdx = 1; sIdx <= 2; sIdx++) {
        const sNum = `S${r * 4 + sIdx}`;
        const backendSeat = backendMap.get(sNum);

        let seatStatus = backendSeat?.status || 'available';
        let seatGender = backendSeat?.gender || (sIdx % 2 === 0 ? 'female' : 'male');
        if (!backendSeat && (r * 4 + sIdx === 4 || r * 4 + sIdx === 14)) {
          seatStatus = 'booked';
          seatGender = 'male';
        }

        const seatObj = {
          id: sNum,
          seat_number: sNum,
          type: 'seater',
          deck: 'LOWER',
          price: backendSeat?.fare ? Number(backendSeat.fare) : 650,
          fare: backendSeat?.fare ? Number(backendSeat.fare) : 650,
          status: seatStatus,
          gender: seatGender,
          isSleeper: false,
          label: sNum,
        };

        if (activeLayout === 'seater_washroom') {
          lookup.set(sNum, seatObj);
        }
        leftSeats.push(seatObj);
      }

      let rightSeats = null;
      if (!isRow10) {
        // Rows 1 to 9: Right 2 seats: Aisle (s3), Window (s4)
        rightSeats = [];
        for (let sIdx = 3; sIdx <= 4; sIdx++) {
          const sNum = `S${r * 4 + sIdx}`;
          const backendSeat = backendMap.get(sNum);

          let seatStatus = backendSeat?.status || 'available';
          let seatGender = backendSeat?.gender || (sIdx % 2 === 0 ? 'female' : 'male');
          if (!backendSeat && (r * 4 + sIdx === 4 || r * 4 + sIdx === 14)) {
            seatStatus = 'booked';
            seatGender = 'female';
          } else if (!backendSeat && r * 4 + sIdx === 18) {
            seatStatus = 'booked';
            seatGender = 'female'; // Ladies seat test state
          }

          const seatObj = {
            id: sNum,
            seat_number: sNum,
            type: 'seater',
            deck: 'LOWER',
            price: backendSeat?.fare ? Number(backendSeat.fare) : 650,
            fare: backendSeat?.fare ? Number(backendSeat.fare) : 650,
            status: seatStatus,
            gender: seatGender,
            isSleeper: false,
            label: sNum,
          };

          if (activeLayout === 'seater_washroom') {
            lookup.set(sNum, seatObj);
          }
          rightSeats.push(seatObj);
        }
      }

      l6Rows.push({
        rowNumber: r + 1,
        leftSeats,
        rightSeats,
        isRestroom: isRow10,
      });
    }

    lookup.forEach((seatObj) => {
      const bSeat = backendMap.get(seatObj.id) || backendMap.get(seatObj.seat_number);
      if (bSeat) {
        if (bSeat.status) seatObj.status = bSeat.status;
        if (bSeat.gender) seatObj.gender = bSeat.gender;
        if (bSeat.fare) {
          seatObj.fare = Number(bSeat.fare);
          seatObj.price = Number(bSeat.fare);
        }
        if (bSeat.disabled !== undefined) seatObj.disabled = bSeat.disabled;
        if (bSeat.segmentConflict !== undefined) seatObj.segmentConflict = bSeat.segmentConflict;
        if (bSeat.held_until) seatObj.held_until = bSeat.held_until;
        if (bSeat.held_by) seatObj.held_by = bSeat.held_by;
      }
      if (seatObj.status === 'booked' || seatObj.status === 'held' || seatObj.segmentConflict) {
        seatObj.disabled = true;
      }
    });

    if (seatPricing || bus?.seatPricing || bus?.seat_pricing || previewMode) {
      lookup.forEach((seatObj) => {
        applyPricingOverride(seatObj);
      });
    }

    return {
      lowerDeckRows: lowerRows,
      upperDeckRows: upperRows,
      layout2LowerDeckRows: l2LowerRows,
      layout2UpperDeckRows: l2UpperRows,
      layout3SeaterRows: l3Rows,
      layout4LowerDeckRows: l4LowerRows,
      layout4UpperDeckRows: l4UpperRows,
      layout5LowerDeckRows: l5LowerRows,
      layout5UpperDeckRows: l5UpperRows,
      layout6SeaterRows: l6Rows,
      seatLookup: lookup,
    };
  }, [rawBackendSeats, activeLayout, seatPricing, bus?.seatPricing, bus?.seat_pricing, previewMode]);

  // Exact layout capacity calculation (Total = S + B + D)
  const layoutAnalysis = useMemo(() => {
    let activeSeatsList = [];
    if (isWashroomSeaterLayout) {
      activeSeatsList = layout6SeaterRows.flatMap((r) => [...r.leftSeats, ...(r.isRestroom ? [] : r.rightSeats)]);
    } else if (isSeaterLayout) {
      activeSeatsList = layout3SeaterRows.flatMap((r) => [...r.leftSeats, ...r.rightSeats]);
    } else if (isFrontWashroomSleeperLayout) {
      const lower = layout5LowerDeckRows.flatMap((r) => (r.isRestroom ? r.doubleSleepers : [r.singleSleeper, ...r.doubleSleepers]));
      const upper = layout5UpperDeckRows.flatMap((r) => [r.singleSleeper, ...r.doubleSleepers]);
      activeSeatsList = [...lower, ...upper];
    } else if (isWashroomSleeperLayout) {
      const lower = layout4LowerDeckRows.flatMap((r) => (r.isRestroom ? [r.singleSleeper] : [r.singleSleeper, ...r.doubleSleepers]));
      const upper = layout4UpperDeckRows.flatMap((r) => [r.singleSleeper, ...r.doubleSleepers]);
      activeSeatsList = [...lower, ...upper];
    } else if (activeLayout === 'Fully Sleeper') {
      const lower = layout2LowerDeckRows.flatMap((r) => [r.singleSleeper, ...r.doubleSleepers]);
      const upper = layout2UpperDeckRows.flatMap((r) => [r.singleSleeper, ...r.doubleSleepers]);
      activeSeatsList = [...lower, ...upper];
    } else {
      const lower = lowerDeckRows.flatMap((r) => [r.sleeper, ...r.subRow1, ...r.subRow2]);
      const upper = upperDeckRows.flatMap((r) => [r.sleeper, ...r.doubleSleepers]);
      activeSeatsList = [...lower, ...upper];
    }

    return analyzeBusLayout(activeSeatsList, 1);
  }, [
    activeLayout,
    isWashroomSeaterLayout,
    isSeaterLayout,
    isFrontWashroomSleeperLayout,
    isWashroomSleeperLayout,
    layout6SeaterRows,
    layout3SeaterRows,
    layout5LowerDeckRows,
    layout5UpperDeckRows,
    layout4LowerDeckRows,
    layout4UpperDeckRows,
    layout2LowerDeckRows,
    layout2UpperDeckRows,
    lowerDeckRows,
    upperDeckRows,
  ]);

  // Check if a seat is currently selected
  const isSeatSelected = (seatId) => {
    return selectedSeats.some((s) => (typeof s === 'string' ? s === seatId : s.id === seatId));
  };

  // Toggle seat selection
  const handleSeatClick = (seat) => {
    if (onSeatClick) {
      onSeatClick(seat);
      return;
    }

    if (seat.status === 'booked' || seat.status === 'held' || seat.segmentConflict || seat.disabled) return;

    if (onSeatToggle) {
      onSeatToggle(seat);
      return;
    }

    const alreadySelected = isSeatSelected(seat.id);

    let nextSelection = [];
    if (alreadySelected) {
      nextSelection = selectedSeats.filter((s) => (typeof s === 'string' ? s !== seat.id : s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 6) {
        alert('Maximum 6 seats per booking reservation.');
        return;
      }
      const isSleeper = seat.type?.includes('sleeper') || seat.isSleeper;
      const newEntry = {
        id: seat.id,
        seat_number: seat.id,
        type: isSleeper ? 'sleeper' : 'seater',
        berthType: seat.type,
        deck: seat.deck,
        price: seat.price,
        fare: seat.price,
      };
      nextSelection = [...selectedSeats, newEntry];
    }

    if (controlledSelectedSeats === null) {
      setInternalSelectedSeats(nextSelection);
    }

    if (onSelectionChange) {
      const total = nextSelection.reduce((acc, item) => {
        const p = typeof item === 'object' ? item.price || item.fare || 0 : seatLookup.get(item)?.price || 0;
        return acc + Number(p);
      }, 0);
      onSelectionChange(nextSelection, total);
    }
  };

  // Normalized list of selected seat objects
  const selectedSeatObjects = useMemo(() => {
    return selectedSeats.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const found = seatLookup.get(item.id) || {};
        const isSleeper =
          (item.type || found.type || '').includes('sleeper') ||
          item.id?.startsWith('U') ||
          item.id?.startsWith('L') ||
          item.id?.startsWith('SL');
        const numPart = parseInt(String(item.id).replace(/\D/g, ''), 10) || 1;
        const fallbackPrice = isSleeper
          ? item.id?.startsWith('U')
            ? numPart <= 6
              ? isWashroomSleeperLayout || isFrontWashroomSleeperLayout
                ? 1200
                : 1150
              : activeLayout === 'Fully Sleeper' || isWashroomSleeperLayout || isFrontWashroomSleeperLayout
              ? 1050
              : 950
            : item.id?.startsWith('L')
            ? numPart <= 6
              ? isWashroomSleeperLayout || isFrontWashroomSleeperLayout
                ? 1050
                : 950
              : isWashroomSleeperLayout || isFrontWashroomSleeperLayout
              ? 950
              : 850
            : 850
          : isWashroomSeaterLayout
          ? 650
          : 550;

        return {
          ...found,
          ...item,
          id: item.id || found.id,
          seat_number: item.id || found.id,
          type: isSleeper ? 'sleeper' : 'seater',
          berthType: item.type || found.type,
          deck: item.deck || found.deck || (item.id?.startsWith('U') ? 'UPPER' : 'LOWER'),
          price: Number(item.price || found.price || fallbackPrice),
          fare: Number(item.price || found.price || fallbackPrice),
        };
      }
      const found = seatLookup.get(item);
      const isSleeper = item.startsWith('U') || item.startsWith('L') || item.startsWith('SL');
      const numPart = parseInt(String(item).replace(/\D/g, ''), 10) || 1;
      const fallbackPrice = isSleeper
        ? item.startsWith('U')
          ? numPart <= 6
            ? isWashroomSleeperLayout || isFrontWashroomSleeperLayout
              ? 1200
              : 1150
            : activeLayout === 'Fully Sleeper' || isWashroomSleeperLayout || isFrontWashroomSleeperLayout
            ? 1050
            : 950
          : item.startsWith('L')
          ? numPart <= 6
            ? isWashroomSleeperLayout || isFrontWashroomSleeperLayout
              ? 1050
              : 950
            : isWashroomSleeperLayout || isFrontWashroomSleeperLayout
            ? 950
            : 850
          : 850
        : isWashroomSeaterLayout
        ? 650
        : 550;

      return (
        found || {
          id: item,
          seat_number: item,
          type: isSleeper ? 'sleeper' : 'seater',
          deck: item.startsWith('U') ? 'UPPER' : 'LOWER',
          price: fallbackPrice,
          fare: fallbackPrice,
        }
      );
    });
  }, [selectedSeats, seatLookup, activeLayout]);

  // Recalculate total fare dynamically
  const totalCalculatedFare = useMemo(() => {
    return selectedSeatObjects.reduce((acc, s) => acc + Number(s.price || s.fare || 0), 0);
  }, [selectedSeatObjects]);

  // Proceed to passenger details / checkout
  const handleProceedToPassengerDetails = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat or berth to proceed.');
      return;
    }

    if (onProceed) {
      onProceed({
        selectedSeats: selectedSeatObjects,
        totalCalculatedFare,
        boardingStopId,
        droppingStopId,
      });
      return;
    }

    // Resolve boarding & dropping stops
    const selectedBoarding = stops.find((s) => s.id === boardingStopId);
    const selectedDropping = stops.find((s) => s.id === droppingStopId);

    const selectedBoardingPoint = selectedBoarding
      ? `${selectedBoarding.name || selectedBoarding.stop_name} (${selectedBoarding.city})`
      : trip?.boardingStopName || `${fromCity} Omni Bus Stand (09:30 PM)`;

    const selectedDroppingPoint = selectedDropping
      ? `${selectedDropping.name || selectedDropping.stop_name} (${selectedDropping.city})`
      : trip?.droppingStopName || `${toCity} New Bus Stand (04:15 AM)`;

    const selectedSeatNumbers = selectedSeatObjects.map((s) => s.id);
    const farePerSeat = selectedSeatObjects[0]?.price || 850;

    // Navigate to /passenger-details preserving complete payload
    navigate('/passenger-details', {
      state: {
        busId: trip?.id || trip?.bus_id || tripId,
        tripId,
        operatorName,
        serviceNumber,
        selectedSeats: selectedSeatNumbers, // ['SL1', 'U5']
        selectedSeatCount: selectedSeatNumbers.length,
        farePerSeat,
        baseFareSubtotal: totalCalculatedFare,
        subtotal: totalCalculatedFare,
        taxesAndFees: Math.round(totalCalculatedFare * 0.05),
        discount: 0,
        totalAmount: totalCalculatedFare,
        finalPayable: totalCalculatedFare,
        totalPayable: totalCalculatedFare,
        boardingPoint: selectedBoardingPoint,
        droppingPoint: selectedDroppingPoint,
        boardingStopId,
        droppingStopId,
        travelDate,
        fromCity,
        toCity,
        selectedSeatObjects,
        preSelectedSeatNumbers: selectedSeatNumbers,
        preSelectedSeatIds: selectedSeatNumbers,
        tripDetails: trip,
      },
    });
  };

  // ==================== SEAT & BERTH RENDERERS ====================

  /**
   * Render Vertical Sleeper Berth (Aspect Ratio ~1:2: w-11 h-20 for Layout 2 / w-10 h-20 for Layout 1)
   */
  const renderVerticalSleeper = (berth, customClassName = '', isLayout2 = activeLayout === 'Fully Sleeper' || isWashroomSleeperLayout || isFrontWashroomSleeperLayout) => {
    const isSelected = isSeatSelected(berth.id);
    const isBooked = berth.status === 'booked' || berth.status === 'held' || berth.status === 'ladies' || berth.segmentConflict || berth.disabled;
    const berthGender = (berth.gender || '').toLowerCase();
    const isLadies = berth.status === 'ladies' || (berthGender === 'female' && (berth.status === 'booked' || berth.segmentConflict || berth.status === 'held' || berth.disabled));
    const isMale = berthGender === 'male' && isBooked;
    const isNearWashroom =
      berth.isNearWashroom ||
      ((berth.id === 'L6' || berth.id === 'L15' || berth.id === 'L16') && isWashroomSleeperLayout) ||
      ((berth.id === 'L2' || berth.id === 'L7' || berth.id === 'L8') && isFrontWashroomSleeperLayout);

    // Dimensions: Layout 2 & 4 use w-11 h-20 (approx 1:2 aspect ratio, min-w-[44px] min-h-[80px])
    const sizeClasses = isLayout2
      ? 'w-11 h-20 min-w-[44px] min-h-[80px]'
      : 'w-10 h-20 min-w-[40px] min-h-[80px]';

    // State styling matching exact design tokens
    let containerClass = '';
    if (isSelected) {
      containerClass =
        'bg-[#C13D78] border-1.5 border-[#9E1B55] text-white font-bold scale-105 transition-all shadow-md cursor-pointer';
    } else if (isLadies) {
      containerClass = isLayout2
        ? 'bg-[#FFF1F2] border-1.5 border-[#FDA4AF] text-rose-500 cursor-not-allowed pointer-events-none'
        : 'bg-rose-50 border-1.5 border-rose-300 text-rose-500 cursor-not-allowed pointer-events-none opacity-90';
    } else if (isMale) {
      containerClass = isLayout2
        ? 'bg-[#EFF6FF] border-1.5 border-[#93C5FD] text-[#1E40AF] cursor-not-allowed pointer-events-none'
        : 'bg-blue-50 border-1.5 border-blue-300 text-blue-700 cursor-not-allowed pointer-events-none opacity-90';
    } else if (isBooked) {
      containerClass = isLayout2
        ? 'bg-[#F3F4F6] border-1.5 border-[#D1D5DB] text-gray-400 cursor-not-allowed pointer-events-none'
        : 'bg-gray-100 border-1.5 border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none';
    } else {
      containerClass =
        'bg-white border-1.5 border-[#E7A0BF] text-[#24152D] rounded-md relative hover:shadow-md hover:border-[#C13D78] cursor-pointer';
    }

    return (
      <button
        key={berth.id}
        type="button"
        disabled={!onSeatClick && isBooked}
        onClick={() => handleSeatClick(berth)}
        className={`${sizeClasses} flex flex-col justify-between items-center p-1 select-none transition-all duration-150 active:scale-95 touch-manipulation ${containerClass} ${customClassName}`}
        title={onSeatClick ? `${berth.label} — ₹${berth.price} (Click to override fare)` : `${berth.label} — ₹${berth.price} (${berth.status}${isLadies ? ' • Female' : isMale ? ' • Male' : ''})${isNearWashroom ? ' • Near Washroom' : ''}`}
        aria-label={`Berth ${berth.label}, Price ₹${berth.price}, Status: ${berth.status}${isNearWashroom ? ', Near Washroom' : ''}`}
      >
        {/* Pillow / Headrest Indicator at Top */}
        <div
          className={`w-[72%] h-3 mx-auto mt-0.5 transition-colors border ${
            isSelected
              ? 'bg-white/40 border-white/60 rounded-sm'
              : isLadies
              ? isLayout2
                ? 'bg-[#FECDD3] border-[#FDA4AF] rounded-sm'
                : 'bg-rose-200 border-rose-300 rounded-sm'
              : isMale
              ? isLayout2
                ? 'bg-[#BFDBFE] border-[#93C5FD] rounded-sm'
                : 'bg-blue-200 border-blue-300 rounded-sm'
              : isBooked
              ? 'bg-gray-200 border-gray-300 rounded-sm'
              : 'bg-[#FCE7F3] rounded-sm border-[#E7A0BF]/50'
          }`}
        />

        {/* Berth ID only - Clean Visual Map per Requirements */}
        <div className="flex items-center justify-center my-auto">
          <span className="text-[12px] font-black tracking-tight leading-none">
            {berth.label}
          </span>
        </div>

        {/* Selected or Subtle Baseline Indicator */}
        <div className="h-2 flex items-center justify-center">
          {isSelected ? (
            <Check size={11} className="text-white stroke-[3]" />
          ) : (
            <div className="w-1.5 h-0.5 rounded-full bg-current opacity-30" />
          )}
        </div>
      </button>
    );
  };

  /**
   * Render Compact Pushback Seater Chair (w-10 h-9)
   */
  const renderSeaterChair = (seat, customClassName = '') => {
    const isSelected = isSeatSelected(seat.id);
    const isBooked = seat.status === 'booked' || seat.status === 'held' || seat.status === 'ladies' || seat.segmentConflict || seat.disabled;
    const seatGender = (seat.gender || '').toLowerCase();
    const isLadies = seat.status === 'ladies' || (seatGender === 'female' && (seat.status === 'booked' || seat.segmentConflict || seat.status === 'held' || seat.disabled));
    const isMale = seatGender === 'male' && isBooked;

    let containerClass = '';
    if (isSeaterLayout || isWashroomSeaterLayout) {
      if (isSelected) {
        containerClass =
          'bg-[#C13D78] border-[#9E1B55] text-white font-bold scale-105 shadow-md cursor-pointer';
      } else if (isLadies) {
        containerClass =
          'bg-rose-50 border-rose-300 text-rose-500 cursor-not-allowed pointer-events-none opacity-90';
      } else if (isMale) {
        containerClass =
          'bg-blue-50 border-blue-300 text-blue-700 cursor-not-allowed pointer-events-none opacity-90';
      } else if (isBooked) {
        containerClass =
          'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none';
      } else {
        containerClass =
          'bg-white border-1.5 border-[#E7A0BF] text-[#24152D] rounded-md hover:border-[#C13D78] transition-all cursor-pointer';
      }
    } else {
      if (isSelected) {
        containerClass =
          'bg-[#C13D78] border-1.5 border-[#9E1B55] text-white font-bold scale-105 transition-all shadow-md cursor-pointer';
      } else if (isLadies) {
        containerClass =
          'bg-rose-50 border-1.5 border-rose-300 text-rose-500 cursor-not-allowed pointer-events-none opacity-90';
      } else if (isMale) {
        containerClass =
          'bg-blue-50 border-blue-300 text-blue-700 cursor-not-allowed pointer-events-none opacity-90';
      } else if (isBooked) {
        containerClass =
          'bg-gray-100 border-1.5 border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none';
      } else {
        containerClass =
          'bg-white border-1.5 border-[#E7A0BF] text-[#24152D] hover:border-[#C13D78] rounded-md cursor-pointer';
      }
    }

    return (
      <button
        key={seat.id}
        type="button"
        disabled={!onSeatClick && isBooked}
        onClick={() => handleSeatClick(seat)}
        className={`w-10 h-9 flex flex-col justify-between items-center px-1 py-0.5 select-none transition-all duration-150 active:scale-95 touch-manipulation min-w-[40px] min-h-[36px] ${containerClass}`}
        title={onSeatClick ? `${seat.label} — ₹${seat.price} (Click to override fare)` : `${seat.label} — ₹${seat.price} (${seat.status}${isLadies ? ' • Female' : isMale ? ' • Male' : ''})`}
        aria-label={`Seat ${seat.label}, Price ₹${seat.price}, Status: ${seat.status}`}
      >
        {/* Headrest Line at Top */}
        <div
          className={`w-3/4 h-[2.5px] rounded-full mx-auto mt-0.5 transition-colors ${
            isSelected
              ? 'bg-white/60'
              : isLadies
              ? 'bg-rose-300'
              : isMale
              ? 'bg-blue-300'
              : isBooked
              ? 'bg-gray-300'
              : 'bg-[#E7A0BF]/70'
          }`}
        />

        {/* Seat ID only - Clean Visual Map per Requirements */}
        <div className="flex items-center justify-center w-full px-0.5 my-auto">
          <span className="text-[11px] font-black leading-none tracking-tight">
            {seat.label}
          </span>
        </div>

        {/* Selected or Subtle Baseline Indicator */}
        <div className="h-1.5 flex items-center justify-center">
          {isSelected ? (
            <Check size={9} className="text-white stroke-[3]" />
          ) : (
            <div className="w-2 h-[1px] bg-current opacity-30 rounded-full" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      {/* Authorized Staff Only: Coach Model Header & Dynamic Bus Layout Switcher Container (RBAC Protected) */}
      {isAuthorizedStaff && (
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-2 border-b border-[#F1EDFA]">
          {/* Coach Layout Badge & Count Summary per Requirements */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#24152D] tracking-tight m-0">
                {isSeaterLayout || isWashroomSeaterLayout ? 'Select Coach Seats' : isSleeperLayout || isWashroomSleeperLayout || isFrontWashroomSleeperLayout ? 'Select Coach Berths' : 'Select Coach Berths & Seats'}
              </h3>
              <span className="bg-[#FFF1F6] text-[#C13D78] text-[11px] font-black px-3 py-0.5 rounded-full border border-[#E7A0BF] tracking-wide uppercase shadow-xs">
                {isComboLayout ? '48-SEAT 2+1 • ' : isSleeperLayout ? '36-BERTH SLEEPER • ' : isSeaterLayout ? '40-SEAT 2+2 • ' : isWashroomSleeperLayout ? '34-BERTH SLEEPER • ' : isFrontWashroomSleeperLayout ? '35-BERTH SLEEPER • ' : isWashroomSeaterLayout ? '38-SEAT 2+2 • ' : ''}
                {layoutAnalysis.layoutType} • {layoutAnalysis.countSummary}
              </span>
              {isFrontWashroomSleeperLayout ? (
                <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
                  FRONT WC ONBOARD
                </span>
              ) : (isWashroomSeaterLayout || isWashroomSleeperLayout) && (
                <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-200">
                  WC ONBOARD
                </span>
              )}
            </div>
            <p className="text-xs text-[#6E5D73] mt-0.5">
              Maximum 6 seats per booking reservation
            </p>
          </div>

          {/* Layout Switcher & Deck Switcher Pills */}
          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* Dynamic Bus Layout Switcher Pill */}
            <div className="flex flex-wrap items-center bg-[#F1EDFA] p-1 rounded-xl shadow-inner gap-1">
              <button
                type="button"
                onClick={() => setActiveLayout('2+1 Sleeper/Seater')}
                title="2+1 Sleeper/Seater (48 Seats)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isComboLayout
                    ? 'bg-white text-[#C13D78] shadow-sm'
                    : 'text-[#6E5D73] hover:text-[#24152D]'
                }`}
              >
                Seater-Cum-Sleeper (S24 + B24 + D1 = 49)
              </button>
              <button
                type="button"
                onClick={() => setActiveLayout('Fully Sleeper')}
                title="Fully Sleeper (36 Berths)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSleeperLayout
                    ? 'bg-white text-[#C13D78] shadow-sm'
                    : 'text-[#6E5D73] hover:text-[#24152D]'
                }`}
              >
                Sleeper (B36 + D1 = 37)
              </button>
              <button
                type="button"
                onClick={() => setActiveLayout('seater')}
                title="Fully 2+2 Seater (40 Seats) - 2+2 Pushback Seater Coach (40 Seats)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSeaterLayout
                    ? 'bg-white text-[#C13D78] shadow-sm'
                    : 'text-[#6E5D73] hover:text-[#24152D]'
                }`}
              >
                Seater (S40 + D1 = 41)
              </button>
              <button
                type="button"
                onClick={() => setActiveLayout('sleeper_washroom')}
                title="2+1 Sleeper + Washroom (34 Berths)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isWashroomSleeperLayout
                    ? 'bg-white text-[#C13D78] shadow-sm'
                    : 'text-[#6E5D73] hover:text-[#24152D]'
                }`}
              >
                Sleeper + Rear WC (B34 + D1 = 35)
              </button>
              <button
                type="button"
                onClick={() => setActiveLayout('sleeper_washroom_front')}
                title="2+1 Sleeper + Front WC (35 Berths)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isFrontWashroomSleeperLayout
                    ? 'bg-white text-[#C13D78] shadow-sm'
                    : 'text-[#6E5D73] hover:text-[#24152D]'
                }`}
              >
                Sleeper + Front WC (B35 + D1 = 36)
              </button>
              <button
                type="button"
                onClick={() => setActiveLayout('seater_washroom')}
                title="2+2 Seater + Washroom (38 Seats)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isWashroomSeaterLayout
                    ? 'bg-white text-[#C13D78] shadow-sm'
                    : 'text-[#6E5D73] hover:text-[#24152D]'
                }`}
              >
                Seater + Rear WC (S38 + D1 = 39)
              </button>
            </div>

            {/* Deck View Switcher Tabs (Only visible for multi-deck layouts; hidden for Layout 3 & 6 Single Deck) */}
            {!isSeaterLayout && !isWashroomSeaterLayout && (
              <div className="flex items-center bg-[#F1EDFA] p-1 rounded-xl shadow-inner gap-1 self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveDeckTab('both')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeDeckTab === 'both'
                      ? 'bg-white text-[#C13D78] shadow-sm'
                      : 'text-[#6E5D73] hover:text-[#24152D]'
                  }`}
                >
                  Both Decks View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeckTab('lower')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeDeckTab === 'lower'
                      ? 'bg-white text-[#C13D78] shadow-sm'
                      : 'text-[#6E5D73] hover:text-[#24152D]'
                  }`}
                >
                  <Armchair size={13} /> Lower Deck
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeckTab('upper')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeDeckTab === 'upper'
                      ? 'bg-white text-[#C13D78] shadow-sm'
                      : 'text-[#6E5D73] hover:text-[#24152D]'
                  }`}
                >
                  <BedDouble size={13} /> Upper Deck
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standalone Deck Tabs and Header for Normal Passengers (Only when rendered outside SeatSelectionPage without external deck tabs) */}
      {!isAuthorizedStaff && propActiveDeckTab === null && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#F1EDFA]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-extrabold text-[#24152D] tracking-tight m-0">
                {isSeaterLayout || isWashroomSeaterLayout ? 'Select Seats' : 'Select Berths'}
              </h3>
              <span className="bg-[#FFF1F6] text-[#C13D78] text-[11px] font-black px-2.5 py-0.5 rounded-full border border-[#E7A0BF] tracking-wide uppercase shadow-xs">
                {layoutAnalysis.layoutType} • {layoutAnalysis.countSummary}
              </span>
            </div>
            <p className="text-xs text-[#6E5D73] mt-0.5">
              Click an available berth to select (Maximum 6 seats per booking)
            </p>
          </div>

          {!isSeaterLayout && !isWashroomSeaterLayout && (
            <div className="flex items-center bg-[#F1EDFA] p-1 rounded-xl shadow-inner gap-1 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveDeckTab('both')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeDeckTab === 'both'
                    ? 'bg-white text-[#C13D78] shadow-sm'
                    : 'text-[#6E5D73] hover:text-[#24152D]'
                }`}
              >
                Both Decks View
              </button>
              <button
                type="button"
                onClick={() => setActiveDeckTab('lower')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeDeckTab === 'lower'
                    ? 'bg-white text-[#C13D78] shadow-sm'
                    : 'text-[#6E5D73] hover:text-[#24152D]'
                }`}
              >
                <Armchair size={13} /> Lower Deck
              </button>
              <button
                type="button"
                onClick={() => setActiveDeckTab('upper')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeDeckTab === 'upper'
                    ? 'bg-white text-[#C13D78] shadow-sm'
                    : 'text-[#6E5D73] hover:text-[#24152D]'
                }`}
              >
                <BedDouble size={13} /> Upper Deck
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== STATE LEGEND ==================== */}
      <div className="bg-[#FFF9FB] border border-[#F1EDFA] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#6E5D73]">
        {isWashroomSeaterLayout ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-white border-1.5 border-[#E7A0BF]" />
              <span>Available Pushback Seater (₹650)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-[#C13D78] border-[#9E1B55]" />
              <span className="text-[#C13D78] font-bold">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-[#F3F4F6] border-[#D1D5DB]" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-[#FFF1F2] border-[#FDA4AF]" />
              <span className="text-rose-500">Ladies Seat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-sky-50 border border-sky-300 flex items-center justify-center text-[8px] text-sky-800 font-bold">
                WC
              </span>
              <span className="text-sky-700 font-bold">Onboard Restroom</span>
            </div>
          </>
        ) : isFrontWashroomSleeperLayout || isWashroomSleeperLayout ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-white border-1.5 border-[#E7A0BF] relative">
                <span className="absolute top-0.5 inset-x-0.5 h-1.5 bg-[#FCE7F3] rounded-[1px]" />
              </span>
              <span>Single Sleeper (₹1050 Lower / ₹1200 Upper)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-white border-1.5 border-[#E7A0BF] relative">
                <span className="absolute top-0.5 inset-x-0.5 h-1.5 bg-[#FCE7F3] rounded-[1px]" />
              </span>
              <span>Double Sleeper (₹950 Lower / ₹1050 Upper)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-[#C13D78] border-1.5 border-[#9E1B55]" />
              <span className="text-[#C13D78] font-bold">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-[#F3F4F6] border-1.5 border-[#D1D5DB]" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-[#FFF1F2] border-1.5 border-[#FDA4AF]" />
              <span className="text-rose-500">Ladies Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-sky-50 border border-sky-300 flex items-center justify-center text-[8px] text-sky-800 font-bold">
                WC
              </span>
              <span className="text-sky-700 font-bold">Onboard Restroom</span>
            </div>
          </>
        ) : isSeaterLayout ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-white border-1.5 border-[#E7A0BF]" />
              <span>Available Pushback Seater (₹550)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-[#C13D78] border-[#9E1B55]" />
              <span className="text-[#C13D78] font-bold">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-gray-100 border-gray-300" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-rose-50 border-rose-300" />
              <span className="text-rose-500">Ladies Seat</span>
            </div>
          </>
        ) : isSleeperLayout ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-white border-1.5 border-[#E7A0BF] relative">
                <span className="absolute top-0.5 inset-x-0.5 h-1.5 bg-[#FCE7F3] rounded-[1px]" />
              </span>
              <span>Single Sleeper (₹950 Lower / ₹1150 Upper)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-white border-1.5 border-[#E7A0BF] relative">
                <span className="absolute top-0.5 inset-x-0.5 h-1.5 bg-[#FCE7F3] rounded-[1px]" />
              </span>
              <span>Double Sleeper (₹850 Lower / ₹1050 Upper)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-[#C13D78] border-1.5 border-[#9E1B55]" />
              <span className="text-[#C13D78] font-bold">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-[#F3F4F6] border-1.5 border-[#D1D5DB]" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-6 rounded bg-[#FFF1F2] border-1.5 border-[#FDA4AF]" />
              <span className="text-rose-500">Ladies Reserved</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-white border-1.5 border-[#E7A0BF]" />
              <span>Available Seater (₹550)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-5 rounded bg-white border-1.5 border-[#E7A0BF] relative">
                <span className="absolute top-0.5 inset-x-0.5 h-1 bg-[#FCE7F3] rounded-[1px]" />
              </span>
              <span>Available Sleeper (₹850 / ₹950 / ₹1150)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-[#C13D78] border-1.5 border-[#9E1B55]" />
              <span className="text-[#C13D78] font-bold">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-gray-100 border-1.5 border-gray-300" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-rose-50 border-1.5 border-rose-300" />
              <span className="text-rose-500">Ladies Reserved</span>
            </div>
          </>
        )}
      </div>

      {/* ==================== BUS DECKS CONTAINER ==================== */}
      {isWashroomSeaterLayout ? (
        /* ============================================================ */
        /* LAYOUT 6: SINGLE DECK ONLY (2+2 PUSHBACK SEATER + REAR WC)  */
        /* ============================================================ */
        <div className="bg-white rounded-2xl border border-[#F1EDFA] p-6 shadow-sm max-w-xl mx-auto flex flex-col justify-between relative w-full">
          {/* Deck Header */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1EDFA]">
              <div>
                <span className="text-base font-extrabold text-[#24152D] tracking-wide">
                  LOWER DECK ONLY
                </span>
                <div className="text-[11px] text-[#6E5D73]">
                  2+2 Pushback Seater Coach with Rear Washroom (38 Seats + WC)
                </div>
              </div>
            </div>

            {/* Front Orientation & Driver Seat Icon */}
            <div className="bg-[#FFF9FB] border border-[#F1EDFA] rounded-xl px-4 py-2.5 my-3 flex items-center justify-between text-xs text-[#6E5D73]">
              <div className="w-8" />
              <div className="text-[11px] font-extrabold tracking-wider text-[#24152D] uppercase text-center">
                ▲ FRONT
              </div>
              <div className="flex items-center justify-end w-8 text-[#24152D]" title="Driver Seat">
                <SteeringWheelIcon className="w-5 h-5 text-[#24152D]" />
              </div>
            </div>

            {/* Column Labels */}
            <div className="flex items-center justify-between px-3 pb-2 text-[11px] font-bold text-[#6E5D73]">
              <span className="w-24 text-center">WINDOW & AISLE</span>
              <span className="flex-1 text-center text-[#AB9CB0] font-semibold tracking-widest text-[10px]">
                WALKING AISLE
              </span>
              <span className="w-24 text-center">AISLE & WINDOW</span>
            </div>

            {/* 10 Bay Rows: Rows 1-9 (S1-S36), Row 10 (S37, S38 + Dedicated Rear Washroom) */}
            <div className="flex flex-col gap-3 py-1">
              {layout6SeaterRows.map((row) => (
                <div
                  key={`l6-seater-row-${row.rowNumber}`}
                  className="flex items-center justify-between gap-8 md:gap-12 p-2 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                >
                  {/* Left Column: 2 Pushback Seater chairs side-by-side (Window & Aisle) */}
                  <div className="flex items-center gap-2">
                    {renderSeaterChair(row.leftSeats[0])}
                    {renderSeaterChair(row.leftSeats[1])}
                  </div>

                  {/* Middle: Walking Gangway / Aisle */}
                  <div className="flex-1 flex flex-col items-center justify-center py-1 text-[#AB9CB0]">
                    <div className="w-[1px] h-3 border-l border-dashed border-[#E7A0BF]/50" />
                    <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                      AISLE
                    </span>
                    <div className="w-[1px] h-3 border-l border-dashed border-[#E7A0BF]/50" />
                  </div>

                  {/* Right Column: Rows 1-9: 2 Pushback Seater chairs; Row 10: Dedicated ONBOARD RESTROOM / WASHROOM */}
                  {row.isRestroom ? (
                    <div
                      className="w-24 sm:w-26 h-9 bg-sky-50 border border-sky-300 rounded-lg p-2 text-center pointer-events-none select-none flex flex-col items-center justify-center shadow-xs"
                      aria-label="Restroom / WC Cubicle"
                    >
                      <div className="flex items-center gap-1 leading-none">
                        <RestroomWCIcon className="w-3.5 h-3.5 text-sky-600" />
                        <span className="text-[8.5px] font-black text-sky-900 uppercase tracking-tight leading-none">
                          RESTROOM / WC
                        </span>
                      </div>
                      <span className="text-[7px] font-bold text-sky-700 tracking-tight leading-none mt-0.5 bg-sky-100/90 px-1 py-0.5 rounded">
                        Sanitized Bio-Toilet
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {renderSeaterChair(row.rightSeats[0])}
                      {renderSeaterChair(row.rightSeats[1])}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : isSeaterLayout ? (
        /* ============================================================ */
        /* LAYOUT 3: SINGLE DECK ONLY (LOWER DECK 2+2 PUSHBACK SEATER)  */
        /* ============================================================ */
        <div className="bg-white rounded-2xl border border-[#F1EDFA] p-6 shadow-sm max-w-xl mx-auto flex flex-col justify-between relative w-full">
          {/* Deck Header */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1EDFA]">
              <div>
                <span className="text-base font-extrabold text-[#24152D] tracking-wide">
                  LOWER DECK ONLY
                </span>
                <div className="text-[11px] text-[#6E5D73]">
                  2+2 Pushback Seater Coach (40 Seats)
                </div>
              </div>
            </div>

            {/* Front Orientation & Driver Seat Icon */}
            <div className="bg-[#FFF9FB] border border-[#F1EDFA] rounded-xl px-4 py-2.5 my-3 flex items-center justify-between text-xs text-[#6E5D73]">
              <div className="w-8" />
              <div className="text-[11px] font-extrabold tracking-wider text-[#24152D] uppercase text-center">
                ▲ FRONT
              </div>
              <div className="flex items-center justify-end w-8 text-[#24152D]" title="Driver Seat">
                <SteeringWheelIcon className="w-5 h-5 text-[#24152D]" />
              </div>
            </div>

            {/* Column Labels */}
            <div className="flex items-center justify-between px-3 pb-2 text-[11px] font-bold text-[#6E5D73]">
              <span className="w-24 text-center">WINDOW & AISLE</span>
              <span className="flex-1 text-center text-[#AB9CB0] font-semibold tracking-widest text-[10px]">
                WALKING AISLE
              </span>
              <span className="w-24 text-center">AISLE & WINDOW</span>
            </div>

            {/* 10 Bay Rows: 2+2 Seater Grid with Middle Walking Gangway / Aisle (gap-8 md:gap-12) */}
            <div className="flex flex-col gap-3 py-1">
              {layout3SeaterRows.map((row) => (
                <div
                  key={`l3-seater-row-${row.rowNumber}`}
                  className="flex items-center justify-between gap-8 md:gap-12 p-2 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                >
                  {/* Left Column: 2 Pushback Seater chairs side-by-side (Window & Aisle) */}
                  <div className="flex items-center gap-2">
                    {renderSeaterChair(row.leftSeats[0])}
                    {renderSeaterChair(row.leftSeats[1])}
                  </div>

                  {/* Middle: Walking Gangway / Aisle */}
                  <div className="flex-1 flex flex-col items-center justify-center py-1 text-[#AB9CB0]">
                    <div className="w-[1px] h-3 border-l border-dashed border-[#E7A0BF]/50" />
                    <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                      AISLE
                    </span>
                    <div className="w-[1px] h-3 border-l border-dashed border-[#E7A0BF]/50" />
                  </div>

                  {/* Right Column: 2 Pushback Seater chairs side-by-side (Aisle & Window) */}
                  <div className="flex items-center gap-2">
                    {renderSeaterChair(row.rightSeats[0])}
                    {renderSeaterChair(row.rightSeats[1])}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            activeDeckTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto'
          }`}
        >
          {/* ============================================================ */}
          {/* 1. LOWER DECK CONTAINER (Layout 1 & 2)                       */}
          {/* ============================================================ */}
          {(activeDeckTab === 'both' || activeDeckTab === 'lower') && (
            <div className="bg-white rounded-2xl border border-[#F1EDFA] p-5 shadow-sm flex flex-col justify-between relative">
              {/* Deck Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F1EDFA]">
                  <div>
                    <span className="text-base font-extrabold text-[#24152D] tracking-wide">
                      LOWER DECK
                    </span>
                    <div className="text-[11px] text-[#6E5D73]">
                      {isFrontWashroomSleeperLayout
                        ? '1 Front Restroom + 5 Single Sleepers + Aisle + 12 Double Sleepers (17 Berths + WC)'
                        : isWashroomSleeperLayout
                        ? '1 Single Sleeper + Aisle + Double Sleeper & Onboard Restroom (16 Berths + WC)'
                        : activeLayout === 'Fully Sleeper'
                        ? '1 Single Sleeper + Aisle + 2 Double Sleeper (18 Berths)'
                        : '1 Sleeper + Aisle + 2 Seater (30 Positions)'}
                    </div>
                  </div>
                </div>

                {/* Front Orientation & Driver Seat Icon */}
                <div className="bg-[#FFF9FB] border border-[#F1EDFA] rounded-xl px-4 py-2.5 my-3 flex items-center justify-between text-xs text-[#6E5D73]">
                  <div className="w-8" />
                  <div className="text-[11px] font-extrabold tracking-wider text-[#24152D] uppercase text-center">
                    ▲ FRONT
                  </div>
                  <div className="flex items-center justify-end w-8 text-[#24152D]" title="Driver Seat">
                    <SteeringWheelIcon className="w-5 h-5 text-[#24152D]" />
                  </div>
                </div>

                {/* Column Labels */}
                <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-bold text-[#6E5D73]">
                  <span className="w-14 text-center">
                    SINGLE
                  </span>
                  <span className="flex-1 text-center text-[#AB9CB0] font-semibold tracking-widest text-[10px]">
                    WALKING AISLE
                  </span>
                  <span className="w-28 text-center">
                    {activeLayout === '2+1 Combo (Tata Prakash)' || isComboLayout ? 'PUSHBACK SEATERS' : isWashroomSleeperLayout ? 'DOUBLE & WC' : 'DOUBLE'}
                  </span>
                </div>

                {/* LOWER DECK ROWS */}
                {isFrontWashroomSleeperLayout ? (
                  /* Layout 5: 17 Lower Sleeper Berths + 1 Front Washroom Cubicle in Row 1 Left (Replacing L1) */
                  <div className="flex flex-col gap-3.5 py-1">
                    {layout5LowerDeckRows.map((row) => (
                      <div
                        key={`l5-lower-row-${row.rowNumber}`}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                      >
                        {/* Left Column: Row 1 is Front Restroom WC Box; Rows 2 to 6 are 1 Single Vertical Sleeper (w-11 h-20) */}
                        <div className="flex items-center justify-center w-14">
                          {row.isRestroom ? (
                            <div
                              className="w-11 h-20 min-w-[44px] min-h-[80px] bg-sky-50 border border-sky-300 rounded-md flex flex-col items-center justify-center p-1 text-center select-none pointer-events-none"
                              aria-label="Front Restroom / WC Cubicle"
                            >
                              <RestroomWCIcon className="w-4 h-4 text-sky-600 mb-0.5" />
                              <span className="text-[9px] font-black text-sky-800 uppercase tracking-tight leading-none">
                                REST
                              </span>
                              <span className="text-[9px] font-black text-sky-800 uppercase tracking-tight leading-none">
                                ROOM
                              </span>
                              <span className="text-[8px] font-extrabold text-sky-700 mt-0.5 bg-sky-100/90 px-1 py-0.2 rounded">
                                WC
                              </span>
                            </div>
                          ) : (
                            renderVerticalSleeper(row.singleSleeper, 'w-11 h-20 min-w-[44px] min-h-[80px]', true)
                          )}
                        </div>

                        {/* Middle: Walking Gangway / Aisle */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 text-[#AB9CB0]">
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                          <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                            AISLE
                          </span>
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                        </div>

                        {/* Right Column: 6 pairs of Double Vertical Sleepers (L7-L18) */}
                        <div className="w-26 sm:w-28 h-20 flex items-center justify-between gap-1.5 px-0.5">
                          {renderVerticalSleeper(row.doubleSleepers[0], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                          {/* Individual Berth Partition Divider */}
                          <div className="w-[1.5px] h-14 bg-[#E7A0BF]/40 rounded-full my-auto" />
                          {renderVerticalSleeper(row.doubleSleepers[1], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isWashroomSleeperLayout ? (
                  /* Layout 4: 16 Lower Sleeper Berths + 1 Washroom Cubicle in Rear Right */
                  <div className="flex flex-col gap-3.5 py-1">
                    {layout4LowerDeckRows.map((row) => (
                      <div
                        key={`l4-lower-row-${row.rowNumber}`}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                      >
                        {/* Left Column: 1 Single Vertical Sleeper (w-11 h-20) */}
                        <div className="flex items-center justify-center w-14">
                          {renderVerticalSleeper(row.singleSleeper, 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>

                        {/* Middle: Walking Gangway / Aisle */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 text-[#AB9CB0]">
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                          <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                            AISLE
                          </span>
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                        </div>

                        {/* Right Column: Rows 1 to 5: 2 Double Vertical Sleepers; Row 6: Dedicated Onboard Restroom */}
                        {row.isRestroom ? (
                          <div
                            className="w-26 sm:w-28 h-20 bg-sky-50 border border-sky-200 rounded-lg p-2 text-center flex flex-col items-center justify-center select-none shadow-xs pointer-events-none"
                            aria-label="Restroom / WC Cubicle"
                          >
                            <RestroomWCIcon className="w-5 h-5 text-sky-600 mb-0.5" />
                            <span className="text-[10px] font-black text-sky-900 uppercase tracking-tight leading-none">
                              RESTROOM / WC
                            </span>
                            <span className="text-[8px] font-semibold text-sky-600 tracking-tight leading-none mt-1 bg-sky-100/80 px-1 py-0.5 rounded">
                              Sanitized Bio-Toilet
                            </span>
                          </div>
                        ) : (
                          <div className="w-26 sm:w-28 h-20 flex items-center justify-between gap-1.5 px-0.5">
                            {renderVerticalSleeper(row.doubleSleepers[0], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                            {/* Individual Berth Partition Divider */}
                            <div className="w-[1.5px] h-14 bg-[#E7A0BF]/40 rounded-full my-auto" />
                            {renderVerticalSleeper(row.doubleSleepers[1], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : activeLayout === 'Fully Sleeper' ? (
                  /* Layout 2: 18 Lower Sleeper Berths (6 Single L1-L6 + Aisle + 6 Double Pairs L7-L18) */
                  <div className="flex flex-col gap-3.5 py-1">
                    {layout2LowerDeckRows.map((row) => (
                      <div
                        key={`l2-lower-row-${row.rowNumber}`}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                      >
                        {/* Left Column: 1 Single Vertical Sleeper (w-11 h-20) */}
                        <div className="flex items-center justify-center w-14">
                          {renderVerticalSleeper(row.singleSleeper, 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>

                        {/* Middle: Walking Gangway / Aisle */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 text-[#AB9CB0]">
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                          <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                            AISLE
                          </span>
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                        </div>

                        {/* Right Column: 2 Double Vertical Sleepers side-by-side with partition (w-11 h-20 each) */}
                        <div className="w-26 sm:w-28 h-20 flex items-center justify-between gap-1.5 px-0.5">
                          {renderVerticalSleeper(row.doubleSleepers[0], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                          {/* Individual Berth Partition Divider */}
                          <div className="w-[1.5px] h-14 bg-[#E7A0BF]/40 rounded-full my-auto" />
                          {renderVerticalSleeper(row.doubleSleepers[1], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Layout 1: 48-Seat Tata Capella Lower Deck (1 Sleeper + Aisle + 2 Seater) */
                  <div className="flex flex-col gap-3.5 py-1">
                    {lowerDeckRows.map((row) => (
                      <div
                        key={`lower-row-${row.rowNumber}`}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                      >
                        {/* Left Column: 1 Vertical Sleeper (w-10 h-20) */}
                        <div className="flex items-center justify-center w-12">
                          {renderVerticalSleeper(row.sleeper, '', false)}
                        </div>

                        {/* Middle: Walking Gangway / Aisle */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 text-[#AB9CB0]">
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                          <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                            AISLE
                          </span>
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                        </div>

                        {/* Right Column: 2 Pushback Seater Chairs side-by-side in 2 Rows (Exact height of 1 Sleeper: h-20) */}
                        <div className="w-24 h-20 flex flex-col justify-between items-center py-0.5">
                          {/* Sub-row 1 (e.g., S1, S2) */}
                          <div className="flex items-center gap-1.5">
                            {renderSeaterChair(row.subRow1[0])}
                            {renderSeaterChair(row.subRow1[1])}
                          </div>
                          {/* Sub-row 2 (e.g., S3, S4) */}
                          <div className="flex items-center gap-1.5">
                            {renderSeaterChair(row.subRow2[0])}
                            {renderSeaterChair(row.subRow2[1])}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* 2. UPPER DECK CONTAINER (Layout 1 & 2)                       */}
          {/* ============================================================ */}
          {(activeDeckTab === 'both' || activeDeckTab === 'upper') && (
            <div className="bg-white rounded-2xl border border-[#F1EDFA] p-5 shadow-sm flex flex-col justify-between relative">
              {/* Deck Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F1EDFA]">
                  <div>
                    <span className="text-base font-extrabold text-[#24152D] tracking-wide">
                      UPPER DECK
                    </span>
                    <div className="text-[11px] text-[#6E5D73]">
                      {isFrontWashroomSleeperLayout || isWashroomSleeperLayout
                        ? '1 Single Sleeper + Aisle + 2 Double Sleeper (18 Berths)'
                        : activeLayout === 'Fully Sleeper'
                        ? '1 Single Sleeper + Aisle + 2 Double Sleeper (18 Berths)'
                        : '1 Sleeper + Aisle + 2 Sleeper (18 Berths)'}
                    </div>
                  </div>
                </div>

                {/* Front Orientation */}
                <div className="bg-[#FFF9FB] border border-[#F1EDFA] rounded-xl px-4 py-2.5 my-3 flex items-center justify-center text-xs text-[#6E5D73]">
                  <div className="text-[11px] font-extrabold tracking-wider text-[#24152D] uppercase text-center">
                    ▲ FRONT
                  </div>
                </div>

                {/* Column Labels */}
                <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-bold text-[#6E5D73]">
                  <span className="w-14 text-center">
                    SINGLE
                  </span>
                  <span className="flex-1 text-center text-[#AB9CB0] font-semibold tracking-widest text-[10px]">
                    WALKING AISLE
                  </span>
                  <span className="w-28 text-center">
                    DOUBLE
                  </span>
                </div>

                {/* UPPER DECK ROWS */}
                {isFrontWashroomSleeperLayout ? (
                  /* Layout 5: 18 Upper Sleeper Berths (6 Single U1-U6 @ ₹1200 + Aisle + 6 Double Pairs U7-U18 @ ₹1050) */
                  <div className="flex flex-col gap-3.5 py-1">
                    {layout5UpperDeckRows.map((row) => (
                      <div
                        key={`l5-upper-row-${row.rowNumber}`}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                      >
                        {/* Left Column: Single Vertical Sleeper (w-11 h-20) */}
                        <div className="flex items-center justify-center w-14">
                          {renderVerticalSleeper(row.singleSleeper, 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>

                        {/* Middle: Walking Gangway / Aisle */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 text-[#AB9CB0]">
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                          <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                            AISLE
                          </span>
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                        </div>

                        {/* Right Column: 2 Vertical Sleepers side-by-side with partition (w-11 h-20 each) */}
                        <div className="w-26 sm:w-28 h-20 flex items-center justify-between gap-1.5 px-0.5">
                          {renderVerticalSleeper(row.doubleSleepers[0], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                          {/* Individual Berth Partition Divider */}
                          <div className="w-[1.5px] h-14 bg-[#E7A0BF]/40 rounded-full my-auto" />
                          {renderVerticalSleeper(row.doubleSleepers[1], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isWashroomSleeperLayout ? (
                  /* Layout 4: 18 Upper Sleeper Berths (6 Single U1-U6 @ ₹1200 + Aisle + 6 Double Pairs U7-U18 @ ₹1050) */
                  <div className="flex flex-col gap-3.5 py-1">
                    {layout4UpperDeckRows.map((row) => (
                      <div
                        key={`l4-upper-row-${row.rowNumber}`}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                      >
                        {/* Left Column: Single Vertical Sleeper (w-11 h-20) */}
                        <div className="flex items-center justify-center w-14">
                          {renderVerticalSleeper(row.singleSleeper, 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>

                        {/* Middle: Walking Gangway / Aisle */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 text-[#AB9CB0]">
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                          <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                            AISLE
                          </span>
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                        </div>

                        {/* Right Column: 2 Vertical Sleepers side-by-side with partition (w-11 h-20 each) */}
                        <div className="w-26 sm:w-28 h-20 flex items-center justify-between gap-1.5 px-0.5">
                          {renderVerticalSleeper(row.doubleSleepers[0], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                          {/* Individual Berth Partition Divider */}
                          <div className="w-[1.5px] h-14 bg-[#E7A0BF]/40 rounded-full my-auto" />
                          {renderVerticalSleeper(row.doubleSleepers[1], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeLayout === 'Fully Sleeper' ? (
                  /* Layout 2: 18 Upper Sleeper Berths (6 Single U1-U6 @ ₹1150 + Aisle + 6 Double Pairs U7-U18 @ ₹1050) */
                  <div className="flex flex-col gap-3.5 py-1">
                    {layout2UpperDeckRows.map((row) => (
                      <div
                        key={`l2-upper-row-${row.rowNumber}`}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                      >
                        {/* Left Column: Single Vertical Sleeper (w-11 h-20) */}
                        <div className="flex items-center justify-center w-14">
                          {renderVerticalSleeper(row.singleSleeper, 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>

                        {/* Middle: Walking Gangway / Aisle */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 text-[#AB9CB0]">
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                          <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                            AISLE
                          </span>
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                        </div>

                        {/* Right Column: 2 Vertical Sleepers side-by-side with partition (w-11 h-20 each) */}
                        <div className="w-26 sm:w-28 h-20 flex items-center justify-between gap-1.5 px-0.5">
                          {renderVerticalSleeper(row.doubleSleepers[0], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                          {/* Individual Berth Partition Divider */}
                          <div className="w-[1.5px] h-14 bg-[#E7A0BF]/40 rounded-full my-auto" />
                          {renderVerticalSleeper(row.doubleSleepers[1], 'w-11 h-20 min-w-[44px] min-h-[80px]', true)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Layout 1: 48-Seat Tata Capella Upper Deck */
                  <div className="flex flex-col gap-3.5 py-1">
                    {upperDeckRows.map((row) => (
                      <div
                        key={`upper-row-${row.rowNumber}`}
                        className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#FAFAFC] border border-[#F1EDFA]/80 hover:border-[#E7A0BF]/50 transition-colors"
                      >
                        {/* Left Column: Single Vertical Sleeper (w-10 h-20) */}
                        <div className="flex items-center justify-center w-12">
                          {renderVerticalSleeper(row.singleSleeper, '', false)}
                        </div>

                        {/* Middle: Walking Gangway / Aisle */}
                        <div className="flex-1 flex flex-col items-center justify-center py-2 text-[#AB9CB0]">
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                          <span className="text-[9px] font-bold tracking-widest my-0.5 opacity-70">
                            AISLE
                          </span>
                          <div className="w-[1px] h-4 border-l border-dashed border-[#E7A0BF]/50" />
                        </div>

                        {/* Right Column: 2 Vertical Sleepers side-by-side with individual partition */}
                        <div className="w-24 h-20 flex items-center justify-between gap-1 px-0.5">
                          {renderVerticalSleeper(row.doubleSleepers[0], '', false)}
                          {/* Individual Berth Partition Divider */}
                          <div className="w-[1.5px] h-14 bg-[#E7A0BF]/40 rounded-full my-auto" />
                          {renderVerticalSleeper(row.doubleSleepers[1], '', false)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. BOTTOM FLOATING / STICKY SELECTION SUMMARY BAR            */}
      {/* ============================================================ */}
      {showFloatingBar && (
        <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border border-[#F1EDFA] rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
          {/* Selected Seat Pills & Count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#6E5D73]">Selected:</span>
              <span className="bg-[#FFF1F6] text-[#C13D78] font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-[#E7A0BF]/50">
                {selectedSeatObjects.length} / 6
              </span>
            </div>

            {/* Pills list */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedSeatObjects.length === 0 ? (
                <span className="text-xs text-[#AB9CB0] italic">
                  No berths selected. Click any available seat or berth above.
                </span>
              ) : (
                selectedSeatObjects.map((s) => (
                  <div
                    key={s.id}
                    className="bg-[#FFF1F6] border border-[#E7A0BF] text-[#24152D] rounded-lg px-2.5 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs group"
                  >
                    <span className="text-[#C13D78]">{s.id}</span>
                    <span className="text-[#6E5D73] font-semibold">₹{s.price}</span>
                    <button
                      type="button"
                      onClick={() => handleSeatClick(s)}
                      className="text-[#6E5D73] hover:text-[#C13D78] transition-colors p-0.5 ml-0.5"
                      title="Remove seat"
                      aria-label={`Remove seat ${s.id}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pricing & Proceed CTA Button */}
          <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-[#F1EDFA]">
            <div className="flex flex-col text-left md:text-right">
              <span className="text-[11px] font-semibold text-[#6E5D73] uppercase tracking-wider">
                Total Calculated Fare:
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#C13D78] leading-none" data-testid="total-amount">
                ₹{totalCalculatedFare.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="button"
              disabled={selectedSeats.length === 0}
              onClick={handleProceedToPassengerDetails}
              className="bg-[#C13D78] hover:bg-[#A82F65] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-[#C13D78]/25 transition-all duration-150 flex items-center gap-2 text-sm active:scale-98 cursor-pointer"
            >
              <span>Proceed to Passenger Details</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
