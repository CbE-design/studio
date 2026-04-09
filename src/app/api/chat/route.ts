import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';

const BANKING_RESPONSES: Record<string, string> = {
  balance: 'You can view your account balance on the Home screen. Tap any account card to see full details including available and current balance.',
  transfer: 'To transfer funds, go to the Pay & Transfer tab and select "New Transfer". Enter the recipient, amount, and reference. Transfers within MoneyGO are instant; external transfers may take 1–2 business days.',
  statement: 'You can download statements from the Documents screen (More → Documents & Statements). Statements are available for the past 12 months in PDF format.',
  card: 'To manage your card, visit More → Card Settings. You can freeze/unfreeze, set spending limits, or report a lost card from there.',
  loan: 'Loan applications are processed through our branch network or by calling 0800 123 456. Our advisors can guide you through eligibility and repayment options.',
  fee: 'MoneyGO charges a 0.5% fee (max R25) on outgoing transfers. There are no fees for account-to-account transfers within MoneyGO.',
  password: 'To reset your password, sign out and tap "Forgot password" on the login screen. A reset link will be sent to your registered email.',
  fraud: 'If you suspect fraudulent activity, please freeze your card immediately via More → Card Settings, then call our fraud hotline at 0800 999 888 available 24/7.',
};

function generateResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [keyword, response] of Object.entries(BANKING_RESPONSES)) {
    if (lower.includes(keyword)) return response;
  }
  return "I'm here to help with your MoneyGO banking needs. You can ask me about account balances, transfers, statements, cards, fees, or security. For complex queries, please contact our support team at 0800 123 456.";
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const idToken = authHeader.slice(7);
  try {
    await auth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  return NextResponse.json({ response: generateResponse(body.message) });
}
