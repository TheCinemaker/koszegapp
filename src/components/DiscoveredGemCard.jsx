import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

export default function DiscoveredGemCard({ gem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="bg-cover bg-center rounded-2xl shadow-lg border-2 border-amber-800/30 cursor-pointer transition-all duration-300 hover:shadow-xl"
      style={{ backgroundImage: "url('/images/game/located.jpeg')" }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex flex-col h-full bg-black/10 backdrop-blur-sm p-4 rounded-2xl">
        <div className="flex-grow text-center font-zeyada text-amber-900">
          <h3 className="text-2xl font-bold line-clamp-2">{gem.name}</h3>
          <img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-24 object-cover rounded-md my-2 shadow-inner" />
        </div>
        <FaChevronDown className={`mx-auto text-xl text-amber-800/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Lenyíló rész */}
      <div className={`transition-all duration-300 ease-in-out grid ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-4 pt-2 text-center font-zeyada text-amber-900 text-xl space-y-2">
            <p className="border-t border-amber-800/20 pt-2">{gem.description}</p>
            <p className="text-green-800 font-semibold text-lg"><strong>Helyes válasz:</strong> {gem.options.find(o => o.isCorrect).text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
