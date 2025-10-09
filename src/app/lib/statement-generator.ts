
'use server';

import { PDFDocument, StandardFonts, rgb, PDFFont, PageSizes, PDFPage } from 'pdf-lib';
import { format } from 'date-fns';
import type { Account, Transaction, User } from './definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type StatementSummaryData = {
    accountType: string;
    accountNumber: string;
    statementDate: string;
    envelope: string;
    statementPeriod: string;
    totalPages: string;
    statementFrequency: string;
    clientVatNumber: string;
};

type BankSummaryData = {
    cashFees: number;
    otherCharges: number;
    bankChargesTotal: number;
    vatIncluded: number;
    vatCalculatedMonthly: number;
    openingBalance: number;
    fundsReceivedCredits: number;
    fundsUsedDebits: number;
    closingBalance: number;
    annualCreditInterestRate: number;
};

type GraphData = {
    fundsReceived: {
        totalCredits: number;
        atmTellerDeposits: number;
        electronicPaymentsReceived: number;
        transfersIn: number;
        otherCredits: number;
    };
    fundsUsed: {
        totalDebits: number;
        accountPayments: number;
        electronicTransfers: number;
        totalChargesAndFees: number;
        otherDebits: number;
    };
};

export type StatementData = {
    account: Account;
    user: User;
    transactions: Transaction[];
    accountSummary: StatementSummaryData;
    bankSummary: BankSummaryData;
    graphsData: GraphData;
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
    primary: rgb(0, 0.447, 0.243), // #00723E / darkgreen
    black: rgb(0, 0, 0),
    gray: rgb(0.3, 0.3, 0.3),
    red: rgb(0.8, 0, 0),
    green: rgb(0.1, 0.7, 0.1),
    lightGray: rgb(0.95, 0.95, 0.95),
    white: rgb(1, 1, 1),
};

const MARGIN = 40;

