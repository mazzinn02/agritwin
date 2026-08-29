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
  initializeFirestore,
  doc as fsDoc, 
  setDoc as fsSetDoc, 
  getDoc as fsGetDoc, 
  getDocs as fsGetDocs, 
  collection as fsCollection,
  writeBatch as fsWriteBatch,
  onSnapshot as fsOnSnapshot,
  query as fsQuery,
  orderBy as fsOrderBy,
  limit as fsLimit
} from 'firebase/firestore';
import { TelemetryObservation } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// 1. Initialize Firebase Client App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// 2. Initialize Explicit Named Firestore Database
export const FIRESTORE_DATABASE_ID = 'ai-studio-agritwincropdigi-372ea700-9482-4e27-9cbd-81501a2db50d';
export const firestoreDb = initializeFirestore(app, {}, FIRESTORE_DATABASE_ID);

// ─── DIAGNOSTIC: items 1–4, 7 ────────────────────────────────────────────────
console.log('[FIREBASE DIAGNOSTIC] 1. app.options.projectId :', app.options.projectId);
console.log('[FIREBASE DIAGNOSTIC] 2. app.options.appId     :', app.options.appId);
console.log('[FIREBASE DIAGNOSTIC] 3. FIRESTORE_DATABASE_ID :', FIRESTORE_DATABASE_ID);
console.log('[FIREBASE DIAGNOSTIC] 4. auth.app.options.projectId (from auth):', auth.app.options.projectId);
console.log('[FIREBASE DIAGNOSTIC] 5. firebaseConfig.projectId (json):', firebaseConfig.projectId);
console.log('[FIREBASE DIAGNOSTIC] 7. Firestore init call   : initializeFirestore(app, {}, "' + FIRESTORE_DATABASE_ID + '")');
console.log('[FIREBASE DIAGNOSTIC] firestoreDb._databaseId  :', (firestoreDb as any)._databaseId ?? (firestoreDb as any)._delegate?._databaseId ?? 'unavailable');

// ─── DIAGNOSTIC: item 8 – async read against named database ─────────────────
// Call runFirestoreDiagnostic() from anywhere to trigger the test read.
export async function runFirestoreDiagnostic(): Promise<void> {
  console.log('[FIRESTORE DIAGNOSTIC] Starting read test against database:', FIRESTORE_DATABASE_ID);
  try {
    const colRef = fsCollection(firestoreDb, 'telemetry_observations');
    const q = fsQuery(colRef, fsLimit(1));
    const snap = await fsGetDocs(q);
    console.log('[FIRESTORE DIAGNOSTIC] Read SUCCESS – docs returned:', snap.size);
    snap.forEach(d => console.log('[FIRESTORE DIAGNOSTIC] doc id:', d.id, 'data:', d.data()));
  } catch (err: any) {
    // ─── DIAGNOSTIC: item 9 – log COMPLETE error, no suppression ───────────
    console.error('[FIRESTORE DIAGNOSTIC] *** READ FAILED ***');
    console.error('[FIRESTORE DIAGNOSTIC] error.name   :', err?.name);
    console.error('[FIRESTORE DIAGNOSTIC] error.code   :', err?.code);
    console.error('[FIRESTORE DIAGNOSTIC] error.message:', err?.message);
    console.error('[FIRESTORE DIAGNOSTIC] full error   :', err);
    throw err; // re-throw so callers see the real error
  }
}

// Auto-run diagnostic once on module load so the error surfaces in the console immediately
runFirestoreDiagnostic();
// ─────────────────────────────────────────────────────────────────────────────

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

const USERS_STORAGE_KEY = 'agritwin_users_cache';

const DEFAULT_USERS: Record<string, UserProfile> = {
  'usr_admin_001': {
    uid: 'usr_admin_001',
    email: 'admin@agritwin.com',
    full_name: 'System Administrator',
    role: 'admin',
    assigned_farm_ids: [],
    created_at: new Date().toISOString()
  },
  'usr_farmer_002': {
    uid: 'usr_farmer_002',
    email: 'farmer@agritwin.com',
    full_name: 'Field Worker / Farmer',
    role: 'farmer',
    assigned_farm_ids: [],
    created_at: new Date().toISOString()
  }
};

