'use client';
import { useState } from 'react';
import { Check, Share2, Save, Download, Loader2, Mail, X } from 'lucide-react';
import { generateProofOfPaymentPdf, GenerateProofOfPaymentInput } from '@/ai/flows/generate-proof-of-payment';
import { sendEmail } from '@/ai/flows/send-email';


const PaymentConfirmationPage = ({ lastPayment, onSaveRecipient, isRecipientSaved, onDone }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getPdfBase64 = async () => {
    if (!lastPayment) return null;
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
  }

  const handleShare = async () => {
    setIsDownloading(true);
    try {
        const pdfBase64 = await getPdfBase64();
        if (pdfBase64) {
          const blob = new Blob([Buffer.from(pdfBase64, 'base64')], { type: 'application/pdf' });
          const file = new File([blob], 'ProofOfPayment.pdf', { type: 'application/pdf' });

          if (navigator.share) {
             await navigator.share({
                title: 'Proof of Payment',
                text: `Proof of payment for R${lastPayment.amount} to ${lastPayment.recipient}`,
                files: [file],
             });
          } else {
             // Fallback for browsers that don't support Web Share API
             const link = document.createElement('a');
             link.href = URL.createObjectURL(blob);
             link.download = 'ProofOfPayment.pdf';
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
          }
        }
    } catch (error) {
        console.error("Failed to generate or share PDF:", error);
        alert("Sorry, we couldn't generate the PDF. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };


  return (
    <div className="flex flex-col h-screen overflow-y-auto bg-white">
      <header className="bg-primary text-primary-foreground p-6 flex flex-col items-start w-full min-h-[150px]">
        <div className="flex justify-between w-full items-center">
            <Check size={28} />
        </div>
        <h1 className="text-xl mt-4">R{lastPayment.amount} paid to {lastPayment.recipient}'s bank account</h1>
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
        <button 
          onClick={handleShare} 
          disabled={isDownloading}
          className="w-full flex items-center justify-start text-primary py-3 font-semibold disabled:opacity-50 mt-8"
        >
          {isDownloading ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Share2 size={20} className="mr-2" />}
          {isDownloading ? 'Preparing...' : 'Share proof of payment'}
        </button>
      </main>
       <footer className="p-4 bg-white border-t">
          <button onClick={onDone} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold">Done</button>
        </footer>
    </div>
  );
};

export default PaymentConfirmationPage;
