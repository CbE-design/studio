
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, LoaderCircle, ArrowLeft, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TrusteeLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // In a real app, we'd verify the 'trustee' role in Firestore here
      router.push('/trustee/dashboard');
    } catch (error: any) {
      setErrorMessage('Invalid Trustee credentials. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 border border-primary/20">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Trustee Portal</h1>
          <p className="text-gray-400 mt-2">Secure Digital Signature Gateway</p>
        </div>

        <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/5 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Trustee ID (Email)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="trustee@nedbank.co.za" 
                className="bg-black/50 border-white/10 text-white h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" suppressHydrationWarning className="text-gray-300">Secure Pin / Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                className="bg-black/50 border-white/10 text-white h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                {errorMessage}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90" 
              disabled={isLoading}
            >
              {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <><Lock className="mr-2 h-4 w-4" /> Sign In</>}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={() => router.push('/login')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Personal Banking
          </Button>
        </div>
      </div>
      
      <footer className="mt-auto py-8 text-center text-[10px] text-gray-600 uppercase tracking-widest">
        Nedbank Trust Clearing Node • ISO 20022 Compliant
      </footer>
    </div>
  );
}
