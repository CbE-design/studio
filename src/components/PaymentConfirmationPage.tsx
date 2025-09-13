
'use client';
import { useState } from 'react';
import { Check, Share2, Save, Mail, Loader2, X } from 'lucide-react';
import { generateProofOfPaymentPdf, GenerateProofOfPaymentInput } from '@/ai/flows/generate-proof-of-payment';
import { sendEmail } from '@/ai/flows/send-email';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';


const PaymentConfirmationPage = ({ lastPayment, onSaveRecipient, isRecipientSaved, onDone }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState('');

  const getPdfBase64 = async (): Promise<string | null> => {
    if (!lastPayment) return null;
    setIsProcessing(true);
    try {
        const paymentDate = new Date(lastPayment.date);
        const formattedDate = `${paymentDate.getDate().toString().padStart(2, '0')}/${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}/${paymentDate.getFullYear()}`;
        
        const details: GenerateProofOfPaymentInput = {
            date: formattedDate,
            transactionNumber: lastPayment.transactionNumber,
            recipient: lastPayment.recipient,
            amount: lastPayment.amount,
            recipientsReference: lastPayment.recipientsReference,
            yourReference: lastPayment.yourReference,
            bankName: lastPayment.bankName,
            accountNumber: lastPayment.accountNumber,
            fromAccountName: lastPayment.fromAccountName,
        };

        const { pdfBase64 } = await generateProofOfPaymentPdf(details);
        return pdfBase64;
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, we couldn't generate the PDF. Please try again.");
        return null;
    } finally {
        setIsProcessing(false);
    }
  }

  const handleShare = async () => {
    const pdfBase64 = await getPdfBase64();
    if (!pdfBase64) return;
    
    const blob = new Blob([Buffer.from(pdfBase64, 'base64')], { type: 'application/pdf' });
    const file = new File([blob], 'ProofOfPayment.pdf', { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'Proof of Payment',
                text: `Proof of payment for R${lastPayment.amount} to ${lastPayment.recipient}`,
                files: [file],
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Share failed, falling back to download:", error);
                downloadFile(file);
            }
        }
    } else {
        downloadFile(file);
    }
  };

  const downloadFile = (file: File) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = 'ProofOfPayment.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  const handleEmailSend = async () => {
    const pdfBase64 = await getPdfBase64();
    if (!pdfBase64 || !email) return;

    setIsProcessing(true);
    try {
        await sendEmail({
            to: email,
            subject: `Proof of Payment from Van Schalkwyk Family Trust`,
            body: `Dear ${lastPayment.recipient},<br><br>Please find attached the proof of payment for R${lastPayment.amount}.<br><br>Regards,<br>Van Schalkwyk Family Trust`,
            pdfBase64,
            pdfFilename: 'ProofOfPayment.pdf'
        });
        alert(`Proof of payment successfully sent to ${email}`);
        setShowEmailDialog(false);
        setEmail('');
    } catch (error) {
        console.error('Failed to send email:', error);
        alert('There was an error sending the email. Please try again.');
    } finally {
        setIsProcessing(false);
    }
  }


  return (
    <>
      <div className="flex flex-col h-screen overflow-y-auto bg-white">
        <header className="bg-primary text-primary-foreground p-6 flex flex-col items-center w-full min-h-[150px]">
          <div className="flex justify-center w-full items-center">
              <Check size={28} />
          </div>
          <h1 className="text-xl mt-4 text-center w-full">R{lastPayment.amount} paid to {lastPayment.recipient}'s bank account</h1>
        </header>
        <main className="flex-1 p-6 space-y-6">
          <div>
              <p className="text-sm text-gray-500">Payment date</p>
              <p className="text-base font-medium">{new Date(lastPayment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div>
              <p className="text-sm text-gray-500">Bank name</p>
              <p className="text-base font-medium">{lastPayment.bankName.toUpperCase()}</p>
          </div>
          <div>
              <p className="text-sm text-gray-500">Account number</p>
              <p className="text-base font-medium">{lastPayment.accountNumber}</p>
          </div>
          <div>
              <p className="text-sm text-gray-500">Your reference</p>
              <p className="text-base font-medium">{lastPayment.yourReference}</p>
          </div>
          <div>
              <p className="text-sm text-gray-500">Recipient's reference</p>
              <p className="text-base font-medium">{lastPayment.recipientsReference}</p>
          </div>
          
          <div className="border-t pt-6 space-y-2">
            <button 
              onClick={handleShare} 
              disabled={isProcessing}
              className="w-full flex items-center justify-start text-primary py-3 font-semibold disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Share2 size={20} className="mr-2" />}
              {isProcessing ? 'Preparing...' : 'Share proof of payment'}
            </button>
            <button 
              onClick={() => setShowEmailDialog(true)}
              disabled={isProcessing}
              className="w-full flex items-center justify-start text-primary py-3 font-semibold disabled:opacity-50"
            >
              <Mail size={20} className="mr-2" />
              Email proof of payment
            </button>
            <button 
              onClick={onSaveRecipient}
              disabled={isRecipientSaved}
              className="w-full flex items-center justify-start text-primary py-3 font-semibold disabled:opacity-50"
            >
              <Save size={20} className="mr-2" />
              {isRecipientSaved ? 'Recipient saved' : 'Save as recipient'}
            </button>
          </div>
        </main>
        <footer className="p-4 bg-white border-t">
            <button onClick={onDone} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold">Done</button>
          </footer>
      </div>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Proof of Payment</DialogTitle>
            <DialogDescription>
              Enter the recipient's email address to send the proof of payment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="recipient@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleEmailSend} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentConfirmationPage;
