
import admin from 'firebase-admin';

// Check if the service account key is present in environment variables
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

// Initialize the app only if it hasn't been initialized yet
if (!admin.apps.length) {
  if (serviceAccount) {
    // Initialize with credentials if available
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Initialize without credentials for local development or in environments
    // where the key is not set. This prevents the app from crashing.
    // Server-side features requiring authentication will not work.
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    console.warn(
      'Firebase Admin SDK initialized without credentials. ' +
      'Server-side data fetching that requires authentication will not work. ' +
      'Set FIREBASE_SERVICE_ACCOUNT_KEY to enable it.'
    );
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