const getCachedUsers = (): Record<string, UserProfile> => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  }
  return DEFAULT_USERS;
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
    const userDocRef = fsDoc(firestoreDb, 'users', profile.uid);
    await fsSetDoc(userDocRef, {
      uid: profile.uid,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      assigned_farm_ids: profile.assigned_farm_ids || [],
      created_at: profile.created_at || new Date().toISOString()
    }, { merge: true });
    console.log(`[Firestore:${FIRESTORE_DATABASE_ID}] Saved user profile: ${profile.uid}`);
  } catch (err) {
    console.warn(`[Firestore:${FIRESTORE_DATABASE_ID}] setDoc user notice:`, err);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const cached = getCachedUsers()[uid];
  try {
    const userDocRef = fsDoc(firestoreDb, 'users', uid);
    const snap = await fsGetDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      setCachedUser(data);
      return data;
    }
  } catch (err) {
    console.warn(`[Firestore:${FIRESTORE_DATABASE_ID}] getDoc user notice:`, err);
  }
  return cached || null;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const cached = Object.values(getCachedUsers());
  try {
    const usersCol = fsCollection(firestoreDb, 'users');
    const snap = await fsGetDocs(usersCol);
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
    console.warn(`[Firestore:${FIRESTORE_DATABASE_ID}] getDocs users notice:`, err);
  }
  return cached;
}

export async function saveFarmRecord(farmData: any): Promise<void> {
  try {
    const farmDocRef = fsDoc(firestoreDb, 'farms', farmData.id);
    await fsSetDoc(farmDocRef, farmData, { merge: true });
    console.log(`[Firestore:${FIRESTORE_DATABASE_ID}] Saved farm record: ${farmData.id}`);
  } catch (err) {
    console.warn(`[Firestore:${FIRESTORE_DATABASE_ID}] setDoc farm notice:`, err);
  }
  try {
    await set(ref(db, `farms/${farmData.id}`), farmData);
  } catch (err) {
    console.warn('Realtime DB farm set notice:', err);
  }
}

export async function saveSectionPlotRecord(plotData: any): Promise<void> {
  try {
    const plotDocRef = fsDoc(firestoreDb, 'plots', plotData.id);
    await fsSetDoc(plotDocRef, plotData, { merge: true });
    console.log(`[Firestore:${FIRESTORE_DATABASE_ID}] Saved plot record: ${plotData.id}`);
  } catch (err) {
    console.warn(`[Firestore:${FIRESTORE_DATABASE_ID}] setDoc plot notice:`, err);
  }
  try {
    await set(ref(db, `plots/${plotData.id}`), plotData);
  } catch (err) {
    console.warn('Realtime DB plot set notice:', err);
  }
}

// ----------------------------------------------------
// Farm & Plot Firestore Persistence
// Writes seed data so client can see: farms/, plots/, telemetry_observations/
// in Firebase Console → Firestore Database
// ----------------------------------------------------

export async function saveFarmsToFirestore(farms: any[]): Promise<void> {
  if (!farms || farms.length === 0) return;
  try {
    const batch = fsWriteBatch(firestoreDb);
    farms.forEach(farm => {
      const docRef = fsDoc(firestoreDb, 'farms', farm.id);
      batch.set(docRef, {
        ...farm,
        _collection: 'farms',
        _updatedAt: new Date().toISOString()
      }, { merge: true });
    });
    await batch.commit();
    console.log(`[Firestore:${FIRESTORE_DATABASE_ID}] ✅ Saved ${farms.length} farm(s) → collection: "farms"`);
  } catch (err: any) {
    console.warn(`[Firestore:${FIRESTORE_DATABASE_ID}] saveFarmsToFirestore:`, err?.message);
  }
}

export async function savePlotsToFirestore(plots: any[]): Promise<void> {
  if (!plots || plots.length === 0) return;
  try {
    const batch = fsWriteBatch(firestoreDb);
    plots.forEach(plot => {
      const docRef = fsDoc(firestoreDb, 'plots', plot.id);
      batch.set(docRef, {
        ...plot,
        _collection: 'plots',
        _updatedAt: new Date().toISOString()
      }, { merge: true });
    });
    await batch.commit();
    console.log(`[Firestore:${FIRESTORE_DATABASE_ID}] ✅ Saved ${plots.length} plot(s) → collection: "plots"`);
  } catch (err: any) {
    console.warn(`[Firestore:${FIRESTORE_DATABASE_ID}] savePlotsToFirestore:`, err?.message);
  }
}

