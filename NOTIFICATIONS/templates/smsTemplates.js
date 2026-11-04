/**
 * SMART ROUTE — SMS Message Templates
 */

export const SMS_TEMPLATES = {
  OTP_VERIFICATION: (otp) =>
    `Your SMART ROUTE verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,

  BOOKING_CONFIRMED: (pnr, travelName, seats, depTime) =>
    `Confirmed! PNR: ${pnr} with ${travelName}. Seats: ${seats}. Departs at: ${depTime}. Track live bus: https://smartroute.in/track/${pnr}`,

  BOARDING_REMINDER: (pnr, busNum, boardingPoint, time) =>
    `Reminder: Bus ${busNum} (PNR: ${pnr}) departs soon from ${boardingPoint} at ${time}. Please report 15 mins early.`,
};
