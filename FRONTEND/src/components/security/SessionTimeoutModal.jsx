import React from 'react';
import { Clock, ShieldAlert, LogOut, CheckCircle } from 'lucide-react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout.js';

/**
 * SMART ROUTE — Automatic Session Timeout Warning Modal
 *
 * Prompts the user before their session expires due to inactivity,
 * allowing them to extend their authenticated session or securely log out.
 */
export default function SessionTimeoutModal() {
  const { showWarning, secondsRemaining, stayLoggedIn, logoutNow } = useSessionTimeout();

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-2 border-[#E7A0BF] rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Pulsing Warning Icon */}
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center mb-4 text-amber-600 shadow-sm animate-pulse">
          <Clock size={32} />
        </div>

        <h3 className="text-xl font-black text-[#24152D] mb-2">
          Session Expiring Due to Inactivity
        </h3>

        <p className="text-xs text-[#6E5D73] leading-relaxed mb-6">
          For your security, your authenticated session will automatically expire unless you choose to stay logged in.
        </p>

        {/* Countdown Pill */}
        <div className="bg-[#FFF1F6] border border-[#E7A0BF] rounded-2xl py-3 px-4 mb-6 inline-flex items-center gap-2">
          <ShieldAlert size={18} className="text-[#C13D78]" />
          <span className="text-sm font-extrabold text-[#24152D]">
            Logging out in <span className="font-mono text-base text-[#C13D78]">{secondsRemaining}</span> seconds
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={stayLoggedIn}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-[#C13D78] hover:bg-[#A0285D] text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <CheckCircle size={16} />
            <span>Stay Logged In</span>
          </button>

          <button
            type="button"
            onClick={logoutNow}
            className="py-3 px-4 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            <span>Log Out Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}

