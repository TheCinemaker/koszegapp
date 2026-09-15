import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { IoLockClosedOutline, IoArrowBack } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import EvolutionTimeMachine from '../components/EvolutionTimeMachine';
import SEO from '../components/SEO';

const PIN_CODE = '0169';

export default function TimeMachinePage() {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem('timemachine_unlocked') === 'true'
  );
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === PIN_CODE) {
      localStorage.setItem('timemachine_unlocked', 'true');
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPinInput('');
    }
  };

  if (unlocked) {
    return (
      <div className="min-h-screen bg-[#030303] text-white pt-12 pb-24 px-4 relative">
        <SEO title="visitKőszeg Időgép" description="KőszegApp evolúció bemutató" url="/timemachine" />
        <Link
          to="/"
          className="fixed top-6 left-6 z-[100] w-12 h-12 flex items-center justify-center
                     rounded-full bg-white/[0.05] backdrop-blur-2xl border border-white/[0.1]
                     hover:bg-white/[0.15] hover:scale-110 active:scale-95 transition-all text-white shadow-2xl"
        >
          <IoArrowBack size={18} />
        </Link>
        <div className="pt-8">
          <EvolutionTimeMachine />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center px-4 relative">
      <SEO title="visitKőszeg Időgép - Belépés" description="Titkos evolúció nézet" url="/timemachine" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl text-center backdrop-blur-2xl"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
          <IoLockClosedOutline size={32} />
        </div>
        <h2 className="text-2xl font-extrabold mb-2">visitKőszeg Időgép</h2>
        <p className="text-xs text-slate-400 mb-6">Írd be a titkos belépési kulcsot (PIN kód) a demó megtekintéséhez!</p>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setError(false); }}
              placeholder="PIN"
              className="w-full text-center text-2xl font-mono tracking-[0.4em] py-3 rounded-2xl bg-black/60 border border-white/10 focus:border-indigo-500 focus:outline-none text-white"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-xs text-rose-400 font-semibold">
              ⚠️ Helytelen belépési kulcs!
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-500 hover:opacity-90 font-bold text-sm text-white transition-all shadow-lg shadow-indigo-500/30"
          >
            Belépés az Időgépbe ➔
          </button>
        </form>
      </motion.div>
    </div>
  );
}
