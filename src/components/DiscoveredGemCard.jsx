import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function DiscoveredGemCard({ gem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative w-full aspect-square bg-cover bg-center rounded-2xl shadow-lg border-2 border-amber-800/30 overflow-hidden group cursor-pointer"
      style={{ backgroundImage: "url('/images/game/located.jpeg')" }}
      onClick={() => setIsOpen(o => !o)}
    >
      {/* Pergamenes overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-2xl"></div>

      {/* Kártya teteje: kép + név */}
      <div className="relative z-10 flex flex-col items-center justify-center h-2/5 p-4 font-zeyada text-amber-900">
        <h3 className="text-2xl font-bold text-center line-clamp-2">{gem.name}</h3>
        <img
          src={`/images/${gem.image}`}
          alt={gem.name}
          className="w-3/4 h-auto object-cover rounded-md mt-2 shadow-inner"
        />
      </div>

      {/* Lenílő leírás */}
      <div
        className={`relative z-10 px-4 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[50%] opacity-100 pt-4 pb-6' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-sm leading-relaxed">{gem.description}</p>
        <p className="mt-2 font-semibold">Rejtvény: {gem.question}</p>
      </div>

      {/* Toggle ikon */}
      <div className="absolute bottom-2 right-2 z-20 text-amber-800">
        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
      </div>
    </div>
  );
}
