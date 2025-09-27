
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/onCall");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require('firebase-functions/v2');
const { onUserCreate } = require('firebase-functions/v2/auth');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for functions (e.g., region, memory)
setGlobalOptions({ region: 'us-central1' });

/**
 * Triggered when a new user is created in Firebase Authentication.
 * This function creates a corresponding user document in Firestore.
 */
exports.provisionNewUser = onUserCreate(async (event) => {
  const user = event.data;
  const { uid, email } = user;
  const db = admin.firestore();

  // Create the main user document
  const userDocRef = db.collection('users').doc(uid);
  
  await userDocRef.set({
    id: uid,
    email: email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Successfully created user document for: ${uid}`);
  return null;
});
