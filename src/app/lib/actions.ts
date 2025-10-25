
'use server';

import 'dotenv/config';
import { z } from 'zod';
import { getPersonalizedFinancialTips, PersonalizedFinancialTipsOutput } from '@/ai/flows/personalized-financial-tips';
import { revalidatePath } from 'next/cache';
import { collection, doc, runTransaction, getDoc } from 'firebase/firestore';
import { firestore } from '@/app/lib/firebase';
import type { Transaction, TransactionType, Account, User } from './definitions';
import { calculateFee } from './fees';
import { generateConfirmationPdf } from './confirmation-letter-generator';
import { generateProofOfPaymentPdf } from './pop-generator';
import { functions, db } from './firebase-admin';
import { format } from 'date-fns';
import { formatCurrency } from './data';

const FormSchema = z.object({
  income: z.coerce.number().positive({ message: 'Please enter a valid income.' }),
  spendingHabits: z.string().min(10, { message: 'Please describe your spending habits in more detail (at least 10 characters).' }),
  budget: z.string().min(10, { message: 'Please describe your budget in more detail (at least 10 characters).' }),
});

export type State = {
  errors?: {
    income?: string[];
    spendingHabits?: string[];
    budget?: string[];
  };
  message: string | null;
  data: PersonalizedFinancialTipsOutput | null;
};

