
'use server';

import { PDFDocument, StandardFonts, rgb, PDFFont, PageSizes, PDFPage } from 'pdf-lib';
import { format } from 'date-fns';
import type { Account, Transaction, User } from './definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type StatementData = {
    account: Account;
    user: User;
    transactions: Transaction[];
    openingBalance: number;
    closingBalance: number;
    totalCredits: number;
    totalDebits: number;
};

type PDFResources = {
    pdfDoc: PDFDocument;
    font: PDFFont;
    boldFont: PDFFont;
    nLogoImage: any;
    eConfirmImage: any;
    barcodeImage: any;
    nLogoDims: { width: number; height: number };
};

const COLORS = {
    primary: rgb(0, 0.447, 0.243), // #00723E
    black: rgb(0, 0, 0),
    gray: rgb(0.3, 0.3, 0.3),
    red: rgb(0.8, 0, 0),
    green: rgb(0.1, 0.7, 0.1),
    lightGray: rgb(0.95, 0.95, 0.95),
    white: rgb(1, 1, 1),
};

const MARGIN = 40;

const formatCurrency = (amount: number, currency: string = 'R') => {
    return `${currency}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
};

async function loadResources(pdfDoc: PDFDocument): Promise<PDFResources> {
    const [font, boldFont] = await Promise.all([
        pdfDoc.embedFont(StandardFonts.Helvetica),
        pdfDoc.embedFont(StandardFonts.HelveticaBold),
    ]);

    const embedImage = async (imageBytes: ArrayBuffer) => {
        try { return await pdfDoc.embedPng(imageBytes); } 
        catch (pngError) {
            try { return await pdfDoc.embedJpg(imageBytes); } 
            catch (jpgError) {
                console.error("Failed to embed image as PNG or JPG", { pngError, jpgError });
                throw new Error("Unsupported image format. Please use PNG or JPEG.");
            }
        }
    };
    
    const nLogoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5';
    const eConfirmLogoUrl = PlaceHolderImages.find(i => i.id === 'statement-econfirm')?.imageUrl!;
    const barcodeUrl = PlaceHolderImages.find(i => i.id === 'statement-barcode')?.imageUrl!;
    
    const [nLogoBytes, eConfirmBytes, barcodeBytes] = await Promise.all([
         fetch(nLogoUrl).then(res => res.arrayBuffer()),
         fetch(eConfirmLogoUrl).then(res => res.arrayBuffer()),
         fetch(barcodeUrl).then(res => res.arrayBuffer()),
    ]);

    const nLogoImage = await embedImage(nLogoBytes);
    const eConfirmImage = await embedImage(eConfirmBytes);
    const barcodeImage = await embedImage(barcodeBytes);
    const nLogoDims = nLogoImage.scale(0.22);

    return { pdfDoc, font, boldFont, nLogoImage, eConfirmImage, barcodeImage, nLogoDims };
}

function drawSummaryPageContent(page: PDFPage, data: StatementData, resources: PDFResources) {
    const { account, user, openingBalance, closingBalance, totalCredits, totalDebits } = data;
    const { font, boldFont, nLogoImage, eConfirmImage, barcodeImage, nLogoDims } = resources;
    const { width, height } = page.getSize();
    let y = height - MARGIN;

    // --- Header ---
    page.drawImage(eConfirmImage, { x: MARGIN, y: y - 30, width: 80, height: 40 });
    page.drawImage(nLogoImage, { x: width - MARGIN - nLogoDims.width, y: y - nLogoDims.height, width: nLogoDims.width, height: nLogoDims.height });
    y -= 80;

    // --- Addresses and Right-side details ---
    page.drawImage(barcodeImage, { x: MARGIN, y: y, width: 250, height: 20 });
    const rightAddressX = width - MARGIN - 200;
    page.drawText('135 Rivonia Road, Sandown, 2196', { x: rightAddressX, y: y + 25, font, size: 8, color: COLORS.gray });
    page.drawText('P O Box 1144, Johannesburg, 2000, South Africa', { x: rightAddressX, y: y + 15, font, size: 8, color: COLORS.gray });

    y -= 20;
    let leftY = y;
    page.drawText('Mr', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText((`${user.firstName || ''} ${user.lastName || ''}`).trim().toUpperCase(), { x: MARGIN, y: leftY, font: boldFont, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText(account.name.toUpperCase(), { x: MARGIN, y: leftY, font: boldFont, size: 9, color: COLORS.black });
    leftY -= 24;
    page.drawText('PO BOX 135', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText('RIVONIA', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText('JOHANNESBURG', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText('2128', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });

    let rightDetailsY = y;
    page.drawText('Bank VAT Reg No 4320116074', { x: rightAddressX, y: rightDetailsY, font, size: 8, color: COLORS.gray });
    rightDetailsY -= 10;
    page.drawText('Lost cards 0800 110 929', { x: rightAddressX, y: rightDetailsY, font, size: 8, color: COLORS.gray });
    rightDetailsY -= 10;
    page.drawText('Client services 0860 555 111', { x: rightAddressX, y: rightDetailsY, font, size: 8, color: COLORS.gray });
    rightDetailsY -= 10;
    page.drawText('nedbank.co.za', { x: rightAddressX, y: rightDetailsY, font: boldFont, size: 8, color: COLORS.primary });
    rightDetailsY -= 12;
    page.drawLine({ start: { x: rightAddressX, y: rightDetailsY + 2 }, end: { x: width - MARGIN, y: rightDetailsY + 2 }, thickness: 0.5, color: COLORS.gray });
    page.drawText('Tax invoice', { x: rightAddressX, y: rightDetailsY - 10, font, size: 8, color: COLORS.gray });

    y = leftY - 30;

    // --- Important Message Box ---
    page.drawRectangle({ x: MARGIN, y: y - 50, width: width - MARGIN * 2, height: 50, color: COLORS.primary });
    page.drawText('Important message', { x: MARGIN + 10, y: y - 15, font: boldFont, size: 9, color: COLORS.white });
    page.drawText('From 28 February 2023, we will no longer send monthly investment statements by email or SMS.', { x: MARGIN + 10, y: y - 30, font, size: 8, color: COLORS.white });
    page.drawText("Visit www.nedbank.co.za/statement for more information.", { x: MARGIN + 10, y: y - 42, font, size: 8, color: COLORS.white });
    
    y -= 75;
    page.drawText('Please examine this statement soonest. If no error is reported within 30 days after receipt, the statement will be considered as being correct.', { x: MARGIN, y, font, size: 7, color: COLORS.gray });
    y -= 20;

    // --- Account Summary Box ---
    page.drawRectangle({ x: MARGIN, y: y - 25, width: width - MARGIN * 2, height: 25, color: COLORS.primary });
    page.drawText('Account summary', { x: MARGIN + 10, y: y - 15, font: boldFont, size: 10, color: COLORS.white });
    
    y -= 35;
    page.drawRectangle({ x: MARGIN, y: y - 25, width: width - MARGIN * 2, height: 25, color: COLORS.lightGray });
    page.drawText('Account type', { x: MARGIN + 10, y: y - 15, font, size: 9, color: COLORS.black });
    page.drawText('Account number', { x: width / 2 + 10, y: y - 15, font, size: 9, color: COLORS.black });

    y -= 30;
    page.drawText(account.name, { x: MARGIN + 10, y, font: boldFont, size: 11, color: COLORS.black });
    page.drawText(account.accountNumber, { x: width / 2 + 10, y, font: boldFont, size: 11, color: COLORS.black });

    y -= 15;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: COLORS.lightGray });
    y -= 15;

    // --- Statement Details ---
    const firstTxDate = data.transactions.length > 0 ? new Date(data.transactions[0].date) : new Date();
    const statementPeriod = `${format(firstTxDate, 'dd/MM/yyyy')} - ${format(new Date(), 'dd/MM/yyyy')}`;
    const summaryCol1 = MARGIN + 10;
    const summaryCol2 = MARGIN + 150;
    page.drawText('Statement date:', { x: summaryCol1, y, font, size: 8 });
    page.drawText(format(new Date(), 'dd/MM/yyyy'), { x: summaryCol2, y, font, size: 8 });
    page.drawText('Total pages:', { x: width/2 + 10, y, font, size: 8 });
    y -= 12;
    page.drawText('Statement period:', { x: summaryCol1, y, font, size: 8 });
    page.drawText(statementPeriod, { x: summaryCol2, y, font, size: 8 });
    
    y -= 40;
    page.drawText('Cashflow', { x: MARGIN, y, font: boldFont, size: 10, color: COLORS.primary });
    y -= 15;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1, color: COLORS.lightGray });
    y -= 15;

    // --- Cashflow Table ---
    const cashflowCol1 = MARGIN;
    const cashflowCol2 = width - MARGIN - 80;
    page.drawText('Opening balance', { x: cashflowCol1, y, font, size: 8 });
    page.drawText(formatCurrency(openingBalance), { x: cashflowCol2, y, font, size: 8, color: COLORS.gray });
    y -= 12;
    page.drawText('Funds received/Credits', { x: cashflowCol1, y, font, size: 8 });
    page.drawText(formatCurrency(totalCredits), { x: cashflowCol2, y, font, size: 8, color: COLORS.gray });
    y -= 12;
    page.drawText('Funds used/Debits', { x: cashflowCol1, y, font, size: 8 });
    page.drawText(formatCurrency(totalDebits), { x: cashflowCol2, y, font, size: 8, color: COLORS.gray });
    y -= 12;
    page.drawText('Closing balance', { x: cashflowCol1, y, font: boldFont, size: 8 });
    page.drawText(formatCurrency(closingBalance), { x: cashflowCol2, y, font: boldFont, size: 8, color: COLORS.gray });
}

function drawPageHeader(page: PDFPage, data: StatementData, resources: PDFResources) {
    const { account } = data;
    const { eConfirmImage, nLogoImage, nLogoDims, boldFont } = resources;
    const { width, height } = page.getSize();

    page.drawImage(eConfirmImage, { x: MARGIN, y: height - 60, width: 80, height: 40 });
    page.drawImage(nLogoImage, { x: width - MARGIN - nLogoDims.width, y: height - 55, width: nLogoDims.width, height: nLogoDims.height });
    page.drawText('STATEMENT', { x: (width / 2) - 30, y: height - 50, font: boldFont, size: 14, color: COLORS.black });
    page.drawText(`${account.name} - ${account.accountNumber}`, { x: MARGIN, y: height - 80, font: resources.font, size: 10, color: COLORS.gray });
}

function drawFooter(page: PDFPage, resources: PDFResources) {
    const { boldFont } = resources;
    const { width } = page.getSize();
    page.drawText('see money differently', { x: (width / 2) - 50, y: MARGIN, font: boldFont, size: 10, color: COLORS.primary });
}

function drawPageNumber(page: PDFPage, pageNum: number, totalPages: number, resources: PDFResources) {
    const { font, boldFont } = resources;
    const { width } = page.getSize();
    const pageNumText = `Page ${pageNum} of ${totalPages}`;

    if (pageNum === 1) { // Summary page has different footer
         page.drawText(String(totalPages), { x: width/2 + 150, y: 470, font: font, size: 8 });
         page.drawText(pageNumText, { x: width - MARGIN - 50, y: MARGIN, font: boldFont, size: 8 });
    } else { // Transaction pages
        page.drawText(pageNumText, { x: width - MARGIN - 60, y: page.getSize().height - 80, font: font, size: 8, color: COLORS.gray });
        page.drawText(pageNumText, { x: width - MARGIN - 50, y: MARGIN, font: boldFont, size: 8 });
    }
}


function drawTransactionsPageContent(page: PDFPage, transactions: Transaction[], openingBalance: number, data: StatementData, resources: PDFResources) {
    const { account } = data;
    const { font, boldFont } = resources;
    const { width } = page.getSize();
    let y = page.getSize().height - 110;

    drawPageHeader(page, data, resources);
    
    const headers = ['Date', 'Description', `Debits(${account.currency})`, `Credits(${account.currency})`, `Balance(${account.currency})`];
    const colWidths = [80, 200, 80, 80, 80];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    // Draw table header
    page.drawRectangle({ x: MARGIN, y: y - 20, width: tableWidth, height: 20, color: COLORS.primary });
    let currentX = MARGIN + 5;
    headers.forEach((header, i) => {
        let xPos = currentX;
        if (i >= 2) { // Right-align numeric headers
            const textWidth = boldFont.widthOfTextAtSize(header, 9);
            xPos = currentX + colWidths[i] - textWidth - 5;
        }
        page.drawText(header, { x: xPos, y: y - 14, font: boldFont, size: 9, color: COLORS.white });
        currentX += colWidths[i];
    });
    y -= 30;

    const drawRow = (rowData: string[], isHeader = false) => {
        if (y < MARGIN + 40) return false; // Not enough space for another row

        let xPos = MARGIN + 5;
        rowData.forEach((cell, i) => {
            const fontToUse = isHeader || i === 4 ? boldFont : font;
            let cellColor = i === 2 ? COLORS.red : i === 3 ? COLORS.green : COLORS.black;
            if (isHeader) cellColor = COLORS.black;
            
            let calculatedX = xPos;
            if (i >= 2) { // Right align numeric columns
                const textWidth = fontToUse.widthOfTextAtSize(cell, 9);
                calculatedX = xPos + colWidths[i] - textWidth - 5;
            }

            page.drawText(cell, { x: calculatedX, y, font: fontToUse, size: 9, color: cellColor });
            xPos += colWidths[i];
        });
        y -= 5;
        page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + tableWidth, y }, thickness: 0.5, color: COLORS.lightGray });
        y -= 15;
        return true;
    };

    let runningBalance = openingBalance;
    drawRow([
        format(transactions.length > 0 ? new Date(transactions[0].date) : new Date(), 'dd/MM/yyyy'),
        'Opening Balance',
        '', '',
        formatCurrency(openingBalance)
    ], true);
    
    for (const tx of transactions) {
        runningBalance += tx.type === 'credit' ? tx.amount : -tx.amount;
        const rowData = [
            format(new Date(tx.date), 'dd/MM/yyyy'),
            (tx.recipientName?.toUpperCase() || tx.description).substring(0, 35),
            tx.type === 'debit' ? formatCurrency(tx.amount) : '',
            tx.type === 'credit' ? formatCurrency(tx.amount) : '',
            formatCurrency(runningBalance)
        ];
        
        if (!drawRow(rowData)) {
            // This transaction will be drawn on the next page
            return { remainingTransactions: [tx, ...transactions.slice(transactions.indexOf(tx) + 1)], lastBalance: runningBalance - (tx.type === 'credit' ? tx.amount : -tx.amount) };
        }
    }

    drawFooter(page, resources);
    return { remainingTransactions: [], lastBalance: runningBalance };
}


export async function generateStatementPdf(data: StatementData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const resources = await loadResources(pdfDoc);
    const pages: PDFPage[] = [];

    // --- Page 1: Summary ---
    const summaryPage = pdfDoc.addPage(PageSizes.A4);
    drawSummaryPageContent(summaryPage, data, resources);
    drawFooter(summaryPage, resources);
    pages.push(summaryPage);

    // --- Subsequent Pages: Transactions ---
    const TX_PER_PAGE = 35;
    let transactionsToProcess = data.transactions;
    let runningBalanceForPage = data.openingBalance;

    while (transactionsToProcess.length > 0) {
        const txPage = pdfDoc.addPage(PageSizes.A4);
        pages.push(txPage);

        const { remainingTransactions, lastBalance } = drawTransactionsPageContent(
            txPage,
            transactionsToProcess.slice(0, TX_PER_PAGE),
            runningBalanceForPage,
            data,
            resources
        );
        transactionsToProcess = remainingTransactions;
        runningBalanceForPage = lastBalance;
    }

    // Finally, iterate through all created pages to add page numbers
    const totalPages = pages.length;
    pages.forEach((page, index) => {
        drawPageNumber(page, index + 1, totalPages, resources);
    });

    return pdfDoc.save();
}
