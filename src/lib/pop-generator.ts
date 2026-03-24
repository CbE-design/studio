'use server';

import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import { format } from 'date-fns';
import type { Transaction, Account } from './definitions';
import { formatCurrency } from './data';

async function embedImage(pdfDoc: PDFDocument, imageBytes: ArrayBuffer) {
    try {
        return await pdfDoc.embedPng(imageBytes);
    } catch (pngError) {
        try {
            return await pdfDoc.embedJpg(imageBytes);
        } catch (jpgError) {
            console.error("Failed to embed image as PNG or JPG", { pngError, jpgError });
            throw new Error("Unsupported image format. Please use PNG or JPEG.");
        }
    }
}

export async function generateProofOfPaymentPdf(transaction: Transaction, account: Account): Promise<Uint8Array> {
    const paymentDate = transaction.date ? new Date(transaction.date) : new Date();
    
    const generateRandomSuffix = (length: number) => Math.random().toString().substring(2, 2 + length);
    const generateSecurityCode = () => Array.from({ length: 40 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');

    const referenceNumber = transaction.popReferenceNumber || `${format(paymentDate, 'yyyy-MM-dd')}/NEDBANK/${generateRandomSuffix(12)}`;
    const securityCode = transaction.popSecurityCode || generateSecurityCode();

    const detailsForPdf = {
        dateOfPayment: format(paymentDate, 'dd/MM/yyyy'),
        referenceNumber: referenceNumber,
        recipient: transaction.recipientName,
        amount: Number(transaction.amount || '0'),
        currency: account.currency,
        recipientReference: transaction.recipientReference,
        payer: "DICKSON FAMILY TRUST",
        bank: transaction.bank,
        accountNumber: transaction.accountNumber ? `...${transaction.accountNumber.slice(-6)}` : '...',
        channel: 'Internet payment',
        securityCode: securityCode,
    };

    const pdfDoc = await PDFDocument.create();
    
    pdfDoc.setTitle(`Proof of Payment - ${referenceNumber}`);
    pdfDoc.setAuthor('Nedbank Limited');
    pdfDoc.setSubject('Official Notification of Payment');
    pdfDoc.setCreator('SAPERP');
    pdfDoc.setProducer('SAP NetWeaver');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const textColor = rgb(0, 0, 0);
    const grayColor = rgb(0.3, 0.3, 0.3);
    const margin = 50;
    
    const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5';
    let lineY;
    
    try {
        const logoRes = await fetch(logoUrl);
        if (!logoRes.ok) throw new Error(`Failed to fetch logo`);
        const logoImageBytes = await logoRes.arrayBuffer();
        const logoImage = await embedImage(pdfDoc, logoImageBytes);
        const logoDims = logoImage.scale(0.22);
        lineY = height - margin - logoDims.height;
        page.drawImage(logoImage, { x: margin, y: lineY, width: logoDims.width, height: logoDims.height });
    } catch(e) {
        lineY = height - margin - 20;
    }

    page.drawLine({ start: { x: margin, y: lineY }, end: { x: width - margin, y: lineY }, thickness: 1.5, color: rgb(0, 0, 0) });
    let y = lineY - 20;

    page.drawText('Notification of Payment', { x: margin, y, font: boldFont, size: 12, color: textColor });
    y -= 30;

    page.drawText('Nedbank Limited confirms that the following payment has been made:', { x: margin, y, font, size: 9, color: textColor });
    y -= 19;

    const drawDetailRow = (label: string, value: string) => {
        page.drawText(label, { x: margin, y, font, size: 9, color: textColor });
        page.drawText(':', { x: margin + 120, y, font, size: 9, color: textColor });
        page.drawText(value, { x: margin + 130, y, font, size: 9, color: textColor });
        y -= 15;
    };
    
    drawDetailRow('Date of Payment', detailsForPdf.dateOfPayment);
    drawDetailRow('Reference Number', detailsForPdf.referenceNumber);
    y -= 5;

    page.drawText('Beneficiary details', { x: margin, y, font: boldFont, size: 10, color: textColor });
    y -= 20;

    drawDetailRow('Recipient', detailsForPdf.recipient || 'N/A');
    drawDetailRow('Amount', formatCurrency(detailsForPdf.amount, detailsForPdf.currency));
    drawDetailRow('Recipient Reference', detailsForPdf.recipientReference || 'N/A');
    drawDetailRow('Bank', detailsForPdf.bank || 'N/A');
    drawDetailRow('Account Number', detailsForPdf.accountNumber);
    drawDetailRow('Channel', detailsForPdf.channel);
    y -= 10;

    page.drawText('Payer details', { x: margin, y, font: boldFont, size: 10, color: textColor });
    y -= 20;

    drawDetailRow('Paid from Account Holder', detailsForPdf.payer.toUpperCase());
    y -= 14;
    
    const wrapText = (text: string, maxWidth: number, pdfFont: PDFFont, fontSize: number) => {
        const words = text.split(' ');
        let lines: string[] = [];
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const wordWidth = pdfFont.widthOfTextAtSize(currentLine + " " + word, fontSize);
            if (wordWidth < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const commonTextOptions = { font, size: 8, color: textColor, lineHeight: 12, maxWidth: width - margin * 2 };
    const disclaimer = 'Nedbank will never send you an e-mail link to access Verify payments, always go to Online Banking on www.nedbank.co.za and click on Verify payments.';
    const wrappedDisclaimer = wrapText(disclaimer, commonTextOptions.maxWidth, font, 8);
    
    wrappedDisclaimer.forEach(line => {
        page.drawText(line, { x: margin, y, font, size: 8 });
        y -= 12;
    });
    
    page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: width - margin, y: y + 5 }, thickness: 1, color: rgb(0, 0, 0) });
    y -= 15;

    const emailDisclaimer = 'This email and any accompanying attachments may contain confidential and proprietary information. Emails cannot be guaranteed to be secure or free of errors or viruses. The sender does not accept any liability or responsibility for any interception, loss, late arrival or incompleteness of or tampering or interference with any of the information contained in this email.';
    const wrappedEmail = wrapText(emailDisclaimer, commonTextOptions.maxWidth, font, 8);
    
    wrappedEmail.forEach(line => {
        page.drawText(line, { x: margin, y, font, size: 8 });
        y -= 12;
    });

    y -= 15;
    drawDetailRow('Security Code', detailsForPdf.securityCode);

    const footerY = 30;
    const footerText = "Nedbank Limited Reg No 1951/000009/06. Authorised financial services and registered credit provider (NCRCP16).";
    page.drawText(footerText, { x: margin, y: footerY, font, size: 7, color: grayColor });

    return await pdfDoc.save();
}