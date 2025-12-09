
import './lib/env';
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Suspense } from 'react';
import { Libre_Franklin } from 'next/font/google';

const libre_franklin = Libre_Franklin({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-libre_franklin',
});

export const metadata: Metadata = {
  title: 'MoneyGO',
  description: 'Your trusted banking partner.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.jpeg?alt=media&token=68f3444e-f792-4cba-8f08-3e02b43743ed" />
        <link rel="icon" href="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.jpeg?alt=media&token=68f3444e-f792-4cba-8f08-3e02b43743ed" />
      </head>
      <body className={cn("antialiased", libre_franklin.variable, "font-libre_franklin")}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
