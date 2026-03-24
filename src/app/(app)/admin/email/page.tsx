'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/app/lib/firebase';

export default function AdminEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        if (base64String) {
          resolve(base64String);
        } else {
          reject(new Error("Could not read file as Base64."));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !subject || !message) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all fields.',
      });
      return;
    }

    setIsSending(true);
    try {
      const sendEmailFn = httpsCallable(functions, 'sendEmail');

      let attachmentsPayload = [];
      if (attachment) {
        const base64Content = await fileToBase64(attachment);
        attachmentsPayload.push({
          filename: attachment.name,
          content: base64Content,
        });
      }
      
      const result = await sendEmailFn({
        to: recipientEmail,
        subject: subject,
        html: message,
        attachments: attachmentsPayload,
      });

      const data = result.data as { success: boolean, message: string };

      if (data.success) {
        toast({
          title: 'Email Sent',
          description: 'The email has been sent successfully.',
        });
        setRecipientEmail('');
        setSubject('');
        setMessage('');
        setAttachment(null);
        // Reset file input
        const fileInput = document.getElementById('attachment') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Email',
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
          <Mail />
          Send Email
        </h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-white p-6 rounded-lg border space-y-6">
          <div>
            <Label htmlFor="recipient-email">Recipient Email</Label>
            <Input 
              id="recipient-email"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input 
              id="subject"
              type="text"
              placeholder="Your email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="message">Message (HTML is supported)</Label>
            <Textarea
              id="message"
              placeholder="<h1>Hello!</h1><p>This is your email body...</p>"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
            />
          </div>
          <div>
            <Label htmlFor="attachment">Attachment</Label>
            <Input 
              id="attachment"
              type="file"
              onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
           <Button onClick={handleSendEmail} className="w-full" disabled={isSending}>
            {isSending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Send Email
          </Button>
        </div>
      </main>
    </div>
  );
}