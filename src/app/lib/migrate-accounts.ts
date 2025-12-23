import { db } from './firebase-admin';

export async function migrateAccountsForUser(userId: string): Promise<{ success: boolean; message: string; migratedCount: number }> {
  try {
    const userBankAccountsRef = db.collection('users').doc(userId).collection('bankAccounts');
    const existingAccounts = await userBankAccountsRef.get();
    
    if (!existingAccounts.empty) {
      return {
        success: true,
        message: `User ${userId} already has ${existingAccounts.size} accounts in the correct location.`,
        migratedCount: 0
      };
    }

    const topLevelAccountsRef = db.collection('bankAccounts');
    const userAccountsQuery = await topLevelAccountsRef.where('userId', '==', userId).get();
    
    if (userAccountsQuery.empty) {
      return {
        success: false,
        message: `No accounts found for user ${userId} in top-level bankAccounts collection.`,
        migratedCount: 0
      };
    }

    let migratedCount = 0;
    const batch = db.batch();

    for (const accountDoc of userAccountsQuery.docs) {
      const accountData = accountDoc.data();
      const newAccountRef = userBankAccountsRef.doc(accountDoc.id);
      
      batch.set(newAccountRef, accountData);

      const transactionsRef = topLevelAccountsRef.doc(accountDoc.id).collection('transactions');
      const transactions = await transactionsRef.get();
      
      for (const txDoc of transactions.docs) {
        const newTxRef = newAccountRef.collection('transactions').doc(txDoc.id);
        batch.set(newTxRef, txDoc.data());
      }
      
      migratedCount++;
    }

    await batch.commit();

    return {
      success: true,
      message: `Successfully migrated ${migratedCount} accounts for user ${userId}.`,
      migratedCount
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      migratedCount: 0
    };
  }
}

export async function migrateAllAccounts(): Promise<{ success: boolean; message: string; results: any[] }> {
  const results: any[] = [];
  
  try {
    const topLevelAccountsRef = db.collection('bankAccounts');
    const allAccounts = await topLevelAccountsRef.get();
    
    if (allAccounts.empty) {
      return {
        success: true,
        message: 'No accounts found in top-level bankAccounts collection.',
        results: []
      };
    }

    const userIds = new Set<string>();
    allAccounts.docs.forEach(doc => {
      const userId = doc.data().userId;
      if (userId) userIds.add(userId);
    });

    for (const userId of userIds) {
      const result = await migrateAccountsForUser(userId);
      results.push({ userId, ...result });
    }

    const successCount = results.filter(r => r.success && r.migratedCount > 0).length;
    
    return {
      success: true,
      message: `Migration complete. Processed ${userIds.size} users, migrated accounts for ${successCount} users.`,
      results
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      results
    };
  }
}
