
'use server';

import { z } from 'zod';
import { getPersonalizedFinancialTips, PersonalizedFinancialTipsOutput } from '@/ai/flows/personalized-financial-tips';
import { revalidatePath } from 'next/cache';
import { db, auth } from './firebase-admin';

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
    amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Amount must be a positive number.' }),
    recipientName: z.string().optional(),
    yourReference: z.string().optional(),
    recipientReference: z.string().optional(),
});

type TransactionInput = z.infer<typeof TransactionSchema>;

export async function createTransactionAction(data: TransactionInput, idToken: string) {
    const validatedFields = TransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to create transaction.',
        };
    }

    if (!idToken) {
        return { message: 'Authentication required.' };
    }

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;
        
        const { fromAccountId, amount, recipientName, yourReference, recipientReference } = validatedFields.data;
        const numericAmount = parseFloat(amount);
        
        const accountRef = db.doc(`users/${userId}/bankAccounts/${fromAccountId}`);
        const transactionCollectionRef = accountRef.collection('transactions');

        await db.runTransaction(async (t) => {
            const accountDoc = await t.get(accountRef);
            if (!accountDoc.exists) {
                throw new Error("Account not found.");
            }

            const currentBalance = accountDoc.data()?.balance || 0;
            const newBalance = currentBalance - numericAmount;

            // Update account balance
            t.update(accountRef, { balance: newBalance });

            // Create new transaction document
            const newTransactionRef = transactionCollectionRef.doc();
            t.set(newTransactionRef, {
                userId: userId,
                fromAccountId: fromAccountId,
                amount: numericAmount,
                type: 'debit',
                date: new Date().toISOString(),
                description: `Payment to ${recipientName || 'recipient'}`,
                recipientName: recipientName,
                yourReference: yourReference,
                recipientReference: recipientReference,
            });
        });

        revalidatePath(`/account/${fromAccountId}`);
        return { message: 'Transaction created successfully.' };

    } catch (error: any) {
        console.error('Transaction failed:', error);
        return { message: error.message || 'An error occurred while creating the transaction.' };
    }
}
