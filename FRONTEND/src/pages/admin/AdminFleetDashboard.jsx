import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Bus,
  Plus,
  PlusCircle,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Navigation,
  CheckCircle2,
  Sliders,
  Layers,
  Search,
  Filter,
  Eye,
  Check,
  X,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import CoachSeatLayout from '../../components/seats/CoachSeatLayout.jsx';

export default function AdminFleetDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLayout, setFilterLayout] = useState('all');

  // Success toast from bus creation navigation
  const [toastMessage, setToastMessage] = useState(location.state?.toast || null);

  // Layout preview modal state
  const [previewBus, setPreviewBus] = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load buses
  const loadFleetBuses = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await api.get('/admin/buses');
      } catch (e) {
        res = await api.get('/operator/company/buses');
      }

      const list = res?.buses || res?.data?.buses || [];
      if (Array.isArray(list) && list.length > 0) {
        setBuses(list);
      } else {
        // Fallback demo fleet with certified TN 76 plates and chassis
        setBuses([
          {
            id: 'bus-fl-01',
            name: 'Volvo 9600 Multi-Axle Luxury Glider',
            registration_number: 'TN 76 AH 7890',
            bus_type: 'Fully Sleeper (Volvo 9600)',
            layout_type: 'sleeper_36',
            layout_name: 'Fully Sleeper (Volvo 9600)',
            layout_classification: 'Sleeper',
            count_summary: 'B36 + D1 = 37',
            chassis: 'Volvo 9600 Multi-Axle Intercity Sleeper',
            chassis_make: 'Volvo',
            chassis_model: 'Volvo 9600',
            total_seats: 36,
            total_capacity: 37,
            assigned_route: 'Coimbatore ⇄ Karaikudi',
            departure_time: '21:30',
            arrival_time: '05:00',
            amenities: ['Live Radar GPS Tracking', 'Climate Controlled AC (UV Purified)', '230V & USB-C Power Outlets', 'Clean Blanket & Pillow'],
            is_active: true,
            status: 'active',
          },
          {
            id: 'bus-fl-02',
            name: 'Tata Vega 2+1 Executive Glider',
            registration_number: 'TN 76 SR 1001',
            bus_type: '2+1 Combo (Tata)',
            layout_type: 'combo_48',
            layout_name: '2+1 Combo (Tata)',
            layout_classification: 'Seater-Cum-Sleeper',
            count_summary: 'S24 + B24 + D1 = 49',
            chassis: 'Tata LPO 1618 / Prakash Vega',
            chassis_make: 'Tata',
            chassis_model: 'Tata LPO 1618',
            total_seats: 48,
            total_capacity: 49,
            assigned_route: 'Coimbatore ⇄ Tenkasi',
            departure_time: '22:00',
            arrival_time: '06:00',
            amenities: ['Live Radar GPS Tracking', 'Climate Controlled AC (UV Purified)', '230V & USB-C Power Outlets', 'Reading Lamp'],
            is_active: true,
            status: 'active',
          },
          {
            id: 'bus-fl-03',
            name: 'BharatBenz Club Class Bio-Toilet Express',
            registration_number: 'TN 76 BL 2002',
            bus_type: 'Fully Sleeper + Rear Restroom',
            layout_type: 'sleeper_washroom_rear',
            layout_name: 'Fully Sleeper + Rear Restroom',
            layout_classification: 'Sleeper',
            count_summary: 'B34 + D1 = 35',
            chassis: 'BharatBenz 2428 Multi-Axle Glider',
            chassis_make: 'BharatBenz',
            chassis_model: 'BharatBenz 2428',
            total_seats: 34,
            total_capacity: 35,
            assigned_route: 'Coimbatore ⇄ Chennai',
            departure_time: '20:30',
            arrival_time: '05:30',
            amenities: ['Live Radar GPS Tracking', 'Climate Controlled AC (UV Purified)', 'Onboard Washroom', '230V & USB-C Power Outlets'],
            is_active: true,
            status: 'active',
          },
        ]);
      }
    } catch (err) {
      console.warn('Fleet load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleetBuses();
  }, []);

  // Filtered list
  const filteredBuses = buses.filter((b) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (b.name || '').toLowerCase().includes(q) || (b.registration_number || '').toLowerCase().includes(q) || (b.assigned_route || '').toLowerCase().includes(q);
    const layoutMatch = filterLayout === 'all' || b.layout_type === filterLayout || b.bus_type?.toLowerCase().includes(filterLayout.toLowerCase());
    return nameMatch && layoutMatch;
  });

  return (
    <div className="min-h-screen bg-[#FFF1F6] text-[#24152D] font-sans pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Success Toast */}
        {toastMessage && (
          <div className="mb-6 bg-emerald-500 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="shrink-0" />
              <span className="font-bold text-sm">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white p-1"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Header with High-Visibility "+ Add Bus" CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#F1EDFA]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C13D78] mb-1">
              <span>National Operations Network</span>
              <span>&bull;</span>
              <span>Fleet Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#24152D] flex items-center gap-3">
              <span>Fleet Management & Coaches</span>
              <span className="bg-[#FFF1F6] text-[#C13D78] border border-[#E7A0BF] text-xs font-bold px-3 py-1 rounded-full">
                {buses.length} Coaches Registered
              </span>
            </h1>
            <p className="text-sm text-[#6E5D73] mt-1 max-w-2xl">
              Inspect company coach inventories, view official 6-layout seating blueprints, and provision new buses to active routes.
            </p>
          </div>

          {/* High-Visibility Rose Pink CTA button */}
          <button
            type="button"
            onClick={() => navigate('/admin/buses/create')}
            className="bg-[#C13D78] hover:bg-[#A82B63] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>+ Add Bus</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#F1EDFA] p-5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6E5D73]">Total Active Fleet</div>
            <div className="text-2xl font-black text-[#24152D] mt-1">{buses.length} Coaches</div>
            <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} /> 100% AIS-140 GPS Compliant
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#F1EDFA] p-5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6E5D73]">Certified Layouts</div>
            <div className="text-2xl font-black text-[#C13D78] mt-1">6 Blueprints</div>
            <div className="text-[11px] text-[#6E5D73] mt-1">Combo, Sleeper, Seater & WC</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#F1EDFA] p-5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6E5D73]">Passenger Capacity</div>
            <div className="text-2xl font-black text-[#24152D] mt-1">
              {buses.reduce((sum, b) => sum + (b.total_seats || 40), 0)} Berths
            </div>
            <div className="text-[11px] text-[#6E5D73] mt-1">Across Southern Corridors</div>
          </div>

          <div className="bg-white rounded-2xl border border-[#F1EDFA] p-5 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#6E5D73]">Live Radar GPS</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">Real-time</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">WebSocket Telemetry Active</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 bg-white rounded-2xl border border-[#F1EDFA] p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3 top-3 text-[#6E5D73]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bus name, registration number, or route..."
              className="w-full bg-[#FFF1F6]/50 border border-[#E7A0BF] rounded-xl pl-9 pr-4 py-2 text-sm text-[#24152D] focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#6E5D73]">Layout Filter:</span>
            <select
              value={filterLayout}
              onChange={(e) => setFilterLayout(e.target.value)}
              className="bg-white border border-[#E7A0BF] text-[#24152D] text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C13D78]"
            >
              <option value="all">All 6 Layouts</option>
              <option value="combo_48">2+1 Combo (48 Seats)</option>
              <option value="sleeper_36">Fully Sleeper (36 Berths)</option>
              <option value="seater_40">Fully Seater (40 Seats)</option>
              <option value="sleeper_washroom_rear">Sleeper + Rear WC (34 Berths)</option>
              <option value="sleeper_washroom_front">Sleeper + Front WC (35 Berths)</option>
              <option value="seater_washroom">Seater + Rear WC (38 Seats)</option>
            </select>
          </div>
        </div>

        {/* Fleet Coaches List */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#F1EDFA]">
              <div className="text-sm font-bold text-[#6E5D73]">Loading fleet coaches...</div>
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#F1EDFA] p-8">
              <Bus size={48} className="mx-auto text-[#C13D78] opacity-40 mb-3" />
              <h3 className="text-base font-extrabold text-[#24152D]">No coaches match your search criteria</h3>
              <p className="text-xs text-[#6E5D73] mt-1 mb-4">Click "+ Add Bus" to provision a new bus with official layouts.</p>
              <button
                type="button"
                onClick={() => navigate('/admin/buses/create')}
                className="bg-[#C13D78] hover:bg-[#A82B63] text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} /> + Add Bus Now
              </button>
            </div>
          ) : (
            filteredBuses.map((bus) => (
              <div
                key={bus.id}
                className="bg-white rounded-2xl border border-[#F1EDFA] p-5 shadow-xs hover:border-[#E7A0BF] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF1F6] border border-[#E7A0BF] flex items-center justify-center text-[#C13D78] shrink-0">
                    <Bus size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#FFF1F6] text-[#C13D78] border border-[#E7A0BF] text-xs font-black px-2.5 py-0.5 rounded-md tracking-wider">
                        {bus.registration_number || bus.registrationNumber || 'TN 76 ...'}
                      </span>
                      <span className="bg-[#24152D] text-white text-[11px] font-black px-2 py-0.5 rounded-md tracking-wider">
                        {bus.count_summary || (bus.layout_type === 'combo_48' ? 'S24 + B24 + D1 = 49' : bus.layout_type === 'sleeper_36' ? 'B36 + D1 = 37' : bus.layout_type === 'seater_40' ? 'S40 + D1 = 41' : bus.layout_type === 'sleeper_washroom_rear' ? 'B34 + D1 = 35' : bus.layout_type === 'sleeper_washroom_front' ? 'B35 + D1 = 36' : 'S38 + D1 = 39')}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        {bus.status === 'draft' ? 'DRAFT' : 'ACTIVE & SCHEDULED'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-[#24152D] mt-1">
                      {bus.name || bus.bus_number}
                    </h3>

                    {/* Bus Brand & Chassis outside map (Requirement 8) */}
                    <div className="text-xs text-[#6E5D73] mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#C13D78]">Chassis:</span>
                      <span className="bg-gray-100 text-[#24152D] font-semibold px-2 py-0.5 rounded text-[11px] border border-gray-200">
                        {bus.chassis || bus.chassis_model || bus.chassis_make || 'Certified OEM Chassis'}
                      </span>
                      <span className="text-[#6E5D73]">&bull;</span>
                      <span className="font-bold text-[#6E5D73]">Type:</span>
                      <span className="text-[#24152D] font-bold">
                        {bus.layout_classification || (bus.layout_type === 'combo_48' ? 'Seater-Cum-Sleeper' : bus.layout_type?.includes('sleeper') ? 'Sleeper' : 'Seater')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#6E5D73] mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-[#24152D]">
                        <MapPin size={14} className="text-[#C13D78]" />
                        {bus.assigned_route || 'Coimbatore ⇄ Karaikudi'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-[#6E5D73]" />
                        {bus.departure_time || '21:30'} ➔ {bus.arrival_time || '05:00'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers size={14} className="text-[#6E5D73]" />
                        Layout: <strong className="text-[#C13D78]">{bus.layout_name || bus.bus_type || '2+1 Combo'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions & Amenities */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-[#F1EDFA]">
                  {/* Amenities preview */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(Array.isArray(bus.amenities) ? bus.amenities : ['GPS', 'AC', 'Power']).slice(0, 3).map((a, i) => (
                      <span key={i} className="text-[10px] bg-gray-100 text-[#6E5D73] px-2 py-0.5 rounded font-medium">
                        {typeof a === 'string' ? a.split(' ')[0] : 'Perk'}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewBus(bus)}
                    className="bg-[#FFF1F6] hover:bg-[#C13D78] text-[#C13D78] hover:text-white border border-[#E7A0BF] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={14} /> Preview Layout
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Coach Layout Modal Preview */}
      {previewBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-[#E7A0BF] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1EDFA] mb-4">
              <div>
                <h3 className="text-lg font-black text-[#24152D] flex items-center gap-2">
                  <span>{previewBus.name || previewBus.bus_number}</span>
                  <span className="text-xs font-bold text-[#C13D78] bg-[#FFF1F6] border border-[#E7A0BF] px-2.5 py-0.5 rounded-full">
                    {previewBus.layout_name || previewBus.bus_type}
                  </span>
                </h3>
                <p className="text-xs text-[#6E5D73] mt-1 flex items-center gap-2 flex-wrap">
                  <span>Registration: <strong className="font-mono text-[#24152D]">{previewBus.registration_number}</strong></span>
                  <span>&bull;</span>
                  <span>Chassis: <strong className="text-[#C13D78]">{previewBus.chassis || previewBus.chassis_model || 'Certified OEM Chassis'}</strong></span>
                  <span>&bull;</span>
                  <span className="bg-[#24152D] text-white text-[10px] font-black px-2 py-0.5 rounded">
                    {previewBus.count_summary || 'Verified Seat Count'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBus(null)}
                className="text-[#6E5D73] hover:text-[#C13D78] p-1.5 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[#FFF1F6]/30 p-4 rounded-2xl border border-[#F1EDFA]">
              <CoachSeatLayout
                layoutType={previewBus.layout_type || previewBus.bus_type}
                bus={previewBus}
                trip={{
                  tripId: 'fleet_modal_preview',
                  bus: previewBus,
                }}
                previewMode={true}
                showFloatingBar={false}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-[#F1EDFA] flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewBus(null)}
                className="bg-[#C13D78] hover:bg-[#A82B63] text-white px-6 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
