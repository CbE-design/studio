
'use client';

import { ArrowLeft, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AiChatPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-3">
           <Bot className="h-6 w-6"/>
           <div>
            <h1 className="text-lg font-semibold">AI Assistant</h1>
           </div>
        </div>
      </header>
      <main className="flex-1 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle>Feature Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">The AI chat feature is temporarily unavailable while we work on some improvements. Please check back later!</p>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
