
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, AlertCircle, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('cbenterprise@outlook.com');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      setErrorMessage('Firebase is not initialized. Please try again later.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Successful',
        description: 'You have been signed in.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Sign-in failed:', error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setErrorMessage('Invalid credentials. Please try again or create an account.');
      } else {
        setErrorMessage('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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
            <AvatarImage src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2FIMG_20251004_130049.jpg?alt=media&token=6d303043-9f10-4721-8444-cc62a1009dc9" alt="User Avatar" />
            <AvatarFallback>C</AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-semibold">Corrie</h1>
        <p className="text-muted-foreground mb-8">Enter your credentials to sign in.</p>
        
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 text-left">
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
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div
          className="flex h-8 items-center justify-center space-x-1 mt-4"
          aria-live="polite"
          aria-atomic="true"
        >
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

    