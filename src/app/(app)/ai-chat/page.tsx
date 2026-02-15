'use client';

import { ArrowLeft, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AiChatPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-3">
           <Bot className="h-8 w-8" />
           <div>
            <h1 className="text-lg font-semibold">AI Chat</h1>
            <p className="text-xs text-white/80">Coming Soon</p>
           </div>
        </div>
      </header>
      <main className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
            <h2 className="text-xl font-semibold">Feature Coming Soon</h2>
            <p>The AI-powered chat is temporarily unavailable. We're working on it!</p>
        </div>
      </main>
    </div>
  );
}
