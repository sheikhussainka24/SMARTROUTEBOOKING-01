import React from 'react';
import { Check, X, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { validatePassword } from '../../utils/inputValidators.js';

/**
 * SMART ROUTE — Password Strength Meter Component
 *
 * Provides real-time visual feedback, score grading, and a compliance
 * checklist enforcing the 8-12 character strong password security policy.
 */
export default function PasswordStrengthMeter({ password = '', showChecklist = true }) {
  const { criteria, score } = validatePassword(password);

  const getStrengthMeta = () => {
    if (!password) {
      return { label: 'Enter Password', color: '#94A3B8', bg: '#F1F5F9', width: '0%' };
    }
    switch (score) {
      case 1:
        return { label: 'Very Weak', color: '#EF4444', bg: '#FEE2E2', width: '20%' };
      case 2:
        return { label: 'Weak', color: '#F97316', bg: '#FFEDD5', width: '40%' };
      case 3:
        return { label: 'Fair', color: '#F59E0B', bg: '#FEF3C7', width: '60%' };
      case 4:
        return { label: 'Good', color: '#3B82F6', bg: '#DBEAFE', width: '80%' };
      case 5:
        return { label: 'Strong & Secure', color: '#10B981', bg: '#D1FAE5', width: '100%' };
      default:
        return { label: 'Very Weak', color: '#EF4444', bg: '#FEE2E2', width: '15%' };
    }
  };

  const meta = getStrengthMeta();

  const rules = [
    { key: 'length', label: '8 to 128 characters', met: criteria.length },
    { key: 'upper', label: 'At least one uppercase letter (A-Z)', met: criteria.upper },
    { key: 'lower', label: 'At least one lowercase letter (a-z)', met: criteria.lower },
    { key: 'digit', label: 'At least one numeric digit (0-9)', met: criteria.digit },
    { key: 'special', label: 'At least one special symbol (!@#$%^&*)', met: criteria.special },
  ];

  if (!password && !showChecklist) return null;

  return (
    <div className="mt-2.5 space-y-2 text-xs">
      {/* Strength Bar & Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-[#24152D]">
          {score === 5 ? (
            <ShieldCheck size={14} className="text-emerald-600" />
          ) : score >= 3 ? (
            <Shield size={14} className="text-amber-500" />
          ) : (
            <ShieldAlert size={14} className="text-rose-500" />
          )}
          <span>Password Strength</span>
        </div>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider"
          style={{ backgroundColor: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: meta.width, backgroundColor: meta.color }}
        />
      </div>

      {/* Checklist */}
      {showChecklist && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
          {rules.map((r) => (
            <div
              key={r.key}
              className={`flex items-center gap-1.5 transition-colors ${
                r.met ? 'text-emerald-700 font-semibold' : 'text-[#6E5D73]'
              }`}
            >
              {r.met ? (
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-emerald-600 stroke-[3]" />
                </div>
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <X size={10} className="text-gray-400 stroke-[2]" />
                </div>
              )}
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

