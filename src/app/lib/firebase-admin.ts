
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getFunctions } from 'firebase-admin/functions';

function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY. The Admin SDK requires this credential for server-side operations.');
    }

    try {
        // Since the service account key is a JSON string in the env var, we need to parse it.
        const serviceAccountJson = JSON.parse(serviceAccount);
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson),
        });
    } catch (e: any) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
        throw new Error('Firebase Admin SDK initialization failed due to invalid service account key.');
    }
}

// Export the initialized services, but ensure initialization is done lazily when needed
// or at the top level of a file that is guaranteed to run after env vars are loaded.
const adminApp = initializeAdminApp();
const db = getFirestore(adminApp);
const auth = getAuth(adminApp);
const functions = getFunctions(adminApp);

export { db, auth, functions, admin, initializeAdminApp };
