import { NextRequest, NextResponse } from 'next/server';
import { migrateAccountsForUser, migrateAllAccounts } from '@/app/lib/migrate-accounts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, migrateAll } = body;

    if (migrateAll) {
      const result = await migrateAllAccounts();
      return NextResponse.json(result);
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      );
    }

    const result = await migrateAccountsForUser(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Migration API',
    usage: {
      'POST /api/migrate': {
        description: 'Migrate accounts to user subcollections',
        body: {
          userId: 'string (optional) - Migrate accounts for a specific user',
          migrateAll: 'boolean (optional) - Set to true to migrate all users'
        }
      }
    }
  });
}
