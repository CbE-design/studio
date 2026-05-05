
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { serviceAccount } from './service-account';

/**
 * Initializes the Firebase Admin SDK as a singleton to prevent multiple 
 * initialization errors during Next.js development restarts.
 */
function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e: any) {
    console.error('Firebase Admin SDK initialization failed:', e.message);
    throw new Error('Firebase Admin SDK initialization failed. Please check the service account configuration.');
  }
}

const adminApp = getAdminApp();
const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export { db, auth, admin, getAdminApp };
