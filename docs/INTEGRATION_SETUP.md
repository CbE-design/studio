# Genkit Customer Service Integration Guide

## ✅ Integration Status

All components are now fully integrated into your MoneyGO application:

| Component | Status | Location |
|-----------|--------|----------|
| Genkit Core Setup | ✅ Complete | `src/ai/genkit.ts` |
| Customer Service Flows | ✅ Complete | `src/ai/flows/customer-service-flow.ts` |
| Firebase Integration | ✅ Complete | `src/ai/firebase-service.ts` |
| API Endpoint | ✅ Complete | `src/app/api/ai/customer-service/route.ts` |
| React Hook | ✅ Complete | `src/hooks/use-ai-customer-service.ts` |
| Example Component | ✅ Complete | `src/components/customer-service-chat-example.tsx` |
| AI Chat Page | ✅ Integrated | `src/app/(app)/ai-chat/page.tsx` |
| Dependencies | ✅ Added | `package.json` |

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install the new Genkit packages:
- `@genkit-ai/core` - Core Genkit framework
- `@genkit-ai/flow` - Flow definitions
- `@genkit-ai/google-vertexai` - Google Vertex AI integration

### 2. Configure Environment Variables

Add these to your `.env.local`:

```env
# Google Vertex AI / Genkit
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_REGION=us-central1

# Firebase (already configured)
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### 3. Verify Google Cloud Setup

Ensure your Google Cloud project has:
- ✅ Vertex AI API enabled
- ✅ Service account with appropriate permissions
- ✅ Credentials configured (already done via firebase-admin)

---

## 📋 Quick Start

### Using the Customer Service Chat

The AI chat page is now live at `/ai-chat`:

```typescript
// Page automatically uses CustomerServiceChatExample component
// Navigate to: http://localhost:3000/ai-chat
```

### Programmatic Usage

```typescript
import { useAICustomerService } from '@/hooks/use-ai-customer-service';

export function MyComponent() {
  const { classifyInquiry, createSupportTicket, loading } = useAICustomerService();

  const handleSupport = async (message: string) => {
    // Classify the inquiry
    const result = await classifyInquiry(message);
    
    if (result.success) {
      console.log('Category:', result.data.category);
      console.log('Priority:', result.data.priority);
    }
  };

  return (
    <button onClick={() => handleSupport('I cannot login')}>
      Get Support
    </button>
  );
}
```

---

## 🔌 API Integration

### Endpoint: `/api/ai/customer-service`

All flows are accessible via POST requests:

```bash
curl -X POST http://localhost:3000/api/ai/customer-service \
  -H "Content-Type: application/json" \
  -d '{
    "action": "classify",
    "data": {
      "message": "I cannot access my account",
      "conversationHistory": []
    }
  }'
```

### Available Actions

```typescript
// Classify inquiry
{ action: "classify", data: { message, conversationHistory } }

// Retrieve FAQs
{ action: "retrieveFAQs", data: { query, category } }

// Create support ticket
{ action: "createTicket", data: { customerId, inquiry, category, priority, customerEmail } }

// Resolve issue
{ action: "resolveIssue", data: { issue, category, attemptedSolutions } }

// Analyze sentiment
{ action: "analyzeSentiment", data: { message, ticketId } }

// Generate response
{ action: "generateResponse", data: { issue, tone, includeActionItems } }
```

---

## 🗄️ Firebase Firestore Schema

Support tickets are stored in Firestore:

```
supportTickets/
├── {ticketId}
│   ├── customerId: string
│   ├── subject: string
│   ├── description: string
│   ├── category: string (billing|technical|account|fraud|general|complaint|feature-request)
│   ├── priority: string (low|medium|high|urgent)
│   ├── status: string (open|in-progress|waiting-customer|resolved|closed)
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── assignedAgent: string (optional)
│   ├── sentimentAnalysis: {
│   │   sentiment: string (positive|neutral|negative)
│   │   score: number (-1 to 1)
│   │   emotionTags: string[]
│   │   customerSatisfaction: number (1-5)
│   │ }
│   ├── lastAnalyzedAt: timestamp
│   └── messages/ (subcollection)
│       └── {messageId}
│           ├── role: string (user|assistant|system)
│           ├── content: string
│           └── timestamp: timestamp
```

---

## 📚 Available Functions

### Firebase Service (`src/ai/firebase-service.ts`)

```typescript
// Ticket Management
saveSupportTicket(ticketId, ticket)        // Create ticket
getSupportTicket(ticketId)                 // Get ticket details
updateSupportTicket(ticketId, updates)     // Update ticket
getCustomerTickets(customerId)             // Get all customer tickets

// Conversation Management
saveConversationMessage(ticketId, message) // Save message
getConversationHistory(ticketId)           // Get all messages

// Analytics
saveSentimentAnalysis(ticketId, analysis)  // Save sentiment

// Escalations
getPendingEscalations()                    // Get urgent tickets
```

### React Hook (`src/hooks/use-ai-customer-service.ts`)

```typescript
const {
  loading,
  error,
  classifyInquiry,
  retrieveFAQs,
  createSupportTicket,
  resolveIssue,
  analyzeSentiment,
  generateSupportResponse,
} = useAICustomerService();
```

---

## 🔄 Integration Flow

```
User Message
    ↓
