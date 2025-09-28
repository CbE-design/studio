import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseProvider } from '@/firebase-provider';

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
        <link rel="apple-touch-icon" href="https://storage.googleapis.com/fpa-users-files-prod/prompt_images/8051759654719080061/a6064972-e19c-46cc-b333-e9686036f014.png" />
      </head>
      <body className={cn("antialiased")}>
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
