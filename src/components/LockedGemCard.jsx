import React from 'react';
import { FaQuestion } from 'react-icons/fa';

export default function LockedGemCard() {
  return (
    <div
      className="relative w-full aspect-square bg-cover bg-center rounded-2xl shadow-lg border-2 border-amber-800/30 overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: "url('/images/game/notlocated.jpeg')",
      }}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl"></div>
      <div className="relative z-10 text-center text-white font-zeyada space-y-2 px-4">
        <FaQuestion className="text-5xl opacity-60 mx-auto" />
        <h3 className="text-xl sm:text-2xl font-bold">Rejtett kincs</h3>
        <p className="text-sm sm:text-base opacity-80">Még felfedezésre vár...</p>
      </div>
    </div>
  );
}

