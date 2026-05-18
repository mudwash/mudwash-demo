import { initializeApp, getApps, getApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey) {
  console.warn("⚠️ Firebase API Key is missing. Please create a .env.local file with your Firebase credentials. See .env.example for guidance.");
}

// Initialize Firebase — use long polling to avoid WebSocket timeout errors
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// initializeFirestore with long polling (only on first call; getFirestore returns existing instance after)
let db: Firestore;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  });
} catch {
  // Already initialized — retrieve the existing instance
  db = getFirestore(app);
}

// Initialize services
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, db, storage };
