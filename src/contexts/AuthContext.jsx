// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

// -- A MEGJELENÍTÉSI NEVEKET ITT, EGY HELYEN TÁROLJUK --
const USER_DISPLAY_NAMES = {
  'admin': 'Admin',
  'varos': 'Kőszeg Város',
  'var': 'Vár',
  'tourinform': 'Tourinform',
  'kulsos': 'Külsős Partner',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem('kozseg-user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) { return null; }
  });
  
  const [token, setToken] = useState(() => sessionStorage.getItem('kozseg-token'));

  const login = async (userId, password) => {
    const res = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Ismeretlen hiba' }));
      throw new Error(error || 'Sikertelen bejelentkezés.');
    }
    
    const { token: newToken, user: userData } = await res.json();
    
    // A szerver csak az ID-t és a jogokat adja vissza, a megjelenítési nevet itt adjuk hozzá
    const fullUserData = { ...userData, displayName: USER_DISPLAY_NAMES[userData.id] || userData.id };

    setUser(fullUserData);
    setToken(newToken);
    sessionStorage.setItem('kozseg-user', JSON.stringify(fullUserData));
    sessionStorage.setItem('kozseg-token', newToken);
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('kozseg-user');
    sessionStorage.removeItem('kozseg-token');
    window.location.replace('/admin');
  };

  const hasPermission = (requiredPermission) => {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(requiredPermission);
  };

  const value = { user, token, login, logout, hasPermission };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
