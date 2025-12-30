
'use server';
/**
 * @fileOverview A personalized financial tips AI agent.
 *
 * - getPersonalizedFinancialTips - A function that provides financial tips.
 * - PersonalizedFinancialTipsInput - The input type for the getPersonalizedFinancialTips function.
 * - PersonalizedFinancialTipsOutput - The return type for the getPersonalizedFinancialTips function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getBudgetTool } from '@/ai/tools/get-budget-tool';

const PersonalizedFinancialTipsInputSchema = z.object({
  income: z.number().describe('The user\'s monthly income.'),
  spendingHabits: z.string().describe('A description of the user\'s spending habits.'),
  budget: z.string().describe('A description of the user\'s current budget.'),
});
export type PersonalizedFinancialTipsInput = z.infer<typeof PersonalizedFinancialTipsInputSchema>;

const PersonalizedFinancialTipsOutputSchema = z.object({
  tips: z.array(z.string()).describe('A list of personalized financial tips.'),
  shouldUseTool: z
    .boolean()
    .describe(
      'Whether the user should use the budget tool. This should be true if the user has a loose budget.'
    ),
});
export type PersonalizedFinancialTipsOutput = z.infer<typeof PersonalizedFinancialTipsOutputSchema>;

export async function getPersonalizedFinancialTips(
  input: PersonalizedFinancialTipsInput
): Promise<PersonalizedFinancialTipsOutput> {
  return getPersonalizedFinancialTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getFinancialTipsPrompt',
  input: { schema: PersonalizedFinancialTipsInputSchema },
  output: { schema: PersonalizedFinancialTipsOutputSchema },
  tools: [getBudgetTool],
  prompt: `You are a helpful financial assistant. Your goal is to provide personalized financial tips based on the user's income, spending habits, and budget.
  
Income: {{{income}}}
Spending Habits: {{{spendingHabits}}}
Budget: {{{budget}}}

Please provide a list of 3-5 personalized financial tips. In addition, please determine if the user should use the budget tool. The user should use the budget tool if their budget is not well-defined.`,
});

const getPersonalizedFinancialTipsFlow = ai.defineFlow(
  {
    name: 'getPersonalizedFinancialTipsFlow',
    inputSchema: PersonalizedFinancialTipsInputSchema,
    outputSchema: PersonalizedFinancialTipsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
