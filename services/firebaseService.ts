import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, onSnapshot, getDocFromServer, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ChatSession } from '../types'; // assuming same structure

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication
export async function signIn() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Sign in failed", error);
    throw error;
  }
}

export async function signOut() {
  await firebaseSignOut(auth);
}

// User Profile logic
export async function ensureUserProfile(userId: string) {
  const userRef = doc(db, 'users', userId);
  let userDoc;
  try {
    userDoc = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
  
  if (!userDoc.exists()) {
    try {
      await setDoc(userRef, {
        userId,
        points: 0,
        badges: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { points: 0, badges: [] };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}`);
      return null;
    }
  }
  return { points: userDoc.data().points, badges: userDoc.data().badges };
}

export async function updateUserProfile(userId: string, points: number, badges: string[]) {
  const userRef = doc(db, 'users', userId);
  let exists = false;
  try {
    const userDoc = await getDoc(userRef);
    exists = userDoc.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return;
  }
  
  if (exists) {
    try {
      await updateDoc(userRef, {
        points,
        badges,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  }
}

// Chat sessions logic
export async function loadUserSessions(userId: string): Promise<ChatSession[]> {
  const sessionsRef = collection(db, 'users', userId, 'sessions');
  try {
    const querySnapshot = await getDocs(query(sessionsRef, where('userId', '==', userId)));
    const sessions: ChatSession[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: data.id,
        title: data.title,
        messages: data.messages || []
        // we can ignore createdAt/updatedAt for the UI type if there is mismatch
      });
    });
    return sessions;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/sessions`);
    return [];
  }
}

export async function saveSession(userId: string, session: ChatSession) {
  const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
  let sessionDoc;
  try {
    sessionDoc = await getDoc(sessionRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/sessions/${session.id}`);
    return;
  }
  
  const cleanMessages = session.messages.map(m => {
    const newMsg: any = { role: m.role, text: m.text };
    if (m.image !== undefined) newMsg.image = m.image;
    return newMsg;
  });

  if (sessionDoc.exists()) {
    try {
      await updateDoc(sessionRef, {
        title: session.title,
        messages: cleanMessages,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/sessions/${session.id}`);
    }
  } else {
    try {
      await setDoc(sessionRef, {
        id: session.id,
        userId,
        title: session.title,
        messages: cleanMessages,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${userId}/sessions/${session.id}`);
    }
  }
}

export async function deleteSession(userId: string, sessionId: string) {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    try {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(sessionRef);
    } catch(err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}/sessions/${sessionId}`);
    }
}
