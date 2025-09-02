'use server';

import { summarizeTransactionDetails, SummarizeTransactionDetailsInput } from "@/ai/flows/summarize-transaction-details";
import { validateBankingDetails, ValidateBankingDetailsInput } from "@/ai/flows/validate-banking-details";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function validateDetailsAction(data: ValidateBankingDetailsInput) {
    try {
        const result = await validateBankingDetails(data);
        return result;
    } catch (error) {
        console.error(error);
        return { isValid: false, confidence: 0, reason: 'An unexpected error occurred during validation.' };
    }
}

export async function getSummaryAction(data: SummarizeTransactionDetailsInput) {
    try {
        const result = await summarizeTransactionDetails(data);
        return result.summary;
    } catch (error) {
        console.error(error);
        return 'Could not generate payment summary.';
    }
}

export async function makePaymentAction(paymentDetails: any) {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, you would save the transaction to a database here.
    
    // Redirect to confirmation page with payment details
    const params = new URLSearchParams();
    Object.entries(paymentDetails).forEach(([key, value]) => {
        params.append(key, String(value));
    });
    
    revalidatePath('/');
    redirect(`/payment/confirm?${params.toString()}`);
}
