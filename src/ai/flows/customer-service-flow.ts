'use server';
/**
 * @fileOverview A customer service AI agent for a bank.
 *
 * - customerService - A function that handles customer service queries.
 * - CustomerServiceInput - The input type for the customerService function.
 * - CustomerServiceOutput - The return type for the customerService function.
 */

// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';
//
// const CustomerServiceInputSchema = z.object({
//   query: z.string().describe("The user's query."),
//   history: z.array(z.object({
//     role: z.enum(['user', 'model']),
//     content: z.string(),
//   })).describe('The conversation history.'),
// });
// export type CustomerServiceInput = z.infer<typeof CustomerServiceInputSchema>;
//
// export type CustomerServiceOutput = string;
//
// export async function customerService(input: CustomerServiceInput): Promise<CustomerServiceOutput> {
//   return customerServiceFlow(input);
// }
//
// const prompt = ai.definePrompt({
//   name: 'customerServicePrompt',
//   input: {schema: CustomerServiceInputSchema},
//   prompt: `You are Neo, a helpful and friendly AI assistant for Nedbank. Your goal is to assist users with their banking questions.
//
// You should be conversational and provide clear, concise answers. If a user asks about a topic you don't have information on, politely state that you can't help with that specific query.
//
// Here is the conversation history:
// {{#each history}}
// {{role}}: {{{content}}}
// {{/each}}
//
// User's latest query:
// {{{query}}}
//
// Your response:`,
// });
//
// const customerServiceFlow = ai.defineFlow(
//   {
//     name: 'customerServiceFlow',
//     inputSchema: CustomerServiceInputSchema,
//     outputSchema: z.string(),
//   },
//   async input => {
//     const {output} = await prompt(input);
//     return output!;
//   }
// );

export {};
