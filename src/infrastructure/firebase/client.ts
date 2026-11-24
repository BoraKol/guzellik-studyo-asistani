import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseId: string;
}

const REQUIRED_ENV_KEYS = [
  ['apiKey', 'VITE_FIREBASE_API_KEY'],
  ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'],
  ['projectId', 'VITE_FIREBASE_PROJECT_ID'],
  ['storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET'],
  ['messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID'],
  ['appId', 'VITE_FIREBASE_APP_ID'],
] as const;

function readFirebaseEnv(): FirebaseEnvConfig {
  return {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim(),
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '').trim(),
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '').trim(),
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '').trim(),
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
    appId: (import.meta.env.VITE_FIREBASE_APP_ID ?? '').trim(),
    databaseId: (import.meta.env.VITE_FIREBASE_DATABASE_ID ?? '').trim(),
  };
}

const envConfig = readFirebaseEnv();
const missingKeys: string[] = [];

for (const [field, envName] of REQUIRED_ENV_KEYS) {
  if (!envConfig[field]) {
    missingKeys.push(envName);
  }
}

export const firebaseConfigStatus = {
  isConfigured: missingKeys.length === 0,
  missingKeys,
} as const;

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;

if (firebaseConfigStatus.isConfigured) {
  appInstance = initializeApp({
    apiKey: envConfig.apiKey,
    authDomain: envConfig.authDomain,
    projectId: envConfig.projectId,
    storageBucket: envConfig.storageBucket,
    messagingSenderId: envConfig.messagingSenderId,
    appId: envConfig.appId,
  });

  dbInstance = envConfig.databaseId
    ? getFirestore(appInstance, envConfig.databaseId)
    : getFirestore(appInstance);
  authInstance = getAuth(appInstance);
  storageInstance = getStorage(appInstance);
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    throw new Error('Firebase Auth yapılandırılmamış. Lütfen .env.local dosyanızı kontrol edin.');
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    throw new Error('Cloud Firestore yapılandırılmamış. Lütfen .env.local dosyanızı kontrol edin.');
  }
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    throw new Error('Firebase Storage yapılandırılmamış. Lütfen .env.local dosyanızı kontrol edin.');
  }
  return storageInstance;
}
