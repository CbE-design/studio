'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot } from 'lucide-react'; // From Conflict 1
import { CustomerServiceChatExample } from '@/components/customer-service-chat-example';

export default function AiChatPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col h-screen bg-gray-100">
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
      </header>
      <main className="flex-1 p-4 overflow-hidden">
        <CustomerServiceChatExample />
      </main>
    </div>
  );
}
