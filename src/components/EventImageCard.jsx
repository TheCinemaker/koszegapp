import React, { useState, useEffect } from 'react';

export default function EventImageCard({ src, alt }) {
  const [aspectRatio, setAspectRatio] = useState('16 / 9'); // Alapértelmezett, amíg a kép betöltődik

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const isPortrait = img.height > img.width;
      setAspectRatio(isPortrait ? '9 / 16' : '16 / 9');
    };
    img.onerror = () => {
      console.warn(`Hiba a kép betöltésekor: ${src}`);
    };
  }, [src]);

  return (
    <div 
      className="w-full overflow-hidden" 
      style={{ aspectRatio: aspectRatio }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover" 
      />
    </div>
  );
}
