import React from 'react';
import { Link } from 'react-router-dom';

export default function MiniGastroCard({ item }) {
  return (
    <Link to={`/gastronomy/${item.id}`} className="flex-shrink-0 w-48 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg shadow-md overflow-hidden snap-start transition-transform hover:-translate-y-1">
      <img src={`/images/gastro/${item.image}`} alt={item.name} className="w-full h-24 object-cover" />
      <div className="p-2">
        <h4 className="font-semibold text-sm truncate text-purple-900 dark:text-purple-300">{item.name}</h4>
      </div>
    </Link>
  );
}
