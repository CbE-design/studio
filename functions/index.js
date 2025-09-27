
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

// Default bank accounts to be created for a new user
const defaultAccounts = [
  {
    name: 'Savvy Bundle Current Account',
    type: 'Cheque',
    accountNumber: '1234567890',
    balance: 0.0,
    currency: 'ZAR',
  },
  {
    name: 'Current Account',
    type: 'Cheque',
    accountNumber: '1234066912',
    balance: -5891.1,
    currency: 'ZAR',
  },
  {
    name: 'MyPockets(2/10)',
    type: 'Savings',
    accountNumber: '1122334455',
    balance: 4.0,
    currency: 'ZAR',
  },
  {
    name: 'Savings Account',
    type: 'Savings',
    accountNumber: '0987654321',
    balance: 1250.0,
    currency: 'ZAR',
  },
];

const sampleTransactions = {
  '1234066912': [
    { description: 'ONLINE PURCHASE', amount: 1740.00, type: 'debit', daysAgo: 2 },
    { description: 'SALARY', amount: 25000.00, type: 'credit', daysAgo: 3 },
  ],
  '0987654321': [
    { description: 'MONTHLY SAVING', amount: 1000.00, type: 'credit', daysAgo: 10 },
  ],
};


/**
 * Triggered when a new user is created in Firebase Authentication.
 * This function creates a corresponding user document in Firestore
 * and provisions them with a default set of bank accounts and transactions.
 */
exports.provisionNewUser = onUserCreate(async (event) => {
  const user = event.data;
  const { uid, email } = user;
  const db = admin.firestore();
  const batch = db.batch();

  // Create the main user document
  const userDocRef = db.collection('users').doc(uid);
  batch.set(userDocRef, {
    id: uid,
    email: email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create the bankAccounts subcollection and sample transactions
  const bankAccountsCollectionRef = userDocRef.collection('bankAccounts');

  for (const account of defaultAccounts) {
    const newAccountRef = bankAccountsCollectionRef.doc(); // Let Firestore auto-generate the document ID
    batch.set(newAccountRef, {
      ...account,
      userId: uid,
    });

    const transactionsForAccount = sampleTransactions[account.accountNumber];
    if (transactionsForAccount) {
      const transactionsCollectionRef = newAccountRef.collection('transactions');
      transactionsForAccount.forEach(tx => {
        const newTransactionRef = transactionsCollectionRef.doc();
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - tx.daysAgo);
        
        batch.set(newTransactionRef, {
            ...tx,
            date: transactionDate.toISOString(),
            userId: uid,
            fromAccountId: newAccountRef.id,
        });
      });
    }
  }

  // Commit the batch to create all documents at once
  await batch.commit();

  console.log(`Successfully provisioned new user: ${uid}`);
  return null;
});
