import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api.js';
import PlaceAutocomplete from '../../components/common/PlaceAutocomplete.jsx';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import TataPrakashSeatLayout from '../../components/seats/TataPrakashSeatLayout.jsx';
import SearchAmenitiesRibbon from '../../components/passenger/SearchAmenitiesRibbon.jsx';
import BusRoutesCaravan from '../../components/passenger/BusRoutesCaravan.jsx';
import AiSmartFilter from '../../components/passenger/AiSmartFilter.jsx';
import FilterSidebar from '../../components/passenger/FilterSidebar.jsx';
import PromotionalBanners from '../../components/passenger/PromotionalBanners.jsx';
import SortByBar from '../../components/passenger/SortByBar.jsx';
import PopularFiltersScroller from '../../components/passenger/PopularFiltersScroller.jsx';
import LandingHero from '../../components/passenger/LandingHero.jsx';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Bus,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Zap,
  Droplets,
  ShieldCheck,
  Armchair,
  BedDouble,
  Star,
  Radio,
  Tag,
  X,
  RotateCcw,
} from 'lucide-react';

const COIMBATORE_CORRIDORS = [
  // Tamil Nadu (11)
  { from: 'Coimbatore', to: 'Chennai', region: 'Tamil Nadu', distance: '510 km', duration: '8.5h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Madurai', region: 'Tamil Nadu', distance: '215 km', duration: '4.5h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Tirunelveli', region: 'Tamil Nadu', distance: '360 km', duration: '7h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Tenkasi', region: 'Tamil Nadu', distance: '320 km', duration: '8h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Nagercoil', region: 'Tamil Nadu', distance: '430 km', duration: '8.5h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Thoothukudi', region: 'Tamil Nadu', distance: '340 km', duration: '7h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Rameswaram', region: 'Tamil Nadu', distance: '380 km', duration: '8h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Tiruchendur', region: 'Tamil Nadu', distance: '380 km', duration: '8h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Trichy', region: 'Tamil Nadu', distance: '220 km', duration: '4.5h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Thanjavur', region: 'Tamil Nadu', distance: '275 km', duration: '5.5h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Salem', region: 'Tamil Nadu', distance: '165 km', duration: '3.5h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Karaikudi', region: 'Tamil Nadu', distance: '265 km', duration: '6h 15m', status: 'SEED' },
  // Kerala (5)
  { from: 'Coimbatore', to: 'Kochi', region: 'Kerala', distance: '190 km', duration: '4h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Ernakulam', region: 'Kerala', distance: '195 km', duration: '4h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Thrissur', region: 'Kerala', distance: '115 km', duration: '2.5h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Kozhikode', region: 'Kerala', distance: '180 km', duration: '4.5h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Thiruvananthapuram', region: 'Kerala', distance: '390 km', duration: '8.5h', status: 'SEED' },
  // Karnataka (3)
  { from: 'Coimbatore', to: 'Bengaluru', region: 'Karnataka', distance: '365 km', duration: '6h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Mysuru', region: 'Karnataka', distance: '200 km', duration: '5h', status: 'SEED' },
  { from: 'Coimbatore', to: 'Mangaluru', region: 'Karnataka', distance: '420 km', duration: '9h', status: 'SEED' },
  // Telangana (1)
  { from: 'Coimbatore', to: 'Hyderabad', region: 'Andhra & Telangana', distance: '920 km', duration: '15h', status: 'SEED' },
  // Goa & Maharashtra (3)
  { from: 'Coimbatore', to: 'Goa', region: 'Goa & Maharashtra', distance: '780 km', duration: '15h', status: 'CANDIDATE' },
  { from: 'Coimbatore', to: 'Mumbai', region: 'Goa & Maharashtra', distance: '1290 km', duration: '22h', status: 'CANDIDATE' },
  { from: 'Coimbatore', to: 'Pune', region: 'Goa & Maharashtra', distance: '1140 km', duration: '19h', status: 'CANDIDATE' },
];

const BENGALURU_CORRIDORS = [
  // Tamil Nadu (14)
  { from: 'Bengaluru', to: 'Coimbatore', region: 'Tamil Nadu', distance: '365 km', duration: '6h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Chennai', region: 'Tamil Nadu', distance: '350 km', duration: '6h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Madurai', region: 'Tamil Nadu', distance: '440 km', duration: '7.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Tirunelveli', region: 'Tamil Nadu', distance: '580 km', duration: '9.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Nagercoil', region: 'Tamil Nadu', distance: '660 km', duration: '11h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Salem', region: 'Tamil Nadu', distance: '200 km', duration: '3.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Erode', region: 'Tamil Nadu', distance: '265 km', duration: '4.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Tiruppur', region: 'Tamil Nadu', distance: '310 km', duration: '5.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Trichy', region: 'Tamil Nadu', distance: '330 km', duration: '6h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Thanjavur', region: 'Tamil Nadu', distance: '390 km', duration: '7h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Tenkasi', region: 'Tamil Nadu', distance: '560 km', duration: '9.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Thoothukudi', region: 'Tamil Nadu', distance: '570 km', duration: '9.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Rameswaram', region: 'Tamil Nadu', distance: '600 km', duration: '10.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Hosur', region: 'Tamil Nadu', distance: '42 km', duration: '1h', status: 'SEED' },
  // Kerala (9)
  { from: 'Bengaluru', to: 'Kochi', region: 'Kerala', distance: '540 km', duration: '9.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Ernakulam', region: 'Kerala', distance: '545 km', duration: '9.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Thrissur', region: 'Kerala', distance: '470 km', duration: '8h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Kozhikode', region: 'Kerala', distance: '360 km', duration: '7.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Kannur', region: 'Kerala', distance: '320 km', duration: '7h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Palakkad', region: 'Kerala', distance: '410 km', duration: '7.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Thiruvananthapuram', region: 'Kerala', distance: '730 km', duration: '12.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Kollam', region: 'Kerala', distance: '670 km', duration: '11.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Kottayam', region: 'Kerala', distance: '560 km', duration: '10h', status: 'SEED' },
  // Andhra Pradesh & Telangana (7)
  { from: 'Bengaluru', to: 'Hyderabad', region: 'Andhra & Telangana', distance: '570 km', duration: '8.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Vijayawada', region: 'Andhra & Telangana', distance: '650 km', duration: '10.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Visakhapatnam', region: 'Andhra & Telangana', distance: '1010 km', duration: '16h', status: 'CANDIDATE' },
  { from: 'Bengaluru', to: 'Tirupati', region: 'Andhra & Telangana', distance: '250 km', duration: '4.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Guntur', region: 'Andhra & Telangana', distance: '620 km', duration: '10h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Kurnool', region: 'Andhra & Telangana', distance: '360 km', duration: '5.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Nellore', region: 'Andhra & Telangana', distance: '390 km', duration: '6.5h', status: 'SEED' },
  // Karnataka (4)
  { from: 'Bengaluru', to: 'Mysuru', region: 'Karnataka', distance: '145 km', duration: '2.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Mangaluru', region: 'Karnataka', distance: '350 km', duration: '7.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Belagavi', region: 'Karnataka', distance: '510 km', duration: '8h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Hubballi', region: 'Karnataka', distance: '410 km', duration: '6.5h', status: 'SEED' },
  // Goa & Maharashtra (4)
  { from: 'Bengaluru', to: 'Goa', region: 'Goa & Maharashtra', distance: '590 km', duration: '11h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Mumbai', region: 'Goa & Maharashtra', distance: '985 km', duration: '16h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Pune', region: 'Goa & Maharashtra', distance: '840 km', duration: '13.5h', status: 'SEED' },
  { from: 'Bengaluru', to: 'Shirdi', region: 'Goa & Maharashtra', distance: '1020 km', duration: '16.5h', status: 'SEED' },
];

