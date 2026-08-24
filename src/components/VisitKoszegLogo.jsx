import React from 'react';

/**
 * VisitKőszeg Official Brand Emblem (Jurisics Castle + Mountain Contour Emblem)
 * 1-to-1 vector reproduction from the brand identity mockup.
 */
export function VisitKoszegIcon({ className = "w-8 h-9", color = "#D6A330" }) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Contour: Castle Tower + Right Turret + Outer V-Mountain Base */}
      <path
        d="M 50 112 
           L 14 62 
           V 34 
           L 32 14 
           V 4 
           H 36 
           V 14 
           H 64 
           V 4 
           H 68 
           V 14 
           L 74 20 
           V 8 
           H 78 
           V 24 
           L 86 34 
           V 62 
           Z"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner V-Mountain Ridge (Double V Contour) */}
      <path
        d="M 28 66 L 50 92 L 72 66"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Tower Window */}
      <rect
        x="43"
        y="30"
        width="14"
        height="12"
        rx="1.5"
        stroke={color}
        strokeWidth="4"
        fill="none"
      />
    </svg>
  );
}

/**
 * Full VisitKőszeg Logo Wordmark
 * Exact match to the brand identity sheet:
 * - Wordmark: "visit" (#0F3D6E/white) + "koszeg" (#D6A330) in lowercase Sora font
 * - Tagline: "DISCOVER • EXPLORE • EXPERIENCE"
 */
export default function VisitKoszegLogo({
  showIcon = true,
  showTagline = false,
  size = "md",
  className = ""
}) {
  const iconSizeClass = size === "sm" ? "w-6 h-7" : size === "lg" ? "w-10 h-12" : "w-8 h-9.5";
  const textSizeClass = size === "sm" ? "text-xl sm:text-2xl" : size === "lg" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl";

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {showIcon && (
        <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
          <VisitKoszegIcon className={iconSizeClass} color="#D6A330" />
        </div>
      )}
      <div className="flex flex-col justify-center leading-none">
        <div className={`flex items-baseline font-['Sora',sans-serif] tracking-tight ${textSizeClass}`}>
          <span className="font-normal text-[#0F3D6E] dark:text-white leading-none">
            visit
          </span>
          <span className="font-semibold text-[#D6A330] leading-none">
            koszeg
          </span>
        </div>
        {showTagline && (
          <span className="text-[7.5px] sm:text-[9px] font-semibold text-slate-500 dark:text-zinc-400 tracking-[0.22em] uppercase mt-1">
            DISCOVER • EXPLORE • EXPERIENCE
          </span>
        )}
      </div>
    </div>
  );
}
