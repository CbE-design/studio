
'use server';

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getFunctions } from 'firebase-admin/functions';
import 'dotenv/config';

function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY. The Admin SDK requires this credential for server-side operations.');
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
    } catch (e: any) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
        throw new Error('Firebase Admin SDK initialization failed.');
    }
}

// Initialize the app once and export the initialized services
const adminApp = initializeAdminApp();

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);
const functions = getFunctions(adminApp);

export { db, auth, functions, admin, initializeAdminApp };
