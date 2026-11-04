import React, { useState } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Snowflake,
  BedDouble,
  Armchair,
  Ban,
  Radio,
  Sparkles,
  Tag,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Wifi,
  Droplets,
  Zap,
  ShieldCheck,
  Check,
  Eye,
} from 'lucide-react';

/**
 * Comprehensive Left Filter Sidebar
 * Combining best functional patterns from RedBus and Abhibus.
 */
export default function FilterSidebar({
  filters,
  onChangeFilter,
  onResetFilters,
  availableOperators = [],
  availableBoardingPoints = [],
  availableDroppingPoints = [],
  activeFilterCount = 0,
}) {
  // Accordion section open/collapse states
  const [openSections, setOpenSections] = useState({
    busType: true,
    price: true,
    time: true,
    operators: true,
    boarding: true,
    dropping: false,
    singleWindow: true,
    amenities: true,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Toggle helpers
  const handleToggleBusType = (typeKey) => {
    const current = filters.busTypes || [];
    const next = current.includes(typeKey)
      ? current.filter((t) => t !== typeKey)
      : [...current, typeKey];
    onChangeFilter('busTypes', next);
  };

  const handleToggleTimeSlot = (slotKey) => {
    const current = filters.departureTimeSlots || [];
    const next = current.includes(slotKey)
      ? current.filter((s) => s !== slotKey)
      : [...current, slotKey];
    onChangeFilter('departureTimeSlots', next);
  };

  const handleToggleOperator = (opName) => {
    const current = filters.operators || [];
    const next = current.includes(opName)
      ? current.filter((o) => o !== opName)
      : [...current, opName];
    onChangeFilter('operators', next);
  };

  const handleToggleBoarding = (pointName) => {
    const current = filters.boardingPoints || [];
    const next = current.includes(pointName)
      ? current.filter((p) => p !== pointName)
      : [...current, pointName];
    onChangeFilter('boardingPoints', next);
  };

  const handleToggleDropping = (pointName) => {
    const current = filters.droppingPoints || [];
    const next = current.includes(pointName)
      ? current.filter((p) => p !== pointName)
      : [...current, pointName];
    onChangeFilter('droppingPoints', next);
  };

  const handleToggleAmenity = (amenityKey) => {
    const current = filters.amenities || [];
    const next = current.includes(amenityKey)
      ? current.filter((a) => a !== amenityKey)
      : [...current, amenityKey];
    onChangeFilter('amenities', next);
  };

  const [minPrice, maxPrice] = filters.priceRange || [500, 2500];

  const BUS_TYPE_CARDS = [
    { key: 'ac', label: 'AC', icon: <Snowflake size={15} /> },
    { key: 'sleeper', label: 'Sleeper', icon: <BedDouble size={15} /> },
    { key: 'seater', label: 'Seater', icon: <Armchair size={15} /> },
    { key: 'non_ac', label: 'Non-AC', icon: <Ban size={15} /> },
    { key: 'live_track', label: 'Live Track', icon: <Radio size={15} /> },
    { key: 'new_fleet', label: 'New Fleet', icon: <Sparkles size={15} /> },
    { key: 'offers', label: 'Offers', icon: <Tag size={15} /> },
  ];

  const TIME_SLOTS = [
    { key: 'before_10am', label: 'Before 10 AM', time: 'Morning', icon: <Sunrise size={18} /> },
    { key: '10am_5pm', label: '10 AM - 5 PM', time: 'Afternoon', icon: <Sun size={18} /> },
    { key: '5pm_11pm', label: '5 PM - 11 PM', time: 'Evening', icon: <Sunset size={18} /> },
    { key: 'after_11pm', label: 'After 11 PM', time: 'Night', icon: <Moon size={18} /> },
  ];

  const AMENITIES_LIST = [
    { key: 'wifi', label: 'WiFi', icon: <Wifi size={14} /> },
    { key: 'water', label: 'Water Bottle', icon: <Droplets size={14} /> },
    { key: 'blanket', label: 'Blanket', icon: <BedDouble size={14} /> },
    { key: 'charging', label: 'Charging Port', icon: <Zap size={14} /> },
    { key: 'reading_light', label: 'Reading Lamp', icon: <Sun size={14} /> },
    { key: 'sos', label: 'Emergency SOS', icon: <ShieldCheck size={14} /> },
  ];

  return (
    <aside
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1.5px solid #F1EDFA',
        padding: '18px 16px',
        boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {/* 1. Header with Clear All */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 12,
          borderBottom: '1.5px solid #F1EDFA',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={17} color="#C13D78" />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#24152D' }}>Filters</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                background: '#C13D78',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 800,
                padding: '1px 7px',
                borderRadius: 10,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onResetFilters}
          style={{
            background: 'none',
            border: 'none',
            color: activeFilterCount > 0 ? '#C13D78' : '#8F7E94',
            fontSize: 12,
            fontWeight: 700,
            cursor: activeFilterCount > 0 ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 6px',
            borderRadius: 6,
            transition: 'all 0.15s ease',
          }}
          disabled={activeFilterCount === 0}
        >
          <RotateCcw size={12} /> Clear All
        </button>
      </div>

      {/* 2. Bus Type Grid (Icon-based) */}
      <div>
        <div
          onClick={() => toggleSection('busType')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: openSections.busType ? 10 : 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Bus Types</span>
          {openSections.busType ? <ChevronUp size={15} color="#6E5D73" /> : <ChevronDown size={15} color="#6E5D73" />}
        </div>

        {openSections.busType && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {BUS_TYPE_CARDS.map((item) => {
              const active = (filters.busTypes || []).includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleToggleBusType(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: active ? '#C13D78' : '#F1EDFA',
                    background: active ? '#FFF1F6' : '#FFFFFF',
                    color: active ? '#C13D78' : '#6E5D73',
                    fontSize: 12,
                    fontWeight: active ? 700 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ color: active ? '#C13D78' : '#8F7E94' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: '#F1EDFA' }} />

      {/* 3. Price Range Dual Slider (₹500 to ₹2500) */}
      <div>
        <div
          onClick={() => toggleSection('price')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: openSections.price ? 12 : 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Price Range</span>
          {openSections.price ? <ChevronUp size={15} color="#6E5D73" /> : <ChevronDown size={15} color="#6E5D73" />}
        </div>

        {openSections.price && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Dual Slider Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6E5D73', marginBottom: 4, fontWeight: 600 }}>
                  <span>Min Fare: ₹{minPrice}</span>
                  <span>Max Fare: ₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2500"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => {
                    const newMax = Number(e.target.value);
                    if (newMax >= minPrice) {
                      onChangeFilter('priceRange', [minPrice, newMax]);
                    }
                  }}
                  style={{
                    width: '100%',
                    accentColor: '#C13D78',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Price Preset Chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'Under ₹800', range: [500, 800] },
                  { label: '₹800 - ₹1200', range: [800, 1200] },
                  { label: '₹1200 - ₹1800', range: [1200, 1800] },
                  { label: 'All Fares', range: [500, 2500] },
                ].map((preset, idx) => {
                  const isPresetActive = minPrice === preset.range[0] && maxPrice === preset.range[1];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onChangeFilter('priceRange', preset.range)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 10,
                        fontWeight: isPresetActive ? 700 : 500,
                        background: isPresetActive ? '#FFF1F6' : '#FFFFFF',
                        border: '1px solid',
                        borderColor: isPresetActive ? '#C13D78' : '#F1EDFA',
                        color: isPresetActive ? '#C13D78' : '#6E5D73',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: '#F1EDFA' }} />

      {/* 4. Departure Time Slots (4-Box Grid with Icons) */}
      <div>
        <div
          onClick={() => toggleSection('time')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: openSections.time ? 10 : 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Departure Time</span>
          {openSections.time ? <ChevronUp size={15} color="#6E5D73" /> : <ChevronDown size={15} color="#6E5D73" />}
        </div>

        {openSections.time && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {TIME_SLOTS.map((slot) => {
              const active = (filters.departureTimeSlots || []).includes(slot.key);
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => handleToggleTimeSlot(slot.key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: active ? '#C13D78' : '#F1EDFA',
                    background: active ? '#FFF1F6' : '#FFFFFF',
                    color: active ? '#C13D78' : '#24152D',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'space-between' }}>
                    <span style={{ color: active ? '#C13D78' : '#6E5D73' }}>{slot.icon}</span>
                    {active && <Check size={12} color="#C13D78" />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{slot.label}</span>
                  <span style={{ fontSize: 10, color: '#8F7E94' }}>{slot.time}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: '#F1EDFA' }} />

      {/* 5. Collapsible: Bus Partner / Operator */}
      <div>
        <div
          onClick={() => toggleSection('operators')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: openSections.operators ? 10 : 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>
            Bus Partners ({availableOperators.length})
          </span>
          {openSections.operators ? <ChevronUp size={15} color="#6E5D73" /> : <ChevronDown size={15} color="#6E5D73" />}
        </div>

        {openSections.operators && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
            {availableOperators.map((op) => {
              const isChecked = (filters.operators || []).includes(op);
              return (
                <label
                  key={op}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: isChecked ? '#C13D78' : '#24152D',
                    fontWeight: isChecked ? 700 : 500,
                    cursor: 'pointer',
                    padding: '3px 0',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleOperator(op)}
                    style={{ accentColor: '#C13D78', width: 14, height: 14 }}
                  />
                  <span>{op}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: '#F1EDFA' }} />

      {/* 6. Collapsible: Boarding Points */}
      {availableBoardingPoints.length > 0 && (
        <>
          <div>
            <div
              onClick={() => toggleSection('boarding')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: openSections.boarding ? 10 : 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>
                Boarding Points ({availableBoardingPoints.length})
              </span>
              {openSections.boarding ? <ChevronUp size={15} color="#6E5D73" /> : <ChevronDown size={15} color="#6E5D73" />}
            </div>

            {openSections.boarding && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                {availableBoardingPoints.map((point) => {
                  const isChecked = (filters.boardingPoints || []).includes(point);
                  return (
                    <label
                      key={point}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: isChecked ? '#C13D78' : '#24152D',
                        fontWeight: isChecked ? 700 : 500,
                        cursor: 'pointer',
                        padding: '3px 0',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleBoarding(point)}
                        style={{ accentColor: '#C13D78', width: 14, height: 14 }}
                      />
                      <span>{point}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ height: 1, background: '#F1EDFA' }} />
        </>
      )}

      {/* 7. Collapsible: Dropping Points */}
      {availableDroppingPoints.length > 0 && (
        <>
          <div>
            <div
              onClick={() => toggleSection('dropping')}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: openSections.dropping ? 10 : 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>
                Dropping Points ({availableDroppingPoints.length})
              </span>
              {openSections.dropping ? <ChevronUp size={15} color="#6E5D73" /> : <ChevronDown size={15} color="#6E5D73" />}
            </div>

            {openSections.dropping && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                {availableDroppingPoints.map((point) => {
                  const isChecked = (filters.droppingPoints || []).includes(point);
                  return (
                    <label
                      key={point}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: isChecked ? '#C13D78' : '#24152D',
                        fontWeight: isChecked ? 700 : 500,
                        cursor: 'pointer',
                        padding: '3px 0',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDropping(point)}
                        style={{ accentColor: '#C13D78', width: 14, height: 14 }}
                      />
                      <span>{point}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ height: 1, background: '#F1EDFA' }} />
        </>
      )}

      {/* 8. Single Window Seater / Sleeper Toggle */}
      <div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={15} color="#C13D78" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#24152D' }}>
              Single Window Seat/Berth
            </span>
          </div>
          <input
            type="checkbox"
            checked={Boolean(filters.singleWindowOnly)}
            onChange={(e) => onChangeFilter('singleWindowOnly', e.target.checked)}
            style={{ accentColor: '#C13D78', width: 16, height: 16 }}
          />
        </label>
      </div>

      <div style={{ height: 1, background: '#F1EDFA' }} />

      {/* 9. Amenities Checkboxes */}
      <div>
        <div
          onClick={() => toggleSection('amenities')}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: openSections.amenities ? 10 : 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>Amenities</span>
          {openSections.amenities ? <ChevronUp size={15} color="#6E5D73" /> : <ChevronDown size={15} color="#6E5D73" />}
        </div>

        {openSections.amenities && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {AMENITIES_LIST.map((item) => {
              const isChecked = (filters.amenities || []).includes(item.key);
              return (
                <label
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: isChecked ? '#C13D78' : '#6E5D73',
                    fontWeight: isChecked ? 700 : 500,
                    cursor: 'pointer',
                    padding: '3px 0',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleAmenity(item.key)}
                    style={{ accentColor: '#C13D78', width: 13, height: 13 }}
                  />
                  <span>{item.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
