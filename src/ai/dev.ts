import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-transaction-details.ts';
import '@/ai/flows/validate-banking-details.ts';
import '@/ai/flows/send-payment-notification.ts';
import '@/ai/flows/send-sms.ts';
import '@/ai/flows/calculate-banking-fees.ts';
import '@/ai/flows/generate-statement-reference.ts';
import '@/ai/flows/generate-proof-of-payment.ts';
import '@/ai/flows/generate-statement-pdf.ts';
import '@/ai/flows/send-email.ts';
