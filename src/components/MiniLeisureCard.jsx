import React from 'react';
import MiniCard from './MiniCard';

export default function MiniLeisureCard({ item }) {
  return (
    <MiniCard
      to={`/leisure/${item.id}`}
      imageSrc={`/images/leisure/${item.image}`}
      title={item.name}
    />
  );
}
