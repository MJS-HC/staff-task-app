import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  currentUser: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({
              id: firebaseUser.uid,
              ...userDoc.data(),
            } as User);
          } else {
            // User document doesn't exist, create it with default carer role
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              username: firebaseUser.email?.split('@')[0] || 'user',
              email: firebaseUser.email || '',
              role: 'carer',
              createdAt: serverTimestamp(),
            });

            // Set user after creation
            setUser({
              id: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || 'user',
              email: firebaseUser.email || '',
              role: 'carer',
              createdAt: new Date(),
            } as User);
          }
        } catch (error) {
          console.error('Error loading/creating user:', error);
        }
        setCurrentUser(firebaseUser);
      } else {
        setUser(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  async function signup(email: string, password: string, username: string) {
    const authUser = await createUserWithEmailAndPassword(auth, email, password);
    // Create user document in Firestore with 'carer' role by default
    await setDoc(doc(db, 'users', authUser.user.uid), {
      username,
      email,
      role: 'carer',
      createdAt: serverTimestamp(),
    });
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{ user, currentUser, loading, login, logout, signup, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
