
'use server';

import { z } from 'zod';
import { getPersonalizedFinancialTips, PersonalizedFinancialTipsOutput } from '@/ai/flows/personalized-financial-tips';
import { revalidatePath } from 'next/cache';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { firestore } from '@/app/lib/firebase';
import type { Transaction, TransactionType, Account, User } from './definitions';
import { calculateFee } from './fees';
import { generateConfirmationPdf } from './confirmation-letter-generator';
import { generateProofOfPaymentPdf } from './pop-generator';
import { getFunctions } from 'firebase-admin/functions';
import { admin } from './firebase-admin';


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
            const mainTransactionData = {
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

        // After successful transaction, try to send SMS
        // Note: This part fails silently if it doesn't work, not to block the payment success flow.
        try {
            const functions = getFunctions(admin.app());
            const sendSms = httpsCallable(functions, 'sendSms');
            // This is a placeholder. In a real app, you would fetch the recipient's phone number.
            const recipientPhoneNumber = '+14155552671';
            
            await sendSms({
                to: recipientPhoneNumber,
                text: `You have received a payment of ${amount} from VAN SCHALKWYK FAMILY TRUST. Ref: ${recipientReference || ''}`
            });
            console.log('SMS notification call succeeded.');
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
        const pdfBytes = await generateProofOfPaymentPdf(transaction);
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
      const txRef = doc(
        firestore,
        `users/${userId}/bankAccounts/${accountId}/transactions/${transactionId}`
      );
      const txSnap = await firestoreTransaction.get(txRef);

      if (!txSnap.exists()) {
        throw new Error('Transaction not found.');
      }
      const txData = txSnap.data() as Transaction;
      
      const failedTxRef = doc(collection(firestore, `users/${userId}/bankAccounts/${accountId}/failedTransactions`));

      const newFailedTxData = {
        id: failedTxRef.id,
        returnDate: new Date().toISOString().split('T')[0],
        fromAccount: txData.accountNumber || 'N/A',
        toAccount: 'N/A', // This info isn't on the transaction record
        beneficiaryName: txData.recipientName || 'N/A',
        branchCode: 'N/A', // This info isn't on the transaction record
        failureReason: 'Manually marked as failed',
      };
      
      firestoreTransaction.set(failedTxRef, newFailedTxData);
      
      const accountRef = doc(firestore, `users/${userId}/bankAccounts/${accountId}`);
      const accountSnap = await firestoreTransaction.get(accountRef);

      if (accountSnap.exists()) {
        const accountData = accountSnap.data() as Account;
        // Reverse the transaction amount
        const newBalance = accountData.balance + txData.amount;
        firestoreTransaction.update(accountRef, { balance: newBalance });
      }

      // Delete the original transaction
      firestoreTransaction.delete(txRef);
    });

    revalidatePath(`/account/${accountId}`);
    revalidatePath(`/account/${accountId}/failed-transactions`);
    return { success: true, message: 'Transaction successfully marked as failed and reversed.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to mark transaction as failed.' };
  }
}
