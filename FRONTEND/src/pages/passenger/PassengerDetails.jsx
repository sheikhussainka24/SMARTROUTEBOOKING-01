import React from 'react';
import { useLocation } from 'react-router-dom';
import TripBooking from './TripBooking.jsx';

/**
 * PassengerDetails (/passenger-details)
 * Lead engineer resilient wrapper resolving variable reference crashes
 */
export default function PassengerDetails(props) {
  const location = useLocation();
  const selectedBus = 
    location.state?.selectedBus || 
    location.state?.bus || 
    JSON.parse(sessionStorage.getItem('smartroute_active_bus') || '{}');

  // Ensure selectedBus is never undefined:
  if (!selectedBus || !selectedBus.id) {
    // If user accessed via direct refresh, restore from booking context or redirect gracefully:
    const fallbackBusId = new URLSearchParams(location.search).get('busId');
    if (fallbackBusId) {
      selectedBus.id = fallbackBusId;
    }
  }

  const activeRoute = `${selectedBus?.originCity || 'Coimbatore'} → ${selectedBus?.destinationCity || 'Karaikudi'}`;

  return <TripBooking {...props} selectedBus={selectedBus} activeRoute={activeRoute} />;
}
