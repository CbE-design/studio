
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, ArrowRight, AlertCircle, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInAnonymously } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!auth) {
      setErrorMessage('Firebase is not initialized. Please try again later.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      await signInAnonymously(auth);
      toast({
        title: 'Login Successful',
        description: 'You have been signed in anonymously.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Anonymous sign-in failed:', error);
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4">
        <Image 
          src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
          alt="Nedbank Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <div className="flex items-center gap-4">
          <MessageSquare className="text-primary" />
          <Menu className="text-primary" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-headline">Welcome.</h1>
            <p className="text-muted-foreground">Sign in to continue.</p>
          </div>
          
          <div className="space-y-4">
            <Button className="w-full" aria-disabled={isLoading} onClick={handleLogin}>
              {isLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Log in Anonymously <ArrowRight className="ml-auto h-5 w-5 text-gray-50" />
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
          </div>
        </div>
      </main>
    </div>
  );
}
