'use client';

import { useState, useRef, useEffect } from 'react';
import { useAICustomerService } from '@/hooks/use-ai-customer-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, LoadingCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  classification?: {
    category: string;
    priority: string;
    confidence: number;
  };
  sentiment?: {
    sentiment: string;
    score: number;
    rating: number;
  };
}

export function CustomerServiceChatExample() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ticketId, setTicketId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { classifyInquiry, createSupportTicket, analyzeSentiment, loading } =
    useAICustomerService();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      // Classify the inquiry
      const classificationResult = await classifyInquiry(
        input,
        messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }))
      );

      if (!classificationResult.success) {
        throw new Error(classificationResult.error);
      }

      const classification = classificationResult.data;

      // Analyze sentiment
      const sentimentResult = await analyzeSentiment(input, ticketId);

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: classification.suggestedResponse,
        timestamp: new Date(),
        classification: {
          category: classification.category,
          priority: classification.priority,
          confidence: classification.confidence,
        },
        sentiment: sentimentResult.success
          ? {
              sentiment: sentimentResult.data.sentiment,
              score: sentimentResult.data.score,
              rating: sentimentResult.data.customerSatisfaction,
            }
          : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // If escalation needed, create ticket
      if (
        classification.requiresEscalation &&
        !ticketId
      ) {
        const ticketResult = await createSupportTicket(
          'user-123', // Replace with actual customer ID
          input,
          classification.category,
          classification.priority
        );

        if (ticketResult.success) {
          setTicketId(ticketResult.data.ticketId);

          // Add ticket confirmation message
          const ticketMessage: Message = {
            role: 'assistant',
            content: `${ticketResult.data.confirmationMessage}\n\nTicket #: ${ticketResult.data.ticketNumber}\nEstimated Resolution: ${ticketResult.data.estimatedResolutionTime}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, ticketMessage]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content:
          'Sorry, I encountered an error. Please try again or contact our support team.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const getPriorityColor = (
    priority: string
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      billing: 'bg-blue-100 text-blue-800',
      technical: 'bg-red-100 text-red-800',
      account: 'bg-purple-100 text-purple-800',
      fraud: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800',
      complaint: 'bg-pink-100 text-pink-800',
      'feature-request': 'bg-green-100 text-green-800',
    };
    return colors[category] || colors.general;
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      default:
        return '😐';
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4">
        <h2 className="text-xl font-bold">MoneyGO AI Support</h2>
        <p className="text-sm text-blue-100 mt-1">
          Chat with our intelligent support agent
        </p>
        {ticketId && <p className="text-xs text-blue-200 mt-2">Ticket: {ticketId}</p>}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <p className="text-lg font-medium mb-2">Welcome to MoneyGO Support</p>
              <p className="text-sm">
                Describe your issue and our AI agent will help you immediately
              </p>
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-2',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <Card
              className={cn(
                'max-w-xs lg:max-w-md p-3 rounded-lg',
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              )}
            >
              <p className="text-sm">{message.content}</p>

              {/* Classification Info */}
              {message.classification && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        getCategoryColor(message.classification.category)
                      )}
                    >
                      {message.classification.category}
                    </Badge>
                    <Badge
                      variant={getPriorityColor(message.classification.priority)}
                      className="text-xs"
                    >
                      {message.classification.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Confidence: {(message.classification.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              )}

              {/* Sentiment Info */}
              {message.sentiment && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs flex items-center justify-between">
                  <span>
                    {getSentimentEmoji(message.sentiment.sentiment)} {message.sentiment.sentiment}
                  </span>
                  <span className="text-gray-500">
                    Rating: {message.sentiment.rating}/5
                  </span>
                </div>
              )}

              <p className={cn(
                'text-xs mt-2 opacity-70',
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              )}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 bg-white border-t border-gray-200"
      >
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Describe your issue..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="gap-2"
          >
            {loading ? (
              <LoadingCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
