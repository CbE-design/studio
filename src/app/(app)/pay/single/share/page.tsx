
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, MessageSquare, Send, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import { format } from 'date-fns';
import { formatCurrency } from '@/app/lib/data';

const shareOptions = [
  { icon: Mail, label: 'Email' },
  { icon: MessageSquare, label: 'WhatsApp' },
  { icon: Send, label: 'SMS' },
];

function ShareProofOfPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const paymentDetails = {
      recipientName: searchParams.get('recipientName'),
      amount: searchParams.get('amount'),
      recipientReference: searchParams.get('recipientReference'),
      bankName: searchParams.get('bankName'),
      accountNumber: searchParams.get('accountNumber'),
  };

  const handleShare = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    const now = new Date();
    const generateRandomSuffix = () => Math.random().toString().substring(2, 11);

    const detailsForPdf = {
        dateOfPayment: format(now, 'dd/MM/yyyy'),
        referenceNumber: `${format(now, 'yyyy-MM-dd')}/Nedbank/${generateRandomSuffix()}`,
        recipient: paymentDetails.recipientName,
        amount: Number(paymentDetails.amount || '0'),
        recipientReference: paymentDetails.recipientReference,
        bank: paymentDetails.bankName,
        accountNumber: `...${paymentDetails.accountNumber?.slice(-5)}`,
        channel: 'Internet payment',
        payer: 'Van Schalkwyk Family Trust', // This could be fetched from user data
        securityCode: 'DB85BE175B1E35A823EBD2CDE32DC8D542472D1A', // Example security code
    };

    try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const monospaceFont = await pdfDoc.embedFont(StandardFonts.Courier);
        
        const textColor = rgb(0.2, 0.2, 0.2);
        const lightTextColor = rgb(0.33, 0.33, 0.33);
        const footerTextColor = rgb(0.46, 0.46, 0.46);
        const borderColor = rgb(0.8, 0.8, 0.8);
        const margin = 40;
        let y = height - margin - 20;

        const wrapText = (text: string, maxWidth: number, font: PDFFont, fontSize: number) => {
            const words = text.split(' ');
            let lines: string[] = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const currentWidth = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
                if (currentWidth < maxWidth) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        };
        
        page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: borderColor });
        y -= 20;

        page.drawText('Notification of Payment', { x: margin, y, font: boldFont, size: 18, color: textColor });
        y -= 30;

        page.drawText('Nedbank Limited confirms that the following payment has been made:', { x: margin, y, font, size: 12, color: textColor });
        y -= 35;
        
        const col1X = margin;
        const col2X = margin + 155;
        page.drawText('Date of Payment', { x: col1X, y, font, size: 12, color: textColor });
        page.drawText(':', { x: col2X - 10, y, font, size: 12, color: textColor });
        page.drawText(detailsForPdf.dateOfPayment, { x: col2X, y, font, size: 12, color: textColor });
        y -= 22;
        page.drawText('Reference Number', { x: col1X, y, font, size: 12, color: textColor });
        page.drawText(':', { x: col2X - 10, y, font, size: 12, color: textColor });
        page.drawText(detailsForPdf.referenceNumber, { x: col2X, y, font, size: 12, color: textColor });
        y -= 30;

        page.drawText('Beneficiary details', { x: margin, y, font: boldFont, size: 14, color: textColor });
        y -= 25;
        const beneficiaryDetails = [
            { label: 'Recipient', value: detailsForPdf.recipient || '' },
            { label: 'Amount', value: formatCurrency(detailsForPdf.amount) },
            { label: 'Recipient Reference', value: detailsForPdf.recipientReference || '' },
            { label: 'Bank', value: detailsForPdf.bank || '' },
            { label: 'Account Number', value: detailsForPdf.accountNumber || '' },
            { label: 'Channel', value: detailsForPdf.channel || '' },
        ];
        beneficiaryDetails.forEach(detail => {
            page.drawText(detail.label, { x: col1X, y, font, size: 12, color: textColor });
            page.drawText(':', { x: col2X - 10, y, font: boldFont, size: 12, color: textColor });
            page.drawText(detail.value, { x: col2X, y, font: boldFont, size: 12, color: textColor });
            y -= 22;
        });
        y -= 15;

        page.drawText('Payer details', { x: margin, y, font: boldFont, size: 14, color: textColor });
        y -= 25;
        page.drawText('Paid from Account Holder', { x: col1X, y, font, size: 12, color: textColor });
        page.drawText(':', { x: col2X - 10, y, font: boldFont, size: 12, color: textColor });
        page.drawText(detailsForPdf.payer, { x: col2X, y, font: boldFont, size: 12, color: textColor });
        y -= 30;

        page.drawText('Security Code', { x: col1X, y, font, size: 12, color: textColor });
        page.drawText(':', { x: col2X - 10, y, font, size: 12, color: textColor });
        page.drawText(detailsForPdf.securityCode, { x: col2X, y, font: monospaceFont, size: 12, color: textColor });
        y -= 45;

        page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: borderColor });
        y -= 20;

        const footerText = "Nedbank Ltd Reg No 1951/000009/06. Licensed financial services provider and registered credit provider.";
        const footerFontSize = 8;
        page.drawText(footerText, { x: (width - font.widthOfTextAtSize(footerText, footerFontSize))/2, y, font, size: footerFontSize, color: footerTextColor });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'proof-of-payment.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "PDF Ready",
            description: "Your proof of payment has been downloaded.",
        });

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        toast({
            variant: 'destructive',
            title: 'PDF Generation Failed',
            description: 'An error occurred while trying to generate the PDF.',
        });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Share Proof of Payment</h1>
      </header>

      <main className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          {shareOptions.map((option, index) => (
            <div
              key={option.label}
              onClick={handleShare}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${index < shareOptions.length - 1 ? 'border-b' : ''} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? 
                <LoaderCircle className="h-6 w-6 mr-4 text-primary animate-spin" /> : 
                <option.icon className="h-6 w-6 mr-4 text-primary" />
              }
              <span className="text-lg font-medium text-gray-700">{option.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
);

export default function ShareProofOfPaymentPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ShareProofOfPaymentContent />
        </Suspense>
    )
}
