'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, ShieldCheck, Clock, ShieldAlert, LoaderCircle, History, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, normalizeDate } from '@/app/lib/data';
import type { Transaction } from '@/app/lib/definitions';
import { useUser, useFirestore } from '@/firebase-provider';
import { collection, query, getDocs, where, collectionGroup, doc, getDoc } from 'firebase/firestore';
import { authorizePaymentAction, rejectPaymentAction } from '@/app/lib/actions';

export default function TrusteeAuthorizationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [pendingTransactions, setPendingTransactions] = useState<(Transaction & { accountId: string; userId: string; trustName: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingRole, setIsVerifyingRole] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const verifyAndFetch = async () => {
      if (!firestore) return;
      try {
        // 1. Verify Role
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (!userDoc.exists() || userDoc.data()?.role !== 'trustee') {
          router.push('/dashboard');
          return;
        }
        setIsVerifyingRole(false);

        // 2. Fetch Data
        setIsLoading(true);
        setError(null);
        
        // Fetch all users to create a trust name map for lookup
        const trustsSnap = await getDocs(collection(firestore, 'users'));
        const trustsMap = new Map(trustsSnap.docs.map(d => [d.id, d.data().firstName || 'DICKSON FAMILY TRUST']));

        // Fetch all pending transactions across the entire system
        const q = query(
          collectionGroup(firestore, 'transactions'),
          where('status', '==', 'PENDING_APPROVAL')
        );
        const txSnap = await getDocs(q);
        
        const allPending = txSnap.docs.map(d => {
          const data = d.data();
          const accountId = d.ref.parent.parent?.id || 'unknown';
          const userId = data.userId;
          return {
            id: d.id,
            ...data,
            accountId,
            userId,
            trustName: trustsMap.get(userId) || 'DICKSON FAMILY TRUST'
          } as Transaction & { accountId: string; userId: string; trustName: string };
        });
        
        allPending.sort((a, b) => normalizeDate(b.date).getTime() - normalizeDate(a.date).getTime());
        setPendingTransactions(allPending);
      } catch (e: any) {
        console.error("Authorization fetch failed:", e);
        setError("Mandate queue synchronization failed. Please check production node settings.");
        setIsVerifyingRole(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndFetch();
  }, [firestore, user, isUserLoading, router]);

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

  if (isUserLoading || isVerifyingRole) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] gap-4">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-500 text-sm">Synchronizing Signatures...</p>
      </div>
    );
  }

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
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </div>
          )}

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
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="text-gray-500 text-sm animate-pulse">Syncing Mandate Queue...</p>
            </div>
          ) : pendingTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-600 bg-[#141414] border border-white/5 rounded-2xl">
              <ShieldCheck className="h-16 w-16 mb-4 opacity-20" />
              <p className="font-bold text-white">Mandate queue is empty</p>
              <p className="text-sm">No instructions awaiting signature across managed trusts.</p>
              <Button variant="outline" className="mt-6 border-white/10 text-white" onClick={() => router.push('/trustee/dashboard')}>
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