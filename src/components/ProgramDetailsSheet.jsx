import React from 'react';
// ÚJ: Importáljuk a fordító hookot
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export default function ProgramDetailsSheet({ program, onClose }) {
  // ÚJ: Használjuk a hookot, hogy megkapjuk az aktuális nyelvet
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (!program) {
    return null;
  }

  return (
    <>
      {/* Háttér */}
      <div 
        className="fixed inset-0 bg-black/40 z-[1000] animate-fadein-fast"
        onClick={onClose}
      />

      {/* A "Sheet" (a felugró lap) */}
      <div className="fixed bottom-0 left-0 right-0 z-[1001] bg-white dark:bg-zinc-800 rounded-t-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
        
        {/* Bezárás gomb */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          aria-label="Bezárás"
        >
          &times;
        </button>

        {/* Cím */}
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-200 pr-8">
          {/* JAVÍTVA: Az aktuális nyelvnek megfelelő nevet jelenítjük meg */}
          {program.nev[currentLang] || program.nev.hu}
        </h2>

        {/* Kiemelt jelzés */}
        {program.kiemelt && (
          <div className="mt-2 inline-block bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
            ⭐ Kiemelt esemény
          </div>
        )}
        
        <div className="mt-4 space-y-3 text-gray-700 dark:text-gray-300">
          {/* Időpont */}
          <div className="flex items-center gap-3">
            <span className="text-xl">🕘</span>
            <span>{format(program.start, 'yyyy. MMMM d. HH:mm')} – {format(program.end, 'HH:mm')}</span>
          </div>

          {/* Helyszín */}
          <div className="flex items-center gap-3">
            <span className="text-xl">📍</span>
            {/* JAVÍTVA: Az aktuális nyelvnek megfelelő helyszínnevet jelenítjük meg */}
            <span>{program.helyszin.nev[currentLang] || program.helyszin.nev.hu}</span>
          </div>
        </div>

        {/* Leírás */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
          <p className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
            {/* JAVÍTVA: Az aktuális nyelvnek megfelelő leírást jelenítjük meg */}
            {program.leiras[currentLang] || program.leiras.hu}
          </p>
        </div>
      </div>
    </>
  );
}
