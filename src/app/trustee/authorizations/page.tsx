'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, Info, ShieldCheck, Clock, ShieldAlert, LoaderCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, normalizeDate } from '@/app/lib/data';
import type { Transaction } from '@/app/lib/definitions';
import { useUser, useFirestore } from '@/firebase-provider';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { authorizePaymentAction, rejectPaymentAction } from '@/app/lib/actions';

export default function TrusteeAuthorizationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [pendingTransactions, setPendingTransactions] = useState<(Transaction & { accountId: string; userId: string; trustName: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const fetchPending = async () => {
      setIsLoading(true);
      try {
        const trustsSnap = await getDocs(collection(firestore, 'users'));
        let allPending: (Transaction & { accountId: string; userId: string; trustName: string })[] = [];

        for (const trustDoc of trustsSnap.docs) {
          const accountsSnap = await getDocs(collection(firestore, 'users', trustDoc.id, 'bankAccounts'));
          
          for (const accountDoc of accountsSnap.docs) {
            const txSnap = await getDocs(
              query(
                collection(firestore, 'users', trustDoc.id, 'bankAccounts', accountDoc.id, 'transactions'),
                where('status', '==', 'PENDING_APPROVAL')
              )
            );
            
            txSnap.docs.forEach(d => {
              allPending.push({ 
                id: d.id, 
                ...d.data(), 
                accountId: accountDoc.id,
                userId: trustDoc.id,
                trustName: trustDoc.data().firstName || 'DICKSON FAMILY TRUST'
              } as Transaction & { accountId: string; userId: string; trustName: string });
            });
          }
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
  }, [firestore, user]);

  const handleAction = async (tx: Transaction & { accountId: string; userId: string }, action: 'approve' | 'reject') => {
    setProcessingId(tx.id);
    
    try {
        const result = action === 'approve' 
            ? await authorizePaymentAction(tx.userId, tx.accountId, tx.id)
            : await rejectPaymentAction(tx.userId, tx.accountId, tx.id);

        if (result.success) {
            setPendingTransactions(prev => prev.filter(r => r.id !== tx.id));
            toast({
                title: action === 'approve' ? 'Signature Applied' : 'Instruction Rejected',
                description: result.message,
            });
        } else {
            throw new Error(result.message);
        }
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Action Failed',
            description: e.message || 'An error occurred.',
        });
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/5 bg-[#141414] px-6 py-4 flex items-center sticky top-0 z-10 shadow-sm shrink-0">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2 text-gray-400 hover:text-white" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold text-white">Mandate Authorization Center</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <div className="space-y-1">
              <p className="text-xs text-primary font-bold uppercase tracking-wider">
                Secure Digital Signature Active
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Applying your signature here is a legally binding instruction to the core banking system to release funds.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-600 bg-[#141414] border border-white/5 rounded-2xl">
              <ShieldCheck className="h-16 w-16 mb-4 opacity-20" />
              <p className="font-bold text-white">Mandate queue is empty</p>
              <p className="text-sm">No instructions awaiting signature across managed trusts.</p>
              <Button variant="outline" className="mt-6 border-white/10" onClick={() => router.push('/trustee/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          ) : (
            pendingTransactions.map((req) => (
              <Card key={req.id} className="overflow-hidden border-l-4 border-l-amber-600 shadow-xl bg-[#141414] border-white/5">
                <CardContent className="p-0">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">{req.trustName}</p>
                        <h3 className="text-lg font-bold text-white uppercase">{req.recipientName || req.description}</h3>
                        <p className="text-xs text-gray-500 mt-1">Captured: {normalizeDate(req.date).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(req.amount)}</p>
                        <div className="flex items-center gap-1 justify-end text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1">
                          <Clock className="h-3 w-3" />
                          Signature Required
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 px-4 bg-black/30 rounded-xl border border-white/5">
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Payer Account</p>
                        <p className="text-xs font-semibold text-gray-300 truncate">{req.accountId}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Beneficiary Ref</p>
                        <p className="text-xs font-semibold text-gray-300 truncate">{req.recipientReference || 'None Provided'}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/10"
                        onClick={() => handleAction(req, 'approve')}
                        disabled={processingId !== null}
                      >
                        {processingId === req.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        Apply Digital Signature
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-white/10 text-gray-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 font-bold h-12 rounded-xl"
                        onClick={() => handleAction(req, 'reject')}
                        disabled={processingId !== null}
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <div className="flex items-center justify-center gap-2 py-8 opacity-20">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-white">Trustee Signing Protocol v4.2</span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6">
        <Button size="icon" className="rounded-full w-14 h-14 shadow-2xl bg-primary hover:bg-primary/90">
          <History className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}