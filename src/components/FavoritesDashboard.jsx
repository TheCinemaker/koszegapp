import React from 'react';
import { Link } from 'react-router-dom';
import MiniAttractionCard from './MiniAttractionCard';
import MiniEventCard from './MiniEventCard';
import MiniLeisureCard from './MiniLeisureCard';
import MiniGastroCard from './MiniGastroCard'; //

export default function FavoritesDashboard({ attractions, events, leisure, restaurants, onClose }) {
  const hasContent = attractions.length > 0 || events.length > 0 || leisure.length > 0 || (restaurants && restaurants.length > 0);

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 animate-fadein-fast">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-purple-800 dark:text-purple-300">Kedvenceim</h3>
          <button onClick={onClose} className="text-xl text-gray-500 hover:text-gray-800 dark:hover:text-white">×</button>
        </div>
        
        {hasContent ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {attractions.length > 0 && (
              <section>
                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Elmentett Helyek</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                  {attractions.map(item => <MiniAttractionCard key={item.id} item={item} />)}
                </div>
              </section>
            )}

            {events.length > 0 && (
              <section>
                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Közelgő Eseményeid</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                  {events.map(item => <MiniEventCard key={item.id} event={item} />)}
                </div>
              </section>
            )}

            {leisure.length > 0 && (
              <section>
                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Szabadidő</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                  {leisure.map(item => <MiniLeisureCard key={item.id} item={item} />)}
                </div>
              </section>
            )}

            {restaurants && restaurants.length > 0 && (
              <section>
                <h4 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400">Kedvenc Vendéglátóhelyek</h4>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                  {restaurants.map(item => <MiniGastroCard key={item.id} item={item} />)}
                </div>
              </section>
            )}
            
          </div>
        ) : (
          <p className="text-sm text-center py-4 text-gray-600 dark:text-gray-400">Még nincsenek kedvenceid.</p>
        )}
      </div>
    </div>
  );
}
