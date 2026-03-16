# MoneyGO Customer Service AI Agent - Genkit Flow Documentation

## Overview

The customer service agent is built on **Google Genkit** and uses AI-powered flows to provide intelligent, scalable customer support for MoneyGO. It handles inquiry classification, FAQ retrieval, ticket management, sentiment analysis, and provides real-time conversational support.

## Architecture

```
┌─────────────────────────────────────┐
│   Client Components / UI             │
└────────────┬────────────────────────┘
             │ (useAICustomerService hook)
             ▼
┌─────────────────────────────────────┐
│   API Route: /api/ai/customer-service│
├─────────────────────────────────────┤
│   Route Handler                      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Genkit Flows                       │
├─────────────────────────────────────┤
│ • classifyInquiry                   │
│ • retrieveFAQs                      │
│ • createSupportTicket               │
│ • chatWithAgent                     │
│ • resolveIssue                      │
│ • analyzeSentiment                  │
│ • generateSupportResponse           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Google Vertex AI (Gemini Model)   │
└─────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Firebase Firestore                │
│   • Support Tickets                 │
│   • Conversation History            │
│   • Sentiment Analysis              │
│   • Customer Issues                 │
└─────────────────────────────────────┘
```

## Available Flows

### 1. **classifyInquiry** - Intelligent Inquiry Classification

Analyzes customer messages and automatically categorizes them.

**Input:**
```typescript
{
  message: string;                    // Customer's message
  conversationHistory?: Array<{       // Previous messages (optional)
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
  }>;
}
```

**Output:**
```typescript
{
  category: 'billing' | 'technical' | 'account' | 'fraud' | 'general' | 'complaint' | 'feature-request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;                 // 0-1 confidence score
  suggestedResponse: string;           // AI-generated response
  requiresEscalation: boolean;         // If human agent needed
}
```

**Use Cases:**
- Route support tickets automatically
- Prioritize urgent issues
- Determine if escalation needed
- Suggest initial responses

### 2. **retrieveFAQs** - FAQ Search & Retrieval

Finds relevant FAQs based on customer query.

**Input:**
```typescript
{
  query: string;                      // Customer question
  category?: 'billing' | 'technical' | 'account' | 'fraud' | 'general' | 'complaint' | 'feature-request';
}
```

**Output:**
```typescript
{
  faqs: Array<{
    question: string;
    answer: string;
    category: string;
    relevanceScore: number;           // 0-1 relevance
  }>;
  bestMatch?: string;                 // Most relevant FAQ
}
```

**Use Cases:**
- Self-service support
- Quick answers for common questions
- Reduce support ticket volume
- Improve customer satisfaction

### 3. **createSupportTicket** - Ticket Creation

Generates professional support tickets with AI-generated summaries.

**Input:**
```typescript
{
  customerId: string;
  inquiry: string;                    // Issue description
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerEmail?: string;
}
```

**Output:**
```typescript
{
  ticketId: string;                   // Unique ticket ID
  subject: string;                    // AI-generated subject
  ticketNumber: string;               // Reference number
  estimatedResolutionTime: string;    // e.g., "24 hours"
  confirmationMessage: string;        // Message to send to customer
}
```

**Use Cases:**
- Create structured support tickets
- Generate professional subjects
- Estimate resolution times
- Send confirmation emails

### 4. **chatWithAgent** - Streaming Chat (Real-time)

Real-time conversational support with context awareness.

**Input:**
```typescript
{
  message: string;
  conversationHistory?: Array;
  customerId: string;
  ticketId?: string;                  // Optional linked ticket
}
```

**Output:**
```typescript
{
  response: string;                   // Agent's response
  suggestedActions?: string[];        // ["View statement", "Download receipt"]
  actionRequired: boolean;            // If customer action needed
}
```

**Use Cases:**
- Real-time customer support chat
- Multi-turn conversations
- Context-aware responses
- Suggested next actions

### 5. **resolveIssue** - Solution Generation

Provides step-by-step solutions for customer issues.

**Input:**
```typescript
{
  issue: string;
  category: string;
  attemptedSolutions?: string[];      // Previous attempts
}
```

**Output:**
```typescript
{
  solution: string;                   // Clear solution description
  steps: string[];                    // Step-by-step instructions
  successLikelihood: number;          // 0-1 likelihood
  escalationNeeded: boolean;          // If human help needed
}
```

**Use Cases:**
- Provide self-service solutions
- Build knowledge base
- Reduce escalations
- Track solution effectiveness

### 6. **analyzeSentiment** - Emotional Intelligence

Analyzes customer message sentiment and emotions.

**Input:**
```typescript
{
  message: string;                    // Customer message
}
```

**Output:**
```typescript
{
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;                      // -1 to 1
  emotionTags: string[];              // e.g., ["frustrated", "urgent"]
  customerSatisfaction: number;       // 1-5 scale
}
```

**Use Cases:**
- Monitor customer satisfaction
- Identify frustrated customers
- Prioritize unhappy customers
- Track support quality metrics

### 7. **generateSupportResponse** - Response Generation

Creates professional support responses with customizable tone.

**Input:**
```typescript
{
  issue: string;
  tone?: 'formal' | 'friendly' | 'empathetic';
  includeActionItems?: boolean;
}
```

**Output:**
```typescript
{
  response: string;                   // Generated response
  actionItems?: string[];             // Steps to resolve
  followUpActions?: string[];         // Suggested follow-ups
}
```

**Use Cases:**
- Assist agents with responses
- Speed up support process
- Maintain consistent tone
- Provide action items

