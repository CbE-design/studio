'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { getSummaryAction, makePaymentAction, validateDetailsAction } from "../app/payment/actions";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const paymentFormSchema = z.object({
  recipientName: z.string().min(2, "Recipient name is required"),
  accountNumber: z.string().regex(/^\d{10,12}$/, "Enter a valid account number"),
  bankName: z.string().min(3, "Bank name is required"),
  bankCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit bank code"),
  amount: z.coerce.number().positive("Amount must be positive"),
  reference: z.string().min(2, "Reference is required"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

type ValidationResult = {
  isValid: boolean;
  confidence: number;
  reason: string;
};

export function PaymentForm() {
  const [step, setStep] = useState<'details' | 'summary'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<string>('');
  const [formData, setFormData] = useState<PaymentFormValues | null>(null);
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      recipientName: '',
      accountNumber: '',
      bankName: 'Nedbank',
      bankCode: '198765',
      amount: 0,
      reference: '',
    },
  });

  async function onSubmit(data: PaymentFormValues) {
    setIsLoading(true);
    setFormData(data);

    const validation = await validateDetailsAction({
      recipientName: data.recipientName,
      accountNumber: data.accountNumber,
      bankCode: data.bankCode,
    });
    setValidationResult(validation);

    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: validation.reason,
      });
      setIsLoading(false);
      return;
    }
    
    const summary = await getSummaryAction({
      recipientName: data.recipientName,
      accountNumber: data.accountNumber,
      bankName: data.bankName,
      amount: data.amount,
      reference: data.reference,
    });
    setPaymentSummary(summary);
    
    setStep('summary');
    setIsLoading(false);
  }

  async function handleConfirmPayment() {
    if (!formData) return;
    setIsLoading(true);
    await makePaymentAction(formData);
    // The action will redirect, so no need to setIsLoading(false)
  }
  
  if (step === 'summary' && formData) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle>Review Payment</CardTitle>
          <CardDescription>Please confirm the details below before paying.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {validationResult && (
            <Alert variant={validationResult.isValid ? 'default' : 'destructive'}>
              {validationResult.isValid ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
              <AlertTitle>{validationResult.isValid ? 'Details Verified' : 'Verification Failed'}</AlertTitle>
              <AlertDescription>
                {validationResult.reason} (Confidence: {(validationResult.confidence * 100).toFixed(0)}%)
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 rounded-md border p-4">
             <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(formData.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span className="font-semibold">{formData.recipientName}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-semibold">{formData.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account</span>
              <span className="font-semibold">{formData.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-semibold">{formData.reference}</span>
            </div>
          </div>

          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">AI Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{paymentSummary}</p>
            </CardContent>
          </Card>
          
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep('details')} className="w-full">
              Back
            </Button>
            <Button onClick={handleConfirmPayment} disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Pay
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Recipient Details</CardTitle>
        <CardDescription>Enter the details of the person you want to pay.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Nedbank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Code</FormLabel>
                    <FormControl>
                      <Input placeholder="198765" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (R)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Invoice #123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Review Payment
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
