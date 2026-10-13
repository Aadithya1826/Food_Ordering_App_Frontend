import React, { useEffect, useRef, useState, useCallback } from 'react';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Singleton loader — only inject the script once across the app.
let scriptLoaded = false;
let scriptPromise = null;

function loadGoogleMapsScript() {
  if (scriptLoaded) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      scriptLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + MAPS_API_KEY + '&libraries=places';
    script.async = true;
    script.defer = true;
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * AddressAutocomplete
 * Props:
 *   value       – current address value (controlled)
 *   onChange    – fn(value: string) on every keystroke
 *   onSelect    – fn(address: string) when user picks a suggestion
 *   placeholder – input placeholder text
 *   inputStyle  – inline styles forwarded to the input
 *   id          – optional id attribute
 */
const AddressAutocomplete = ({ value = '', onChange, onSelect, placeholder = 'Enter address', inputStyle = {}, id }) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'geometry', 'name'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const address = place.formatted_address || place.name || (inputRef.current ? inputRef.current.value : '');
      setLocalValue(address);
      if (onChange) onChange(address);
      if (onSelect) onSelect(address);
    });
    autocompleteRef.current = ac;
  }, [onChange, onSelect]);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => { setReady(true); initAutocomplete(); })
      .catch((err) => { console.error('Google Maps failed to load:', err); setReady(true); });
    return () => {
      if (autocompleteRef.current && window.google && window.google.maps && window.google.maps.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [initAutocomplete]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);
    if (onChange) onChange(val);
  };

  const baseStyle = {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'var(--surface)',
    color: 'black',
    width: '100%',
    boxSizing: 'border-box',
    ...inputStyle,
  };

  return (
    <input
      id={id}
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={ready ? placeholder : 'Loading map suggestions...'}
      style={baseStyle}
      autoComplete="off"
    />
  );
};

export default AddressAutocomplete;
