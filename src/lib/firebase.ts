import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const zeckiConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const teleConfig = {
  apiKey: process.env.NEXT_PUBLIC_TELE_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_TELE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_TELE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_TELE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_TELE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_TELE_FIREBASE_APP_ID,
};

// Initialize Zecki (Primary - Auth and Tasks)
const zeckiApp = getApps().find(a => a.name === "zecki") || initializeApp(zeckiConfig, "zecki");
// Initialize Teleprompt (Default DB for Scripts)
const teleApp = getApps().find(a => a.name === "[DEFAULT]") || initializeApp(teleConfig);

// Auth uses Zecki (where the user base is)
const auth = getAuth(zeckiApp);

console.log("[Firebase] Auth initialized on project:", zeckiConfig.projectId);
console.log("[Firebase] Default DB (Teleprompt) on project:", teleConfig.projectId);

// Set persistence to LOCAL (remains logged in even after closing browser)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting auth persistence:", error);
});

const db = getFirestore(teleApp); // Default 'db' points to Teleprompt
const dbZecki = getFirestore(zeckiApp); // 'dbZecki' points to Zecki Dashboard
const googleProvider = new GoogleAuthProvider();

export { zeckiApp, teleApp, auth, db, dbZecki, googleProvider };
