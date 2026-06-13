import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut as firebaseSignOut, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

import firebaseConfig from '../firebase-applet-config.json';

const isConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'PLACEHOLDER' && 
  !firebaseConfig.apiKey.includes('remixed-') &&
  !firebaseConfig.apiKey.includes('your-');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export { auth, db };
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signInAnonymously, firebaseSignOut, onAuthStateChanged };
export type { User };
export { isConfigured };
