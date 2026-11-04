/**
 * SMART ROUTE — Diesel & Fuel Accounting Page
 * Module 5: Diesel fuel purchases, mileage calculation (km/L), cost/km, and odometer anomaly detection
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import accountingApi from '../../services/accountingService.js';
import {
  Fuel,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Gauge,
  Calendar,
  Download,
} from 'lucide-react';

export default function FuelManagementPage() {
  const { user } = useAuth();
  const [fuelLogs, setFuelLogs] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Fuel Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    busId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    litres: '',
    pricePerLitre: '92.50',
    totalCost: '',
    odometerReading: '',
    fuelStation: '',
    notes: '',
  });

  const formatCurrency = (amt) => {
    const val = Number(amt) || 0;
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const loadFuelData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fuelRes, busRes] = await Promise.all([
        accountingApi.getFuelLogs({ busId: selectedBusId, dateRange }),
        accountingApi.getBusesAccounting({ dateRange: 'all' }),
      ]);
      if (fuelRes.success) {
        setFuelLogs(fuelRes.data || []);
      }
      if (busRes.success) {
        setBuses(busRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load fuel records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuelData();
  }, [selectedBusId, dateRange]);

  const handleLitresOrPriceChange = (litres, price) => {
    const l = Number(litres) || 0;
    const p = Number(price) || 0;
    const total = l > 0 && p > 0 ? (l * p).toFixed(2) : '';
    setFormData((prev) => ({ ...prev, litres, pricePerLitre: price, totalCost: total }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await accountingApi.recordFuel(formData);
      if (res.success) {
        if (res.data.is_flagged_anomaly) {
          setSuccessMsg(`Fuel entry recorded. NOTE: Flagged for anomaly review: ${res.data.anomaly_reason}`);
        } else {
          setSuccessMsg('Fuel purchase successfully logged and verified against odometer reading.');
        }
        setShowModal(false);
        setFormData({
          busId: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          litres: '',
          pricePerLitre: '92.50',
          totalCost: '',
          odometerReading: '',
          fuelStation: '',
          notes: '',
        });
        loadFuelData();
      }
    } catch (err) {
      setError(err.message || 'Failed to record fuel purchase');
    }
  };

  const totalLitres = fuelLogs.reduce((acc, f) => acc + Number(f.litres || 0), 0);
  const totalCost = fuelLogs.reduce((acc, f) => acc + Number(f.total_cost || 0), 0);
  const avgPrice = totalLitres > 0 ? (totalCost / totalLitres).toFixed(2) : '92.50';

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto', color: '#24152D' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#24152D' }}>
            Diesel & Fuel Consumption Accounting
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6E5D73' }}>
            High-speed diesel tracking, odometer verification, mileage calculation (km/L), and anomaly flags
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            border: 'none',
            background: 'var(--sr-primary, #C13D78)',
            color: '#FFF',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 10px rgba(193, 61, 120, 0.25)',
          }}
        >
          <Plus size={16} /> Record Fuel Purchase
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Headline Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A8F', textTransform: 'uppercase' }}>Total Diesel Spend</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444', marginTop: 4 }}>{formatCurrency(totalCost)}</div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 2 }}>Eligible operating expense</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A8F', textTransform: 'uppercase' }}>Total Litres Purchased</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#C13D78', marginTop: 4 }}>
            {totalLitres.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Litres
          </div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 2 }}>Avg Price: ₹{avgPrice} / Litre</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A8F', textTransform: 'uppercase' }}>Fuel Slips Recorded</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginTop: 4 }}>{fuelLogs.length} Entries</div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 2 }}>With verified odometer readings</div>
        </div>

        <div style={{ background: '#FFF', border: '1px solid #E7D7E0', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8A7A8F', textTransform: 'uppercase' }}>Anomalies Flagged</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: fuelLogs.filter((f) => f.is_flagged_anomaly).length > 0 ? '#DC2626' : '#10B981',
              marginTop: 4,
            }}
          >
            {fuelLogs.filter((f) => f.is_flagged_anomaly).length} Detected
          </div>
          <div style={{ fontSize: 12, color: '#8A7A8F', marginTop: 2 }}>Meter rollbacks & suspicious litres</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: '#FFF',
          border: '1px solid #E7D7E0',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <select
          value={selectedBusId}
          onChange={(e) => setSelectedBusId(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13, background: '#FFF' }}
        >
          <option value="">All Fleet Buses</option>
          {buses.map((b) => (
            <option key={b.bus_id || b.id} value={b.bus_id || b.id}>
              {b.registration_number} — {b.name}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', background: '#F9F5F8', borderRadius: 8, padding: 2 }}>
          {['all', 'today', 'this_week', 'this_month', 'this_year'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDateRange(p)}
              style={{
                border: 'none',
                background: dateRange === p ? 'var(--sr-primary, #C13D78)' : 'transparent',
                color: dateRange === p ? '#FFF' : '#6E5D73',
                padding: '6px 10px',
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

      {/* Fuel Logs Table */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7D7E0',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E7D7E0', color: '#8A7A8F', textAlign: 'left' }}>
              <th style={{ padding: '12px 8px' }}>Date</th>
              <th style={{ padding: '12px 8px' }}>Bus Registration</th>
              <th style={{ padding: '12px 8px' }}>Litres Purchased</th>
              <th style={{ padding: '12px 8px' }}>Price / Litre</th>
              <th style={{ padding: '12px 8px' }}>Total Cost</th>
              <th style={{ padding: '12px 8px' }}>Odometer Reading</th>
              <th style={{ padding: '12px 8px' }}>Fuel Station / Vendor</th>
              <th style={{ padding: '12px 8px' }}>Anomaly Status</th>
            </tr>
          </thead>
          <tbody>
            {fuelLogs.map((log) => {
              const bus = buses.find((b) => (b.bus_id || b.id) === log.bus_id);
              return (
                <tr key={log.id} style={{ borderBottom: '1px solid #F4ECF0' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600, color: '#24152D' }}>{log.purchase_date}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 700, color: '#24152D' }}>{bus?.registration_number || log.bus_id}</div>
                    <div style={{ fontSize: 11, color: '#8A7A8F' }}>{bus?.name}</div>
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 700, color: '#C13D78' }}>
                    {log.litres} L
                  </td>
                  <td style={{ padding: '12px 8px' }}>₹{log.price_per_litre}</td>
                  <td style={{ padding: '12px 8px', fontWeight: 700, color: '#EF4444' }}>
                    {formatCurrency(log.total_cost)}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                    {Number(log.odometer_reading).toLocaleString()} km
                  </td>
                  <td style={{ padding: '12px 8px', color: '#6E5D73' }}>{log.fuel_station}</td>
                  <td style={{ padding: '12px 8px' }}>
                    {log.is_flagged_anomaly ? (
                      <span
                        title={log.anomaly_reason}
                        style={{
                          background: '#FEE2E2',
                          color: '#DC2626',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <AlertTriangle size={12} /> ANOMALY
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#ECFDF5',
                          color: '#065F46',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CheckCircle size={12} /> VERIFIED
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* RECORD FUEL MODAL */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#24152D' }}>
                Record Diesel Purchase & Odometer
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#8A7A8F' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Select Bus *
                </label>
                <select
                  value={formData.busId}
                  onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                  required
                >
                  <option value="">-- Choose fleet bus --</option>
                  {buses.map((b) => (
                    <option key={b.bus_id || b.id} value={b.bus_id || b.id}>
                      {b.registration_number} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Current Odometer (KM) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 145620"
                    value={formData.odometerReading}
                    onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Litres *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 120"
                    value={formData.litres}
                    onChange={(e) => handleLitresOrPriceChange(e.target.value, formData.pricePerLitre)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Price / Litre *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerLitre}
                    onChange={(e) => handleLitresOrPriceChange(formData.litres, e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Total (₹)
                  </label>
                  <input
                    type="text"
                    value={formData.totalCost}
                    readOnly
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13, background: '#F9F5F8', fontWeight: 700, color: '#C13D78' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  Fuel Station / Vendor Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indian Oil Highway Plaza, Dharapuram"
                  value={formData.fuelStation}
                  onChange={(e) => setFormData({ ...formData, fuelStation: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #E7D7E0', borderRadius: 8, fontSize: 13 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ border: '1px solid #E7D7E0', background: '#FFF', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ border: 'none', background: 'var(--sr-primary, #C13D78)', color: '#FFF', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Diesel Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
