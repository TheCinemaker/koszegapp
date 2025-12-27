import React from 'react';
import MiniCard from './MiniCard';

export default function MiniGastroCard({ item }) {
  return (
    <MiniCard
      to={`/gastronomy/${item.id}`}
      imageSrc={`/images/gastro/${item.image}`}
      title={item.name}
    />
  );
}
