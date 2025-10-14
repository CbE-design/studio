
'use server';

import admin from 'firebase-admin';
import { getFirestore } from 'firebase/firestore';
import { app } from './firebase';

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  // Check if the service account key is present in environment variables
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    // Initialize with credentials if available
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
    } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  } else {
    // Initialize without credentials for local development or in environments
    // where the key is not set. This prevents the app from crashing.
    // Server-side features requiring authentication will not work.
    console.warn(
      'Firebase Admin SDK initialized without credentials. ' +
      'Server-side data fetching that requires authentication will not work. ' +
      'Set FIREBASE_SERVICE_ACCOUNT_KEY to enable it.'
    );
    // In a non-admin context, we still need a Firestore instance
    // so we get it from the client-side app instance.
  }
}

const db = admin.apps.length ? admin.firestore() : getFirestore(app);
const auth = admin.apps.length ? admin.auth() : undefined;


export { db, auth, admin };
