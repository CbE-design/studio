'use client';
import { useState } from 'react';
import { Check, Share2, Save, Download, Loader2, Mail, X } from 'lucide-react';
import { generateProofOfPaymentPdf, GenerateProofOfPaymentInput } from '@/ai/flows/generate-proof-of-payment';
import { sendEmail } from '@/ai/flows/send-email';


const PaymentConfirmationPage = ({ lastPayment, onSaveRecipient, isRecipientSaved, onDone }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getPdfFile = async (): Promise<File | null> => {
    if (!lastPayment) return null;
    setIsDownloading(true);
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
        const blob = new Blob([Buffer.from(pdfBase64, 'base64')], { type: 'application/pdf' });
        return new File([blob], 'ProofOfPayment.pdf', { type: 'application/pdf' });
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, we couldn't generate the PDF. Please try again.");
        return null;
    } finally {
        setIsDownloading(false);
    }
  }

  const handleShare = async () => {
    if (!navigator.share) {
        alert("Web Share API is not supported in your browser.");
        // Optional: Implement fallback download for unsupported browsers
        const file = await getPdfFile();
        if (file) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(file);
            link.download = 'ProofOfPayment.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        return;
    }

    try {
        // First, check if we can share without a file to get user intent immediately
        if (navigator.canShare({ title: 'Proof of Payment' })) {
             await navigator.share({ title: 'Proof of Payment' });
             // This is a common pattern to keep user activation.
             // If the above share is successful (or cancelled by user), we proceed.
        }

        const file = await getPdfFile();
        if (file) {
             if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Proof of Payment',
                    text: `Proof of payment for R${lastPayment.amount} to ${lastPayment.recipient}`,
                    files: [file],
                });
             } else {
                throw new Error("Sharing files is not supported.");
             }
        }
    } catch (error) {
        if (error.name !== 'AbortError') { // AbortError means user cancelled the share dialog
            console.error("Failed to share:", error);
            // Fallback for when sharing fails but PDF was generated
            const file = await getPdfFile();
            if (file) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(file);
                link.download = 'ProofOfPayment.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
  };


  return (
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
