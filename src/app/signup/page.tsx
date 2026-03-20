'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, ArrowRight, AlertCircle, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const MessageIcon = ({ className }: { className?: string }) => (
  <div className={cn("relative w-5 h-5 flex items-center justify-center bg-transparent", className)}>
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/20260320_172101952.png?alt=media&token=2d52b45c-6169-486b-8c04-8e3965a21d47"
      alt="Messages"
      fill
      className="object-contain"
    />
  </div>
);

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !firestore) {
      setErrorMessage('Firebase is not initialized. Please try again later.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      // The onUserCreate Cloud Function will handle creating the user document in Firestore.
      await createUserWithEmailAndPassword(auth, email, password);
      
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
      <header className="flex items-center justify-between p-4 bg-[#3C7D35] text-white">
        <Image 
          src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
          alt="Nedbank Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <div className="flex items-center gap-4">
          <MessageIcon />
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
              <Label htmlFor="password">Password (must be at least 6 characters)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-[#346B2E] hover:bg-[#346B2E]/90 text-white" aria-disabled={isLoading}>
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
