
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, AlertCircle, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { PinInput } from '@/components/pin-input';
import Link from 'next/link';

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  // The hardcoded PIN for this demo app. In a real app, this would be managed securely.
  const CORRECT_PIN = '12345';
  const DEMO_EMAIL = 'cbenterprise@outlook.com';
  const DEMO_PASSWORD = 'password'; // Assuming a known password for the demo user

  const handlePinComplete = async (pin: string) => {
    if (!auth) {
      setErrorMessage('Firebase is not initialized. Please try again later.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    if (pin === CORRECT_PIN) {
        try {
            await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
            toast({
                title: 'Login Successful',
                description: 'You have been signed in.',
            });
            router.push('/dashboard');
        } catch (error: any) {
             console.error('Sign-in failed:', error);
             if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                 setErrorMessage('The demo account credentials are not valid. Please check the setup.');
             } else {
                 setErrorMessage('An unexpected error occurred during login.');
             }
             setIsLoading(false);
        }
    } else {
      setErrorMessage('Incorrect PIN. Please try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 gradient-background text-white">
        <Image 
          src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
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

      <main className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground mt-2 mb-12">Enter your 5-digit PIN to sign in.</p>
        
        <div className="w-full max-w-xs space-y-4">
          <PinInput length={5} onComplete={handlePinComplete} />
        </div>

        <div
          className="flex h-8 items-center justify-center space-x-1 mt-4"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading && <LoaderCircle className="h-5 w-5 animate-spin" />}
          {errorMessage && !isLoading && (
            <>
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>

        <div className="mt-auto pt-8">
             <p className="text-center text-sm text-muted-foreground mt-4">
                Can't sign in?{' '}
                <Link href="#" className="font-semibold text-primary hover:underline">
                    Get help
                </Link>
            </p>
        </div>
      </main>
    </div>
  );
}
