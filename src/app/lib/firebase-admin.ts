
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
        // The service account key from .env might have unescaped newlines.
        // We need to replace them before parsing.
        const parsedServiceAccount = serviceAccount.replace(/\\n/g, '\\n');
        const serviceAccountJson = JSON.parse(parsedServiceAccount);
        
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson),
        });
    } catch (e: any) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
        throw new Error('Firebase Admin SDK initialization failed due to invalid service account key.');
    }
}

const adminApp = initializeAdminApp();
const db = getFirestore(adminApp);
const auth = getAuth(adminApp);
const functions = getFunctions(adminApp);

export { db, auth, functions, admin, initializeAdminApp };
