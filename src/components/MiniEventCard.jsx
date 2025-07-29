import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

export default function MiniEventCard({ event }) {
  return (
    <Link to={`/events/${event.id}`} className="flex-shrink-0 w-48 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg shadow-md overflow-hidden snap-start transition-transform hover:-translate-y-1">
      <img src={`/images/events/${event.image}`} alt={event.name} className="w-full h-24 object-cover" />
      <div className="p-2">
        <h4 className="font-semibold text-sm truncate text-purple-900 dark:text-purple-300">{event.name}</h4>
        <p className="text-xs text-gray-700 dark:text-gray-400">{format(new Date(event._s), 'MMM dd.', { locale: hu })}</p>
      </div>
    </Link>
  );
}
