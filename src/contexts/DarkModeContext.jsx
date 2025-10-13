import React, { createContext, useEffect, useMemo, useState } from 'react';

export const DarkModeContext = createContext({
  dark: false,
  toggleDark: () => {},
  setDark: () => {},
  clearPreference: () => {},
});

export function DarkModeProvider({ children }) {
  // Induláskor: ha van mentett preferencia, azt használjuk; különben a rendszer beállítást
  const getInitial = () => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') return true;
    if (saved === 'false') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  };

  const [dark, setDark] = useState(getInitial);

  // 1) Biztonsági törlés: ha valaha „beragadt” a .dark, szedd le mountkor
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // 2) Minden változáskor SYNC: state -> <html>.class + localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', dark ? 'true' : 'false');
  }, [dark]);

  // 3) Ha nincs explicit mentett preferencia, kövesd a rendszer változását
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true' || saved === 'false') return; // user override -> ne írjuk felül
    const handler = (e) => setDark(e.matches);
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler);
    };
  }, []);

  const toggleDark = () => setDark((d) => !d);
  const clearPreference = () => {
    localStorage.removeItem('darkMode');
    setDark(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
  };

  const value = useMemo(
    () => ({ dark, toggleDark, setDark, clearPreference }),
    [dark]
  );

  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
}
