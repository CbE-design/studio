'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Account, User } from '@/app/lib/definitions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase-provider';
import { doc, getDoc } from 'firebase/firestore';
import { generateConfirmationLetterAction } from '@/app/lib/actions';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

const ConfirmationLetterSkeleton = () => (
  <div className="p-4">
    <Skeleton className="h-10 w-1/4 mb-6" />
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-full mt-4" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  </div>
);

export default function ConfirmationLetterPage() {
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
                    firstName: data.firstName || 'DICKSON FAMILY TRUST',
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
    
    const isLoading = isUserLoading || isAccountLoading || !userData || !account;
    const accountHolderName = (`${userData?.firstName || ''} ${userData?.lastName || ''}`).trim();

    const handleDownloadPdf = async () => {
        if (!account || !userData) return;
        setGeneratingPdf(true);

        try {
            const result = await generateConfirmationLetterAction(account, userData);
            
            if ('error' in result) {
                throw new Error(result.error);
            }

            const pdfBytes = result;
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `confirmation-letter-${account.id}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (e: any) {
            console.error("Failed to generate PDF:", e);
            toast({
              variant: 'destructive',
              title: 'PDF Generation Failed',
              description: e.message || 'An unknown error occurred.',
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
                <h1 className="font-semibold">Confirmation Letter</h1>
              </div>
              <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={isLoading || generatingPdf}>
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
                {isLoading ? (
                    <div className="max-w-4xl mx-auto my-4 bg-white p-6 rounded-lg shadow">
                      <ConfirmationLetterSkeleton />
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto my-4 bg-white p-8 rounded-lg shadow font-sans text-sm text-gray-800">
                        <div className="text-right mb-8">
                            <p>NEDBANK</p>
                            <p>135 RIVONIA ROAD, SANDOWN, SANDTON, 2196</p>
                            <p>PO BOX 1144, JOHANNESBURG, 2000</p>
                            <p>SOUTH AFRICA</p>
                        </div>

                        <div className="mb-8">
                            <p>{accountHolderName.toUpperCase()}</p>
                            {/* Add user address here if available */}
                        </div>

                        <div className="text-right mb-8">
                            <p>Date: {format(new Date(), 'dd MMMM yyyy')}</p>
                        </div>
                        
                        <h2 className="font-bold text-center mb-6">TO WHOM IT MAY CONCERN</h2>
                        
                        <h3 className="font-bold mb-4">ACCOUNT CONFIRMATION FOR {accountHolderName.toUpperCase()}</h3>

                        <p className="mb-4">This letter serves to confirm that {accountHolderName.toUpperCase()} holds the following account with Nedbank Limited:</p>

                        <table className="w-full mb-6">
                            <tbody>
                                <tr className="border-t border-b">
                                    <td className="py-2 pr-4 font-semibold">ACCOUNT HOLDER</td>
                                    <td className="py-2">{accountHolderName.toUpperCase()}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 pr-4 font-semibold">ACCOUNT NUMBER</td>
                                    <td className="py-2">{account.accountNumber}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 pr-4 font-semibold">ACCOUNT TYPE</td>
                                    <td className="py-2">{account.name}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 pr-4 font-semibold">BRANCH CODE</td>
                                    <td className="py-2">198765 (UNIVERSAL)</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 pr-4 font-semibold">ACCOUNT OPENING DATE</td>
                                    <td className="py-2">{format(new Date(userData.createdAt), 'dd MMMM yyyy')}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p className="mb-4">This confirmation is issued at the request of our client and is subject to the terms and conditions of the account.</p>

                        <p className="mb-6">For any queries, please contact us on 0860 555 111.</p>

                        <p>Yours faithfully,</p>
                        <p className="mt-8 font-bold">NEDBANK</p>
                        
                        <div className="text-center text-xs text-gray-500 mt-12 border-t pt-4">
                            <p>This is a system-generated document and does not require a signature.</p>
                            <p>Nedbank Ltd Reg No 1951/000009/06. Authorised financial services and registered credit provider (NCRCP16).</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
