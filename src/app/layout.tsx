import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Van Schalkwyk Trust Mobile',
  description: 'Mobile banking for the Van Schalkwyk Family Trust',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container mx-auto max-w-lg bg-background min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
