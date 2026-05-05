
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, AlertCircle, LoaderCircle, Fingerprint, Lock, LayoutGrid, QrCode, Wallet, FileUser, ArrowLeft, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
  const firestore = useFirestore();

  /**
   * TRUSTEE CREDENTIALS CONFIGURATION
   */
  const TRUSTEE_ID = 'trustee@nedbank.co.za';
  const TRUSTEE_PASS = 'NedbankTrustee2026!';

  // Standard Client Demo Credentials
  const CLIENT_EMAIL = 'cbenterprise@outlook.com';
  const CLIENT_PASSWORD = 'Ninkenel@143';

  const handlePinLogin = async () => {
    handleLogin(CLIENT_EMAIL, CLIENT_PASSWORD);
  };

  const handlePasswordLogin = async (event: React.FormEvent) => {
      event.preventDefault();
      handleLogin(email, password);
  };

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    if (!auth || !firestore) {
      setErrorMessage('Firebase is not initialized. Please try again later.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    const isTrusteeCredentials = loginEmail.toLowerCase() === TRUSTEE_ID.toLowerCase() && loginPass === TRUSTEE_PASS;

    try {
        let user;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPass);
            user = userCredential.user;
        } catch (signInError: any) {
            // If sign-in fails for the specific trustee credentials because the user doesn't exist, auto-create it.
            if (isTrusteeCredentials && (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential')) {
                const newUserCred = await createUserWithEmailAndPassword(auth, loginEmail, loginPass);
                user = newUserCred.user;
                
                // Set the role as trustee in Firestore for this auto-created user
                await setDoc(doc(firestore, 'users', user.uid), {
                    id: user.uid,
                    email: user.email,
                    firstName: 'NEDBANK OFFICIAL',
                    lastName: 'TRUSTEE',
                    role: 'trustee',
                    createdAt: serverTimestamp(),
                });
            } else {
                throw signInError;
            }
        }

        if (user) {
            // Check role from Firestore
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            const isTrustee = (userDoc.exists() && userDoc.data().role === 'trustee') || isTrusteeCredentials;
            
            if (isTrustee) {
                router.push('/trustee/dashboard');
            } else {
                router.push('/dashboard');
            }
        }
    } catch (error: any) {
         console.warn('Sign-in attempt failed:', error.code);
         setErrorMessage('Incorrect Nedbank ID or password. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-4 py-3 bg-white shrink-0">
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
              <h1 className="text-2xl font-normal text-gray-800 leading-tight">Welcome back,</h1>
              <h1 className="text-2xl font-normal text-gray-800 leading-tight uppercase">DICKSON FAMILY TRUST.</h1>
            </div>

            <div className="flex-1" />

            <div className="flex flex-col items-center gap-6 pb-4">
              <Fingerprint className="h-16 w-16 text-gray-300" strokeWidth={1} />

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
              <h1 className="text-2xl font-normal text-gray-800 leading-tight">Welcome back,</h1>
              <h1 className="text-2xl font-normal text-gray-800 leading-tight uppercase">DICKSON FAMILY TRUST.</h1>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Nedbank ID (Email)</Label>
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

        <div className="flex items-center justify-center gap-2 mt-4" aria-live="polite" aria-atomic="true">
          {errorMessage && !isLoading && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 w-full justify-center text-center">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center pb-6">
          <p className="text-[10px] text-gray-400 uppercase leading-relaxed tracking-wider">
            Nedbank Ltd Reg No 1951/000009/06.<br />
            Licensed financial services provider (FSP9363)
          </p>
        </div>
      </main>

      <footer className="border-t bg-white py-2 px-2 shrink-0">
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
