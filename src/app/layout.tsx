
'use client';

import './lib/env';
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This metadata can't be exported from a client component, but we can keep it here for reference.
// export const metadata: Metadata = {
//   title: 'MoneyGO',
//   description: 'Your trusted banking partner.',
//   manifest: '/manifest.json',
// };

function TimedRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/') {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 4500); // 4.5 second delay

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [pathname, router]);

  return null; // This component does not render anything
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>MoneyGO</title>
        <meta name="description" content="Your trusted banking partner." />
        <meta name="manifest" content="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.jpeg?alt=media&token=68f3444e-f792-4cba-8f08-3e02b43743ed" />
        <link rel="icon" href="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.jpeg?alt=media&token=68f3444e-f792-4cba-8f08-3e02b43743ed" />
      </head>
      <body className={cn("antialiased")}>
        <FirebaseClientProvider>
          <TimedRedirect />
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
