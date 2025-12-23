import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceUserId, targetUserId } = body;

    if (!sourceUserId || !targetUserId) {
      return NextResponse.json(
        { success: false, message: 'Both sourceUserId and targetUserId are required' },
        { status: 400 }
      );
    }

    const sourceUserRef = db.collection('users').doc(sourceUserId);
    const targetUserRef = db.collection('users').doc(targetUserId);

    const sourceUserDoc = await sourceUserRef.get();
    if (!sourceUserDoc.exists) {
      return NextResponse.json(
        { success: false, message: `Source user document ${sourceUserId} not found` },
        { status: 404 }
      );
    }

    const targetUserDoc = await targetUserRef.get();
    if (!targetUserDoc.exists) {
      await targetUserRef.set(sourceUserDoc.data() || {});
      console.log('Created target user document');
    }

    const sourceBankAccounts = await sourceUserRef.collection('bankAccounts').get();
    
    if (sourceBankAccounts.empty) {
      return NextResponse.json({
        success: false,
        message: `No bankAccounts found in source user ${sourceUserId}`
      });
    }

    let accountsCount = 0;
    let transactionsCount = 0;

    for (const accountDoc of sourceBankAccounts.docs) {
      const accountData = accountDoc.data();
      const targetAccountRef = targetUserRef.collection('bankAccounts').doc(accountDoc.id);
      
      await targetAccountRef.set({
        ...accountData,
        userId: targetUserId
      });
      accountsCount++;

      const sourceTransactions = await sourceUserRef
        .collection('bankAccounts')
        .doc(accountDoc.id)
        .collection('transactions')
        .get();

      for (const txDoc of sourceTransactions.docs) {
        const txData = txDoc.data();
        await targetAccountRef.collection('transactions').doc(txDoc.id).set({
          ...txData,
          userId: targetUserId
        });
        transactionsCount++;
      }

      const failedTransactions = await sourceUserRef
        .collection('bankAccounts')
        .doc(accountDoc.id)
        .collection('failedTransactions')
        .get();

      for (const ftDoc of failedTransactions.docs) {
        await targetAccountRef.collection('failedTransactions').doc(ftDoc.id).set(ftDoc.data());
      }
    }

    const sourceBeneficiaries = await sourceUserRef.collection('beneficiaries').get();
    for (const benDoc of sourceBeneficiaries.docs) {
      await targetUserRef.collection('beneficiaries').doc(benDoc.id).set(benDoc.data());
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete! Copied ${accountsCount} accounts and ${transactionsCount} transactions from ${sourceUserId} to ${targetUserId}`,
      accountsCount,
      transactionsCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'User Data Migration API',
    usage: {
      'POST /api/migrate-user': {
        description: 'Copy bankAccounts and transactions from one user document to another',
        body: {
          sourceUserId: 'string - The document ID of the source user (wrong ID)',
          targetUserId: 'string - The document ID of the target user (correct Auth UID)'
        }
      }
    }
  });
}
