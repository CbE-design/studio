
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/app/lib/data';

const DetailRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <tr className="align-top">
        <td className="pr-2 py-0.5 text-gray-500 w-1/4">{label}</td>
        <td className="pr-1 py-0.5 text-gray-500">:</td>
        <td className="py-0.5 font-semibold text-gray-800 break-all">{value || ''}</td>
    </tr>
);

const LoadingSkeleton = () => (
    <div className="bg-white p-6 max-w-2xl mx-auto shadow-md font-sans" style={{ fontSize: '10px' }}>
        <Skeleton className="h-8 w-8 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-1" />
        <hr className="mb-3"/>
        <Skeleton className="h-4 w-full mb-4" />
        <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-5 w-1/4 mb-1" />
        <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
        </div>
         <Skeleton className="h-5 w-1/4 mb-1" />
         <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-2/3" />
        </div>
    </div>
);


function ProofOfPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [paymentDetails, setPaymentDetails] = useState<any>(null);

    useEffect(() => {
      const now = new Date();
      const generateRandomSuffix = () => Math.random().toString().substring(2, 14); // 12 digit number
      
      setPaymentDetails({
          dateOfPayment: format(now, 'dd/MM/yyyy'),
          referenceNumber: `${format(now, 'yyyy-MM-dd')}/Nedbank/${generateRandomSuffix()}`,
          recipient: searchParams.get('recipientName'),
          amount: formatCurrency(Number(searchParams.get('amount') || '0')),
          recipientReference: searchParams.get('recipientReference'),
          bank: searchParams.get('bankName'),
          accountNumber: `...${searchParams.get('accountNumber')?.slice(-5)}`,
          channel: 'Internet payment',
          payer: 'Corrie',
          securityCode: 'B1AEF1A32330C0E8BB99D508DAF75E3A0B051D48',
      });
    }, [searchParams]);

    const handleDownloadPdf = () => {
        const input = document.getElementById('proof-of-payment');
        if (input) {
            html2canvas(input, { scale: 3 }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('proof-of-payment.pdf');
            });
        }
    };

    return (
      <div className="flex flex-col h-screen bg-gray-100 text-sm">
        <header className="bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-10 border-b">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <h1 className="font-semibold">Proof of Payment</h1>
          </div>
          <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={!paymentDetails}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4">
            {!paymentDetails ? <LoadingSkeleton /> : (
                <div id="proof-of-payment" className="bg-white p-8 max-w-2xl mx-auto shadow-md font-sans" style={{ fontSize: '9px', lineHeight: '1.4' }}>
                    <Image 
                        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
                        alt="Nedbank Logo"
                        width={32}
                        height={32}
                        className="mb-4"
                    />

                    <h2 className="text-[10px] font-bold mb-1">Notification of Payment</h2>
                    <hr className="mb-3 border-gray-400"/>
                    <p className="mb-3">Nedbank Limited confirms that the following payment has been made:</p>

                    <table className="w-full mb-3">
                        <tbody>
                            <DetailRow label="Date of Payment" value={paymentDetails.dateOfPayment} />
                            <DetailRow label="Reference Number" value={paymentDetails.referenceNumber} />
                        </tbody>
                    </table>

                    <h3 className="font-bold mb-1 text-[9.5px]">Beneficiary details</h3>
                    <table className="w-full mb-3">
                        <tbody>
                            <DetailRow label="Recipient" value={paymentDetails.recipient} />
                            <DetailRow label="Amount" value={paymentDetails.amount} />
                            <DetailRow label="Recipient Reference" value={paymentDetails.recipientReference} />
                            <DetailRow label="Bank" value={paymentDetails.bank} />
                            <DetailRow label="Account Number" value={paymentDetails.accountNumber} />
                            <DetailRow label="Channel" value={paymentDetails.channel} />
                        </tbody>
                    </table>
                    
                    <h3 className="font-bold mb-1 text-[9.5px]">Payer details</h3>
                    <table className="w-full mb-4">
                        <tbody>
                            <DetailRow label="Paid from Account Holder" value={paymentDetails.payer} />
                        </tbody>
                    </table>

                    <p className="text-gray-600 mb-3">
                        Nedbank will never send you an e-mail link to access Verify payments, always go to Online Banking on www.nedbank.co.za and click on Verify payments.
                    </p>

                    <div className="text-gray-500 space-y-2 mb-3">
                        <p>
                            This notification of payment is sent to you by Nedbank Limited Reg No 1951/000009/06. Enquiries regarding this notification should be directed to the Nedbank Contact Centre on 0860 555 111. Please check with the payer for enquiries regarding the contents of this notification.
                            Nedbank Ltd will not be held responsible for the accuracy of the information on this notification and we accept no liability for any loss or damage whatsoever or nature, arising from the use thereof.
                            Payments may take up to three business days. Please check your account to verify the existence of the funds.
                        </p>
                        <p>
                            <strong>Note:</strong> We as a bank will never send you an e-mail requesting you to enter your personal details or private identification and authentication details.
                        </p>
                    </div>

                    <h4 className="font-bold mb-1">Nedbank Limited email disclaimer</h4>
                    <p className="text-gray-500 mb-3">
                        This email and any accompanying attachments may contain confidential and proprietary information. This information is private and protected by law and, accordingly, if you are not the intended recipient, you are requested to delete this entire communication immediately. You should not copy or disclose its contents to any other person. Emails cannot be guaranteed to be secure or free of errors or viruses. The sender does not accept any liability or responsibility for any interception, corruption, destruction, loss, late arrival or incompleteness of or tampering or interference with any of the information contained in this email or for its incorrect delivery or non-delivery for whatsoever reason or for its effect on any electronic device of the recipient. If verification of this email or any attachment is required, please request a hard copy version.
                    </p>
                    
                    <table className="w-full mb-3">
                        <tbody>
                            <DetailRow label="Security Code" value={paymentDetails.securityCode} />
                        </tbody>
                    </table>
                    
                    <hr className="mb-3 border-gray-400"/>

                    <p className="text-[8px] text-gray-500 leading-tight">
                        Nedbank Limited Reg No 1951/000009/06. VAT Reg No 4320116074. 135 Rivonia Road, Sandown, Sandton, 2196, South Africa.
                        We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services. We are an authorised financial services provider. We are a registered credit provider in terms of the National Credit Act (NCRCP16).
                    </p>
                </div>
            )}
        </main>
      </div>
    );
}


export default function ProofOfPaymentPage() {
    return (
        <Suspense fallback={<div>Loading proof of payment...</div>}>
            <ProofOfPaymentContent />
        </Suspense>
    )
}
