import React from 'react';
import { format } from 'date-fns';

export default function ProgramDetailsSheet({ program, onClose }) {
  if (!program) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
  
      <div 
        className="max-w-xl w-full rounded-2xl shadow-2xl bg-amber-50 dark:bg-zinc-900 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FEJLÉC (ugyanaz a stílus, mint a fő modalnak) */}
        <div className="bg-amber-600 dark:bg-amber-900 text-white p-4 rounded-t-2xl flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-extrabold">{program.nev}</h2>
            {program.kiemelt && (
              <span className="mt-1 inline-block bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                KIEMELT ESEMÉNY
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-2xl hover:text-amber-200 transition-colors" aria-label="Bezárás">×</button>
        </div>

        {/* TARTALOM */}
        <div className="p-5">
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
            <p><strong>🕘 Időpont:</strong> {format(program.start, 'yyyy. MM. dd. HH:mm')} – {format(program.end, 'HH:mm')}</p>
            <p><strong>📍 Helyszín:</strong> {program.helyszin.nev}</p>
          </div>
          
          {program.leiras && (
            <div className="mt-4 text-gray-800 dark:text-gray-200 text-base leading-relaxed whitespace-pre-line border-t border-amber-200 dark:border-zinc-700 pt-4">
              {program.leiras}
            </div>
          )}

          {program.helyszin?.lat && (
            <div className="mt-6">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${program.helyszin.lat},${program.helyszin.lng}&travelmode=walking`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full font-semibold transition"
              >
                🧭 Útvonaltervezés ide
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
