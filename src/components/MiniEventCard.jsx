import React from 'react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import MiniCard from './MiniCard';

export default function MiniEventCard({ event }) {
  return (
    <MiniCard
      to={`/events/${event.id}`}
      imageSrc={`/images/events/${event.image}`}
      title={event.name}
      subtitle={format(new Date(event._s), 'MMM dd.', { locale: hu })}
    />
  );
}
