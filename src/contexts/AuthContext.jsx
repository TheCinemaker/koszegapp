// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Normalize inputs to ensure consistency between Register and Login
  // "Fodrász Jani" -> "fodraszjani" (lowercase, no accents, no spaces)
  const normalizeIdentifier = (raw) => {
    return raw
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .trim()
      .replace(/\s+/g, '') // Remove spaces
      .replace(/[^a-z0-9]/g, ''); // Remove any other special chars
  };

  useEffect(() => {
    // 1. Get initial session - INSTANTLY set user if present
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user); // Immediate auth state
        setToken(session.access_token);
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
        setToken(session.access_token);
        setLoading(false);     // Unblock UI immediately
        fetchProfile(session.user); // Fetch profile in background
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      // 1. Fetch Public Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // 2. Fetch Admin Whitelist Role (if matched by username/nickname)
      // Note: authUser.user_metadata.nickname holds the login username
      const username = authUser.user_metadata?.nickname || authUser.user_metadata?.username;
      let adminRole = null;

      if (username) {
        const { data: whitelistData } = await supabase
          .from('admin_whitelist')
          .select('role')
          .eq('username', username)
          .maybeSingle();
        if (whitelistData) {
          adminRole = whitelistData.role;
        }
      }

      if (profileData || adminRole) {
        // Update user state. If adminRole exists, it OVERRIDES the profile role for permission checks.
        setUser(prev => ({
          ...prev,
          ...profileData,
          // If present in whitelist, use that role. Otherwise fallback to profile role.
          role: adminRole || profileData?.role || 'client'
        }));
      }
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
    const isProvider = type === 'provider' || type === 'restaurant';
    const prefix = isProvider ? 'provider' : 'client';

    // Normalize identifier more aggressively
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
    const isProvider = role === 'provider' || role === 'restaurant';
    const prefix = isProvider ? 'provider' : 'client';

    const safeId = normalizeIdentifier(identifier);
    const generatedEmail = `${prefix}.${safeId}@koszeg.app`;

    console.log(`[AuthDebug] Register Attempt:`);
    console.log(`  Role: ${role}`);
    console.log(`  Raw ID: "${identifier}"`);
    console.log(`  Safe ID: "${safeId}"`);
    console.log(`  Gen Email: "${generatedEmail}"`);

    // Workaround: Database trigger might reject 'restaurant' role if ENUM is restrictive.
    // We send 'provider' as the metadata role to satisfy the trigger.
    // The calling code (FoodAuthPage) is responsible for manually updating the profile to 'restaurant' after registration.
    const metadataRole = role === 'restaurant' ? 'provider' : role;

    const { data, error } = await supabase.auth.signUp({
      email: generatedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          nickname: identifier, // Store original identifier
          role: metadataRole
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
    setToken(null);
  };


  // Helper for role-based access
  const hasRole = (role) => {
    return (user?.role === role) || (user?.user_metadata?.role === role);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const role = user.role || user.user_metadata?.role || 'client';

    // 1. Superadmin / Editor / Admin (Legacy) -> FULL ACCESS
    if (['superadmin', 'editor', 'admin', 'varos'].includes(role)) {
      return true;
    }

    // 2. Partner (Kulsos) -> RESTRICTED
    // "Csak új eseményt vehet fel"
    if (role === 'partner' || role === 'kulsos') {
      // Allow Creating Events
      if (permission === 'events:create') return true;
      // Allow viewing own events (implicit for editing flow, though they can't edit officially?)
      // User said "Only take new event", implying NO edit/delete?
      // Let's be strict: Create ONLY.
      // But they need to VIEW the list to see if it's there? Usually yes.
      // Let's allow 'view_all' for events so they can see the calendar? 
      // User said "Csak uj eseményt vehet fel".
      // Let's grant: 'events:create', 'events:view_all' (to see dashboard).
      // Deny: 'events:edit', 'events:delete'.
      if (permission === 'events:view_all') return true;

      return false;
    }

    // 3. Provider / Restaurant (Legacy Business Logic)
    if (role === 'provider' || role === 'partner' || role === 'var' || role === 'tourinform' || role === 'restaurant') {
      // Allow operations on their own content
      if (permission.endsWith('_own')) return true;
      // Allow creation
      if (permission.includes(':create')) return true;
      // Deny view_all (forces filter to own content only)
      if (permission.includes(':view_all')) return false;
      // Allow generic view if not view_all
      if (permission.split(':')[1] === 'view') return true;

      return false;
    }

    return false;
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
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
