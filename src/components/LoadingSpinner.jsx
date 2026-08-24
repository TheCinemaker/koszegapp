import React from 'react';

/**
 * Unified LoadingSpinner Component for KőszegApp
 * Features:
 * - Rotating rounded square (squircle) spinner (border-4 border-indigo-500 border-t-transparent rounded-2xl animate-spin)
 * - Static, clean "Betöltés..." text (NEVER blinking/pulsing per design rule!)
 */
export default function LoadingSpinner({ label = "Betöltés...", size = "w-12 h-12", fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className={`${size} border-4 border-indigo-500 border-t-transparent rounded-2xl animate-spin`} />
      {label && (
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-3 tracking-wide">
          {label}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
