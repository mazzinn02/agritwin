import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// 1. Initialize Firebase Client App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const firestoreDb = getFirestore(app);

// User Profile Types
export type UserRole = 'admin' | 'farmer';

export interface UserProfile {
  uid: string;
  email: string;
  full_name: string;
  role: UserRole;
  assigned_farm_ids: string[];
  created_at: string;
}

// Local cache helper for instant UI feedback and fallback
const USERS_STORAGE_KEY = 'agritwin_users_cache';

const getCachedUsers = (): Record<string, UserProfile> => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  return {};
};

const setCachedUser = (profile: UserProfile) => {
  if (typeof window === 'undefined') return;
  try {
    const users = getCachedUsers();
    users[profile.uid] = profile;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to cache user profile:', e);
  }
};

// Firestore + Local Cache User Profile Management
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  setCachedUser(profile);
  try {
    const userDocRef = doc(firestoreDb, 'users', profile.uid);
    await setDoc(userDocRef, {
      uid: profile.uid,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      assigned_farm_ids: profile.assigned_farm_ids || [],
      created_at: profile.created_at || new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore setDoc notice (using local persistence):', err);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const cached = getCachedUsers()[uid];
  try {
    const userDocRef = doc(firestoreDb, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      setCachedUser(data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore getDoc notice (falling back to cache):', err);
  }
  return cached || null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const cached = Object.values(getCachedUsers());
  try {
    const usersCol = collection(firestoreDb, 'users');
    const snap = await getDocs(usersCol);
    if (!snap.empty) {
      const list: UserProfile[] = [];
      snap.forEach(docSnap => {
        const item = docSnap.data() as UserProfile;
        list.push(item);
        setCachedUser(item);
      });
      return list;
    }
  } catch (err) {
    console.warn('Firestore getDocs notice (falling back to cache):', err);
  }
  return cached;
}

export async function saveFarmRecord(farmData: any): Promise<void> {
  try {
    const farmDocRef = doc(firestoreDb, 'farms', farmData.id);
    await setDoc(farmDocRef, farmData, { merge: true });
  } catch (err) {
    console.warn('Firestore setDoc farm notice:', err);
  }
  try {
    await set(ref(db, `farms/${farmData.id}`), farmData);
  } catch (err) {
    console.warn('Realtime DB farm set notice:', err);
  }
}

export async function saveSectionPlotRecord(plotData: any): Promise<void> {
  try {
    const plotDocRef = doc(firestoreDb, 'plots', plotData.id);
    await setDoc(plotDocRef, plotData, { merge: true });
  } catch (err) {
    console.warn('Firestore setDoc plot notice:', err);
  }
  try {
    await set(ref(db, `plots/${plotData.id}`), plotData);
  } catch (err) {
    console.warn('Realtime DB plot set notice:', err);
  }
}

// ----------------------------------------------------
// Mock Firebase Realtime Database Implementation for Prototype
// This provides local reactive state with localStorage persistence for existing pages.
// ----------------------------------------------------

type Callback = (snapshot: any) => void;

class MockDatabase {
  data: any = {};
  listeners: Record<string, Callback[]> = {};

  constructor() {
    this.loadFromStorage();
  }

  loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('agritwin_firebase_db');
        if (raw) {
          this.data = JSON.parse(raw);
        }
      } catch (e) {
        console.error('Failed to load mockDb from localStorage:', e);
      }
    }
  }

  saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('agritwin_firebase_db', JSON.stringify(this.data));
      } catch (e) {
        console.error('Failed to save mockDb to localStorage:', e);
      }
    }
  }

  getPath(path: string) {
    return path.split('/').filter(Boolean);
  }

  resolvePath(obj: any, pathParts: string[]) {
    let current = obj;
    for (const part of pathParts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  setPath(obj: any, pathParts: string[], value: any) {
    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) current[part] = {};
      current = current[part];
    }
    const last = pathParts[pathParts.length - 1];
    if (last) {
      current[last] = value;
    }
    this.saveToStorage();
  }

  deletePath(obj: any, pathParts: string[]) {
    if (pathParts.length === 0) return;
    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) return;
      current = current[part];
    }
    const last = pathParts[pathParts.length - 1];
    if (last && current) {
      delete current[last];
    }
    this.saveToStorage();
  }

  notify(path: string) {
    // Notify exact listeners
    if (this.listeners[path]) {
      const val = this.resolvePath(this.data, this.getPath(path));
      const snapshot = {
        exists: () => val !== undefined && val !== null,
        val: () => val
      };
      this.listeners[path].forEach(cb => cb(snapshot));
    }
    
    // Notify parent listeners
    const parts = this.getPath(path);
    while (parts.length > 0) {
      parts.pop();
      const parentPath = parts.join('/');
      if (this.listeners[parentPath]) {
        const val = this.resolvePath(this.data, parts);
        const snapshot = {
          exists: () => val !== undefined && val !== null,
          val: () => val
        };
        this.listeners[parentPath].forEach(cb => cb(snapshot));
      }
    }
  }
}

