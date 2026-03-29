import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';

const TIPS = [
  {
    title: 'Build an Emergency Fund',
    body: 'Keep 3–6 months of living expenses in a liquid savings account to cushion unexpected costs without disrupting your investments.',
    icon: 'trending-up-outline',
  },
  {
    title: 'Track Every Transaction',
    body: 'Review your transactions weekly. Categorising spending reveals patterns and helps you redirect funds toward your financial goals.',
    icon: 'calculator-outline',
  },
  {
    title: 'Automate Your Savings',
    body: 'Set up automatic transfers on payday. Even small consistent amounts compound significantly over time without effort.',
    icon: 'repeat-outline',
  },
  {
    title: 'Monitor Debit Orders',
    body: 'Regularly audit your debit orders and subscriptions. Cancelling even one unused service per month can free up meaningful cash annually.',
    icon: 'refresh-outline',
  },
  {
    title: 'Apply the 50/30/20 Rule',
    body: 'Allocate 50% of after-tax income to needs, 30% to wants, and 20% to savings and debt repayment for a balanced financial life.',
    icon: 'pie-chart-outline',
  },
  {
    title: 'Protect Your Accounts',
    body: 'Enable transaction notifications on all accounts. Immediate alerts let you spot and dispute unauthorised transactions quickly.',
    icon: 'shield-checkmark-outline',
  },
];

export async function GET(req: NextRequest) {
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

  const shuffled = [...TIPS].sort(() => Math.random() - 0.5).slice(0, 4);
  return NextResponse.json({ tips: shuffled });
}
