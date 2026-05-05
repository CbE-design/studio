
'use client';

import { Roboto } from 'next/font/google';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from "@/components/ui/toaster";

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
  weight: ['400', '500', '700']
});

export default function TrusteeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-h-screen bg-[#1a1a1a] text-white", roboto.variable)}>
      <FirebaseClientProvider>
        {children}
      </FirebaseClientProvider>
      <Toaster />
    </div>
  );
}