ChatUI Component
    ↓
useAICustomerService Hook
    ↓
/api/ai/customer-service Endpoint
    ↓
Genkit Flows (classifyInquiry, etc.)
    ↓
Google Vertex AI (Gemini Model)
    ↓
Response + Firebase Persistence
    ↓
Return to UI for Display
```

---

## 🧪 Testing

### Test Classification

```typescript
const result = await classifyInquiry(
  "I can't reset my password"
);
// Expected: category = 'account', priority = 'high'
```

### Test Ticket Creation

```typescript
const result = await createSupportTicket(
  'user-123',
  'Transaction failed',
  'billing',
  'high'
);
// Expected: ticketId, ticketNumber, confirmationMessage
```

### Test Sentiment Analysis

```typescript
const result = await analyzeSentiment(
  "I'm frustrated with this app!"
);
// Expected: sentiment = 'negative', customerSatisfaction < 3
```

---

## ⚙️ Configuration Options

### Genkit Model

To use a different model, update `src/ai/genkit.ts`:

```typescript
const ai = genkit({
  plugins: [googleAI()],
  model: 'gemini-2.5-pro', // Change this
});
```

Available models:
- `gemini-2.5-pro` (recommended)
- `gemini-2.0-pro`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

### Response Tones

Generate responses with different tones:

```typescript
generateSupportResponse(
  issue,
  tone: 'formal' | 'friendly' | 'empathetic'
);
```

### FAQ Database

Update FAQs in `retrieveFAQs()` flow:

```typescript
const mockFAQs = [
  {
    question: 'Your question',
    answer: 'Your answer',
    category: 'general',
    relevanceScore: 0.9,
  },
  // Add more FAQs
];
```

---

## 🐛 Troubleshooting

### Issue: "Genkit model not responding"
- ✅ Check Google Cloud credentials
- ✅ Verify `GOOGLE_CLOUD_PROJECT_ID` env var
- ✅ Enable Vertex AI API in Google Cloud Console

### Issue: "Firebase document not found"
- ✅ Verify Firestore is initialized
- ✅ Check database rules allow read/write
- ✅ Ensure `customerId` is correct

### Issue: "API returns 500 error"
- ✅ Check browser console for error details
- ✅ Check server logs with `npm run dev`
- ✅ Verify all environment variables are set

### Issue: "Slow response times"
- ✅ Genkit responses typically take 1-3 seconds
- ✅ Consider caching FAQs
- ✅ Use background jobs for non-urgent operations

---

## 🔐 Security Considerations

1. **API Authentication**
   - Add authentication to `/api/ai/customer-service`
   - Verify user is authenticated before processing

2. **Rate Limiting**
   - Implement rate limiting on API endpoint
   - Prevent abuse of free tier services

3. **Data Privacy**
   - Store PII in secure fields
   - Follow data retention policies
   - Encrypt sensitive data

4. **Firestore Security Rules**
   ```firestore
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /supportTickets/{ticketId} {
         allow read, write: if request.auth.uid == resource.data.customerId;
       }
     }
   }
   ```

---

## 📈 Monitoring & Analytics

Track support metrics:

```typescript
// Get customer satisfaction
const { tickets } = await getCustomerTickets(customerId);
const avgSatisfaction = tickets.reduce((sum, t) => 
  sum + (t.satisfactionRating || 0), 0) / tickets.length;

// Track escalations
const { escalations } = await getPendingEscalations();
console.log(`Pending escalations: ${escalations.length}`);

// Analyze sentiment trends
const mostFrequentSentiment = tickets
  .map(t => t.sentimentAnalysis?.sentiment)
  .reduce((obj, sentiment) => ({
    ...obj,
    [sentiment]: (obj[sentiment] || 0) + 1
  }), {});
```

---

## 🎯 Next Steps

1. **Customize FAQs** - Add domain-specific knowledge
2. **Add Authentication** - Protect the API endpoints
3. **Implement Analytics Dashboard** - Track metrics
4. **Setup Email Notifications** - Send ticket updates
5. **Train on Custom Data** - Fine-tune responses
6. **Mobile Optimization** - Improve mobile experience
7. **Multilingual Support** - Support multiple languages
8. **Voice Support** - Add voice input/output

---

## 📞 Support

For issues or questions:
1. Check `/docs/genkit-customer-service.md` for detailed API docs
2. Review `src/ai/flows/customer-service-flow.ts` for flow definitions
3. Check Example component: `src/components/customer-service-chat-example.tsx`

---

## 📝 Files Reference

| File | Purpose |
|------|---------|
| `src/ai/genkit.ts` | Genkit initialization |
| `src/ai/flows/customer-service-flow.ts` | All AI flows |
| `src/ai/firebase-service.ts` | Firebase integration |
| `src/app/api/ai/customer-service/route.ts` | API endpoint |
| `src/hooks/use-ai-customer-service.ts` | React hook |
| `src/components/customer-service-chat-example.tsx` | Example UI |
| `src/app/(app)/ai-chat/page.tsx` | Chat page (integrated) |
| `docs/genkit-customer-service.md` | Full documentation |

---

**Integration Date:** February 19, 2026  
**Status:** ✅ Complete and Ready for Use
