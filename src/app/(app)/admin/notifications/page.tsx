'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, LoaderCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/app/lib/firebase';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendSms = async () => {
    if (!phoneNumber || !message) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter a phone number and a message.',
      });
      return;
    }

    setIsSending(true);
    try {
      const sendSmsFn = httpsCallable(functions, 'sendSms');
      const result = await sendSmsFn({ to: phoneNumber, text: message });
      const data = result.data as { success: boolean, message: string };

      if (data.success) {
        toast({
          title: 'SMS Sent',
          description: 'The notification has been sent successfully.',
        });
        setPhoneNumber('');
        setMessage('');
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send SMS',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="brand-header text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Bell />
          Send Notifications
        </h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-white p-6 rounded-lg border space-y-6">
          <div>
            <Label htmlFor="phone-number">Recipient Phone Number</Label>
            <Input 
              id="phone-number"
              type="tel"
              placeholder="+27123456789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your SMS message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>
           <Button onClick={handleSendSms} className="w-full" disabled={isSending}>
            {isSending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Send SMS
          </Button>
        </div>
      </main>
    </div>
  );
}