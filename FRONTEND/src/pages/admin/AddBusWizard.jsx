import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  Settings2,
  Tv,
  Wifi,
  Zap,
  Wind,
  Smile,
  Navigation,
  Info,
  Sliders,
  X,
  RotateCcw,
  Tag,
  Check,
  Search,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import CoachSeatLayout from '../../components/seats/CoachSeatLayout.jsx';
import {
  CHASSIS_CATALOG,
  SUPPORTED_MANUFACTURERS,
  getSupportedManufacturers,
  getModelsForManufacturer,
  validateBusModel,
  getCompatibleChassis,
  isChassisCompatible,
  validateBusChassis,
  analyzeBusLayout,
  validateBusNumberPlate,
} from '../../utils/busLayoutEngine.js';

/**
 * 6 OFFICIAL COACH LAYOUT SPECIFICATIONS
 * Exact Counts: S = Seaters, B = Sleeper Berths, D = Drivers
 * Total Capacity = S + B + D
 */
export const OFFICIAL_LAYOUTS = [
  {
    id: 'combo_48',
    name: '2+1 Combo (Tata)',
    chassis: 'Tata LPO 1618 / Prakash Vega 2+1 Combo',
    layoutType: 'Seater-Cum-Sleeper',
    countSummary: 'S24 + B24 + D1 = 49',
    badge: '48 Seats (24 Seater + 24 Sleeper)',
    specs: 'Lower: 1 Sleeper + 2 Seater | Upper: 1+2 Sleeper',
    totalSeats: 48,
    seaterCount: 24,
    sleeperCount: 24,
    driverCount: 1,
    totalCapacity: 49,
    hasSleeper: true,
    hasSeater: true,
    hasWashroom: false,
    deckType: 'Double Deck (Lower + Upper)',
    defaultLowerSleeper: 850,
    defaultUpperSleeper: 1050,
    defaultSingleWindowPremium: 100,
    defaultSeater: 550,
    defaultSeaterWindowPremium: 50,
  },
  {
    id: 'sleeper_36',
    name: 'Fully Sleeper (Volvo 9600)',
    layoutType: 'Sleeper',
    countSummary: 'B36 + D1 = 37',
    badge: '36 Luxury Berths',
    specs: 'Lower: 18 Berths (6 Single + 12 Double) | Upper: 18 Berths',
    totalSeats: 36,
    seaterCount: 0,
    sleeperCount: 36,
    driverCount: 1,
    totalCapacity: 37,
    hasSleeper: true,
    hasSeater: false,
    hasWashroom: false,
    deckType: 'Double Deck (Lower + Upper)',
    defaultLowerSleeper: 950,
    defaultUpperSleeper: 1150,
    defaultSingleWindowPremium: 100,
    defaultSeater: 0,
    defaultSeaterWindowPremium: 0,
  },
  {
    id: 'seater_40',
    name: 'Fully Seater (Executive Pushback)',
    layoutType: 'Seater',
    countSummary: 'S40 + D1 = 41',
    badge: '40 Pushback Seats (Single Deck)',
    specs: '2+2 Seater Only | Lower Deck',
    totalSeats: 40,
    seaterCount: 40,
    sleeperCount: 0,
    driverCount: 1,
    totalCapacity: 41,
    hasSleeper: false,
    hasSeater: true,
    hasWashroom: false,
    deckType: 'Single Deck Only',
    defaultLowerSleeper: 0,
    defaultUpperSleeper: 0,
    defaultSingleWindowPremium: 0,
    defaultSeater: 550,
    defaultSeaterWindowPremium: 50,
  },
  {
    id: 'sleeper_washroom_rear',
    name: 'Fully Sleeper + Rear Restroom',
    layoutType: 'Sleeper',
    countSummary: 'B34 + D1 = 35',
    badge: '34 Berths + Rear WC',
    specs: 'Lower: 16 Berths + Rear Right WC | Upper: 18 Berths',
    totalSeats: 34,
    seaterCount: 0,
    sleeperCount: 34,
    driverCount: 1,
    totalCapacity: 35,
    hasSleeper: true,
    hasSeater: false,
    hasWashroom: true,
    deckType: 'Double Deck + Rear Bio-Toilet',
    defaultLowerSleeper: 950,
    defaultUpperSleeper: 1200,
    defaultSingleWindowPremium: 100,
    defaultSeater: 0,
    defaultSeaterWindowPremium: 0,
  },
  {
    id: 'sleeper_washroom_front',
    name: 'Fully Sleeper + Front Restroom',
    layoutType: 'Sleeper',
    countSummary: 'B35 + D1 = 36',
    badge: '35 Berths + Front WC (L1)',
    specs: 'Lower: 17 Berths + L1 Entry WC | Upper: 18 Berths',
    totalSeats: 35,
    seaterCount: 0,
    sleeperCount: 35,
    driverCount: 1,
    totalCapacity: 36,
    hasSleeper: true,
    hasSeater: false,
    hasWashroom: true,
    deckType: 'Double Deck + Front Entry Bio-Toilet',
    defaultLowerSleeper: 950,
    defaultUpperSleeper: 1200,
    defaultSingleWindowPremium: 100,
    defaultSeater: 0,
    defaultSeaterWindowPremium: 0,
  },
  {
    id: 'seater_washroom',
    name: 'Fully Seater + Rear Restroom',
    layoutType: 'Seater',
    countSummary: 'S38 + D1 = 39',
    badge: '38 Seats + Rear WC',
    specs: 'Single Deck 2+2 Seater + Rear Right WC',
    totalSeats: 38,
    seaterCount: 38,
    sleeperCount: 0,
    driverCount: 1,
    totalCapacity: 39,
    hasSleeper: false,
    hasSeater: true,
    hasWashroom: true,
    deckType: 'Single Deck + Rear Bio-Toilet',
    defaultLowerSleeper: 0,
    defaultUpperSleeper: 0,
    defaultSingleWindowPremium: 0,
    defaultSeater: 650,
    defaultSeaterWindowPremium: 50,
  },
];

/**
 * AVAILABLE AMENITIES
 */
