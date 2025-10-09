
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Account, Transaction, User } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, doc, getDoc, query, type Timestamp } from 'firebase/firestore';
import { StatementSummaryPage } from '@/components/statement-summary';
import { StatementTransactionsPage } from '@/components/statement-transactions';
import { generateStatementPdf } from '@/app/lib/statement-generator';

const StatementLoadingSkeleton = () => (
  <div className="p-4">
    <Skeleton className="h-10 w-1/4 mb-4" />
    <Skeleton className="h-96 w-full" />
    <Skeleton className="h-96 w-full mt-4" />
  </div>
);

export default function StatementPage() {
    const router = useRouter();
    const params = useParams();
    const accountId = params.id as string;
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
  
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const { toast } = useToast();
    
    const [account, setAccount] = useState<Account | null>(null);
    const [isAccountLoading, setIsAccountLoading] = useState(true);

    const [userData, setUserData] = useState<User | null>(null);

    useEffect(() => {
        if (!firestore || !user?.uid) return;

        const fetchUserData = async () => {
             const userDocRef = doc(firestore, 'users', user.uid);
             const userDoc = await getDoc(userDocRef);
             if (userDoc.exists()) {
                const data = userDoc.data();
                // Convert Firestore Timestamp to a plain string to pass to server action
                const plainUser: User = {
                    id: data.id,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                };
                setUserData(plainUser);
             }
        }
        fetchUserData();

        const fetchAccountData = async () => {
            setIsAccountLoading(true);
            try {
                const accountDocRef = doc(firestore, 'users', user.uid, 'bankAccounts', accountId);
                const docSnap = await getDoc(accountDocRef);
                if (docSnap.exists()) {
                    setAccount({ id: docSnap.id, ...docSnap.data() } as Account);
                } else {
                    console.error("Account document not found");
                    setAccount(null);
                }
            } catch (error) {
                console.error("Error fetching account details:", error);
            } finally {
                setIsAccountLoading(false);
            }
        };
        fetchAccountData();
    }, [firestore, user, accountId, isUserLoading]);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid || !accountId) return null;
        return query(collection(firestore, 'users', user.uid, 'bankAccounts', accountId, 'transactions'));
    }, [firestore, user?.uid, accountId]);

    const { data: accountTransactions, isLoading: isTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const sortedTransactions = useMemo(() => {
        if (!accountTransactions) return [];
        return [...accountTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [accountTransactions]);
    
    const {openingBalance, closingBalance, totalDebits, totalCredits} = useMemo(() => {
        if (!account || !sortedTransactions || sortedTransactions.length === 0) {
            return { openingBalance: 0, closingBalance: account?.balance || 0, totalDebits: 0, totalCredits: 0 };
        }

        const debits = sortedTransactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0);
        const credits = sortedTransactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0);
        
        const closing = account.balance;
        const opening = closing + debits - credits;
        
        return { openingBalance: opening, closingBalance: closing, totalDebits: debits, totalCredits: credits };

    }, [account, sortedTransactions]);

    const isLoading = isUserLoading || isAccountLoading || isTransactionsLoading;
    const error = !account && !isLoading ? new Error('Account not found') : null;

    const handleDownloadPdf = async () => {
        if (!account || !sortedTransactions || !userData) return;
        setGeneratingPdf(true);

        try {
            const pdfBytes = await generateStatementPdf({
                account,
                user: userData,
                transactions: sortedTransactions,
                openingBalance,
                closingBalance,
                totalCredits,
                totalDebits,
            });
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `statement-${account.id}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (e: any) {
            console.error("Failed to generate PDF:", e);
            toast({
              variant: 'destructive',
              title: 'PDF Generation Failed',
              description: e.message || 'An unknown error occurred.',
              duration: 10000,
            });
        } finally {
            setGeneratingPdf(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <header className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10 border-b">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <h1 className="font-semibold">Bank Statement</h1>
              </div>
              <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={isLoading || generatingPdf || !account || !sortedTransactions || sortedTransactions.length === 0}>
                {generatingPdf ? (
                    <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </>
                )}
              </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                {isLoading && <StatementLoadingSkeleton />}
                {error && <p className="p-4 text-red-500 bg-red-50 rounded-md">{error.message}</p>}
                {!isLoading && !error && account && sortedTransactions && sortedTransactions.length > 0 && userData && (
                    <div className="max-w-4xl mx-auto my-4">
                        <StatementSummaryPage 
                            account={account} 
                            user={userData}
                            openingBalance={openingBalance}
                            closingBalance={closingBalance}
                            totalCredits={totalCredits}
                            totalDebits={totalDebits}
                        />
                        <StatementTransactionsPage account={account} transactions={sortedTransactions} openingBalance={openingBalance} />
                    </div>
                )}
                 {!isLoading && !error && account && (!sortedTransactions || sortedTransactions.length === 0) && (
                    <div className="text-center p-8 text-gray-500 bg-white rounded-lg shadow-sm max-w-4xl mx-auto my-4">
                        <p>No transactions found for this account to generate a statement.</p>
                    </div>
                 )}
            </main>
        </div>
    );
}
