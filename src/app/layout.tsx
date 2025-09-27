import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseProvider } from '@/firebase-provider';

export const metadata: Metadata = {
  title: 'MoneyGO',
  description: 'Your trusted banking partner.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className={cn("antialiased")}>
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
