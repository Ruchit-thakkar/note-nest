import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBHcld2m6AW7CCgaIPj1Z8Ywxwk18T9yPU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "note-nest-9ae75.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "note-nest-9ae75",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "note-nest-9ae75.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "756261951878",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:756261951878:web:264ef8ec50e39dfd04f407",
};

// Initialize Firebase App singleton
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth
const auth: Auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Firestore with client persistence
let db: Firestore;

if (typeof window !== "undefined") {
  try {
    // Attempt to initialize with multi-tab persistence
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Fall back if already initialized
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

// Storage instance
const storage: FirebaseStorage = getStorage(app);

export { app, auth, googleProvider, db, storage };
