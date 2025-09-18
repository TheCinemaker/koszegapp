import React, { useState, useEffect } from 'react';

export default function EventImageCard({ src, alt, mode = "card" }) {
  const [useContain, setUseContain] = useState(false);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (!img.width || !img.height) return;
      const ratio = img.width / img.height;
      // ha extrém álló (poszter) vagy extrém széles → contain
      if (ratio < 1 || ratio > 3) setUseContain(true);
    };
    img.onerror = () => {
      console.warn(`Hiba a kép betöltésekor: ${src}`);
    };
  }, [src]);

  // --- DETAIL oldalon nagy kép: contain + max-height
  if (mode === "detail") {
    return (
      <div className="w-full max-h-[70vh] bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center rounded-xl overflow-hidden">
        <img
          src={src}
          alt={alt}
          className="max-h-[70vh] w-auto object-contain"
          loading="eager"
        />
      </div>
    );
  }

  // --- KÁRTYA: fix 16:9 keret, sose lóg ki
  return (
    <div className="w-full aspect-[16/9] bg-neutral-100 dark:bg-neutral-900 overflow-hidden rounded-xl">
      <img
        src={src}
        alt={alt}
        className={`w-full h-full ${useContain ? "object-contain" : "object-cover"}`}
        loading="lazy"
      />
    </div>
  );
}