// ----------------------------------------------------
// Real Firestore Telemetry Observations Persistence
// Using Named Firestore Database: ai-studio-agritwincropdigi-372ea700-9482-4e27-9cbd-81501a2db50d
// ----------------------------------------------------

export async function saveTelemetryObservationToFirestore(obs: TelemetryObservation): Promise<void> {
  try {
    const docRef = fsDoc(firestoreDb, 'telemetry_observations', obs.id);
    await fsSetDoc(docRef, obs, { merge: true });
    console.log(`[Firestore:${FIRESTORE_DATABASE_ID}] Saved observation: ${obs.id}`);
  } catch (err: any) {
    console.error('[FIRESTORE WRITE ERROR]', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      error: err
    });
    throw err;
  }
}

export async function saveTelemetryBatchToFirestore(observations: TelemetryObservation[]): Promise<void> {
  if (!observations || observations.length === 0) return;
  try {
    const batch = fsWriteBatch(firestoreDb);
    observations.forEach(obs => {
      const docRef = fsDoc(firestoreDb, 'telemetry_observations', obs.id);
      batch.set(docRef, obs, { merge: true });
    });
    await batch.commit();
    console.log('[FIRESTORE WRITE SUCCESS]', {
      databaseId: FIRESTORE_DATABASE_ID,
      collection: 'telemetry_observations',
      count: observations.length,
      ids: observations.map(o => o.id)
    });
  } catch (err: any) {
    console.error('[FIRESTORE WRITE ERROR]', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      error: err
    });
    throw err;
  }
}

// ─── DIAGNOSTIC: testFirestoreWrite — writes one doc to verify write path ─────
export async function testFirestoreWrite(): Promise<void> {
  const testId = `diag_write_${Date.now()}`;
  console.log('[FIRESTORE WRITE DIAGNOSTIC] Attempting test write to telemetry_observations, doc id:', testId);
  try {
    const batch = fsWriteBatch(firestoreDb);
    const docRef = fsDoc(firestoreDb, 'telemetry_observations', testId);
    batch.set(docRef, {
      id: testId,
      test: true,
      dataSource: 'DIAGNOSTIC',
      databaseId: FIRESTORE_DATABASE_ID,
      createdAt: new Date().toISOString()
    });
    await batch.commit();
    console.log('[FIRESTORE WRITE DIAGNOSTIC] ✅ Test write SUCCESS — doc id:', testId);
  } catch (err: any) {
    console.error('[FIRESTORE WRITE DIAGNOSTIC] ❌ Test write FAILED', {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      error: err
    });
  }
}

// testFirestoreWrite(); // Disabled on startup to prevent writing test docs without telemetry fields
// ─────────────────────────────────────────────────────────────────────────────

export function subscribeToFirestoreTelemetry(
  onUpdate: (observations: TelemetryObservation[]) => void
): () => void {
  try {
    const colRef = fsCollection(firestoreDb, 'telemetry_observations');
    
    return fsOnSnapshot(colRef, (snapshot) => {
      const list: TelemetryObservation[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as TelemetryObservation;
        if (data && data.id && data.measurementTimestamp && data.parameterKey) {
          list.push(data);
        }
      });
      list.sort((a, b) => new Date(b.measurementTimestamp).getTime() - new Date(a.measurementTimestamp).getTime());
      if (list.length > 0) {
        onUpdate(list);
      }
    }, (error) => {
      console.warn(`[Firestore:${FIRESTORE_DATABASE_ID}] onSnapshot telemetry notice:`, error);
    });
  } catch (err) {
    console.warn(`[Firestore:${FIRESTORE_DATABASE_ID}] subscribeToFirestoreTelemetry notice:`, err);
    return () => {};
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

export const rtdbQuery = (dbRef: any, ...queryConstraints: any[]) => {
  return { path: dbRef.path, _isQuery: true, queryConstraints };
};

// Export query for RTDB backward compatibility with custom _isQuery tag
export const query = rtdbQuery;

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
