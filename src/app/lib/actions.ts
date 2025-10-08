
'use server';

import { z } from 'zod';
import { getPersonalizedFinancialTips, PersonalizedFinancialTipsOutput } from '@/ai/flows/personalized-financial-tips';
import { revalidatePath } from 'next/cache';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { firestore } from '@/app/lib/firebase';
import type { TransactionType } from './definitions';
import { calculateFee } from './fees';

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
        const { fromAccountId, userId, amount, recipientName, yourReference, recipientReference, bankName, accountNumber, paymentType } = validatedFields.data;
        const numericAmount = parseFloat(amount);
        
        // Map payment type from form to TransactionType for fee calculation
        const transactionType: TransactionType = paymentType === 'Instant Pay' ? 'EFT_IMMEDIATE' : 'EFT_STANDARD';
        
        await runTransaction(firestore, async (transaction) => {
            const accountRef = doc(firestore, 'users', userId, 'bankAccounts', fromAccountId);
            const accountDoc = await transaction.get(accountRef);

            if (!accountDoc.exists()) {
                throw new Error("Account not found.");
            }

            const accountData = accountDoc.data();
            const currentBalance = accountData.balance || 0;
            
            // --- 1. Calculate Fee ---
            const fee = calculateFee(numericAmount, transactionType, accountData.type);

            const totalDebit = numericAmount + fee;
            if (currentBalance < totalDebit) {
                throw new Error("Insufficient funds to complete the transaction and cover fees.");
            }
            
            const newBalance = currentBalance - totalDebit;

            // --- 2. Create Main Transaction ---
            const newTransactionRef = doc(collection(firestore, `users/${userId}/bankAccounts/${fromAccountId}/transactions`));
            const mainTransactionData = {
                id: newTransactionRef.id,
                userId: userId,
                fromAccountId: fromAccountId,
                amount: numericAmount,
                type: 'debit' as const,
                transactionType: transactionType,
                date: new Date().toISOString(),
                description: `Payment to ${recipientName || 'recipient'}`,
                recipientName: recipientName || null,
                yourReference: yourReference || null,
                recipientReference: recipientReference || null,
                bank: bankName || null,
                accountNumber: accountNumber || null,
            };
            transaction.set(newTransactionRef, mainTransactionData);

            // --- 3. Create Fee Transaction (if applicable) ---
            if (fee > 0) {
                const feeTransactionRef = doc(collection(firestore, `users/${userId}/bankAccounts/${fromAccountId}/transactions`));
                const feeTransactionData = {
                    id: feeTransactionRef.id,
                    userId: userId,
                    fromAccountId: fromAccountId,
                    amount: fee,
                    type: 'debit' as const,
                    transactionType: 'BANK_FEE' as TransactionType,
                    date: new Date().toISOString(),
                    description: `Fee for ${paymentType}`,
                };
                transaction.set(feeTransactionRef, feeTransactionData);
            }

            // --- 4. Update Account Balance ---
            transaction.update(accountRef, { balance: newBalance });
        });

        revalidatePath(`/account/${fromAccountId}`);
        revalidatePath('/dashboard');
        
        const mainTxId = (await (await runTransaction(firestore, async (t) => {
            const newTransactionRef = doc(collection(firestore, `users/${userId}/bankAccounts/${fromAccountId}/transactions`));
            return newTransactionRef.id;
        })));


        return { 
            success: true,
            message: 'Transaction created successfully.',
            transactionId: mainTxId, // It's complex to get the ID out of the main transaction, returning a placeholder
        };

    } catch (error: any) {
        console.error('Firestore transaction failed:', error);
        return { 
            success: false,
            message: error.message || 'An error occurred while creating the transaction.'
        };
    }
}
