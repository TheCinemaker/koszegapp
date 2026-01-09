// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    getSession();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        setUser({ ...authUser, ...data }); // Combine Auth user + Profile data
      } else {
        // Fallback if profile doesn't exist yet (e.g. slight delay in trigger)
        setUser(authUser);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      setUser(authUser);
    } finally {
      setLoading(false);
    }
  };

  const login = async (nickname, password) => {
    // Auto-generate email from nickname
    const generatedEmail = `${nickname.toLowerCase().trim()}@gmail.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: generatedEmail,
      password
    });
    if (error) throw error;
    return data;
  };

  const register = async (email, password, fullName, nickname, isProvider = false) => {
    // Auto-generate email from nickname
    const generatedEmail = `${nickname.toLowerCase().trim()}@gmail.com`;

    const { data, error } = await supabase.auth.signUp({
      email: generatedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          nickname: nickname
        }
      }
    });

    if (error) throw error;

    // Update profile with nickname and role
    if (data.user) {
      await supabase.from('profiles').update({
        nickname,
        role: isProvider ? 'provider' : 'client',
        email: generatedEmail,
        full_name: fullName
      }).eq('id', data.user.id);
    }

    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Helper for role-based access
  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    login,
    register,
    logout,
    hasRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
