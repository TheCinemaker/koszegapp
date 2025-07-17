// src/components/CustomDropdown.js

import React, { useState, useRef, useEffect } from 'react';

// Egy SVG ikon a lenyíló nyílhoz
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);

// Formázó függvény a megjelenítendő szöveghez
const formatLabel = (value) => {
  if (value === 'all') return 'Összes típus';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function CustomDropdown({ options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Hook a "kattints kívülre" esemény kezelésére
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full md:w-64" ref={dropdownRef}>
      {/* A gomb, ami mutatja az aktuális értéket és nyitja a menüt */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-between w-full
          px-4 py-2 rounded-lg
          bg-white/20 dark:bg-gray-800/80 backdrop-blur-sm
          rounded-xl shadow-lg
          text-rose-50 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-indigo-500
          transition duration-200
        "
      >
        <span>{formatLabel(value)}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {/* A lenyíló opciók listája */}
      {isOpen && (
        <div
          className="
            absolute z-20 w-full mt-2
            bg-white/50 dark:bg-gray-800/90
            backdrop-blur-xl rounded-lg shadow-2xl
            overflow-hidden
            ring-1 ring-black ring-opacity-5
            transform transition-all duration-200 ease-out
            origin-top
            opacity-100 scale-100
          "
        >
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`
                  block w-full text-left px-4 py-2 text-sm
                  transition
                  ${value === option
                    ? 'bg-purple-600 text-white'
                    : 'text-rose-50 dark:text-gray-100 hover:bg-indigo-500 hover:text-white'
                  }
                `}
              >
                {formatLabel(option)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