## Usage Examples

### Example 1: Classify and Respond to Customer Message

```typescript
import { useAICustomerService } from '@/hooks/use-ai-customer-service';

export function SupportChat() {
  const { classifyInquiry, loading } = useAICustomerService();

  const handleUserMessage = async (message: string) => {
    const result = await classifyInquiry(message);
    
    if (result.success) {
      const { category, priority, requiresEscalation } = result.data;
      console.log(`Category: ${category}, Priority: ${priority}`);
      
      if (requiresEscalation) {
        // Route to human agent
      }
    }
  };

  return (
    <input 
      placeholder="Describe your issue" 
      onSubmit={(e) => handleUserMessage(e.target.value)}
    />
  );
}
```

### Example 2: Create Support Ticket

```typescript
const { createSupportTicket } = useAICustomerService();

const result = await createSupportTicket(
  'customer-123',
  'I cannot access my account after password reset',
  'account',
  'high',
  'customer@email.com'
);

if (result.success) {
  console.log(`Ticket created: ${result.data.ticketNumber}`);
  // Send confirmation email
}
```

### Example 3: Analyze Sentiment

```typescript
const { analyzeSentiment } = useAICustomerService();

const result = await analyzeSentiment(
  "I'm extremely frustrated with this app. Nothing works!",
  'ticket-123'
);

if (result.success) {
  const { sentiment, customerSatisfaction } = result.data;
  
  if (sentiment === 'negative' && customerSatisfaction < 2) {
    // Escalate to manager
  }
}
```

### Example 4: Retrieve FAQs

```typescript
const { retrieveFAQs } = useAICustomerService();

const result = await retrieveFAQs(
  'How do I reset my PIN?',
  'account'
);

if (result.success && result.data.bestMatch) {
  // Display FAQ to customer
  console.log(result.data.bestMatch);
}
```

## Firebase Integration

### Database Structure

```
firestore/
├── supportTickets/
│   ├── {ticketId}
│   │   ├── customerId: string
│   │   ├── subject: string
│   │   ├── description: string
│   │   ├── category: string
│   │   ├── priority: string
│   │   ├── status: string
│   │   ├── createdAt: timestamp
│   │   ├── updatedAt: timestamp
│   │   ├── assignedAgent: string
│   │   ├── sentimentAnalysis: object
│   │   └── messages/ (subcollection)
│   │       ├── {messageId}
│   │       │   ├── role: string
│   │       │   ├── content: string
│   │       │   └── timestamp: timestamp
```

### Service Functions

```typescript
import {
  saveSupportTicket,
  getSupportTicket,
  updateSupportTicket,
  getCustomerTickets,
  saveConversationMessage,
  getConversationHistory,
  saveSentimentAnalysis,
  getPendingEscalations,
} from '@/ai/firebase-service';
```

## Environment Variables

Required for Genkit to function:

```env
# Google Vertex AI
GOOGLE_GENKIT_MODEL="gemini-2.5-pro"
GOOGLE_CLOUD_PROJECT_ID="your-project-id"

# Firebase
FIREBASE_PROJECT_ID="your-project-id"
```

## Integration Points

### Customer-Facing
- Chat widget in dashboard
- Support ticket creation form
- FAQ search interface
- Contact us page

### Admin/Agent Dashboard
- Incoming tickets queue
- Pending escalations
- Sentiment analytics
- Customer satisfaction metrics
- Ticket history

### Email Integration
- Ticket confirmation emails
- Resolution notifications
- Follow-up reminders
- Escalation alerts

## Performance & Scaling

- **Concurrent requests**: Handled via Firebase functions
- **Response time**: < 2 seconds (typically)
- **Conversation history**: Stored in Firestore subcollections
- **Sentiment tracking**: Historical sentiment data preserved
- **Scaling**: Firestore auto-scales, Genkit handles concurrent flows

## Best Practices

1. **Always use conversationHistory** for better context
2. **Save sentiment analysis** for analytics and monitoring
3. **Handle escalations gracefully** - don't force AI if complex
4. **Monitor error rates** - set up alerts
5. **Cache FAQs** - reduce API calls
6. **Rate limit** - prevent abuse
7. **Log all interactions** - compliance and debugging

## Troubleshooting

### Issue: Genkit model not responding
- Check Google Cloud credentials
- Verify PROJECT_ID environment variable
- Check quota limits

### Issue: Sentiment analysis inaccurate
- Update FAQ database with current issues
- Provide more conversation context
- Use ticket categorization for context

### Issue: Slow response times
- Enable caching for FAQs
- Use background jobs for ticket creation
- Consider CDN for static content

## Future Enhancements

- [ ] Multi-language support
- [ ] Voice/audio support
- [ ] Proactive notifications
- [ ] Customer feedback loop
- [ ] Knowledge base auto-learning
- [ ] Integration with external ticketing systems
- [ ] Advanced analytics dashboard
- [ ] Custom LLM fine-tuning

## Files Structure

```
src/
├── ai/
│   ├── genkit.ts                      # Main Genkit config
│   ├── firebase-service.ts            # Firestore integration
│   └── flows/
│       └── customer-service-flow.ts   # All flow definitions
├── app/
│   └── api/
│       └── ai/
│           └── customer-service/
│               └── route.ts           # API endpoint
└── hooks/
    └── use-ai-customer-service.ts    # React hook
```

## Support & Documentation

- [Genkit Docs](https://genkit.dev)
- [Google Vertex AI](https://cloud.google.com/vertex-ai)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
