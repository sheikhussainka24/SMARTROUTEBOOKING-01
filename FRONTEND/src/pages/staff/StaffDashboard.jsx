import React from 'react';
import { Ticket, Users, Search, Printer, CheckCircle2, ShieldCheck, Bus } from 'lucide-react';

export default function StaffDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      <div className="sr-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="badge badge-cyan">COUNTER DESK</span>
          <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)' }}>Terminal Ticket Issuance</span>
        </div>
        <h1 style={{ fontSize: 24, color: 'var(--sr-text-primary)', margin: 0, fontWeight: 800 }}>Staff & Terminal Counter Operations</h1>
        <p style={{ color: 'var(--sr-text-secondary)', fontSize: 13, marginTop: 4 }}>
          Offline counter ticket issuance, passenger boarding verification, and customer luggage tags.
        </p>
      </div>

      <div className="sr-card" style={{ padding: 36, textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'rgba(225, 29, 72, 0.1)',
          border: '1px solid rgba(225, 29, 72, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Ticket size={28} color="var(--sr-primary)" />
        </div>
        <h3 style={{ color: 'var(--sr-text-primary)', margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Counter Quick Ticket Desk</h3>
        <p style={{ maxWidth: 480, margin: '0 auto 24px', fontSize: 13, color: 'var(--sr-text-secondary)' }}>
          Search upcoming departure manifests to issue offline walk-in tickets with thermal print and digital SMS dispatch.
        </p>
        <div style={{ display: 'inline-flex', gap: 12 }}>
          <a href="/" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
            <Search size={15} /> Book Walk-in Ticket
          </a>
        </div>
      </div>
    </div>
  );
}
