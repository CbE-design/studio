'use server';

import { db } from '@/app/lib/firebase-admin';

interface SupportTicket {
  customerId: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt?: any;
  updatedAt?: any;
  assignedAgent?: string;
  resolution?: string;
  satisfactionRating?: number;
}

// Create a support ticket
export async function saveSupportTicket(
  ticketId: string,
  ticket: SupportTicket
) {
  try {
    const ticketData = {
      ...ticket,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'open',
    };

    await db.collection('supportTickets').doc(ticketId).set(ticketData);
    return { success: true, ticketId };
  } catch (error) {
    console.error('Error saving support ticket:', error);
    throw error;
  }
}

// Get support ticket
export async function getSupportTicket(ticketId: string) {
  try {
    const docSnap = await db.collection('supportTickets').doc(ticketId).get();
    if (docSnap.exists) {
      return { success: true, ticket: docSnap.data() };
    } else {
      return { success: false, message: 'Ticket not found' };
    }
  } catch (error) {
    console.error('Error getting support ticket:', error);
    throw error;
  }
}

// Update support ticket
export async function updateSupportTicket(
  ticketId: string,
  updates: Partial<SupportTicket>
) {
  try {
    await db.collection('supportTickets').doc(ticketId).update({
      ...updates,
      updatedAt: new Date(),
    });
    return { success: true, ticketId };
  } catch (error) {
    console.error('Error updating support ticket:', error);
    throw error;
  }
}

// Get customer's support tickets
export async function getCustomerTickets(customerId: string) {
  try {
    const querySnapshot = await db
      .collection('supportTickets')
      .where('customerId', '==', customerId)
      .get();
    const tickets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { success: true, tickets };
  } catch (error) {
    console.error('Error getting customer tickets:', error);
    throw error;
  }
}

// Save conversation message
export async function saveConversationMessage(
  ticketId: string,
  message: {
    role: string;
    content: string;
    timestamp?: any;
  }
) {
  try {
    await db
      .collection('supportTickets')
      .doc(ticketId)
      .collection('messages')
      .add({
        ...message,
        timestamp: new Date(),
      });
    return { success: true };
  } catch (error) {
    console.error('Error saving conversation message:', error);
    throw error;
  }
}

// Get conversation history
export async function getConversationHistory(ticketId: string) {
  try {
    const querySnapshot = await db
      .collection('supportTickets')
      .doc(ticketId)
      .collection('messages')
      .get();
    const messages = querySnapshot.docs.map((doc) => doc.data());
    return { success: true, messages };
  } catch (error) {
    console.error('Error getting conversation history:', error);
    throw error;
  }
}

// Save sentiment analysis
export async function saveSentimentAnalysis(
  ticketId: string,
  analysis: {
    sentiment: string;
    score: number;
    emotionTags: string[];
    customerSatisfaction: number;
  }
) {
  try {
    await db.collection('supportTickets').doc(ticketId).update({
      sentimentAnalysis: analysis,
      lastAnalyzedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving sentiment analysis:', error);
    throw error;
  }
}

// Get pending escalations
export async function getPendingEscalations() {
  try {
    const querySnapshot = await db
      .collection('supportTickets')
      .where('requiresEscalation', '==', true)
      .where('status', '==', 'open')
      .get();
    const escalations = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { success: true, escalations };
  } catch (error) {
    console.error('Error getting pending escalations:', error);
    throw error;
  }
}
