'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, AlertCircle, LoaderCircle, Fingerprint, Scan, Shield, Newspaper, Wallet, User, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MessageIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-5 h-5 bg-[#346B2E] ${className || ''}`}>
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/20260320_161739915.png?alt=media&token=6c0d1445-2514-495e-a86c-6202268bddc1"
      alt="Message"
      fill
      className="object-contain"
    />
  </div>
);

const AwardCard = ({ imageId, title, subtitle }: { imageId: string, title: string, subtitle: string }) => {
    const awardImage = PlaceHolderImages.find(img => img.id === imageId);
    if (!awardImage) return null;

    return (
        <div className="flex items-center p-4 rounded-lg border border-gray-200">
            <Image 
                src={awardImage.imageUrl}
                alt={awardImage.description}
                width={56}
                height={56}
                className="w-14 h-14 mr-4"
                data-ai-hint={awardImage.imageHint}
            />
            <div className="text-left">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
        </div>
    )
}

const BottomNavItem = ({ icon: Icon, label }: { icon: React.ElementType, label: string }) => (
    <div className="flex flex-col items-center gap-1 text-gray-600">
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
  }

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
      <header className="flex items-center justify-between p-4 bg-transparent text-gray-800">
        <Image 
          src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
          alt="Nedbank Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <div className="flex items-center gap-4 text-primary">
          <MessageIcon />
          <Menu />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 text-center space-y-8">
        <div>
            <h1 className="text-2xl font-normal text-gray-700">Welcome back,</h1>
            <h2 className="text-2xl font-semibold text-gray-700 uppercase">DICKSON FAMILY TRUST.</h2>
        </div>
        
        {!showPasswordLogin ? (
            <>
                <div className="flex justify-center pt-8">
                  <div onClick={handlePinLogin} className="flex flex-col items-center gap-6 cursor-pointer" >
                      <Fingerprint className="h-12 w-12 text-gray-400" />
                      <Button className="w-64 h-12 text-lg font-bold gradient-background" disabled={isLoading}>
                         {isLoading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : 'Log in'}
                      </Button>
                  </div>
                </div>

                <button onClick={() => setShowPasswordLogin(true)} className="inline-block text-[#00A651] font-semibold">
                  Or use your Nedbank ID password &rarr;
                </button>
            </>
        ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-bold gradient-background" disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : 'Sign In'}
                </Button>
                <Button variant="link" onClick={() => setShowPasswordLogin(false)} className="text-[#00A651] font-semibold w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to PIN login
                </Button>
            </form>
        )}
        
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
        
        <div className="space-y-4 pt-4">
            <AwardCard 
                imageId="retail-bank-award"
                title="Voted #1 retail bank 2024"
                subtitle="2024 World Economic Magazine Awards - Best Retail Bank in South Africa"
            />
            <AwardCard 
                imageId="customer-obsessed-award"
                title="Customer Obsessed Enterprise Award"
                subtitle="2024 Forrester Award winner"
            />
        </div>
      </main>

       <footer className="sticky bottom-0 border-t bg-white p-2">
            <div className="flex justify-around items-center">
                <BottomNavItem icon={Newspaper} label="Latest" />
                <div className="flex flex-col items-center gap-1 text-primary font-semibold">
                    <Shield className="h-6 w-6" strokeWidth={1.5} />
                    <span className="text-xs">Login</span>
                </div>
                <BottomNavItem icon={Scan} label="Scan QR" />
                <BottomNavItem icon={Wallet} label="Balance" />
                <div className="flex flex-col items-center gap-1 text-gray-600">
                    <User className="h-6 w-6" strokeWidth={1.5} />
                    <span className="text-xs">Applications</span>
                </div>
            </div>
      </footer>
    </div>
  );
}
