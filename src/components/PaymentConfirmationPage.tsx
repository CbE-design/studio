'use client';
import { useState } from 'react';
import { Check, Share2, Save, Download, Loader2 } from 'lucide-react';
import { generateProofOfPaymentPdf, GenerateProofOfPaymentInput } from '@/ai/flows/generate-proof-of-payment';

const PaymentConfirmationPage = ({ lastPayment, onSaveRecipient, isRecipientSaved, onDone }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!lastPayment) return;
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
        
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfBase64}`;
        link.download = 'ProofOfPayment.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("Failed to generate or download PDF:", error);
        alert("Sorry, we couldn't generate the PDF. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <header className="bg-white p-4 flex justify-between items-center w-full shadow-md">
        <span className="text-lg font-semibold">Payment successful</span>
        <Check size={24} className="text-green-500" />
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md mx-auto">
          <div className="text-center mb-6 pb-4 border-b">
            <p className="text-3xl font-bold text-gray-900">-R {lastPayment.amount}</p>
            <p className="text-lg font-semibold mt-2">{lastPayment.recipient}</p>
            <p className="text-sm text-gray-500">{lastPayment.bankName} - ...{lastPayment.accountNumber.slice(-4)}</p>
          </div>
          <div className="space-y-3 text-left text-sm">
            <div className="flex justify-between"><p className="text-gray-500">Date</p><p className="font-medium">{lastPayment.date.toLocaleDateString('en-ZA')}</p></div>
            <div className="flex justify-between"><p className="text-gray-500">From account</p><p className="font-medium">{lastPayment.fromAccountName}</p></div>
            <div className="flex justify-between"><p className="text-gray-500">Your reference</p><p className="font-medium">{lastPayment.yourReference || 'N/A'}</p></div>
            <div className="flex justify-between"><p className="text-gray-500">Recipient's reference</p><p className="font-medium">{lastPayment.recipientsReference || 'N/A'}</p></div>
          </div>
          <div className="mt-6 space-y-3">
            <button 
              onClick={handleDownload} 
              disabled={isDownloading}
              className="w-full flex items-center justify-center bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Share2 size={18} className="mr-2" />}
              {isDownloading ? 'Preparing...' : 'Share proof of payment'}
            </button>
            <button 
              onClick={handleDownload} 
              disabled={isDownloading}
              className="w-full flex items-center justify-center bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />}
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
            <button 
              onClick={onSaveRecipient} 
              disabled={isRecipientSaved} 
              className={`w-full flex items-center justify-center py-3 rounded-xl font-semibold ${isRecipientSaved ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-800'}`}
            >
              <Save size={18} className="mr-2" /> 
              {isRecipientSaved ? 'Recipient Saved' : 'Save recipient'}
            </button>
          </div>
        </div>
      </main>
      <footer className="p-4 bg-white border-t">
        <button onClick={onDone} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold">Done</button>
      </footer>
    </div>
  );
};

export default PaymentConfirmationPage;
