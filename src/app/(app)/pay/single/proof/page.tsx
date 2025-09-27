
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/app/lib/data';
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
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
            const headingColor = rgb(0, 0, 0);
            const margin = 50;
            let y = height - margin;

            // Helper for wrapping text
            const wrapText = (text: string, maxWidth: number, font: PDFFont, fontSize: number) => {
                const words = text.split(' ');
                const lines: string[] = [];
                let currentLine = words[0];

                for (let i = 1; i < words.length; i++) {
                    const word = words[i];
                    const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
                    if (width < maxWidth) {
                        currentLine += " " + word;
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
                lines.push(currentLine);
                return lines;
            };

            // 1. Logo
            const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7';
            const logoImageBytes = await fetch(`/api/image-proxy?url=${encodeURIComponent(logoUrl)}`).then(res => res.arrayBuffer());
            const logoImage = await pdfDoc.embedPng(logoImageBytes);
            const logoDims = logoImage.scale(0.05);
            page.drawImage(logoImage, {
                x: margin,
                y: y - logoDims.height,
                width: logoDims.width,
                height: logoDims.height,
            });
            y -= logoDims.height + 20;

            // 2. Main Title
            page.drawText('Notification of Payment', { x: margin, y, font: boldFont, size: 18, color: headingColor });
            y -= 30;

            // 3. Intro paragraph
            page.drawText('Nedbank Limited confirms that the following payment has been made:', { x: margin, y, font, size: 10, color: textColor });
            y -= 25;
            
            // 4. Details Table (Date, Ref)
            const detailStartY = y;
            page.drawText('Date of Payment', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(paymentDetails.dateOfPayment, { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y -= 15;
            page.drawText('Reference Number', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(paymentDetails.referenceNumber, { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y = detailStartY - 50;

            // 5. Beneficiary Details
            page.drawText('Beneficiary details', { x: margin, y, font: boldFont, size: 14, color: headingColor });
            y -= 25;
            const beneficiaryStartY = y;
            page.drawText('Recipient', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(paymentDetails.recipient, { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y -= 15;
            page.drawText('Amount', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(formatCurrency(paymentDetails.amount), { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y -= 15;
            page.drawText('Recipient Reference', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(paymentDetails.recipientReference, { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y -= 15;
            page.drawText('Bank', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(paymentDetails.bank, { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y -= 15;
            page.drawText('Account Number', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(paymentDetails.accountNumber, { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y -= 15;
            page.drawText('Channel', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(paymentDetails.channel, { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y = beneficiaryStartY - 120;

            // 6. Payer Details
            page.drawText('Payer details', { x: margin, y, font: boldFont, size: 14, color: headingColor });
            y -= 25;
            page.drawText('Paid from Account Holder', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(paymentDetails.payer, { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y -= 30;

            // 7. Standard Text
            const standardTexts = [
                "Nedbank will never send you an e-mail link to access Verify payments, always go to Online Banking on www.nedbank.co.za and click on Verify payments.",
                "This notification of payment is sent to you by Nedbank Limited Reg No 1951/000009/06. Enquiries regarding this payment notification should be directed to the Nedbank Contact Centre on 0860 555 111. Please contact the payer for enquiries regarding the contents of this notification.",
                "Nedbank Ltd will not be held responsible for the accuracy of the information on this notification and we accept no liability whatsoever arising from the transmission and use of the information.",
                "Payments may take up to three business days. Please check your account to verify the existence of the funds.",
                "Note: We as a bank will never send you an e-mail requesting you to enter your personal details or private identification and authentication details."
            ];

            const standardFontsize = 8;
            standardTexts.forEach(text => {
                const lines = wrapText(text, width - (2*margin), font, standardFontsize);
                lines.forEach(line => {
                     page.drawText(line, { x: margin, y, font, size: standardFontsize, color: textColor, lineHeight: 10 });
                     y -= 10;
                });
                y -= 5;
            });
            y -= 15;

            // 8. Disclaimer Box
            const boxPadding = 10;
            const boxContentWidth = width - (2 * margin) - (2 * boxPadding);
            const disclaimerTitle = "Nedbank Limited email disclaimer";
            const disclaimerText = "This email and any accompanying attachments may contain confidential and proprietary information. This information is private and protected by law and, accordingly, if you are not the intended recipient, you are requested to delete this entire communication immediately and are notified that any disclosure, copying or distribution of or taking any action based on this information is prohibited. Emails cannot be guaranteed to be secure or free of errors or viruses. The sender does not accept any liability or responsibility for any interception, corruption, destruction, loss, late arrival or incompleteness of, or tampering or interference with any of the information contained in this email or for its incorrect delivery or non-delivery for whatsoever reason or for its effect on any electronic device of the recipient. If verification of this email or any attachment is required, please request a hard copy version.";

            const titleLines = wrapText(disclaimerTitle, boxContentWidth, boldFont, 9);
            const bodyLines = wrapText(disclaimerText, boxContentWidth, font, 7);
            
            const boxHeight = (titleLines.length * 11) + (bodyLines.length * 9) + (2 * boxPadding);

            page.drawRectangle({
                x: margin,
                y: y - boxHeight,
                width: width - (2 * margin),
                height: boxHeight,
                borderColor: rgb(0.8, 0.8, 0.8),
                borderWidth: 1,
            });
            
            let boxY = y - boxPadding;
            titleLines.forEach(line => {
                page.drawText(line, { x: margin + boxPadding, y: boxY - 11, font: boldFont, size: 9, color: headingColor });
                boxY -= 11;
            });
            boxY -= 5;
            bodyLines.forEach(line => {
                page.drawText(line, { x: margin + boxPadding, y: boxY - 9, font, size: 7, color: textColor, lineHeight: 9 });
                boxY -= 9;
            });
            y -= boxHeight + 20;

            // 9. Security Code
            page.drawText('Security Code', { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 125, y, font, size: 9, color: textColor });
            page.drawText(paymentDetails.securityCode, { x: margin + 135, y, font: boldFont, size: 9, color: textColor });
            y -= 25;

            // 10. Footer
            const footerText = "Nedbank Limited Reg No 1951/000009/06 VAT Reg No 432018074 135 Rivonia Road, Sandton, Sandton 2196, South Africa.";
            page.drawText(footerText, { x: margin, y, font, size: 7, color: textColor });

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
                            <DetailRow label="Amount" value={formatCurrency(Number(paymentDetails.amount))} />
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
