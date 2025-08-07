import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

export default function DiscoveredGemCard({ gem }) {
  const [isOpen, setIsOpen] = useState(false);

  const backgroundUrl = "/images/game/located.jpeg";

  return (
    <div
      className="bg-white/50 dark:bg-gray-700/50 rounded-lg shadow hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      {/* --- A KÁRTYA ÖSSZECSUKOTT ÁLLAPOTA --- */}
      <div className="flex items-center gap-4 p-3">
        <img 
          src={`/images/${gem.image}`} 
          alt={gem.name} 
          className="w-20 h-20 object-cover rounded-md flex-shrink-0" 
        />
        <div className="flex-grow">
          <h3 className="font-bold text-lg text-purple-900 dark:text-purple-200">{gem.name}</h3>
          <p className={`text-sm text-gray-600 dark:text-gray-400 transition-all duration-300 ${isOpen ? '' : 'line-clamp-2'}`}>
            {gem.description}
          </p>
        </div>
        <FaChevronDown className={`text-2xl text-purple-500 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* --- A LENYÍLÓ, EXTRA TARTALOM --- */}
      <div 
        className={`transition-all duration-300 ease-in-out grid ${isOpen ? 'grid-rows-[1fr] opacity-100 pt-3 mt-3 border-t' : 'grid-rows-[0fr] opacity-0'}`}
        style={{ borderColor: 'rgba(177, 145, 230, 0.3)' }}
      >
        <div className="overflow-hidden px-3 pb-3">
          <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
            <p><strong>Rejtvény:</strong> {gem.question}</p>
            <p className="text-green-700 dark:text-green-400 font-semibold">
              <strong>Helyes válasz:</strong> {gem.options.find(o => o.isCorrect).text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
