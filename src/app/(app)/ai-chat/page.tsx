'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot } from 'lucide-react';
import Image from 'next/image';

const MessageIcon = ({ className }: { className?: string }) => (
  <div className={`relative w-5 h-5 flex items-center justify-center bg-[#346B2E] ${className || ''}`}>
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
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
