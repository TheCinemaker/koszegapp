import React, { createContext, useState, useEffect } from 'react';

export const DarkModeContext = createContext(false);

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(false);

  // Betöltéskor localStorage-ból olvasom
  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true';
    setDark(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('darkMode', next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <DarkModeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}
