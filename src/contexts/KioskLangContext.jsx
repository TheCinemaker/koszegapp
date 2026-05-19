import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { hu } from '../locales/kiosk/hu';
import { en } from '../locales/kiosk/en';
import { de } from '../locales/kiosk/de';

const translations = { hu, en, de };

export const KioskLangContext = createContext(null);

export function KioskLangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('kiosk-lang') || 'hu'
  );
  const [highContrast, setHighContrastState] = useState(
    () => localStorage.getItem('kiosk-contrast') === 'high'
  );

  const setLang = useCallback((newLang) => {
    localStorage.setItem('kiosk-lang', newLang);
    setLangState(newLang);
  }, []);

  const toggleContrast = useCallback(() => {
    setHighContrastState(prev => {
      const next = !prev;
      localStorage.setItem('kiosk-contrast', next ? 'high' : 'normal');
      return next;
    });
  }, []);

  // Sync html attribute + force light mode when high-contrast is active
  useEffect(() => {
    const el = document.documentElement;
    if (highContrast) {
      el.setAttribute('data-kiosk-hc', '1');
      el.classList.remove('dark');
    } else {
      el.removeAttribute('data-kiosk-hc');
    }
  }, [highContrast]);

  const t = useCallback((key) => {
    const parts = key.split('.');
    let val = translations[lang];
    for (const part of parts) {
      if (val == null) return key;
      val = val[part];
    }
    return val ?? key;
  }, [lang]);

  return (
    <KioskLangContext.Provider value={{ lang, setLang, t, highContrast, toggleContrast }}>
      {children}
    </KioskLangContext.Provider>
  );
}

export function useKioskLang() {
  const ctx = useContext(KioskLangContext);
  if (!ctx) throw new Error('useKioskLang must be used within KioskLangProvider');
  return ctx;
}
