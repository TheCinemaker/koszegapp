import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchParking, fetchParkingMachines, fetchParkingZones } from '../api';
import { isParkingPaidNow } from '../utils/parkingUtils';
import ParkingDetailMap from '../components/ParkingDetailMap'; // Az új, okos térkép komponensünk

export default function ParkingDetail() {
  const { id } = useParams();
  const [park, setPark] = useState(null);
  const [machines, setMachines] = useState([]);
  const [zone, setZone] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Minden szükséges adatot betöltünk egyszerre a hatékonyságért
    Promise.all([
      fetchParking(),
      fetchParkingMachines(),
      fetchParkingZones()
    ]).then(([parkingData, machinesData, zonesData]) => {
      const foundPark = parkingData.find(p => String(p.id) === id);
      
      if (!foundPark) {
        setError('Nem található ilyen parkoló.');
        return;
      }
      
      setPark(foundPark);
      setMachines(machinesData);

      // Megkeressük a parkolóhoz tartozó zóna adatait az ID alapján
      const foundZone = zonesData.find(z => z.id === foundPark.zone_id);
      setZone(foundZone);

    }).catch(err => {
      setError(err.message);
    }).finally(() => {
      setLoading(false);
    });
  }, [id]); // Újrafuttatja a betöltést, ha az URL-ben az ID változik

  if (error) return <p className="text-red-500 p-4 text-center">Hiba: {error}</p>;
  if (loading) return <p className="p-4 text-center">Betöltés...</p>;
  if (!park) return null; // Ha a betöltés kész, de nincs adat, ne jelenjen meg semmi

  // Kiszámoljuk a státuszt a segédfüggvénnyel
  const isPaid = isParkingPaidNow(park.hours);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <Link to="/parking" className="inline-block text-purple-600 dark:text-purple-400 hover:underline font-semibold">
          ← Vissza a parkolókhoz
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {park.image && (
          <img 
            src={`/images/parking/${park.image}`} 
            alt={park.name} 
            className="w-full md:w-1/2 h-auto object-cover rounded-xl shadow-md"
          />
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-300">{park.name}</h1>
            {isPaid !== null && (
              <span className={`text-sm font-bold px-3 py-1 rounded-full text-white shadow ${isPaid ? 'bg-red-500' : 'bg-green-500'}`}>
                {isPaid ? 'ÉPPEN FIZETŐS' : 'MOST INGYENES'}
              </span>
            )}
          </div>
          <div className="space-y-2 text-gray-800 dark:text-gray-300">
            <p><strong>Cím:</strong> {park.address}</p>
            <p><strong>Ár:</strong> {park.price}</p>
            <p><strong>Díjfizetési időszak:</strong> {park.hours}</p>
            <p><strong>Fizetési módok:</strong> {park.payment.join(', ')}</p>
            <p><strong>Kapacitás:</strong> {park.capacity || 'nem ismert'}</p>
          </div>
          
          {park.coords && (
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${park.coords.lat},${park.coords.lng}`} 
              target="_blank" rel="noopener noreferrer"
              className="inline-block mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg"
            >
              📍 Vigyél oda!
            </a>
          )}
        </div>
      </div>

      {park.zones && park.zones.length > 0 && (
        <div className="mt-8 pt-6 border-t border-purple-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-3 text-purple-800 dark:text-purple-300">Érintett utcák:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 pl-4">
            {park.zones.map((zone, idx) => <li key={idx}>{zone}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-purple-200 dark:border-gray-700">
        <h2 className="text-2xl font-semibold mb-4 text-purple-800 dark:text-purple-300">Térkép</h2>
        {park.coords && zone ? (
          <ParkingDetailMap 
            center={[park.coords.lat, park.coords.lng]} 
            zone={zone}
            machines={machines}
          />
        ) : <p>Térkép adatok betöltése...</p>}
      </div>
    </div>
  );
}
