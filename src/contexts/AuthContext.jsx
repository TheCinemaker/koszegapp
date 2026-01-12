// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Normalize inputs to ensure consistency between Register and Login
  // "Fodrász Jani" -> "fodraszani" (lowercase, no spaces) purely for the email generation
  const normalizeIdentifier = (raw) => {
    return raw.toLowerCase().trim().replace(/\s+/g, '');
  };

  useEffect(() => {// 1. Get initial session - INSTANTLY set user if present
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user); // Immediate auth state
        setLoading(false);     // Unblock UI immediately
        fetchProfile(session.user); // Fetch profile in background
      } else {
        setLoading(false);
      }
    };

    getSession();

    // 2. Listen for auth changes - INSTANTLY update state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user); // Immediate auth state
        setLoading(false);     // Unblock UI immediately
        fetchProfile(session.user); // Fetch profile in background
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      // Use maybeSingle() instead of single() to avoid error logs if missing
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error (bg):", error);
      }

      if (data) {
        // Update user state with profile data when it arrives
        setUser(prev => ({ ...prev, ...data }));
      }
      // If no data, we already have certain authUser info, so no need to "unset" anything
    } catch (error) {
      console.error("Profile fetch unexpected error:", error);
    }
  };

  /* 
     Unified Login for Clients and Providers
     - Clients use 'nickname'
     - Providers use 'username' (which we map to email)
  */
  const login = async (identifier, password, type = 'client') => {
    // Generate internal email based on type
    const prefix = type === 'provider' ? 'provider' : 'client';
    const safeId = normalizeIdentifier(identifier);
    const generatedEmail = `${prefix}.${safeId}@koszeg.app`;

    console.log(`[AuthDebug] Login Attempt:`);
    console.log(`  Type: ${type}`);
    console.log(`  Raw ID: "${identifier}"`);
    console.log(`  Safe ID: "${safeId}"`);
    console.log(`  Gen Email: "${generatedEmail}"`);
    console.log(`  Password Len: ${password?.length}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: generatedEmail,
      password
    });

    if (error) {
      console.error("[AuthDebug] Login Error:", error);
      throw error;
    }
    console.log("[AuthDebug] Login Success:", data.user?.id);
    return data;
  };

  const register = async (identifier, password, fullName, role) => {
    const isProvider = role === 'provider';
    const prefix = isProvider ? 'provider' : 'client';

    const safeId = normalizeIdentifier(identifier);
    const generatedEmail = `${prefix}.${safeId}@koszeg.app`;

    console.log(`[AuthDebug] Register Attempt:`);
    console.log(`  Role: ${role}`);
    console.log(`  Raw ID: "${identifier}"`);
    console.log(`  Safe ID: "${safeId}"`);
    console.log(`  Gen Email: "${generatedEmail}"`);

    const { data, error } = await supabase.auth.signUp({
      email: generatedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          nickname: identifier, // Store original identifier
          role: role
        }
      }
    });

    if (error) {
      console.error("[AuthDebug] Register Error:", error);
      throw error;
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Helper for role-based access
  // Checks both the merged profile 'role' and the auth metadata 'role' as fallback
  const hasRole = (role) => {
    return (user?.role === role) || (user?.user_metadata?.role === role);
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
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