export const OFFICIAL_AMENITIES = [
  { id: 'gps', label: 'Live Radar GPS Tracking', defaultChecked: true, icon: Navigation },
  { id: 'ac', label: 'Climate Controlled AC (UV Purified)', defaultChecked: true, icon: Wind },
  { id: 'power', label: '230V & USB-C Power Outlets', defaultChecked: true, icon: Zap },
  { id: 'blanket', label: 'Clean Blanket & Pillow', defaultChecked: true, icon: Smile },
  { id: 'reading_lamp', label: 'Reading Lamp', defaultChecked: true, icon: Zap },
  { id: 'washroom', label: 'Onboard Washroom', defaultChecked: false, icon: Sparkles },
];

/**
 * DEFAULT POPULAR DATABASE ROUTES
 */
export const DEFAULT_DATABASE_ROUTES = [
  { id: 'route_cbe_kkdi_01', name: 'Coimbatore ⇄ Karaikudi', fromCity: 'Coimbatore', toCity: 'Karaikudi', distance: '265 km' },
  { id: 'route_cbe_tnk_01', name: 'Coimbatore ⇄ Tenkasi', fromCity: 'Coimbatore', toCity: 'Tenkasi', distance: '340 km' },
  { id: 'route_cbe_chn_01', name: 'Coimbatore ⇄ Chennai', fromCity: 'Coimbatore', toCity: 'Chennai', distance: '510 km' },
  { id: 'route_blr_cbe_01', name: 'Bengaluru ⇄ Coimbatore', fromCity: 'Bengaluru', toCity: 'Coimbatore', distance: '360 km' },
  { id: 'route_chn_mdu_01', name: 'Chennai ⇄ Madurai', fromCity: 'Chennai', toCity: 'Madurai', distance: '460 km' },
];

