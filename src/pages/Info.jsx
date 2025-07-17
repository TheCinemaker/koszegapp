import React, { useState, useEffect } from 'react';
import { fetchInfo } from '../api';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Info() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInfo()
      .then(data => setItems(data))
      .catch(err => setError(err.message));
  }, []);

  // 📞 Telefonszám felismerő
  const linkifyPhones = (text) => {
    if (!text) return "";
    return text.split(/(\+36\d{7,}|06\d{7,})/g).map((part, i) => {
      if (/^\+36\d{7,}$/.test(part) || /^06\d{7,}$/.test(part)) {
        return (
          <a 
            key={i} 
            href={`tel:${part.replace(/\s/g, '')}`} 
            className="text-cyan-600 underline hover:text-pink-600 transition"
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (error) return <p className="text-red-500 p-4">Hiba: {error}</p>;
  if (!items.length) return <p className="p-4">Betöltés…</p>;

  return (
    <div className="p-4">
      <div className="space-y-4">
        {items.map(item => (
          item.id === 99 ? (
            <Link
              key={item.id}
              to={`/info/${item.id}`}
              className="block bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-md transition transform hover:scale-[1.02] hover:bg-white/40"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">{item.title}</h2>
                  <p className="text-rose-50 dark:text-amber-100 leading-relaxed line-clamp-2">
                    {item.content.slice(0, 100)}...
                  </p>
                </div>
                <div className="text-2xl text-indigo-500 dark:text-amber-100  font-bold">➡</div>
              </div>
            </Link>
          ) : (
            <div
              key={item.id}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-4 shadow-md"
            >
              <h2 className="text-xl font-semibold mb-2 text-indigo-500 dark:text-indigo-700">{item.title}</h2>
              <p className="text-rose-50 dark:text-amber-100 leading-relaxed">
                {linkifyPhones(item.content)}
              </p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