const formatCurrency = (amount: number, currency: string = 'R') => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${isNegative ? '-' : ''}${currency}${absAmount}`;
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
    const { user, accountSummary, bankSummary, graphsData } = data;
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
    page.drawText(data.account.name.toUpperCase(), { x: MARGIN, y: leftY, font: boldFont, size: 9, color: COLORS.black });
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
    const ACCOUNT_SUMMARY_BAR_HEIGHT = 20;
    page.drawRectangle({ x: MARGIN, y: y - ACCOUNT_SUMMARY_BAR_HEIGHT, width: width - MARGIN * 2, height: ACCOUNT_SUMMARY_BAR_HEIGHT, color: COLORS.primary });
    page.drawText('Account summary', { x: MARGIN + 4, y: y - 14, font: boldFont, size: 10, color: COLORS.white });
    page.drawText('Account number', { x: MARGIN + 400, y: y - 14, font, size: 10, color: COLORS.white });
    
    const accountNumberText = accountSummary.accountNumber;
    const accountNumberWidth = boldFont.widthOfTextAtSize(accountNumberText, 10);
    page.drawText(accountNumberText, { x: width - MARGIN - 4 - accountNumberWidth, y: y - 14, font: boldFont, size: 10, color: COLORS.white });
    y -= ACCOUNT_SUMMARY_BAR_HEIGHT;

    const LINE_HEIGHT = 15;
    const COL_1_X = MARGIN + 4;
    const COL_2_X = MARGIN + 104;
    const COL_4_X = MARGIN + 400;
    const COL_5_X = width - MARGIN - 4;
    
    y -= LINE_HEIGHT;
    page.drawText('Account type', { x: COL_1_X, y, font, size: 9 });
    page.drawText(accountSummary.accountType, { x: COL_2_X, y, font, size: 9 });
    page.drawText('Envelope:', { x: COL_4_X, y, font, size: 9 });
    const envelopeWidth = font.widthOfTextAtSize(accountSummary.envelope, 9);
    page.drawText(accountSummary.envelope, { x: COL_5_X - envelopeWidth, y, font, size: 9 });
    
    y -= LINE_HEIGHT;
    page.drawText('Statement date:', { x: COL_1_X, y, font, size: 9 });
    page.drawText(accountSummary.statementDate, { x: COL_2_X, y, font, size: 9 });
    page.drawText('Total pages:', { x: COL_4_X, y, font, size: 9 });
    const totalPagesWidth = font.widthOfTextAtSize(accountSummary.totalPages, 9);
    page.drawText(accountSummary.totalPages, { x: COL_5_X - totalPagesWidth, y, font, size: 9 });

    y -= LINE_HEIGHT;
    page.drawText('Statement period:', { x: COL_1_X, y, font, size: 9 });
    page.drawText(accountSummary.statementPeriod, { x: COL_2_X, y, font, size: 9 });
    page.drawText('Client VAT number:', { x: COL_4_X, y, font, size: 9 });
    const vatWidth = font.widthOfTextAtSize(accountSummary.clientVatNumber, 9);
    page.drawText(accountSummary.clientVatNumber, { x: COL_5_X - vatWidth, y, font, size: 9 });
    
    y -= LINE_HEIGHT;
    page.drawText('Statement frequency:', { x: COL_1_X, y, font, size: 9 });
    page.drawText(accountSummary.statementFrequency, { x: COL_2_X, y, font, size: 9 });
    
    y -= 5;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1 });
    y -= 5;

    // --- Bank charges summary (Left) & Cashflow (Right) ---
    const SECTION_TITLE_Y = y - LINE_HEIGHT;
    const COL_2_RIGHT_EDGE = COL_2_X + 50;
    page.drawText('Bank charges summary', { x: COL_1_X, y: SECTION_TITLE_Y, font: boldFont, size: 9 });
    page.drawText('Cashflow', { x: COL_4_X, y: SECTION_TITLE_Y, font: boldFont, size: 9 });

    let y_charges = SECTION_TITLE_Y - LINE_HEIGHT;
    page.drawText('Cash fees', { x: COL_1_X, y: y_charges, font, size: 9 });
    const cashFeeText = formatCurrency(bankSummary.cashFees);
    page.drawText(cashFeeText, { x: COL_2_RIGHT_EDGE - font.widthOfTextAtSize(cashFeeText, 9), y: y_charges, font, size: 9});
    y_charges -= LINE_HEIGHT;
    page.drawText('Other charges', { x: COL_1_X, y: y_charges, font, size: 9 });
    const otherChargesText = formatCurrency(bankSummary.otherCharges);
    page.drawText(otherChargesText, { x: COL_2_RIGHT_EDGE - font.widthOfTextAtSize(otherChargesText, 9), y: y_charges, font, size: 9});
    y_charges -= LINE_HEIGHT;
    page.drawText('Bank charge(s) (total)', { x: COL_1_X, y: y_charges, font, size: 9 });
    const totalChargesText = formatCurrency(bankSummary.bankChargesTotal);
    page.drawText(totalChargesText, { x: COL_2_RIGHT_EDGE - font.widthOfTextAtSize(totalChargesText, 9), y: y_charges, font, size: 9});
    y_charges -= LINE_HEIGHT;
    page.drawText('VAT included @', { x: COL_1_X, y: y_charges, font, size: 9 });
    const vatIncludedText = `${bankSummary.vatIncluded.toFixed(3)}%`;
    page.drawText(vatIncludedText, { x: COL_2_RIGHT_EDGE - font.widthOfTextAtSize(vatIncludedText, 9), y: y_charges, font, size: 9});
    y_charges -= LINE_HEIGHT;
    page.drawText('VAT calculated monthly', { x: COL_1_X, y: y_charges, font, size: 9 });
    const vatMonthlyText = formatCurrency(bankSummary.vatCalculatedMonthly);
    page.drawText(vatMonthlyText, { x: COL_2_RIGHT_EDGE - font.widthOfTextAtSize(vatMonthlyText, 9), y: y_charges, font, size: 9});

    let y_cashflow = SECTION_TITLE_Y - LINE_HEIGHT;
    page.drawText('Opening balance', { x: COL_4_X, y: y_cashflow, font, size: 9 });
    const openBalText = formatCurrency(bankSummary.openingBalance);
    page.drawText(openBalText, { x: COL_5_X - font.widthOfTextAtSize(openBalText, 9), y: y_cashflow, font, size: 9 });
    y_cashflow -= LINE_HEIGHT;
    page.drawText('Funds received/Credits', { x: COL_4_X, y: y_cashflow, font, size: 9 });
    const creditsText = formatCurrency(bankSummary.fundsReceivedCredits);
    page.drawText(creditsText, { x: COL_5_X - font.widthOfTextAtSize(creditsText, 9), y: y_cashflow, font, size: 9 });
    y_cashflow -= LINE_HEIGHT;
    page.drawText('Funds used/Debits', { x: COL_4_X, y: y_cashflow, font, size: 9 });
    const debitsText = formatCurrency(bankSummary.fundsUsedDebits);
    page.drawText(debitsText, { x: COL_5_X - font.widthOfTextAtSize(debitsText, 9), y: y_cashflow, font, size: 9 });
    y_cashflow -= LINE_HEIGHT;
    page.drawText('Closing balance', { x: COL_4_X, y: y_cashflow, font: boldFont, size: 9 });
    const closeBalText = formatCurrency(bankSummary.closingBalance);
    page.drawText(closeBalText, { x: COL_5_X - boldFont.widthOfTextAtSize(closeBalText, 9), y: y_cashflow, font: boldFont, size: 9 });
    y_cashflow -= LINE_HEIGHT;
    page.drawText('Annual credit interest rate', { x: COL_4_X, y: y_cashflow, font, size: 9 });
    const interestText = `${bankSummary.annualCreditInterestRate.toFixed(3)}%`;
    page.drawText(interestText, { x: COL_5_X - font.widthOfTextAtSize(interestText, 9), y: y_cashflow, font, size: 9 });
    
    y = Math.min(y_charges, y_cashflow) - 15;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1 });
    y -= 10;
    
    drawFinancialGraphs(page, graphsData, y, resources);
}

function drawFinancialGraphs(page: PDFPage, graphsData: GraphData, startY: number, resources: PDFResources) {
    const { font, boldFont } = resources;
    const { width } = page.getSize();
    
    const CHART_WIDTH = 150;
    const BAR_HEIGHT = 10;
    const ROW_HEIGHT = 20;

    const START_X_LEFT = MARGIN;
    const START_X_RIGHT = MARGIN + 280;
    const VALUE_COLUMN_WIDTH = 70;
    
    let y = startY;

    // --- LEFT GRAPH: Total funds received/credits ---
    const received = graphsData.fundsReceived;
    const receivedTotal = received.totalCredits;
    
    page.drawText('Total funds received/credits', { x: START_X_LEFT, y, font: boldFont, size: 9 });
    const totalReceivedText = formatCurrency(receivedTotal);
    page.drawText(totalReceivedText, { x: START_X_LEFT + CHART_WIDTH + VALUE_COLUMN_WIDTH - font.widthOfTextAtSize(totalReceivedText, 9), y, font: boldFont, size: 9, color: COLORS.primary });
    y -= ROW_HEIGHT;

    const receivedRows = [
        { label: 'Atm/teller deposits', value: received.atmTellerDeposits },
        { label: 'Electronic payments received', value: received.electronicPaymentsReceived },
        { label: 'Transfers in', value: received.transfersIn },
        { label: 'Other credits', value: received.otherCredits },
    ];
    
    receivedRows.forEach(row => {
        const barWidth = receivedTotal > 0 ? (row.value / receivedTotal) * CHART_WIDTH : 0;
        page.drawText(row.label, { x: START_X_LEFT, y: y + 2, font, size: 9 });
        page.drawRectangle({ x: START_X_LEFT + CHART_WIDTH / 2 - 25, y: y, width: barWidth, height: BAR_HEIGHT, color: COLORS.primary, opacity: 0.2 });
        const valueText = formatCurrency(row.value);
        page.drawText(valueText, { x: START_X_LEFT + CHART_WIDTH + VALUE_COLUMN_WIDTH - font.widthOfTextAtSize(valueText, 9), y: y + 2, font, size: 9 });
        y -= ROW_HEIGHT;
    });

    page.drawText('Total', { x: START_X_LEFT, y: y + 2, font: boldFont, size: 9 });
    page.drawRectangle({ x: START_X_LEFT + CHART_WIDTH / 2 - 25, y: y, width: CHART_WIDTH, height: BAR_HEIGHT, color: COLORS.primary });
    const totalReceivedTextBottom = formatCurrency(receivedTotal);
    page.drawText(totalReceivedTextBottom, { x: START_X_LEFT + CHART_WIDTH + VALUE_COLUMN_WIDTH - boldFont.widthOfTextAtSize(totalReceivedTextBottom, 9), y: y + 2, font: boldFont, size: 9 });
    y -= ROW_HEIGHT;
    
    // --- RIGHT GRAPH: Total funds used/debits ---
    y = startY; 
    const used = graphsData.fundsUsed;
    const usedTotal = used.totalDebits;
    
    page.drawText('Total funds used/debits', { x: START_X_RIGHT, y, font: boldFont, size: 9 });
    const totalUsedText = formatCurrency(usedTotal);
    page.drawText(totalUsedText, { x: START_X_RIGHT + CHART_WIDTH + VALUE_COLUMN_WIDTH - font.widthOfTextAtSize(totalUsedText, 9), y, font: boldFont, size: 9, color: COLORS.primary });
    y -= ROW_HEIGHT;
    
    const usedRows = [
        { label: 'Account payments', value: used.accountPayments },
        { label: 'Electronic transfers', value: used.electronicTransfers },
        { label: 'Total charges and fees', value: used.totalChargesAndFees },
        { label: 'Other debits', value: used.otherDebits },
    ];
    
    usedRows.forEach(row => {
        const barWidth = usedTotal > 0 ? (row.value / usedTotal) * CHART_WIDTH : 0;
        page.drawText(row.label, { x: START_X_RIGHT, y: y+2, font, size: 9 });
        page.drawRectangle({ x: START_X_RIGHT + CHART_WIDTH/2 - 25, y, width: barWidth, height: BAR_HEIGHT, color: COLORS.primary, opacity: 0.2 });
        const valueText = formatCurrency(row.value);
        page.drawText(valueText, { x: START_X_RIGHT + CHART_WIDTH + VALUE_COLUMN_WIDTH - font.widthOfTextAtSize(valueText, 9), y: y+2, font, size: 9 });
        y -= ROW_HEIGHT;
    });

    page.drawText('Total', { x: START_X_RIGHT, y: y+2, font: boldFont, size: 9 });
    page.drawRectangle({ x: START_X_RIGHT + CHART_WIDTH/2 - 25, y, width: CHART_WIDTH, height: BAR_HEIGHT, color: COLORS.primary });
    const totalUsedTextBottom = formatCurrency(usedTotal);
    page.drawText(totalUsedTextBottom, { x: START_X_RIGHT + CHART_WIDTH + VALUE_COLUMN_WIDTH - boldFont.widthOfTextAtSize(totalUsedTextBottom, 9), y: y+2, font: boldFont, size: 9 });
    y -= ROW_HEIGHT;
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

    const textWidth = boldFont.widthOfTextAtSize(pageNumText, 8);
    
    if (pageNum > 1) { 
        page.drawText(pageNumText, { x: width - MARGIN - textWidth, y: page.getSize().height - 80, font: font, size: 8, color: COLORS.gray });
    }
    
    page.drawText(pageNumText, { x: width - MARGIN - textWidth, y: MARGIN, font: boldFont, size: 8 });
}


function drawTransactionsPageContent(page: PDFPage, transactions: Transaction[], openingBalance: number, data: StatementData, resources: PDFResources): { remainingTransactions: Transaction[], lastBalance: number } {
    const { account } = data;
    const { font, boldFont } = resources;
    const { width } = page.getSize();
    let y = page.getSize().height - 110;

    drawPageHeader(page, data, resources);
    
    const headers = ['Date', 'Description', `Debits(${account.currency})`, `Credits(${account.currency})`, `Balance(${account.currency})`];
    const colXs = [MARGIN, 120, 290, 380, 470];
    const colWidths = [80, 170, 90, 90, 90];
    const tableRightEdge = width - MARGIN;

    page.drawRectangle({ x: MARGIN, y: y - 20, width: tableRightEdge - MARGIN, height: 20, color: COLORS.primary });
    
    headers.forEach((header, i) => {
        let xPos = colXs[i] + 5;
        if (i >= 2) { 
            const textWidth = boldFont.widthOfTextAtSize(header, 9);
            xPos = colXs[i] + colWidths[i] - textWidth - 5;
        }
        page.drawText(header, { x: xPos, y: y - 14, font: boldFont, size: 9, color: COLORS.white });
    });
    y -= 25;

    const drawRow = (rowData: string[], isHeader = false) => {
        if (y < MARGIN + 40) return false; 

        rowData.forEach((cell, i) => {
            const fontToUse = isHeader || i === 4 ? boldFont : font;
            let cellColor = i === 2 ? COLORS.red : i === 3 ? COLORS.green : COLORS.black;
            if (isHeader) cellColor = COLORS.black;
            
            let calculatedX = colXs[i] + 5;
            if (i >= 2) {
                const textWidth = fontToUse.widthOfTextAtSize(cell, 9);
                calculatedX = colXs[i] + colWidths[i] - textWidth - 5;
            }

            page.drawText(cell, { x: calculatedX, y, font: fontToUse, size: 9, color: cellColor });
        });
        y -= 5;
        page.drawLine({ start: { x: MARGIN, y }, end: { x: tableRightEdge, y }, thickness: 0.5, color: COLORS.lightGray });
        y -= 15;
        return true;
    };

    let runningBalance = openingBalance;
    const firstTransactionDate = transactions.length > 0 ? new Date(transactions[0].date) : new Date();

    const openingBalanceText = formatCurrency(openingBalance, '');
    drawRow([
        format(firstTransactionDate, 'dd/MM/yyyy'),
        'Opening Balance',
        '', '',
        openingBalanceText
    ], true);
    
    let processedCount = 0;

    for (const tx of transactions) {
        runningBalance += tx.type === 'credit' ? tx.amount : -tx.amount;
        const rowData = [
            format(new Date(tx.date), 'dd/MM/yyyy'),
            (tx.recipientName?.toUpperCase() || tx.description).substring(0, 35),
            tx.type === 'debit' ? formatCurrency(tx.amount, '') : '',
            tx.type === 'credit' ? formatCurrency(tx.amount, '') : '',
            formatCurrency(runningBalance, '')
        ];
        
        if (!drawRow(rowData)) {
            // Revert balance calculation for the transaction that didn't fit
            runningBalance -= tx.type === 'credit' ? tx.amount : -tx.amount;
            const remaining = transactions.slice(processedCount);
            return { remainingTransactions: remaining, lastBalance: runningBalance };
        }
        processedCount++;
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
    const TX_PER_PAGE = 35; // Approximate number of transactions per page
    let transactionsToProcess = [...data.transactions];
    let balanceForPage = data.bankSummary.openingBalance;

    if (transactionsToProcess.length > 0) {
        while (transactionsToProcess.length > 0) {
            const txPage = pdfDoc.addPage(PageSizes.A4);
            pages.push(txPage);

            const { remainingTransactions, lastBalance } = drawTransactionsPageContent(
                txPage,
                transactionsToProcess,
                balanceForPage,
                data,
                resources
            );
            
            transactionsToProcess = remainingTransactions;
            balanceForPage = lastBalance;
        }
    }


    const totalPages = pages.length;
    pages.forEach((page, index) => {
        const adjustedData = {...data, accountSummary: {...data.accountSummary, totalPages: String(totalPages)}};
        drawPageNumber(page, index + 1, totalPages, resources);
    });

    return pdfDoc.save();
}
