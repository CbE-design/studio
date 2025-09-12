'use server';

/**
 * @fileOverview Personalized financial tips flow using AI.
 *
 * - getPersonalizedFinancialTips - A function that generates personalized financial tips.
 * - PersonalizedFinancialTipsInput - The input type for the getPersonalizedFinancialTips function.
 * - PersonalizedFinancialTipsOutput - The return type for the getPersonalizedFinancialTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedFinancialTipsInputSchema = z.object({
  income: z.number().describe('Your monthly income.'),
  spendingHabits: z
    .string()
    .describe(
      'A description of your spending habits, including categories and amounts spent.'
    ),
  budget: z.string().describe('Your current budget details.'),
});

export type PersonalizedFinancialTipsInput = z.infer<
  typeof PersonalizedFinancialTipsInputSchema
>;

const PersonalizedFinancialTipsOutputSchema = z.object({
  tips: z.array(z.string()).describe('A list of personalized financial tips.'),
  shouldUseTool: z
    .boolean()
    .describe(
      'A boolean value indicating whether the user should use the Nedbank Budget Tool.'
    ),
});

export type PersonalizedFinancialTipsOutput = z.infer<
  typeof PersonalizedFinancialTipsOutputSchema
>;

export async function getPersonalizedFinancialTips(
  input: PersonalizedFinancialTipsInput
): Promise<PersonalizedFinancialTipsOutput> {
  return personalizedFinancialTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedFinancialTipsPrompt',
  input: {schema: PersonalizedFinancialTipsInputSchema},
  output: {schema: PersonalizedFinancialTipsOutputSchema},
  prompt: `You are a financial advisor providing personalized tips to users based on their financial situation.

  Consider the user's income, spending habits, and budget to generate relevant and actionable tips.

  Income: {{income}}
  Spending Habits: {{spendingHabits}}
  Budget: {{budget}}

  Based on this information, provide 3 personalized financial tips to improve their money management skills.

  Also, determine whether the user should use the Nedbank Budget Tool based on their current financial situation. If their budget is not well-defined or they have poor spending habits, recommend using the tool by setting shouldUseTool to true; otherwise, set it to false.
  Format the tips as a numbered list.
  `,
});

const personalizedFinancialTipsFlow = ai.defineFlow(
  {
    name: 'personalizedFinancialTipsFlow',
    inputSchema: PersonalizedFinancialTipsInputSchema,
    outputSchema: PersonalizedFinancialTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
