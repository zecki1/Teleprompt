import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const zeckiConfig = {
  apiKey: process.env.NEXT_PUBLIC_ZECKI_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_ZECKI_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_ZECKI_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_ZECKI_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_ZECKI_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_ZECKI_FIREBASE_APP_ID,
};

function getZeckiApp(): FirebaseApp {
  const existingApps = getApps();
  
  // Try to get existing 'zecki' app
  try {
    return getApp('zecki');
  } catch {
    // If doesn't exist, check if there's any app
    if (existingApps.length > 0) {
      // Use existing default app
      return existingApps[0];
    }
    // Initialize new zecki app
    return initializeApp(zeckiConfig, 'zecki');
  }
}

const zeckiApp = getZeckiApp();
const zeckiAuth = getAuth(zeckiApp);
const zeckiDb = getFirestore(zeckiApp);
const zeckiGoogleProvider = new GoogleAuthProvider();

export { zeckiApp, zeckiAuth, zeckiDb, zeckiGoogleProvider };
