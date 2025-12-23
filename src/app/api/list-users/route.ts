import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

export async function GET() {
  try {
    const usersSnapshot = await db.collection('users').get();
    
    const users = await Promise.all(usersSnapshot.docs.map(async (doc) => {
      const bankAccountsSnapshot = await doc.ref.collection('bankAccounts').get();
      return {
        id: doc.id,
        email: doc.data().email,
        bankAccountsCount: bankAccountsSnapshot.size
      };
    }));

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
