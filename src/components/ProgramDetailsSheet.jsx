import React from 'react';
import { format } from 'date-fns';

export default function ProgramDetailsSheet({ program, onClose }) {
  if (!program) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-xl mx-2 sm:mx-4 relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-600 dark:text-gray-300 text-2xl hover:text-red-600"
          aria-label="Bezárás"
        >
          ×
        </button>

        <h2 className="text-xl font-bold mb-1">{program.nev}</h2>
        <p className="text-sm text-gray-500 mb-2">
          🕘 {format(new Date(program.idopont), 'HH:mm')} –{' '}
          {program.veg_idopont ? format(new Date(program.veg_idopont), 'HH:mm') : 'ismeretlen'} <br />
          📍 {program.helyszin?.nev || 'Helyszín ismeretlen'}
        </p>

        {program.leiras && (
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line mb-4">
            {program.leiras}
          </p>
        )}

        {program.helyszin?.lat && program.helyszin?.lng && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${program.helyszin.lat},${program.helyszin.lng}&travelmode=walking`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm font-semibold text-blue-600 dark:text-blue-300 underline hover:text-blue-800"
          >
            🧭 Vigyél oda
          </a>
        )}
      </div>
    </div>
  );
}
