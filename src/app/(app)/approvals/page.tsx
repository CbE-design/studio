'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, Info, ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/app/lib/data';
import type { ApprovalRequest } from '@/app/lib/definitions';

const mockApprovals: ApprovalRequest[] = [
  {
    id: 'req_1',
    initiatorName: 'Sarah Dickson (Beneficiary)',
    amount: 12500.00,
    recipientName: 'UNIVERSITY OF CAPE TOWN',
    date: new Date().toISOString(),
    reference: 'TUITION FEES 2026',
    accountNumber: '...449201',
    bankName: 'Standard Bank'
  },
  {
    id: 'req_2',
    initiatorName: 'James Dickson (Beneficiary)',
    amount: 450.00,
    recipientName: 'VODACOM PREPAID',
    date: new Date().toISOString(),
    reference: 'DATA BUNDLE',
    accountNumber: '...009211',
    bankName: 'Nedbank'
  }
];

export default function ApprovalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ApprovalRequest[]>(mockApprovals);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setRequests(prev => prev.filter(r => r.id !== id));
    toast({
      title: action === 'approve' ? 'Transaction Signed' : 'Transaction Declined',
      description: `Instruction ${id} has been ${action === 'approve' ? 'sent to Core Banking for processing' : 'cancelled'}.`,
      variant: action === 'approve' ? 'default' : 'destructive',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="brand-header text-primary-foreground p-4 flex items-center sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Authorizations</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-blue-800 leading-relaxed font-bold">
              Trustee Authorization Mode
            </p>
            <p className="text-[10px] text-blue-700 leading-relaxed">
              Transactions captured by beneficiaries require a secure digital signature. Release of funds is subject to the Trust's signing mandate.
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <ShieldCheck className="h-16 w-16 mb-4 opacity-20" />
            <p className="font-medium">All cleared</p>
            <p className="text-sm">No items awaiting signature.</p>
          </div>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="overflow-hidden border-l-4 border-l-amber-500 shadow-sm bg-white">
              <CardContent className="p-0">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Instruction From</p>
                      <p className="text-sm font-bold text-gray-800">{req.initiatorName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatCurrency(req.amount)}</p>
                      <div className="flex items-center gap-1 justify-end text-[10px] text-amber-600 font-bold uppercase">
                        <Clock className="h-3 w-3" />
                        Awaiting Signing
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Payee</p>
                      <p className="text-xs font-semibold truncate text-gray-700">{req.recipientName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Ref</p>
                      <p className="text-xs font-semibold truncate text-gray-700">{req.reference}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-11"
                      onClick={() => handleAction(req.id, 'approve')}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Sign Payment
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 font-bold h-11"
                      onClick={() => handleAction(req.id, 'reject')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <div className="flex items-center justify-center gap-2 py-6 opacity-40">
          <ShieldAlert className="h-4 w-4" />
          <span className="text-[10px] uppercase font-bold tracking-widest">CBS Verification Layer Active</span>
        </div>
      </main>
    </div>
  );
}