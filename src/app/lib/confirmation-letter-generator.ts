
'use server';

import { PDFDocument, StandardFonts, rgb, PDFFont, PageSizes, PDFPage } from 'pdf-lib';
import { format } from 'date-fns';
import type { Account, User } from './definitions';

const COLORS = {
    primary: rgb(0, 0.447, 0.243),
    black: rgb(0, 0, 0),
    gray: rgb(0.5, 0.5, 0.5),
};

const MARGIN = 50;

type PDFResources = {
    pdfDoc: PDFDocument;
    font: PDFFont;
    boldFont: PDFFont;
    nLogoImage: any;
};

async function loadResources(pdfDoc: PDFDocument): Promise<PDFResources> {
    const [font, boldFont] = await Promise.all([
        pdfDoc.embedFont(StandardFonts.Helvetica),
        pdfDoc.embedFont(StandardFonts.HelveticaBold),
    ]);

    const nLogoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5';
    
    let nLogoImage;
    try {
        const nLogoBytes = await fetch(nLogoUrl, { cache: 'force-cache' }).then(res => res.arrayBuffer());
        nLogoImage = await pdfDoc.embedPng(nLogoBytes);
    } catch (e) {
        console.error("Failed to load or embed logo:", e);
        // In a real app, you might have a fallback or handle this error more gracefully
        nLogoImage = null; 
    }

    return { pdfDoc, font, boldFont, nLogoImage };
}

export async function generateConfirmationPdf(account: Account, user: User): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const resources = await loadResources(pdfDoc);
    const { font, boldFont, nLogoImage } = resources;
    let y = height - MARGIN;

    // --- Header with Logo ---
    if (nLogoImage) {
        const logoDims = nLogoImage.scale(0.22);
        page.drawImage(nLogoImage, {
            x: width - MARGIN - logoDims.width,
            y: y - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
        });
        y -= logoDims.height + 20;
    }

    // --- Bank Address ---
    page.drawText('NEDBANK', { x: width - MARGIN - 150, y, font: boldFont, size: 9, color: COLORS.black });
    y -= 12;
    page.drawText('135 RIVONIA ROAD, SANDOWN, SANDTON, 2196', { x: width - MARGIN - 150, y, font, size: 9, color: COLORS.gray });
    y -= 12;
    page.drawText('PO BOX 1144, JOHANNESBURG, 2000', { x: width - MARGIN - 150, y, font, size: 9, color: COLORS.gray });
    y -= 12;
    page.drawText('SOUTH AFRICA', { x: width - MARGIN - 150, y, font, size: 9, color: COLORS.gray });

    y -= 40;

    // --- User Address ---
    const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.toUpperCase();
    page.drawText(userFullName, { x: MARGIN, y, font: boldFont, size: 9, color: COLORS.black });
    // Placeholder for address
    y -= 12;
    page.drawText('USER ADDRESS LINE 1', { x: MARGIN, y, font, size: 9, color: COLORS.gray });
    y -= 12;
    page.drawText('CITY, POSTCODE', { x: MARGIN, y, font, size: 9, color: COLORS.gray });

    y -= 40;
    
    // --- Date ---
    page.drawText(`Date: ${format(new Date(), 'dd MMMM yyyy')}`, { x: width - MARGIN - 150, y, font, size: 9, color: COLORS.black });
    
    y -= 60;

    // --- Titles ---
    page.drawText('TO WHOM IT MAY CONCERN', { x: (width / 2) - boldFont.widthOfTextAtSize('TO WHOM IT MAY CONCERN', 11)/2, y, font: boldFont, size: 11, color: COLORS.black });
    y -= 30;
    page.drawText(`ACCOUNT CONFIRMATION FOR ${userFullName}`, { x: MARGIN, y, font: boldFont, size: 10, color: COLORS.black });
    
    y -= 30;

    // --- Body Text ---
    page.drawText(`This letter serves to confirm that ${userFullName} holds the following account with Nedbank Limited:`, { x: MARGIN, y, font, size: 9, color: COLORS.black, maxWidth: width - MARGIN * 2 });
    
    y -= 40;

    // --- Account Details Table ---
    const tableCol1X = MARGIN + 20;
    const tableCol2X = MARGIN + 180;
    const drawRow = (label: string, value: string) => {
        page.drawText(label, { x: tableCol1X, y, font: boldFont, size: 9 });
        page.drawText(value, { x: tableCol2X, y, font, size: 9 });
        y -= 15;
        page.drawLine({start: {x: MARGIN, y: y + 5}, end: {x: width - MARGIN, y: y + 5}, thickness: 0.5, color: COLORS.gray});
        y-= 10;
    };

    drawRow('ACCOUNT HOLDER', userFullName);
    drawRow('ACCOUNT NUMBER', account.accountNumber);
    drawRow('ACCOUNT TYPE', account.name);
    drawRow('BRANCH CODE', '198765 (UNIVERSAL)');
    drawRow('ACCOUNT OPENING DATE', format(new Date(user.createdAt), 'dd MMMM yyyy'));
    
    y -= 20;

    page.drawText('This confirmation is issued at the request of our client and is subject to the terms and conditions of the account.', { x: MARGIN, y, font, size: 9, color: COLORS.black, maxWidth: width - MARGIN * 2 });
    y -= 24;
    page.drawText('For any queries, please contact us on 0860 555 111.', { x: MARGIN, y, font, size: 9, color: COLORS.black });
    
    y -= 40;
    page.drawText('Yours faithfully,', { x: MARGIN, y, font, size: 9 });
    y -= 60;
    page.drawText('NEDBANK', { x: MARGIN, y, font: boldFont, size: 10 });
    
    // --- Footer ---
    const footerY = MARGIN;
    page.drawLine({ start: { x: MARGIN, y: footerY + 20 }, end: { x: width - MARGIN, y: footerY + 20 }, thickness: 1, color: COLORS.gray });
    
    const footerText1 = 'This is a system-generated document and does not require a signature.';
    const footerText2 = 'Nedbank Ltd Reg No 1951/000009/06. Authorised financial services and registered credit provider (NCRCP16).';
    
    page.drawText(footerText1, { x: (width / 2) - font.widthOfTextAtSize(footerText1, 7)/2, y: footerY, font, size: 7, color: COLORS.gray });
    page.drawText(footerText2, { x: (width / 2) - font.widthOfTextAtSize(footerText2, 7)/2, y: footerY - 10, font, size: 7, color: COLORS.gray });

    return pdfDoc.save();
}
