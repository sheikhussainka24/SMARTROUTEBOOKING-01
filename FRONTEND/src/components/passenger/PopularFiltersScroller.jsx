import React, { useState } from 'react';
import { MapPin, Bus, Check } from 'lucide-react';

/**
 * Popular Filters Scroller (Boarding Points & Operators)
 * Positioned directly above the bus results card list.
 */
export default function PopularFiltersScroller({
  fromCity = 'Coimbatore',
  boardingPoints = [],
  operators = [],
  selectedBoardingPoints = [],
  selectedOperators = [],
  onToggleBoardingPoint,
  onToggleOperator,
}) {
  const [activeTab, setActiveTab] = useState('boarding'); // 'boarding' | 'operators'

  // Default popular boarding points for Coimbatore if empty
  const defaultCoimbatorePoints = [
    'Gandhipuram',
    'Omni Bus Stand',
    'Hope College',
    'Lakshmi Mills',
    'Singanallur',
    'Peelamedu',
    'Neelambur',
    'Sulur',
    'Ukkadam',
  ];

  const effectiveBoardingPoints = boardingPoints.length > 0
    ? boardingPoints
    : defaultCoimbatorePoints;

  const defaultOperators = [
    'SMART ROUTE Express',
    'VEE VEE Travels',
    'TRANZKING Travels',
    'Horizon Travels',
  ];

  const effectiveOperators = operators.length > 0
    ? operators
    : defaultOperators;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1.5px solid #F1EDFA',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 2px 10px rgba(36, 21, 45, 0.03)',
      }}
    >
      {/* Top Header & Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#24152D' }}>
            Popular Filters:
          </span>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            background: '#FFF1F6',
            borderRadius: 8,
            padding: 2,
            border: '1px solid #F1EDFA',
            gap: 2,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('boarding')}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              fontSize: 11,
              fontWeight: activeTab === 'boarding' ? 700 : 500,
              background: activeTab === 'boarding' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'boarding' ? '#C13D78' : '#6E5D73',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: activeTab === 'boarding' ? '0 1px 3px rgba(36, 21, 45, 0.08)' : 'none',
            }}
          >
            <MapPin size={12} /> Boarding Points
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('operators')}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              fontSize: 11,
              fontWeight: activeTab === 'operators' ? 700 : 500,
              background: activeTab === 'operators' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'operators' ? '#C13D78' : '#6E5D73',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: activeTab === 'operators' ? '0 1px 3px rgba(36, 21, 45, 0.08)' : 'none',
            }}
          >
            <Bus size={12} /> Operators
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Pills */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 2,
          scrollbarWidth: 'none',
        }}
        className="popular-filters-scroll"
      >
        {activeTab === 'boarding' ? (
          effectiveBoardingPoints.map((point) => {
            const isSelected = selectedBoardingPoints.some(
              (p) => p.toLowerCase().includes(point.toLowerCase()) || point.toLowerCase().includes(p.toLowerCase())
            );
            return (
              <button
                key={point}
                type="button"
                onClick={() => onToggleBoardingPoint(point)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  borderRadius: 16,
                  border: '1px solid',
                  borderColor: isSelected ? '#C13D78' : '#F1EDFA',
                  background: isSelected ? '#FFF1F6' : '#FFFFFF',
                  color: isSelected ? '#C13D78' : '#24152D',
                  fontSize: 11,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <MapPin size={11} color={isSelected ? '#C13D78' : '#8F7E94'} />
                <span>{point}</span>
                {isSelected && <Check size={11} color="#C13D78" />}
              </button>
            );
          })
        ) : (
          effectiveOperators.map((op) => {
            const isSelected = selectedOperators.some(
              (o) => o.toLowerCase() === op.toLowerCase()
            );
            return (
              <button
                key={op}
                type="button"
                onClick={() => onToggleOperator(op)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 12px',
                  borderRadius: 16,
                  border: '1px solid',
                  borderColor: isSelected ? '#C13D78' : '#F1EDFA',
                  background: isSelected ? '#FFF1F6' : '#FFFFFF',
                  color: isSelected ? '#C13D78' : '#24152D',
                  fontSize: 11,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <Bus size={11} color={isSelected ? '#C13D78' : '#8F7E94'} />
                <span>{op}</span>
                {isSelected && <Check size={11} color="#C13D78" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
