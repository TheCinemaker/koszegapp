import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function DiscoveredGemCard({ gem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative w-full aspect-square rounded-2xl shadow-lg border-2 border-amber-800/30 overflow-hidden bg-cover bg-center cursor-pointer"
      style={{ backgroundImage: "url('/images/game/located.jpeg')" }}
      onClick={() => setIsOpen(o => !o)}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl"></div>

      {/* fej rész: név + kép */}
      <div className="relative z-10 flex flex-col items-center justify-center h-2/5 p-4 font-zeyada text-amber-900">
        <h3 className="text-2xl font-bold text-center line-clamp-2">{gem.name}</h3>
        <img
          src={`/images/${gem.image}`}
          alt={gem.name}
          className="w-3/4 h-auto object-cover rounded-md mt-2 shadow-inner"
        />
      </div>

      {/* lenyíló rész */}
      <div
        className={`absolute bottom-0 left-0 w-full bg-amber-50/90 dark:bg-gray-800/90 backdrop-blur-sm transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-1/2 py-4' : 'max-h-0'
        }`}
      >
        <div className="px-4 font-zeyada text-amber-900 text-base leading-relaxed">
          <p className="whitespace-pre-line">{gem.description}</p>
          <p className="mt-2 font-semibold">Rejtvény: {gem.question}</p>
        </div>
      </div>

      {/* toggle ikon */}
      <div className="absolute bottom-2 right-2 z-20 text-amber-800">
        {isOpen ? <FaChevronUp size={20}/> : <FaChevronDown size={20}/>}
      </div>
    </div>
  );
}
