import React from 'react';

export default function EventImageCard({ src, alt, mode = "card" }) {
  if (mode === "detail") {
    // DETAIL oldal: teljes kép olvasható, max. 70vh magas
    return (
      <div className="w-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center rounded-xl overflow-hidden">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto max-h-[70vh] object-contain"
          loading="eager"
        />
      </div>
    );
  }

  // KÁRTYA: szélesség fix, magasság rugalmas a kép arányával
  return (
    <div className="w-full bg-neutral-100 dark:bg-neutral-900 rounded-xl overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-contain"
        loading="lazy"
      />
    </div>
  );
}
