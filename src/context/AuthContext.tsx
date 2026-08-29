import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  assignedFarmIds: string[];
  isAdmin: boolean;
  isFarmer: boolean;
  loading: boolean;
  signup: (email: string, password: string, fullName: string, role: UserRole, assignedFarmIds?: string[]) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const LOCAL_CREDENTIALS_KEY = 'agritwin_credentials';
const ACTIVE_SESSION_KEY = 'agritwin_active_session';

const DEFAULT_CREDENTIALS: Record<string, { password: string; profile: UserProfile }> = {
  'admin@agritwin.com': {
    password: 'admin123',
    profile: {
      uid: 'usr_admin_001',
      email: 'admin@agritwin.com',
      full_name: 'System Administrator',
      role: 'admin',
      assigned_farm_ids: [],
      created_at: new Date().toISOString()
    }
  },
  'farmer@agritwin.com': {
    password: 'farmer123',
    profile: {
      uid: 'usr_farmer_002',
      email: 'farmer@agritwin.com',
      full_name: 'Field Worker / Farmer',
      role: 'farmer',
      assigned_farm_ids: [],
      created_at: new Date().toISOString()
    }
  }
};

const getStoredCredentials = (): Record<string, { password: string; profile: UserProfile }> => {
  if (typeof window === 'undefined') return DEFAULT_CREDENTIALS;
  try {
    const raw = localStorage.getItem(LOCAL_CREDENTIALS_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(LOCAL_CREDENTIALS_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
    return DEFAULT_CREDENTIALS;
  } catch (e) {
    return DEFAULT_CREDENTIALS;
  }
};

const storeCredential = (email: string, password: string, profile: UserProfile) => {
  if (typeof window === 'undefined') return;
  try {
    const map = getStoredCredentials();
    map[email.toLowerCase()] = { password, profile };
    localStorage.setItem(LOCAL_CREDENTIALS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to store credential:', e);
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local persistent active session on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (saved) {
        try {
          const profile = JSON.parse(saved) as UserProfile;
          setUser({ uid: profile.uid, email: profile.email, displayName: profile.full_name });
          setUserProfile(profile);
        } catch (e) {
          localStorage.removeItem(ACTIVE_SESSION_KEY);
        }
      } else {
        // Default to admin user for smooth presentation experience
        const defaultAdmin = DEFAULT_CREDENTIALS['admin@agritwin.com'].profile;
        setUser({ uid: defaultAdmin.uid, email: defaultAdmin.email, displayName: defaultAdmin.full_name });
        setUserProfile(defaultAdmin);
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(defaultAdmin));
      }
    }
    setLoading(false);
  }, []);

  const signup = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole, 
    assignedFarmIds: string[] = []
  ): Promise<UserProfile> => {
    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const profile: UserProfile = {
      uid,
      email,
      full_name: fullName,
      role,
      assigned_farm_ids: assignedFarmIds,
      created_at: new Date().toISOString()
    };

    storeCredential(email, password, profile);
    setUser({ uid, email, displayName: fullName });
    setUserProfile(profile);

    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
    }

    // Optionally sync user to Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').upsert({
          uid,
          email,
          full_name: fullName,
          role,
          assigned_farm_ids: assignedFarmIds
        });
      } catch (e) {
        console.warn('Supabase user sync notice:', e);
      }
    }

    return profile;
  };

  const login = async (email: string, password: string): Promise<UserProfile | null> => {
    const creds = getStoredCredentials();
    const existing = creds[email.toLowerCase()];

    if (existing && existing.password === password) {
      const profile = existing.profile;
      setUser({ uid: profile.uid, email: profile.email, displayName: profile.full_name });
      setUserProfile(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
        localStorage.setItem('agritwin_current_user_profile', JSON.stringify(profile));
      }
      return profile;
    }

    if (existing && existing.password !== password) {
      const error: any = new Error('Wrong password provided for this account.');
      error.code = 'auth/wrong-password';
      throw error;
    }

    // Generic fallback for any email with standard password
    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const profile: UserProfile = {
      uid,
      email,
      full_name: email.split('@')[0] || 'AgriTwin User',
      role: 'farmer',
      assigned_farm_ids: [],
      created_at: new Date().toISOString()
    };

    storeCredential(email, password, profile);
    setUser({ uid, email, displayName: profile.full_name });
    setUserProfile(profile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
    }
    return profile;
  };

  const logout = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    const creds = getStoredCredentials();
    if (creds[email.toLowerCase()]) {
      return;
    }
    const error: any = new Error('No user found with this email address.');
    error.code = 'auth/user-not-found';
    throw error;
  };

  const refreshProfile = async (): Promise<void> => {
    if (userProfile && typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (saved) {
        setUserProfile(JSON.parse(saved));
      }
    }
  };

  const role = userProfile?.role || null;
  const isAdmin = role === 'admin';
  const isFarmer = role === 'farmer';
  const assignedFarmIds = userProfile?.assigned_farm_ids || [];

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        assignedFarmIds,
        isAdmin,
        isFarmer,
        loading,
        signup,
        login,
        logout,
        resetPassword,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
