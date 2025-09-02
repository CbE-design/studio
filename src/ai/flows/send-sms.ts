'use server';
/**
 * @fileOverview Sends an SMS message using Twilio.
 *
 * - sendSms - A function that takes a recipient phone number and message and sends it via Twilio.
 * - SendSmsInput - The input type for the sendSms function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Twilio from 'twilio';

const SendSmsInputSchema = z.object({
  to: z.string().describe('The recipient\'s phone number in E.164 format.'),
  message: z.string().describe('The content of the SMS message.'),
});
export type SendSmsInput = z.infer<typeof SendSmsInputSchema>;

export async function sendSms(input: SendSmsInput): Promise<void> {
  return sendSmsFlow(input);
}

const sendSmsFlow = ai.defineFlow(
  {
    name: 'sendSmsFlow',
    inputSchema: SendSmsInputSchema,
    outputSchema: z.void(),
  },
  async ({ to, message }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      throw new Error('Twilio credentials are not configured in .env file.');
    }

    const client = new Twilio(accountSid, authToken);

    try {
      await client.messages.create({
        body: message,
        from,
        to,
      });
      console.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      console.error('Failed to send SMS via Twilio:', error);
      // Re-throw the error to be caught by the calling function
      throw new Error('Twilio SMS sending failed.');
    }
  }
);
