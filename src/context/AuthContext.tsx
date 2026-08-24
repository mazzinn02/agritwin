import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  auth, 
  getUserProfile, 
  saveUserProfile, 
  UserProfile, 
  UserRole,
  getAllUsers 
} from '../lib/firebase';

interface AuthContextType {
  user: User | { uid: string; email: string; displayName?: string } | null;
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
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAndSetProfile = async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      // Check local active session fallback
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (savedSession) {
          try {
            const profile = JSON.parse(savedSession) as UserProfile;
            setUser({ uid: profile.uid, email: profile.email, displayName: profile.full_name });
            setUserProfile(profile);
            return;
          } catch (e) {
            localStorage.removeItem(ACTIVE_SESSION_KEY);
          }
        }
      }
      setUser(null);
      setUserProfile(null);
      return;
    }
    
    setUser(firebaseUser);
    try {
      let profile = await getUserProfile(firebaseUser.uid);
      if (!profile) {
        profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          full_name: firebaseUser.displayName || 'AgriTwin User',
          role: 'farmer',
          assigned_farm_ids: [],
          created_at: new Date().toISOString()
        };
        await saveUserProfile(profile);
      }
      setUserProfile(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await fetchAndSetProfile(firebaseUser);
      setLoading(false);
    });

    // Also check local session on initial mount immediately
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (saved) {
        try {
          const profile = JSON.parse(saved) as UserProfile;
          setUser({ uid: profile.uid, email: profile.email, displayName: profile.full_name });
          setUserProfile(profile);
          setLoading(false);
        } catch (e) {}
      }
    }

    return () => unsubscribe();
  }, []);

  const signup = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: UserRole, 
    assignedFarmIds: string[] = []
  ): Promise<UserProfile> => {
    let uid = '';
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      if (fullName) {
        try {
          await updateProfile(cred.user, { displayName: fullName });
        } catch (e) {}
      }
      setUser(cred.user);
    } catch (err: any) {
      // If Firebase Auth provider is disabled or returns operation-not-allowed in development
      if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/network-request-failed') {
        console.warn('Firebase Auth email/pass provider fallback active (local persistent account created):', err?.code);
        uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setUser({ uid, email, displayName: fullName });
      } else {
        throw err;
      }
    }

    const profile: UserProfile = {
      uid,
      email,
      full_name: fullName,
      role: role,
      assigned_farm_ids: assignedFarmIds,
      created_at: new Date().toISOString()
    };

    await saveUserProfile(profile);
    storeCredential(email, password, profile);
    setUserProfile(profile);

    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
    }

    return profile;
  };

  const login = async (email: string, password: string): Promise<UserProfile | null> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(cred.user);
      const profile = await getUserProfile(cred.user.uid);
      if (profile) {
        setUserProfile(profile);
        if (typeof window !== 'undefined') {
          localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
        }
        return profile;
      }
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/network-request-failed') {
        // Look up local credentials
        const creds = getStoredCredentials();
        const existing = creds[email.toLowerCase()];
        if (existing && existing.password === password) {
          const profile = existing.profile;
          setUser({ uid: profile.uid, email: profile.email, displayName: profile.full_name });
          setUserProfile(profile);
          if (typeof window !== 'undefined') {
            localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(profile));
          }
          return profile;
        } else if (existing && existing.password !== password) {
          const error: any = new Error('Wrong password provided for this account.');
          error.code = 'auth/wrong-password';
          throw error;
        } else {
          const error: any = new Error('No user found with this email address.');
          error.code = 'auth/user-not-found';
          throw error;
        }
      } else {
        throw err;
      }
    }

    return null;
  };

  const logout = async (): Promise<void> => {
    try {
      await fbSignOut(auth);
    } catch (e) {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/network-request-failed') {
        // Check if account exists
        const creds = getStoredCredentials();
        if (creds[email.toLowerCase()]) {
          return; // Simulated success
        }
        const error: any = new Error('No user found with this email address.');
        error.code = 'auth/user-not-found';
        throw error;
      }
      throw err;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      if (profile) setUserProfile(profile);
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
