
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, MessageSquare, Send, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import { format } from 'date-fns';
import { formatCurrency } from '@/app/lib/data';
import { useUser } from '@/firebase-provider';

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
  const { user } = useUser();

  const paymentDetails = {
      recipientName: searchParams.get('recipientName'),
      amount: searchParams.get('amount'),
      yourReference: searchParams.get('yourReference'),
      recipientReference: searchParams.get('recipientReference'),
      bankName: searchParams.get('bankName'),
      accountNumber: searchParams.get('accountNumber'),
  };

  const [payerName, setPayerName] = useState('DIRK VAN SCHALKWYK');

  useEffect(() => {
    // This is set to a hardcoded value per the request.
    // If you wanted it to be dynamic based on the logged-in user, you would use:
    // if (user?.displayName) {
    //   setPayerName(user.displayName.toUpperCase());
    // }
  }, [user]);

  const handleShare = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
        const now = new Date();
        const generateRandomSuffix = (length: number) => Math.random().toString().substring(2, 2 + length);
        const generateSecurityCode = () => Array.from({ length: 40 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');

        const detailsForPdf = {
            dateOfPayment: format(now, 'dd/MM/yyyy'),
            referenceNumber: `${format(now, 'yyyy-MM-dd')}/NEDBANK/${generateRandomSuffix(12)}`,
            recipient: paymentDetails.recipientName,
            amount: Number(paymentDetails.amount || '0'),
            recipientReference: paymentDetails.recipientReference,
            payer: payerName,
            bank: paymentDetails.bankName,
            accountNumber: `...${paymentDetails.accountNumber?.slice(-6)}`,
            channel: 'Internet payment',
            securityCode: generateSecurityCode(),
        };

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
        const { width, height } = page.getSize();
        
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const textColor = rgb(0, 0, 0);
        const grayColor = rgb(0.3, 0.3, 0.3);
        const margin = 50;
        
        const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5';
        const proxyLogoUrl = `/api/image-proxy?url=${encodeURIComponent(logoUrl)}`;
        const logoImageBytes = await fetch(proxyLogoUrl).then(res => res.arrayBuffer());
        const logoImage = await pdfDoc.embedPng(logoImageBytes);
        const logoDims = logoImage.scale(0.22);
        
        const lineY = height - margin - logoDims.height;
        
        page.drawImage(logoImage, {
            x: margin,
            y: lineY,
            width: logoDims.width,
            height: logoDims.height,
        });

        page.drawLine({ start: { x: margin, y: lineY }, end: { x: width - margin, y: lineY }, thickness: 1.5, color: rgb(0, 0, 0) });
        let y = lineY - 25;

        page.drawText('Notification of Payment', { x: margin, y, font: boldFont, size: 12, color: textColor });
        y -= 25;

        page.drawText('Nedbank Limited confirms that the following payment has been made:', { x: margin, y, font, size: 9, color: textColor });
        y -= 25;

        const drawDetailRow = (label: string, value: string) => {
            page.drawText(label, { x: margin, y, font, size: 9, color: textColor });
            page.drawText(':', { x: margin + 120, y, font, size: 9, color: textColor });
            page.drawText(value, { x: margin + 130, y, font, size: 9, color: textColor });
            y -= 15;
        };
        
        drawDetailRow('Date of Payment', detailsForPdf.dateOfPayment);
        drawDetailRow('Reference Number', detailsForPdf.referenceNumber);
        y -= 15;

        page.drawText('Beneficiary details', { x: margin, y, font: boldFont, size: 10, color: textColor });
        y -= 20;

        drawDetailRow('Recipient', detailsForPdf.recipient || 'N/A');
        drawDetailRow('Amount', formatCurrency(detailsForPdf.amount, 'R'));
        drawDetailRow('Recipient Reference', detailsForPdf.recipientReference || 'N/A');
        drawDetailRow('Bank', detailsForPdf.bank || 'N/A');
        drawDetailRow('Account Number', detailsForPdf.accountNumber);
        drawDetailRow('Channel', detailsForPdf.channel);
        y -= 15;

        page.drawText('Payer details', { x: margin, y, font: boldFont, size: 10, color: textColor });
        y -= 20;

        drawDetailRow('Paid from Account Holder', detailsForPdf.payer);
        y -= 20;
        
        const wrapText = (text: string, maxWidth: number, font: PDFFont, fontSize: number) => {
            const words = text.split(' ');
            let lines: string[] = [];
            let currentLine = words[0] || '';
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                if (!word) continue;
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

        const drawWrappedText = (text: string, options: { x: number, y: number, font: PDFFont, size: number, color: any, lineHeight: number, maxWidth: number }) => {
            const lines = wrapText(text, options.maxWidth, options.font, options.size);
            let currentY = options.y;
            lines.forEach(line => {
                page.drawText(line, { ...options, y: currentY });
                currentY -= options.lineHeight;
            });
            return currentY;
        };
        
        const commonTextOptions = { font, size: 8, color: textColor, lineHeight: 12, maxWidth: width - margin * 2 };

        y = drawWrappedText('Nedbank will never send you an e-mail link to access Verify payments, always go to Online Banking on www.nedbank.co.za and click on Verify payments.', { ...commonTextOptions, x: margin, y });
        y -= 5;
        
        y -= 7.5;
        page.drawLine({ start: { x: margin, y: y }, end: { x: width - margin, y: y }, thickness: 1, color: rgb(0, 0, 0) });
        y -= 12.5;

        const disclaimerParagraphs = [
          'This notification of payment is sent to you by Nedbank Limited Reg No 1951/000009/06. Enquiries regarding this payment notification should be directed to the Nedbank Contact Centre on 0860 555 111.',
          'Please contact the payer for enquiries regarding the contents of this notification. Nedbank Ltd will not be held responsible for the accuracy of the information on this notification and we accept no liability whatsoever arising from the transmission and use of the information.',
          'Payments may take up to three business days. Please check your account to verify the existence of the funds.'
        ];
        
        disclaimerParagraphs.forEach(paragraph => {
            y = drawWrappedText(paragraph, { ...commonTextOptions, x: margin, y });
            y -= commonTextOptions.lineHeight;
        });

        y -= 5; // Extra space
        
        y = drawWrappedText('Note: We as a bank will never send you an e-mail requesting you to enter your personal details or private identification and authentication details.', { ...commonTextOptions, x: margin, y });
        y -= 20;

        page.drawText('Nedbank Limited email', { x: margin, y, font: boldFont, size: 10, color: textColor });
        y -= 15;
        
        const emailDisclaimerParagraphs = [
            'This email and any accompanying attachments may contain confidential and proprietary information. This information is private and protected by law and, accordingly, if you are not the intended recipient, you are requested to delete this entire communication immediately and are notified that any disclosure, copying or distribution of or taking any action based on this information is prohibited.',
            'Emails cannot be guaranteed to be secure or free of errors or viruses. The sender does not accept any liability or responsibility for any interception, corruption, destruction, loss, late arrival or incompleteness of or tampering or interference with any of the information contained in this email or for its incorrect delivery or non-delivery for whatsoever reason or for its effect on any electronic device of the recipient.',
            'If verification of this email or any attachment is required, please request a hard copy version.'
        ];

        emailDisclaimerParagraphs.forEach(paragraph => {
            y = drawWrappedText(paragraph, { ...commonTextOptions, x: margin, y });
            y -= commonTextOptions.lineHeight;
        });
        
        y -= 15;

        drawDetailRow('Security Code', detailsForPdf.securityCode);
        y -= 30;

        const footerY = margin / 2;
        const footerText = 'Nedbank Limited Reg No 1951/000009/06. VAT Reg No 4320116074. 135 Rivonia Road, Sandown, Sandton, 2196, South Africa.\nWe subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services.\nWe are an authorised financial services provider. We are a registered credit provider in terms of the National Credit Act (NCR Reg No NCRCP16).';
        
        const footerLines = footerText.split('\n');
        let currentFooterY = footerY + (footerLines.length - 1) * 9;

        footerLines.forEach(line => {
            page.drawText(line, { x: margin, y: currentFooterY, font, size: 6, color: grayColor, maxWidth: width - margin*2 });
            currentFooterY -= 9;
        });
        
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

    } catch (error: any) {
        console.error("Failed to generate PDF:", error);
        toast({
            variant: 'destructive',
            title: 'PDF Generation Failed',
            description: error.message || 'An error occurred while trying to generate the PDF.',
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
