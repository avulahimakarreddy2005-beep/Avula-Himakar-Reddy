import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { auth, db, isConfigured } from './firebase';
import { Issue } from '../types';

const COLLECTION_NAME = 'reports';

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
  }
}

// Helper to handle Firestore errors with compliant JSON string format
export const handleFirestoreError = (error: any, operationType: OperationType, path: string | null): never => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    }
  };
  console.error(`Firestore Error [${operationType}]:`, JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

export async function submitReport(issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  if (!isConfigured || !db) {
    console.warn('Firebase not configured. Report will not be persisted to Firestore.');
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...issue,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
  }
}

export async function updateReport(id: string, issue: Partial<Issue>): Promise<boolean> {
  if (!isConfigured || !db) return false;

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const { id: _, createdAt: __, ...updateData } = issue;
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
}

export function subscribeToReports(onUpdate: (issues: Issue[]) => void) {
  if (!isConfigured || !db) {
    return () => {};
  }

  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const issues: Issue[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      issues.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : Date.now(),
      } as Issue);
    });
    onUpdate(issues);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
}
