'use server';

import { PDFDocument, StandardFonts, rgb, PDFFont, PageSizes, PDFPage } from 'pdf-lib';
import { format } from 'date-fns';
import type { Account, Transaction, User } from './definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- Type Definitions ---
// Structure for the summary data displayed on the statement
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

// Structure for the bank charges and balance summary
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

// Structure for the graph data (Money In / Money Out)
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

// Main data structure passed to the generator
export type StatementData = {
    account: Account;
    user: User;
    transactions: Transaction[];
    accountSummary: StatementSummaryData;
    bankSummary: BankSummaryData;
    graphsData: GraphData;
};

// Resources loaded for PDF generation (fonts, images)
type PDFResources = {
    pdfDoc: PDFDocument;
    font: PDFFont;
    boldFont: PDFFont;
    nLogoImage: any;
    eConfirmImage: any;
    barcodeImage: any;
    nLogoDims: { width: number; height: number };
};

// --- Constants ---
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

/**
 * Formats a number as a currency string.
 * @param amount The amount to format.
 * @param currency The currency symbol (default: 'R').
 */
const formatCurrency = (amount: number, currency: string = 'R') => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${isNegative ? '-' : ''}${currency}${absAmount}`;
};

/**
 * Loads fonts and images needed for the PDF.
 * @param pdfDoc The PDF document instance.
 */
async function loadResources(pdfDoc: PDFDocument): Promise<PDFResources> {
    const [font, boldFont] = await Promise.all([
        pdfDoc.embedFont(StandardFonts.Helvetica),
        pdfDoc.embedFont(StandardFonts.HelveticaBold),
    ]);

    // Helper to embed image, trying PNG then JPG
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
    
    // Image URLs (Replace with your actual asset URLs or paths)
    const nLogoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5';
    const eConfirmLogoUrl = PlaceHolderImages.find(i => i.id === 'statement-econfirm')?.imageUrl!;
    const barcodeUrl = PlaceHolderImages.find(i => i.id === 'statement-barcode')?.imageUrl!;
    
    // Fetch images in parallel
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

/**
 * Draws the content of the first page (Summary Page).
 */
function drawSummaryPageContent(page: PDFPage, data: StatementData, resources: PDFResources) {
    const { user, accountSummary, bankSummary, graphsData } = data;
    const { font, boldFont, nLogoImage, eConfirmImage, barcodeImage, nLogoDims } = resources;
    const { width, height } = page.getSize();
    let y = height - MARGIN;

    // --- Header Section ---
    page.drawImage(eConfirmImage, { x: MARGIN, y: y - 30, width: 80, height: 40 });
    page.drawImage(nLogoImage, { x: width - MARGIN - nLogoDims.width, y: y - nLogoDims.height, width: nLogoDims.width, height: nLogoDims.height });
    y -= 80;

    // --- Addresses and Bank Details ---
    page.drawImage(barcodeImage, { x: MARGIN, y: y, width: 250, height: 20 });
    const rightAddressX = width - MARGIN - 200;
    
    // Bank Address (Right)
    page.drawText('135 Rivonia Road, Sandown, 2196', { x: rightAddressX, y: y + 25, font, size: 8, color: COLORS.gray });
    page.drawText('P O Box 1144, Johannesburg, 2000, South Africa', { x: rightAddressX, y: y + 15, font, size: 8, color: COLORS.gray });

    y -= 20;
    let leftY = y;
    
    // User Address (Left)
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

    // Bank Contact Details (Right)
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

    // --- Account Summary Section ---
    const ACCOUNT_SUMMARY_BAR_HEIGHT = 20;
    // Green Header Bar
    page.drawRectangle({ x: MARGIN, y: y - ACCOUNT_SUMMARY_BAR_HEIGHT, width: width - MARGIN * 2, height: ACCOUNT_SUMMARY_BAR_HEIGHT, color: COLORS.primary });
    page.drawText('Account summary', { x: MARGIN + 4, y: y - 14, font: boldFont, size: 10, color: COLORS.white });
    page.drawText('Account number', { x: width - MARGIN - 120, y: y - 14, font, size: 10, color: COLORS.white });
    
    const accountNumberText = accountSummary.accountNumber;
    const accountNumberWidth = boldFont.widthOfTextAtSize(accountNumberText, 10);
    page.drawText(accountNumberText, { x: width - MARGIN - 4 - accountNumberWidth, y: y - 14, font: boldFont, size: 10, color: COLORS.white });
    y -= ACCOUNT_SUMMARY_BAR_HEIGHT;

    // Account Details Rows
    const LINE_HEIGHT = 15;
    const COL_1_X = MARGIN + 4;
    const COL_2_X = MARGIN + 104;
    const COL_3_X = MARGIN + 280;
    const COL_4_X = COL_3_X + 100;
    const RIGHT_EDGE = width - MARGIN - 4;
    
    y -= LINE_HEIGHT;
    page.drawText('Account type', { x: COL_1_X, y, font, size: 9 });
    page.drawText(accountSummary.accountType, { x: COL_2_X, y, font, size: 9 });
    page.drawText('Envelope:', { x: COL_3_X, y, font, size: 9 });
    const envelopeText = accountSummary.envelope;
    page.drawText(envelopeText, { x: RIGHT_EDGE - font.widthOfTextAtSize(envelopeText, 9), y, font, size: 9 });
    
    y -= LINE_HEIGHT;
    page.drawText('Statement date:', { x: COL_1_X, y, font, size: 9 });
    page.drawText(accountSummary.statementDate, { x: COL_2_X, y, font, size: 9 });
    page.drawText('Total pages:', { x: COL_3_X, y, font, size: 9 });
    const totalPagesText = accountSummary.totalPages;
    page.drawText(totalPagesText, { x: RIGHT_EDGE - font.widthOfTextAtSize(totalPagesText, 9), y, font, size: 9 });

    y -= LINE_HEIGHT;
    page.drawText('Statement period:', { x: COL_1_X, y, font, size: 9 });
    page.drawText(accountSummary.statementPeriod, { x: COL_2_X, y, font, size: 9 });
    page.drawText('Client VAT number:', { x: COL_3_X, y, font, size: 9 });
    const vatText = accountSummary.clientVatNumber || '-';
    page.drawText(vatText, { x: RIGHT_EDGE - font.widthOfTextAtSize(vatText, 9), y, font, size: 9 });
    
    y -= LINE_HEIGHT;
    page.drawText('Statement frequency:', { x: COL_1_X, y, font, size: 9 });
    page.drawText(accountSummary.statementFrequency, { x: COL_2_X, y, font, size: 9 });
    
    y -= 5;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1 });
    y -= 5;

    // --- Bank charges summary (Left) & Cashflow (Right) ---
    const SECTION_TITLE_Y = y - LINE_HEIGHT;
    const CHARGES_RIGHT_EDGE = MARGIN + 180;
    
    // Headers
    page.drawText('Bank charges summary', { x: COL_1_X, y: SECTION_TITLE_Y, font: boldFont, size: 9 });
    page.drawText('Cashflow', { x: COL_3_X, y: SECTION_TITLE_Y, font: boldFont, size: 9 });

    // Left Column: Charges
    let y_charges = SECTION_TITLE_Y - LINE_HEIGHT;
    const cashFeeText = formatCurrency(bankSummary.cashFees);
    page.drawText('Cash fees', { x: COL_1_X, y: y_charges, font, size: 9 });
    page.drawText(cashFeeText, { x: CHARGES_RIGHT_EDGE - font.widthOfTextAtSize(cashFeeText, 9), y: y_charges, font, size: 9});
    y_charges -= LINE_HEIGHT;
    
    const otherChargesText = formatCurrency(bankSummary.otherCharges);
    page.drawText('Other charges', { x: COL_1_X, y: y_charges, font, size: 9 });
    page.drawText(otherChargesText, { x: CHARGES_RIGHT_EDGE - font.widthOfTextAtSize(otherChargesText, 9), y: y_charges, font, size: 9});
    y_charges -= LINE_HEIGHT;
    
    const totalChargesText = formatCurrency(bankSummary.bankChargesTotal);
    page.drawText('Bank charge(s) (total)', { x: COL_1_X, y: y_charges, font, size: 9 });
    page.drawText(totalChargesText, { x: CHARGES_RIGHT_EDGE - font.widthOfTextAtSize(totalChargesText, 9), y: y_charges, font, size: 9});
    y_charges -= LINE_HEIGHT;
    
    const vatIncludedText = `${bankSummary.vatIncluded.toFixed(3)}%`;
    page.drawText('VAT included @', { x: COL_1_X, y: y_charges, font, size: 9 });
    page.drawText(vatIncludedText, { x: CHARGES_RIGHT_EDGE - font.widthOfTextAtSize(vatIncludedText, 9), y: y_charges, font, size: 9});
    y_charges -= LINE_HEIGHT;

    const vatMonthlyText = formatCurrency(bankSummary.vatCalculatedMonthly);
    page.drawText('VAT calculated monthly', { x: COL_1_X, y: y_charges, font, size: 9 });
    page.drawText(vatMonthlyText, { x: CHARGES_RIGHT_EDGE - font.widthOfTextAtSize(vatMonthlyText, 9), y: y_charges, font, size: 9});

    // Right Column: Cashflow
    let y_cashflow = SECTION_TITLE_Y - LINE_HEIGHT;
    const openBalText = formatCurrency(bankSummary.openingBalance);
    page.drawText('Opening balance', { x: COL_3_X, y: y_cashflow, font, size: 9 });
    page.drawText(openBalText, { x: RIGHT_EDGE - font.widthOfTextAtSize(openBalText, 9), y: y_cashflow, font, size: 9 });
    y_cashflow -= LINE_HEIGHT;

    const creditsText = formatCurrency(bankSummary.fundsReceivedCredits);
    page.drawText('Funds received/Credits', { x: COL_3_X, y: y_cashflow, font, size: 9 });
    page.drawText(creditsText, { x: RIGHT_EDGE - font.widthOfTextAtSize(creditsText, 9), y: y_cashflow, font, size: 9 });
    y_cashflow -= LINE_HEIGHT;
    
    const debitsText = formatCurrency(bankSummary.fundsUsedDebits);
    page.drawText('Funds used/Debits', { x: COL_3_X, y: y_cashflow, font, size: 9 });
    page.drawText(debitsText, { x: RIGHT_EDGE - font.widthOfTextAtSize(debitsText, 9), y: y_cashflow, font, size: 9 });
    y_cashflow -= LINE_HEIGHT;

    const closeBalText = formatCurrency(bankSummary.closingBalance);
    page.drawText('Closing balance', { x: COL_3_X, y: y_cashflow, font: boldFont, size: 9 });
    page.drawText(closeBalText, { x: RIGHT_EDGE - boldFont.widthOfTextAtSize(closeBalText, 9), y: y_cashflow, font: boldFont, size: 9 });
    y_cashflow -= LINE_HEIGHT;

    const interestText = `${bankSummary.annualCreditInterestRate.toFixed(3)}%`;
    page.drawText('Annual credit interest rate', { x: COL_3_X, y: y_cashflow, font, size: 9 });
    page.drawText(interestText, { x: RIGHT_EDGE - font.widthOfTextAtSize(interestText, 9), y: y_cashflow, font, size: 9 });
    
    // Draw separator line below summary
    y = Math.min(y_charges, y_cashflow) - 15;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 1 });
    y -= 10;
    
    // --- Draw Financial Graphs ---
    drawFinancialGraphs(page, graphsData, y, resources);
}

/**
 * Draws the visual bar charts for Funds Received vs Funds Used.
 */
function drawFinancialGraphs(page: PDFPage, graphsData: GraphData, startY: number, resources: PDFResources) {
    const { font, boldFont } = resources;
    
    const CHART_WIDTH = 150;
    const BAR_HEIGHT = 10;
    const ROW_HEIGHT = 20;

    const START_X_LEFT = MARGIN;
    const START_X_RIGHT = MARGIN + 280;
    
    const LABEL_WIDTH_LEFT = 110;
    const BAR_X_LEFT = START_X_LEFT + LABEL_WIDTH_LEFT;
    const VALUE_RIGHT_EDGE_LEFT = START_X_RIGHT - 10;

    const LABEL_WIDTH_RIGHT = 100;
    const BAR_X_RIGHT = START_X_RIGHT + LABEL_WIDTH_RIGHT;
    const VALUE_RIGHT_EDGE_RIGHT = page.getSize().width - MARGIN;

    let y = startY;

    // --- LEFT GRAPH: Total funds received/credits ---
    const received = graphsData.fundsReceived;
    const receivedTotal = received.totalCredits;
    
    // Header
    const totalReceivedText = formatCurrency(receivedTotal);
    page.drawText('Total funds received/credits', { x: START_X_LEFT, y, font: boldFont, size: 9 });
    page.drawText(totalReceivedText, { x: VALUE_RIGHT_EDGE_LEFT - boldFont.widthOfTextAtSize(totalReceivedText, 9), y, font: boldFont, size: 9, color: COLORS.primary });
    y -= ROW_HEIGHT;

    const receivedRows = [
        { label: 'Atm/teller deposits', value: received.atmTellerDeposits },
        { label: 'Electronic payments received', value: received.electronicPaymentsReceived },
        { label: 'Transfers in', value: received.transfersIn },
        { label: 'Other credits', value: received.otherCredits },
    ];
    
    // Draw bars
    receivedRows.forEach(row => {
        const barWidth = receivedTotal > 0 ? (row.value / receivedTotal) * CHART_WIDTH : 0;
        page.drawText(row.label, { x: START_X_LEFT, y: y + 2, font, size: 9 });
        page.drawRectangle({ x: BAR_X_LEFT, y: y, width: barWidth, height: BAR_HEIGHT, color: COLORS.primary, opacity: 0.2 });
        const valueText = formatCurrency(row.value);
        page.drawText(valueText, { x: VALUE_RIGHT_EDGE_LEFT - font.widthOfTextAtSize(valueText, 9), y: y + 2, font, size: 9 });
        y -= ROW_HEIGHT;
    });

    // Total bar
    page.drawText('Total', { x: START_X_LEFT, y: y + 2, font: boldFont, size: 9 });
    page.drawRectangle({ x: BAR_X_LEFT, y: y, width: CHART_WIDTH, height: BAR_HEIGHT, color: COLORS.primary });
    const totalReceivedTextBottom = formatCurrency(receivedTotal);
    page.drawText(totalReceivedTextBottom, { x: VALUE_RIGHT_EDGE_LEFT - boldFont.widthOfTextAtSize(totalReceivedTextBottom, 9), y: y + 2, font: boldFont, size: 9 });
    
    // --- RIGHT GRAPH: Total funds used/debits ---
    y = startY; // Reset Y for the right column
    const used = graphsData.fundsUsed;
    const usedTotal = used.totalDebits;
    
    // Header
    const totalUsedText = formatCurrency(usedTotal);
    page.drawText('Total funds used/debits', { x: START_X_RIGHT, y, font: boldFont, size: 9 });
    page.drawText(totalUsedText, { x: VALUE_RIGHT_EDGE_RIGHT - boldFont.widthOfTextAtSize(totalUsedText, 9), y, font: boldFont, size: 9, color: COLORS.primary });
    y -= ROW_HEIGHT;
    
    const usedRows = [
        { label: 'Account payments', value: used.accountPayments },
        { label: 'Electronic transfers', value: used.electronicTransfers },
        { label: 'Total charges and fees', value: used.totalChargesAndFees },
        { label: 'Other debits', value: used.otherDebits },
    ];
    
    // Draw bars
    usedRows.forEach(row => {
        const barWidth = usedTotal > 0 ? (row.value / usedTotal) * CHART_WIDTH : 0;
        page.drawText(row.label, { x: START_X_RIGHT, y: y+2, font, size: 9 });
        page.drawRectangle({ x: BAR_X_RIGHT, y, width: barWidth, height: BAR_HEIGHT, color: COLORS.primary, opacity: 0.2 });
        const valueText = formatCurrency(row.value);
        page.drawText(valueText, { x: VALUE_RIGHT_EDGE_RIGHT - font.widthOfTextAtSize(valueText, 9), y: y+2, font, size: 9 });
        y -= ROW_HEIGHT;
    });

    // Total bar
    page.drawText('Total', { x: START_X_RIGHT, y: y+2, font: boldFont, size: 9 });
    page.drawRectangle({ x: BAR_X_RIGHT, y, width: CHART_WIDTH, height: BAR_HEIGHT, color: COLORS.primary });
    const totalUsedTextBottom = formatCurrency(usedTotal);
    page.drawText(totalUsedTextBottom, { x: VALUE_RIGHT_EDGE_RIGHT - boldFont.widthOfTextAtSize(totalUsedTextBottom, 9), y: y+2, font: boldFont, size: 9 });
}

/**
 * Draws the standard header for transaction pages.
 */
function drawPageHeader(page: PDFPage, data: StatementData, resources: PDFResources) {
    const { account } = data;
    const { eConfirmImage, nLogoImage, nLogoDims, boldFont } = resources;
    const { width, height } = page.getSize();

    page.drawImage(eConfirmImage, { x: MARGIN, y: height - 60, width: 80, height: 40 });
    page.drawImage(nLogoImage, { x: width - MARGIN - nLogoDims.width, y: height - 55, width: nLogoDims.width, height: nLogoDims.height });
    page.drawText('STATEMENT', { x: (width / 2) - 30, y: height - 50, font: boldFont, size: 14, color: COLORS.black });
    page.drawText(`${account.name} - ${account.accountNumber}`, { x: MARGIN, y: height - 80, font: resources.font, size: 10, color: COLORS.gray });
}

/**
 * Draws the footer with the slogan.
 */
function drawFooter(page: PDFPage, resources: PDFResources) {
    const { boldFont } = resources;
    const { width } = page.getSize();
    page.drawText('see money differently', { x: (width / 2) - 50, y: MARGIN, font: boldFont, size: 10, color: COLORS.primary });
}

/**
 * Draws the page number at the top and bottom.
 */
function drawPageNumber(page: PDFPage, pageNum: number, totalPages: number, resources: PDFResources) {
    const { font } = resources;
    const { width } = page.getSize();
    const pageNumText = `Page ${pageNum} of ${totalPages}`;

    const textWidth = font.widthOfTextAtSize(pageNumText, 8);
    
    // Draw at top right (if not first page logic elsewhere, but here logic is simple)
    if (pageNum > 1) { 
        page.drawText(pageNumText, { x: width - MARGIN - textWidth, y: page.getSize().height - 80, font: font, size: 8, color: COLORS.gray });
    }
    
    // Draw at bottom right
    page.drawText(pageNumText, { x: width - MARGIN - textWidth, y: MARGIN, font: font, size: 8 });
}

/**
 * Renders a page of transactions.
 * Returns the remaining transactions and the closing balance for this page.
 */
function drawTransactionsPageContent(page: PDFPage, transactions: Transaction[], openingBalance: number, data: StatementData, resources: PDFResources): { remainingTransactions: Transaction[], lastBalance: number } {
    const { account } = data;
    const { font, boldFont } = resources;
    const { width } = page.getSize();
    let y = page.getSize().height - 110;

    drawPageHeader(page, data, resources);
    
    // Table Column layout
    const tableRightEdge = width - MARGIN;
    const colXs = {
        date: MARGIN,
        description: 120,
        debits: 380,
        credits: 470,
        balance: tableRightEdge,
    };
    
    const colRightEdges = {
        date: colXs.description - 5,
        description: colXs.debits - 5,
        debits: colXs.credits - 5,
        credits: colXs.balance - 5,
        balance: tableRightEdge
    }

    // Draw Table Header
    page.drawRectangle({ x: MARGIN, y: y - 20, width: tableRightEdge - MARGIN, height: 20, color: COLORS.primary });
    
    page.drawText('Date', { x: colXs.date + 5, y: y - 14, font: boldFont, size: 9, color: COLORS.white });
    page.drawText('Description', { x: colXs.description + 5, y: y - 14, font: boldFont, size: 9, color: COLORS.white });
    const debitsHeader = `Debits(${account.currency})`;
    page.drawText(debitsHeader, { x: colRightEdges.debits - boldFont.widthOfTextAtSize(debitsHeader, 9), y: y - 14, font: boldFont, size: 9, color: COLORS.white });
    const creditsHeader = `Credits(${account.currency})`;
    page.drawText(creditsHeader, { x: colRightEdges.credits - boldFont.widthOfTextAtSize(creditsHeader, 9), y: y - 14, font: boldFont, size: 9, color: COLORS.white });
    const balanceHeader = `Balance(${account.currency})`;
    page.drawText(balanceHeader, { x: colRightEdges.balance - boldFont.widthOfTextAtSize(balanceHeader, 9), y: y - 14, font: boldFont, size: 9, color: COLORS.white });
    
    y -= 25;

    // Helper to draw a single row
    const drawRow = (rowData: (string|null)[], isHeader = false) => {
        if (y < MARGIN + 40) return false; // Check for page overflow
        const fontToUse = isHeader || rowData.length -1 ? boldFont : font;

        // Date
        page.drawText(rowData[0] || '', { x: colXs.date + 5, y, font: fontToUse, size: 9, color: COLORS.black });
        // Description
        page.drawText(rowData[1] || '', { x: colXs.description + 5, y, font: fontToUse, size: 9, color: COLORS.black });
        // Debits
        if(rowData[2]) {
            const debitText = rowData[2];
            page.drawText(debitText, { x: colRightEdges.debits - font.widthOfTextAtSize(debitText, 9), y, font: font, size: 9, color: COLORS.red });
        }
        // Credits
        if(rowData[3]) {
            const creditText = rowData[3];
            page.drawText(creditText, { x: colRightEdges.credits - font.widthOfTextAtSize(creditText, 9), y, font: font, size: 9, color: COLORS.green });
        }
        // Balance
        if(rowData[4]) {
            const balanceText = rowData[4];
            page.drawText(balanceText, { x: colRightEdges.balance - fontToUse.widthOfTextAtSize(balanceText, 9), y, font: fontToUse, size: 9, color: COLORS.black });
        }

        y -= 5;
        page.drawLine({ start: { x: MARGIN, y }, end: { x: tableRightEdge, y }, thickness: 0.5, color: COLORS.lightGray });
        y -= 15;
        return true;
    };

    let runningBalance = openingBalance;
    const firstTransactionDate = transactions.length > 0 ? new Date(transactions[0].date) : new Date();

    const openingBalanceText = formatCurrency(openingBalance, '');
    
    // Draw Opening Balance Row
    drawRow([
        format(firstTransactionDate, 'dd/MM/yyyy'),
        'Opening Balance',
        null, null,
        openingBalanceText
    ], true);
    
    let processedCount = 0;

    // Iterate through transactions and draw them
    for (const tx of transactions) {
        runningBalance += tx.type === 'credit' ? tx.amount : -tx.amount;
        const rowData = [
            format(new Date(tx.date), 'dd/MM/yyyy'),
            (tx.recipientName?.toUpperCase() || tx.description).substring(0, 35),
            tx.type === 'debit' ? formatCurrency(tx.amount, '') : null,
            tx.type === 'credit' ? formatCurrency(tx.amount, '') : null,
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

/**
 * Main function to generate the Statement PDF.
 * @param data Data object containing account, user, and transaction details.
 * @returns Uint8Array containing the PDF bytes.
 */
export async function generateStatementPdf(data: StatementData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const resources = await loadResources(pdfDoc);
    const pages: PDFPage[] = [];

    // --- Page 1: Summary ---
    const summaryPage = pdfDoc.addPage(PageSizes.A4);
    pages.push(summaryPage);

    // --- Subsequent Pages: Transactions ---
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

    // Update total pages in summary data and draw Page 1 content
    const finalStatementData = {...data, accountSummary: {...data.accountSummary, totalPages: String(totalPages)}};
    drawSummaryPageContent(summaryPage, finalStatementData, resources);
    drawFooter(summaryPage, resources);

    // Draw page numbers on all pages
    pages.forEach((page, index) => {
        drawPageNumber(page, index + 1, totalPages, resources);
    });

    return pdfDoc.save();
}
