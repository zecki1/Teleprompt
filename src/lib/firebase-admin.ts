import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminAuth: ReturnType<typeof getAuth> | null = null;

if (!getApps().length) {
  try {
    const app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    adminAuth = getAuth(app);
  } catch {
    // GOOGLE_APPLICATION_CREDENTIALS não configurado
  }
}

export { adminAuth };
