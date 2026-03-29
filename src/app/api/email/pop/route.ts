import { NextRequest, NextResponse } from 'next/server';
import { sendProofOfPaymentEmailAction } from '@/app/lib/actions';
import { auth } from '@/app/lib/firebase-admin';
import type { Transaction } from '@/app/lib/definitions';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!idToken) {
    return NextResponse.json({ success: false, message: 'Unauthorized: missing token' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ success: false, message: 'Unauthorized: invalid token' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { transaction: Transaction; recipientEmail: string };
    const { transaction, recipientEmail } = body;

    if (!transaction || !recipientEmail) {
      return NextResponse.json(
        { success: false, message: 'transaction and recipientEmail are required' },
        { status: 400 },
      );
    }

    if (transaction.userId !== uid) {
      return NextResponse.json({ success: false, message: 'Forbidden: account mismatch' }, { status: 403 });
    }

    const result = await sendProofOfPaymentEmailAction(transaction, recipientEmail);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
