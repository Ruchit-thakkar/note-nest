"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { syncUserProfile, getUserProfile, updateUserProfile } from "@/services/firestore";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);
        } catch (err) {
          console.error("Error syncing user profile:", err);
          // Fallback to basic auth object profile
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "User",
            photoURL: currentUser.photoURL,
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    if (cred.user) {
      const profile = await syncUserProfile(cred.user);
      setUserProfile(profile);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    if (cred.user) {
      const profile = await syncUserProfile(cred.user);
      setUserProfile(profile);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (cred.user) {
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      const profile = await syncUserProfile({
        ...cred.user,
        displayName: name.trim() || cred.user.displayName,
      } as User);
      setUserProfile(profile);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await fbSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const prof = await getUserProfile(user.uid);
    if (prof) setUserProfile(prof);
  };

  const updateUserDisplayName = async (name: string) => {
    if (!user) return;
    await updateProfile(user, { displayName: name.trim() });
    await updateUserProfile(user.uid, { displayName: name.trim() });
    setUserProfile((prev) => (prev ? { ...prev, displayName: name.trim() } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        logout,
        refreshProfile,
        updateUserDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
