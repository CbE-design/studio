import admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!admin.apps.length) {
  if (!serviceAccount) {
    // In a production/deployed environment, service account key should be set.
    // For local development, this might not be present if you're not using admin features.
    console.warn("Firebase Admin SDK service account is not configured. Server-side data fetching will not work.");
  } else {
     admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
