
'use client';

import { ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, query } from 'firebase/firestore';
import type { Account } from '@/app/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';
import Link from 'next/link';

export default function DocumentsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
  }, [firestore, user?.uid]);

  const { data: accounts, isLoading: isAccountsLoading } = useCollection<Account>(accountsQuery);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const isLoading = isUserLoading || isAccountsLoading;
  
  const selectedAccount = accounts?.find(acc => acc.id === selectedAccountId);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
        <header className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
              <ArrowLeft />
            </Button>
            <h1 className="text-xl font-semibold">Documents & Statements</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        
        <Card>
          <CardHeader>
            <CardTitle>Generate Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                <label htmlFor="account-select" className="text-sm font-medium text-gray-700 mb-2 block">
                  Select an account to generate documents
                </label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select onValueChange={handleAccountChange} value={selectedAccountId || ""}>
                    <SelectTrigger id="account-select">
                      <SelectValue placeholder="Select an account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedAccountId && selectedAccount && (
                <div className="bg-white rounded-lg border divide-y mt-4">
                  <Link href={`/account/${selectedAccountId}/statement`}>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <FileText className="mr-3 h-5 w-5 text-primary" />
                          <p>View Statement</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                   <Link href={`/account/${selectedAccountId}/confirmation-letter`}>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <FileText className="mr-3 h-5 w-5 text-primary" />
                          <p>Confirmation Letter</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                </div>
              )}
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>My Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 p-8 border-2 border-dashed rounded-lg">
                <p>You haven't uploaded any documents yet.</p>
                <p className="text-sm mt-1">This feature is coming soon.</p>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
