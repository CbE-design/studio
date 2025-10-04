
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, ArrowRight, AlertCircle, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PinInput } from '@/components/pin-input';
import Link from 'next/link';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (completedPin: string) => {
    if (!auth) {
      setErrorMessage('Firebase is not initialized. Please try again later.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      // In a real app, you would fetch the user's email securely.
      // For this prototype, we'll use a hardcoded email with the PIN as the password.
      // Make sure a user with these credentials exists in your Firebase project.
      await signInWithEmailAndPassword(auth, 'cbenterprise@outlook.com', completedPin);
      toast({
        title: 'Login Successful',
        description: 'You have been signed in.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign-in failed:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setErrorMessage('Invalid PIN. Please try again or create an account.');
      } else {
        setErrorMessage('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinComplete = (completedPin: string) => {
    setPin(completedPin);
    handleLogin(completedPin);
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 gradient-background text-primary-foreground">
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
        <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" />
            <AvatarFallback>VS</AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-semibold">Van Schalkwyk Family Trust</h1>
        <p className="text-muted-foreground mb-8">Enter your PIN to sign in.</p>
        
        <div className="w-full max-w-xs">
          <PinInput length={6} onComplete={handlePinComplete} />
        </div>

        <div
          className="flex h-8 items-center justify-center space-x-1 mt-4"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading && (
              <>
                <LoaderCircle className="h-5 w-5 text-primary animate-spin" />
                <p className="text-sm text-primary">Signing in...</p>
              </>
          )}
          {errorMessage && !isLoading && (
            <>
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{errorMessage}</p>
            </>
          )}
        </div>

        <div className="mt-auto pt-8">
            <p className="text-center text-sm text-muted-foreground">
                No account?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Sign up
                </Link>
            </p>
             <p className="text-center text-sm text-muted-foreground mt-4">
                Can&apos;t sign in?{' '}
                <Link href="#" className="font-semibold text-primary hover:underline">
                    Get help
                </Link>
            </p>
        </div>
      </main>
    </div>
  );
}
