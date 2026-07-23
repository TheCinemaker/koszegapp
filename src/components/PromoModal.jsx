import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { IoCloseOutline, IoSparklesOutline } from 'react-icons/io5';

/**
 * JSON-vezérelt promo modal.
 *
 * Működés:
 *  - Lekéri a /data/promos.json fájlból az aktív promóciókat.
 *  - Ellenőrzi a jelenlegi dátumot (start_at és end_at között).
 *  - sessionStorage-ben promónként jegyzi, hogy a user már látta.
 *  - A tartalom többnyelvű (content.hu / content.en / content.de), 'hu' fallbackkel.
 */
export default function PromoModal() {
  const { i18n } = useTranslation();
  const [promo, setPromo] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPromo = async () => {
      try {
        const res = await fetch('/data/promos.json');
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0 || cancelled) return;

        const now = new Date();

        // Kiszűrjük az aktív és dátum szerint érvényes kampányokat
        const activePromos = data.filter((item) => {
          if (!item.active) return false;
          const start = new Date(item.start_at);
          const end = new Date(item.end_at);
          return now >= start && now <= end;
        });

        if (activePromos.length === 0) return;

        const selectedPromo = activePromos[0];
        const seen = sessionStorage.getItem(`promo_shown_${selectedPromo.id}`) === 'true';
        if (seen) return;

        setPromo(selectedPromo);
        setTimeout(() => {
          if (!cancelled) setVisible(true);
        }, 800);
      } catch (err) {
        console.error('Promo JSON load failed:', err);
      }
    };

    loadPromo();
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => {
    setVisible(false);
    if (promo) {
      sessionStorage.setItem(`promo_shown_${promo.id}`, 'true');
    }
  };

  if (!promo) return null;

  const lang = (i18n.language || 'hu').split('-')[0];
  const c = promo.content?.[lang] || promo.content?.hu;
  if (!c) return null;

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Kártya */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: 'spring', duration: 0.5 }}
            role="dialog"
            aria-modal="true"
            aria-label={c.title}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Fejléc: kép, ha van, különben sötét gradient */}
            <div className="relative h-48 flex flex-col justify-end overflow-hidden">
              {promo.image_url ? (
                <>
                  <img
                    src={promo.image_url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
              )}

              {/* Bezárás */}
              <button
                onClick={close}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center hover:bg-black/50 active:scale-95 transition-all"
                aria-label="Bezárás"
              >
                <IoCloseOutline className="text-xl" />
              </button>

              {/* Badge + cím */}
              <div className="relative z-10 p-6 flex flex-col items-start">
                {c.badge && (
                  <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] font-semibold uppercase tracking-widest">
                    {c.badge}
                  </span>
                )}
                <h2 className="text-2xl font-extrabold text-white mt-2.5 leading-tight tracking-tight">
                  {c.title}
                </h2>
                {c.subtitle && (
                  <p className="text-xs font-semibold text-white/70 mt-1">{c.subtitle}</p>
                )}
              </div>
            </div>

            {/* Törzs */}
            <div className="p-6 md:p-8">
              {c.body && (
                <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 leading-relaxed mb-4">
                  {c.body}
                </p>
              )}

              {c.highlight && (
                <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/60 dark:border-indigo-900/20 mb-6">
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <IoSparklesOutline className="text-base flex-shrink-0" />
                    {c.highlight}
                  </p>
                </div>
              )}

              <Link
                to={promo.cta_route || '/events'}
                onClick={close}
                className="flex items-center justify-center w-full py-4 px-6 rounded-xl bg-indigo-500 hover:opacity-90 text-white text-sm font-bold shadow-sm shadow-indigo-500/20 transition-opacity text-center"
              >
                {c.cta || 'Mutasd'}
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
