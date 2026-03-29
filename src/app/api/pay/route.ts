import { NextRequest, NextResponse } from 'next/server';
import { createTransactionAction } from '@/app/lib/actions';
import { auth } from '@/app/lib/firebase-admin';

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
    const body = (await req.json()) as Record<string, unknown>;

    const result = await createTransactionAction({
      fromAccountId: String(body.fromAccountId ?? ''),
      userId: uid,
      amount: String(body.amount ?? ''),
      recipientName: body.recipientName !== undefined ? String(body.recipientName) : undefined,
      yourReference: body.yourReference !== undefined ? String(body.yourReference) : undefined,
      recipientReference: body.recipientReference !== undefined ? String(body.recipientReference) : undefined,
      bankName: body.bankName !== undefined ? String(body.bankName) : undefined,
      accountNumber: body.accountNumber !== undefined ? String(body.accountNumber) : undefined,
      paymentType: String(body.paymentType ?? ''),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
