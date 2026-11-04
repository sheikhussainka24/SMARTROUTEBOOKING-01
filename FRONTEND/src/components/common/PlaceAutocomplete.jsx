import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import { MapPin, Bus, Plane, Train, X, Loader2 } from 'lucide-react';

/**
 * SMART ROUTE — Dynamic Place Autocomplete Component
 * Connects to Google Places Autocomplete API & SMART ROUTE South Indian Transit Hubs.
 * Supports keyboard navigation, instant debounce, context chips, and mobile touch.
 */
export default function PlaceAutocomplete({
  id,
  label,
  value,
  onChange,
  onSelectPlace,
  placeholder = 'Search city, terminal or airport...',
  icon,
  required = false,
  className = '',
}) {
  const [query, setQuery] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Synchronize internal query state with parent value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const fetchPredictions = async (text) => {
    if (!text || text.trim().length === 0) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/places/autocomplete?input=${encodeURIComponent(text.trim())}`);
      if (res.success && Array.isArray(res.predictions)) {
        setPredictions(res.predictions);
        setIsOpen(res.predictions.length > 0);
      } else {
        setPredictions([]);
      }
    } catch (err) {
      console.warn('Autocomplete fetch failed:', err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) onChange(val);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length > 0) {
      setLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchPredictions(val);
      }, 150);
    } else {
      setPredictions([]);
      setIsOpen(false);
      setLoading(false);
    }
  };

  const handleSelect = (place) => {
    const selectedCity = place.city || place.mainText || place.fullText;
    setQuery(selectedCity);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onChange) onChange(selectedCity);
    if (onSelectPlace) onSelectPlace(place);
  };

  const handleClear = () => {
    setQuery('');
    setPredictions([]);
    setIsOpen(false);
    if (onChange) onChange('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen || predictions.length === 0) {
      if (e.key === 'ArrowDown' && query.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < predictions.length) {
        e.preventDefault();
        handleSelect(predictions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const renderPlaceIcon = (type) => {
    switch (type) {
      case 'bus_station':
        return <Bus size={15} color="#00F2FE" />;
      case 'airport':
        return <Plane size={15} color="#38BDF8" />;
      case 'transit_station':
        return <Train size={15} color="#10B981" />;
      default:
        return <MapPin size={15} color="#00F2FE" />;
    }
  };

  return (
    <div ref={wrapperRef} className="autocomplete-container" style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--sr-text-secondary)',
            marginBottom: 6,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {icon || <MapPin size={14} color="#00F2FE" />} {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={id}
          type="text"
          className={`input-field ${className}`}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length > 0 && predictions.length > 0) setIsOpen(true);
            else if (query.length > 0) fetchPredictions(query);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          style={{
            paddingRight: query ? 64 : 36,
            width: '100%',
          }}
        />

        {/* Status indicator / Clear button */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {loading && (
            <Loader2
              size={15}
              color="#00F2FE"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          )}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: 0,
              }}
              title="Clear text"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <ul
          className="autocomplete-dropdown"
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'rgba(12, 19, 35, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--sr-border-card)',
            borderRadius: 12,
            boxShadow: 'var(--sr-shadow-lg)',
            zIndex: 1000,
            maxHeight: 280,
            overflowY: 'auto',
            margin: 0,
            padding: '6px 0',
            listStyle: 'none',
          }}
        >
          {predictions.map((p, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={p.placeId || idx}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => handleSelect(p)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  background: isHighlighted ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                  borderLeft: isHighlighted ? '3px solid #00F2FE' : '3px solid transparent',
                  transition: 'background 0.12s ease',
                }}
              >
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: 8,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {renderPlaceIcon(p.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isHighlighted ? '#00F2FE' : '#FFFFFF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {p.mainText}
                  </div>
                  {p.secondaryText && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--sr-text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: 2,
                      }}
                    >
                      {p.secondaryText}
                    </div>
                  )}
                </div>

                {p.type && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#94A3B8',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}
                  >
                    {p.type.replace('_', ' ')}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
