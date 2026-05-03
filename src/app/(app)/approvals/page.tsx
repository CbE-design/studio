'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, Info, ShieldCheck, Clock, ShieldAlert, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, normalizeDate } from '@/app/lib/data';
import type { Transaction, Account } from '@/app/lib/definitions';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase-provider';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { authorizePaymentAction, rejectPaymentAction } from '@/app/lib/actions';

export default function ApprovalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [pendingTransactions, setPendingTransactions] = useState<(Transaction & { accountId: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const fetchPending = async () => {
      setIsLoading(true);
      try {
        const accountsSnap = await getDocs(collection(firestore, 'users', user.uid, 'bankAccounts'));
        let allPending: (Transaction & { accountId: string })[] = [];

        for (const accountDoc of accountsSnap.docs) {
          const txSnap = await getDocs(
            query(
              collection(firestore, 'users', user.uid, 'bankAccounts', accountDoc.id, 'transactions'),
              where('status', '==', 'PENDING_APPROVAL')
            )
          );
          
          txSnap.docs.forEach(d => {
            allPending.push({ 
              id: d.id, 
              ...d.data(), 
              accountId: accountDoc.id 
            } as Transaction & { accountId: string });
          });
        }
        
        allPending.sort((a, b) => normalizeDate(b.date).getTime() - normalizeDate(a.date).getTime());
        setPendingTransactions(allPending);
      } catch (error) {
        console.error("Failed to fetch pending transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPending();
  }, [firestore, user?.uid]);

  const handleAction = async (tx: Transaction & { accountId: string }, action: 'approve' | 'reject') => {
    if (!user) return;
    setProcessingId(tx.id);
    
    try {
        const result = action === 'approve' 
            ? await authorizePaymentAction(user.uid, tx.accountId, tx.id)
            : await rejectPaymentAction(user.uid, tx.accountId, tx.id);

        if (result.success) {
            setPendingTransactions(prev => prev.filter(r => r.id !== tx.id));
            toast({
                title: action === 'approve' ? 'Transaction Signed' : 'Transaction Rejected',
                description: result.message,
            });
        } else {
            throw new Error(result.message);
        }
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Authorization Failed',
            description: e.message || 'An error occurred.',
        });
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="brand-header text-primary-foreground p-4 flex items-center sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2 text-white hover:bg-white/10" onClick={() => router.back()}>
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
             <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pendingTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <ShieldCheck className="h-16 w-16 mb-4 opacity-20" />
            <p className="font-medium">All cleared</p>
            <p className="text-sm">No items awaiting signature.</p>
          </div>
        ) : (
          pendingTransactions.map((req) => (
            <Card key={req.id} className="overflow-hidden border-l-4 border-l-amber-500 shadow-sm bg-white">
              <CardContent className="p-0">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Captured by Beneficiary</p>
                      <p className="text-sm font-bold text-gray-800">{req.recipientName || req.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatCurrency(req.amount)}</p>
                      <div className="flex items-center gap-1 justify-end text-[10px] text-amber-600 font-bold uppercase">
                        <Clock className="h-3 w-3" />
                        Awaiting Signature
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Payee</p>
                      <p className="text-xs font-semibold truncate text-gray-700">{req.recipientName || 'RECIPIENT'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Ref</p>
                      <p className="text-xs font-semibold truncate text-gray-700">{req.recipientReference || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button 
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-11"
                      onClick={() => handleAction(req, 'approve')}
                      disabled={processingId !== null}
                    >
                      {processingId === req.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Sign Payment
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 font-bold h-11"
                      onClick={() => handleAction(req, 'reject')}
                      disabled={processingId !== null}
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
