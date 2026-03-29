import { NextRequest, NextResponse } from 'next/server';
import { sendProofOfPaymentEmailAction } from '@/app/lib/actions';
import type { Transaction } from '@/app/lib/definitions';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { transaction: Transaction; recipientEmail: string };
    const { transaction, recipientEmail } = body;
    if (!transaction || !recipientEmail) {
      return NextResponse.json(
        { success: false, message: 'transaction and recipientEmail are required' },
        { status: 400 },
      );
    }
    const result = await sendProofOfPaymentEmailAction(transaction, recipientEmail);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
