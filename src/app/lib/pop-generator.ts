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
    
    // Set SAP ERP Metadata
    pdfDoc.setTitle(`Proof of Payment - ${referenceNumber}`);
    pdfDoc.setAuthor('Nedbank Limited');
    pdfDoc.setSubject('Official Notification of Payment');
    pdfDoc.setCreator('SAPERP');
    pdfDoc.setProducer('SAP NetWeaver');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
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
        if (!logoRes.ok) {
            throw new Error(`Failed to fetch logo: ${logoRes.statusText}`);
        }
        const logoImageBytes = await logoRes.arrayBuffer();
        const logoImage = await embedImage(pdfDoc, logoImageBytes);
        const logoDims = logoImage.scale(0.22);
        
        lineY = height - margin - logoDims.height;
        
        page.drawImage(logoImage, {
            x: margin,
            y: lineY,
            width: logoDims.width,
            height: logoDims.height,
        });

    } catch(e) {
        console.error("Could not load or draw logo image. Skipping.", e);
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
    
    const wrapText = (text: string, maxWidth: number, font: PDFFont, fontSize: number) => {
        const words = text.replace(/\s+/g, ' ').split(' ');
        let lines: string[] = [];
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            if (!word) continue;
            const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
            if (width < maxWidth) {
                currentLine += (currentLine === '' ? '' : ' ') + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const drawWrappedText = (text: string, options: { x: number, y: number, font: PDFFont, size: number, color: any, lineHeight: number, maxWidth: number, align?: 'center' | 'left' | 'right' | 'justify' }) => {
        const { align = 'left', ...restOptions } = options;
        const lines = wrapText(text, restOptions.maxWidth, restOptions.font, restOptions.size);
        let currentY = restOptions.y;
        lines.forEach((line, index) => {
            const isLastLine = index === lines.length - 1;
            let x = restOptions.x;
            if (align === 'center') {
                const textWidth = restOptions.font.widthOfTextAtSize(line, restOptions.size);
                x = (width - textWidth) / 2;
                page.drawText(line, { ...restOptions, x, y: currentY });
            } else if (align === 'right') {
                const textWidth = restOptions.font.widthOfTextAtSize(line, restOptions.size);
                x = width - margin - textWidth;
                page.drawText(line, { ...restOptions, x, y: currentY });
            } else if (align === 'justify') {
                const lineTextWidth = restOptions.font.widthOfTextAtSize(line, restOptions.size);
                const extraSpace = restOptions.maxWidth - lineTextWidth;
                const charSpacing = line.length > 0 ? extraSpace / line.length : 0;
                page.drawText(line, { ...restOptions, x, y: currentY, characterSpacing: charSpacing });
            } else {
                page.drawText(line, { ...restOptions, x, y: currentY });
            }
            currentY -= restOptions.lineHeight;
        });
        return currentY;
    };
    
    const commonTextOptions = { font, size: 8, color: textColor, lineHeight: 15, maxWidth: width - margin * 2 };

    y = drawWrappedText('Nedbank will never send you an e-mail link to access Verify payments, always go to Online Banking on www.nedbank.co.za and click on Verify payments.', { ...commonTextOptions, x: margin, y });
    
    page.drawLine({ start: { x: margin, y: y }, end: { x: width - margin, y: y }, thickness: 1, color: rgb(0, 0, 0) });
    y -= 15;

    const disclaimerParagraphs = [
      'This notification of payment is sent to you by Nedbank Limited Reg No 1951/000009/06. Enquiries regarding this payment notification should be directed to the Nedbank Contact Centre on 0860 555 111. Please contact the payer for enquiries regarding the contents of this notification. Nedbank Ltd will not be held responsible for the accuracy of the information on this notification and we accept no liability whatsoever arising from the transmission and use of the information. Payments may take up to three business days. Please check your account to verify the existence of the funds.'
    ];
    
    disclaimerParagraphs.forEach(paragraph => {
        y = drawWrappedText(paragraph, { ...commonTextOptions, x: margin, y });
        y -= 18;
    });
    
    y -= 5;
    
    y = drawWrappedText('Note: We as a bank will never send you an e-mail requesting you to enter your personal details or private identification and authentication details.', { ...commonTextOptions, x: margin, y });
    y -= 15;

    page.drawText('Nedbank Limited email', { x: margin, y, font: boldFont, size: 10, color: textColor });
    y -= 18;

    const emailDisclaimerParagraphs = [
        'This email and any accompanying attachments may contain confidential and proprietary information. This information is',
        'private and protected by law and, accordingly, if you are not the intended recipient, you are requested to delete this entire',
        'communication immediately and are notified that any disclosure, copying or distribution of or taking any action based on',
        'this information is prohibited. Emails cannot be guaranteed to be secure or free of errors or viruses. The sender does not',
        'accept any liability or responsibility for any interception, corruption, destruction, loss, late arrival or incompleteness of or',
        'tampering or interference with any of the information contained in this email or for its incorrect delivery or non-delivery for',
        'whatsoever reason or for its effect on any electronic device of the recipient. If verification of this email or any attachment',
        'is required, please request a hard copy version.'
    ];

    emailDisclaimerParagraphs.forEach(paragraph => {
        y = drawWrappedText(paragraph, { ...commonTextOptions, x: margin, y, size: 12, lineHeight: 15, align: 'justify' });
        y -= 1;
    });

    y -= 15;

    drawDetailRow('Security Code', detailsForPdf.securityCode);
    y -= 30;

    const footerY = 30;
    page.drawLine({ start: { x: margin, y: footerY + 25 }, end: { x: width - margin, y: footerY + 25 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    const footerSeg1 = "Nedbank Limited Reg No 1951/000009/06";
    const footerSeg2 = "VAT Reg No 4320116074";
    const footerSeg3 = "135 Rivonia Road Sandown Sandton 2196 South Africa";
    const footerLine2a = "We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services.";
    const footerLine2b = "We are an authorised financial services provider. We are a registered credit provider in terms of the National Credit Act (NCR Reg No: NCRCP16).";

    const footerFontSize = 6.5;
    const segGap = 6;
    const seg1Width = font.widthOfTextAtSize(footerSeg1, footerFontSize);
    const seg2Width = font.widthOfTextAtSize(footerSeg2, footerFontSize);
    const seg3Width = font.widthOfTextAtSize(footerSeg3, footerFontSize);
    const totalFooterLine1Width = seg1Width + segGap + seg2Width + segGap + seg3Width;
    const footerLine1StartX = (width - totalFooterLine1Width) / 2;

    let footerTextY = footerY + 13;
    page.drawText(footerSeg1, { x: footerLine1StartX, y: footerTextY, font, size: footerFontSize, color: grayColor });
    page.drawText(footerSeg2, { x: footerLine1StartX + seg1Width + segGap, y: footerTextY, font, size: footerFontSize, color: grayColor });
    page.drawText(footerSeg3, { x: footerLine1StartX + seg1Width + segGap + seg2Width + segGap, y: footerTextY, font, size: footerFontSize, color: grayColor });
    footerTextY -= 11;
    footerTextY = drawWrappedText(footerLine2a, {
        x: margin,
        y: footerTextY,
        font: font,
        size: 6,
        color: grayColor,
        lineHeight: 9,
        maxWidth: width - margin * 2,
        align: 'center'
    });
    footerTextY += 9 - 7; // add back lineHeight, then apply 7px gap
    drawWrappedText(footerLine2b, {
        x: margin,
        y: footerTextY,
        font: font,
        size: 6,
        color: grayColor,
        lineHeight: 9,
        maxWidth: width - margin * 2,
        align: 'center'
    });
    
    return await pdfDoc.save();
}