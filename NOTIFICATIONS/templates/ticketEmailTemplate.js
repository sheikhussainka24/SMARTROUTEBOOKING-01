/**
 * SMART ROUTE — Ticket Email HTML Template
 */

export function renderTicketEmail({ pnr, travelName, passengerName, busNumber, fromCity, toCity, departureTime, seatNumbers, totalFare }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f8; margin: 0; padding: 20px; }
    .ticket-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0 0 6px; font-size: 24px; color: #38bdf8; }
    .content { padding: 24px; color: #334155; }
    .pnr-box { background: #f0fdf4; border: 1px dashed #22c55e; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
    .pnr-label { font-size: 12px; color: #166534; text-transform: uppercase; font-weight: bold; }
    .pnr-value { font-size: 24px; font-weight: bold; color: #15803d; letter-spacing: 2px; }
    .info-row { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 10px 0; }
    .info-label { color: #64748b; font-size: 14px; }
    .info-val { font-weight: 600; font-size: 14px; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #94a3b8; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="header">
      <h1>SMART ROUTE</h1>
      <p style="margin: 0; font-size: 14px; color: #94a3b8;">${travelName} — Confirmed E-Ticket</p>
    </div>
    <div class="content">
      <div class="pnr-box">
        <div class="pnr-label">Booking Reference (PNR)</div>
        <div class="pnr-value">${pnr}</div>
      </div>
      <div class="info-row">
        <span class="info-label">Passenger</span>
        <span class="info-val">${passengerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Journey</span>
        <span class="info-val">${fromCity} ➔ ${toCity}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Departure</span>
        <span class="info-val">${new Date(departureTime).toLocaleString('en-IN')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Bus Number</span>
        <span class="info-val">${busNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Seats / Sleepers</span>
        <span class="info-val">${seatNumbers.join(', ')}</span>
      </div>
      <div class="info-row" style="border-bottom: none;">
        <span class="info-label">Total Amount Paid</span>
        <span class="info-val" style="color: #059669; font-size: 16px;">₹${totalFare}</span>
      </div>
    </div>
    <div class="footer">
      Please carry a valid government ID during travel. Show this ticket or SMS to the driver.<br/>
      Need help? Reach out at support@smartroute.in
    </div>
  </div>
</body>
</html>
  `;
}
