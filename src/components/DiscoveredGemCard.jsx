import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

export default function DiscoveredGemCard({ gem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="bg-cover bg-center rounded-2xl shadow-lg border-2 border-amber-800/30 cursor-pointer transition-all duration-300"
      style={{ backgroundImage: "url('/images/game/located.jpeg')" }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex flex-col h-full bg-black/10 backdrop-blur-[2px] p-3 rounded-2xl">
        {/* Felső, mindig látható rész */}
        <div className="flex-grow text-center font-zeyada text-amber-900">
          <h3 className="text-xl font-bold line-clamp-2">{gem.name}</h3>
          <img src={`/images/${gem.image}`} alt={gem.name} className="w-full h-20 object-cover rounded-md my-1 shadow-inner" />
        </div>
        <FaChevronDown className={`mx-auto text-lg text-amber-800/70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Lenyíló, extra tartalom */}
      <div className={`transition-all duration-500 ease-in-out grid ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-3 pt-2 text-center font-zeyada text-amber-900 text-xl space-y-2">
            <p className="border-t border-amber-800/20 pt-2 font-normal text-base">{gem.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
