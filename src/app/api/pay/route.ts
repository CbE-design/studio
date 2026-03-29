import { NextRequest, NextResponse } from 'next/server';
import { createTransactionAction } from '@/app/lib/actions';
import type { TransactionInput } from '@/app/lib/definitions';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TransactionInput;
    const result = await createTransactionAction(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
