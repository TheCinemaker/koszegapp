import React, { useState, useEffect, useMemo } from 'react';
import { fetchInfo } from '../api';
import { Link } from 'react-router-dom';
import { FaAmbulance, FaFirstAid, FaFireExtinguisher, FaPills, FaPaw, FaInfoCircle, FaRestroom, FaParking, FaMobileAlt } from 'react-icons/fa';

// Ikon-leképezés
const iconMap = {
  FaAmbulance, FaFirstAid, FaFireExtinguisher, FaPills, FaPaw, FaInfoCircle, FaRestroom, FaParking, FaMobileAlt
};

const linkifyPhones = (text) => {
  if (!text) return "";
  // Fejlesztett regex, ami jobban kezeli a formázást
  return text.split(/(\+?\d{2}[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}|\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4})/g).map((part, i) => {
    if (/(\+?\d{2}[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}|\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4})/.test(part)) {
      return <a key={i} href={`tel:${part.replace(/\s/g, '')}`} className="text-purple-600 dark:text-purple-400 underline hover:text-rose-500 transition">{part}</a>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default function Info() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInfo()
      .then(data => setItems(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // useMemo segítségével csoportosítjuk az elemeket kategória szerint
  const groupedItems = useMemo(() => {
    return items.reduce((acc, item) => {
      const category = item.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [items]);
  
  // A kategóriák sorrendjét és címét itt definiáljuk
  const categoryOrder = [
    { key: 'emergency', title: 'Segélyhívók és Ügyelet' },
    { key: 'health', title: 'Egészségügy' },
    { key: 'tourism', title: 'Turisztikai Információk' },
    { key: 'app', title: 'Az Alkalmazásról' }
  ];

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (loading) return <p className="p-4 text-center">Betöltés...</p>;

  return (
    <div className="p-4 space-y-8">
      {categoryOrder.map(({ key, title }) => (
        groupedItems[key] && (
          <section key={key}>
            <h2 className="text-2xl font-bold mb-4 text-purple-800 dark:text-purple-300 border-b-2 border-purple-200 dark:border-purple-700 pb-2">{title}</h2>
            <div className="space-y-4">
              {groupedItems[key].map(item => {
                const IconComponent = iconMap[item.icon] || FaInfoCircle;
                // A "Rólunk" kártya (ID: info-99) különleges link stílust kap
                return item.id === 'info-99' ? (
                  <Link key={item.id} to={`/info/${item.id}`} className="block bg-white/30 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 shadow-md transition transform hover:scale-[1.02] hover:shadow-xl">
                    <div className="flex items-center">
                      <IconComponent className="text-3xl text-purple-500 mr-4 flex-shrink-0" />
                      <div className="flex-grow">
                        <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-300">{item.title}</h3>
                        <p className="text-gray-700 dark:text-gray-400 leading-relaxed line-clamp-2 text-sm">{item.content}</p>
                      </div>
                      <div className="text-2xl text-purple-500 font-bold ml-4">→</div>
                    </div>
                  </Link>
                ) : (
                  <div key={item.id} className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 shadow-md flex items-start">
                    <IconComponent className="text-2xl text-purple-500 mt-1 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300">{item.title}</h3>
                      <p className="text-gray-800 dark:text-gray-300 leading-relaxed">{linkifyPhones(item.content)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )
      ))}
    </div>
  );
}
