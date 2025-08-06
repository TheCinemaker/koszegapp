import React from 'react';

export default function ScanHelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadein-fast" onClick={onClose}>
      <div 
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-4">Hogyan Szkennelj?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          A kincsek felfedezéséhez a telefonod saját, beépített Kamera alkalmazását kell használnod.
        </p>
        <ol className="text-left space-y-3 mb-6 text-gray-800 dark:text-gray-200">
          <li className="flex items-start">
            <strong className="mr-3 text-purple-600 text-xl">1.</strong>
            <span>Nyisd meg a telefonod <strong className="text-purple-600">Kamera</strong> appját.</span>
          </li>
          <li className="flex items-start">
            <strong className="mr-3 text-purple-600 text-xl">2.</strong>
            <span>Irányítsd a kamerát a városban elhelyezett QR kódra.</span>
          </li>
          <li className="flex items-start">
            <strong className="mr-3 text-purple-600 text-xl">3.</strong>
            <span>Koppints a képernyőn megjelenő sárga linkre a kincs felfedezéséhez!</span>
          </li>
        </ol>
        <button 
          onClick={onClose}
          className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition"
        >
          Értettem, vágjunk bele!
        </button>
      </div>
    </div>
  );
}