export default function AddBusWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard active step tab: 1 = Details, 2 = Layout & Preview, 3 = Pricing, 4 = Amenities & Submit
  const [activeStep, setActiveStep] = useState(1);

  // Form Basic Fleet Details
  const defaultOperatorName =
    user?.travelName ||
    user?.businessName ||
    (user?.role === 'travel_owner' ? `${user?.firstName || 'SMART ROUTE'} Travels` : 'SMART ROUTE Travels');

  const [formData, setFormData] = useState({
    operatorName: defaultOperatorName,
    manufacturer: 'Tata',
    model: 'LPO 1618',
    customName: '',
    busName: 'Tata LPO 1618',
    registrationNumber: 'TN 76 AH 7890',
    assignedRouteId: 'route_cbe_kkdi_01',
    departureTime: '21:30',
    arrivalTime: '05:00',
  });

  // Database routes
  const [routes, setRoutes] = useState(DEFAULT_DATABASE_ROUTES);

  // Selected Coach Layout
  const [selectedLayoutId, setSelectedLayoutId] = useState('combo_48');

  // Bus Brand / Chassis selection state
  const [selectedChassisId, setSelectedChassisId] = useState('tata_lpo_1618');
  const [chassisSearchQuery, setChassisSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');

  // Selected layout object
  const activeLayoutConfig = useMemo(() => {
    return OFFICIAL_LAYOUTS.find((l) => l.id === selectedLayoutId) || OFFICIAL_LAYOUTS[0];
  }, [selectedLayoutId]);

  // Selected chassis object
  const selectedChassisObj = useMemo(() => {
    return CHASSIS_CATALOG.find((c) => c.id === selectedChassisId) || null;
  }, [selectedChassisId]);

  // Compatible chassis for currently selected layout
  const compatibleChassisList = useMemo(() => {
    return getCompatibleChassis(selectedLayoutId);
  }, [selectedLayoutId]);

  // Filtered chassis list (by brand and search query)
  const filteredChassisList = useMemo(() => {
    let list = compatibleChassisList;
    if (selectedBrandFilter !== 'ALL') {
      list = list.filter((c) => c.brand.toLowerCase() === selectedBrandFilter.toLowerCase());
    }
    if (!chassisSearchQuery.trim()) return list;
    const q = chassisSearchQuery.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [compatibleChassisList, selectedBrandFilter, chassisSearchQuery]);

  // Fare Configuration Engine State
  const [fareConfig, setFareConfig] = useState({
    sleeperLower: 850,
    sleeperUpper: 1050,
    singleWindowPremium: 100,
    seaterStandard: 550,
    seaterWindowPremium: 50,
    includeGst: false,
  });

  // Custom per-seat fare overrides (e.g. { U1: 1250, SL1: 950 })
  const [seatPriceOverrides, setSeatPriceOverrides] = useState({});

  // Active seat selected for override modal
  const [overrideModalSeat, setOverrideModalSeat] = useState(null);
  const [customOverrideInput, setCustomOverrideInput] = useState('');

  // Selected Amenities (set of labels)
  const [selectedAmenities, setSelectedAmenities] = useState(() => {
    return OFFICIAL_AMENITIES.filter((a) => a.defaultChecked).map((a) => a.label);
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load database routes dynamically on mount
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await api.get('/routes/catalogue');
        if (res.success && Array.isArray(res.routes) && res.routes.length > 0) {
          const mapped = res.routes.slice(0, 15).map((r) => ({
            id: r.id,
            name: `${r.source || r.fromCity} ⇄ ${r.destination || r.toCity}`,
            fromCity: r.source || r.fromCity,
            toCity: r.destination || r.toCity,
            distance: r.distance_km ? `${r.distance_km} km` : 'Intercity',
          }));
          setRoutes(mapped);
        }
      } catch (err) {
        // Keep DEFAULT_DATABASE_ROUTES
      }
    }
    fetchRoutes();
  }, []);

  // Chassis selection synchronization with form data
  const handleSelectChassis = (chassisId) => {
    setSelectedChassisId(chassisId);
    const ch = CHASSIS_CATALOG.find((c) => c.id === chassisId);
    if (ch) {
      setFormData((prev) => ({
        ...prev,
        manufacturer: ch.brand,
        model: ch.model,
        busName: prev.customName?.trim() ? prev.customName.trim() : `${ch.brand} ${ch.model}`,
      }));
    }
  };

  // Structured manufacturer change handler
  const handleManufacturerChange = (mfr) => {
    const models = getModelsForManufacturer(mfr);
    const firstModel = models.length > 0 ? models[0].model : '';
    const firstChassisId = models.length > 0 ? models[0].id : '';
    setFormData((prev) => {
      const nextDisplayName = prev.customName?.trim() ? prev.customName.trim() : `${mfr} ${firstModel}`;
      return {
        ...prev,
        manufacturer: mfr,
        model: firstModel,
        busName: nextDisplayName,
      };
    });
    if (firstChassisId) {
      setSelectedChassisId(firstChassisId);
    }
  };

  // Structured model change handler
  const handleModelChange = (mdl) => {
    const match = CHASSIS_CATALOG.find(
      (c) => c.brand.toLowerCase() === formData.manufacturer.toLowerCase() && c.model.toLowerCase() === mdl.toLowerCase()
    );
    setFormData((prev) => {
      const nextDisplayName = prev.customName?.trim() ? prev.customName.trim() : `${prev.manufacturer} ${mdl}`;
      return {
        ...prev,
        model: mdl,
        busName: nextDisplayName,
      };
    });
    if (match) {
      setSelectedChassisId(match.id);
    }
  };

  // Optional custom display name handler
  const handleCustomNameChange = (val) => {
    setFormData((prev) => {
      const nextDisplayName = val.trim() ? val.trim() : `${prev.manufacturer} ${prev.model}`;
      return {
        ...prev,
        customName: val,
        busName: nextDisplayName,
      };
    });
  };

  // When layout changes, update default fare config, reconcile chassis, and auto-check washroom
  const handleSelectLayout = (layoutId) => {
    setSelectedLayoutId(layoutId);
    const layout = OFFICIAL_LAYOUTS.find((l) => l.id === layoutId);
    if (!layout) return;

    // Chassis compatibility check: retain selected chassis only if compatible with new layout
    if (selectedChassisId) {
      const compatible = isChassisCompatible(selectedChassisId, layoutId);
      if (!compatible) {
        const available = getCompatibleChassis(layoutId);
        if (available.length > 0) {
          handleSelectChassis(available[0].id);
        }
      }
    } else {
      const available = getCompatibleChassis(layoutId);
      if (available.length > 0) handleSelectChassis(available[0].id);
    }

    // Adjust fare defaults for this layout
    setFareConfig((prev) => ({
      ...prev,
      sleeperLower: layout.defaultLowerSleeper || prev.sleeperLower,
      sleeperUpper: layout.defaultUpperSleeper || prev.defaultUpperSleeper || prev.sleeperUpper,
      singleWindowPremium: layout.defaultSingleWindowPremium || prev.singleWindowPremium,
      seaterStandard: layout.defaultSeater || prev.seaterStandard,
      seaterWindowPremium: layout.defaultSeaterWindowPremium || prev.seaterWindowPremium,
    }));

    // Auto-check or uncheck washroom
    if (layout.hasWashroom) {
      setSelectedAmenities((prev) =>
        prev.includes('Onboard Washroom') ? prev : [...prev, 'Onboard Washroom']
      );
    } else {
      setSelectedAmenities((prev) => prev.filter((a) => a !== 'Onboard Washroom'));
    }
  };

  // Toggle amenity
  const handleToggleAmenity = (label) => {
    setSelectedAmenities((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label]
    );
  };

  // Reset all overrides and apply base pricing
  const handleApplyBasePricing = () => {
    setSeatPriceOverrides({});
    setSuccessMsg('Base pricing rules successfully applied to all coach berths and seats!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Compute final seat price mapping for CoachSeatLayout preview
  const computedSeatPrices = useMemo(() => {
    const prices = {};
    const gstMultiplier = fareConfig.includeGst ? 1.05 : 1.0;

    // Helper to calculate price for a given seat ID
    const getBasePriceForSeat = (seatId) => {
      // If manual override exists, use it as baseline
      if (seatPriceOverrides[seatId] !== undefined) {
        return Math.round(Number(seatPriceOverrides[seatId]) * (fareConfig.includeGst ? 1.05 : 1.0));
      }

      // Check seat ID patterns
      // 1. Lower single sleeper (SL1..SL6, or L1..L6)
      if (seatId.startsWith('SL') || (seatId.startsWith('L') && !seatId.startsWith('LS') && Number(seatId.replace(/\D/g, '')) <= 6)) {
        const raw = Number(fareConfig.sleeperLower) + Number(fareConfig.singleWindowPremium);
        return Math.round(raw * gstMultiplier);
      }

      // 2. Lower double sleeper (L7..L18)
      if (seatId.startsWith('L') && Number(seatId.replace(/\D/g, '')) >= 7) {
        const raw = Number(fareConfig.sleeperLower);
        return Math.round(raw * gstMultiplier);
      }

      // 3. Upper single sleeper (U1..U6)
      if (seatId.startsWith('U') && Number(seatId.replace(/\D/g, '')) <= 6) {
        const raw = Number(fareConfig.sleeperUpper) + Number(fareConfig.singleWindowPremium);
        return Math.round(raw * gstMultiplier);
      }

      // 4. Upper double sleeper (U7..U18)
      if (seatId.startsWith('U') && Number(seatId.replace(/\D/g, '')) >= 7) {
        const raw = Number(fareConfig.sleeperUpper);
        return Math.round(raw * gstMultiplier);
      }

      // 5. Seater chairs (S1..S40)
      if (seatId.startsWith('S')) {
        const seatNum = Number(seatId.replace(/\D/g, ''));
        // In 2+2 layout, seats 1, 4, 5, 8, 9, 12, etc. (mod 4 is 1 or 0) are Window seats
        const isWindow = seatNum % 4 === 1 || seatNum % 4 === 0;
        const raw = Number(fareConfig.seaterStandard) + (isWindow ? Number(fareConfig.seaterWindowPremium) : 0);
        return Math.round(raw * gstMultiplier);
      }

      return Math.round(600 * gstMultiplier);
    };

    // Populate common IDs
    for (let i = 1; i <= 6; i++) {
      prices[`SL${i}`] = getBasePriceForSeat(`SL${i}`);
      prices[`L${i}`] = getBasePriceForSeat(`L${i}`);
      prices[`U${i}`] = getBasePriceForSeat(`U${i}`);
    }
    for (let i = 7; i <= 18; i++) {
      prices[`L${i}`] = getBasePriceForSeat(`L${i}`);
      prices[`U${i}`] = getBasePriceForSeat(`U${i}`);
    }
    for (let i = 1; i <= 40; i++) {
      prices[`S${i}`] = getBasePriceForSeat(`S${i}`);
    }

    return prices;
  }, [fareConfig, seatPriceOverrides]);

  // Handle clicking a seat in the live coach preview to open override dialog
  const handleSeatClickForOverride = (seat) => {
    const seatId = seat.id || seat.seat_number;
    const currentPrice = computedSeatPrices[seatId] || seat.price || 850;
    setOverrideModalSeat({
      ...seat,
      id: seatId,
      currentPrice,
    });
    setCustomOverrideInput(String(seatPriceOverrides[seatId] || currentPrice));
  };

  // Save per-seat price override
  const handleSaveSeatOverride = (overrideValue) => {
    if (!overrideModalSeat) return;
    const val = Number(overrideValue !== undefined ? overrideValue : customOverrideInput);
    if (!isNaN(val) && val > 0) {
      setSeatPriceOverrides((prev) => ({
        ...prev,
        [overrideModalSeat.id]: val,
      }));
    }
    setOverrideModalSeat(null);
  };

  // Reset override for single seat
  const handleResetSingleSeat = () => {
    if (!overrideModalSeat) return;
    setSeatPriceOverrides((prev) => {
      const copy = { ...prev };
      delete copy[overrideModalSeat.id];
      return copy;
    });
    setOverrideModalSeat(null);
  };

  // Submit Bus to Backend
  const handleSubmitBus = async (publishStatus = 'published') => {
    try {
      setErrorMsg(null);
      setSubmitting(true);

      // 1. Bus Manufacturer & Model Compulsory Validation
      const mfrModelValidation = validateBusModel(formData.manufacturer, formData.model, selectedLayoutId);
      if (!mfrModelValidation.valid) {
        setErrorMsg(mfrModelValidation.error || 'Please select a valid Bus Manufacturer and Model.');
        setActiveStep(1);
        setSubmitting(false);
        return;
      }

      // 2. Bus Number Plate Validation (Must start with TN 76)
      const plateValidation = validateBusNumberPlate(formData.registrationNumber);
      if (!plateValidation.valid) {
        setErrorMsg(plateValidation.error || 'All travels buses number plate must start with TN 76 (e.g. TN-76-AB-1234 or TN 76 AH 7890).');
        setActiveStep(1);
        setSubmitting(false);
        return;
      }

      // 3. Bus Brand / Chassis Validation (Mandatory & Compatible)
      if (!selectedChassisId) {
        setErrorMsg('Bus Brand / Chassis selection is required.');
        setActiveStep(2);
        setSubmitting(false);
        return;
      }
      const chassisValidation = validateBusChassis(selectedChassisId, selectedLayoutId);
      if (!chassisValidation.valid) {
        setErrorMsg(chassisValidation.error);
        setActiveStep(2);
        setSubmitting(false);
        return;
      }

      // 4. Exact Layout Count & Unique IDs Validation
      const seatingMap = Object.entries(computedSeatPrices).map(([seatNum, price]) => ({
        seat_number: seatNum,
        fare: price,
        type: seatNum.startsWith('U') || seatNum.startsWith('L') || seatNum.startsWith('SL') ? 'sleeper' : 'seater',
      }));
      const layoutAnalysis = analyzeBusLayout(seatingMap, 1);
      if (!layoutAnalysis.valid || layoutAnalysis.errors.length > 0) {
        setErrorMsg(layoutAnalysis.errors.join('; ') || 'Layout seat count validation failed.');
        setActiveStep(2);
        setSubmitting(false);
        return;
      }

      const assignedRoute = routes.find((r) => r.id === formData.assignedRouteId) || routes[0];

      // Formulate display name: custom name if supplied, else '[Manufacturer] [Model]'
      const customName = formData.customName?.trim() || '';
      const displayName = customName || `${formData.manufacturer} ${formData.model}`;

      // Assemble complete payload with structured fields
      const payload = {
        operatorName: formData.operatorName,
        manufacturer: formData.manufacturer,
        model: formData.model,
        customName: customName || null,
        custom_name: customName || null,
        displayName: displayName,
        display_name: displayName,
        busName: displayName,
        name: displayName,
        registrationNumber: plateValidation.formatted,
        busNumber: plateValidation.formatted,
        assignedRoute: assignedRoute?.name || 'Coimbatore ⇄ Karaikudi',
        routeId: assignedRoute?.id || 'route_cbe_kkdi_01',
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        layoutType: selectedLayoutId,
        layoutName: activeLayoutConfig.name,
        chassis: chassisValidation.chassis?.fullName || `${formData.manufacturer} ${formData.model}`,
        chassisId: chassisValidation.chassis?.id || selectedChassisId,
        chassisMake: formData.manufacturer,
        chassisModel: formData.model,
        layoutClassification: layoutAnalysis.layoutType,
        countSummary: layoutAnalysis.countSummary,
        driverCount: layoutAnalysis.driverCount,
        seaterCount: layoutAnalysis.seaterCount,
        sleeperCount: layoutAnalysis.sleeperCount,
        totalSeats: layoutAnalysis.seaterCount + layoutAnalysis.sleeperCount,
        totalCapacity: layoutAnalysis.totalCapacity,
        fareConfig: {
          ...fareConfig,
          overridesCount: Object.keys(seatPriceOverrides).length,
        },
        seatPricing: computedSeatPrices,
        seatingMap,
        amenities: selectedAmenities,
        status: publishStatus,
      };

      // Call POST /api/admin/buses with fallback to /api/operator/company/buses
      let response;
      try {
        response = await api.post('/admin/buses', payload);
      } catch (err) {
        response = await api.post('/operator/company/buses', payload);
      }

      if (response && (response.success || response.bus)) {
        const successText = `Bus ${formData.busName} added successfully with ${activeLayoutConfig.name} configuration!`;
        // Navigate to /admin/fleet with state
        // Navigate to /admin/fleet with state
        navigate('/admin/fleet', {
          state: {
            toast: successText,
            newBusId: response.bus?.id,
          },
        });
      } else {
        throw new Error(response?.error || 'Failed to register bus in fleet');
      }
    } catch (err) {
      console.error('Bus submission error:', err);
      setErrorMsg(err.message || 'Failed to add bus to fleet. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF1F6] text-[#24152D] font-sans pb-24">
      {/* Top Breadcrumb & Page Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#F1EDFA]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C13D78] mb-1">
              <span>Travel Administration</span>
              <span>&bull;</span>
              <span>Fleet Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#24152D] flex items-center gap-3">
              <span>+ Add Bus to Fleet</span>
              <span className="bg-[#FFF1F6] text-[#C13D78] border border-[#E7A0BF] text-xs font-bold px-3 py-1 rounded-full">
                6 Official Blueprints
              </span>
            </h1>
            <p className="text-sm text-[#6E5D73] mt-1 max-w-2xl">
              Configure vehicle specifications, pick from our 6 certified coach layouts, test live interactive seat pricing, and assign onboard amenities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/fleet')}
              className="bg-white hover:bg-gray-50 text-[#6E5D73] font-bold px-4 py-2.5 rounded-xl border border-[#E7A0BF] text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <ArrowLeft size={16} /> Back to Fleet
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitBus('published')}
              className="bg-[#C13D78] hover:bg-[#A82B63] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer text-sm"
            >
              <Sparkles size={16} /> Publish Bus to Fleet
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {errorMsg && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-fadeIn">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-fadeIn">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Multi-step progress tabs */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { step: 1, title: 'Step A: Fleet Details', desc: 'Brand, Model & Schedule' },
            { step: 2, title: 'Step B: 6 Coach Layouts', desc: 'Official Chassis Blueprints' },
            { step: 3, title: 'Step C: Dynamic Fares', desc: 'Real-time Seat Pricing Engine' },
            { step: 4, title: 'Step D: Amenities & Deploy', desc: 'Radar GPS & Bio-Toilet' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveStep(item.step)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                activeStep === item.step
                  ? 'bg-white border-[#C13D78] shadow-md ring-2 ring-[#C13D78]/20'
                  : 'bg-white/70 border-[#F1EDFA] hover:bg-white text-[#6E5D73]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                    activeStep === item.step ? 'bg-[#C13D78] text-white' : 'bg-[#FFF1F6] text-[#C13D78]'
                  }`}
                >
                  {item.step}
                </span>
                <span className={`text-xs font-bold ${activeStep === item.step ? 'text-[#24152D]' : 'text-[#6E5D73]'}`}>
                  {item.title}
                </span>
              </div>
              <div className="text-[11px] text-[#6E5D73] mt-1 pl-8 truncate">{item.desc}</div>
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* STEP A: BASIC FLEET DETAILS                                               */}
        {/* ========================================================================= */}
        <div className="mt-8 bg-white rounded-2xl border border-[#F1EDFA] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1EDFA] mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1F6] border border-[#E7A0BF] flex items-center justify-center text-[#C13D78]">
                <Bus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#24152D]">Step A: Basic Fleet Details</h2>
                <p className="text-xs text-[#6E5D73]">Identity, vehicle registration, and assigned commercial route</p>
              </div>
            </div>
            <span className="badge badge-pink text-xs font-bold px-3 py-1 rounded-full">REQUIRED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Operator Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5D73] mb-2">
                1. Operator Name / Carrier Brand
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.operatorName}
                  onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                  placeholder="e.g. SMART ROUTE Travels"
                  className="w-full bg-[#FFF1F6]/50 border border-[#E7A0BF] rounded-xl px-4 py-2.5 text-sm font-bold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                />
                <span className="absolute right-3 top-2.5 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-[#6E5D73] mt-1">Defaulted to logged-in travel operator company</p>
            </div>

            {/* 2. Bus Name / Model — Manufacturer & Brand */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5D73] mb-2">
                2. Bus Name / Model &mdash; Manufacturer / Brand <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.manufacturer}
                  onChange={(e) => handleManufacturerChange(e.target.value)}
                  className="w-full bg-white border border-[#E7A0BF] rounded-xl px-4 py-2.5 text-sm font-bold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78] appearance-none"
                >
                  {SUPPORTED_MANUFACTURERS.map((mfr) => (
                    <option key={mfr} value={mfr}>
                      {mfr}
                    </option>
                  ))}
                </select>
                <Bus size={16} className="absolute right-3 top-3 text-[#6E5D73] pointer-events-none" />
              </div>
              <p className="text-[11px] text-[#6E5D73] mt-1">Select verified OEM coach builder / chassis brand</p>
            </div>

            {/* Bus Model (Compulsory - Dependent on Manufacturer) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5D73] mb-2">
                Bus Model / Series <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.model}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-white border border-[#E7A0BF] rounded-xl px-4 py-2.5 text-sm font-bold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78] appearance-none"
                >
                  {getModelsForManufacturer(formData.manufacturer).map((c) => (
                    <option key={c.id} value={c.model}>
                      {c.model} &mdash; {c.fullName}
                    </option>
                  ))}
                </select>
                <Sliders size={16} className="absolute right-3 top-3 text-[#6E5D73] pointer-events-none" />
              </div>
              <p className="text-[11px] text-[#6E5D73] mt-1">Available commercial models for {formData.manufacturer}</p>
            </div>

            {/* Optional Custom Bus Display Name */}
            <div className="md:col-span-2 lg:col-span-3 bg-[#FFF1F6]/40 border border-[#E7A0BF]/70 rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5D73]">
                  Custom Bus Display Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] font-bold text-[#C13D78] bg-white px-2 py-0.5 rounded border border-[#E7A0BF]">
                  Independent Operator Branding
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div>
                  <input
                    type="text"
                    value={formData.customName}
                    onChange={(e) => handleCustomNameChange(e.target.value)}
                    placeholder="e.g. Volvo 9600 Multi-Axle Luxury Glider, Royal Express"
                    className="w-full bg-white border border-[#E7A0BF] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                  />
                  <p className="text-[11px] text-[#6E5D73] mt-1">
                    If left blank, the passenger display name defaults to &ldquo;{formData.manufacturer} {formData.model}&rdquo;.
                  </p>
                </div>

                {/* Live Passenger Display Name Preview Card */}
                <div className="bg-white border border-[#E7A0BF] rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#6E5D73] flex items-center gap-1">
                      <Tag size={12} className="text-[#C13D78]" />
                      <span>Passenger Facing Display Name</span>
                    </div>
                    <div className="text-sm font-black text-[#24152D] mt-0.5 truncate">
                      {formData.customName?.trim() || `${formData.manufacturer} ${formData.model}`}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg shrink-0 ${
                    formData.customName?.trim()
                      ? 'bg-[#C13D78] text-white'
                      : 'bg-[#FFF1F6] border border-[#E7A0BF] text-[#6E5D73]'
                  }`}>
                    {formData.customName?.trim() ? 'Custom Name' : 'OEM Default'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Registration Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5D73] mb-2">
                3. Registration Number <span className="text-rose-500">* (Starts with TN 76)</span>
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. TN 76 AH 7890 (or TN 38 AH 7890)"
                className="w-full bg-white border border-[#E7A0BF] rounded-xl px-4 py-2.5 text-sm font-bold tracking-wider text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
              />
              <p className="text-[11px] text-[#6E5D73] mt-1">All travels buses number plate must start with TN 76 (e.g. TN 76 AH 7890)</p>
            </div>

            {/* 4. Assigned Route */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5D73] mb-2">
                4. Assigned Commercial Route
              </label>
              <div className="relative">
                <select
                  value={formData.assignedRouteId}
                  onChange={(e) => setFormData({ ...formData, assignedRouteId: e.target.value })}
                  className="w-full bg-white border border-[#E7A0BF] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78] appearance-none"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.distance})
                    </option>
                  ))}
                </select>
                <MapPin size={16} className="absolute right-3 top-3 text-[#6E5D73] pointer-events-none" />
              </div>
              <p className="text-[11px] text-[#6E5D73] mt-1">Selected from database verified corridor routes</p>
            </div>

            {/* 5. Departure Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5D73] mb-2">
                5. Daily Departure Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  className="w-full bg-white border border-[#E7A0BF] rounded-xl px-4 py-2 text-sm font-semibold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                />
              </div>
              <p className="text-[11px] text-[#6E5D73] mt-1">e.g. 21:30 (Prime night departure)</p>
            </div>

            {/* 6. Arrival Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E5D73] mb-2">
                6. Estimated Arrival Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                  className="w-full bg-white border border-[#E7A0BF] rounded-xl px-4 py-2 text-sm font-semibold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                />
              </div>
              <p className="text-[11px] text-[#6E5D73] mt-1">e.g. 05:00 (Next morning arrival)</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP B: 6 OFFICIAL COACH LAYOUT SELECTOR                                   */}
        {/* ========================================================================= */}
        <div className="mt-8 bg-white rounded-2xl border border-[#F1EDFA] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1EDFA] mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1F6] border border-[#E7A0BF] flex items-center justify-center text-[#C13D78]">
                <Layers size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#24152D]">Step B: 6 Official Coach Layout Selector</h2>
                <p className="text-xs text-[#6E5D73]">
                  Select from our certified standard blueprints. Real-time preview updates instantly below.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-[#C13D78] bg-[#FFF1F6] px-3 py-1 rounded-full border border-[#E7A0BF]">
                Active Blueprint: {activeLayoutConfig.name}
              </div>
              <div className="text-xs font-black text-white bg-[#24152D] px-3 py-1 rounded-full tracking-wide">
                {activeLayoutConfig.countSummary}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OFFICIAL_LAYOUTS.map((layout, idx) => {
              const isSelected = selectedLayoutId === layout.id;
              return (
                <div
                  key={layout.id}
                  onClick={() => handleSelectLayout(layout.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-[#C13D78] bg-[#FFF1F6]/50 border-[#C13D78] shadow-md scale-[1.01]'
                      : 'bg-white border-[#E7A0BF]/50 hover:border-[#C13D78]/70 hover:shadow-xs'
                  }`}
                >
                  {/* Top layout index & selected badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#6E5D73]">
                      Layout {idx + 1}
                    </span>
                    {isSelected ? (
                      <span className="bg-[#C13D78] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <Check size={10} strokeWidth={3} /> SELECTED
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gray-100 text-[#6E5D73] px-2 py-0.5 rounded-full font-semibold">
                        {layout.deckType}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-extrabold text-[#24152D] mb-1.5">{layout.name}</h3>

                  {/* Classification & Exact Count Badges */}
                  <div className="flex flex-wrap gap-1.5 items-center mb-3">
                    <span className="bg-[#FFF1F6] border border-[#E7A0BF] text-[#C13D78] text-xs font-black px-2.5 py-0.5 rounded-md">
                      {layout.classification || layout.type}
                    </span>
                    <span className="bg-[#24152D] text-white text-[11px] font-black px-2.5 py-0.5 rounded-md tracking-wider">
                      {layout.countSummary}
                    </span>
                  </div>

                  {/* Specs Description */}
                  <p className="text-xs text-[#6E5D73] leading-relaxed mb-3">
                    <strong className="text-[#24152D]">Specs:</strong> {layout.specs}
                  </p>

                  {/* Capacity details */}
                  <div className="pt-3 border-t border-[#F1EDFA] flex items-center justify-between text-[11px] text-[#6E5D73]">
                    <span>Seats: {layout.seaterCount} | Berths: {layout.sleeperCount} | Driver: {layout.driverCount}</span>
                    <span className="font-bold text-[#C13D78]">Code: {layout.id}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* STEP B.2: MANDATORY BUS BRAND / CHASSIS SELECTION (REQUIREMENT 8)          */}
          {/* ========================================================================= */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-[#E7A0BF]/60">
            <div className="flex items-center justify-between pb-4 mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFF1F6] border border-[#E7A0BF] flex items-center justify-center text-[#C13D78]">
                  <Bus size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#24152D]">
                      Bus Brand / Chassis Selection
                    </h3>
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-300">
                      * Required
                    </span>
                  </div>
                  <p className="text-xs text-[#6E5D73]">
                    Select the certified commercial vehicle chassis model compatible with {activeLayoutConfig.name}.
                  </p>
                </div>
              </div>

              {selectedChassisObj && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Selected: {selectedChassisObj.fullName}</span>
                </div>
              )}
            </div>

            {/* Brand Filter Chips & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Brand Filter Pills */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {['ALL', 'Tata', 'Volvo', 'Ashok Leyland', 'Eicher', 'BharatBenz'].map((brand) => {
                  const isActive = selectedBrandFilter === brand;
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrandFilter(brand)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#C13D78] text-white shadow-xs'
                          : 'bg-white text-[#6E5D73] border border-[#E7A0BF] hover:bg-[#FFF1F6] hover:text-[#C13D78]'
                      }`}
                    >
                      {brand === 'ALL' ? 'All Brands' : brand}
                    </button>
                  );
                })}
              </div>

              {/* Search Chassis Input */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-3 text-[#6E5D73]" />
                <input
                  type="text"
                  value={chassisSearchQuery}
                  onChange={(e) => setChassisSearchQuery(e.target.value)}
                  placeholder="Search chassis brand, model, horsepower, wheelbase..."
                  className="w-full bg-white border border-[#E7A0BF] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                />
                {chassisSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setChassisSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#6E5D73] hover:text-[#24152D] text-xs font-bold"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Chassis Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredChassisList.map((chassis) => {
                const isSelected = selectedChassisId === chassis.id;
                return (
                  <div
                    key={chassis.id}
                    onClick={() => handleSelectChassis(chassis.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-[#C13D78] bg-[#FFF1F6] border-[#C13D78] shadow-xs'
                        : 'bg-white border-[#E7A0BF]/60 hover:border-[#C13D78]/60 hover:bg-[#FFF1F6]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-[#24152D]">
                        {chassis.brand}
                      </span>
                      {isSelected ? (
                        <span className="text-[10px] font-black text-[#C13D78] flex items-center gap-1">
                          <Check size={11} strokeWidth={3} /> ACTIVE CHASSIS
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Compatible
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black text-[#24152D] mb-1">{chassis.fullName}</div>
                    <p className="text-[11px] text-[#6E5D73] leading-tight line-clamp-2">{chassis.description}</p>
                  </div>
                );
              })}
            </div>

            {filteredChassisList.length === 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium text-center">
                No chassis found matching &quot;{chassisSearchQuery}&quot; for the selected layout and brand filter.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP C & D: LIVE COACH PREVIEW & DYNAMIC FARE CONFIGURATION ENGINE        */}
        {/* ========================================================================= */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Dynamic Fare Configuration Engine Controls */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#F1EDFA] p-6 shadow-sm sticky top-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1EDFA] mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1F6] border border-[#E7A0BF] flex items-center justify-center text-[#C13D78]">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#24152D]">Step C: Dynamic Fare Engine</h2>
                  <p className="text-xs text-[#6E5D73]">Adjust base pricing per berth class & seat type</p>
                </div>
              </div>
            </div>

            {/* 1. Sleeper Fare Controls (Rendered if layout has sleeper berths) */}
            {activeLayoutConfig.hasSleeper && (
              <div className="mb-6 p-4 rounded-xl bg-[#FFF1F6]/30 border border-[#E7A0BF]/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C13D78]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#24152D]">
                    Sleeper Fare Controls ({activeLayoutConfig.name})
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#6E5D73] mb-1">
                      Default Lower Deck Sleeper Fare (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-[#6E5D73]">₹</span>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={fareConfig.sleeperLower}
                        onChange={(e) => setFareConfig({ ...fareConfig, sleeperLower: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E7A0BF] rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6E5D73] mb-1">
                      Default Upper Deck Sleeper Fare (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-[#6E5D73]">₹</span>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={fareConfig.sleeperUpper}
                        onChange={(e) => setFareConfig({ ...fareConfig, sleeperUpper: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E7A0BF] rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6E5D73] mb-1">
                      Single Berth Window Premium (+₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-emerald-600">+₹</span>
                      <input
                        type="number"
                        min="0"
                        step="25"
                        value={fareConfig.singleWindowPremium}
                        onChange={(e) => setFareConfig({ ...fareConfig, singleWindowPremium: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E7A0BF] rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Seater Fare Controls (Rendered if layout has pushback seats) */}
            {activeLayoutConfig.hasSeater && (
              <div className="mb-6 p-4 rounded-xl bg-[#FFF1F6]/30 border border-[#E7A0BF]/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C13D78]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#24152D]">
                    Seater Fare Controls ({activeLayoutConfig.name})
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#6E5D73] mb-1">
                      Pushback Seater Standard Fare (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-[#6E5D73]">₹</span>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={fareConfig.seaterStandard}
                        onChange={(e) => setFareConfig({ ...fareConfig, seaterStandard: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E7A0BF] rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#6E5D73] mb-1">
                      Window Seat Premium (+₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm font-bold text-emerald-600">+₹</span>
                      <input
                        type="number"
                        min="0"
                        step="25"
                        value={fareConfig.seaterWindowPremium}
                        onChange={(e) => setFareConfig({ ...fareConfig, seaterWindowPremium: Number(e.target.value) })}
                        className="w-full bg-white border border-[#E7A0BF] rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Bulk Actions & GST Toggle */}
            <div className="space-y-4 pt-4 border-t border-[#F1EDFA]">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                <label htmlFor="gst-toggle" className="text-xs font-bold text-[#24152D] cursor-pointer">
                  Include 5% GST in Displayed Fare
                </label>
                <input
                  id="gst-toggle"
                  type="checkbox"
                  checked={fareConfig.includeGst}
                  onChange={(e) => setFareConfig({ ...fareConfig, includeGst: e.target.checked })}
                  className="w-4 h-4 accent-[#C13D78] rounded cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyBasePricing}
                className="w-full bg-white hover:bg-rose-50 text-[#C13D78] border border-[#E7A0BF] font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RotateCcw size={14} /> Apply Base Pricing to All Available Berths/Seats
              </button>

              {/* Overrides badge count */}
              {Object.keys(seatPriceOverrides).length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                  <span>Custom Seat Overrides:</span>
                  <span className="font-bold bg-amber-200 px-2 py-0.5 rounded text-[11px]">
                    {Object.keys(seatPriceOverrides).length} Active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Interactive Coach Visualizer */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#F1EDFA] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1EDFA] mb-6 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1F6] border border-[#E7A0BF] flex items-center justify-center text-[#C13D78]">
                  <Bus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#24152D]">Step C: Live Interactive Coach Preview</h2>
                  <p className="text-xs text-[#6E5D73]">
                    Click any seat/berth tag to set custom VIP/Window overrides
                  </p>
                </div>
              </div>
              <span className="bg-[#FFF1F6] text-[#C13D78] border border-[#E7A0BF] text-xs font-bold px-3 py-1 rounded-full">
                Interactive Preview Mode
              </span>
            </div>

            {/* Embedded CoachSeatLayout visualizer */}
            <div className="overflow-x-auto bg-[#FFF1F6]/20 p-2 sm:p-4 rounded-2xl border border-[#F1EDFA]">
              <CoachSeatLayout
                layoutType={selectedLayoutId}
                bus={{
                  layoutType: selectedLayoutId,
                  busType: selectedLayoutId,
                  type: activeLayoutConfig.name,
                  seatPricing: computedSeatPrices,
                  amenities: selectedAmenities,
                }}
                trip={{
                  tripId: 'admin_preview_bus',
                  bus: {
                    layoutType: selectedLayoutId,
                    busType: selectedLayoutId,
                    type: activeLayoutConfig.name,
                  },
                }}
                seatPricing={computedSeatPrices}
                onSeatClick={handleSeatClickForOverride}
                previewMode={true}
                showFloatingBar={false}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP E: AMENITIES SELECTION & SUBMISSION                                  */}
        {/* ========================================================================= */}
        <div className="mt-8 bg-white rounded-2xl border border-[#F1EDFA] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1EDFA] mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1F6] border border-[#E7A0BF] flex items-center justify-center text-[#C13D78]">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#24152D]">Step E: Passenger Amenities Selection & Submission</h2>
                <p className="text-xs text-[#6E5D73]">Select onboard perks verified for commercial listing</p>
              </div>
            </div>
            <span className="badge badge-success text-xs font-bold px-3 py-1 rounded-full">FLEET READY</span>
          </div>

          {/* Amenity Checkbox Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {OFFICIAL_AMENITIES.map((amenity) => {
              const isChecked = selectedAmenities.includes(amenity.label);
              const IconComp = amenity.icon;
              return (
                <div
                  key={amenity.id}
                  onClick={() => handleToggleAmenity(amenity.label)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col items-center text-center justify-between gap-2 ${
                    isChecked
                      ? 'bg-[#FFF1F6] border-[#C13D78] text-[#24152D] shadow-xs'
                      : 'bg-white border-gray-200 text-[#6E5D73] hover:border-[#E7A0BF]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isChecked ? 'bg-[#C13D78] text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <IconComp size={16} />
                  </div>
                  <span className="text-xs font-bold leading-tight">{amenity.label}</span>
                  <div
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                      isChecked ? 'bg-[#C13D78] text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isChecked ? 'ENABLED' : 'DISABLED'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Configuration Summary Card (Requirement 8 - Displayed Outside Map) */}
          <div className="mb-6 p-4 rounded-xl bg-[#FFF1F6]/50 border border-[#E7A0BF] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#C13D78]">
                Coach Deployment Specification Summary
              </div>
              <div className="text-sm font-extrabold text-[#24152D] flex flex-wrap items-center gap-2">
                <span>{formData.busName || 'Bus'}</span>
                <span className="text-[#6E5D73]">&bull;</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E7A0BF] text-xs">
                  {formData.registrationNumber || 'TN 76 ...'}
                </span>
                <span className="text-[#6E5D73]">&bull;</span>
                <span className="text-[#C13D78]">
                  {selectedChassisObj ? selectedChassisObj.fullName : 'No Chassis Selected'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-[#E7A0BF] text-xs">
                <span className="text-[#6E5D73] block text-[10px] font-bold uppercase">Classification</span>
                <span className="font-black text-[#24152D]">{activeLayoutConfig.classification || activeLayoutConfig.type}</span>
              </div>
              <div className="bg-[#24152D] px-3 py-1.5 rounded-lg text-white text-xs">
                <span className="text-gray-300 block text-[10px] font-bold uppercase">Exact Count</span>
                <span className="font-black tracking-wider">{activeLayoutConfig.countSummary}</span>
              </div>
            </div>
          </div>

          {/* Action Submission Buttons */}
          <div className="pt-6 border-t border-[#F1EDFA] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#6E5D73]">
              By publishing, this coach will be provisioned into {formData.operatorName}&apos;s live database fleet.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmitBus('draft')}
                className="flex-1 sm:flex-initial bg-white hover:bg-gray-50 text-[#6E5D73] border border-[#E7A0BF] font-bold px-6 py-3 rounded-xl transition-all cursor-pointer text-sm shadow-xs"
              >
                Save as Draft
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmitBus('published')}
                className="flex-1 sm:flex-initial bg-[#C13D78] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#A82B63] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-98"
              >
                {submitting ? (
                  <span>Publishing Coach...</span>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Publish Bus to Fleet</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEAT FARE OVERRIDE MODAL / POPUP                                         */}
      {/* ========================================================================= */}
      {overrideModalSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E7A0BF] p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1EDFA] mb-4">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-[#C13D78]" />
                <h3 className="text-base font-extrabold text-[#24152D]">
                  Override Fare for Seat {overrideModalSeat.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModalSeat(null)}
                className="text-[#6E5D73] hover:text-[#C13D78] p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#FFF1F6] border border-[#E7A0BF] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#6E5D73]">Seat ID:</span>
                  <span className="font-extrabold text-[#24152D]">{overrideModalSeat.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E5D73]">Deck / Class:</span>
                  <span className="font-semibold text-[#24152D]">
                    {overrideModalSeat.deck || 'LOWER'} &bull; {overrideModalSeat.type || 'Berth'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6E5D73]">Current Effective Fare:</span>
                  <span className="font-black text-[#C13D78]">
                    ₹{computedSeatPrices[overrideModalSeat.id] || overrideModalSeat.currentPrice}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6E5D73] mb-1">
                  Custom Seat Price Override (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-[#C13D78]">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={customOverrideInput}
                    onChange={(e) => setCustomOverrideInput(e.target.value)}
                    className="w-full bg-white border border-[#E7A0BF] rounded-xl pl-8 pr-4 py-2 text-sm font-black text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
                    placeholder="Enter custom fare"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-[#6E5D73]">Quick VIP Presets:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSeatOverride(Number(customOverrideInput) + 100)}
                    className="text-xs bg-[#FFF1F6] hover:bg-[#C13D78] hover:text-white text-[#C13D78] border border-[#E7A0BF] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    +₹100 (Front VIP)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSeatOverride(Number(customOverrideInput) + 150)}
                    className="text-xs bg-[#FFF1F6] hover:bg-[#C13D78] hover:text-white text-[#C13D78] border border-[#E7A0BF] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    +₹150 (Panoramic)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSeatOverride(1250)}
                    className="text-xs bg-[#FFF1F6] hover:bg-[#C13D78] hover:text-white text-[#C13D78] border border-[#E7A0BF] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    ₹1,250 (Luxury Glider)
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSingleSeat}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    Reset to Base
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F1EDFA] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOverrideModalSeat(null)}
                className="px-4 py-2 text-xs font-bold text-[#6E5D73] hover:text-[#24152D]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveSeatOverride()}
                className="bg-[#C13D78] hover:bg-[#A82B63] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Save Price Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
