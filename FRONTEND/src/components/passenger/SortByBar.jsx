import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

/**
 * "Sort By" Bar with interactive tabs and toggling direction arrows.
 * Styled with Soft-Pink tokens and active bottom indicator.
 */
export default function SortByBar({
  filteredCount = 0,
  sortBy = 'departure',
  sortOrder = 'asc',
  onSortChange,
}) {
  const SORT_OPTIONS = [
    { key: 'departure', label: 'Departure Time' },
    { key: 'arrival', label: 'Arrival Time' },
    { key: 'price', label: 'Price' },
    { key: 'ratings', label: 'Ratings' },
    { key: 'seats', label: 'Seats' },
  ];

  const handleTabClick = (key) => {
    if (sortBy === key) {
      // Toggle order
      onSortChange(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new key with default appropriate order
      const defaultOrder = (key === 'ratings' || key === 'seats') ? 'desc' : 'asc';
      onSortChange(key, defaultOrder);
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1.5px solid #F1EDFA',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 2px 10px rgba(36, 21, 45, 0.03)',
      }}
    >
      {/* Left: Sort By label + Count Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>
          Sort by:
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#C13D78',
            background: '#FFF1F6',
            border: '1px solid #E7A0BF',
            padding: '2px 10px',
            borderRadius: 12,
          }}
        >
          Showing {filteredCount} Buses on this route
        </span>
      </div>

      {/* Right: Interactive Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortBy === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleTabClick(opt.key)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2.5px solid #C13D78' : '2.5px solid transparent',
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#24152D' : '#6E5D73',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{opt.label}</span>
              {isActive ? (
                sortOrder === 'asc' ? (
                  <ArrowUp size={13} color="#C13D78" />
                ) : (
                  <ArrowDown size={13} color="#C13D78" />
                )
              ) : (
                <ArrowUpDown size={11} color="#AB9CB0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
