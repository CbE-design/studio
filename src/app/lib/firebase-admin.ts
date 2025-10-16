
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getFunctions } from 'firebase-admin/functions';
import { serviceAccount } from './service-account';

function initializeAdminApp() {
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

const adminApp = initializeAdminApp();
const db = getFirestore(adminApp);
const auth = getAuth(adminApp);
const functions = getFunctions(adminApp);

export { db, auth, functions, admin, initializeAdminApp };
