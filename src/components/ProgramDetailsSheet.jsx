import React from 'react';
import { format } from 'date-fns';

export default function ProgramDetailsSheet({ program, onClose }) {
  if (!program) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6">
      <div className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 rounded-2xl shadow-2xl max-w-xl w-full p-4 relative">
        {/* X close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-xl font-bold text-amber-900 dark:text-amber-200 hover:scale-125 transition"
          aria-label="Bezárás"
        >
          ✖
        </button>

        {/* Title */}
        <h2 className="text-2xl font-extrabold mb-2">{program.nev}</h2>

        {/* Time & location */}
        <p className="text-sm mb-3">
          🕘 {format(new Date(program.idopont), 'yyyy.MM.dd – HH:mm')}
        </p>
        {program.veg_idopont && (
          <p className="text-sm mb-3">
            ⏳ Vége: {format(new Date(program.veg_idopont), 'HH:mm')}
          </p>
        )}
        {program.helyszin?.nev && (
          <p className="text-sm mb-3">
            📍 {program.helyszin.nev}
          </p>
        )}

        {/* Leírás */}
        {program.leiras && (
          <div className="mt-4 text-sm leading-relaxed whitespace-pre-line">
            {program.leiras}
          </div>
        )}

        {/* Térkép gomb – ha van GPS */}
        {program.helyszin?.lat && program.helyszin?.lng && (
          <div className="mt-6">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${program.helyszin.lat},${program.helyszin.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded-full font-semibold transition"
            >
              🧭 Megnyitás térképen
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
