import React from 'react';
import { Link } from 'react-router-dom';

export default function FavoritesDropdown({ attractions, events, leisure, onClose }) {
  // A onClose egy függvény, amivel bezárhatjuk a menüt egy linkre kattintás után
  return (
    <div className="absolute right-0 mt-2 w-64 bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5">
      <div className="p-4">
        <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-3">Személyes Programfüzet</h3>
        
        {attractions.length > 0 && (
          <div className="mb-3">
            <h4 className="font-semibold text-sm mb-1 text-gray-600 dark:text-gray-400">Helyek</h4>
            <ul>{attractions.map(item => <li key={item.id}><Link to={`/attractions/${item.id}`} onClick={onClose} className="text-sm hover:underline">{item.name}</Link></li>)}</ul>
          </div>
        )}

        {events.length > 0 && (
          <div className="mb-3">
            <h4 className="font-semibold text-sm mb-1 text-gray-600 dark:text-gray-400">Események</h4>
            <ul>{events.map(item => <li key={item.id}><Link to={`/events/${item.id}`} onClick={onClose} className="text-sm hover:underline">{item.name}</Link></li>)}</ul>
          </div>
        )}

        {leisure.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-1 text-gray-600 dark:text-gray-400">Szabadidő</h4>
            <ul>{leisure.map(item => <li key={item.id}><Link to={`/leisure/${item.id}`} onClick={onClose} className="text-sm hover:underline">{item.name}</Link></li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
