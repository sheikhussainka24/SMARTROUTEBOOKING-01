/**
 * SMART ROUTE — Reports & CSV Export Center
 * Module 13: Downloadable audit and accounting reports with Indian Rupee (₹) formatting
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import accountingApi from '../../services/accountingService.js';
import {
  Download,
  FileSpreadsheet,
  CheckCircle,
  Calendar,
  Layers,
  Fuel,
  Users,
  Bus,
  MapPin,
  TrendingUp,
} from 'lucide-react';

const REPORT_CARDS = [
  {
    id: 'summary',
    title: 'Executive Financial Summary',
    description: 'Consolidated gross sales, discounts, refunds, net revenue, operating expenses, and net profit/loss.',
    icon: TrendingUp,
    badge: 'Consolidated',
  },
  {
    id: 'bus_profitability',
    title: 'Bus Profitability & Ledger Report',
    description: 'Bus-wise rankings by cumulative total profit and average profit per operated trip with seat occupancy.',
    icon: Bus,
    badge: 'Fleet Ledger',
  },
  {
    id: 'route_profitability',
    title: 'Route-wise Profitability & Corridor Report',
    description: 'Corridor performance, scheduled vs operated trips, revenue, operating expenses, and average trip profit.',
    icon: MapPin,
    badge: 'Corridors',
  },
  {
    id: 'fuel_expenses',
    title: 'Diesel & Fuel Audit Report',
    description: 'Fuel purchases, litres consumed, average price per litre, odometer readings, and anomaly detection flags.',
    icon: Fuel,
    badge: 'Diesel & Mileage',
  },
  {
    id: 'expenses',
    title: 'Detailed Operating Expenses Ledger',
    description: 'Comprehensive itemized expense records across all 12 categories with approval and reversal audit history.',
    icon: FileSpreadsheet,
    badge: 'Audit Trail',
  },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('all');
  const [downloading, setDownloading] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  const [errorNotice, setErrorNotice] = useState(null);

  const handleDownload = async (reportId) => {
    try {
      setDownloading(reportId);
      setErrorNotice(null);
      setSuccessNotice(null);

      await accountingApi.downloadExport(reportId, { dateRange });
      setSuccessNotice(`Successfully exported report '${reportId.replace('_', ' ').toUpperCase()}' in CSV format.`);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', color: '#24152D' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#24152D' }}>
            Financial & Operational Reports Export Center
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
            Download production-ready CSV spreadsheets formatted in Indian Currency (₹) with full audit headings
          </p>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 8, padding: 2 }}>
          {['all', 'today', 'this_week', 'this_month', 'this_year'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDateRange(p)}
              style={{
                border: 'none',
                background: dateRange === p ? 'var(--sr-primary, #C13D78)' : 'transparent',
                color: dateRange === p ? '#FFF' : '#6E5D73',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {successNotice && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {successNotice}
        </div>
      )}

      {errorNotice && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {errorNotice}
        </div>
      )}

      {/* Grid of Report Download Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {REPORT_CARDS.map((report) => {
          const Icon = report.icon;
          const isBusy = downloading === report.id;

          return (
            <div
              key={report.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E7D7E0',
                borderRadius: 12,
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ background: '#FFF1F6', color: '#C13D78', padding: 10, borderRadius: 10 }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                    {report.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: '#24152D' }}>
                  {report.title}
                </h3>
                <p style={{ fontSize: 13, color: '#6E5D73', margin: 0, lineHeight: 1.5 }}>
                  {report.description}
                </p>
              </div>

              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #F4ECF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#8A7A8F' }}>
                  Period: <strong>{dateRange.replace('_', ' ').toUpperCase()}</strong>
                </span>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDownload(report.id)}
                  style={{
                    border: 'none',
                    background: 'var(--sr-primary, #C13D78)',
                    color: '#FFF',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isBusy ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: isBusy ? 0.7 : 1,
                  }}
                >
                  <Download size={14} /> {isBusy ? 'Exporting...' : 'Download CSV'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
