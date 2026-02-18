'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AiChatPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="gradient-background text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold">AI Assistant</h1>
      </header>
      <main className="flex-1 flex items-center justify-center text-center p-4">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Feature Coming Soon</h2>
          <p className="text-gray-500">
            We're resolving some installation issues with our AI assistant, Neo. Please check back later!
          </p>
        </div>
      </main>
    </div>
  );
}
