/**
 * AuthContext — Firebase Auth for the YoHo clone (vertical slice).
 *
 * Flow (recon F01): S03 sign-in (email/password or Google) -> S04 profile
 * setup (nickname, gender, age, country, bio) -> S05 Home.
 *
 * Sign-up creates the Firebase Auth user only; the profile row is written
 * by completeProfile() on the profile-setup screen (S04). The index gate
 * checks whether the RTDB profile row exists to decide S04 vs Home.
 *
 * Google sign-in uses the same expo-web-browser OAuth pattern as Vee
 * (system browser -> ID token -> Firebase credential); the Google OAuth
 * web client ID is a placeholder until the clone's own OAuth client is
 * configured for the staging Firebase project (see GOOGLE_WEB_CLIENT_ID).
 * Facebook / TikTok / SMS are a later auth milestone (they need their own
 * SDKs / app IDs) — they are NOT shown as dead buttons on the sign-in
 * screen. See build-log.md.
 *
 * Profile rows live at yoho_clone/users/{uid} (the clone's own namespace
 * under the staging RTDB — never Vee's paths).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import { get, ref, set } from 'firebase/database';
import { auth, database, isFirebaseConfigured } from '../config/firebase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth web client ID for the clone's Firebase project.
 * PLACEHOLDER — inject the clone's own client ID (from the staging
 * Firebase project's Google Cloud OAuth client) before Google sign-in
 * can work. The redirect URI below uses the staging project's Firebase
 * Hosting OAuth handler.
 */
export const GOOGLE_WEB_CLIENT_ID =
  'STAGING-GOOGLE-OAUTH-CLIENT-ID-NOT-CONFIGURED';
const GOOGLE_REDIRECT_URI =
  'https://vee-test-staging.firebaseapp.com/oauth/callback';
const GOOGLE_AUTH_CANCELLED = 'GOOGLE_AUTH_CANCELLED';

export type CloneUser = {
  uid: string;
  email: string | null;
  nickname: string;
  avatarUrl: string | null;
};

export type ProfileInput = {
  nickname: string;
  gender: string | null;
  age: number | null;
  country: string | null;
  bio: string;
};

type AuthContextValue = {
  user: CloneUser | null;
  firebaseUser: FirebaseUser | null;
  initializing: boolean;
  authError: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeProfile: (profile: ProfileInput) => Promise<void>;
  hasProfile: (uid: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toCloneUser(fbUser: FirebaseUser): CloneUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    nickname: fbUser.displayName ?? 'Guest',
    avatarUrl: fbUser.photoURL,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<CloneUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setUser(fbUser ? toCloneUser(fbUser) : null);
      setInitializing(false);
    });
    return unsub;
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    if (!isFirebaseConfigured) {
      setAuthError('Staging Firebase is not configured yet (apiKey missing).');
      return;
    }
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      setUser(toCloneUser(fbUser));
    } catch (e) {
      setAuthError(
        e instanceof Error ? e.message : 'Sign-up failed. Try again.',
      );
      throw e;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    if (!isFirebaseConfigured) {
      setAuthError('Staging Firebase is not configured yet (apiKey missing).');
      return;
    }
    try {
      const { user: fbUser } = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      setUser(toCloneUser(fbUser));
    } catch (e) {
      setAuthError(
        e instanceof Error ? e.message : 'Sign-in failed. Try again.',
      );
      throw e;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    if (!isFirebaseConfigured) {
      setAuthError('Staging Firebase is not configured yet (apiKey missing).');
      return;
    }
    if (GOOGLE_WEB_CLIENT_ID === 'STAGING-GOOGLE-OAUTH-CLIENT-ID-NOT-CONFIGURED') {
      setAuthError(
        'Google sign-in is not configured yet (OAuth client ID missing).',
      );
      return;
    }
    try {
      const authUrl =
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${encodeURIComponent(GOOGLE_WEB_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
        '&response_type=id_token' +
        '&scope=' + encodeURIComponent('openid profile email') +
        '&nonce=' + Math.random().toString(36).substring(2);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'yoho://oauth');
      if (result.type !== 'success') {
        throw Object.assign(new Error('Google sign-in was cancelled.'), {
          code: GOOGLE_AUTH_CANCELLED,
        });
      }
      const url = result.url;
      const fragment = url.split('#')[1] || url.split('?')[1] || '';
      const params = new URLSearchParams(fragment);
      const idToken = params.get('id_token');
      if (!idToken) throw new Error('Google sign-in did not return an ID token.');
      const credential = GoogleAuthProvider.credential(idToken);
      const { user: fbUser } = await signInWithCredential(auth, credential);
      setUser(toCloneUser(fbUser));
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      if (code === GOOGLE_AUTH_CANCELLED) return;
      setAuthError(
        e instanceof Error ? e.message : 'Google sign-in failed. Try again.',
      );
      throw e;
    }
  }, []);

  const completeProfile = useCallback(
    async (profile: ProfileInput) => {
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error('Not signed in');
      const nickname = profile.nickname.trim();
      if (!nickname) throw new Error('Nickname is required');
      await updateProfile(fbUser, { displayName: nickname });
      await set(ref(database, `yoho_clone/users/${fbUser.uid}`), {
        uid: fbUser.uid,
        nickname,
        email: fbUser.email,
        avatarUrl: fbUser.photoURL,
        gender: profile.gender,
        age: profile.age,
        country: profile.country,
        bio: profile.bio.trim(),
        level: 1,
        charm: 0,
        vipLevel: 0,
        createdAt: Date.now(),
      });
      setUser(toCloneUser({ ...fbUser, displayName: nickname } as FirebaseUser));
    },
    [],
  );

  const hasProfile = useCallback(async (uid: string): Promise<boolean> => {
    const snap = await get(ref(database, `yoho_clone/users/${uid}`));
    return snap.exists();
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      firebaseUser,
      initializing,
      authError,
      signUp,
      signIn,
      signInWithGoogle,
      completeProfile,
      hasProfile,
      signOut,
      clearError,
    }),
    [user, firebaseUser, initializing, authError, signUp, signIn, signInWithGoogle, completeProfile, hasProfile, signOut, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
