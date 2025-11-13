
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MessageSquare, Menu, AlertCircle, LoaderCircle, Fingerprint, Scan, Shield, Newspaper, Wallet, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase-provider';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

const AwardCard = ({ imageId, title, subtitle }: { imageId: string, title: string, subtitle: string }) => {
    const awardImage = PlaceHolderImages.find(img => img.id === imageId);
    if (!awardImage) return null;

    return (
        <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100">
            <Image 
                src={awardImage.imageUrl}
                alt={awardImage.description}
                width={56}
                height={56}
                className="w-14 h-14 mr-4"
                data-ai-hint={awardImage.imageHint}
            />
            <div>
                <h3 className="font-semibold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
        </div>
    )
}

const BottomNavItem = ({ icon: Icon, label }: { icon: React.ElementType, label: string }) => (
    <div className="flex flex-col items-center gap-1 text-gray-600">
        <Icon className="h-6 w-6" />
        <span className="text-xs">{label}</span>
    </div>
);

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const DEMO_EMAIL = 'cbenterprise@outlook.com';
  const DEMO_PASSWORD = 'password'; 

  const handleLogin = async () => {
    if (!auth) {
      setErrorMessage('Firebase is not initialized. Please try again later.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    try {
        await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
        toast({
            title: 'Login Successful',
            description: 'You have been signed in.',
        });
        router.push('/dashboard');
    } catch (error: any) {
         console.error('Sign-in failed:', error);
         if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
             setErrorMessage('Authentication failed. Please use your Nedbank ID password.');
         } else {
             setErrorMessage('An unexpected error occurred during login.');
         }
    } finally {
        setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 gradient-background text-white">
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

      <main className="flex-1 overflow-y-auto px-6 py-8 text-center space-y-8">
        <div>
            <h1 className="text-2xl font-semibold text-gray-800">Welcome back,</h1>
            <h2 className="text-2xl font-bold text-gray-800">GSS MARKETING TRUST.</h2>
        </div>
        
        <div className="flex justify-center">
          <button onClick={handleLogin} className="flex flex-col items-center gap-4" disabled={isLoading}>
              <Fingerprint className="h-16 w-16 text-gray-400" />
              <Button className="w-64 h-12 text-lg font-bold" disabled={isLoading}>
                 {isLoading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : 'Log in'}
              </Button>
          </button>
        </div>

        <Link href="#" className="inline-block text-primary font-semibold">
          Or use your Nedbank ID password &rarr;
        </Link>
        
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

       <footer className="sticky bottom-0 border-t bg-gray-100 p-2">
            <div className="flex justify-around items-center">
                <BottomNavItem icon={Newspaper} label="Latest" />
                <div className="flex flex-col items-center gap-1 text-primary font-semibold">
                    <Shield className="h-6 w-6" />
                    <span className="text-xs">Login</span>
                </div>
                <BottomNavItem icon={Scan} label="Scan QR" />
                <BottomNavItem icon={Wallet} label="Balance" />
                <div className="flex flex-col items-center gap-1 text-gray-600">
                    <User className="h-6 w-6" />
                    <span className="text-xs">Applications</span>
                </div>
            </div>
      </footer>
    </div>
  );
}
