import React from 'react';

export default function ProgramDetailsSheet({ program, onClose }) {
  if (!program) return null;

  const kezd = new Date(program.idopont).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  const vege = new Date(program.veg_idopont).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-50 p-4 rounded-t-xl max-h-[60vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">{program.nev}</h3>
        <button onClick={onClose} className="text-gray-600 text-xl">×</button>
      </div>
      <p className="text-sm text-gray-500 mb-1">
        ⏰ {kezd} – {vege}
      </p>
      <p className="text-sm text-gray-500 mb-2">
        📍 {program.helyszin?.nev}
      </p>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {program.leiras}
      </p>
      {/* Később: útvonal gomb */}
    </div>
  );
}
