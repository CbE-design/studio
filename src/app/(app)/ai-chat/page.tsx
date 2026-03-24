
'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import { ArrowLeft, Bot } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const MessageIcon = ({ className }: { className?: string }) => (
  <div className={cn("relative w-4 h-4 flex items-center justify-center bg-transparent", className)}>
    <Image
      src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/20260320_172101952.png?alt=media&token=2d52b45c-6169-486b-8c04-8e3965a21d47"
      alt="Messages"
      fill
      className="object-contain"
    />
  </div>
);
=======
import { ArrowLeft, Bot } from 'lucide-react'; // From Conflict 1
import { CustomerServiceChatExample } from '@/components/customer-service-chat-example';
>>>>>>> 20b567c9348566540c9a6c81ea164d9b85b14c05

export default function AiChatPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col h-screen bg-gray-100">
<<<<<<< HEAD
      <header className="brand-header text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <MessageIcon />
          AI Assistant
        </h1>
=======
      <header className="gradient-background text-primary-foreground p-4 flex items-center">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        {/* New Layout from Conflict 2 */}
        <div className="flex items-center gap-3">
           <Bot className="h-8 w-8" />
           <div>
            <h1 className="text-lg font-semibold">MoneyGO AI Support</h1>
            <p className="text-xs text-white/80">Intelligent customer service</p>
           </div>
        </div>
>>>>>>> 20b567c9348566540c9a6c81ea164d9b85b14c05
      </header>
      <main className="flex-1 p-4 overflow-hidden">
        <CustomerServiceChatExample />
      </main>
    </div>
  );
}
