
'use server';

import { z } from 'zod';
import { getPersonalizedFinancialTips, PersonalizedFinancialTipsOutput } from '@/ai/flows/personalized-financial-tips';
import { db } from './firebase';
import { collection, doc, runTransaction, increment } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

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
    amount: z.string().min(1, { message: 'Amount is required.' }),
    recipientName: z.string().optional(),
    yourReference: z.string().optional(),
    recipientReference: z.string().optional(),
});

type TransactionInput = z.infer<typeof TransactionSchema>;

export async function createTransactionAction(data: TransactionInput) {
    const validatedFields = TransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        console.error('Validation failed:', validatedFields.error.flatten().fieldErrors);
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to create transaction.',
        };
    }
    
    const { fromAccountId, amount, recipientName, yourReference, recipientReference } = validatedFields.data;
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        return { message: 'Invalid amount.' };
    }

    const newTransaction = {
        date: new Date().toISOString(),
        description: `Payment to ${recipientName || 'recipient'}`,
        amount: -Math.abs(numericAmount),
        type: 'debit' as const,
        reference: yourReference || recipientReference || 'Single Payment',
    };

    try {
        await runTransaction(db, async (transaction) => {
            const fromAccountRef = doc(db, 'accounts', fromAccountId);
            const accountDoc = await transaction.get(fromAccountRef);

            if (!accountDoc.exists()) {
                throw new Error("Account not found");
            }

            transaction.update(fromAccountRef, {
                balance: increment(newTransaction.amount),
            });
            
            const transactionsRef = collection(db, 'accounts', fromAccountId, 'transactions');
            transaction.set(doc(transactionsRef), newTransaction);
        });

        revalidatePath(`/account/${fromAccountId}`);
        return { message: 'Transaction created successfully.' };

    } catch (error) {
        console.error('Transaction failed: ', error);
        return { message: 'Failed to create transaction.' };
    }
}
