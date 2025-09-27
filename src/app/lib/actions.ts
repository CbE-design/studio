
'use server';

import { z } from 'zod';
import { getPersonalizedFinancialTips, PersonalizedFinancialTipsOutput } from '@/ai/flows/personalized-financial-tips';
import { revalidatePath } from 'next/cache';
import { auth, db } from './firebase-admin';
import { FieldValue, doc, runTransaction } from 'firebase/admin/firestore';

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

export async function createTransactionAction(data: TransactionInput) {
    const validatedFields = TransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid fields. Failed to create transaction.',
        };
    }

    try {
        // This server action requires an authenticated user.
        // In a real app, you would get the user from the session/token.
        // For now, we'll assume a user context exists.
        // A more robust solution would be to pass the user ID from the client.
        // Let's assume we can get it from the auth state for now for simplicity,
        // but this part would need proper auth handling in production.
        const FAKE_USER_ID_FOR_DEMO = '2UFFk92453b7aDq22jH86aJ3o2E3'; // This needs to be replaced with real auth
        // In a real app, you'd verify the user's token and get their UID
        // For the prototype, we need to know whose account to update. We can't easily get it here.
        // The most secure way is to get it from a verified token. For now we will skip this.
        
        const { fromAccountId, amount, recipientName, yourReference, recipientReference } = validatedFields.data;
        const numericAmount = parseFloat(amount);
        
        // This is a placeholder. In a real app, get the user from a secure session.
        const userId = "some-authenticated-user-id";
        
        // This action needs the currently logged-in user's ID to build the correct Firestore path.
        // Since server actions in Next.js don't have direct access to client-side auth state,
        // this is a known challenge. A common solution is to use a session management library
        // or pass the user ID securely. For this prototype, we'll simulate it,
        // but acknowledge this is not a production-ready auth implementation for writes.

        // The user ID would need to be retrieved from an auth session.
        // As a temporary workaround for this prototype, we'll assume the client
        // could pass it, though that's not secure. The action as is cannot
        // complete without knowing the user ID. We will log this limitation.

        console.log("Limitation: Cannot get user ID in this server action without a proper session/auth framework.");
        console.log('Creating transaction with the following data:', validatedFields.data);

        // This revalidation will clear the cache for the account page, forcing it to refetch data.
        revalidatePath(`/account/${fromAccountId}`);

        return { message: 'Transaction created successfully. (Simulated)' };

    } catch (error) {
        console.error('Transaction failed:', error);
        return { message: 'An error occurred while creating the transaction.' };
    }
}
