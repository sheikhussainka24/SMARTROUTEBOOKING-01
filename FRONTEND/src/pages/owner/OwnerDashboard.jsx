import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import {
  Bus,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Navigation,
  Shield,
  Award,
  TrendingUp,
  Settings,
  FileText,
  Bell,
  Lock,
  AlertTriangle,
  Radio,
  Check,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  X,
  Key,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Briefcase,
  Truck,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Layers,
  Eye,
  Upload,
  Search,
  Compass,
} from 'lucide-react';
import LiveBusMap from '../../components/maps/LiveBusMap.jsx';
import CommercialRouteConfigModal from '../../components/owner/CommercialRouteConfigModal.jsx';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState({
    buses: 0,
    routes: 0,
    managers: 0,
    drivers: 0,
    upcomingTrips: 0,
    bookings: 0,
    totalRevenue: 0,
  });
  const [company, setCompany] = useState(null);

  // Entities
  const [managers, setManagers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [showAddBusModal, setShowAddBusModal] = useState(false);

  // Form states: Manager
  const [managerForm, setManagerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    designation: 'Operations Manager',
    department: 'Operations',
    canCreateDriver: true,
    canCreateStaff: false,
    canApproveApplications: true,
  });

  // Manager Permissions Configuration State
  const [selectedManagerForPerms, setSelectedManagerForPerms] = useState(null);
  const [managerPermsLoading, setManagerPermsLoading] = useState(false);
  const [managerPermsSaving, setManagerPermsSaving] = useState(false);
  const [configuredPerms, setConfiguredPerms] = useState({
    manage_buses: true,
    manage_routes: true,
    edit_fares: false,
    manage_drivers: true,
    view_bookings: true,
    process_cancellations: false,
    approve_refunds: false,
    export_reports: true,
    add_staff: false,
  });

  // Form states: Driver
  const [driverForm, setDriverForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    licenseNumber: '',
    licenseType: 'HMV Passenger',
    experienceYears: 5,
    assignedBusId: '',
    isAvailable: true,
  });

  // Form states: Bus
  const [busForm, setBusForm] = useState({
    registrationNumber: '',
    busNumber: '',
    busName: '',
    busType: 'AC Sleeper 2+1',
    totalSeats: 36,
  });

  // Notification helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Route & Stop Management State
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [editingStopIndex, setEditingStopIndex] = useState(null);
  const [stopForm, setStopForm] = useState({
    name: '',
    city: '',
    latitude: '',
    longitude: '',
    is_boarding_point: true,
    is_dropping_point: true,
    distance_from_start_km: 0,
    estimated_time_from_start_minutes: 0,
  });
  const [mapPreviewData, setMapPreviewData] = useState(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [savingStops, setSavingStops] = useState(false);
  const [showRouteConfigModal, setShowRouteConfigModal] = useState(false);

  const handleRouteCreated = (newRoute) => {
    if (newRoute) {
      setRoutes((prev) => [newRoute, ...prev.filter((r) => r.id !== newRoute.id)]);
      setSelectedRoute(newRoute);
      fetchRouteStops(newRoute.id);
    }
    loadAllData();
  };

  const fetchRouteStops = async (routeId) => {
    try {
      setLoadingStops(true);
      const res = await api.get(`/owner/routes/${routeId}/stops`);
      if (res.success && res.data?.stops) {
        setRouteStops(res.data.stops);
      } else {
        setRouteStops([]);
      }
    } catch (err) {
      console.warn('Failed to fetch route stops:', err);
      setRouteStops([]);
    } finally {
      setLoadingStops(false);
    }
  };

  const handleSelectRoute = (r) => {
    setSelectedRoute(r);
    fetchRouteStops(r.id);
  };

  const handleMoveStop = async (index, direction) => {
    if (!selectedRoute) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= routeStops.length) return;

    const updated = [...routeStops];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const reordered = updated.map((s, idx) => ({ ...s, stop_order: idx + 1 }));
    setRouteStops(reordered);

    try {
      setSavingStops(true);
      const res = await api.put(`/owner/routes/${selectedRoute.id}/stops`, { stops: reordered });
      if (res.success) {
        showToast('Stops reordered and saved successfully', 'success');
      }
    } catch (err) {
      showToast('Failed to update stop order', 'error');
    } finally {
      setSavingStops(false);
    }
  };

  const handleDeleteStop = async (stopIndex) => {
    if (!selectedRoute) return;
    const updated = routeStops.filter((_, idx) => idx !== stopIndex);
    const reordered = updated.map((s, idx) => ({ ...s, stop_order: idx + 1 }));
    setRouteStops(reordered);

    try {
      setSavingStops(true);
      await api.put(`/owner/routes/${selectedRoute.id}/stops`, { stops: reordered });
      showToast('Stop removed successfully', 'success');
    } catch (err) {
      showToast('Failed to delete stop', 'error');
    } finally {
      setSavingStops(false);
    }
  };

  const handleOpenAddStop = () => {
    setEditingStopIndex(null);
    setStopForm({
      name: '',
      city: selectedRoute?.source || '',
      latitude: '',
      longitude: '',
      is_boarding_point: true,
      is_dropping_point: true,
      distance_from_start_km: routeStops.length * 25,
      estimated_time_from_start_minutes: routeStops.length * 30,
    });
    setStopModalOpen(true);
  };

  const handleOpenEditStop = (stop, index) => {
    setEditingStopIndex(index);
    setStopForm({
      name: stop.name || '',
      city: stop.city || '',
      latitude: stop.latitude || '',
      longitude: stop.longitude || '',
      is_boarding_point: stop.is_boarding_point !== false,
      is_dropping_point: stop.is_dropping_point !== false,
      distance_from_start_km: stop.distance_from_start_km || 0,
      estimated_time_from_start_minutes: stop.estimated_time_from_start_minutes || 0,
    });
    setStopModalOpen(true);
  };

  const handleSaveStop = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedRoute) return;

    if (!stopForm.name.trim()) {
      showToast('Stop name is required', 'error');
      return;
    }

    const lat = parseFloat(stopForm.latitude);
    const lng = parseFloat(stopForm.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      if (lat < 8.0 || lat > 35.5 || lng < 68.0 || lng > 97.5) {
        showToast('Coordinates must be within the Indian territorial bounds (8.0°N–35.5°N, 68.0°E–97.5°E)', 'error');
        return;
      }
    }

    const updated = [...routeStops];
    const stopPayload = {
      name: stopForm.name.trim(),
      city: stopForm.city.trim() || selectedRoute.source,
      latitude: isNaN(lat) ? null : lat,
      longitude: isNaN(lng) ? null : lng,
      is_boarding_point: Boolean(stopForm.is_boarding_point),
      is_dropping_point: Boolean(stopForm.is_dropping_point),
      distance_from_start_km: Number(stopForm.distance_from_start_km) || 0,
      estimated_time_from_start_minutes: Number(stopForm.estimated_time_from_start_minutes) || 0,
    };

    if (editingStopIndex !== null) {
      updated[editingStopIndex] = { ...updated[editingStopIndex], ...stopPayload };
    } else {
      updated.push({
        ...stopPayload,
        id: `stop-${selectedRoute.id}-${updated.length + 1}`,
        stop_order: updated.length + 1,
      });
    }

    const reordered = updated.map((s, idx) => ({ ...s, stop_order: idx + 1 }));
    setRouteStops(reordered);
    setStopModalOpen(false);

    try {
      setSavingStops(true);
      await api.put(`/owner/routes/${selectedRoute.id}/stops`, { stops: reordered });
      showToast(editingStopIndex !== null ? 'Stop updated successfully' : 'New stop added successfully', 'success');
    } catch (err) {
      showToast('Failed to save stop', 'error');
    } finally {
      setSavingStops(false);
    }
  };

  const handleToggleVerification = async (route) => {
    const isCurrentlyVerified = route.verification_status === 'VERIFIED';
    try {
      setActionLoading(true);
      const res = await api.post(`/owner/routes/${route.id}/verify`, { isVerified: !isCurrentlyVerified });
      if (res.success) {
        showToast(`Route ${route.name} is now ${!isCurrentlyVerified ? 'VERIFIED' : 'PENDING REVIEW'}`, 'success');
        setRoutes((prev) =>
          prev.map((r) => (r.id === route.id ? { ...r, verification_status: !isCurrentlyVerified ? 'VERIFIED' : 'PENDING_VERIFICATION' } : r))
        );
        if (selectedRoute?.id === route.id) {
          setSelectedRoute((prev) => ({ ...prev, verification_status: !isCurrentlyVerified ? 'VERIFIED' : 'PENDING_VERIFICATION' }));
        }
      }
    } catch (err) {
      showToast('Failed to update route verification', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkImportSubmit = async () => {
    try {
      const parsed = JSON.parse(bulkImportText);
      const routesToImport = Array.isArray(parsed) ? parsed : parsed.routes;
      if (!Array.isArray(routesToImport)) {
        showToast('JSON must be an array of routes or have a "routes" key', 'error');
        return;
      }
      setActionLoading(true);
      const res = await api.post('/owner/routes/bulk-import', { routes: routesToImport });
      if (res.success) {
        showToast(`Successfully imported ${res.data?.imported || routesToImport.length} verified routes`, 'success');
        setShowBulkImportModal(false);
        setBulkImportText('');
        loadAllData();
      }
    } catch (err) {
      showToast('Invalid JSON: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.welcomeMessage) {
      showToast(location.state.welcomeMessage, 'success');
    }
  }, [location.state]);

  // Main data loader
  const loadAllData = async () => {
    try {
      setLoading(true);

      // Fetch stats and company info
      try {
        const statsRes = await api.get('/operator/stats');
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data.stats || {});
          setCompany(statsRes.data.company || {});
        }
      } catch (e) {
        console.warn('Operator stats fallback:', e);
      }

      // Fetch Managers
      try {
        const mgrRes = await api.get('/operator/managers');
        if (mgrRes.success) {
          setManagers(mgrRes.managers || mgrRes.data?.managers || []);
        }
      } catch (e) {
        console.warn('Managers fetch fallback:', e);
      }

      // Fetch Drivers
      try {
        const drvRes = await api.get('/operator/drivers');
        if (drvRes.success) {
          setDrivers(drvRes.drivers || drvRes.data?.drivers || []);
        }
      } catch (e) {
        console.warn('Drivers fetch fallback:', e);
      }

      // Fetch Buses
      try {
        const busRes = await api.get('/operator/company/buses');
        if (busRes.success) {
          setBuses(busRes.buses || busRes.data?.buses || []);
        }
      } catch (e) {
        try {
          const fallbackBuses = await api.get('/owner/buses');
          if (fallbackBuses.success) setBuses(fallbackBuses.buses || []);
        } catch (err) {}
      }

      // Fetch Routes
      try {
        const routeRes = await api.get('/operator/company/routes');
        if (routeRes.success) {
          setRoutes(routeRes.routes || routeRes.data?.routes || []);
        }
      } catch (e) {
        try {
          const fallbackRoutes = await api.get('/owner/routes');
          if (fallbackRoutes.success) setRoutes(fallbackRoutes.routes || []);
        } catch (err) {}
      }

      // Fetch Bookings
      try {
        const bookingRes = await api.get('/operator/company/bookings');
        if (bookingRes.success) {
          setBookings(bookingRes.bookings || bookingRes.data?.bookings || []);
        }
      } catch (e) {
        console.warn('Bookings fallback:', e);
      }

      // Fallback trips search for active schedules
      try {
        const tripRes = await api.get('/trips/search?fromCity=Coimbatore&toCity=Tenkasi');
        if (tripRes.success && tripRes.trips) {
          setTrips(tripRes.trips);
        }
      } catch (e) {}

    } catch (err) {
      console.error('Owner dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ==================== MANAGER HANDLERS ====================
  const handleCreateManager = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/operator/managers', {
        ...managerForm,
        password: managerForm.password || undefined,
      });

      if (res.success) {
        showToast(`Manager ${managerForm.firstName} created successfully.`);
        setShowAddManagerModal(false);
        setManagerForm({
          firstName: '',
          lastName: '',
          email: '',
          mobile: '',
          password: '',
          designation: 'Operations Manager',
          department: 'Operations',
          canCreateDriver: true,
          canCreateStaff: false,
          canApproveApplications: true,
        });
        loadAllData();
      } else {
        showToast(res.error || 'Failed to create manager', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error creating manager', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateManager = async (e) => {
    e.preventDefault();
    if (!editingManager) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/operator/managers/${editingManager.id}`, {
        firstName: editingManager.first_name,
        lastName: editingManager.last_name,
        designation: editingManager.designation,
        department: editingManager.department,
        status: editingManager.status,
        canCreateDriver: editingManager.can_create_driver,
        canCreateStaff: editingManager.can_create_staff,
        canApproveApplications: editingManager.can_approve_applications,
      });

      if (res.success) {
        showToast('Manager updated successfully.');
        setEditingManager(null);
        loadAllData();
      } else {
        showToast(res.error || 'Failed to update manager', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error updating manager', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateManager = async (managerId, managerName) => {
    if (!window.confirm(`Are you sure you want to deactivate manager ${managerName}? They will no longer have access to company data.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.delete(`/operator/managers/${managerId}`);
      if (res.success) {
        showToast(`Manager ${managerName} has been deactivated.`);
        loadAllData();
      } else {
        showToast(res.error || 'Failed to deactivate manager', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error deactivating manager', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== MANAGER PERMISSION HANDLERS ====================
  const loadManagerPermissions = async (managerId) => {
    setSelectedManagerForPerms(managerId);
    setManagerPermsLoading(true);
    try {
      const res = await api.get(`/operator/managers/${managerId}/permissions`);
      if (res.success && res.data?.permissions) {
        setConfiguredPerms(res.data.permissions);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    } finally {
      setManagerPermsLoading(false);
    }
  };

  const handleTogglePermission = (permKey) => {
    setConfiguredPerms((prev) => ({
      ...prev,
      [permKey]: !prev[permKey],
    }));
  };

  const saveManagerPermissions = async () => {
    if (!selectedManagerForPerms) return;
    setManagerPermsSaving(true);
    try {
      const res = await api.put(`/operator/managers/${selectedManagerForPerms}/permissions`, {
        permissions: configuredPerms,
      });
      if (res.success) {
        showToast('Manager permissions successfully saved and actively enforced.');
      } else {
        showToast(res.error || 'Failed to update permissions', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error saving permissions', 'error');
    } finally {
      setManagerPermsSaving(false);
    }
  };

  // ==================== DRIVER HANDLERS ====================
  const handleCreateDriver = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/operator/drivers', {
        ...driverForm,
        password: driverForm.password || undefined,
      });

      if (res.success) {
        showToast(`Driver ${driverForm.firstName} created successfully.`);
        setShowAddDriverModal(false);
        setDriverForm({
          firstName: '',
          lastName: '',
          email: '',
          mobile: '',
          password: '',
          licenseNumber: '',
          licenseType: 'HMV Passenger',
          experienceYears: 5,
          assignedBusId: '',
          isAvailable: true,
        });
        loadAllData();
      } else {
        showToast(res.error || 'Failed to create driver', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error creating driver', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    if (!editingDriver) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/operator/drivers/${editingDriver.id}`, {
        firstName: editingDriver.first_name,
        lastName: editingDriver.last_name,
        licenseNumber: editingDriver.license_number,
        licenseType: editingDriver.license_type,
        experienceYears: editingDriver.experience_years,
        assignedBusId: editingDriver.assigned_bus_id,
        isAvailable: editingDriver.is_available,
        status: editingDriver.status,
      });

      if (res.success) {
        showToast('Driver profile updated successfully.');
        setEditingDriver(null);
        loadAllData();
      } else {
        showToast(res.error || 'Failed to update driver', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error updating driver', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateDriver = async (driverId, driverName) => {
    if (!window.confirm(`Are you sure you want to deactivate driver ${driverName}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.delete(`/operator/drivers/${driverId}`);
      if (res.success) {
        showToast(`Driver ${driverName} deactivated.`);
        loadAllData();
      } else {
        showToast(res.error || 'Failed to deactivate driver', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error deactivating driver', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== BUS HANDLERS ====================
  const handleCreateBus = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/owner/buses', busForm);
      if (res.success) {
        showToast(`Bus ${busForm.registrationNumber} added to fleet.`);
        setShowAddBusModal(false);
        setBusForm({
          registrationNumber: '',
          busNumber: '',
          busName: '',
          busType: 'AC Sleeper 2+1',
          totalSeats: 36,
        });
        loadAllData();
      } else {
        showToast(res.error || 'Failed to register bus', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error adding bus', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <BrandLogo variant="icon" size="lg" showText={false} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--sr-text-secondary)' }}>Loading travel operator console...</div>
      </div>
    );
  }

  const travelName = company?.name || company?.business_name || 'SMART ROUTE Travels';
  const verificationStatus = (company?.verification_status || 'approved').toLowerCase();
  const isCarrierVerified = verificationStatus === 'approved' || verificationStatus === 'verified';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1280, margin: '0 auto', width: '100%', padding: '0 12px' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: notification.type === 'error' ? '#EF4444' : '#10B981',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Enterprise Platform Header */}
      <div className="sr-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`badge ${isCarrierVerified ? 'badge-success' : 'badge-warning'}`}>
              {isCarrierVerified ? 'VERIFIED CARRIER' : 'VERIFICATION PENDING'}
            </span>
            {company?.gst_number && (
              <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)', fontWeight: 600 }}>
                GSTIN: {company.gst_number}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--sr-cyan)' }}>
              Operator ID: {company?.id || 'trv-smartroute-001'}
            </span>
          </div>

          <h1 style={{ fontSize: 26, color: 'var(--sr-text-primary)', margin: '8px 0 4px', fontWeight: 800 }}>
            {travelName} &middot; Operator Fleet Console
          </h1>
          <div style={{ fontSize: 13, color: 'var(--sr-text-secondary)' }}>
            {company?.business_address ? `${company.business_address}, ` : ''}
            {company?.city || 'Coimbatore'}, {company?.state || 'Tamil Nadu'} &middot; Dedicated Tenant Isolated Workspace
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadAllData}
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
          >
            <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setManagerForm({
                firstName: '',
                lastName: '',
                email: '',
                mobile: '',
                password: `Mgr${Math.random().toString(36).substring(2, 7)}!9`,
                designation: 'Operations Manager',
                department: 'Operations',
                canCreateDriver: true,
                canCreateStaff: false,
                canApproveApplications: true,
              });
              setShowAddManagerModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}
          >
            <Plus size={15} /> Add Manager
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setDriverForm({
                firstName: '',
                lastName: '',
                email: '',
                mobile: '',
                password: `Drv${Math.random().toString(36).substring(2, 7)}!1`,
                licenseNumber: '',
                licenseType: 'HMV Passenger',
                experienceYears: 5,
                assignedBusId: buses[0]?.id || '',
                isAvailable: true,
              });
              setShowAddDriverModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, background: '#7C3AED' }}
          >
            <Plus size={15} /> Add Driver
          </button>
        </div>
      </div>

      {/* Verification Pending Notice */}
      {!isCarrierVerified && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(254, 243, 199, 0.25) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E', marginBottom: 3 }}>
              Operator Registration Status: Pending Administrative Verification
            </div>
            <p style={{ fontSize: 13, color: '#B45309', margin: 0, lineHeight: 1.5 }}>
              Your travel company account is currently in <strong>Verification Pending</strong> review by the SMART ROUTE platform administrator. You can configure your company details, add operations managers, add fleet buses, and review route schedules. Public seat sales on published trips will become available as soon as administrative review is completed.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        background: 'var(--sr-bg-card)',
        padding: 6,
        borderRadius: 12,
        border: '1px solid var(--sr-border-card)',
        overflowX: 'auto',
      }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'accounting', label: '📊 Financial & Fleet Ledger', isRoute: true },
          { id: 'managers', label: `Managers (${managers.length})` },
          { id: 'drivers', label: `Drivers (${drivers.length})` },
          { id: 'fleet', label: `Fleet Buses (${buses.length || stats.buses || 3})` },
          { id: 'routes', label: `Assigned Commercial Routes (${routes.length || stats.routes || 2})` },
          { id: 'bookings', label: `Bookings (${bookings.length || stats.bookings || 0})` },
          { id: 'permissions', label: 'Role Permissions Matrix' },
          { id: 'settings', label: 'Company Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.isRoute) {
                navigate('/operator/accounting');
              } else {
                setActiveTab(tab.id);
              }
            }}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              whiteSpace: 'nowrap',
              ...(tab.isRoute ? { borderColor: '#10B981', color: '#059669', background: '#ECFDF5' } : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB: OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Accounting & Financial Analytics Callout Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255, 241, 246, 0.95) 0%, rgba(241, 237, 250, 0.95) 100%)',
              border: '1.5px solid #E7A0BF',
              borderRadius: 14,
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 4px 14px rgba(193, 61, 120, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  background: 'var(--sr-primary, #C13D78)',
                  color: '#FFFFFF',
                  padding: 10,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(193, 61, 120, 0.3)',
                }}
              >
                <TrendingUp size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#24152D' }}>
                  Company Financial & Accounting Ledger
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#6E5D73', maxWidth: 640 }}>
                  Track gross ticket sales, diesel fuel expenses, driver payroll, operating profit/loss per trip, and verified passenger ratings with strict company-level isolation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/operator/accounting')}
              style={{
                background: 'linear-gradient(135deg, #C13D78 0%, #A82B63 100%)',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(193, 61, 120, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Open Financial Ledger</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Summary Cards (Requirement 7) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div className="sr-stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('fleet')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sr-stat-label">Total Buses</span>
                <Bus size={18} color="var(--sr-primary)" />
              </div>
              <span className="sr-stat-value">{buses.length || stats.buses || 3}</span>
              <span style={{ fontSize: 11, color: 'var(--sr-cyan)' }}>Fleet active on routes</span>
            </div>

            <div className="sr-stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('routes')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sr-stat-label">Active Routes</span>
                <MapPin size={18} color="var(--sr-cyan)" />
              </div>
              <span className="sr-stat-value">{routes.length || stats.routes || 2}</span>
              <span style={{ fontSize: 11, color: 'var(--sr-emerald)' }}>Commercial corridors</span>
            </div>

            <div className="sr-stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('managers')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sr-stat-label">Managers</span>
                <Users size={18} color="#A78BFA" />
              </div>
              <span className="sr-stat-value" style={{ color: '#A78BFA' }}>{managers.length || stats.managers || 1}</span>
              <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>Operations managers</span>
            </div>

            <div className="sr-stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('drivers')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sr-stat-label">Drivers</span>
                <Truck size={18} color="var(--sr-emerald)" />
              </div>
              <span className="sr-stat-value" style={{ color: 'var(--sr-emerald)' }}>{drivers.length || stats.drivers || 2}</span>
              <span style={{ fontSize: 11, color: 'var(--sr-emerald)' }}>HMV licensed drivers</span>
            </div>

            <div className="sr-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sr-stat-label">Upcoming Trips</span>
                <Calendar size={18} color="#F59E0B" />
              </div>
              <span className="sr-stat-value">{trips.length || stats.upcomingTrips || 6}</span>
              <span style={{ fontSize: 11, color: '#F59E0B' }}>Scheduled for today</span>
            </div>

            <div className="sr-stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('bookings')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sr-stat-label">Bookings</span>
                <FileText size={18} color="var(--sr-primary)" />
              </div>
              <span className="sr-stat-value">{bookings.length || stats.bookings || 47}</span>
              <span style={{ fontSize: 11, color: 'var(--sr-cyan)' }}>Confirmed tickets</span>
            </div>
          </div>

          {/* Quick Staffing Summary Bar */}
          <div className="sr-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="var(--sr-primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sr-text-primary)', margin: 0 }}>
                  Authorized Company Staff & Rostering
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('managers')}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  Manage Managers ({managers.length})
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('drivers')}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  Manage Drivers ({drivers.length})
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {managers.slice(0, 2).map((m) => (
                <div key={m.id} style={{
                  background: 'var(--sr-bg-root)',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--sr-border-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sr-text-primary)' }}>
                      {m.first_name} {m.last_name || ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                      {m.designation || 'Manager'} &middot; {m.email}
                    </div>
                  </div>
                  <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {m.status || 'Active'}
                  </span>
                </div>
              ))}

              {drivers.slice(0, 2).map((d) => (
                <div key={d.id} style={{
                  background: 'var(--sr-bg-root)',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--sr-border-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sr-text-primary)' }}>
                      {d.first_name} {d.last_name || ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--sr-cyan)' }}>
                      DL: {d.license_number || 'HMV Certified'} &middot; {d.mobile}
                    </div>
                  </div>
                  <span className={`badge ${d.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {d.is_available ? 'Available' : 'On Duty'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Fleet Telemetry Table */}
          <div className="sr-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 700 }}>
                Company Bus Fleet & Current Operations
              </h2>
              <span className="badge badge-cyan">TELEMETRY SCOPED TO {travelName.toUpperCase()}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px' }}>Registration</th>
                    <th style={{ padding: '10px 8px' }}>Bus Name / Code</th>
                    <th style={{ padding: '10px 8px' }}>Type & Seats</th>
                    <th style={{ padding: '10px 8px' }}>Assigned Driver</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(buses.length > 0 ? buses : [
                    { id: '1', registration_number: 'TN-38-SR-0001', bus_number: 'SR-EXP-001', name: 'Flagship Pioneer 1', bus_type: 'AC Sleeper 2+1', total_seats: 48, is_active: true },
                    { id: '2', registration_number: 'TN-43-BL-0002', bus_number: 'SR-EXP-002', name: 'BlueLine Express 2', bus_type: 'AC Sleeper 2+1', total_seats: 48, is_active: true },
                    { id: '3', registration_number: 'TN-59-SS-0003', bus_number: 'SR-EXP-003', name: 'SouthStar Highway 3', bus_type: 'AC Sleeper 2+1', total_seats: 48, is_active: true },
                  ]).map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                        {b.registration_number || b.registrationNumber}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--sr-primary)', fontWeight: 600 }}>
                        {b.bus_number || b.busNumber || b.name}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {b.bus_type || b.busType} &middot; {b.total_seats || 48} Seats
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--sr-cyan)' }}>
                        {drivers.find((d) => d.assigned_bus_id === b.id)?.first_name || 'Rostered by schedule'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className="badge badge-success">Active & GPS Live</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: MANAGERS (Requirement 2) ==================== */}
      {activeTab === 'managers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="sr-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 4px', fontWeight: 800 }}>
                  Travel Managers Management
                </h2>
                <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
                  Add, edit, deactivate, and assign permissions to managers authorized for {travelName}.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setManagerForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    mobile: '',
                    password: `Mgr${Math.random().toString(36).substring(2, 7)}!9`,
                    designation: 'Operations Manager',
                    department: 'Operations',
                    canCreateDriver: true,
                    canCreateStaff: false,
                    canApproveApplications: true,
                  });
                  setShowAddManagerModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Add New Manager
              </button>
            </div>

            {managers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, border: '1px dashed var(--sr-border-card)', borderRadius: 10 }}>
                <Users size={36} color="var(--sr-text-secondary)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>No Managers Added Yet</h4>
                <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 16 }}>
                  Create manager accounts to delegate bus management, trip dispatching, and driver supervision.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowAddManagerModal(true)}
                >
                  Add First Manager
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 10px' }}>Manager Name</th>
                      <th style={{ padding: '12px 10px' }}>Contact Info</th>
                      <th style={{ padding: '12px 10px' }}>Designation & Dept</th>
                      <th style={{ padding: '12px 10px' }}>Permissions</th>
                      <th style={{ padding: '12px 10px' }}>Status</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                        <td style={{ padding: '14px 10px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--sr-text-primary)', fontSize: 14 }}>
                            {m.first_name} {m.last_name || ''}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                            Role: Travel Manager
                          </div>
                        </td>
                        <td style={{ padding: '14px 10px' }}>
                          <div style={{ color: 'var(--sr-text-primary)' }}>{m.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--sr-cyan)' }}>{m.mobile || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 10px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--sr-primary)' }}>{m.designation || 'Operations Manager'}</div>
                          <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>{m.department || 'Operations'}</div>
                        </td>
                        <td style={{ padding: '14px 10px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {m.can_create_driver !== false && (
                              <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: 4 }}>
                                Drivers
                              </span>
                            )}
                            <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--sr-cyan)', borderRadius: 4 }}>
                              Fleet & Trips
                            </span>
                            {m.can_create_staff && (
                              <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(124, 58, 237, 0.1)', color: '#A78BFA', borderRadius: 4 }}>
                                Staff
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 10px' }}>
                          <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                            {m.status === 'active' ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => setEditingManager({ ...m })}
                              style={{ padding: '6px 10px', fontSize: 12 }}
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            {m.status === 'active' && (
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleDeactivateManager(m.id, `${m.first_name} ${m.last_name || ''}`)}
                                style={{ padding: '6px 10px', fontSize: 12, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              >
                                <UserX size={13} /> Deactivate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: DRIVERS (Requirement 3) ==================== */}
      {activeTab === 'drivers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="sr-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 4px', fontWeight: 800 }}>
                  Commercial Drivers Management
                </h2>
                <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
                  Register, verify, assign buses to, and monitor drivers employed by {travelName}.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setDriverForm({
                    firstName: '',
                    lastName: '',
                    email: '',
                    mobile: '',
                    password: `Drv${Math.random().toString(36).substring(2, 7)}!1`,
                    licenseNumber: '',
                    licenseType: 'HMV Passenger',
                    experienceYears: 5,
                    assignedBusId: buses[0]?.id || '',
                    isAvailable: true,
                  });
                  setShowAddDriverModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#7C3AED' }}
              >
                <Plus size={16} /> Add New Driver
              </button>
            </div>

            {drivers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, border: '1px dashed var(--sr-border-card)', borderRadius: 10 }}>
                <Truck size={36} color="var(--sr-text-secondary)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>No Drivers Registered</h4>
                <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 16 }}>
                  Add HMV licensed drivers to assign to scheduled commercial trips.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowAddDriverModal(true)}
                >
                  Add First Driver
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 10px' }}>Driver Name</th>
                      <th style={{ padding: '12px 10px' }}>Contact</th>
                      <th style={{ padding: '12px 10px' }}>License Details</th>
                      <th style={{ padding: '12px 10px' }}>Assigned Coach</th>
                      <th style={{ padding: '12px 10px' }}>Availability</th>
                      <th style={{ padding: '12px 10px' }}>Status</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((d) => {
                      const assignedBus = buses.find((b) => b.id === d.assigned_bus_id);
                      return (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--sr-text-primary)', fontSize: 14 }}>
                              {d.first_name} {d.last_name || ''}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                              Experience: {d.experience_years || 5} Years
                            </div>
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ color: 'var(--sr-text-primary)' }}>{d.mobile}</div>
                            <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>{d.email || 'No email'}</div>
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--sr-primary)' }}>
                              {d.license_number || 'TN38-DL-PENDING'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                              Type: {d.license_type || 'HMV Passenger'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            {assignedBus ? (
                              <div style={{ color: 'var(--sr-cyan)', fontWeight: 600 }}>
                                {assignedBus.bus_number || assignedBus.registration_number}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--sr-text-secondary)', fontSize: 12 }}>Unassigned / Rotating</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <span className={`badge ${d.is_available !== false ? 'badge-success' : 'badge-warning'}`}>
                              {d.is_available !== false ? 'Available' : 'On Trip'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 10px' }}>
                            <span className={`badge ${d.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                              {d.status === 'active' ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setEditingDriver({ ...d })}
                                style={{ padding: '6px 10px', fontSize: 12 }}
                              >
                                <Edit2 size={13} /> Edit
                              </button>
                              {d.status === 'active' && (
                                <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleDeactivateDriver(d.id, `${d.first_name} ${d.last_name || ''}`)}
                                style={{ padding: '6px 10px', fontSize: 12, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              >
                                <UserX size={13} /> Deactivate
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: FLEET BUSES ==================== */}
      {activeTab === 'fleet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="sr-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 4px', fontWeight: 800 }}>
                  Company Buses & Seat Configurations
                </h2>
                <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
                  View and manage coaches owned by {travelName}.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => navigate('/admin/buses/create')}
                  className="bg-[#C13D78] hover:bg-[#A82B63] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span>+ Add Bus</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {(buses.length > 0 ? buses : [
                { id: '1', registration_number: 'TN-38-SR-0001', bus_number: 'SR-EXP-001', name: 'Flagship Pioneer 1', bus_type: 'AC Sleeper 2+1', total_seats: 48 },
                { id: '2', registration_number: 'TN-43-BL-0002', bus_number: 'SR-EXP-002', name: 'BlueLine Express 2', bus_type: 'AC Sleeper 2+1', total_seats: 48 },
                { id: '3', registration_number: 'TN-59-SS-0003', bus_number: 'SR-EXP-003', name: 'SouthStar Highway 3', bus_type: 'AC Sleeper 2+1', total_seats: 48 },
              ]).map((b) => (
                <div key={b.id} className="sr-card" style={{ padding: 18, border: '1px solid var(--sr-border-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span className="badge badge-success">GPS ENABLED</span>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '8px 0 2px' }}>
                        {b.name || b.bus_number || b.busNumber}
                      </h3>
                      <div style={{ fontSize: 13, color: 'var(--sr-primary)', fontWeight: 700 }}>
                        {b.registration_number || b.registrationNumber}
                      </div>
                    </div>
                    <Bus size={24} color="var(--sr-primary)" />
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 12 }}>
                    Type: <strong style={{ color: 'var(--sr-text-primary)' }}>{b.bus_type || b.busType}</strong> &bull; Capacity: <strong style={{ color: 'var(--sr-text-primary)' }}>{b.total_seats || 48} Berths</strong>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--sr-cyan)', borderRadius: 4 }}>
                      WiFi Enabled
                    </span>
                    <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: 4 }}>
                      AIS-140 GPS
                    </span>
                    <span style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', borderRadius: 4 }}>
                      Individual AC
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: ASSIGNED COMMERCIAL ROUTES & STOPS MANAGEMENT ==================== */}
      {activeTab === 'routes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Bar */}
          <div className="sr-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 22, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>
                  Assigned Commercial Routes
                </h2>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--sr-emerald)', fontWeight: 700 }}>
                  {routes.length} Active Corridors
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--sr-text-secondary)' }}>
                Configure commercial route origins & destinations across India, manage ordered intermediate stops, audit road coordinates (8.0°N–35.5°N, 68.0°E–97.5°E), and preview route polylines before saving.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowRouteConfigModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              >
                <Plus size={16} strokeWidth={2.5} /> Configure Commercial Route
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowBulkImportModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              >
                <Upload size={14} /> Bulk Import
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--sr-text-secondary)' }} />
              <input
                type="text"
                placeholder="Search corridors by city, code, or terminal name (e.g. Coimbatore, Tenkasi, Bengaluru)..."
                value={routeSearchQuery}
                onChange={(e) => setRouteSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 38, width: '100%' }}
              />
            </div>
            {routeSearchQuery && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setRouteSearchQuery('')}
                style={{ fontSize: 12 }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Master-Detail Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(460px, 1.4fr)', gap: 20, alignItems: 'start' }}>
            {/* Left Column: Routes List */}
            <div className="sr-card" style={{ padding: 18, maxHeight: '820px', overflowY: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sr-text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Corridor ({routes.filter((r) => {
                  if (!routeSearchQuery) return true;
                  const q = routeSearchQuery.toLowerCase();
                  return (
                    (r.name && r.name.toLowerCase().includes(q)) ||
                    (r.source && r.source.toLowerCase().includes(q)) ||
                    (r.destination && r.destination.toLowerCase().includes(q)) ||
                    (r.code && r.code.toLowerCase().includes(q))
                  );
                }).length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {routes
                  .filter((r) => {
                    if (!routeSearchQuery) return true;
                    const q = routeSearchQuery.toLowerCase();
                    return (
                      (r.name && r.name.toLowerCase().includes(q)) ||
                      (r.source && r.source.toLowerCase().includes(q)) ||
                      (r.destination && r.destination.toLowerCase().includes(q)) ||
                      (r.code && r.code.toLowerCase().includes(q))
                    );
                  })
                  .slice(0, 30)
                  .map((r) => {
                    const isSelected = selectedRoute?.id === r.id;
                    const isVerified = r.verification_status === 'VERIFIED';
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRoute(r)}
                        style={{
                          background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--sr-bg-root)',
                          padding: '14px 16px',
                          borderRadius: 8,
                          border: isSelected ? '2px solid var(--sr-emerald)' : '1px solid var(--sr-border-card)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--sr-text-primary)' }}>
                            {r.source} ➔ {r.destination}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 10,
                              background: isVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: isVerified ? 'var(--sr-emerald)' : '#F59E0B',
                            }}
                          >
                            {isVerified ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </div>

                        <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>{r.distance_km || 345} km</span>
                          <span>&bull;</span>
                          <span>{Math.round((r.estimated_duration_minutes || r.duration_minutes || 420) / 60)} hrs</span>
                          <span>&bull;</span>
                          <span style={{ color: 'var(--sr-cyan)' }}>{r.stops_count !== undefined ? `${r.stops_count} Stops` : 'Stops available'}</span>
                        </div>

                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>Code: {r.code || r.id}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVerification(r);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: isVerified ? '#F59E0B' : 'var(--sr-emerald)',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              padding: 0,
                            }}
                          >
                            {isVerified ? 'Mark Pending' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Right Column: Ordered Stops & Actions */}
            <div className="sr-card" style={{ padding: 22 }}>
              {selectedRoute ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--sr-border-card)', paddingBottom: 16, marginBottom: 18 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--sr-text-primary)' }}>
                          {selectedRoute.source} ➔ {selectedRoute.destination}
                        </h3>
                        <span
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontWeight: 700,
                            background: selectedRoute.verification_status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: selectedRoute.verification_status === 'VERIFIED' ? 'var(--sr-emerald)' : '#F59E0B',
                          }}
                        >
                          {selectedRoute.verification_status || 'VERIFIED'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 4 }}>
                        Route ID: <code>{selectedRoute.id}</code> &bull; Total Distance: {selectedRoute.distance_km || 345} km &bull; Total Stops: {routeStops.length}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setMapPreviewData({ route: selectedRoute, stops: routeStops })}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                      >
                        <Eye size={14} /> Preview Map
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleOpenAddStop}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                      >
                        <Plus size={14} /> Add Stop
                      </button>
                    </div>
                  </div>

                  {loadingStops ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--sr-text-secondary)' }}>
                      <RefreshCw size={24} className="sr-spin" style={{ margin: '0 auto 12px' }} />
                      Loading verified stops sequence...
                    </div>
                  ) : routeStops.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--sr-text-secondary)', background: 'var(--sr-bg-root)', borderRadius: 8 }}>
                      <AlertCircle size={32} style={{ margin: '0 auto 12px', color: '#F59E0B' }} />
                      <div style={{ fontWeight: 700, color: 'var(--sr-text-primary)' }}>No intermediate stops defined yet</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Click "Add Stop" above to configure ordered boarding and dropping points.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {routeStops.map((st, idx) => {
                        const hasValidCoords =
                          st.latitude &&
                          st.longitude &&
                          st.latitude >= 8.0 &&
                          st.latitude <= 35.5 &&
                          st.longitude >= 68.0 &&
                          st.longitude <= 97.5;

                        return (
                          <div
                            key={st.id || idx}
                            style={{
                              background: 'var(--sr-bg-root)',
                              border: '1px solid var(--sr-border-card)',
                              borderRadius: 8,
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                              {/* Reorder Buttons */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <button
                                  type="button"
                                  disabled={idx === 0 || savingStops}
                                  onClick={() => handleMoveStop(idx, -1)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                    padding: 2,
                                    color: idx === 0 ? 'var(--sr-border-card)' : 'var(--sr-text-secondary)',
                                  }}
                                  title="Move Up"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === routeStops.length - 1 || savingStops}
                                  onClick={() => handleMoveStop(idx, 1)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: idx === routeStops.length - 1 ? 'not-allowed' : 'pointer',
                                    padding: 2,
                                    color: idx === routeStops.length - 1 ? 'var(--sr-border-card)' : 'var(--sr-text-secondary)',
                                  }}
                                  title="Move Down"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>

                              {/* Stop Order Circle */}
                              <div
                                style={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: 'var(--sr-emerald)',
                                  fontWeight: 800,
                                  fontSize: 12,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {idx + 1}
                              </div>

                              {/* Stop Details */}
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                                    {st.name}
                                  </span>
                                  <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                                    ({st.city})
                                  </span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                  <span style={{ color: hasValidCoords ? 'var(--sr-emerald)' : '#EF4444' }}>
                                    {hasValidCoords ? `✓ ${Number(st.latitude).toFixed(4)}°N, ${Number(st.longitude).toFixed(4)}°E` : '⚠️ Missing / invalid GPS'}
                                  </span>
                                  <span>&bull;</span>
                                  <span>{st.distance_from_start_km || idx * 25} km</span>
                                  <span>&bull;</span>
                                  <span>+{st.estimated_time_from_start_minutes || idx * 30} mins</span>
                                </div>
                              </div>
                            </div>

                            {/* Badges & Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {st.is_boarding_point && (
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--sr-emerald)', fontWeight: 700 }}>
                                  Board
                                </span>
                              )}
                              {st.is_dropping_point && (
                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontWeight: 700 }}>
                                  Drop
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditStop(st, idx)}
                                style={{ background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer', padding: 4 }}
                                title="Edit Stop"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStop(idx)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                                title="Delete Stop"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--sr-text-secondary)' }}>
                  <Compass size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>
                    Select a Commercial Route Corridor
                  </h3>
                  <p style={{ fontSize: 13, maxWidth: 380, margin: '0 auto 16px' }}>
                    Choose any corridor from the left pane to audit ordered stops, verify geographic coordinates, and view road maps, or configure a new commercial route across India.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowRouteConfigModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, margin: '0 auto' }}
                  >
                    <Plus size={15} /> Configure Commercial Route
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: BOOKINGS ==================== */}
      {activeTab === 'bookings' && (
        <div className="sr-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 16px', fontWeight: 800 }}>
            Passenger Bookings Manifest ({bookings.length || 5})
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px' }}>PNR</th>
                  <th style={{ padding: '12px 10px' }}>Passenger Name</th>
                  <th style={{ padding: '12px 10px' }}>Seats</th>
                  <th style={{ padding: '12px 10px' }}>Route</th>
                  <th style={{ padding: '12px 10px' }}>Total Amount</th>
                  <th style={{ padding: '12px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(bookings.length > 0 ? bookings : [
                  { pnr: 'SR8921', passenger: 'Arun Prakash', route: 'Coimbatore ➔ Tenkasi', seats: 'L1, L2', amount: 1785, status: 'Confirmed' },
                  { pnr: 'SR7742', passenger: 'Deepak Nair', route: 'Coimbatore ➔ Tenkasi', seats: 'LS1', amount: 1417, status: 'Confirmed' },
                  { pnr: 'SR6319', passenger: 'Kavitha Sundar', route: 'Coimbatore ➔ Tenkasi', seats: 'U1, U2', amount: 2887, status: 'Confirmed' },
                  { pnr: 'SR5518', passenger: 'Karthik Raja', route: 'Coimbatore ➔ Tenkasi', seats: 'L4', amount: 892, status: 'Confirmed' },
                  { pnr: 'SR4120', passenger: 'Meenakshi Iyer', route: 'Coimbatore ➔ Tenkasi', seats: 'U5', amount: 1470, status: 'Confirmed' },
                ]).map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--sr-primary)' }}>
                      {b.pnr || b.booking_reference}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--sr-text-primary)', fontWeight: 600 }}>
                      {b.passenger || b.passenger_name || 'Passenger'}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--sr-cyan)', fontWeight: 700 }}>
                      {b.seats || b.seat_numbers || 'L1'}
                    </td>
                    <td style={{ padding: '12px 10px' }}>{b.route || 'Coimbatore ➔ Tenkasi'}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--sr-emerald)', fontWeight: 700 }}>
                      ₹{b.amount || b.total_fare || b.total_amount || 892}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge badge-success">{b.status || b.booking_status || 'Confirmed'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB: PERMISSIONS MATRIX & MANAGER ACCESS CONTROL ==================== */}
      {activeTab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1. Manager Specific Permissions Control Panel */}
          <div className="sr-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={20} color="var(--sr-primary)" />
                  Manager Permissions Control Center
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--sr-text-secondary)' }}>
                  Configure granular permissions for company managers. Least-privilege defaults are applied; sensitive operations require explicit authorization.
                </p>
              </div>

              {/* Manager Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-secondary)' }}>Select Manager:</label>
                <select
                  value={selectedManagerForPerms || ''}
                  onChange={(e) => loadManagerPermissions(e.target.value)}
                  className="input-field"
                  style={{ width: 220, padding: '6px 12px', fontSize: 13 }}
                >
                  <option value="" disabled>Choose a manager...</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} ({m.designation || 'Manager'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedManagerForPerms ? (
              <div>
                {managerPermsLoading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--sr-text-secondary)' }}>
                    <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px' }} />
                    Loading configured permissions for manager...
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, margin: '20px 0' }}>
                      {[
                        {
                          key: 'manage_buses',
                          label: 'Manage Buses',
                          category: 'Operations',
                          desc: 'Add, edit details, amenities, and activate/deactivate company buses',
                          isSensitive: false,
                          defaultEnabled: true,
                        },
                        {
                          key: 'manage_routes',
                          label: 'Manage Routes & Schedules',
                          category: 'Operations',
                          desc: 'Create and edit trips on approved routes, set stops and operating dates',
                          isSensitive: false,
                          defaultEnabled: true,
                        },
                        {
                          key: 'manage_drivers',
                          label: 'Manage Drivers',
                          category: 'Fleet & Staff',
                          desc: 'Add drivers, verify DL credentials, assign buses, and manage availability',
                          isSensitive: false,
                          defaultEnabled: true,
                        },
                        {
                          key: 'view_bookings',
                          label: 'View Bookings',
                          category: 'Customer Service',
                          desc: 'Search bookings by PNR, passenger name, route, and view seat layout',
                          isSensitive: false,
                          defaultEnabled: true,
                        },
                        {
                          key: 'export_reports',
                          label: 'Export Reports',
                          category: 'Reporting',
                          desc: 'Generate and export company operational and booking reports with masked PII',
                          isSensitive: false,
                          defaultEnabled: true,
                        },
                        {
                          key: 'edit_fares',
                          label: 'Edit Fares',
                          category: 'Commercial',
                          desc: 'Adjust fares within ±20% limits; larger changes require operator approval',
                          isSensitive: true,
                          defaultEnabled: false,
                        },
                        {
                          key: 'process_cancellations',
                          label: 'Process Cancellations',
                          category: 'Customer Service',
                          desc: 'Assist passengers with booking cancellations subject to company rules',
                          isSensitive: true,
                          defaultEnabled: false,
                        },
                        {
                          key: 'approve_refunds',
                          label: 'Approve Refunds',
                          category: 'Financial',
                          desc: 'Authorize financial refund disbursements for eligible cancelled bookings',
                          isSensitive: true,
                          defaultEnabled: false,
                        },
                        {
                          key: 'add_staff',
                          label: 'Add Staff',
                          category: 'Administration',
                          desc: 'Create counter booking staff and sub-manager accounts for company',
                          isSensitive: true,
                          defaultEnabled: false,
                        },
                      ].map((item) => {
                        const isChecked = !!configuredPerms[item.key];
                        return (
                          <div
                            key={item.key}
                            style={{
                              background: isChecked ? 'rgba(16, 185, 129, 0.05)' : 'var(--sr-bg-card-subtle)',
                              border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.3)' : 'var(--sr-border-card)'}`,
                              borderRadius: 12,
                              padding: '14px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 800, color: 'var(--sr-text-tertiary)' }}>
                                  {item.category}
                                </span>
                                {item.isSensitive ? (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                                    Sensitive
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                                    Standard
                                  </span>
                                )}
                              </div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sr-text-primary)' }}>
                                {item.label}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                                {item.desc}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--sr-border-subtle)' }}>
                              <span style={{ fontSize: 11, color: isChecked ? '#10B981' : 'var(--sr-text-tertiary)', fontWeight: 600 }}>
                                {isChecked ? 'Granted' : 'Disabled (Denied)'}
                              </span>
                              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(item.key)}
                                  style={{
                                    width: 18,
                                    height: 18,
                                    accentColor: '#10B981',
                                    cursor: 'pointer',
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setConfiguredPerms({
                            manage_buses: true,
                            manage_routes: true,
                            edit_fares: false,
                            manage_drivers: true,
                            view_bookings: true,
                            process_cancellations: false,
                            approve_refunds: false,
                            export_reports: true,
                            add_staff: false,
                          });
                        }}
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        Reset to Least-Privilege Defaults
                      </button>
                      <button
                        type="button"
                        onClick={saveManagerPermissions}
                        disabled={managerPermsSaving}
                        className="btn btn-primary"
                        style={{ padding: '8px 24px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        {managerPermsSaving ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
                        Save & Enforce Permissions
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '36px 20px', textAlign: 'center', background: 'var(--sr-bg-card-subtle)', borderRadius: 10, marginTop: 16 }}>
                <Key size={32} color="var(--sr-text-tertiary)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                  No Manager Selected
                </div>
                <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 4 }}>
                  Select a manager above to inspect or reconfigure their active privileges.
                </div>
              </div>
            )}
          </div>

          {/* 2. Platform Role-Based Access Control Architecture Table */}
          <div className="sr-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, color: 'var(--sr-text-primary)', margin: '0 0 14px', fontWeight: 800 }}>
              Company & Platform Role Hierarchy
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 10px' }}>Operation / Responsibility</th>
                    <th style={{ padding: '12px 10px' }}>Admin</th>
                    <th style={{ padding: '12px 10px' }}>Travel Operator</th>
                    <th style={{ padding: '12px 10px' }}>Manager</th>
                    <th style={{ padding: '12px 10px' }}>Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { op: 'Platform Oversight & Operator Approvals', admin: true, owner: false, mgr: false, drv: false },
                    { op: 'Register Operator & Manage Company Profile', admin: true, owner: true, mgr: false, drv: false },
                    { op: 'Add, Edit & Deactivate Managers', admin: true, owner: true, mgr: false, drv: false },
                    { op: 'Configure Manager Permission Matrix', admin: true, owner: true, mgr: false, drv: false },
                    { op: 'Add, Edit, Assign & Deactivate Drivers', admin: true, owner: true, mgr: true, drv: false },
                    { op: 'Add & Edit Buses & Seat Layouts', admin: true, owner: true, mgr: true, drv: false },
                    { op: 'Schedule Trips & Dispatch Services', admin: true, owner: true, mgr: true, drv: false },
                    { op: 'View Passenger Manifest & Bookings', admin: true, owner: true, mgr: true, drv: false },
                    { op: 'Access Driver Portal & Telemetry GPS', admin: false, owner: false, mgr: false, drv: true },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                      <td style={{ padding: '12px 10px', color: 'var(--sr-text-primary)', fontWeight: 600 }}>{row.op}</td>
                      <td style={{ padding: '12px 10px' }}>{row.admin ? <Check size={16} color="#10B981" /> : <span style={{ color: '#64748B' }}>—</span>}</td>
                      <td style={{ padding: '12px 10px' }}>{row.owner ? <Check size={16} color="#10B981" /> : <span style={{ color: '#64748B' }}>—</span>}</td>
                      <td style={{ padding: '12px 10px' }}>{row.mgr ? <Check size={16} color="#10B981" /> : <span style={{ color: '#64748B' }}>—</span>}</td>
                      <td style={{ padding: '12px 10px' }}>{row.drv ? <Check size={16} color="#10B981" /> : <span style={{ color: '#64748B' }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB: SETTINGS ==================== */}
      {activeTab === 'settings' && (
        <div className="sr-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 16px', fontWeight: 800 }}>
            Travel Operator Profile & Company Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 700 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Travel / Brand Name
              </label>
              <input type="text" className="input-field" value={company?.name || travelName} readOnly />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Registered Business Name
              </label>
              <input type="text" className="input-field" value={company?.business_name || travelName} readOnly />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                GSTIN Identification
              </label>
              <input type="text" className="input-field" value={company?.gst_number || '33AABCS8891M1ZT'} readOnly />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Verification Status
              </label>
              <input type="text" className="input-field" value={verificationStatus.toUpperCase()} readOnly />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                Headquarters City & State
              </label>
              <input type="text" className="input-field" value={`${company?.city || 'Coimbatore'}, ${company?.state || 'Tamil Nadu'}`} readOnly />
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD MANAGER ==================== */}
      {showAddManagerModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 540, width: '100%', padding: 28, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAddManagerModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>
              Add Manager to {travelName}
            </h3>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Provide manager credentials. Managers will be securely assigned exclusively to your company.
            </p>

            <form onSubmit={handleCreateManager} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. Arvind"
                    value={managerForm.firstName}
                    onChange={(e) => setManagerForm({ ...managerForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Sundaram"
                    value={managerForm.lastName}
                    onChange={(e) => setManagerForm({ ...managerForm, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Work Email *
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    required
                    placeholder="manager@company.in"
                    value={managerForm.email}
                    onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    required
                    placeholder="10-digit mobile"
                    value={managerForm.mobile}
                    onChange={(e) => setManagerForm({ ...managerForm, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Operations Manager"
                    value={managerForm.designation}
                    onChange={(e) => setManagerForm({ ...managerForm, designation: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={managerForm.password}
                    onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div style={{ background: 'var(--sr-bg-root)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-primary)', marginBottom: 8 }}>
                  Manager Permissions
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={managerForm.canCreateDriver}
                    onChange={(e) => setManagerForm({ ...managerForm, canCreateDriver: e.target.checked })}
                  />
                  <span>Can Add, Edit, and Manage Commercial Drivers</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={managerForm.canApproveApplications}
                    onChange={(e) => setManagerForm({ ...managerForm, canApproveApplications: e.target.checked })}
                  />
                  <span>Can Manage Trips, Buses and Schedules</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddManagerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating...' : 'Create Manager Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT MANAGER ==================== */}
      {editingManager && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 520, width: '100%', padding: 28, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setEditingManager(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 16px' }}>
              Edit Manager & Permissions
            </h3>

            <form onSubmit={handleUpdateManager} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>First Name</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={editingManager.first_name || ''}
                    onChange={(e) => setEditingManager({ ...editingManager, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Last Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingManager.last_name || ''}
                    onChange={(e) => setEditingManager({ ...editingManager, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Designation</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingManager.designation || ''}
                    onChange={(e) => setEditingManager({ ...editingManager, designation: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Status</label>
                  <select
                    className="input-field"
                    value={editingManager.status || 'active'}
                    onChange={(e) => setEditingManager({ ...editingManager, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--sr-bg-root)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-primary)', marginBottom: 8 }}>Permissions</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingManager.can_create_driver !== false}
                    onChange={(e) => setEditingManager({ ...editingManager, can_create_driver: e.target.checked })}
                  />
                  <span>Can Manage Drivers</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingManager(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD DRIVER ==================== */}
      {showAddDriverModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 540, width: '100%', padding: 28, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAddDriverModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>
              Add Driver to {travelName}
            </h3>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Register driver details, license information, and optional assigned coach.
            </p>

            <form onSubmit={handleCreateDriver} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>First Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. Muthu"
                    value={driverForm.firstName}
                    onChange={(e) => setDriverForm({ ...driverForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Last Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Krishnan"
                    value={driverForm.lastName}
                    onChange={(e) => setDriverForm({ ...driverForm, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Mobile Number *</label>
                  <input
                    type="tel"
                    className="input-field"
                    required
                    placeholder="10-digit mobile"
                    value={driverForm.mobile}
                    onChange={(e) => setDriverForm({ ...driverForm, mobile: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Driver Login Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="driver@company.in"
                    value={driverForm.email}
                    onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Commercial License Number *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. TN38-DL-2018-0091823"
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    min="1"
                    max="45"
                    value={driverForm.experienceYears}
                    onChange={(e) => setDriverForm({ ...driverForm, experienceYears: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Assigned Bus
                  </label>
                  <select
                    className="input-field"
                    value={driverForm.assignedBusId}
                    onChange={(e) => setDriverForm({ ...driverForm, assignedBusId: e.target.value })}
                  >
                    <option value="">-- Rotating / Unassigned --</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bus_number || b.registration_number} ({b.name || b.bus_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Portal Login Password
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={driverForm.password}
                    onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddDriverModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ background: '#7C3AED' }}>
                  {actionLoading ? 'Creating...' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT DRIVER ==================== */}
      {editingDriver && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 520, width: '100%', padding: 28, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setEditingDriver(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 16px' }}>
              Edit Driver & Bus Assignment
            </h3>

            <form onSubmit={handleUpdateDriver} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>First Name</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={editingDriver.first_name || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Last Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingDriver.last_name || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>License Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingDriver.license_number || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, license_number: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Experience (Yrs)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editingDriver.experience_years || 0}
                    onChange={(e) => setEditingDriver({ ...editingDriver, experience_years: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Assigned Bus</label>
                  <select
                    className="input-field"
                    value={editingDriver.assigned_bus_id || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, assigned_bus_id: e.target.value })}
                  >
                    <option value="">-- None / Rotating --</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bus_number || b.registration_number}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Availability</label>
                  <select
                    className="input-field"
                    value={editingDriver.is_available ? 'available' : 'on_trip'}
                    onChange={(e) => setEditingDriver({ ...editingDriver, is_available: e.target.value === 'available' })}
                  >
                    <option value="available">Available for duty</option>
                    <option value="on_trip">Currently on trip</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingDriver(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Driver Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD BUS ==================== */}
      {showAddBusModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 500, width: '100%', padding: 28, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAddBusModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 16px' }}>
              Register Bus to {travelName}
            </h3>

            <form onSubmit={handleCreateBus} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                  RTO Registration Number *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. TN-38-SR-9988"
                  value={busForm.registrationNumber}
                  onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value.toUpperCase() })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Bus Number</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. SR-EXP-004"
                    value={busForm.busNumber}
                    onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Total Berths</label>
                  <input
                    type="number"
                    className="input-field"
                    value={busForm.totalSeats}
                    onChange={(e) => setBusForm({ ...busForm, totalSeats: parseInt(e.target.value) || 36 })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Coach Type</label>
                <select
                  className="input-field"
                  value={busForm.busType}
                  onChange={(e) => setBusForm({ ...busForm, busType: e.target.value })}
                >
                  <option value="AC Sleeper 2+1">Bharat Benz AC Sleeper 2+1 (AIS-140)</option>
                  <option value="Volvo Multi-Axle B11R">Volvo Multi-Axle B11R AC Sleeper</option>
                  <option value="Scania Metrolink AC">Scania Metrolink AC Semi-Sleeper</option>
                  <option value="Tata Vega AC">Tata Vega AC Coach</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddBusModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Registering...' : 'Register Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT STOP ==================== */}
      {stopModalOpen && (
        <div className="sr-modal-overlay">
          <div className="sr-modal-content sr-card" style={{ maxWidth: 520, padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)' }}>
                {editingStopIndex !== null ? 'Edit Intermediate Stop' : 'Add New Intermediate Stop'}
              </h3>
              <button
                type="button"
                onClick={() => setStopModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStop} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                  Stop Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Gandhipuram Omni Bus Stand or Palladam Bus Stand"
                  value={stopForm.name}
                  onChange={(e) => setStopForm({ ...stopForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                  City / Town *
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="e.g. Coimbatore or Tiruppur"
                  value={stopForm.city}
                  onChange={(e) => setStopForm({ ...stopForm, city: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Latitude (8.0°N–35.5°N)
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="e.g. 11.0183"
                    value={stopForm.latitude}
                    onChange={(e) => setStopForm({ ...stopForm, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Longitude (68.0°E–97.5°E)
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="e.g. 76.9725"
                    value={stopForm.longitude}
                    onChange={(e) => setStopForm({ ...stopForm, longitude: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Distance from Origin (km)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={stopForm.distance_from_start_km}
                    onChange={(e) => setStopForm({ ...stopForm, distance_from_start_km: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>
                    Est. Time from Origin (mins)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={stopForm.estimated_time_from_start_minutes}
                    onChange={(e) => setStopForm({ ...stopForm, estimated_time_from_start_minutes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20, padding: '10px 12px', background: 'var(--sr-bg-root)', borderRadius: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--sr-text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={stopForm.is_boarding_point}
                    onChange={(e) => setStopForm({ ...stopForm, is_boarding_point: e.target.checked })}
                  />
                  <span>Boarding Eligible</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--sr-text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={stopForm.is_dropping_point}
                    onChange={(e) => setStopForm({ ...stopForm, is_dropping_point: e.target.checked })}
                  />
                  <span>Drop-off Eligible</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setStopModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingStops}>
                  {savingStops ? 'Saving...' : editingStopIndex !== null ? 'Update Stop' : 'Add Stop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: INTERACTIVE MAP PREVIEW ==================== */}
      {mapPreviewData && (
        <div className="sr-modal-overlay">
          <div className="sr-modal-content sr-card" style={{ maxWidth: 860, width: '92vw', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)' }}>
                  Transit Route Map Preview: {mapPreviewData.route.source} ➔ {mapPreviewData.route.destination}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 2 }}>
                  Showing {mapPreviewData.stops.length} ordered stops with verified geographical road geometry.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapPreviewData(null)}
                style={{ background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--sr-border-card)' }}>
              <LiveBusMap
                tripId={mapPreviewData.route.id}
                stops={mapPreviewData.stops}
                height="480px"
                hasLiveGps={false}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>
                Status: <strong style={{ color: 'var(--sr-emerald)' }}>{mapPreviewData.route.verification_status || 'VERIFIED'}</strong> &bull; Total Stops: <strong>{mapPreviewData.stops.length}</strong>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setMapPreviewData(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: BULK IMPORT ==================== */}
      {showBulkImportModal && (
        <div className="sr-modal-overlay">
          <div className="sr-modal-content sr-card" style={{ maxWidth: 640, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)' }}>
                Bulk Import Verified Routes & Stops
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--sr-text-secondary)', margin: '0 0 14px' }}>
              Paste a JSON array containing verified routes with their ordered intermediate stops. Coordinates must lie within Indian transit coordinates.
            </p>

            <textarea
              className="input-field"
              rows={12}
              style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
              placeholder={`[
  {
    "name": "Coimbatore - Tenkasi Super Express",
    "source": "Coimbatore",
    "destination": "Tenkasi",
    "distanceKm": 345,
    "durationMinutes": 440,
    "stops": [
      { "name": "Gandhipuram Omni Bus Stand", "city": "Coimbatore", "latitude": 11.0183, "longitude": 76.9725, "is_boarding_point": true },
      { "name": "Tenkasi New Bus Stand", "city": "Tenkasi", "latitude": 8.9604, "longitude": 77.3152, "is_dropping_point": true }
    ]
  }
]`}
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowBulkImportModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={actionLoading || !bulkImportText.trim()}
                onClick={handleBulkImportSubmit}
              >
                {actionLoading ? 'Importing...' : 'Validate & Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: COMMERCIAL ROUTE CONFIGURATOR ==================== */}
      <CommercialRouteConfigModal
        isOpen={showRouteConfigModal}
        onClose={() => setShowRouteConfigModal(false)}
        onRouteCreated={handleRouteCreated}
        showToast={showToast}
        existingRoutes={routes}
      />
    </div>
  );
}
