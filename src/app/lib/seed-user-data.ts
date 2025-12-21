import { Firestore, collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import type { Account, Transaction } from './definitions';

function generateId(firestore: Firestore): string {
  return doc(collection(firestore, '_')).id;
}

function generateAccountNumber(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

const accountTemplates = [
  {
    name: 'Savvy Bundle Current Account',
    type: 'Cheque' as const,
    balance: 15250.00,
    currency: 'ZAR' as const,
  },
  {
    name: 'Current Account',
    type: 'Cheque' as const,
    balance: 8750.50,
    currency: 'ZAR' as const,
  },
  {
    name: 'MyPockets Savings',
    type: 'Savings' as const,
    balance: 2500.00,
    currency: 'ZAR' as const,
  },
];

const transactionTemplates = [
  [
    { description: 'SALARY DEPOSIT', reference: 'ACME CORP', amount: 25000.00, type: 'credit' as const, daysAgo: 1 },
    { description: 'GROCERY STORE', reference: 'PICK N PAY', amount: -1250.00, type: 'debit' as const, daysAgo: 2 },
    { description: 'ELECTRICITY BILL', reference: 'ESKOM', amount: -890.00, type: 'debit' as const, daysAgo: 3 },
    { description: 'TRANSFER TO SAVINGS', reference: 'INTERNAL', amount: -500.00, type: 'debit' as const, daysAgo: 4 },
  ],
  [
    { description: 'PAYMENT RECEIVED', reference: 'CLIENT ABC', amount: 5000.00, type: 'credit' as const, daysAgo: 1 },
    { description: 'FUEL PURCHASE', reference: 'ENGEN', amount: -750.00, type: 'debit' as const, daysAgo: 3 },
    { description: 'RESTAURANT', reference: 'STEERS', amount: -320.00, type: 'debit' as const, daysAgo: 6 },
  ],
  [
    { description: 'TRANSFER FROM CURRENT', reference: 'INTERNAL', amount: 500.00, type: 'credit' as const, daysAgo: 4 },
    { description: 'MONTHLY SAVINGS', reference: 'AUTO-SAVE', amount: 1000.00, type: 'credit' as const, daysAgo: 11 },
    { description: 'INTEREST EARNED', reference: 'BANK', amount: 25.50, type: 'credit' as const, daysAgo: 20 },
  ],
];

function formatDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

export async function seedUserData(firestore: Firestore, userId: string): Promise<void> {
  try {
    const accountsRef = collection(firestore, 'users', userId, 'bankAccounts');
    const existingAccounts = await getDocs(accountsRef);
    
    if (!existingAccounts.empty) {
      console.log('User already has accounts, skipping seeding');
      return;
    }

    const batch = writeBatch(firestore);

    for (let i = 0; i < accountTemplates.length; i++) {
      const template = accountTemplates[i];
      const accountId = generateId(firestore);
      const accountRef = doc(firestore, 'users', userId, 'bankAccounts', accountId);
      
      batch.set(accountRef, {
        id: accountId,
        name: template.name,
        type: template.type,
        accountNumber: generateAccountNumber(),
        balance: template.balance,
        currency: template.currency,
        userId,
      });

      const transactions = transactionTemplates[i] || [];
      for (const txTemplate of transactions) {
        const txId = generateId(firestore);
        const transactionRef = doc(firestore, 'users', userId, 'bankAccounts', accountId, 'transactions', txId);
        batch.set(transactionRef, {
          id: txId,
          date: formatDate(txTemplate.daysAgo),
          description: txTemplate.description,
          reference: txTemplate.reference,
          amount: txTemplate.amount,
          type: txTemplate.type,
          userId,
          fromAccountId: accountId,
        });
      }
    }

    await batch.commit();
    console.log('Successfully seeded user data');
  } catch (error) {
    console.error('Error seeding user data:', error);
  }
}
