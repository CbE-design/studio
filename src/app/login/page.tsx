
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from '@/app/lib/actions';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, ArrowRight, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" aria-disabled={pending}>
      Log in <ArrowRight className="ml-auto h-5 w-5 text-gray-50" />
    </Button>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

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
            <h1 className="text-3xl font-headline">Welcome back.</h1>
          </div>
          
          <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="Enter your email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Enter your password" required />
            </div>
            <LoginButton />

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

           <div className="text-center">
            <p className="text-sm text-muted-foreground">
              To test the login, you can create a user in the Firebase Authentication console.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
