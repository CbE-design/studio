'use server';

import 'dotenv/config';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Transaction, TransactionType, Account, User, TransactionInput, TransactionResult } from './definitions';
import { generateConfirmationPdf } from './confirmation-letter-generator';
import { generateProofOfPaymentPdf } from './pop-generator';
import { db as adminDb } from './firebase-admin';
import { createPayment, getAccountWithRealTimeBalance, processAuthorizedPayment, rejectPayment } from './repositories';
import { Resend } from 'resend';
import { format } from 'date-fns';

const TransactionSchema = z.object({
    fromAccountId: z.string().min(1, { message: 'From Account is required.'}),
    userId: z.string().min(1, { message: 'User ID is required.'}),
    amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Amount must be a positive number.' }),
    recipientName: z.string().optional(),
    yourReference: z.string().optional(),
    recipientReference: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    paymentType: z.string(), 
});

export async function createTransactionAction(data: TransactionInput): Promise<TransactionResult> {
    const validatedFields = TransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to create transaction.',
        };
    }

    try {
        const { fromAccountId, userId, amount, recipientName, yourReference, recipientReference, bankName, accountNumber, paymentType } = validatedFields.data;
        
        const txType: TransactionType = paymentType === 'Instant Pay' ? 'EFT_IMMEDIATE' : 'EFT_STANDARD';

        const result = await createPayment({
            userId,
            fromAccountId,
            amount: parseFloat(amount),
            recipientName: recipientName || 'RECIPIENT',
            bankName: bankName || undefined,
            accountNumber: accountNumber || undefined,
            yourReference: yourReference || undefined,
            recipientReference: recipientReference || undefined,
            transactionType: txType
        });

        revalidatePath(`/account/${fromAccountId}`);
        revalidatePath('/dashboard');
        
        return { 
            success: true, 
            message: 'Payment captured successfully. Awaiting trustee authorization.',
            transactionId: result.transactionId,
            popReferenceNumber: result.popReferenceNumber
        };

    } catch (error: any) {
        console.error('Transaction Action failed:', error);
        return { 
            success: false, 
            message: error.message || 'An error occurred while creating the transaction.'
        };
    }
}

export async function authorizePaymentAction(userId: string, accountId: string, transactionId: string) {
    try {
        await processAuthorizedPayment(userId, accountId, transactionId);
        revalidatePath(`/account/${accountId}`);
        revalidatePath('/dashboard');
        revalidatePath('/admin/authorizations');
        return { success: true, message: 'Payment authorized and processed successfully.' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Failed to authorize payment.' };
    }
}

export async function rejectPaymentAction(userId: string, accountId: string, transactionId: string) {
    try {
        await rejectPayment(userId, accountId, transactionId);
        revalidatePath(`/account/${accountId}`);
        revalidatePath('/admin/authorizations');
        return { success: true, message: 'Payment instruction rejected.' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Failed to reject payment.' };
    }
}

export async function generateConfirmationLetterAction(
    account: Account,
    user: User
): Promise<Uint8Array | { error: string }> {
    try {
        if (!account || !user) {
            throw new Error("User and account data are required.");
        }
        const pdfBytes = await generateConfirmationPdf(account, user);
        return pdfBytes;
    } catch (e: any) {
        console.error("Failed to generate confirmation letter:", e);
        return { error: e.message || "An unknown error occurred during PDF generation." };
    }
}

export async function generateProofOfPaymentAction(
    transaction: Transaction
): Promise<Uint8Array | { error: string }> {
    try {
        if (!transaction) {
            throw new Error("Transaction data is required.");
        }
        
        const accountData = await getAccountWithRealTimeBalance(transaction.userId!, transaction.fromAccountId!);
        if (!accountData) {
             throw new Error("Account for transaction not found.");
        }

        const pdfBytes = await generateProofOfPaymentPdf(transaction, accountData);
        return pdfBytes;
    } catch (e: any) {
        console.error("Failed to generate proof of payment:", e);
        return { error: e.message || "An unknown error occurred during PDF generation." };
    }
}

export async function sendProofOfPaymentEmailAction(
  transaction: Transaction,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('Email service not configured (RESEND_API_KEY missing).');
    }
    const resend = new Resend(resendApiKey);

    const accountData = await getAccountWithRealTimeBalance(transaction.userId!, transaction.fromAccountId!);
    if (!accountData) {
      throw new Error('Account not found.');
    }

    const pdfBytes = await generateProofOfPaymentPdf(transaction, accountData);
    const base64 = Buffer.from(pdfBytes).toString('base64');

    await resend.emails.send({
      from: 'Nedbank <noreply@notificationsnedbank.co.za>',
      to: recipientEmail,
      subject: 'Payment Notification',
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
          <p>A payment has been made to your account. To view the details of the payment, please open the attached PDF file.</p>
          <p>You may require Adobe Acrobat Reader on your computer to open the PDF file.</p>
          <p>Please do not reply as this email was sent from an unattended mailbox.</p>
        </div>
      `,
      attachments: [
        {
          filename: 'Proof_Of_Payment.pdf',
          content: base64,
        },
      ],
    });

    return { success: true, message: 'Email sent successfully.' };
  } catch (error: any) {
    console.error('Failed to send POP email:', error);
    return { success: false, message: error.message || 'Failed to send email.' };
  }
}