export async function getFinancialTipsAction(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = FormSchema.safeParse({
    income: formData.get('income'),
    spendingHabits: formData.get('spendingHabits'),
    budget: formData.get('budget'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Failed to get tips.',
      data: null,
    };
  }
  
  const { income, spendingHabits, budget } = validatedFields.data;

  try {
    const result = await getPersonalizedFinancialTips({ income, spendingHabits, budget });
    return {
        message: 'Success! Here are your personalized tips.',
        data: result,
        errors: {},
    }
  } catch (error) {
    console.error(error);
    return {
        message: 'An unexpected error occurred while generating tips. Please try again.',
        data: null,
        errors: {},
    }
  }
}

const TransactionSchema = z.object({
    fromAccountId: z.string().min(1, { message: 'From Account is required.'}),
    userId: z.string().min(1, { message: 'User ID is required.'}),
    amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Amount must be a positive number.' }),
    recipientName: z.string().optional(),
    yourReference: z.string().optional(),
    recipientReference: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    paymentType: z.string(), // e.g. 'Instant Pay', 'Standard EFT'
});

type TransactionInput = z.infer<typeof TransactionSchema>;

type TransactionResult = {
  success: boolean;
  message: string;
  transactionId?: string;
  errors?: any;
};

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
        let mainTxId: string | undefined;
        const { fromAccountId, userId, amount, recipientName, yourReference, recipientReference, bankName, accountNumber, paymentType } = validatedFields.data;
        const numericAmount = parseFloat(amount);
        
        const transactionType: TransactionType = paymentType === 'Instant Pay' ? 'EFT_IMMEDIATE' : 'EFT_STANDARD';

        const generateRandomSuffix = (length: number) => Math.random().toString().substring(2, 2 + length);
        const generateSecurityCode = () => Array.from({ length: 40 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');
        
        await runTransaction(firestore, async (transaction) => {
            const accountRef = doc(firestore, 'users', userId, 'bankAccounts', fromAccountId);
            const accountDoc = await transaction.get(accountRef);

            if (!accountDoc.exists()) {
                throw new Error("Account not found.");
            }

            const accountData = accountDoc.data() as Account;
            const currentBalance = accountData.balance || 0;
            
            const { amount: feeAmount, description: feeDescription } = calculateFee(numericAmount, transactionType, accountData.type);

            const totalDebit = numericAmount + feeAmount;
            if (currentBalance < totalDebit) {
                throw new Error("Insufficient funds to complete the transaction and cover fees.");
            }
            
            const newBalance = currentBalance - totalDebit;

            const newTransactionRef = doc(collection(firestore, `users/${userId}/bankAccounts/${fromAccountId}/transactions`));
            mainTxId = newTransactionRef.id;

            const popReferenceNumber = `${format(new Date(), 'yyyy-MM-dd')}/NEDBANK/${generateRandomSuffix(12)}`;
            const popSecurityCode = generateSecurityCode();

            const mainTransactionData: Transaction = {
                id: newTransactionRef.id,
                userId: userId,
                fromAccountId: fromAccountId,
                amount: numericAmount,
                type: 'debit' as const,
                transactionType: transactionType,
                date: new Date().toISOString(),
                description: (recipientName || 'RECIPIENT').toUpperCase(),
                recipientName: recipientName ? recipientName.toUpperCase() : null,
                yourReference: yourReference || null,
                recipientReference: recipientReference || null,
                bank: bankName || null,
                accountNumber: accountNumber || null,
                popReferenceNumber,
                popSecurityCode
            };
            transaction.set(newTransactionRef, mainTransactionData);

            if (feeAmount > 0) {
                const feeTransactionRef = doc(collection(firestore, `users/${userId}/bankAccounts/${fromAccountId}/transactions`));
                const feeTransactionData = {
                    id: feeTransactionRef.id,
                    userId: userId,
                    fromAccountId: fromAccountId,
                    amount: feeAmount,
                    type: 'debit' as const,
                    transactionType: 'BANK_FEE' as TransactionType,
                    date: new Date().toISOString(),
                    description: feeDescription,
                };
                transaction.set(feeTransactionRef, feeTransactionData);
            }

            transaction.update(accountRef, { balance: newBalance });
        });

        try {
            const benificiarySnapshot = await db.collection('users').doc(userId).collection('beneficiaries').where('accountNumber', '==', accountNumber).limit(1).get();

            if (!benificiarySnapshot.empty) {
                const benificiaryData = benificiarySnapshot.docs[0].data();
                if(benificiaryData && benificiaryData.phoneNumber) {
                    const sendSmsFunction = functions.httpsCallable('sendSms');
                    await sendSmsFunction({
                        to: benificiaryData.phoneNumber,
                        text: `You have received a payment of ${formatCurrency(numericAmount, 'R')} from VAN SCHALKWYK FAMILY TRUST. Ref: ${recipientReference || ''}`
                    });
                    console.log('SMS notification call succeeded.');
                }
            }
        } catch (smsError) {
            console.error('SMS notification call failed:', smsError);
        }

        revalidatePath(`/account/${fromAccountId}`);
        revalidatePath('/dashboard');
        
        return { 
            success: true, 
            message: 'Transaction created successfully.',
            transactionId: mainTxId,
        };

    } catch (error: any) {
        console.error('Firestore transaction failed:', error);
        return { 
            success: false, 
            message: error.message || 'An error occurred while creating the transaction.'
        };
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
        
        const accountDoc = await getDoc(doc(firestore, `users/${transaction.userId}/bankAccounts/${transaction.fromAccountId}`));
        if (!accountDoc.exists()) {
             throw new Error("Account for transaction not found.");
        }
        const accountData = accountDoc.data() as Account;


        const pdfBytes = await generateProofOfPaymentPdf(transaction, accountData);
        return pdfBytes;
    } catch (e: any) {
        console.error("Failed to generate proof of payment:", e);
        return { error: e.message || "An unknown error occurred during PDF generation." };
    }
}


export async function markTransactionAsFailedAction(
  userId: string,
  accountId: string,
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await runTransaction(firestore, async (firestoreTransaction) => {
      // --- READ PHASE ---
      const txRef = doc(firestore, `users/${userId}/bankAccounts/${accountId}/transactions/${transactionId}`);
      const accountRef = doc(firestore, `users/${userId}/bankAccounts/${accountId}`);
      
      const txSnap = await firestoreTransaction.get(txRef);
      const accountSnap = await firestoreTransaction.get(accountRef);

      if (!txSnap.exists()) {
        throw new Error('Original transaction not found.');
      }
      if (!accountSnap.exists()) {
        throw new Error('Account not found.');
      }
      
      const txData = txSnap.data() as Transaction;
      const accountData = accountSnap.data() as Account;

      // --- WRITE PHASE ---
      
      // 1. Create a log in failedTransactions
      const failedTxRef = doc(collection(firestore, `users/${userId}/bankAccounts/${accountId}/failedTransactions`));
      const newFailedTxData = {
        id: failedTxRef.id,
        returnDate: new Date().toISOString().split('T')[0],
        fromAccount: accountData.accountNumber || 'N/A', 
        toAccount: txData.accountNumber || 'N/A',
        beneficiaryName: txData.recipientName || txData.description,
        failureReason: 'Not Authorised',
        originalAmount: txData.amount,
        originalTransactionId: txData.id,
      };
      firestoreTransaction.set(failedTxRef, newFailedTxData);

      // 2. Create a new credit transaction to represent the return
      const returnTxRef = doc(collection(firestore, `users/${userId}/bankAccounts/${accountId}/transactions`));
      const returnTxData: Transaction = {
          id: returnTxRef.id,
          userId: userId,
          fromAccountId: accountId,
          amount: txData.amount, // Credit the same amount
          type: 'credit',
          transactionType: 'EFT_STANDARD', // Or a new 'RETURN' type if defined
          date: new Date().toISOString(),
          description: `RETURN: ${txData.description}`,
          recipientName: 'SELF',
      };
      firestoreTransaction.set(returnTxRef, returnTxData);
      
      // 3. Update the account balance by adding the amount back
      const newBalance = accountData.balance + txData.amount;
      firestoreTransaction.update(accountRef, { balance: newBalance });

      // 4. The original transaction is NOT deleted. It remains as a record.
    });

    revalidatePath(`/account/${accountId}`);
    revalidatePath(`/account/${accountId}/transaction/${transactionId}`);
    return { success: true, message: 'Transaction successfully marked as returned and funds reversed.' };
  } catch (error: any) {
    console.error('Failed to mark transaction as failed:', error);
    return { success: false, message: error.message || 'Failed to mark transaction as failed.' };
  }
}

