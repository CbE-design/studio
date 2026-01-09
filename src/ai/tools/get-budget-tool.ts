
'use server';
/**
 * @fileOverview A tool to get the user's budget.
 *
 * - getBudgetTool - A tool that returns the user's budget.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const getBudgetTool = ai.defineTool(
  {
    name: 'getBudgetTool',
    description: "A tool to get the user's budget.",
    inputSchema: z.object({
      income: z.number().describe("The user's monthly income."),
      spendingHabits: z.string().describe("The user's spending habits."),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    return 'The user does not have a budget.';
  }
);
