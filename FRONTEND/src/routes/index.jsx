import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Layouts
import MainLayout from '../layouts/MainLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';

// Passenger Pages
import LandingPage from '../pages/passenger/LandingPage.jsx';
import SearchTrips from '../pages/passenger/SearchTrips.jsx';
import OffersPage from '../pages/passenger/OffersPage.jsx';
import AboutPage from '../pages/passenger/AboutPage.jsx';
import ContactPage from '../pages/passenger/ContactPage.jsx';
import TripBooking from '../pages/passenger/TripBooking.jsx';
import SeatSelectionPage from '../pages/passenger/SeatSelectionPage.jsx';
import BookingSuccess from '../pages/passenger/BookingSuccess.jsx';
import TicketConfirmation from '../pages/passenger/TicketConfirmation.jsx';
import LiveTracking from '../pages/passenger/LiveTracking.jsx';
import MyBookings from '../pages/passenger/MyBookings.jsx';
import TransactionsPage from '../pages/passenger/TransactionsPage.jsx';
import PnrSearchPage from '../pages/passenger/PnrSearchPage.jsx';

// Auth Pages
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import OwnerRegister from '../pages/owner/OwnerRegister.jsx';

// Role Dashboards
import DriverDashboard from '../pages/driver/DriverDashboard.jsx';
import OwnerDashboard from '../pages/owner/OwnerDashboard.jsx';
import ManagerDashboard from '../pages/manager/ManagerDashboard.jsx';
import StaffDashboard from '../pages/staff/StaffDashboard.jsx';
import AdminDashboard from '../pages/superadmin/AdminDashboard.jsx';
import AddBusWizard from '../pages/admin/AddBusWizard.jsx';
import AdminFleetDashboard from '../pages/admin/AdminFleetDashboard.jsx';

// Accounting, Fleet Analytics & Passenger Ratings Pages
import AccountingDashboard from '../pages/accounting/AccountingDashboard.jsx';
import BusAccountingPage from '../pages/accounting/BusAccountingPage.jsx';
import RouteProfitabilityPage from '../pages/accounting/RouteProfitabilityPage.jsx';
import BusProfitabilityPage from '../pages/accounting/BusProfitabilityPage.jsx';
import ExpenseManagementPage from '../pages/accounting/ExpenseManagementPage.jsx';
import FuelManagementPage from '../pages/accounting/FuelManagementPage.jsx';
import PayrollPage from '../pages/accounting/PayrollPage.jsx';
import PassengerRatingsPage from '../pages/accounting/PassengerRatingsPage.jsx';
import ReportsPage from '../pages/accounting/ReportsPage.jsx';

const ALL_AUTHENTICATED_ROLES = ['passenger', 'super_admin', 'travel_owner', 'manager', 'driver', 'staff'];

/**
 * Route protection wrapper requiring authentication and authoritative role verification
 */
function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading, isLoading } = useAuth();
  const location = useLocation();
  const checking = typeof isLoading === 'boolean' ? isLoading : loading;

  // Only block render if auth state has not yet initialized and no stored session is active
  if (checking && !isAuthenticated && !user) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--sr-text-secondary)', fontSize: 14 }}>
        Verifying secure credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#FFF1F6',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h2 style={{ fontSize: 24, marginBottom: 8, color: '#24152D', fontWeight: 800 }}>
          403 Access Denied
        </h2>
        <p style={{ color: '#6E5D73', fontSize: 14, maxWidth: 480, lineHeight: 1.5, margin: 0 }}>
          Your verified account (role: <strong>{user?.role}</strong>) does not have authorization to access this operational portal. Cross-role access is blocked by RBAC security rules.
        </p>
        <button
          type="button"
          onClick={() => { window.location.href = '/search'; }}
          className="btn btn-primary"
          style={{ marginTop: 24, padding: '10px 24px' }}
        >
          Return to Bus Search
        </button>
      </div>
    );
  }

  return children;
}

/**
 * Passenger Entrypoint: Enforces mandatory login first, then dynamically routes privileged roles
 */
function PassengerHome() {
  const { user, isAuthenticated, loading, isLoading } = useAuth();
  const checking = typeof isLoading === 'boolean' ? isLoading : loading;

  if (checking && !isAuthenticated && !user) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--sr-text-secondary)', fontSize: 14 }}>
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect non-passenger roles to their verified operational portals
  if (user?.role === 'driver') return <Navigate to="/driver/dashboard" replace />;
  if (user?.role === 'travel_owner' || user?.role === 'manager') return <Navigate to="/operator/dashboard" replace />;
  if (user?.role === 'super_admin' || user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'staff') return <Navigate to="/staff" replace />;

  return <SearchTrips />;
}

/**
 * Operator Management Portal Dynamic Router (Travel Owner & Travel Manager)
 */
function OperatorDashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'manager') {
    return (
      <DashboardLayout title="Operator Management Portal" roleLabel="Operations Manager">
        <ManagerDashboard />
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout title="Operator Management Portal" roleLabel="Travel Owner">
      <OwnerDashboard />
    </DashboardLayout>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/owner/register" element={<OwnerRegister />} />

      {/* Passenger Portal (Public Landing & Results + Protected Bookings) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search-results" element={<SearchTrips />} />
        <Route path="/search" element={<PassengerHome />} />
        <Route path="/buses" element={<PassengerHome />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/book/:tripId" element={<SeatSelectionPage />} />
        <Route path="/select-seats/:tripId" element={<SeatSelectionPage />} />
        <Route
          path="/passenger-details"
          element={
            <ProtectedRoute allowedRoles={ALL_AUTHENTICATED_ROLES}>
              <TripBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-success/:pnr"
          element={
            <ProtectedRoute allowedRoles={ALL_AUTHENTICATED_ROLES}>
              <BookingSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ticket/:pnr"
          element={
            <ProtectedRoute allowedRoles={ALL_AUTHENTICATED_ROLES}>
              <TicketConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ticket-confirmation/:pnr"
          element={
            <ProtectedRoute allowedRoles={ALL_AUTHENTICATED_ROLES}>
              <TicketConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ticket-view/:pnr"
          element={
            <ProtectedRoute allowedRoles={ALL_AUTHENTICATED_ROLES}>
              <TicketConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/track"
          element={<LiveTracking />}
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute allowedRoles={ALL_AUTHENTICATED_ROLES}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute allowedRoles={ALL_AUTHENTICATED_ROLES}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={ALL_AUTHENTICATED_ROLES}>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pnr-search"
          element={<PnrSearchPage />}
        />
        <Route
          path="/pnr"
          element={<PnrSearchPage />}
        />
      </Route>

      {/* Driver Operational Portal */}
      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DashboardLayout title="Driver Operational Portal" roleLabel="Commercial Driver">
              <DriverDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />

      {/* Operator Management Portal (Travel Owner & Travel Manager) */}
      <Route
        path="/operator/dashboard"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <OperatorDashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route path="/owner" element={<Navigate to="/operator/dashboard" replace />} />
      <Route path="/manager" element={<Navigate to="/operator/dashboard" replace />} />

      {/* Platform Oversight Dashboard (Super Admin) */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Platform Oversight Dashboard" roleLabel="Super Admin / Founder">
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/superadmin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Admin Fleet Management & Add Bus Workflow */}
      <Route
        path="/admin/buses/create"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'travel_owner', 'manager']}>
            <DashboardLayout title="Fleet Management Portal" roleLabel="Fleet Operations">
              <AddBusWizard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/fleet"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'travel_owner', 'manager']}>
            <DashboardLayout title="Fleet Management Portal" roleLabel="Fleet Operations">
              <AdminFleetDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      {/* ======================== ACCOUNTING & FLEET ANALYTICS PORTALS ======================== */}
      {/* Super Admin / Platform Oversight Accounting Routes */}
      <Route
        path="/admin/accounting"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Platform Consolidated Accounting" roleLabel="Super Admin / Founder">
              <AccountingDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounting/buses"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Bus Accounts & Ledger" roleLabel="Super Admin / Founder">
              <BusAccountingPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounting/buses/:busId"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Individual Bus Account" roleLabel="Super Admin / Founder">
              <BusAccountingPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounting/routes"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Route Profitability Analysis" roleLabel="Super Admin / Founder">
              <RouteProfitabilityPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounting/rankings"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Bus Profitability Rankings" roleLabel="Super Admin / Founder">
              <BusProfitabilityPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounting/expenses"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Daily Operating Expenses" roleLabel="Super Admin / Founder">
              <ExpenseManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounting/fuel"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Diesel & Fuel Consumption" roleLabel="Super Admin / Founder">
              <FuelManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounting/payroll"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Crew & Staff Payroll" roleLabel="Super Admin / Founder">
              <PayrollPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounting/ratings"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Passenger Ratings & Feedback" roleLabel="Super Admin / Founder">
              <PassengerRatingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/accounting/reports"
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
            <DashboardLayout title="Financial & Fleet Reports" roleLabel="Super Admin / Founder">
              <ReportsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Operator (Travel Owner & Manager) Company Accounting Routes */}
      <Route
        path="/operator/accounting"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Company Financial & Fleet Ledger" roleLabel="Travel Operator">
              <AccountingDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/accounting/buses"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Bus Accounts & Ledger" roleLabel="Travel Operator">
              <BusAccountingPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/accounting/buses/:busId"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Individual Bus Account" roleLabel="Travel Operator">
              <BusAccountingPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/accounting/routes"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Route Profitability Analysis" roleLabel="Travel Operator">
              <RouteProfitabilityPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/accounting/rankings"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Bus Profitability Rankings" roleLabel="Travel Operator">
              <BusProfitabilityPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/accounting/expenses"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Daily Operating Expenses" roleLabel="Travel Operator">
              <ExpenseManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/accounting/fuel"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Diesel & Fuel Consumption" roleLabel="Travel Operator">
              <FuelManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/accounting/payroll"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Crew & Staff Payroll" roleLabel="Travel Operator">
              <PayrollPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/accounting/ratings"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Passenger Ratings & Feedback" roleLabel="Travel Operator">
              <PassengerRatingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/accounting/reports"
        element={
          <ProtectedRoute allowedRoles={['travel_owner', 'manager']}>
            <DashboardLayout title="Financial & Fleet Reports" roleLabel="Travel Operator">
              <ReportsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Staff Counter Booking Desk */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <DashboardLayout title="Counter Booking Desk" roleLabel="Staff Personnel">
              <StaffDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback - Redirects to / which redirects to /login if unauthenticated */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
