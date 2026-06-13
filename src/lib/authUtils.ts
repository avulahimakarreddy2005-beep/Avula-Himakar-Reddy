import { AppUser, UserRole } from './auth';

/**
 * Key stored in LocalStorage for secure admin session persistence
 */
const ADMIN_SESSION_KEY = 'roadsense_admin_session';

export interface AdminSession {
  isAuthenticated: boolean;
  uid: string;
  userName: string;
  email: string;
  role: UserRole;
  loginTime: number;
}

/**
 * Persists an administrative session into local storage
 */
export function saveAdminSession(user: AppUser): void {
  const session: AdminSession = {
    isAuthenticated: true,
    uid: user.uid,
    userName: user.displayName || 'Official Administrator',
    email: user.email || 'admin@roadsense.in',
    role: user.role,
    loginTime: Date.now(),
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

/**
 * Retrieves the current administrative session
 */
export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    
    // Auto-expire sessions older than 24 hours for security
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (Date.now() - session.loginTime > oneDayMs) {
      clearAdminSession();
      return null;
    }
    
    return session;
  } catch (e) {
    console.warn('Error reading admin session:', e);
    return null;
  }
}

/**
 * Clears the administrative session on clean logout logoffs
 */
export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

/**
 * Standard trigger to sign out and force clean state refresh
 */
export function logoutAdmin(): void {
  clearAdminSession();
  // Clear standard session as well for cross-compatibility
  localStorage.removeItem('roadsense_current_session');
  localStorage.removeItem('rs_guest_user');
}

/**
 * Helper to check if a user role possesses active admin properties
 */
export function possessesAdminRights(role: UserRole): boolean {
  return role === 'admin';
}
