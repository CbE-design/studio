
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, ArrowRight, AlertCircle, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, User } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { doc, setDoc, writeBatch, collection, WriteBatch } from 'firebase/firestore';

// Default bank accounts to be created for a new user
const defaultAccounts = [
  {
    name: 'Savvy Bundle Current Account',
    type: 'Cheque',
    accountNumber: '1234567890',
    balance: 0.0,
    currency: 'ZAR',
  },
  {
    name: 'Current Account',
    type: 'Cheque',
    accountNumber: '1234066912',
    balance: -5891.1,
    currency: 'ZAR',
  },
  {
    name: 'MyPockets(2/10)',
    type: 'Savings',
    accountNumber: '1122334455',
    balance: 4.0,
    currency: 'ZAR',
  },
  {
    name: 'Savings Account',
    type: 'Savings',
    accountNumber: '0987654321',
    balance: 1250.0,
    currency: 'ZAR',
  },
];

const sampleTransactions = {
  '1234066912': [
    { description: 'ONLINE PURCHASE', amount: 1740.00, type: 'debit', daysAgo: 2 },
    { description: 'SALARY', amount: 25000.00, type: 'credit', daysAgo: 3 },
  ],
  '0987654321': [
    { description: 'MONTHLY SAVING', amount: 1000.00, type: 'credit', daysAgo: 10 },
  ],
};


async function provisionNewUserInFirestore(firestore: any, user: User) {
    if (!firestore || !user) return;

    const { uid, email } = user;
    const batch = writeBatch(firestore);

    // 1. Create the main user document
    const userDocRef = doc(firestore, 'users', uid);
    batch.set(userDocRef, {
        id: uid,
        email: email,
        createdAt: new Date(),
    });

    // 2. Create the bankAccounts subcollection and transactions
    const bankAccountsCollectionRef = collection(userDocRef, 'bankAccounts');
    for (const account of defaultAccounts) {
        const newAccountRef = doc(bankAccountsCollectionRef);
        batch.set(newAccountRef, {
            ...account,
            userId: uid,
        });

        // Check if this account has sample transactions
        const transactions = sampleTransactions[account.accountNumber as keyof typeof sampleTransactions];
        if (transactions) {
            const transactionsCollectionRef = collection(newAccountRef, 'transactions');
            transactions.forEach(tx => {
                const newTransactionRef = doc(transactionsCollectionRef);
                const transactionDate = new Date();
                transactionDate.setDate(transactionDate.getDate() - tx.daysAgo);

                batch.set(newTransactionRef, {
                    ...tx,
                    date: transactionDate.toISOString(),
                    userId: uid,
                    fromAccountId: newAccountRef.id,
                });
            });
        }
    }

    await batch.commit();
    console.log(`Successfully provisioned new user in Firestore: ${uid}`);
}


export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !firestore) {
      setErrorMessage('Firebase is not initialized. Please try again later.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // After user is created in Auth, provision their documents in Firestore
      await provisionNewUserInFirestore(firestore, userCredential.user);
      
      toast({
        title: 'Account Created',
        description: 'You have been successfully signed up and logged in.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign-up failed:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already in use.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password should be at least 6 characters.');
      }
      else {
        setErrorMessage('Sign-up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
        <Image 
          src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO-white.png?alt=media&token=143ce385-52a1-432a-9df2-513ab41c49f8" 
          alt="Nedbank Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <div className="flex items-center gap-4">
          <MessageSquare />
          <Menu />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-headline">Create your account.</h1>
            <p className="text-muted-foreground">Get started with digital banking.</p>
          </div>
          
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
             <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" aria-disabled={isLoading}>
              {isLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign Up <ArrowRight className="ml-auto h-5 w-5" />
                </>
              )}
            </Button>
            
            <div
              className="flex h-8 items-end space-x-1"
              aria-live="polite"
              aria-atomic="true"
            >
              {errorMessage && (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-500">{errorMessage}</p>
                </>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
