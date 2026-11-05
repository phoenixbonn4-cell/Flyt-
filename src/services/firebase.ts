import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  doc,
  collection,
  onSnapshot,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Company, Driver, Order, Manager, Boutique } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure Firestore with auto-detect long-polling to prevent connection drops in Cloud Run and iframes
try {
  initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  // If already initialized, getFirestore returns the existing instance
}

/* CRITICAL: The app will break without this line */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore: Le client est hors-ligne ou la connexion est différée.');
    }
  }
}

testConnection();

// Real-time synchronization service for Companies
export function subscribeCompanies(onUpdate: (companies: Company[]) => void): () => void {
  const colRef = collection(db, 'companies');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const companies: Company[] = [];
      snapshot.forEach((docSnap) => {
        companies.push(docSnap.data() as Company);
      });
      onUpdate(companies);
    },
    (error) => {
      console.warn('Error in companies onSnapshot, falling back to local:', error);
    }
  );
}

// Real-time synchronization service for Drivers
export function subscribeDrivers(onUpdate: (drivers: Driver[]) => void): () => void {
  const colRef = collection(db, 'drivers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const drivers: Driver[] = [];
      snapshot.forEach((docSnap) => {
        drivers.push(docSnap.data() as Driver);
      });
      onUpdate(drivers);
    },
    (error) => {
      console.warn('Error in drivers onSnapshot:', error);
    }
  );
}

// Real-time synchronization service for Orders
export function subscribeOrders(onUpdate: (orders: Order[]) => void): () => void {
  const colRef = collection(db, 'orders');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push(docSnap.data() as Order);
      });
      onUpdate(orders);
    },
    (error) => {
      console.warn('Error in orders onSnapshot:', error);
    }
  );
}

// Real-time synchronization service for Managers
export function subscribeManagers(companyId: string, onUpdate: (managers: Manager[]) => void): () => void {
  const colRef = collection(db, 'managers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const managers: Manager[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Manager;
        if (!companyId || data.companyId === companyId) {
          managers.push(data);
        }
      });
      onUpdate(managers);
    },
    (error) => {
      console.warn('Error in managers onSnapshot:', error);
    }
  );
}

/**
 * Recursively removes all `undefined` values from an object or array.
 * Firestore strictly rejects documents containing any field whose value is `undefined`.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null) {
    return null as any;
  }
  if (typeof data === 'number' && Number.isNaN(data)) {
    return 0 as any;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      const sanitized = sanitizeForFirestore(value);
      if (sanitized !== undefined) {
        cleanObj[key] = sanitized;
      }
    }
  }
  return cleanObj as T;
}

// Save Company in Firestore in real-time
export async function saveCompanyToFirestore(company: Company): Promise<void> {
  const path = `companies/${company.id}`;
  try {
    const cleanData = sanitizeForFirestore(company);
    await setDoc(doc(db, 'companies', company.id), cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save Driver in Firestore in real-time
export async function saveDriverToFirestore(driver: Driver): Promise<void> {
  const path = `drivers/${driver.id}`;
  try {
    const cleanData = sanitizeForFirestore(driver);
    await setDoc(doc(db, 'drivers', driver.id), cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save Order in Firestore in real-time
export async function saveOrderToFirestore(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    const cleanData = sanitizeForFirestore(order);
    await setDoc(doc(db, 'orders', order.id), cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save Secondary Manager / Dispatcher in Firestore
export async function saveManagerToFirestore(manager: Manager): Promise<void> {
  const path = `managers/${manager.id}`;
  try {
    const cleanData = sanitizeForFirestore(manager);
    await setDoc(doc(db, 'managers', manager.id), cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete / Reset all data in Firestore for a clean fresh start ("Remet tout les données à zéro")
export async function resetAllFirestoreData(): Promise<void> {
  try {
    const collectionsToClear = ['orders', 'drivers', 'managers', 'companies', 'boutiques'];
    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore reset note:', err);
  }
}
