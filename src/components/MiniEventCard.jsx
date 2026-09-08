import React from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import MiniCard from './MiniCard';

export default function MiniEventCard({ event }) {
  const imageSrc = event.image ? (event.image.startsWith('/') ? event.image : `/images/events/${event.image}`) : '';
  return (
    <MiniCard
      to={`/events/${event.id}`}
      imageSrc={imageSrc}
      title={event.name}
      subtitle={format(new Date(event._s), 'MMM dd.', { locale: hu })}
    />
  );
}
