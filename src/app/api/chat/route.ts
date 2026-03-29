import { NextRequest, NextResponse } from 'next/server';
import { chatWithAgent } from '@/ai/genkit';
import { auth } from '@/app/lib/firebase-admin';

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

  let body: { message: string; conversationHistory?: Array<{ role: string; content: string }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  try {
    const result = await chatWithAgent(
      { message: body.message, conversationHistory: body.conversationHistory ?? [], customerId: 'mobile-user' },
      undefined,
    );
    return NextResponse.json({ response: result.response });
  } catch {
    return NextResponse.json({ response: "I'm here to help with your banking needs. Please try again." });
  }
}
