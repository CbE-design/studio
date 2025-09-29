
'use server';

import { z } from 'zod';
import { getPersonalizedFinancialTips, PersonalizedFinancialTipsOutput } from '@/ai/flows/personalized-financial-tips';
import { revalidatePath } from 'next/cache';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { firestore } from '@/app/lib/firebase';

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
});

type TransactionInput = z.infer<typeof TransactionSchema>;

type TransactionResult = {
  success: boolean;
  message: string;
  transactionId?: string;
  errors?: any;
};

export async function createTransactionAction(data: TransactionInput): Promise<TransactionResult> {
    console.log('createTransactionAction invoked with data:', data);
    const validatedFields = TransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to create transaction.',
        };
    }

    try {
        const { fromAccountId, userId, amount, recipientName, yourReference, recipientReference, bankName, accountNumber } = validatedFields.data;
        const numericAmount = parseFloat(amount);
        
        const newTransactionRef = doc(collection(firestore, `users/${userId}/bankAccounts/${fromAccountId}/transactions`));

        await runTransaction(firestore, async (transaction) => {
            const accountRef = doc(firestore, 'users', userId, 'bankAccounts', fromAccountId);
            console.log(`Processing transaction for accountRef: ${accountRef.path}`);
            const accountDoc = await transaction.get(accountRef);

            if (!accountDoc.exists()) {
                throw new Error("Account not found.");
            }

            const currentBalance = accountDoc.data()?.balance || 0;
            const newBalance = currentBalance - numericAmount;

            console.log(`Current balance: ${currentBalance}, New balance: ${newBalance}`);

            // Update account balance
            transaction.update(accountRef, { balance: newBalance });
            console.log('Account balance updated in transaction.');

            // Create new transaction document
            const transactionData = {
                id: newTransactionRef.id,
                userId: userId,
                fromAccountId: fromAccountId,
                amount: numericAmount,
                type: 'debit' as const,
                date: new Date().toISOString(),
                description: `Payment to ${recipientName || 'recipient'}`,
                recipientName: recipientName || null,
                yourReference: yourReference || null,
                recipientReference: recipientReference || null,
                bank: bankName || null,
                accountNumber: accountNumber || null,
            };
            transaction.set(newTransactionRef, transactionData);
            console.log(`New transaction document set in transaction: ${newTransactionRef.path}`);
        });

        console.log('Firestore transaction committed successfully.');
        revalidatePath(`/account/${fromAccountId}`);
        revalidatePath('/dashboard'); // Also revalidate dashboard in case total balance is shown
        return { 
            success: true,
            message: 'Transaction created successfully.',
            transactionId: newTransactionRef.id
        };

    } catch (error: any) {
        console.error('Firestore transaction failed:', error);
        return { 
            success: false,
            message: error.message || 'An error occurred while creating the transaction.'
        };
    }
}
