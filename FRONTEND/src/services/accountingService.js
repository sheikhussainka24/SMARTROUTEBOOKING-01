/**
 * SMART ROUTE — Frontend Accounting & Fleet Analytics Service
 */

import api from './api.js';
import CONFIG from '../config/index.js';

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      q.append(key, value);
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const accountingApi = {
  getSummary: (params) => api.get(`/accounting/summary${buildQuery(params)}`),
  getFleetSummary: (params) => api.get(`/accounting/fleet-summary${buildQuery(params)}`),
  getBusesAccounting: (params) => api.get(`/accounting/buses${buildQuery(params)}`),
  getBusDetails: (busId, params) => api.get(`/accounting/buses/${busId}${buildQuery(params)}`),
  getRoutesAccounting: (params) => api.get(`/accounting/routes${buildQuery(params)}`),
  getExpenses: (params) => api.get(`/accounting/expenses${buildQuery(params)}`),
  createExpense: (data) => api.post('/accounting/expenses', data),
  updateExpenseApproval: (id, data) => api.patch(`/accounting/expenses/${id}/approve`, data),
  getFuelLogs: (params) => api.get(`/accounting/fuel${buildQuery(params)}`),
  recordFuel: (data) => api.post('/accounting/fuel', data),
  getPayroll: (params) => api.get(`/accounting/payroll${buildQuery(params)}`),
  recordPayroll: (data) => api.post('/accounting/payroll', data),
  getReviews: (params) => api.get(`/accounting/reviews${buildQuery(params)}`),
  getBusRatingSummary: (busId) => api.get(`/accounting/reviews/bus/${busId}`),
  submitReview: (data) => api.post('/accounting/reviews', data),
  getExportUrl: (reportType, params = {}) => {
    const token = localStorage.getItem('smartroute_token') || localStorage.getItem('sr_access_token');
    return `${CONFIG.API_BASE_URL}/accounting/export${buildQuery({ ...params, reportType, token })}`;
  },
  downloadExport: async (reportType, params = {}) => {
    const token = localStorage.getItem('smartroute_token') || localStorage.getItem('sr_access_token');
    const url = `${CONFIG.API_BASE_URL}/accounting/export${buildQuery({ ...params, reportType })}`;
    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Failed to generate CSV export');
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `smartroute_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};

export default accountingApi;
