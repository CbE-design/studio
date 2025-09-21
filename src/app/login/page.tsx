
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PinInput } from '@/components/pin-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Menu, ArrowRight } from 'lucide-react';
import { BottomNav } from '@/components/bottom-nav';

export default function LoginPage() {
  const router = useRouter();
  const retailBankAward = PlaceHolderImages.find(img => img.id === 'retail-bank-award');
  const customerObsessedAward = PlaceHolderImages.find(img => img.id === 'customer-obsessed-award');

  const handlePinComplete = (pin: string) => {
    // In a real app, you would verify the pin
    console.log('PIN entered:', pin);
    router.push('/dashboard');
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
            <h1 className="text-3xl font-headline">Welcome back, Corrie.</h1>
          </div>
          
          <div className="space-y-4 pt-4">
            <label className="text-sm font-medium text-muted-foreground">App PIN</label>
            <div className="pt-2">
              <PinInput length={5} onComplete={handlePinComplete} />
            </div>
          </div>

          <Button variant="link" className="text-primary p-0 h-auto">
            Or use your Nedbank ID password <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="space-y-4 pt-8">
            {retailBankAward && (
              <Card className="shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <Image
                    src={retailBankAward.imageUrl}
                    alt={retailBankAward.description}
                    data-ai-hint={retailBankAward.imageHint}
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />
                  <div className="flex flex-col">
                    <h3 className="font-semibold">Voted #1 retail bank 2024</h3>
                    <p className="text-sm text-muted-foreground">2024 World Economic Magazine Awards - Best Retail Bank in South Africa</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {customerObsessedAward && (
               <Card className="shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <Image
                    src={customerObsessedAward.imageUrl}
                    alt={customerObsessedAward.description}
                    data-ai-hint={customerObsessedAward.imageHint}
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />
                  <div className="flex flex-col">
                    <h3 className="font-semibold">Customer Obsessed Enterprise Award</h3>
                    <p className="text-sm text-muted-foreground">2024 Forrester Award winner</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
