import React from 'react';

/**
 * VisitKőszeg közös UI alapkomponensek.
 * Helye: src/components/ui.jsx
 *
 * Cél: a kézzel újraépített mintákat egy helyre húzni.
 * Egy stílusdöntés = egy fájl módosítás.
 */

// ---------------------------------------------------------------------------
// Card — az alap fehér/sötét kártya.
// ---------------------------------------------------------------------------
export function Card({ variant = 'default', className = '', children, ...rest }) {
  const base = {
    default:
      'bg-white dark:bg-zinc-900 rounded-card border border-slate-200/80 dark:border-white/10 shadow-card',
    featured:
      'bg-brand border border-brand/30 text-white shadow-card',
    surface:
      'bg-white dark:bg-zinc-900 rounded-surface border border-slate-200/80 dark:border-white/10 shadow-card',
  }[variant];

  return (
    <div className={`${base} ${className}`} {...rest}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IconButton — a 44px-es kör gomb (vissza, kedvenc, bezárás).
// ---------------------------------------------------------------------------
export function IconButton({ variant = 'default', className = '', children, ...rest }) {
  const base = {
    default:
      'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-white shadow-card hover:opacity-90',
    glass:
      'bg-black/30 backdrop-blur-xl border border-white/20 text-white hover:bg-black/40',
  }[variant];

  return (
    <button
      className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-all ${base} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Badge — pill címke (uppercase, tracking-widest).
// ---------------------------------------------------------------------------
export function Badge({ tone = 'neutral', className = '', children, ...rest }) {
  const base = {
    brand:
      'bg-brand/10 text-brand dark:text-brand-light border border-brand/20',
    neutral:
      'bg-gray-900/[0.06] dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-900/[0.06] dark:border-white/10',
    live:
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
    gold:
      'bg-gold/20 text-gold-light border border-gold/40',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${base} ${className}`}
      {...rest}
    >
      {tone === 'live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SectionLabel — eyebrow felirat szekciók fölé.
// ---------------------------------------------------------------------------
export function SectionLabel({ className = '', children, ...rest }) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500 ${className}`}
      {...rest}
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// PrimaryButton / SecondaryButton — gomb komponensek.
// ---------------------------------------------------------------------------
export function PrimaryButton({ className = '', children, ...rest }) {
  return (
    <button
      className={`h-11 px-6 rounded-control bg-brand hover:opacity-90 text-white font-bold text-sm flex items-center justify-center gap-2 transition-opacity ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ className = '', children, ...rest }) {
  return (
    <button
      className={`h-11 px-6 rounded-control bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
