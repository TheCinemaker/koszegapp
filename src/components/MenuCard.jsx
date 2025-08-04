import React from 'react';

// Ez a komponens már csak egy napi menü adatait kapja meg
export default function MenuCard({ dayMenu }) {
  const { leves, foetelek } = dayMenu;

  // Ha az adott naphoz nincs leves ÉS nincsenek főételek, nem jelenítünk meg semmit
  if (!leves && (!foetelek || foetelek.length === 0)) {
    return null;
  }

  return (
    <div className="mt-2 text-sm">
      {leves && (
        <p className="pl-2 border-l-2 border-gray-300 dark:border-gray-600">
          <span className="font-semibold text-gray-500">Leves: </span>
          {leves}
        </p>
      )}
      
      {foetelek && foetelek.length > 0 && (
        <div className={`mt-1 ${leves ? 'pl-2 border-l-2 border-gray-300 dark:border-gray-600' : ''}`}>
          {foetelek.map(foetel => (
            <p key={foetel.label}>
              <span className="font-bold">{foetel.label}: </span>
              {foetel.etel}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
