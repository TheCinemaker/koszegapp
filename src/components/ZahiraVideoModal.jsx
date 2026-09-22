import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoVideocamOutline, IoPersonOutline, IoSparklesOutline } from 'react-icons/io5';

const TABS = [
  { id: 'intro', label: 'Bemutatkozás', icon: IoPersonOutline, src: '/videos/zahira-intro.mp4', fallback: 'A bemutatkozó videó hamarosan érkezik!' },
  { id: 'weekly', label: 'Heti ajánló', icon: IoSparklesOutline, src: '/videos/zahira-weekly.mp4', fallback: 'A heti ajánló videó hamarosan érkezik!' },
];

export default function ZahiraVideoModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('intro');
  const [unavailable, setUnavailable] = useState({});

  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', duration: 0.5 }}
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-md bg-surface-card dark:bg-surface-card-dark rounded-surface shadow-floating overflow-hidden z-10"
        >
          <div className="flex items-center justify-between p-4 bg-brand dark:bg-brand-deep border-b border-gold/30">
            <div className="flex items-center gap-3">
              <img
                src="/images/mascot/zahira-avatar.jpg"
                alt="Zahira"
                className="w-9 h-9 rounded-full object-cover border-2 border-gold/50"
              />
              <p className="text-sm font-bold text-white">Zahira</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
              aria-label="Bezárás"
            >
              <IoClose className="text-lg text-white" />
            </button>
          </div>

          <div className="flex border-b border-brand/10 dark:border-white/10 bg-surface-card dark:bg-surface-card-dark">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 px-3 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${activeTab === id ? 'border-gold text-gold-text dark:text-gold-light' : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-brand dark:hover:text-white'}`}
              >
                <Icon className="text-base" />
                {label}
              </button>
            ))}
          </div>

          <div className="w-full h-[55vh] max-h-[480px] bg-black flex items-center justify-center">
            {!unavailable[tab.id] ? (
              <video
                key={tab.id}
                src={tab.src}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                onError={() => setUnavailable((u) => ({ ...u, [tab.id]: true }))}
              />
            ) : (
              <div className="text-center px-6">
                <IoVideocamOutline className="text-4xl text-white/40 mx-auto mb-3" />
                <p className="text-sm font-semibold text-white/80">{tab.fallback}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
