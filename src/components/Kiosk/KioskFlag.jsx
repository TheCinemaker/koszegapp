// src/components/Kiosk/KioskFlag.jsx
// Inline SVG flags — always render correctly on Windows (no emoji dependency)
const flags = {
  hu: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="0.667" fill="#CE1126" />
      <rect y="0.667" width="3" height="0.667" fill="#FFFFFF" />
      <rect y="1.334" width="3" height="0.666" fill="#308D41" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#012169" />
      {/* White saltire */}
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      {/* Red saltire */}
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
      {/* White cross */}
      <rect x="27" width="6" height="30" fill="#fff" />
      <rect y="12" width="60" height="6" fill="#fff" />
      {/* Red cross */}
      <rect x="28" width="4" height="30" fill="#C8102E" />
      <rect y="13" width="60" height="4" fill="#C8102E" />
    </svg>
  ),
  de: (
    <svg viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="0.667" fill="#000000" />
      <rect y="0.667" width="3" height="0.667" fill="#DD0000" />
      <rect y="1.334" width="3" height="0.666" fill="#FFCE00" />
    </svg>
  ),
};

export default function KioskFlag({ code, className = 'w-6 h-4' }) {
  return (
    <span className={`${className} inline-block rounded-[2px] overflow-hidden shadow-sm`}>
      {flags[code] ?? null}
    </span>
  );
}