const EmailPopSchema = z.object({
  email: z.string().email(),
  transactionId: z.string(),
  accountId: z.string(),
  userId: z.string(),
});

type EmailPopInput = z.infer<typeof EmailPopSchema>;

export async function emailProofOfPaymentAction(input: EmailPopInput): Promise<{ success: boolean; message: string; }> {
  const validatedFields = EmailPopSchema.safeParse(input);
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid input provided.",
    };
  }

  const { email, transactionId, accountId, userId } = validatedFields.data;

  try {
    const txDocRef = doc(firestore, `users/${userId}/bankAccounts/${accountId}/transactions/${transactionId}`);
    const txSnap = await getDoc(txDocRef);
    if (!txSnap.exists()) {
      throw new Error('Transaction not found.');
    }
    const transaction = txSnap.data() as Transaction;
    
    const accountDocRef = doc(firestore, `users/${userId}/bankAccounts/${accountId}`);
    const accountSnap = await getDoc(accountDocRef);
    if (!accountSnap.exists()) {
      throw new Error('Account not found.');
    }
    const account = accountSnap.data() as Account;

    const pdfBytes = await generateProofOfPaymentPdf(transaction, account);
    
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    
    const emailData = {
      to: email,
      subject: `Proof of Payment: ${transaction.recipientName || transaction.description}`,
      html: `
        <p>Dear Customer,</p>
        <p>Please find attached the proof of payment for your recent transaction.</p>
        <p><b>Recipient:</b> ${transaction.recipientName || 'N/A'}</p>
        <p><b>Amount:</b> ${formatCurrency(transaction.amount, account.currency)}</p>
        <p>Thank you for banking with us.</p>
        <p><b>Nedbank</b></p>
      `,
      attachments: [
        {
          filename: `Proof-of-Payment-${transactionId}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf',
        },
      ],
    };

    const sendEmailFunction = functions.httpsCallable('sendEmail');
    const result = await sendEmailFunction(emailData);

    if (result.data && (result.data as any).success) {
      return { success: true, message: 'Email sent successfully.' };
    } else {
      throw new Error((result.data as any).message || 'Failed to send email via Cloud Function.');
    }
  } catch (e: any) {
    console.error('Failed to email proof of payment:', e);
    return { success: false, message: e.message || 'An unknown error occurred.' };
  }
}
