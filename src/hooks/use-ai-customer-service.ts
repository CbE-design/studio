'use client';

import { useState, useCallback } from 'react';

interface AIFlowResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UseAICustomerServiceOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useAICustomerService(options?: UseAICustomerServiceOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAI = useCallback(
    async <T = any>(
      action: string,
      data: any
    ): Promise<AIFlowResponse<T>> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/customer-service', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, data }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const result: AIFlowResponse<T> = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Unknown error');
        }

        setLoading(false);
        options?.onSuccess?.(result.data);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        options?.onError?.(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [options]
  );

  // Classify customer inquiry
  const classifyInquiry = useCallback(
    async (message: string, conversationHistory?: any[]) => {
      return callAI('classify', { message, conversationHistory });
    },
    [callAI]
  );

  // Retrieve relevant FAQs
  const retrieveFAQs = useCallback(
    async (query: string, category?: string) => {
      return callAI('retrieveFAQs', { query, category });
    },
    [callAI]
  );

  // Create support ticket
  const createSupportTicket = useCallback(
    async (
      customerId: string,
      inquiry: string,
      category: string,
      priority: string,
      customerEmail?: string
    ) => {
      return callAI('createTicket', {
        customerId,
        inquiry,
        category,
        priority,
        customerEmail,
      });
    },
    [callAI]
  );

  // Resolve issue with steps
  const resolveIssue = useCallback(
    async (
      issue: string,
      category: string,
      attemptedSolutions?: string[]
    ) => {
      return callAI('resolveIssue', {
        issue,
        category,
        attemptedSolutions,
      });
    },
    [callAI]
  );

  // Analyze sentiment of message
  const analyzeSentiment = useCallback(
    async (message: string, ticketId?: string) => {
      return callAI('analyzeSentiment', { message, ticketId });
    },
    [callAI]
  );

  // Generate support response
  const generateSupportResponse = useCallback(
    async (
      issue: string,
      tone?: 'formal' | 'friendly' | 'empathetic',
      includeActionItems?: boolean
    ) => {
      return callAI('generateResponse', {
        issue,
        tone,
        includeActionItems,
      });
    },
    [callAI]
  );

  return {
    loading,
    error,
    classifyInquiry,
    retrieveFAQs,
    createSupportTicket,
    resolveIssue,
    analyzeSentiment,
    generateSupportResponse,
  };
}
