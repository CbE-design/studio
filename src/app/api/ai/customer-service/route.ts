import { NextRequest, NextResponse } from 'next/server';
import {
  classifyInquiry,
  retrieveFAQs,
  createSupportTicket,
  resolveIssue,
  analyzeSentiment,
  generateSupportResponse,
} from '@/ai/flows/customer-service-flow';
import {
  saveSupportTicket,
  saveConversationMessage,
  saveSentimentAnalysis,
} from '@/ai/firebase-service';

// POST /api/ai/classify
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Classify Inquiry
    if (action === 'classify') {
      const result = await classifyInquiry({
        message: data.message,
        conversationHistory: data.conversationHistory,
      });
      return NextResponse.json({ success: true, data: result });
    }

    // Retrieve FAQs
    if (action === 'retrieveFAQs') {
      const result = await retrieveFAQs({
        query: data.query,
        category: data.category,
      });
      return NextResponse.json({ success: true, data: result });
    }

    // Create Support Ticket
    if (action === 'createTicket') {
      const result = await createSupportTicket({
        customerId: data.customerId,
        inquiry: data.inquiry,
        category: data.category,
        priority: data.priority,
        customerEmail: data.customerEmail,
      });

      // Save to Firestore
      await saveSupportTicket(result.ticketId, {
        customerId: data.customerId,
        subject: result.subject,
        description: data.inquiry,
        category: data.category,
        priority: data.priority,
        status: 'open',
      });

      return NextResponse.json({ success: true, data: result });
    }

    // Resolve Issue
    if (action === 'resolveIssue') {
      const result = await resolveIssue({
        issue: data.issue,
        category: data.category,
        attemptedSolutions: data.attemptedSolutions,
      });
      return NextResponse.json({ success: true, data: result });
    }

    // Analyze Sentiment
    if (action === 'analyzeSentiment') {
      const result = await analyzeSentiment({
        message: data.message,
      });

      // Save sentiment to Firestore if ticketId provided
      if (data.ticketId) {
        await saveSentimentAnalysis(data.ticketId, result);
      }

      return NextResponse.json({ success: true, data: result });
    }

    // Generate Support Response
    if (action === 'generateResponse') {
      const result = await generateSupportResponse({
        issue: data.issue,
        tone: data.tone,
        includeActionItems: data.includeActionItems,
      });
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
