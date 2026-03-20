'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot } from 'lucide-react';
import Image from 'next/image';

const MessageIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-5 h-5 bg-[#2D5A27] ${className || ''}`}>
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/20260320_161739915.png?alt=media&token=6c0d1445-2514-495e-a86c-6202268bddc1"
      alt="AI Assistant"
      fill
      className="object-contain"
    />
  </div>
);

export default function AiChatPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="gradient-background text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <MessageIcon />
          AI Assistant
        </h1>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <Bot className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Feature Temporarily Disabled</h2>
        <p className="text-gray-500 mt-2">
          The AI chat feature is currently unavailable due to a technical issue. We are working to resolve it.
        </p>
      </main>
    </div>
  );
}