const mockDb = new MockDatabase();

export const db = mockDb;

export const ref = (database: any, path: string) => {
  return { path };
};

export const onValue = (dbRef: any, callback: Callback) => {
  const path = dbRef.path;
  if (!mockDb.listeners[path]) {
    mockDb.listeners[path] = [];
  }
  mockDb.listeners[path].push(callback);
  
  // Initial call
  const val = mockDb.resolvePath(mockDb.data, mockDb.getPath(path));
  callback({
    exists: () => val !== undefined && val !== null,
    val: () => val
  });

  return () => {
    // unsubscribe
    mockDb.listeners[path] = mockDb.listeners[path].filter(cb => cb !== callback);
  };
};

const originalGet = async (dbRef: any) => {
  const path = dbRef.path;
  const val = mockDb.resolvePath(mockDb.data, mockDb.getPath(path));
  return {
    exists: () => val !== undefined && val !== null,
    val: () => val
  };
};

export const get = async (queryRef: any) => {
  if (!queryRef._isQuery) return originalGet(queryRef);
  
  const path = queryRef.path;
  const val = mockDb.resolvePath(mockDb.data, mockDb.getPath(path));
  
  if (!val) {
    return { exists: () => false, val: () => null };
  }

  let results = Object.entries(val);
  
  const orderConstraint = queryRef.queryConstraints?.find((c: any) => c.type === 'orderByChild');
  const startConstraint = queryRef.queryConstraints?.find((c: any) => c.type === 'startAt');
  const endConstraint = queryRef.queryConstraints?.find((c: any) => c.type === 'endAt');

  if (orderConstraint) {
    const key = orderConstraint.path;
    
    if (startConstraint) {
      results = results.filter(([_, item]: any) => item[key] >= startConstraint.value);
    }
    if (endConstraint) {
      results = results.filter(([_, item]: any) => item[key] <= endConstraint.value);
    }
    
    results.sort(([_, a]: any, [__, b]: any) => (a[key] > b[key] ? 1 : -1));
  }

  const filteredVal = Object.fromEntries(results);

  return {
    exists: () => results.length > 0,
    val: () => filteredVal
  };
};

export const set = async (dbRef: any, value: any) => {
  const path = dbRef.path;
  mockDb.setPath(mockDb.data, mockDb.getPath(path), value);
  mockDb.notify(path);
};

export const push = async (dbRef: any, value: any) => {
  const path = dbRef.path;
  const pushId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullPath = `${path}/${pushId}`;
  mockDb.setPath(mockDb.data, mockDb.getPath(fullPath), { ...value, id: pushId });
  mockDb.notify(path);
  return { key: pushId };
};

export const remove = async (dbRef: any) => {
  const path = dbRef.path;
  mockDb.deletePath(mockDb.data, mockDb.getPath(path));
  mockDb.notify(path);
};

export const query = (dbRef: any, ...queryConstraints: any[]) => {
  return { path: dbRef.path, _isQuery: true, queryConstraints };
};

export const orderByChild = (path: string) => {
  return { type: 'orderByChild', path };
};

export const startAt = (value: any) => {
  return { type: 'startAt', value };
};

export const endAt = (value: any) => {
  return { type: 'endAt', value };
};

export const signInWithGoogle = async () => {
  return { user: { displayName: 'Demo Student', email: 'student@college.edu' } };
};

export const getAccessToken = async () => {
  return 'demo_token';
};
