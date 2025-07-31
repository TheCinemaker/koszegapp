import React from 'react';
import { Link } from 'react-router-dom';
import { isParkingPaidNow } from '../utils/parkingUtils'; // <<< ÚJ IMPORT

export default function Parking({ parking, loading }) {
  if (loading) return <p className="p-4 text-center">Betöltés...</p>;

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <Link to="/parking-map" className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition shadow-lg text-lg font-semibold">
          Parkolási zónák térképen 🗺
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parking.map(p => {
          const isPaid = isParkingPaidNow(p.hours);
          return (
            <div key={p.id} className="bg-white/20 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-md hover:shadow-2xl transition duration-300 overflow-hidden flex flex-col">
              {p.image && <img src={`/images/parking/${p.image}`} alt={p.name} className="w-full h-40 object-cover" />}
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-300 flex-grow">{p.name}</h3>
                  {isPaid !== null && (
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full text-white ${isPaid ? 'bg-red-500' : 'bg-green-500'}`}>
                      {isPaid ? 'FIZETŐS' : 'INGYENES'}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-400">{p.address}</p>
                <p className="text-gray-800 dark:text-gray-300 font-semibold">{p.price}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Kapacitás: {p.capacity || 'nem ismert'}</p>
                <Link to={`/parking/${p.id}`} className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition mt-3 self-start">
                  Részletek
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
