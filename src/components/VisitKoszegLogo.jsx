import React from 'react';

/**
 * VisitKőszeg Official Brand Logo Icon (Jurisics Castle + Mountain Contour Emblem)
 * Design Tokens: Éjkék (#0f3d6e / #0b2740) + Régi Arany (#d6a330 / #b3985e)
 */
export function VisitKoszegIcon({ className = "w-8 h-8", color = "#d6a330" }) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Mountain V-contour base */}
      <path
        d="M10 58 L50 106 L90 58"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M26 62 L50 86 L74 62"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main Castle Tower Body */}
      <path
        d="M32 62 V34 L50 12 L68 34 V62"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Spire / Side Turret */}
      <path
        d="M68 46 H76 V28 L72 20 L68 28"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="72" y1="20" x2="72" y2="12"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Castle Roof Pinnacles */}
      <line x1="42" y1="20" x2="42" y2="10" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="58" y1="20" x2="58" y2="10" stroke={color} strokeWidth="3.5" strokeLinecap="round" />

      {/* Windows / Gate details */}
      <rect x="44" y="38" width="12" height="10" rx="2" stroke={color} strokeWidth="3.5" />
      <path d="M42 62 V52 C42 48 58 48 58 52 V62" stroke={color} strokeWidth="3.5" />
    </svg>
  );
}

/**
 * Full VisitKőszeg Header Logo Wordmark
 * Wordmark: "visit" (Éjkék/White) + "koszeg" (Régi Arany) in Sora font style
 */
export default function VisitKoszegLogo({
  showIcon = true,
  showTagline = false,
  size = "md",
  className = ""
}) {
  const iconSizeClass = size === "sm" ? "w-6 h-7" : size === "lg" ? "w-10 h-11" : "w-8 h-9";
  const textSizeClass = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl sm:text-2xl";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {showIcon && (
        <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
          <VisitKoszegIcon className={iconSizeClass} color="#d6a330" />
        </div>
      )}
      <div className="flex flex-col justify-center leading-none">
        <div className={`flex items-center font-['Sora',sans-serif] tracking-tight ${textSizeClass}`}>
          <span className="font-semibold text-[#0f3d6e] dark:text-white uppercase tracking-tight">
            visit
          </span>
          <span className="font-bold text-[#d6a330] dark:text-gold-light uppercase tracking-tight ml-0.5">
            koszeg
          </span>
        </div>
        {showTagline && (
          <span className="text-[8px] sm:text-[9px] font-semibold text-slate-400 dark:text-zinc-400 tracking-[0.25em] uppercase mt-1">
            DISCOVER • EXPLORE • EXPERIENCE
          </span>
        )}
      </div>
    </div>
  );
}