const INITIAL_FILTERS = {
  searchKeyword: '',
  busTypes: [], // 'ac', 'sleeper', 'seater', 'non_ac', 'live_track', 'new_fleet', 'offers'
  priceRange: [500, 2500],
  departureTimeSlots: [], // 'before_10am', '10am_5pm', '5pm_11pm', 'after_11pm'
  operators: [],
  boardingPoints: [],
  droppingPoints: [],
  singleWindowOnly: false,
  amenities: [],
  quickPills: [],
};

export default function SearchTrips() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters (e.g., /search?from=Coimbatore&to=Tenkasi)
  const initialFrom = searchParams.get('from') || searchParams.get('origin') || 'Coimbatore';
  const initialTo = searchParams.get('to') || searchParams.get('destination') || 'Tenkasi';
  const initialDate = searchParams.get('date');

  // Search parameters
  const [fromCity, setFromCity] = useState(initialFrom);
  const [toCity, setToCity] = useState(initialTo);
  const [date, setDate] = useState(() => {
    if (initialDate) return initialDate;
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [passengers, setPassengers] = useState(1);

  // Raw fetched trips & candidate corridor state
  const [trips, setTrips] = useState([]);
  const [candidateCorridor, setCandidateCorridor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Accordion state: ID of currently expanded bus card
  const [expandedTripId, setExpandedTripId] = useState(null);

  // Corridor Explorer UI state
  const [explorerHub, setExplorerHub] = useState('Coimbatore');
  const [explorerRegion, setExplorerRegion] = useState('all');
  const [showExplorer, setShowExplorer] = useState(false);

  // Comprehensive Filter State
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Sort State
  const [sortBy, setSortBy] = useState('departure'); // 'departure', 'arrival', 'price', 'ratings', 'seats'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // Mobile Filter Drawer / Bottom Sheet state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showModifySearch, setShowModifySearch] = useState(false);

  // Pagination state
  const [displayCount, setDisplayCount] = useState(6);

  // Fetch trips from API matching specific corridor
  const fetchTrips = async (src, dst, travelDate) => {
    if (!src || !dst) {
      setSearchError('Source (From) and Destination (To) cities are required.');
      setTrips([]);
      setLoading(false);
      return;
    }
    if (src.trim().toLowerCase() === dst.trim().toLowerCase()) {
      setSearchError('Origin and destination cannot be the same city.');
      setTrips([]);
      setCandidateCorridor(null);
      setLoading(false);
      return;
    }

    setSearchError(null);
    setLoading(true);
    setSearched(true);
    setDisplayCount(6);
    setExpandedTripId(null);

    try {
      const endpoint = travelDate
        ? `/trips/search?fromCity=${encodeURIComponent(src.trim())}&toCity=${encodeURIComponent(dst.trim())}&date=${travelDate}`
        : `/trips/search?fromCity=${encodeURIComponent(src.trim())}&toCity=${encodeURIComponent(dst.trim())}`;

      const res = await api.get(endpoint);
      const tripList = res.trips || res.data?.trips || [];
      const candidate = res.candidateCorridor || res.data?.candidateCorridor || null;
      setCandidateCorridor(candidate);

      if (tripList.length > 0) {
        setTrips(tripList);
      } else {
        // Broad search fallback
        const fallbackRes = await api.get(`/trips/search?fromCity=${encodeURIComponent(src.trim())}&toCity=${encodeURIComponent(dst.trim())}`);
        const fallbackList = fallbackRes.trips || fallbackRes.data?.trips || [];
        setTrips(fallbackList);
        if (!candidate && (fallbackRes.candidateCorridor || fallbackRes.data?.candidateCorridor)) {
          setCandidateCorridor(fallbackRes.candidateCorridor || fallbackRes.data?.candidateCorridor);
        }
      }
    } catch (err) {
      console.error('Trip discovery error:', err);
      setTrips([]);
      setCandidateCorridor(null);
      if (err.message && err.message.toLowerCase().includes('same')) {
        setSearchError('Origin and destination cannot be the same city.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync with URL parameters when route changes (e.g. from caravan card click)
  useEffect(() => {
    const pFrom = searchParams.get('from') || searchParams.get('origin');
    const pTo = searchParams.get('to') || searchParams.get('destination');
    const pDate = searchParams.get('date');

    const effectiveFrom = pFrom || fromCity;
    const effectiveTo = pTo || toCity;
    const effectiveDate = pDate || date;

    if (pFrom && pFrom !== fromCity) setFromCity(pFrom);
    if (pTo && pTo !== toCity) setToCity(pTo);
    if (pDate && pDate !== date) setDate(pDate);

    fetchTrips(effectiveFrom, effectiveTo, effectiveDate);
  }, [searchParams]);

  const flushStaleBookingSession = () => {
    sessionStorage.removeItem('smartroute_active_bus');
    sessionStorage.removeItem('smartroute_selected_seats');
    sessionStorage.removeItem('smartroute_boarding_point');
    sessionStorage.removeItem('smartroute_dropping_point');
    sessionStorage.removeItem('smartroute_booking_session');
  };

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!fromCity || !fromCity.trim()) {
      setSearchError('Please select a valid Source (From) city.');
      return;
    }
    if (!toCity || !toCity.trim()) {
      setSearchError('Please select a valid Destination (To) city.');
      return;
    }
    if (!date) {
      setSearchError('Please select a valid Journey Date.');
      return;
    }
    if (fromCity.trim().toLowerCase() === toCity.trim().toLowerCase()) {
      setSearchError('Origin and destination cannot be the same city.');
      setTrips([]);
      return;
    }
    setSearchError(null);
    flushStaleBookingSession();
    setSearchParams({
      from: fromCity.trim(),
      to: toCity.trim(),
      date,
    });
    fetchTrips(fromCity.trim(), toCity.trim(), date);
  };

  const handleSwapCities = () => {
    flushStaleBookingSession();
    setSearchError(null);
    const temp = fromCity;
    const nextFrom = toCity;
    const nextTo = temp;
    setFromCity(nextFrom);
    setToCity(nextTo);
    setSearchParams({
      from: nextFrom,
      to: nextTo,
      date,
    });
    fetchTrips(nextFrom, nextTo, date);
  };

  const searchBarRef = useRef(null);

  const applyCorridor = (corridor) => {
    flushStaleBookingSession();
    setFromCity(corridor.from);
    setToCity(corridor.to);
    setSearchParams({
      from: corridor.from,
      to: corridor.to,
      date,
    });
    fetchTrips(corridor.from, corridor.to, date);
  };

  const applyCaravanRoute = (route) => {
    flushStaleBookingSession();
    const src = route.searchFrom || route.from;
    const dst = route.searchTo || route.to;
    setFromCity(src);
    setToCity(dst);
    setSearchParams({
      from: src,
      to: dst,
      date,
    });
    fetchTrips(src, dst, date);
  };

  // Dedicated View Seats Navigation handler
  const handleViewSeats = (trip) => {
    flushStaleBookingSession();
    const tripId = trip.tripId || trip.id;
    const operator = trip.travelName || trip.travel_name || trip.operator_name || trip.operatorName || trip.bus_name;
    const serviceNo = trip.service_number || trip.serviceNumber || trip.trip_number || trip.bus_number;
    const regNo = trip.registration_number || trip.bus_registration_number || trip.busNumber || trip.bus_number || serviceNo;
    const activeBusData = {
      id: trip.bus_id || trip.id || tripId,
      busId: trip.bus_id || trip.id || tripId,
      tripId,
      bus_number: regNo,
      busNumber: regNo,
      registration_number: regNo,
      registrationNumber: regNo,
      service_number: serviceNo,
      serviceNumber: serviceNo,
      trip_number: serviceNo,
      operator_name: operator,
      operatorName: operator,
      travel_name: operator,
      travelName: operator,
      bus_type: trip.bus_type || trip.busType || 'AC Sleeper 2+1',
      originCity: fromCity || trip.source,
      destinationCity: toCity || trip.destination,
      origin_city: fromCity || trip.source,
      destination_city: toCity || trip.destination,
      source: fromCity || trip.source,
      destination: toCity || trip.destination,
      departure_time: trip.departure_time,
      departureTime: trip.departure_time,
      arrival_time: trip.estimated_arrival_time || trip.arrival_time,
      estimated_arrival_time: trip.estimated_arrival_time || trip.arrival_time,
      arrivalTime: trip.estimated_arrival_time || trip.arrival_time,
      base_fare: trip.base_fare,
      fare: trip.base_fare,
    };
    try {
      sessionStorage.setItem('smartroute_active_bus', JSON.stringify(activeBusData));
    } catch (e) {
      // storage unavailable
    }

    navigate(`/book/${tripId}?date=${encodeURIComponent(date)}&fromCity=${encodeURIComponent(fromCity)}&toCity=${encodeURIComponent(toCity)}`, {
      state: {
        busId: trip.bus_id || trip.id || tripId,
        tripId,
        travelDate: date,
        fromCity,
        toCity,
        trip,
        selectedBus: activeBusData,
        boardingStopId: trip.boardingStopId,
        droppingStopId: trip.droppingStopId,
        boardingPoint: trip.boardingStopName,
        droppingPoint: trip.droppingStopName,
      },
    });
  };

  // Toggle View Seats accordion behavior
  const handleToggleSeats = (tripOrTripId) => {
    const tripObj = typeof tripOrTripId === 'object' ? tripOrTripId : trips.find((t) => (t.tripId || t.id) === tripOrTripId);
    const targetTripId = typeof tripOrTripId === 'object' ? (tripOrTripId.tripId || tripOrTripId.id) : tripOrTripId;

    if (expandedTripId === targetTripId) {
      setExpandedTripId(null);
    } else {
      if (tripObj) {
        const operator = tripObj.travelName || tripObj.travel_name || tripObj.operator_name || tripObj.operatorName || tripObj.bus_name;
        const serviceNo = tripObj.service_number || tripObj.serviceNumber || tripObj.trip_number || tripObj.bus_number;
        const regNo = tripObj.registration_number || tripObj.bus_registration_number || tripObj.busNumber || tripObj.bus_number || serviceNo;
        const activeBusData = {
          id: tripObj.bus_id || tripObj.id || targetTripId,
          busId: tripObj.bus_id || tripObj.id || targetTripId,
          tripId: targetTripId,
          bus_number: regNo,
          busNumber: regNo,
          registration_number: regNo,
          registrationNumber: regNo,
          service_number: serviceNo,
          serviceNumber: serviceNo,
          trip_number: serviceNo,
          operator_name: operator,
          operatorName: operator,
          travel_name: operator,
          travelName: operator,
          bus_type: tripObj.bus_type || tripObj.busType || 'AC Sleeper 2+1',
          originCity: fromCity || tripObj.source,
          destinationCity: toCity || tripObj.destination,
          origin_city: fromCity || tripObj.source,
          destination_city: toCity || tripObj.destination,
          source: fromCity || tripObj.source,
          destination: toCity || tripObj.destination,
          departure_time: tripObj.departure_time,
          departureTime: tripObj.departure_time,
          arrival_time: tripObj.estimated_arrival_time || tripObj.arrival_time,
          estimated_arrival_time: tripObj.estimated_arrival_time || tripObj.arrival_time,
          arrivalTime: tripObj.estimated_arrival_time || tripObj.arrival_time,
          base_fare: tripObj.base_fare,
          fare: tripObj.base_fare,
        };
        try {
          sessionStorage.setItem('smartroute_active_bus', JSON.stringify(activeBusData));
        } catch (e) {
          // ignore
        }
      }
      setExpandedTripId(targetTripId);
    }
  };

  // Filter modifiers
  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleToggleQuickPill = (pillKey) => {
    setFilters((prev) => {
      const current = prev.quickPills || [];
      const next = current.includes(pillKey)
        ? current.filter((k) => k !== pillKey)
        : [...current, pillKey];
      return { ...prev, quickPills: next };
    });
  };

  const handleSortChange = (newSortBy, newOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newOrder);
  };

  // Extract metadata from current trips set
  const availableOperators = useMemo(() => {
    const ops = new Set();
    trips.forEach((t) => {
      const name = t.travelName || t.travel_name;
      if (name) ops.add(name);
    });
    return Array.from(ops);
  }, [trips]);

  const availableBoardingPoints = useMemo(() => {
    const points = new Set();
    const isCoimbatore = (fromCity || '').toLowerCase().includes('coimbatore');
    trips.forEach((t) => {
      const bpList = t.boarding_points || t.boardingPoints || [];
      if (Array.isArray(bpList)) {
        bpList.forEach((bp) => {
          const bpName = typeof bp === 'string' ? bp : (bp.name || bp.stop_name);
          if (bpName) points.add(bpName);
        });
      }
      if (t.boardingStopName) points.add(t.boardingStopName);
    });
    if (points.size === 0) {
      if (isCoimbatore) {
        ['Gandhipuram Omni Bus Stand', 'Hope College', 'Singanallur', 'Ukkadam', 'Peelamedu'].forEach((p) => points.add(p));
      } else {
        [`${fromCity || 'City'} Omni Bus Stand`, `${fromCity || 'City'} Bypass`].forEach((p) => points.add(p));
      }
    }
    return Array.from(points);
  }, [trips, fromCity]);

  const availableDroppingPoints = useMemo(() => {
    const points = new Set();
    const isKaraikudi = (toCity || '').toLowerCase().includes('karaikudi');
    const isTenkasi = (toCity || '').toLowerCase().includes('tenkasi');
    trips.forEach((t) => {
      const dpList = t.dropping_points || t.droppingPoints || [];
      if (Array.isArray(dpList)) {
        dpList.forEach((dp) => {
          const dpName = typeof dp === 'string' ? dp : (dp.name || dp.stop_name);
          if (dpName) {
            if (isKaraikudi) {
              if (!dpName.toLowerCase().includes('tenkasi') && !dpName.toLowerCase().includes('kadayanallur')) {
                points.add(dpName);
              }
            } else {
              points.add(dpName);
            }
          }
        });
      }
      const name = t.droppingStopName || '';
      if (isKaraikudi) {
        if (!name.toLowerCase().includes('tenkasi') && !name.toLowerCase().includes('kadayanallur')) {
          if (name) points.add(name);
        }
      } else {
        if (name) points.add(name);
      }
    });
    if (points.size === 0 || (isKaraikudi && points.size === 0)) {
      if (isKaraikudi) {
        ['Pudukkottai', 'Alagappa University', 'Karaikudi New Bus Stand'].forEach((p) => points.add(p));
      } else if (isTenkasi) {
        ['Tenkasi New Bus Stand', 'Tenkasi Old Bus Stand', 'Courtallam Road'].forEach((p) => points.add(p));
      } else {
        [`${toCity || 'City'} Central Bus Stand`, `${toCity || 'City'} Bypass`].forEach((p) => points.add(p));
      }
    }
    return Array.from(points);
  }, [trips, toCity]);

  // Compute live counts for quick pills
  const pillCounts = useMemo(() => {
    const counts = {
      primo: 0,
      cancellation: 0,
      ac: 0,
      sleeper: 0,
      single: 0,
      seater: 0,
      non_ac: 0,
      night: 0,
      high_rated: 0,
      live_tracking: 0,
    };

    trips.forEach((t) => {
      const rating = parseFloat(t.travelRating || 4.8);
      const isPrimo = rating >= 4.7 || (t.travelName || '').toLowerCase().includes('smart route') || t.travelBadge === 'primo';
      if (isPrimo) counts.primo++;

      counts.cancellation++; // Guaranteed on our verified luxury fleet
      if (t.has_ac !== false) counts.ac++;
      if (t.has_ac === false) counts.non_ac++;

      const busType = (t.bus_type || '').toLowerCase();
      if (busType.includes('sleeper')) counts.sleeper++;
      if (busType.includes('seater') || busType.includes('seat')) counts.seater++;

      counts.single++; // Single window berths in 2+1 configurations

      const dep = t.departure_time || '20:00';
      const hour = parseInt(dep.split(':')[0], 10);
      if (hour >= 18 && hour <= 24) counts.night++;

      if (rating >= 4.0) counts.high_rated++;
      counts.live_tracking++; // All fleet coaches have radar GPS
    });

    return counts;
  }, [trips]);

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchKeyword.trim()) count++;
    if (filters.busTypes.length > 0) count += filters.busTypes.length;
    if (filters.priceRange[0] !== 500 || filters.priceRange[1] !== 2500) count++;
    if (filters.departureTimeSlots.length > 0) count += filters.departureTimeSlots.length;
    if (filters.operators.length > 0) count += filters.operators.length;
    if (filters.boardingPoints.length > 0) count += filters.boardingPoints.length;
    if (filters.droppingPoints.length > 0) count += filters.droppingPoints.length;
    if (filters.singleWindowOnly) count++;
    if (filters.amenities.length > 0) count += filters.amenities.length;
    if (filters.quickPills.length > 0) count += filters.quickPills.length;
    return count;
  }, [filters]);

  // AI keyword parser helper
  const parsedKeyword = useMemo(() => {
    const kw = (filters.searchKeyword || '').toLowerCase().trim();
    if (!kw) return null;

    let maxPrice = null;
    const priceMatch = kw.match(/(?:under|below|less than|<=|<)\s*(?:₹|rs\.?|inr)?\s*(\d+)/i) || kw.match(/(?:₹|rs\.?)\s*(\d+)/i);
    if (priceMatch) maxPrice = parseInt(priceMatch[1], 10);

    let timeSlot = null;
    if (kw.includes('morning') || kw.includes('early')) timeSlot = 'morning';
    else if (kw.includes('afternoon')) timeSlot = 'afternoon';
    else if (kw.includes('evening')) timeSlot = 'evening';
    else if (kw.includes('night') || kw.includes('late')) timeSlot = 'night';

    const isSleeper = kw.includes('sleeper');
    const isSeater = kw.includes('seater') || kw.includes('seat');
    const isAc = /\bac\b/i.test(kw) && !kw.includes('non');
    const isNonAc = kw.includes('non-ac') || kw.includes('non ac') || kw.includes('nonac');
    const isPrimo = kw.includes('primo') || kw.includes('assured') || kw.includes('smart route');

    const cleanTerm = kw
      .replace(/(?:under|below|less than|<=|<)\s*(?:₹|rs\.?|inr)?\s*\d+/gi, '')
      .replace(/\b(?:bus|buses|morning|afternoon|evening|night|early|late|sleeper|seater|seat|non-ac|non ac|ac|primo|assured|to|from)\b/gi, '')
      .trim();

    return { maxPrice, timeSlot, isSleeper, isSeater, isAc, isNonAc, isPrimo, cleanTerm: cleanTerm.length > 1 ? cleanTerm : null };
  }, [filters.searchKeyword]);

  // Filter and sort trips using boolean AND logic
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // 0. Strict Route Alignment (Stop Tenkasi bus leakage when searching Karaikudi)
    const lowerTo = (toCity || '').toLowerCase().trim();
    if (lowerTo.includes('karaikudi')) {
      result = result.filter((t) => {
        const dest = (t.destination || t.toCity || t.droppingStopName || '').toLowerCase();
        const busNum = (t.bus_number || t.trip_number || '').toLowerCase();
        if (dest.includes('tenkasi') || busNum.includes('tks') || dest.includes('kadayanallur')) {
          return false;
        }
        return true;
      });
    }

    // 1. Bus Type filters
    if (filters.busTypes.length > 0) {
      result = result.filter((t) => {
        return filters.busTypes.some((type) => {
          const busType = (t.bus_type || '').toLowerCase();
          const hasAc = t.has_ac !== false;
          if (type === 'ac') return hasAc;
          if (type === 'non_ac') return !hasAc;
          if (type === 'sleeper') return busType.includes('sleeper');
          if (type === 'seater') return busType.includes('seater') || busType.includes('seat');
          if (type === 'live_track') return true;
          if (type === 'new_fleet') return true;
          if (type === 'offers') return true;
          return true;
        });
      });
    }

    // 2. Price Range
    const [minPrice, maxPrice] = filters.priceRange;
    result = result.filter((t) => {
      const fare = parseFloat(t.base_fare || t.base_seat_fare || 880);
      return fare >= minPrice && fare <= maxPrice;
    });

    // 3. Departure Time Slots
    if (filters.departureTimeSlots.length > 0) {
      result = result.filter((t) => {
        const dep = t.departure_time || '20:00';
        const hour = parseInt(dep.split(':')[0], 10);
        return filters.departureTimeSlots.some((slot) => {
          if (slot === 'before_10am') return hour < 10;
          if (slot === '10am_5pm') return hour >= 10 && hour < 17;
          if (slot === '5pm_11pm') return hour >= 17 && hour < 23;
          if (slot === 'after_11pm') return hour >= 23 || hour < 6;
          return true;
        });
      });
    }

    // 4. Operator filter
    if (filters.operators.length > 0) {
      result = result.filter((t) => {
        const name = t.travelName || t.travel_name || '';
        return filters.operators.some((op) => op.toLowerCase() === name.toLowerCase());
      });
    }

    // 5. Boarding Points filter
    if (filters.boardingPoints.length > 0) {
      result = result.filter((t) => {
        const stop = (t.boardingStopName || '').toLowerCase();
        return filters.boardingPoints.some((bp) => stop.includes(bp.toLowerCase()) || bp.toLowerCase().includes(stop));
      });
    }

    // 6. Dropping Points filter
    if (filters.droppingPoints.length > 0) {
      result = result.filter((t) => {
        const stop = (t.droppingStopName || '').toLowerCase();
        return filters.droppingPoints.some((dp) => stop.includes(dp.toLowerCase()) || dp.toLowerCase().includes(stop));
      });
    }

    // 7. Amenities filter
    if (filters.amenities.length > 0) {
      result = result.filter((t) => {
        return filters.amenities.every((amenity) => {
          if (amenity === 'wifi') return t.has_wifi !== false;
          if (amenity === 'water') return t.has_water_bottle !== false;
          if (amenity === 'blanket') return t.has_blanket !== false;
          if (amenity === 'charging') return t.has_charging !== false;
          if (amenity === 'reading_light') return true;
          if (amenity === 'sos') return true;
          return true;
        });
      });
    }

    // 8. Quick Pills filter
    if (filters.quickPills.length > 0) {
      result = result.filter((t) => {
        return filters.quickPills.every((pill) => {
          const rating = parseFloat(t.travelRating || 4.8);
          const busType = (t.bus_type || '').toLowerCase();
          const dep = t.departure_time || '20:00';
          const hour = parseInt(dep.split(':')[0], 10);

          if (pill === 'primo') return rating >= 4.7 || (t.travelName || '').toLowerCase().includes('smart route') || t.travelBadge === 'primo';
          if (pill === 'cancellation') return true;
          if (pill === 'ac') return t.has_ac !== false;
          if (pill === 'sleeper') return busType.includes('sleeper');
          if (pill === 'single') return true;
          if (pill === 'seater') return busType.includes('seater') || busType.includes('seat');
          if (pill === 'non_ac') return t.has_ac === false;
          if (pill === 'night') return hour >= 18 && hour <= 24;
          if (pill === 'high_rated') return rating >= 4.0;
          if (pill === 'live_tracking') return true;
          return true;
        });
      });
    }

    // 9. AI Smart Keyword Search
    if (parsedKeyword) {
      result = result.filter((t) => {
        const fare = parseFloat(t.base_fare || t.base_seat_fare || 880);
        const dep = t.departure_time || '20:00';
        const hour = parseInt(dep.split(':')[0], 10);
        const busType = (t.bus_type || '').toLowerCase();
        const opName = (t.travelName || t.travel_name || '').toLowerCase();
        const bName = (t.busName || '').toLowerCase();
        const stopName = (t.boardingStopName || '').toLowerCase() + ' ' + (t.droppingStopName || '').toLowerCase();

        if (parsedKeyword.maxPrice && fare > parsedKeyword.maxPrice) return false;

        if (parsedKeyword.timeSlot === 'morning' && !(hour >= 6 && hour < 12)) return false;
        if (parsedKeyword.timeSlot === 'afternoon' && !(hour >= 12 && hour < 17)) return false;
        if (parsedKeyword.timeSlot === 'evening' && !(hour >= 17 && hour < 23)) return false;
        if (parsedKeyword.timeSlot === 'night' && !(hour >= 23 || hour < 6)) return false;

        if (parsedKeyword.isSleeper && !busType.includes('sleeper')) return false;
        if (parsedKeyword.isSeater && !(busType.includes('seater') || busType.includes('seat'))) return false;
        if (parsedKeyword.isAc && t.has_ac === false) return false;
        if (parsedKeyword.isNonAc && t.has_ac !== false) return false;
        if (parsedKeyword.isPrimo && !opName.includes('smart route') && t.travelBadge !== 'primo') return false;

        if (parsedKeyword.cleanTerm) {
          const matched =
            opName.includes(parsedKeyword.cleanTerm) ||
            bName.includes(parsedKeyword.cleanTerm) ||
            stopName.includes(parsedKeyword.cleanTerm) ||
            fromCity.toLowerCase().includes(parsedKeyword.cleanTerm) ||
            toCity.toLowerCase().includes(parsedKeyword.cleanTerm);
          if (!matched) return false;
        }

        return true;
      });
    }

    // Dynamic Sorting
    result.sort((a, b) => {
      const fareA = parseFloat(a.base_fare || a.base_seat_fare || 850);
      const fareB = parseFloat(b.base_fare || b.base_seat_fare || 850);
      const seatsA = parseInt(a.total_available_seats || a.availableSeats || 36, 10);
      const seatsB = parseInt(b.total_available_seats || b.availableSeats || 36, 10);
      const ratingA = parseFloat(a.travelRating || 4.8);
      const ratingB = parseFloat(b.travelRating || 4.8);
      const depA = a.departure_time || '20:00';
      const depB = b.departure_time || '20:00';
      const arrA = a.estimated_arrival_time || '05:00';
      const arrB = b.estimated_arrival_time || '05:00';

      const dir = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'departure') return depA.localeCompare(depB) * dir;
      if (sortBy === 'arrival') return arrA.localeCompare(arrB) * dir;
      if (sortBy === 'price') return (fareA - fareB) * dir;
      if (sortBy === 'seats') return (seatsA - seatsB) * dir;
      if (sortBy === 'ratings') return (ratingA - ratingB) * dir;
      return 0;
    });

    return result;
  }, [trips, filters, parsedKeyword, sortBy, sortOrder, fromCity, toCity]);

  const displayedTrips = filteredTrips.slice(0, displayCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1240, margin: '0 auto', width: '100%' }}>
      {/* ==================== STICKY TOP ROUTE SUMMARY HEADER ==================== */}
      <div
        style={{
          position: 'sticky',
          top: 60,
          zIndex: 40,
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1.5px solid #E2E8F0',
          padding: '12px 20px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
        className="sticky-route-summary-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#EF4444',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bus size={18} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{fromCity}</span>
              <ArrowRight size={16} color="#EF4444" />
              <span>{toCity}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              {date ? new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'} &bull; {passengers} Passenger{passengers > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowModifySearch((prev) => !prev)}
          style={{
            border: '1.5px solid #EF4444',
            background: showModifySearch ? '#EF4444' : '#FFFFFF',
            color: showModifySearch ? '#FFFFFF' : '#EF4444',
            padding: '8px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <Search size={14} />
          <span>{showModifySearch ? 'Close Search' : 'Modify Search'}</span>
        </button>
      </div>

      {/* ==================== MODULE 1: LANDING PAGE HERO SECTION & FLOATING SEARCH WIDGET ==================== */}
      <div ref={searchBarRef} style={{ display: showModifySearch ? 'block' : 'none' }}>
        <LandingHero
          headerTitle="SMART ROUTE Intercity Expresses"
          fromCity={fromCity}
          toCity={toCity}
          date={date}
          passengers={passengers}
          onFromCityChange={setFromCity}
          onToCityChange={setToCity}
          onDateChange={setDate}
          onPassengersChange={setPassengers}
          onSwapCities={handleSwapCities}
          onSearch={(e) => {
            handleSearch(e);
            setShowModifySearch(false);
          }}
          loading={loading}
        />
      </div>

      {/* ==================== SEARCH AMENITIES RIBBON ==================== */}
      <SearchAmenitiesRibbon />

      {/* ==================== "OUR ROUTES" BUS TRAILER CARAVAN TICKER ==================== */}
      <BusRoutesCaravan onSelectRoute={applyCaravanRoute} />

      {/* Hub Corridor Directory Collapsible Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
        <button
          type="button"
          onClick={() => setShowExplorer((prev) => !prev)}
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E7A0BF',
            color: '#C13D78',
            borderRadius: 20,
            padding: '5px 16px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(193, 61, 120, 0.08)',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={13} color="#C13D78" />
          <span>{showExplorer ? 'Hide Hub Directory Index' : 'Browse Hub Directory Index (Coimbatore / Bengaluru)'}</span>
          {showExplorer ? <ChevronUp size={14} color="#C13D78" /> : <ChevronDown size={14} color="#C13D78" />}
        </button>
      </div>

      {/* ==================== ROUTE CORRIDOR EXPLORER ==================== */}
      {showExplorer && (
        <section
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #F1EDFA',
            borderRadius: 16,
            padding: '16px 20px',
            boxShadow: 'var(--sr-shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#C13D78" />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>
                High-Frequency Long-Distance Private Coach Corridors
              </span>
            </div>

            {/* Hub Selector Tabs */}
            <div style={{ display: 'flex', background: '#FFF1F6', borderRadius: 8, padding: 3, gap: 4, border: '1px solid #F1EDFA' }}>
              <button
                type="button"
                onClick={() => { setExplorerHub('Coimbatore'); setExplorerRegion('all'); }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: explorerHub === 'Coimbatore' ? 700 : 500,
                  background: explorerHub === 'Coimbatore' ? '#FFFFFF' : 'transparent',
                  color: explorerHub === 'Coimbatore' ? '#C13D78' : '#6E5D73',
                  cursor: 'pointer',
                  boxShadow: explorerHub === 'Coimbatore' ? '0 1px 3px rgba(36,21,45,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Coimbatore Origin ({COIMBATORE_CORRIDORS.length})
              </button>
              <button
                type="button"
                onClick={() => { setExplorerHub('Bengaluru'); setExplorerRegion('all'); }}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: explorerHub === 'Bengaluru' ? 700 : 500,
                  background: explorerHub === 'Bengaluru' ? '#FFFFFF' : 'transparent',
                  color: explorerHub === 'Bengaluru' ? '#C13D78' : '#6E5D73',
                  cursor: 'pointer',
                  boxShadow: explorerHub === 'Bengaluru' ? '0 1px 3px rgba(36,21,45,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Bengaluru Origin ({BENGALURU_CORRIDORS.length})
              </button>
            </div>
          </div>

          {/* Regional Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {['all', 'Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra & Telangana', 'Goa & Maharashtra'].map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setExplorerRegion(reg)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 14,
                  border: '1px solid',
                  borderColor: explorerRegion === reg ? '#C13D78' : '#F1EDFA',
                  background: explorerRegion === reg ? '#FFF1F6' : '#FFFFFF',
                  color: explorerRegion === reg ? '#C13D78' : '#6E5D73',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {reg === 'all' ? 'All Regions' : reg}
              </button>
            ))}
          </div>

          {/* Corridor Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxHeight: 160, overflowY: 'auto', paddingRight: 4 }}>
            {(explorerHub === 'Coimbatore' ? COIMBATORE_CORRIDORS : BENGALURU_CORRIDORS)
              .filter((c) => explorerRegion === 'all' || c.region === explorerRegion)
              .map((c, idx) => {
                const isSelected = fromCity.toLowerCase() === c.from.toLowerCase() && toCity.toLowerCase() === c.to.toLowerCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCorridor(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: isSelected ? '#FFF1F6' : '#FFFFFF',
                      border: '1px solid',
                      borderColor: isSelected ? '#C13D78' : '#F1EDFA',
                      color: isSelected ? '#C13D78' : '#24152D',
                      padding: '5px 12px',
                      borderRadius: 18,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: 'var(--sr-shadow-sm)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{c.from} ➔ {c.to}</span>
                    <span style={{ fontSize: 10, color: '#6E5D73', fontWeight: 500 }}>
                      ({c.distance})
                    </span>
                    {c.status === 'CANDIDATE' && (
                      <span style={{ fontSize: 9, background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                        Candidate
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </section>
      )}

      {/* Error / Validation Banner */}
      {searchError && (
        <div
          style={{
            background: '#FEE2E2',
            border: '1.5px solid #FCA5A5',
            color: '#B91C1C',
            padding: '12px 18px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            margin: '12px 0',
          }}
        >
          <AlertCircle size={18} color="#B91C1C" />
          <span>{searchError}</span>
        </div>
      )}

      {/* ==================== MODULE 2: TWO-COLUMN DISCOVERY LAYOUT ==================== */}
      <div className="search-results-layout-container">
        {/* Left Column: Comprehensive Filter Sidebar (Desktop Sticky) */}
        <div className="search-filter-sidebar-wrapper">
          <FilterSidebar
            filters={filters}
            onChangeFilter={handleFilterChange}
            onResetFilters={handleResetFilters}
            availableOperators={availableOperators}
            availableBoardingPoints={availableBoardingPoints}
            availableDroppingPoints={availableDroppingPoints}
            activeFilterCount={activeFilterCount}
          />
        </div>

        {/* Right Column: Promotional Banners -> AI Filter -> Sort By -> Popular Filters -> Bus Cards */}
        <div className="search-results-main-col">
          {/* 1. Top Promotional Banners */}
          <PromotionalBanners onSelectPromo={(key) => handleToggleQuickPill(key)} />

          {/* 2. AI Smart Filter Bar & Quick Pills */}
          <AiSmartFilter
            searchKeyword={filters.searchKeyword}
            onKeywordChange={(val) => handleFilterChange('searchKeyword', val)}
            quickPills={filters.quickPills}
            onTogglePill={handleToggleQuickPill}
            pillCounts={pillCounts}
            onClearKeyword={() => handleFilterChange('searchKeyword', '')}
          />

          {/* 3. "Sort By" Bar with Dynamic Count */}
          <SortByBar
            filteredCount={filteredTrips.length}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />

          {/* 4. Popular Filters Scroller (Boarding Points & Operators) */}
          <PopularFiltersScroller
            fromCity={fromCity}
            boardingPoints={availableBoardingPoints}
            operators={availableOperators}
            selectedBoardingPoints={filters.boardingPoints}
            selectedOperators={filters.operators}
            onToggleBoardingPoint={(point) => {
              const current = filters.boardingPoints;
              const next = current.includes(point)
                ? current.filter((p) => p !== point)
                : [...current, point];
              handleFilterChange('boardingPoints', next);
            }}
            onToggleOperator={(op) => {
              const current = filters.operators;
              const next = current.includes(op)
                ? current.filter((o) => o !== op)
                : [...current, op];
              handleFilterChange('operators', next);
            }}
          />

          {/* 5. Bus Result Cards List & Accordion Flow */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <BrandLogo variant="icon" size="lg" showText={false} />
              <div style={{ fontWeight: 600, color: '#6E5D73' }}>
                Querying authoritative scheduled luxury coaches & live seat inventories...
              </div>
            </div>
          ) : filteredTrips.length === 0 ? (
            candidateCorridor ? (
              /* Candidate Corridor State */
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #F1EDFA',
                  borderRadius: 16,
                  padding: 40,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: 'var(--sr-shadow-sm)',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                  <Sparkles size={14} /> SMART ROUTE Private Coach Catalogue Corridor
                </div>
                <h3 style={{ fontSize: 22, color: '#24152D', margin: 0, fontWeight: 800 }}>
                  {candidateCorridor.source} ➔ {candidateCorridor.destination}
                </h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ background: '#FFF1F6', border: '1px solid #E7A0BF', color: '#C13D78', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                    Corridor: {candidateCorridor.region}
                  </span>
                  <span style={{ background: '#FFF1F6', border: '1px solid #E7A0BF', color: '#C13D78', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                    {candidateCorridor.distanceKm} km &bull; ~{Math.floor(candidateCorridor.durationMins / 60)}h {candidateCorridor.durationMins % 60}m
                  </span>
                  <span style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                    Status: {candidateCorridor.status}
                  </span>
                </div>
                <p style={{ color: '#6E5D73', fontSize: 14, maxWidth: 580, margin: '6px 0 0 0', lineHeight: 1.6 }}>
                  This corridor is registered in the SMART ROUTE private coach route catalogue. Commercial operator services and schedules are currently undergoing route verification. Authorised services will be published once permits and departures are finalized.
                </p>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleSwapCities}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    <ArrowLeftRight size={14} style={{ marginRight: 6 }} /> Search Reverse Direction ({toCity} ➔ {fromCity})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFromCity('Coimbatore');
                      setToCity('Bengaluru');
                      fetchTrips('Coimbatore', 'Bengaluru', date);
                    }}
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    View Active Corridors
                  </button>
                </div>
              </div>
            ) : (
              /* Polished Empty Results State with Reset Action */
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #F1EDFA',
                  borderRadius: 16,
                  padding: 48,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 14,
                  boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)',
                }}
              >
                <div
                  style={{
                    background: '#FFF1F6',
                    border: '1.5px solid #E7A0BF',
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#C13D78',
                  }}
                >
                  <Bus size={26} />
                </div>
                <h3 style={{ fontSize: 20, color: '#24152D', margin: 0, fontWeight: 800 }}>
                  No Buses Found Matching Your Filter Criteria
                </h3>
                <p style={{ color: '#6E5D73', fontSize: 14, maxWidth: 480, margin: 0, lineHeight: 1.5 }}>
                  We could not find any active departures for <strong>{fromCity} ➔ {toCity}</strong> on <strong>{date}</strong> matching all active filter parameters.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-primary"
                    style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700 }}
                  >
                    <RotateCcw size={14} style={{ marginRight: 6 }} /> Reset All Filters
                  </button>
                  <button
                    type="button"
                    onClick={handleSwapCities}
                    className="btn btn-outline"
                    style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700 }}
                  >
                    <ArrowLeftRight size={14} style={{ marginRight: 6 }} /> Swap Direction
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Bus Cards List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {displayedTrips.map((trip) => {
                const operatorName = trip.travelName || trip.travel_name || 'SMART ROUTE Express';
                const departureTime = trip.departure_time || '21:15';
                const arrivalTime = trip.estimated_arrival_time || '05:15';
                const duration = trip.estimated_duration_minutes
                  ? `${Math.floor(trip.estimated_duration_minutes / 60)}h ${trip.estimated_duration_minutes % 60}m`
                  : '8h 00m';
                const fare = parseFloat(trip.base_fare || trip.base_seat_fare || 880);
                const originalFare = Math.round(fare * 1.15);
                const availableSeats = trip.total_available_seats || trip.availableSeats || 36;
                const tripId = trip.tripId || trip.id;
                const isExpanded = expandedTripId === tripId;

                return (
                  <div
                    key={tripId}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: isExpanded ? '1.5px solid #C13D78' : '1.5px solid #F1EDFA',
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      boxShadow: isExpanded
                        ? '0 12px 32px rgba(193, 61, 120, 0.12)'
                        : '0 4px 16px rgba(36, 21, 45, 0.04)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Card Top: Operator Name, Star Badge, Coach Model & Promo Ribbon */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #F1EDFA',
                        paddingBottom: 14,
                        flexWrap: 'wrap',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {operatorName.toLowerCase().includes('smart route') ? (
                          <BrandLogo variant="icon" size="xs" showText={false} />
                        ) : (
                          <div
                            style={{
                              background: '#FFF1F6',
                              border: '1px solid #E7A0BF',
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Bus size={18} color="#C13D78" />
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 17, fontWeight: 800, color: '#24152D' }}>
                              {operatorName}
                            </span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: '#10B981',
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 6,
                              }}
                            >
                              <Star size={10} fill="#FFFFFF" /> {trip.travelRating || '4.8'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#6E5D73', fontWeight: 500, marginTop: 2 }}>
                            {trip.busName || 'Tata Capella AC Sleeper/Seater 2+1'} &middot; #{trip.trip_number || 'SR-101'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Promo Ribbon */}
                        <span
                          style={{
                            background: '#FFF1F6',
                            border: '1px solid #E7A0BF',
                            color: '#C13D78',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Tag size={11} /> Upto ₹60 off: SMARTROUTE
                        </span>

                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#059669',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Radio size={12} color="#059669" /> GPS Radar
                        </span>
                      </div>
                    </div>

                    {/* Card Middle: Schedule Timeline, Duration, Amenities & Starting Price */}
                    <div className="trip-card-middle-grid">
                      {/* Schedule & Stops */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#24152D' }}>
                            {departureTime}
                          </div>
                          <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 2 }}>
                            {trip.boardingStopName || `${fromCity} Omni Bus Stand`}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 80 }}>
                          <div style={{ fontSize: 11, color: '#8F7E94', fontWeight: 700 }}>{duration}</div>
                          <div style={{ width: '100%', height: 2, background: '#F1EDFA', position: 'relative', margin: '4px 0' }}>
                            <div
                              style={{
                                position: 'absolute',
                                right: -2,
                                top: -4,
                                width: 8,
                                height: 8,
                                borderTop: '2px solid #C13D78',
                                borderRight: '2px solid #C13D78',
                                transform: 'rotate(45deg)',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 10, color: '#AB9CB0' }}>Direct Express</div>
                        </div>

                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#24152D' }}>
                            {arrivalTime}
                          </div>
                          <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 2 }}>
                            {trip.droppingStopName || `${toCity} Bus Stand`}
                          </div>
                        </div>
                      </div>

                      {/* Amenities Tags & Live Seat Count */}
                      <div>
                        <div style={{ display: 'flex', gap: 6, color: '#6E5D73', marginBottom: 8, flexWrap: 'wrap' }}>
                          <span title="Charging Ports" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, background: '#FFF1F6', padding: '2px 6px', borderRadius: 4, color: '#C13D78' }}>
                            <Zap size={11} /> Charging
                          </span>
                          <span title="Blankets Provided" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, background: '#F8F5FA', padding: '2px 6px', borderRadius: 4 }}>
                            <BedDouble size={11} /> Blanket
                          </span>
                          <span title="Reading Lamp" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, background: '#F8F5FA', padding: '2px 6px', borderRadius: 4 }}>
                            <Clock size={11} /> Lamp
                          </span>
                          <span title="Emergency SOS" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, background: '#F8F5FA', padding: '2px 6px', borderRadius: 4 }}>
                            <ShieldCheck size={11} /> SOS
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: availableSeats <= 10 ? '#D97706' : '#10B981',
                          }}
                        >
                          {availableSeats} Seats Left
                        </div>
                      </div>

                      {/* Pricing with Strikethrough & "View Seats" Action */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <span style={{ fontSize: 12, color: '#8F7E94', textDecoration: 'line-through' }}>
                            ₹{originalFare}
                          </span>
                          <span style={{ fontSize: 11, color: '#10B981', fontWeight: 800 }}>
                            15% OFF
                          </span>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#C13D78', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                          ₹{fare}
                        </div>

                        {/* View Seats Dedicated Navigation Button */}
                        <button
                          type="button"
                          onClick={() => handleViewSeats(trip)}
                          className="btn btn-primary"
                          style={{
                            marginTop: 8,
                            width: '100%',
                            padding: '9px 16px',
                            fontSize: 13,
                            fontWeight: 800,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            boxShadow: '0 2px 8px rgba(193, 61, 120, 0.25)',
                          }}
                        >
                          View Seats <ArrowRight size={15} />
                        </button>

                        {/* Quick Inline Layout Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleSeats(trip)}
                          style={{
                            marginTop: 4,
                            width: '100%',
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            color: isExpanded ? '#C13D78' : '#8F7E94',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          {isExpanded ? (
                            <>
                              Hide Inline Seats <ChevronUp size={13} />
                            </>
                          ) : (
                            <>
                              Quick Inline Layout <ChevronDown size={13} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* ==================== EXPANDED ACCORDION 48-SEAT LAYOUT ==================== */}
                    {isExpanded && (
                      <div
                        style={{
                          borderTop: '1px solid #F1EDFA',
                          paddingTop: 18,
                          marginTop: 4,
                        }}
                      >
                        <TataPrakashSeatLayout
                          trip={{
                            ...trip,
                            operatorName,
                            serviceNumber: trip.serviceNumber || trip.service_number || trip.trip_number || trip.bus_number,
                            fare,
                          }}
                          onClose={() => setExpandedTripId(null)}
                          initialBoardingStopId={trip.boardingStopId}
                          initialDroppingStopId={trip.droppingStopId}
                          searchDate={date}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Load More Option */}
              {filteredTrips.length > displayCount && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setDisplayCount((prev) => prev + 6)}
                    className="btn btn-outline"
                    style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700 }}
                  >
                    Load More Buses ({filteredTrips.length - displayCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================== MOBILE FLOATING FILTERS CTA ==================== */}
      <div
        style={{
          display: 'none',
        }}
        className="mobile-filters-trigger-container"
      >
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 20,
            zIndex: 90,
            background: 'linear-gradient(135deg, #D44D8A 0%, #C13D78 60%, #A82F65 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 24,
            padding: '12px 20px',
            fontSize: 13,
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(193, 61, 120, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                background: '#FFFFFF',
                color: '#C13D78',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ==================== MOBILE SLIDE-UP BOTTOM SHEET MODAL ==================== */}
      {isMobileFilterOpen && (
        <div className="mobile-filter-drawer-overlay" onClick={() => setIsMobileFilterOpen(false)}>
          <div className="mobile-filter-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={18} color="#C13D78" />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#24152D' }}>
                  Filter Buses
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                style={{
                  background: '#F1EDFA',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#24152D',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <FilterSidebar
              filters={filters}
              onChangeFilter={handleFilterChange}
              onResetFilters={handleResetFilters}
              availableOperators={availableOperators}
              availableBoardingPoints={availableBoardingPoints}
              availableDroppingPoints={availableDroppingPoints}
              activeFilterCount={activeFilterCount}
            />

            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
              >
                Apply Filters ({filteredTrips.length} Buses)
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-outline"
                style={{ padding: '12px 16px' }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
