import React from 'react';
import MiniCard from './MiniCard';

export default function MiniAttractionCard({ item }) {
  return (
    <MiniCard
      to={`/attractions/${item.id}`}
      imageSrc={item.image}
      title={item.name}
    />
  );
}
