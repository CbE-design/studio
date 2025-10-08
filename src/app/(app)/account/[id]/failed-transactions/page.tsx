
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="py-4 border-b last:border-b-0">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-lg text-gray-800">{value || '-'}</p>
  </div>
);

export default function FailedTransactionDetailsPage() {
  const router = useRouter();

  const transactionDetails = {
    returnDate: '30 Sept 2025',
    fromAccount: '1234066912',
    toAccount: '4106210638',
    beneficiaryName: 'Corrie',
    branchCode: '632005',
    failureReason: 'ACCOUNT CLOSED',
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Transaction details</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-2">
        <DetailRow label="Return date" value={transactionDetails.returnDate} />
        <DetailRow label="From account" value={transactionDetails.fromAccount} />
        <DetailRow label="To account" value={transactionDetails.toAccount} />
        <DetailRow label="Beneficiary name" value={transactionDetails.beneficiaryName} />
        <DetailRow label="Branch code" value={transactionDetails.branchCode} />
        <DetailRow label="Failure reason description" value={transactionDetails.failureReason} />
      </main>
    </div>
  );
}

    