import { auth, db, isConfigured } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './reportService';

export type UserRole = 'citizen' | 'admin';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  coins: number;
}

// In-memory/localStorage credentials for the demo and local deployment
const USERS_KEY = 'roadsense_registered_users';
const CURRENT_USER_KEY = 'roadsense_current_session';

const getLocalUsers = (): Record<string, { email: string; passwordHash: string; displayName: string; role: UserRole; coins: number }> => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {
      // Default accounts for easy access
      'citizen@roadsense.in': { email: 'citizen@roadsense.in', passwordHash: '123456', displayName: 'Aarav Sharma', role: 'citizen', coins: 150 },
      'admin@roadsense.in': { email: 'admin@roadsense.in', passwordHash: '123456', displayName: 'Officer Suresh Kumar', role: 'admin', coins: 0 },
    };
  } catch (e) {
    return {};
  }
};

const saveLocalUsers = (users: ReturnType<typeof getLocalUsers>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export async function getUserRole(uid: string, email?: string | null): Promise<UserRole> {
  // If registered in local storage, check her
  if (email) {
    const localUsers = getLocalUsers();
    if (localUsers[email]) {
      return localUsers[email].role;
    }
  }

  // Fallback checks
  if (email?.includes('admin') || uid.startsWith('admin')) {
    return 'admin';
  }

  if (isConfigured && db) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.role) {
          return data.role as UserRole;
        }
      }
    } catch (e) {
      console.warn('Firebase role read failed:', e);
      handleFirestoreError(e, OperationType.GET, `users/${uid}`);
    }
  }

  // Default role
  return 'citizen';
}

export function saveSessionUser(user: AppUser) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getSessionUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearSessionUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export async function signUp(email: string, passwordHash: string, displayName: string, role: UserRole): Promise<AppUser> {
  const localUsers = getLocalUsers();
  if (localUsers[email]) {
    throw new Error('An account with this email already exists.');
  }

  const uid = 'usr-' + Math.random().toString(36).substring(2, 11);
  const coins = role === 'citizen' ? 100 : 0; // standard onboarding reward

  localUsers[email] = {
    email,
    passwordHash,
    displayName,
    role,
    coins
  };
  saveLocalUsers(localUsers);

  const newUser: AppUser = {
    uid,
    displayName,
    email,
    photoURL: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${displayName}`,
    role,
    coins
  };

  saveSessionUser(newUser);

  // Sync to database if possible
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'users', uid), {
        displayName,
        email,
        role,
        coins,
        createdAt: Date.now()
      });
    } catch (e) {
      console.warn('Firebase user write bypassed:', e);
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}`);
    }
  }

  return newUser;
}

export async function signIn(email: string, passwordHash: string): Promise<AppUser> {
  const localUsers = getLocalUsers();
  const found = localUsers[email];
  if (!found || found.passwordHash !== passwordHash) {
    throw new Error('Invalid email or password. Hint: default credential is password "123456"');
  }

  const appUser: AppUser = {
    uid: 'usr-' + email.split('@')[0],
    displayName: found.displayName,
    email: found.email,
    photoURL: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${found.displayName}`,
    role: found.role,
    coins: found.coins
  };

  saveSessionUser(appUser);
  return appUser;
}

export function logout() {
  clearSessionUser();
}
