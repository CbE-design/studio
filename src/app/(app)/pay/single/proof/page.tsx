
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/app/lib/data';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useToast } from '@/hooks/use-toast';

const DetailRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <tr className="align-top">
        <td className="pr-4 py-0.5 text-gray-700 w-[160px]">{label}</td>
        <td className="pr-2 py-0.5 text-gray-700">:</td>
        <td className="py-0.5 font-semibold text-gray-800 break-all">{value || ''}</td>
    </tr>
);

const LoadingSkeleton = () => (
    <div className="bg-white p-10 max-w-4xl mx-auto shadow-md font-sans">
        <Skeleton className="h-12 w-12 mb-6" />
        <Skeleton className="h-px w-full mb-6" />
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-5 w-full mb-6" />
        <div className="space-y-3 mb-6">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
        </div>
        <Skeleton className="h-6 w-1/4 mb-4" />
        <div className="space-y-3 mb-6">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
        </div>
    </div>
);

function ProofOfPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
      const now = new Date();
      const generateRandomSuffix = () => Math.random().toString().substring(2, 11);
      
      setPaymentDetails({
          dateOfPayment: format(now, 'dd/MM/yyyy'),
          referenceNumber: `${format(now, 'yyyy-MM-dd')}/Nedbank/${generateRandomSuffix()}`,
          recipient: searchParams.get('recipientName'),
          amount: Number(searchParams.get('amount') || '0'),
          recipientReference: searchParams.get('recipientReference'),
          bank: searchParams.get('bankName'),
          accountNumber: `...${searchParams.get('accountNumber')?.slice(-5)}`,
          channel: 'Internet payment',
          payer: 'Van Schalkwyk Family Trust',
          securityCode: 'DB85BE175B1E35A823EBD2CDE32DC8D542472D1A',
      });
    }, [searchParams]);

    const handleDownloadPdf = async () => {
        if (!paymentDetails) return;
        try {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const textColor = rgb(0.2, 0.2, 0.2);

            const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7';
            const logoImageBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
            const logoImage = await pdfDoc.embedPng(logoImageBytes);
            const logoDims = logoImage.scale(0.05); // Make logo smaller
            page.drawImage(logoImage, {
                x: 50,
                y: height - 50 - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });

            const drawLine = (y: number) => {
                page.drawLine({
                    start: { x: 50, y },
                    end: { x: width - 50, y },
                    thickness: 0.5,
                    color: rgb(0.8, 0.8, 0.8),
                });
            };

            const drawText = (text: string, x: number, y: number, isBold = false, size = 10) => {
                page.drawText(text, {
                    x,
                    y,
                    font: isBold ? boldFont : font,
                    size,
                    color: textColor,
                });
            };
            
            let y = height - 100;
            drawLine(y + 10);
            y -= 20;

            drawText('Notification of Payment', 50, y, true, 14);
            y -= 20;
            drawText('Nedbank Limited confirms that the following payment has been made:', 50, y, false, 10);
            y -= 30;

            drawText('Date of Payment', 50, y);
            drawText(':', 200, y);
            drawText(paymentDetails.dateOfPayment, 210, y, true);
            y -= 15;
            drawText('Reference Number', 50, y);
            drawText(':', 200, y);
            drawText(paymentDetails.referenceNumber, 210, y, true);
            y -= 30;

            drawText('Beneficiary details', 50, y, true, 12);
            y -= 20;
            drawText('Recipient', 50, y);
            drawText(':', 200, y);
            drawText(paymentDetails.recipient, 210, y, true);
            y -= 15;
            drawText('Amount', 50, y);
            drawText(':', 200, y);
            drawText(formatCurrency(paymentDetails.amount), 210, y, true);
            y -= 15;
            drawText('Recipient Reference', 50, y);
            drawText(':', 200, y);
            drawText(paymentDetails.recipientReference, 210, y, true);
            y -= 15;
            drawText('Bank', 50, y);
            drawText(':', 200, y);
            drawText(paymentDetails.bank, 210, y, true);
            y -= 15;
            drawText('Account Number', 50, y);
            drawText(':', 200, y);
            drawText(paymentDetails.accountNumber, 210, y, true);
            y -= 15;
            drawText('Channel', 50, y);
            drawText(':', 200, y);
            drawText(paymentDetails.channel, 210, y, true);
            y -= 30;
            
            drawText('Payer details', 50, y, true, 12);
            y -= 20;
            drawText('Paid from Account Holder', 50, y);
            drawText(':', 200, y);
            drawText(paymentDetails.payer, 210, y, true);
            y-= 30;

            drawLine(y);
            y -= 15;
            drawText('Security Code', 50, y);
            drawText(':', 200, y);
            drawText(paymentDetails.securityCode, 210, y, true);

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'proof-of-payment.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            toast({
                variant: 'destructive',
                title: 'PDF Generation Failed',
                description: 'An error occurred while trying to generate the PDF.',
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
                <div id="proof-of-payment" className="bg-white p-10 max-w-4xl mx-auto shadow-lg font-sans text-[11px] text-gray-800">
                    <Image 
                        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
                        alt="Nedbank Logo"
                        width={40}
                        height={40}
                        className="mb-6"
                    />
                    <hr className="mb-6 border-gray-300"/>

                    <h2 className="text-lg font-bold mb-4 text-gray-800">Notification of Payment</h2>
                    <p className="mb-6 text-gray-600 text-[12px]">Nedbank Limited confirms that the following payment has been made:</p>

                    <table className="w-full mb-6 text-[12px]">
                        <tbody>
                            <DetailRow label="Date of Payment" value={paymentDetails.dateOfPayment} />
                            <DetailRow label="Reference Number" value={paymentDetails.referenceNumber} />
                        </tbody>
                    </table>

                    <h3 className="font-bold mb-4 text-base">Beneficiary details</h3>
                    <table className="w-full mb-6 text-[12px]">
                        <tbody>
                            <DetailRow label="Recipient" value={paymentDetails.recipient} />
                            <DetailRow label="Amount" value={formatCurrency(paymentDetails.amount)} />
                            <DetailRow label="Recipient Reference" value={paymentDetails.recipientReference} />
                            <DetailRow label="Bank" value={paymentDetails.bank} />
                            <DetailRow label="Account Number" value={paymentDetails.accountNumber} />
                            <DetailRow label="Channel" value={paymentDetails.channel} />
                        </tbody>
                    </table>
                    
                    <h3 className="font-bold mb-4 text-base">Payer details</h3>
                    <table className="w-full mb-6 text-[12px]">
                        <tbody>
                            <DetailRow label="Paid from Account Holder" value={paymentDetails.payer} />
                        </tbody>
                    </table>
                    
                    <hr className="mb-6 border-gray-300"/>

                    <table className="w-full mb-6 text-[12px]">
                        <tbody>
                            <DetailRow label="Security Code" value={paymentDetails.securityCode} />
                        </tbody>
                    </table>
                    
                    <div className="space-y-4 text-gray-500 text-[10px] text-center">
                        <p>
                           Payments may take up to three business days. Please check your account to verify the existence of the funds.
                        </p>
                        <p>
                           Nedbank Limited Reg No 1951/000009/06. VAT Reg No 4320116074.
                           <br />
                           We are an authorised financial services provider. We are a registered credit provider in terms of the National Credit Act (NCRCP16).
                        </p>
                    </div>
                </div>
            )}
        </main>
      </div>
    );
}

export default function ProofOfPaymentPage() {
    return (
        <Suspense fallback={<div className="p-4">Loading proof of payment...</div>}>
            <ProofOfPaymentContent />
        </Suspense>
    )
}
