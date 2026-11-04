import React from 'react';
import BookingSuccess from './BookingSuccess.jsx';

/**
 * Dynamic Operator & Journey Resolution Helper for Ticket View
 */
export function resolveTicketMetadata(booking) {
  const operatorName =
    booking?.operatorName ||
    booking?.operator_name ||
    booking?.bus?.operatorName ||
    "VEE VEE Travels";

  const serviceNumber =
    booking?.serviceNumber ||
    booking?.service_number ||
    booking?.bus?.serviceNumber ||
    "VV-CBETKS-100";

  const busNumber =
    booking?.busNumber ||
    booking?.bus_registration_number ||
    booking?.bus?.registrationNumber ||
    "TN-38-VV-1001";

  const departureTime =
    booking?.departureTime ||
    booking?.departure_time ||
    "22:45";

  const rawJourneyDate =
    booking?.journeyDate ||
    booking?.journey_date ||
    booking?.travelDate;

  const formattedJourneyDate = rawJourneyDate
    ? new Date(rawJourneyDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : "Thu, 15 Oct, 2026";

  return {
    operatorName,
    serviceNumber,
    busNumber,
    departureTime,
    rawJourneyDate,
    formattedJourneyDate,
  };
}

export default function TicketView(props) {
  return <BookingSuccess {...props} />;
}

export { BookingSuccess as TicketView };
