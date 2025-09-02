'use client';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

function ConfirmationContent() {
  const searchParams = useSearchParams();

  const recipientName = searchParams.get('recipientName');
  const amount = searchParams.get('amount');
  const reference = searchParams.get('reference');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-8">
      <CheckCircle2 className="h-24 w-24 text-green-500" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Payment Successful!</h1>
        <p className="text-muted-foreground">
          Your payment has been sent.
        </p>
      </div>

      <Card className="w-full max-w-sm text-left shadow-lg">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>A summary of your completed payment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-semibold">{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(amount))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="font-semibold">{recipientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-semibold">{reference}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold">{new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="w-full max-w-sm flex flex-col gap-4">
        <Button asChild size="lg" className="w-full">
          <Link href="/">Back to Dashboard</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/payment">Make Another Payment</Link>
        </Button>
      </div>
    </div>
  );
}


export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmationContent />
        </Suspense>
    )
}
