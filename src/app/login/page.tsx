'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, AlertCircle, LoaderCircle, Fingerprint, Lock, LayoutGrid, QrCode, Wallet, FileUser, ArrowLeft, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BottomNavItem = ({ icon: Icon, label, active = false }: { icon: React.ElementType, label: string, active?: boolean }) => (
    <div className={`flex flex-col items-center gap-1 ${active ? 'text-[#00A651]' : 'text-gray-500'}`}>
        <Icon className="h-6 w-6" strokeWidth={1.5} />
        <span className="text-xs">{label}</span>
    </div>
);

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const DEMO_EMAIL = 'cbenterprise@outlook.com';
  const DEMO_PASSWORD = 'Ninkenel@143';

  const handlePinLogin = async () => {
    handleLogin(DEMO_EMAIL, DEMO_PASSWORD);
  };

  const handlePasswordLogin = async (event: React.FormEvent) => {
      event.preventDefault();
      handleLogin(email, password);
  };

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    if (!auth) {
      setErrorMessage('Firebase is not initialized. Please try again later.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
        await signInWithEmailAndPassword(auth, loginEmail, loginPass);
        router.push('/dashboard');
    } catch (error: any) {
         console.error('Sign-in failed:', error);
         if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
             setErrorMessage('Authentication failed. Please check your credentials.');
         } else {
             setErrorMessage('An unexpected error occurred during login.');
         }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-4 py-3 bg-white">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7"
          alt="Nedbank Logo"
          width={36}
          height={36}
          className="w-9 h-9"
        />
        <div className="flex items-center gap-5 text-[#00A651]">
          <MessageSquare className="h-6 w-6" strokeWidth={1.5} />
          <Menu className="h-6 w-6 text-gray-700" strokeWidth={1.5} />
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 pt-10 pb-4 overflow-y-auto">

        {!showPasswordLogin ? (
          <>
            <div className="text-left">
              <h1 className="text-4xl font-normal text-gray-800 leading-tight">Welcome back,</h1>
              <h1 className="text-4xl font-normal text-gray-800 leading-tight uppercase">DICKSON FAMILY TRUST.</h1>
            </div>

            <div className="flex-1" />

            <div className="flex flex-col items-center gap-6 pb-4">
              <Fingerprint className="h-24 w-24 text-gray-300" strokeWidth={1} />

              <Button
                onClick={handlePinLogin}
                className="w-full h-14 text-lg font-semibold rounded-lg bg-[#00A651] hover:bg-[#008f45] text-white"
                disabled={isLoading}
              >
                {isLoading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : 'Log in'}
              </Button>

              <button
                onClick={() => setShowPasswordLogin(true)}
                className="text-[#00A651] font-semibold text-base"
              >
                Or use your Nedbank ID password &rarr;
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-left mb-8">
              <h1 className="text-4xl font-normal text-gray-800 leading-tight">Welcome back,</h1>
              <h1 className="text-4xl font-normal text-gray-800 leading-tight uppercase">DICKSON FAMILY TRUST.</h1>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-semibold rounded-lg bg-[#00A651] hover:bg-[#008f45] text-white" disabled={isLoading}>
                {isLoading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : 'Sign In'}
              </Button>
              <Button variant="link" onClick={() => setShowPasswordLogin(false)} className="text-[#00A651] font-semibold w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Log in
              </Button>
            </form>
          </>
        )}

        <div
          className="flex items-center justify-center gap-2 mt-2"
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
      </main>

      <footer className="border-t bg-white py-2 px-2">
        <div className="flex justify-around items-center">
          <BottomNavItem icon={LayoutGrid} label="Latest" />
          <BottomNavItem icon={Lock} label="Login" active />
          <BottomNavItem icon={QrCode} label="Scan QR" />
          <BottomNavItem icon={Wallet} label="Balance" />
          <BottomNavItem icon={FileUser} label="Applications" />
        </div>
      </footer>
    </div>
  );
}
