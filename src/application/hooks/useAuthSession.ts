import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  firebaseConfigStatus,
  getFirebaseAuth,
} from '../../infrastructure/firebase/client';

export interface AuthSessionState {
  isConfigured: boolean;
  missingKeys: readonly string[];
  user: User | null;
  ready: boolean;
  isEmailVerified: boolean;
  markEmailVerified: () => void;
  signOutUser: () => Promise<void>;
}

export function useAuthSession(): AuthSessionState {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseConfigStatus.isConfigured);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    if (!firebaseConfigStatus.isConfigured) return;

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsEmailVerified(Boolean(nextUser?.emailVerified));
      setReady(true);
    });

    return () => unsub();
  }, []);

  const markEmailVerified = useCallback(() => {
    setIsEmailVerified(true);
  }, []);

  const signOutUser = useCallback(async () => {
    if (!firebaseConfigStatus.isConfigured) return;
    await signOut(getFirebaseAuth());
  }, []);

  return {
    isConfigured: firebaseConfigStatus.isConfigured,
    missingKeys: firebaseConfigStatus.missingKeys,
    user,
    ready,
    isEmailVerified,
    markEmailVerified,
    signOutUser,
  };
}
