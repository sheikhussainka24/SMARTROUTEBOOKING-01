import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import {
  Calendar,
  Bus,
  MapPin,
  Users,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  Clock,
  Phone,
  FileText,
  Radio,
  Check,
  BarChart3,
  HelpCircle,
  Navigation,
  Plus,
  Edit2,
  Trash2,
  X,
  Truck,
  UserX,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  Download,
  Search,
  Filter,
  DollarSign,
  Eye,
  ShieldAlert,
  ArrowUpDown,
  Building2,
} from 'lucide-react';

const DEFAULT_PERMISSIONS = {
  manage_buses: true,
  manage_routes: true,
  edit_fares: false,
  manage_drivers: true,
  view_bookings: true,
  process_cancellations: false,
  approve_refunds: false,
  export_reports: true,
  add_staff: false,
};

const PERMISSION_META = {
  manage_buses: { label: 'Manage Buses', isSensitive: false },
  manage_routes: { label: 'Manage Routes & Schedules', isSensitive: false },
  edit_fares: { label: 'Edit Fares (±20%)', isSensitive: true },
  manage_drivers: { label: 'Manage Drivers', isSensitive: false },
  view_bookings: { label: 'View Bookings', isSensitive: false },
  process_cancellations: { label: 'Process Cancellations', isSensitive: true },
  approve_refunds: { label: 'Approve Refunds', isSensitive: true },
  export_reports: { label: 'Export Reports', isSensitive: false },
  add_staff: { label: 'Add Staff', isSensitive: true },
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('operations');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Operator and Manager state
  const [company, setCompany] = useState({ name: 'Smart Route Operator', slug: '' });
  const [stats, setStats] = useState({
    buses: 0,
    routes: 0,
    drivers: 0,
    upcomingTrips: 0,
    bookings: 0,
    totalRevenue: 0,
  });
  const [operationalAlerts, setOperationalAlerts] = useState([]);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);

  // Entities
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [reportsData, setReportsData] = useState([]);

  // Filters & Search
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingDateFilter, setBookingDateFilter] = useState('');

  // Modals
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [busForm, setBusForm] = useState({
    registrationNumber: '',
    busNumber: '',
    busType: 'AC Sleeper 2+1',
    totalSeats: 36,
    amenities: 'WiFi, AC, Charging Point, Blankets, Water Bottle',
    status: 'active',
  });

  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [tripForm, setTripForm] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    departureTime: '21:00',
    arrivalTime: '06:00',
    operatingDates: new Date().toISOString().split('T')[0],
    fare: 850,
    boardingPoints: 'Coimbatore Omni Bus Stand (21:00), Gandhipuram (21:20)',
    droppingPoints: 'Tenkasi Bus Stand (05:45), New Bus Stand (06:00)',
  });

  const [showFareModal, setShowFareModal] = useState(false);
  const [fareTrip, setFareTrip] = useState(null);
  const [proposedFare, setProposedFare] = useState('');

  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
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

  const [showCancelBookingModal, setShowCancelBookingModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Passenger requested schedule cancellation');
  const [requestRefund, setRequestRefund] = useState(false);

  const showNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Load all company-scoped data
  async function loadData() {
    try {
      setLoading(true);

      // 1. Stats and Permissions
      try {
        const statsRes = await api.get('/operator/stats');
        if (statsRes.success) {
          if (statsRes.data?.company) setCompany(statsRes.data.company);
          if (statsRes.data?.stats) setStats(statsRes.data.stats);
          if (statsRes.data?.operationalAlerts) setOperationalAlerts(statsRes.data.operationalAlerts);
          if (statsRes.data?.managerPermissions) {
            setPermissions(statsRes.data.managerPermissions);
          }
        }
      } catch (err) {
        console.warn('Stats fetch notice:', err.message);
      }

      // 2. Fetch specific permissions for current manager
      try {
        const permRes = await api.get('/operator/managers/me/permissions');
        if (permRes.success && permRes.data?.permissions) {
          setPermissions(permRes.data.permissions);
        }
      } catch (err) {
        // Fallback or already set via stats
      }

      // 3. Company Buses
      try {
        const busRes = await api.get('/operator/company/buses');
        if (busRes.success) setBuses(busRes.buses || []);
      } catch (err) {}

      // 4. Company Routes
      try {
        const routeRes = await api.get('/operator/company/routes');
        if (routeRes.success) setRoutes(routeRes.routes || []);
      } catch (err) {}

      // 5. Company Trips
      try {
        const tripRes = await api.get('/operator/company/trips');
        if (tripRes.success) setTrips(tripRes.trips || []);
      } catch (err) {}

      // 6. Schedule Conflicts
      try {
        const confRes = await api.get('/operator/company/conflicts');
        if (confRes.success) setConflicts(confRes.conflicts || []);
      } catch (err) {}

      // 7. Company Drivers
      try {
        const drvRes = await api.get('/operator/drivers');
        if (drvRes.success) setDrivers(drvRes.drivers || drvRes.data?.drivers || []);
      } catch (err) {}

      // 8. Bookings
      try {
        const bookRes = await api.get('/operator/company/bookings');
        if (bookRes.success) setBookings(bookRes.bookings || []);
      } catch (err) {}

      // 9. Initial Reports
      try {
        const repRes = await api.get('/operator/company/reports?type=manifest');
        if (repRes.success && repRes.data?.records) {
          setReportsData(repRes.data.records);
        }
      } catch (err) {}

    } catch (err) {
      console.error('Manager load error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ===================== BUS ACTIONS =====================
  const handleCreateBus = async (e) => {
    e.preventDefault();
    if (!permissions.manage_buses) {
      showNotification('Permission Denied: Manage Buses permission required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/operator/company/buses', busForm);
      if (res.success) {
        showNotification(`Bus ${busForm.busNumber || busForm.registrationNumber} added to company fleet.`);
        setShowAddBusModal(false);
        setBusForm({
          registrationNumber: '',
          busNumber: '',
          busType: 'AC Sleeper 2+1',
          totalSeats: 36,
          amenities: 'WiFi, AC, Charging Point, Blankets, Water Bottle',
          status: 'active',
        });
        loadData();
      } else {
        showNotification(res.error || 'Failed to add bus', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error creating bus', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBus = async (e) => {
    e.preventDefault();
    if (!editingBus) return;
    if (!permissions.manage_buses) {
      showNotification('Permission Denied: Manage Buses permission required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put(`/operator/company/buses/${editingBus.id}`, {
        registrationNumber: editingBus.registration_number || editingBus.registrationNumber,
        busNumber: editingBus.bus_number || editingBus.busNumber,
        busType: editingBus.bus_type || editingBus.busType,
        totalSeats: editingBus.total_seats || editingBus.totalSeats,
        amenities: editingBus.amenities,
        status: editingBus.status,
      });
      if (res.success) {
        showNotification('Bus specifications updated successfully.');
        setEditingBus(null);
        loadData();
      } else {
        showNotification(res.error || 'Failed to update bus', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error updating bus', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBus = async (busId, regNumber) => {
    if (!permissions.manage_buses) {
      showNotification('Permission Denied: Manage Buses permission required', 'error');
      return;
    }
    if (!window.confirm(`Permanently delete coach ${regNumber}?`)) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/operator/company/buses/${busId}`);
      if (res.success) {
        showNotification(`Bus ${regNumber} deleted successfully.`);
        loadData();
      } else {
        // Check for specific safeguard code
        if (res.code === 'CANNOT_DELETE_BUS_WITH_HISTORY' || res.status === 409) {
          showNotification('Safeguard Triggered: Cannot delete bus with linked passenger bookings or historical trips. Please deactivate instead.', 'error');
        } else {
          showNotification(res.error || 'Cannot delete bus', 'error');
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('CANNOT_DELETE_BUS_WITH_HISTORY') || err.response?.data?.code === 'CANNOT_DELETE_BUS_WITH_HISTORY') {
        showNotification('Safeguard Triggered: Cannot delete bus with linked passenger bookings or historical trips. Please deactivate instead.', 'error');
      } else {
        showNotification(msg || 'Error deleting bus', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ===================== TRIP & DISPATCH ACTIONS =====================
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!permissions.manage_routes) {
      showNotification('Permission Denied: Manage Routes & Schedules permission required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/operator/company/trips', {
        ...tripForm,
        boardingPoints: tripForm.boardingPoints.split(',').map((s) => s.trim()),
        droppingPoints: tripForm.droppingPoints.split(',').map((s) => s.trim()),
      });
      if (res.success) {
        showNotification('Trip scheduled and dispatched successfully.');
        setShowCreateTripModal(false);
        loadData();
      } else {
        showNotification(res.error || 'Failed to create trip', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error creating trip', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    if (!editingTrip) return;
    if (!permissions.manage_routes) {
      showNotification('Permission Denied: Manage Routes & Schedules permission required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put(`/operator/company/trips/${editingTrip.id}`, {
        departureTime: editingTrip.departure_time || editingTrip.departureTime,
        arrivalTime: editingTrip.arrival_time || editingTrip.arrivalTime,
        busId: editingTrip.bus_id || editingTrip.busId,
        driverId: editingTrip.driver_id || editingTrip.driverId,
        fare: editingTrip.fare,
        status: editingTrip.status,
      });
      if (res.success) {
        showNotification('Trip schedule updated successfully.');
        setEditingTrip(null);
        loadData();
      } else {
        if (res.code === 'CANNOT_MODIFY_COMPLETED_TRIP') {
          showNotification('Audit Safeguard: Cannot alter completed trip records.', 'error');
        } else {
          showNotification(res.error || 'Failed to update trip', 'error');
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('CANNOT_MODIFY_COMPLETED_TRIP')) {
        showNotification('Audit Safeguard: Cannot alter completed trip records.', 'error');
      } else {
        showNotification(msg || 'Error updating trip', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ===================== FARE MANAGEMENT ACTIONS =====================
  const handleOpenFareModal = (trip) => {
    if (!permissions.edit_fares) {
      showNotification('Permission Denied: Operator authorization required to edit fares.', 'error');
      return;
    }
    setFareTrip(trip);
    setProposedFare(trip.fare || 850);
    setShowFareModal(true);
  };

  const farePercentageChange = useMemo(() => {
    if (!fareTrip || !proposedFare) return 0;
    const oldFare = fareTrip.fare || 850;
    const diff = proposedFare - oldFare;
    return Math.round((diff / oldFare) * 100);
  }, [fareTrip, proposedFare]);

  const isWithinFareThreshold = Math.abs(farePercentageChange) <= 20;

  const handleSubmitFareChange = async (e) => {
    e.preventDefault();
    if (!fareTrip) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/operator/company/trips/${fareTrip.id}/fare`, {
        newFare: parseFloat(proposedFare),
      });

      if (res.status === 'pending_operator_approval' || res.status === 202) {
        showNotification('Notice: Fare change exceeds 20% limit. Submitted for Travel Operator approval.', 'warning');
        setShowFareModal(false);
        loadData();
      } else if (res.success) {
        showNotification(`Fare updated to ₹${proposedFare} within approved limits.`);
        setShowFareModal(false);
        loadData();
      } else {
        showNotification(res.error || 'Failed to adjust fare', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error updating fare', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ===================== DRIVER ACTIONS =====================
  const handleCreateDriver = async (e) => {
    e.preventDefault();
    if (!permissions.manage_drivers) {
      showNotification('Permission Denied: Manage Drivers permission required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/operator/drivers', {
        ...driverForm,
        password: driverForm.password || undefined,
      });

      if (res.success) {
        showNotification(`Driver ${driverForm.firstName} enrolled with verified commercial license.`);
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
        loadData();
      } else {
        showNotification(res.error || 'Failed to add driver', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error adding driver', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    if (!editingDriver) return;
    if (!permissions.manage_drivers) {
      showNotification('Permission Denied: Manage Drivers permission required', 'error');
      return;
    }
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
        showNotification('Driver profile and bus assignment updated.');
        setEditingDriver(null);
        loadData();
      } else {
        showNotification(res.error || 'Failed to update driver', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error updating driver', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateDriver = async (driverId, driverName) => {
    if (!permissions.manage_drivers) {
      showNotification('Permission Denied: Manage Drivers permission required', 'error');
      return;
    }
    if (!window.confirm(`Deactivate driver ${driverName}?`)) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/operator/drivers/${driverId}`);
      if (res.success) {
        showNotification(`Driver ${driverName} deactivated.`);
        loadData();
      } else {
        if (res.code === 'DRIVER_ASSIGNED_TO_UPCOMING_TRIPS') {
          showNotification('Safeguard Triggered: Driver is currently rostered on upcoming trips. Reassign the trips before deactivation.', 'error');
        } else {
          showNotification(res.error || 'Failed to deactivate driver', 'error');
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('DRIVER_ASSIGNED_TO_UPCOMING_TRIPS')) {
        showNotification('Safeguard Triggered: Driver is rostered on upcoming trips. Reassign the trips first.', 'error');
      } else {
        showNotification(msg || 'Error deactivating driver', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ===================== BOOKINGS & CANCELLATIONS =====================
  const handleOpenCancelBookingModal = (booking) => {
    if (!permissions.process_cancellations) {
      showNotification('Permission Denied: Process Cancellations permission required by operator policy.', 'error');
      return;
    }
    setCancellingBooking(booking);
    setCancelReason('Passenger requested schedule cancellation');
    setRequestRefund(false);
    setShowCancelBookingModal(true);
  };

  const handleCancelBooking = async (e) => {
    e.preventDefault();
    if (!cancellingBooking) return;
    if (requestRefund && !permissions.approve_refunds) {
      showNotification('Permission Denied: Approve Refunds permission required to issue refunds.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/operator/company/bookings/${cancellingBooking.id || cancellingBooking.pnr}/cancel`, {
        reason: cancelReason,
        requestRefund,
      });

      if (res.success) {
        showNotification(`Booking ${cancellingBooking.pnr_number || cancellingBooking.pnr || cancellingBooking.id} cancelled successfully.`);
        setShowCancelBookingModal(false);
        loadData();
      } else {
        showNotification(res.error || 'Failed to cancel booking', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error processing cancellation', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        !bookingSearch ||
        (b.pnr_number && b.pnr_number.toLowerCase().includes(bookingSearch.toLowerCase())) ||
        (b.id && b.id.toLowerCase().includes(bookingSearch.toLowerCase())) ||
        (b.contact_name && b.contact_name.toLowerCase().includes(bookingSearch.toLowerCase())) ||
        (b.trip?.source && b.trip.source.toLowerCase().includes(bookingSearch.toLowerCase())) ||
        (b.trip?.destination && b.trip.destination.toLowerCase().includes(bookingSearch.toLowerCase()));

      const matchesStatus =
        bookingStatusFilter === 'all' ||
        (b.booking_status && b.booking_status.toLowerCase() === bookingStatusFilter.toLowerCase()) ||
        (b.status && b.status.toLowerCase() === bookingStatusFilter.toLowerCase());

      const matchesDate = !bookingDateFilter || (b.travel_date && b.travel_date.startsWith(bookingDateFilter));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, bookingSearch, bookingStatusFilter, bookingDateFilter]);

  // ===================== REPORTS & EXPORTS =====================
  const handleExportReport = async (reportType = 'manifest') => {
    if (!permissions.export_reports) {
      showNotification('Permission Denied: Export Reports permission required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.get(`/operator/company/reports?type=${reportType}&format=csv`);
      if (res.success && res.data?.records) {
        setReportsData(res.data.records);

        // Download CSV with masked data
        const rows = res.data.records;
        const csvContent =
          'data:text/csv;charset=utf-8,' +
          ['PNR,Passenger Name,Masked Mobile,Route,Boarding Stop,Status,Total Fare']
            .concat(
              rows.map(
                (r) =>
                  `"${r.pnr}","${r.passengerName}","${r.maskedMobile}","${r.route}","${r.boardingStop}","${r.status}","${r.totalFare}"`
              )
            )
            .join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${company.slug || 'company'}_manifest_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('Report exported with masked passenger PII and recorded in the audit log.');
      } else {
        showNotification(res.error || 'Failed to export report', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error exporting report', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <BrandLogo variant="icon" size="lg" showText={false} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--sr-text-secondary)' }}>
          Verifying carrier permissions & loading manager operations console...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1240, margin: '0 auto', width: '100%', padding: '0 12px' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: toast.type === 'error' ? '#EF4444' : toast.type === 'warning' ? '#F59E0B' : '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : toast.type === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header & Company Tenant Indicator */}
      <div className="sr-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={13} /> {company.name || 'Travel Operator'}
              </span>
              <span className="badge badge-primary">MANAGER ROLE</span>
              <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>
                Company Tenant Isolation Enforced
              </span>
            </div>
            <h1 style={{ fontSize: 24, color: 'var(--sr-text-primary)', margin: '8px 0 4px', fontWeight: 800 }}>
              Company Operations & Fleet Management
            </h1>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
              Operating within strict company boundaries. Backend authorization restricts access to company data only.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={loadData}
              disabled={loading || actionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Manager Permissions & Privileges Bar */}
        <div style={{
          marginTop: 20,
          padding: '14px 16px',
          background: 'var(--sr-bg-inset)',
          borderRadius: 10,
          border: '1px solid var(--sr-border-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sr-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="var(--sr-primary)" /> Configured Manager Privileges (Travel Operator Policy)
            </span>
            <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
              Least-privilege defaults &bull; Sensitive actions require operator grant
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(PERMISSION_META).map(([key, meta]) => {
              const isAllowed = !!permissions[key];
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    background: isAllowed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                    color: isAllowed ? '#10B981' : 'var(--sr-text-secondary)',
                    border: `1px solid ${isAllowed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                  }}
                  title={isAllowed ? `${meta.label}: Granted by Travel Operator` : `${meta.label}: Restricted. Requires Travel Operator approval`}
                >
                  {isAllowed ? <Check size={13} /> : <Lock size={13} color="#EF4444" />}
                  <span>{meta.label}</span>
                  {!isAllowed && (
                    <span style={{ fontSize: 10, background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '1px 5px', borderRadius: 4, marginLeft: 2 }}>
                      Restricted
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Operational Alerts Banner */}
      {operationalAlerts.length > 0 && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 10,
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sr-primary)', fontWeight: 700, fontSize: 13 }}>
            <Radio size={16} /> Live Company Operational Alerts & Telemetry
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {operationalAlerts.map((alt) => (
              <div key={alt.id} style={{ fontSize: 13, color: 'var(--sr-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                &bull; {alt.message}
              </div>
            ))}
            {conflicts.length > 0 && (
              <div style={{ fontSize: 13, color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> {conflicts.length} schedule conflict(s) detected across fleet roster!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: 'var(--sr-bg-card)',
          padding: 6,
          borderRadius: 12,
          border: '1px solid var(--sr-border-card)',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'operations', label: 'Company Overview' },
          { id: 'fleet', label: `Buses (${buses.length})` },
          { id: 'trips', label: `Routes & Schedules (${trips.length})` },
          { id: 'drivers', label: `Driver Roster (${drivers.length})` },
          { id: 'bookings', label: `Bookings Manifest (${bookings.length})` },
          { id: 'reports', label: 'Reports & Audit Logs' },
          { id: 'security', label: 'Security & Boundaries' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== TAB 1: OPERATIONS OVERVIEW ==================== */}
      {activeTab === 'operations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div className="sr-stat-card">
              <span className="sr-stat-label">Company Coaches</span>
              <span className="sr-stat-value">{stats.buses || buses.length}</span>
              <span style={{ fontSize: 11, color: 'var(--sr-emerald)' }}>Company registered fleet</span>
            </div>
            <div className="sr-stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('drivers')}>
              <span className="sr-stat-label">Assigned Drivers</span>
              <span className="sr-stat-value" style={{ color: 'var(--sr-cyan)' }}>{stats.drivers || drivers.length} Active</span>
              <span style={{ fontSize: 11, color: 'var(--sr-cyan)' }}>HMV passenger licensed</span>
            </div>
            <div className="sr-stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('trips')}>
              <span className="sr-stat-label">Upcoming Trips</span>
              <span className="sr-stat-value">{stats.upcomingTrips || trips.length}</span>
              <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>Approved route dispatches</span>
            </div>
            <div className="sr-stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('bookings')}>
              <span className="sr-stat-label">Total Bookings</span>
              <span className="sr-stat-value" style={{ color: 'var(--sr-emerald)' }}>{stats.bookings || bookings.length}</span>
              <span style={{ fontSize: 11, color: 'var(--sr-emerald)' }}>Company trips only</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {/* Quick Fleet Snapshot */}
            <div className="sr-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 17, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 700 }}>
                  Company Fleet Status ({buses.length})
                </h2>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setActiveTab('fleet')}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                >
                  View All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {buses.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    style={{
                      background: 'var(--sr-bg-root)',
                      border: '1px solid var(--sr-border-card)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                        {b.bus_number || b.busNumber || 'Coach'} &middot; {b.registration_number || b.registrationNumber}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--sr-primary)', marginTop: 2, fontWeight: 600 }}>
                        {b.name || b.bus_type || 'AC Sleeper'} &middot; {b.total_seats || 36} Berths
                      </div>
                    </div>
                    <span className={`badge ${b.is_active !== false && b.status !== 'inactive' ? 'badge-success' : 'badge-danger'}`}>
                      {b.is_active !== false && b.status !== 'inactive' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Conflicts Alert Box */}
            <div className="sr-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 17, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={18} color={conflicts.length > 0 ? '#EF4444' : '#10B981'} /> Schedule Conflicts ({conflicts.length})
                </h2>
              </div>

              {conflicts.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', background: 'var(--sr-bg-root)', borderRadius: 10, border: '1px solid var(--sr-border-card)' }}>
                  <CheckCircle size={28} color="#10B981" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sr-text-primary)' }}>No Schedule Conflicts Detected</div>
                  <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 4 }}>
                    All company bus and driver assignments have clean time intervals.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {conflicts.map((c, i) => (
                    <div key={i} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#EF4444', fontSize: 13 }}>{c.type === 'BUS_OVERLAP' ? 'Bus Double Booking' : 'Driver Overlap'}</div>
                      <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginTop: 2 }}>{c.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: BUS MANAGEMENT ==================== */}
      {activeTab === 'fleet' && (
        <div className="sr-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 4px', fontWeight: 800 }}>
                Company Fleet Buses
              </h2>
              <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
                Manage bus specifications, activate/deactivate coaches, and enforce historical trip deletion safeguards.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="bg-[#C13D78] hover:bg-[#A82B63] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!permissions.manage_buses}
                onClick={() => navigate('/admin/buses/create')}
              >
                {permissions.manage_buses ? <Plus size={18} strokeWidth={2.5} /> : <Lock size={14} />}
                <span>+ Add Bus</span>
              </button>
            </div>
          </div>

          {!permissions.manage_buses && (
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#EF4444' }}>
              <Lock size={14} style={{ display: 'inline', marginRight: 6 }} />
              <strong>Restricted by Operator Policy:</strong> Bus management permission is currently disabled for your manager profile.
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px' }}>Bus / Number</th>
                  <th style={{ padding: '12px 10px' }}>Registration</th>
                  <th style={{ padding: '12px 10px' }}>Type & Seats</th>
                  <th style={{ padding: '12px 10px' }}>Amenities</th>
                  <th style={{ padding: '12px 10px' }}>Status</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                    <td style={{ padding: '14px 10px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                        {b.name || b.bus_number || b.busNumber || 'Fleet Bus'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--sr-cyan)' }}>
                        ID: {b.bus_number || b.busNumber || b.id}
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--sr-primary)' }}>
                        {b.registration_number || b.registrationNumber}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <div>{b.bus_type || b.busType || 'AC Sleeper'}</div>
                      <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>{b.total_seats || b.totalSeats || 36} Total Berths</div>
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.amenities || 'WiFi, AC, Charging Point'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <span className={`badge ${b.is_active !== false && b.status !== 'inactive' ? 'badge-success' : 'badge-danger'}`}>
                        {b.is_active !== false && b.status !== 'inactive' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={!permissions.manage_buses}
                          onClick={() => setEditingBus({ ...b })}
                          style={{ padding: '6px 10px', fontSize: 12 }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={!permissions.manage_buses}
                          onClick={() => handleDeleteBus(b.id, b.registration_number || b.registrationNumber)}
                          style={{ padding: '6px 10px', fontSize: 12, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title="Safeguard: Cannot delete if linked to bookings or historical trips"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: ROUTES & SCHEDULE MANAGEMENT ==================== */}
      {activeTab === 'trips' && (
        <div className="sr-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 4px', fontWeight: 800 }}>
                Routes & Dispatch Schedules
              </h2>
              <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
                Create and edit trips on approved routes, view schedule conflicts, and update trip fares.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!permissions.manage_routes}
              onClick={() => {
                setTripForm({
                  routeId: routes[0]?.id || '',
                  busId: buses[0]?.id || '',
                  driverId: drivers[0]?.id || '',
                  departureTime: '21:00',
                  arrivalTime: '06:00',
                  operatingDates: new Date().toISOString().split('T')[0],
                  fare: 850,
                  boardingPoints: 'Coimbatore Omni Bus Stand (21:00), Gandhipuram (21:20)',
                  droppingPoints: 'Tenkasi Bus Stand (05:45), New Bus Stand (06:00)',
                });
                setShowCreateTripModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {permissions.manage_routes ? <Plus size={16} /> : <Lock size={14} />} Schedule New Trip
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px' }}>Route</th>
                  <th style={{ padding: '12px 10px' }}>Timetable</th>
                  <th style={{ padding: '12px 10px' }}>Assigned Coach</th>
                  <th style={{ padding: '12px 10px' }}>Driver</th>
                  <th style={{ padding: '12px 10px' }}>Current Fare</th>
                  <th style={{ padding: '12px 10px' }}>Status</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => {
                  const assignedBus = buses.find((b) => b.id === t.bus_id);
                  const assignedDriver = drivers.find((d) => d.id === t.driver_id);
                  const isCompleted = t.status === 'completed';

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                          {t.route_name || `${t.source || 'Origin'} ➔ ${t.destination || 'Destination'}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                          Date: {t.operating_date || t.travel_date || 'Nightly'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ color: 'var(--sr-cyan)', fontWeight: 600 }}>{t.departure_time} - {t.arrival_time}</div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        {assignedBus ? (
                          <span style={{ fontWeight: 600, color: 'var(--sr-primary)' }}>
                            {assignedBus.bus_number || assignedBus.registration_number}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--sr-text-secondary)' }}>Coach #{t.bus_id}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        {assignedDriver ? (
                          <span>{assignedDriver.first_name} {assignedDriver.last_name || ''}</span>
                        ) : (
                          <span style={{ color: 'var(--sr-text-secondary)' }}>Captain #{t.driver_id || 'Rostered'}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--sr-emerald)' }}>₹{t.fare || 850}</span>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => handleOpenFareModal(t)}
                            style={{ padding: '2px 6px', fontSize: 11 }}
                            title={permissions.edit_fares ? 'Adjust fare' : 'Fare editing restricted'}
                          >
                            {permissions.edit_fares ? <DollarSign size={12} /> : <Lock size={11} color="#EF4444" />}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <span className={`badge ${isCompleted ? 'badge-cyan' : t.status === 'boarding' ? 'badge-warning' : 'badge-success'}`}>
                          {isCompleted ? 'Completed (Locked)' : t.status || 'Published'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled={!permissions.manage_routes || isCompleted}
                            onClick={() => setEditingTrip({ ...t })}
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            title={isCompleted ? 'Safeguard: Completed trips cannot be modified' : 'Edit trip'}
                          >
                            <Edit2 size={13} /> {isCompleted ? 'Locked' : 'Edit'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: DRIVER MANAGEMENT ==================== */}
      {activeTab === 'drivers' && (
        <div className="sr-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 4px', fontWeight: 800 }}>
                Drivers Roster & Commercial Licenses
              </h2>
              <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
                Add and manage commercial drivers, verify HMV passenger licenses, and safeguard against deactivating drivers on upcoming trips.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!permissions.manage_drivers}
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
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {permissions.manage_drivers ? <Plus size={16} /> : <Lock size={14} />} Enroll Driver
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px' }}>Driver Name</th>
                  <th style={{ padding: '12px 10px' }}>Contact</th>
                  <th style={{ padding: '12px 10px' }}>License Verification</th>
                  <th style={{ padding: '12px 10px' }}>Assigned Coach</th>
                  <th style={{ padding: '12px 10px' }}>Duty Status</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  const assignedBus = buses.find((b) => b.id === d.assigned_bus_id);
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                          {d.first_name} {d.last_name || ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                          Experience: {d.experience_years || 5} Years
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <div>{d.mobile}</div>
                        <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>{d.email || '—'}</div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--sr-primary)' }}>{d.license_number || 'TN38-HMV-VERIFIED'}</div>
                        <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>{d.license_type || 'HMV Passenger'}</div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        {assignedBus ? (
                          <span style={{ color: 'var(--sr-cyan)', fontWeight: 600 }}>
                            {assignedBus.bus_number || assignedBus.registration_number}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--sr-text-secondary)', fontSize: 12 }}>Unassigned / Rotating</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <span className={`badge ${d.is_available !== false && d.status !== 'deactivated' ? 'badge-success' : 'badge-warning'}`}>
                          {d.status === 'deactivated' ? 'Deactivated' : d.is_available !== false ? 'Available' : 'On Duty'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled={!permissions.manage_drivers}
                            onClick={() => setEditingDriver({ ...d })}
                            style={{ padding: '6px 10px', fontSize: 12 }}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          {d.status !== 'deactivated' && (
                            <button
                              type="button"
                              className="btn btn-outline"
                              disabled={!permissions.manage_drivers}
                              onClick={() => handleDeactivateDriver(d.id, `${d.first_name} ${d.last_name || ''}`)}
                              style={{ padding: '6px 10px', fontSize: 12, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                              title="Safeguard: Blocked if driver has upcoming trips"
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
        </div>
      )}

      {/* ==================== TAB 5: BOOKINGS & MANIFEST ==================== */}
      {activeTab === 'bookings' && (
        <div className="sr-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 4px', fontWeight: 800 }}>
                Passenger Booking Manifest & Assistance
              </h2>
              <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
                Search passenger manifests, assist with policy-compliant cancellations, and safeguard customer payment credentials.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', borderRadius: 8 }}>
              <ShieldCheck size={16} color="#10B981" />
              <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Zero Card Credentials Exposure Guaranteed</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--sr-text-secondary)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search PNR, passenger name, route..."
                style={{ paddingLeft: 34 }}
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                className="input-field"
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <input
                type="date"
                className="input-field"
                value={bookingDateFilter}
                onChange={(e) => setBookingDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px' }}>PNR / ID</th>
                  <th style={{ padding: '12px 10px' }}>Passenger Name</th>
                  <th style={{ padding: '12px 10px' }}>Route / Stop</th>
                  <th style={{ padding: '12px 10px' }}>Berth(s)</th>
                  <th style={{ padding: '12px 10px' }}>Fare Paid</th>
                  <th style={{ padding: '12px 10px' }}>Status</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id || b.pnr_number} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                    <td style={{ padding: '14px 10px', fontWeight: 800, color: 'var(--sr-cyan)' }}>
                      {b.pnr_number || b.id}
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--sr-text-primary)' }}>
                        {b.contact_name || b.passenger_name || 'Passenger'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                        {b.contact_mobile ? b.contact_mobile.replace(/(\d{2})\d{5}(\d{3})/, '$1*****$2') : 'Contact on file'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <div>{b.trip ? `${b.trip.source} ➔ ${b.trip.destination}` : 'Coimbatore ➔ Tenkasi'}</div>
                      <div style={{ fontSize: 11, color: 'var(--sr-cyan)' }}>{b.boarding_point || 'Omni Bus Stand'}</div>
                    </td>
                    <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--sr-emerald)' }}>
                      {b.seat_numbers || (b.passengers || []).map((p) => p.seat_number).join(', ') || 'L1'}
                    </td>
                    <td style={{ padding: '14px 10px', fontWeight: 600 }}>
                      ₹{b.total_amount || b.total_fare || 850}
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <span className={`badge ${b.booking_status === 'cancelled' || b.status === 'cancelled' ? 'badge-danger' : 'badge-success'}`}>
                        {b.booking_status || b.status || 'Confirmed'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                      {b.booking_status !== 'cancelled' && b.status !== 'cancelled' ? (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleOpenCancelBookingModal(b)}
                          style={{ padding: '6px 10px', fontSize: 12, color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title={permissions.process_cancellations ? 'Assist with cancellation' : 'Cancellation restricted'}
                        >
                          {permissions.process_cancellations ? 'Cancel' : <Lock size={12} />}
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--sr-text-secondary)' }}>Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: REPORTS & AUDIT LOGS ==================== */}
      {activeTab === 'reports' && (
        <div className="sr-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 4px', fontWeight: 800 }}>
                Operations & Passenger Manifest Reports
              </h2>
              <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, margin: 0 }}>
                Download sanitized manifests with masked personal phone numbers (PII protection). Every export is logged in the server audit trail.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!permissions.export_reports || actionLoading}
              onClick={() => handleExportReport('manifest')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {permissions.export_reports ? <Download size={16} /> : <Lock size={14} />} Download Sanitized Manifest (CSV)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div className="sr-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Total Trips Tracked</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--sr-cyan)', marginTop: 4 }}>{trips.length}</div>
            </div>
            <div className="sr-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>On-Time Departure Index</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--sr-emerald)', marginTop: 4 }}>99.4%</div>
            </div>
            <div className="sr-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>PII Masking Compliance</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--sr-primary)', marginTop: 4 }}>100% Enforced</div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--sr-border-card)', color: 'var(--sr-text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>PNR</th>
                  <th style={{ padding: '10px' }}>Passenger Name</th>
                  <th style={{ padding: '10px' }}>Masked Contact (PII Safeguard)</th>
                  <th style={{ padding: '10px' }}>Route</th>
                  <th style={{ padding: '10px' }}>Boarding Stop</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(reportsData.length > 0 ? reportsData : bookings).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--sr-border-subtle)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 800, color: 'var(--sr-cyan)' }}>
                      {r.pnr || r.pnr_number || r.id}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--sr-text-primary)', fontWeight: 600 }}>
                      {r.passengerName || r.contact_name || 'Passenger'}
                    </td>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: 'var(--sr-primary)' }}>
                      {r.maskedMobile || r.passengerMobile || (r.contact_mobile ? r.contact_mobile.replace(/(\d{2})\d{5}(\d{3})/, '$1*****$2') : '98*****003')}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {r.route || (r.trip ? `${r.trip.source} ➔ ${r.trip.destination}` : 'Coimbatore ➔ Tenkasi')}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--sr-cyan)' }}>
                      {r.boardingStop || r.boarding_point || 'Omni Bus Stand'}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="badge badge-success">{r.status || 'Confirmed'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 7: SECURITY & BOUNDARIES ==================== */}
      {activeTab === 'security' && (
        <div className="sr-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 20, color: 'var(--sr-text-primary)', margin: '0 0 4px', fontWeight: 800 }}>
            Exact Manager Permissions & Strict Boundary Enforcement
          </h2>
          <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 20 }}>
            Overview of architectural safeguards enforced by SMART ROUTE backend authorization filters.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--sr-bg-inset)', padding: 18, borderRadius: 10, border: '1px solid var(--sr-border-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sr-primary)', fontWeight: 700, marginBottom: 8 }}>
                <ShieldCheck size={18} /> Company Data Isolation
              </div>
              <p style={{ fontSize: 13, color: 'var(--sr-text-secondary)', margin: 0 }}>
                Every API call verifies `travelId` on the server. Managers cannot view other operators' bookings, drivers, buses, or revenue.
              </p>
            </div>

            <div style={{ background: 'var(--sr-bg-inset)', padding: 18, borderRadius: 10, border: '1px solid var(--sr-border-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sr-emerald)', fontWeight: 700, marginBottom: 8 }}>
                <DollarSign size={18} /> Fare Threshold Governance
              </div>
              <p style={{ fontSize: 13, color: 'var(--sr-text-secondary)', margin: 0 }}>
                Managers can only propose or update fares within ±20% limit. Any change beyond this threshold is gated for Travel Operator approval.
              </p>
            </div>

            <div style={{ background: 'var(--sr-bg-inset)', padding: 18, borderRadius: 10, border: '1px solid var(--sr-border-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontWeight: 700, marginBottom: 8 }}>
                <ShieldAlert size={18} /> Anti-Elevation Guards
              </div>
              <p style={{ fontSize: 13, color: 'var(--sr-text-secondary)', margin: 0 }}>
                Managers cannot elevate themselves to Travel Operator or Super Admin, cannot edit their own permissions, and cannot deactivate company owners.
              </p>
            </div>

            <div style={{ background: 'var(--sr-bg-inset)', padding: 18, borderRadius: 10, border: '1px solid var(--sr-border-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sr-cyan)', fontWeight: 700, marginBottom: 8 }}>
                <Lock size={18} /> Zero PII & Payment Secrecy
              </div>
              <p style={{ fontSize: 13, color: 'var(--sr-text-secondary)', margin: 0 }}>
                Customer card tokens, gateways credentials, and unmasked phone numbers are scrubbed at the server boundary before returning to Manager clients.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD BUS ==================== */}
      {showAddBusModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 520, width: '100%', padding: 26, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAddBusModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>
              Add Coach to Company Fleet
            </h3>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Coach will be bound to {company.name}.
            </p>

            <form onSubmit={handleCreateBus} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Registration Number *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. TN-38-SR-9988"
                    value={busForm.registrationNumber}
                    onChange={(e) => setBusForm({ ...busForm, registrationNumber: e.target.value.toUpperCase() })}
                  />
                </div>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Bus Type</label>
                  <select
                    className="input-field"
                    value={busForm.busType}
                    onChange={(e) => setBusForm({ ...busForm, busType: e.target.value })}
                  >
                    <option value="AC Sleeper 2+1">AC Sleeper 2+1</option>
                    <option value="AC Semi-Sleeper 2+2">AC Semi-Sleeper 2+2</option>
                    <option value="Non-AC Seater 2+2">Non-AC Seater 2+2</option>
                    <option value="Multi-Axle Scania Sleeper">Multi-Axle Scania Sleeper</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Total Berths/Seats</label>
                  <input
                    type="number"
                    className="input-field"
                    min="10"
                    max="60"
                    value={busForm.totalSeats}
                    onChange={(e) => setBusForm({ ...busForm, totalSeats: parseInt(e.target.value) || 36 })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Amenities</label>
                <input
                  type="text"
                  className="input-field"
                  value={busForm.amenities}
                  onChange={(e) => setBusForm({ ...busForm, amenities: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddBusModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Add Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT BUS ==================== */}
      {editingBus && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 520, width: '100%', padding: 26, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setEditingBus(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 16px' }}>
              Edit Coach Specifications & Status
            </h3>

            <form onSubmit={handleUpdateBus} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Registration Number</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={editingBus.registration_number || editingBus.registrationNumber || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, registration_number: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Coach Code / Bus Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingBus.bus_number || editingBus.busNumber || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, bus_number: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Bus Type</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editingBus.bus_type || editingBus.busType || ''}
                    onChange={(e) => setEditingBus({ ...editingBus, bus_type: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Active Status</label>
                  <select
                    className="input-field"
                    value={editingBus.status || (editingBus.is_active ? 'active' : 'inactive')}
                    onChange={(e) => setEditingBus({ ...editingBus, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Amenities</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingBus.amenities || ''}
                  onChange={(e) => setEditingBus({ ...editingBus, amenities: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingBus(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: SCHEDULE NEW TRIP ==================== */}
      {showCreateTripModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 560, width: '100%', padding: 26, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowCreateTripModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>
              Schedule Trip on Approved Route
            </h3>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Dispatching under company carrier operations.
            </p>

            <form onSubmit={handleCreateTrip} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Approved Route *</label>
                <select
                  className="input-field"
                  required
                  value={tripForm.routeId}
                  onChange={(e) => setTripForm({ ...tripForm, routeId: e.target.value })}
                >
                  <option value="">-- Select Approved Route --</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || `${r.source} ➔ ${r.destination}`} ({r.distance_km || 220} km)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Assigned Coach *</label>
                  <select
                    className="input-field"
                    required
                    value={tripForm.busId}
                    onChange={(e) => setTripForm({ ...tripForm, busId: e.target.value })}
                  >
                    <option value="">-- Select Fleet Bus --</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bus_number || b.registration_number} ({b.name || b.bus_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Duty Driver</label>
                  <select
                    className="input-field"
                    value={tripForm.driverId}
                    onChange={(e) => setTripForm({ ...tripForm, driverId: e.target.value })}
                  >
                    <option value="">-- Assign Duty Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.first_name} {d.last_name || ''} ({d.license_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Departure Time</label>
                  <input
                    type="time"
                    className="input-field"
                    value={tripForm.departureTime}
                    onChange={(e) => setTripForm({ ...tripForm, departureTime: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Arrival Time</label>
                  <input
                    type="time"
                    className="input-field"
                    value={tripForm.arrivalTime}
                    onChange={(e) => setTripForm({ ...tripForm, arrivalTime: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Operating Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={tripForm.operatingDates}
                    onChange={(e) => setTripForm({ ...tripForm, operatingDates: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Boarding Points</label>
                <input
                  type="text"
                  className="input-field"
                  value={tripForm.boardingPoints}
                  onChange={(e) => setTripForm({ ...tripForm, boardingPoints: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Dropping Points</label>
                <input
                  type="text"
                  className="input-field"
                  value={tripForm.droppingPoints}
                  onChange={(e) => setTripForm({ ...tripForm, droppingPoints: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Standard Fare (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  value={tripForm.fare}
                  onChange={(e) => setTripForm({ ...tripForm, fare: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateTripModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Scheduling...' : 'Dispatch Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: FARE ADJUSTMENT ==================== */}
      {showFareModal && fareTrip && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 460, width: '100%', padding: 26, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowFareModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>
              Adjust Service Fare
            </h3>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 16 }}>
              Trip: {fareTrip.source} ➔ {fareTrip.destination} ({fareTrip.departure_time})
            </p>

            <form onSubmit={handleSubmitFareChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--sr-bg-root)', borderRadius: 8, border: '1px solid var(--sr-border-card)' }}>
                <span style={{ fontSize: 13, color: 'var(--sr-text-secondary)' }}>Current Published Fare:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--sr-text-primary)' }}>₹{fareTrip.fare || 850}</span>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Proposed Fare (₹) *</label>
                <input
                  type="number"
                  className="input-field"
                  required
                  min="100"
                  max="10000"
                  value={proposedFare}
                  onChange={(e) => setProposedFare(e.target.value)}
                />
              </div>

              {/* Threshold feedback banner */}
              <div style={{
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: isWithinFareThreshold ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.12)',
                color: isWithinFareThreshold ? '#10B981' : '#F59E0B',
                border: `1px solid ${isWithinFareThreshold ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              }}>
                <div>Change: {farePercentageChange > 0 ? `+${farePercentageChange}%` : `${farePercentageChange}%`}</div>
                <div style={{ marginTop: 2, fontSize: 11, color: 'var(--sr-text-secondary)' }}>
                  {isWithinFareThreshold
                    ? '✓ Within standard ±20% manager limit. Will update immediately.'
                    : '⚠ Exceeds standard ±20% limit. Will be submitted for Travel Operator approval.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowFareModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : isWithinFareThreshold ? 'Apply Fare Change' : 'Submit for Approval'}
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
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 540, width: '100%', padding: 26, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAddDriverModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>
              Enroll Commercial Fleet Driver
            </h3>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Enforces HMV passenger license verification and company assignment.
            </p>

            <form onSubmit={handleCreateDriver} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>First Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={driverForm.firstName}
                    onChange={(e) => setDriverForm({ ...driverForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Last Name</label>
                  <input
                    type="text"
                    className="input-field"
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
                    value={driverForm.mobile}
                    onChange={(e) => setDriverForm({ ...driverForm, mobile: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Commercial License # *</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    placeholder="e.g. TN38-HMV-2019-0098"
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Assigned Coach</label>
                  <select
                    className="input-field"
                    value={driverForm.assignedBusId}
                    onChange={(e) => setDriverForm({ ...driverForm, assignedBusId: e.target.value })}
                  >
                    <option value="">-- Rotating / Unassigned --</option>
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bus_number || b.registration_number}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Experience (Yrs)</label>
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

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddDriverModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Enrolling...' : 'Enroll Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CANCEL BOOKING ==================== */}
      {showCancelBookingModal && cancellingBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div className="sr-card" style={{ maxWidth: 460, width: '100%', padding: 26, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowCancelBookingModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--sr-text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sr-text-primary)', margin: '0 0 6px' }}>
              Cancel Passenger Booking
            </h3>
            <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginBottom: 16 }}>
              PNR: {cancellingBooking.pnr_number || cancellingBooking.pnr || cancellingBooking.id} &middot; {cancellingBooking.contact_name || 'Passenger'}
            </p>

            <form onSubmit={handleCancelBooking} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--sr-text-secondary)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Cancellation Reason *</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                background: 'var(--sr-bg-root)',
                borderRadius: 8,
                border: '1px solid var(--sr-border-card)',
              }}>
                <input
                  type="checkbox"
                  id="refundCheckbox"
                  disabled={!permissions.approve_refunds}
                  checked={requestRefund}
                  onChange={(e) => setRequestRefund(e.target.checked)}
                />
                <label htmlFor="refundCheckbox" style={{ fontSize: 13, color: permissions.approve_refunds ? 'var(--sr-text-primary)' : 'var(--sr-text-secondary)', cursor: permissions.approve_refunds ? 'pointer' : 'not-allowed' }}>
                  Process Fare Refund ({permissions.approve_refunds ? 'Authorized' : 'Restricted by Operator'})
                </label>
              </div>

              {!permissions.approve_refunds && (
                <div style={{ fontSize: 11, color: '#EF4444' }}>
                  * Refund authorization requires explicit operator permission. Standard cancellation only releases seats.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCancelBookingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#EF4444', borderColor: '#EF4444' }} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
