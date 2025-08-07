import React from 'react';
import { FaQuestion } from 'react-icons/fa';

export default function LockedGemCard() {
  return (
    <div className="flex items-center justify-center gap-4 bg-black/10 dark:bg-gray-900/50 backdrop-blur-sm p-3 rounded-lg shadow-inner h-full border-2 border-dashed border-gray-500/50">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <FaQuestion className="text-4xl mx-auto opacity-50" />
        <h3 className="font-semibold mt-2 text-sm">Rejtett Kincs</h3>
        <p className="text-xs opacity-70">Még felfedezésre vár...</p>
      </div>
    </div>
  );
}
