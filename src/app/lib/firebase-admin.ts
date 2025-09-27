
import admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  // Check if the service account key is present in environment variables
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    // Initialize with credentials if available
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccount)),
    });
  } else {
    // Initialize without credentials for local development or in environments
    // where the key is not set. This prevents the app from crashing.
    // Server-side features requiring authentication will not work.
    console.warn(
      'Firebase Admin SDK initialized without credentials. ' +
      'Server-side data fetching that requires authentication will not work. ' +
      'Set FIREBASE_SERVICE_ACCOUNT_KEY to enable it.'
    );
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
