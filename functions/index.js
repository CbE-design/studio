
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
 * This function creates a corresponding user document in Firestore,
 * along with sample bank accounts with zero balance.
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

  // Create sample bank accounts for the new user
  const batch = db.batch();

  // Account 1: Savvy Bundle Current Account
  const savvyAccountRef = userDocRef.collection('bankAccounts').doc();
  batch.set(savvyAccountRef, {
    name: 'Savvy Bundle Current Account',
    type: 'Cheque',
    accountNumber: '1234567890',
    balance: 0.00,
    currency: 'ZAR',
    userId: uid,
  });

  // Account 2: Savings Account
  const savingsAccountRef = userDocRef.collection('bankAccounts').doc();
  batch.set(savingsAccountRef, {
    name: 'Savings Account',
    type: 'Savings',
    accountNumber: '0987654321',
    balance: 0.00,
    currency: 'ZAR',
    userId: uid,
  });
  
  // Account 3: Credit Card
  const creditAccountRef = userDocRef.collection('bankAccounts').doc();
  batch.set(creditAccountRef, {
    name: 'Gold Credit Card',
    type: 'Credit',
    accountNumber: '5555666677778888',
    balance: 0.00,
    currency: 'ZAR',
    userId: uid,
  });

  // Commit the batch
  await batch.commit();
  console.log(`Successfully provisioned sample data for user: ${uid}`);

  return null;
});
