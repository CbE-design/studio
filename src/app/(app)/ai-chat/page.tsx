'use client';

import { ArrowLeft, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AiChatPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="gradient-background text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold">AI Assistant - Neo</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <Alert variant="default" className="max-w-md bg-white">
          <Bot className="h-4 w-4" />
          <AlertTitle>Feature Unavailable</AlertTitle>
          <AlertDescription>
            The AI Assistant is temporarily unavailable due to a configuration issue. We are working to resolve it. Please check back later.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  );
}
