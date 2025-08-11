import React from 'react';
import { FaChevronRight } from 'react-icons/fa';

export default function DiscoveredGemCard({ gem, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-amber-800/30 bg-cover bg-center focus:outline-none focus:ring-2 focus:ring-amber-600"
      style={{ backgroundImage: "url('/images/game/located.jpeg')" }}
      aria-label={`${gem.name} megnyitása`}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />

      <div className="relative z-10 h-full flex flex-col p-3 text-amber-900">
        {/* Cím (kézírás), rövid, jól olvasható méretben */}
        <h3 className="font-zeyada text-2xl font-bold text-center drop-shadow">
          {gem.name}
        </h3>

        {/* Kép */}
        <img src={`/images/game/${gem.image}`} alt={gem.name} className="w-full h-20 object-cover rounded-md my-1 shadow-inner" />

        {/* CTA sáv alul */}
        <div className="mt-auto flex items-center justify-center gap-2 font-sans text-sm font-semibold text-amber-900/80">
          <span>Részletek</span>
          <FaChevronRight className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}
