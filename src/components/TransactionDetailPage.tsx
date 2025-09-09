'use client';
import { useState } from 'react';
import { ArrowLeft, MessageSquare, Share2, Loader2 } from 'lucide-react';
import { generateProofOfPaymentPdf, GenerateProofOfPaymentInput } from '@/ai/flows/generate-proof-of-payment';

const TransactionDetailPage = ({ selectedTransaction, setCurrentView }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!selectedTransaction) return null;

  const isDebit = selectedTransaction.amount.startsWith('-');
  const isPayment = selectedTransaction.paymentDetails && isDebit;

  const handleShare = async () => {
    if (!isPayment) return;
    setIsDownloading(true);
    try {
      const paymentDetails = selectedTransaction.paymentDetails;
      const paymentDate = paymentDetails.date?.toDate ? paymentDetails.date.toDate() : new Date(paymentDetails.date);
      const formattedDate = `${paymentDate.getDate().toString().padStart(2, '0')}/${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}/${paymentDate.getFullYear()}`;

      const details: GenerateProofOfPaymentInput = {
          date: formattedDate,
          transactionNumber: paymentDetails.transactionNumber,
          recipient: paymentDetails.recipient,
          amount: paymentDetails.amount,
          recipientsReference: paymentDetails.recipientsReference,
          yourReference: paymentDetails.yourReference,
          bankName: paymentDetails.bankName,
          accountNumber: paymentDetails.accountNumber,
          fromAccountName: paymentDetails.fromAccountName,
      };

      const { pdfBase64 } = await generateProofOfPaymentPdf(details);
      
      const blob = new Blob([Buffer.from(pdfBase64, 'base64')], { type: 'application/pdf' });
      const file = new File([blob], 'ProofOfPayment.pdf', { type: 'application/pdf' });

      if (navigator.share) {
         await navigator.share({
            title: 'Proof of Payment',
            text: `Proof of payment for R${paymentDetails.amount} to ${paymentDetails.recipient}`,
            files: [file],
         });
      } else {
         const link = document.createElement('a');
         link.href = URL.createObjectURL(blob);
         link.download = 'ProofOfPayment.pdf';
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
      }

    } catch (error) {
        console.error("Failed to generate or share PDF:", error);
        alert("Sorry, we couldn't generate the PDF. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <header className="bg-white p-4 flex justify-between items-center w-full shadow-md">
        <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('transactions')} />
        <span className="text-lg font-semibold">Transaction details</span>
        <MessageSquare size={24} />
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md mx-auto">
          <div className="text-center mb-6 pb-4 border-b">
            <p className={`text-3xl font-bold ${isDebit ? 'text-gray-900' : 'text-green-600'}`}>
              {selectedTransaction.amount.replace(/([+-])/, '$1 ')}
            </p>
            <p className="text-lg font-semibold mt-2">{selectedTransaction.description}</p>
            <p className="text-sm text-green-600 font-semibold mt-1">Successful</p>
          </div>
          <div className="space-y-4 text-left text-sm">
            <h3 className="font-bold text-gray-800">Details</h3>
            <div className="flex justify-between">
              <p className="text-gray-500">Transaction date</p>
              <p className="font-medium">{new Date(selectedTransaction.timestamp).toLocaleString('en-ZA', { dateStyle: 'long' })}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-500">Transaction type</p>
              <p className="font-medium">{isDebit ? 'Payment' : 'Deposit'}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-500">Reference</p>
              <p className="font-medium">{selectedTransaction.description}</p>
            </div>
          </div>
          {isPayment && (
            <div className="mt-8 border-t pt-6">
              <button 
                onClick={handleShare} 
                disabled={isDownloading}
                className="w-full flex items-center justify-center text-primary py-3 font-semibold disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Share2 size={20} className="mr-2" />}
                {isDownloading ? 'Preparing...' : 'Share proof of payment'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TransactionDetailPage;
