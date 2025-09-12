'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit">
            <Logo />
          </div>
          <CardTitle className="font-headline text-3xl">Welcome to MoneyGO</CardTitle>
          <CardDescription>Your trusted banking partner.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="text-center text-muted-foreground">
            Tap to securely log in with your biometric data.
          </p>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent"
            aria-label="Login with Biometrics"
          >
            {isLoggingIn ? (
              <LoaderCircle className="animate-spin" size={32} />
            ) : (
              <Fingerprint size={32} />
            )}
          </Button>
          <Button variant="link" className="text-primary">
            Other login options
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
