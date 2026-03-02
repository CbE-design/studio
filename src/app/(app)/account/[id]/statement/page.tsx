
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Account, Transaction, User } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, doc, getDoc, query } from 'firebase/firestore';
import { StatementSummaryPage } from '@/components/statement-summary';
import { StatementTransactionsPage } from '@/components/statement-transactions';
import { generateStatementPdf, type StatementData } from '@/app/lib/statement-generator';
import { normalizeDate } from '@/app/lib/data';

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
                const plainUser: User = {
                    id: data.id,
                    email: data.email,
                    firstName: data.firstName || 'Van Wyk Bussiness Enterprise',
                    lastName: data.lastName || '',
                    createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
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
        return [...accountTransactions].sort((a, b) => normalizeDate(a.date).getTime() - normalizeDate(b.date).getTime());
    }, [accountTransactions]);
    
    const statementData = useMemo<StatementData | null>(() => {
        if (!account || !userData || !sortedTransactions) return null;

        const totalCredits = sortedTransactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0);
        const totalDebits = sortedTransactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0);
        const closingBalance = account.balance;
        const openingBalance = closingBalance + totalDebits - totalCredits;

        // Categorize transactions for graphs
        const atmTellerDeposits = 0; // Placeholder
        const electronicPaymentsReceived = totalCredits - atmTellerDeposits; // Simplified
        const transfersIn = 0; // Placeholder
        const otherCredits = 0; // Placeholder

        const accountPayments = sortedTransactions.filter(tx => tx.type === 'debit' && tx.transactionType === 'EFT_STANDARD').reduce((sum, tx) => sum + tx.amount, 0);
        const electronicTransfers = sortedTransactions.filter(tx => tx.type === 'debit' && tx.transactionType === 'EFT_IMMEDIATE').reduce((sum, tx) => sum + tx.amount, 0);
        const totalChargesAndFees = sortedTransactions.filter(tx => tx.transactionType === 'BANK_FEE').reduce((sum, tx) => sum + tx.amount, 0);
        const otherDebits = totalDebits - accountPayments - electronicTransfers - totalChargesAndFees;


        return {
            account,
            user: userData,
            transactions: sortedTransactions.map(tx => ({ ...tx, date: normalizeDate(tx.date).toISOString() })),
            accountSummary: {
                accountType: account.type,
                accountNumber: account.accountNumber,
                statementDate: new Date().toLocaleDateString('en-GB'),
                envelope: '1 of 1',
                statementPeriod: `${sortedTransactions.length > 0 ? normalizeDate(sortedTransactions[0].date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')} - ${new Date().toLocaleDateString('en-GB')}`,
                totalPages: '2', // Placeholder
                statementFrequency: 'Monthly',
                clientVatNumber: '',
            },
            bankSummary: {
                cashFees: 0.00, // Placeholder
                otherCharges: totalChargesAndFees, // Simplified
                bankChargesTotal: totalChargesAndFees,
                vatIncluded: 15.000,
                vatCalculatedMonthly: 0.00,
                openingBalance,
                fundsReceivedCredits: totalCredits,
                fundsUsedDebits: totalDebits,
                closingBalance,
                annualCreditInterestRate: 0.000,
            },
            graphsData: {
                fundsReceived: {
                    totalCredits: totalCredits,
                    atmTellerDeposits,
                    electronicPaymentsReceived,
                    transfersIn,
                    otherCredits,
                },
                fundsUsed: {
                    totalDebits: totalDebits,
                    accountPayments,
                    electronicTransfers,
                    totalChargesAndFees,
                    otherDebits,
                }
            }
        };
    }, [account, userData, sortedTransactions]);

    const isLoading = isUserLoading || isAccountLoading || isTransactionsLoading;
    const error = !account && !isLoading ? new Error('Account not found') : null;

    const handleDownloadPdf = async () => {
        if (!statementData) return;
        setGeneratingPdf(true);

        try {
            const pdfBytes = await generateStatementPdf(statementData);
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `statement-${statementData.account.id}-${new Date().toISOString().split('T')[0]}.pdf`;
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
              <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={isLoading || generatingPdf || !statementData || statementData.transactions.length === 0}>
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
                {!isLoading && !error && statementData && statementData.transactions.length > 0 && (
                    <div className="max-w-4xl mx-auto my-4">
                        <StatementSummaryPage 
                           statementData={statementData}
                        />
                        <StatementTransactionsPage 
                            account={statementData.account} 
                            transactions={statementData.transactions} 
                            openingBalance={statementData.bankSummary.openingBalance}
                        />
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
