import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';
import { Vonage } from '@vonage/server-sdk';

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY || '',
  apiSecret: process.env.VONAGE_API_SECRET || '',
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const { to, text } = await request.json();

    if (!to || !text) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: to and text' },
        { status: 400 }
      );
    }

    if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
      return NextResponse.json(
        { success: false, message: 'SMS service not configured. Please add VONAGE_API_KEY and VONAGE_API_SECRET.' },
        { status: 500 }
      );
    }

    const from = 'Nedbank';
    const response = await vonage.sms.send({ to, from, text });
    
    if (response.messages[0].status !== '0') {
      throw new Error(response.messages[0]['error-text'] || 'Failed to send SMS');
    }

    const messageId = response.messages[0]['message-id'];
    
    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully!',
      messageId: messageId,
    });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
