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
    electronicBankingFees: number;
    serviceFees: number;
    otherCharges: number;
    bankChargesTotal: number;
    vatIncluded: number;
    openingBalance: number;
    fundsReceivedCredits: number;
    fundsUsedDebits: number;
    closingBalance: number;
    annualCreditInterestRate: number;
};

type BankChargesBreakdown = {
    electronicBankingFees: { itemCost: number; vat: number; total: number };
    serviceFees: { itemCost: number; vat: number; total: number };
    otherCharges: { itemCost: number; vat: number; total: number };
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
        transfersOut: number;
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
    bankChargesBreakdown: BankChargesBreakdown;
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
    primary: rgb(0, 0.478, 0.200),
    black: rgb(0, 0, 0),
    gray: rgb(0.4, 0.4, 0.4),
    red: rgb(0.8, 0, 0),
    lightGray: rgb(0.93, 0.93, 0.93),
    white: rgb(1, 1, 1),
};

const MARGIN = 40;

const fmt = (amount: number) => {
    const isNeg = amount < 0;
    const abs = Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${isNeg ? '-' : ''}R${abs}`;
};

const fmtNoR = (amount: number) => {
    const isNeg = amount < 0;
    const abs = Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${isNeg ? '-' : ''}${abs}`;
};

async function loadResources(pdfDoc: PDFDocument): Promise<PDFResources> {
    const [font, boldFont] = await Promise.all([
        pdfDoc.embedFont(StandardFonts.Helvetica),
        pdfDoc.embedFont(StandardFonts.HelveticaBold),
    ]);

    const embedImage = async (imageBytes: ArrayBuffer) => {
        try { return await pdfDoc.embedPng(imageBytes); }
        catch { return await pdfDoc.embedJpg(imageBytes); }
    };

    const nLogoUrl = 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5';
    const eConfirmLogoUrl = PlaceHolderImages.find(i => i.id === 'statement-econfirm')?.imageUrl!;
    const barcodeUrl = PlaceHolderImages.find(i => i.id === 'statement-barcode')?.imageUrl!;

    const [nLogoBytes, eConfirmBytes, barcodeBytes] = await Promise.all([
        fetch(nLogoUrl).then(r => r.arrayBuffer()),
        fetch(eConfirmLogoUrl).then(r => r.arrayBuffer()),
        fetch(barcodeUrl).then(r => r.arrayBuffer()),
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

    // Date stamp top left
    page.drawText(accountSummary.statementDate, { x: MARGIN, y: y - 5, font, size: 8, color: COLORS.gray });
    y -= 30;

    // Logos
    page.drawImage(eConfirmImage, { x: MARGIN, y: y - 30, width: 80, height: 40 });
    page.drawImage(nLogoImage, { x: width - MARGIN - nLogoDims.width, y: y - nLogoDims.height, width: nLogoDims.width, height: nLogoDims.height });
    y -= 55;

    // Barcode + Bank address
    page.drawImage(barcodeImage, { x: MARGIN, y: y, width: 250, height: 20 });
    const rightAddressX = width - MARGIN - 200;
    page.drawText('135 Rivonia Road, Sandown, 2196', { x: rightAddressX, y: y + 20, font, size: 7.5, color: COLORS.gray });
    page.drawText('P O Box 1144, Johannesburg, 2000, South Africa', { x: rightAddressX, y: y + 10, font, size: 7.5, color: COLORS.gray });
    y -= 8;

    // Customer address (left) + Bank contact details (right)
    let leftY = y;
    page.drawText('Mr', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText(`${user.firstName || ''} ${user.lastName || ''}`.trim().toUpperCase(), { x: MARGIN, y: leftY, font: boldFont, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText(data.account.name.toUpperCase(), { x: MARGIN, y: leftY, font: boldFont, size: 9, color: COLORS.black });
    leftY -= 22;
    page.drawText('PO BOX 135', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText('RIVONIA', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText('JOHANNESBURG', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });
    leftY -= 12;
    page.drawText('2128', { x: MARGIN, y: leftY, font, size: 9, color: COLORS.black });

    let rightY = y;
    page.drawText('Bank VAT Reg No 4320116074', { x: rightAddressX, y: rightY, font, size: 7.5, color: COLORS.gray });
    rightY -= 11;
    page.drawText('Lost cards 0800 110 929', { x: rightAddressX, y: rightY, font, size: 7.5, color: COLORS.gray });
    rightY -= 11;
    page.drawText('Client services 0800 555 111', { x: rightAddressX, y: rightY, font, size: 7.5, color: COLORS.gray });
    rightY -= 11;
    page.drawText('nedbank.co.za', { x: rightAddressX, y: rightY, font: boldFont, size: 7.5, color: COLORS.primary });
    rightY -= 13;
    page.drawLine({ start: { x: rightAddressX, y: rightY + 2 }, end: { x: width - MARGIN, y: rightY + 2 }, thickness: 0.5, color: COLORS.gray });
    page.drawText('Tax invoice', { x: rightAddressX, y: rightY - 9, font, size: 7.5, color: COLORS.gray });

    y = leftY - 20;

    // Important message banner
    const bannerH = 42;
    page.drawRectangle({ x: MARGIN, y: y - bannerH, width: width - MARGIN * 2, height: bannerH, color: COLORS.primary });
    page.drawText('Important message', { x: MARGIN + 8, y: y - 14, font: boldFont, size: 8.5, color: COLORS.white });
    page.drawText('From 28 February 2023, we will no longer send monthly investment statements by email or SMS.', { x: MARGIN + 8, y: y - 27, font, size: 7.5, color: COLORS.white });
    page.drawText('Visit www.nedbank.co.za/statement for more information.', { x: MARGIN + 8, y: y - 38, font, size: 7.5, color: COLORS.white });
    y -= bannerH + 10;

    // "Please examine" notice
    page.drawText('Please examine this statement soonest. If no error is reported within 30 days after receipt, the statement will be considered as being correct.', { x: MARGIN, y, font, size: 7, color: COLORS.gray });
    y -= 18;

    // ── Account summary ──────────────────────────────────────────
    const BAR_H = 18;
    page.drawRectangle({ x: MARGIN, y: y - BAR_H, width: width - MARGIN * 2, height: BAR_H, color: COLORS.primary });
    page.drawText('Account summary', { x: MARGIN + 5, y: y - 12, font: boldFont, size: 9, color: COLORS.white });
    const accNumLabel = 'Account number';
    const accNumValue = accountSummary.accountNumber;
    const midX = width / 2 + 30;
    page.drawText(accNumLabel, { x: midX, y: y - 12, font, size: 9, color: COLORS.white });
    page.drawText(accNumValue, { x: width - MARGIN - boldFont.widthOfTextAtSize(accNumValue, 9) - 4, y: y - 12, font: boldFont, size: 9, color: COLORS.white });
    y -= BAR_H;

    const LH = 13;
    const C1 = MARGIN + 4;
    const C2 = MARGIN + 105;
    const C3 = midX;
    const RE = width - MARGIN - 4;

    const infoRows = [
        ['Account type', accountSummary.accountType, 'Envelope:', accountSummary.envelope],
        ['Statement date:', accountSummary.statementDate, 'Total pages:', accountSummary.totalPages],
        ['Statement period:', accountSummary.statementPeriod, 'Client VAT number:', accountSummary.clientVatNumber || ''],
        ['Statement frequency:', accountSummary.statementFrequency, '', ''],
    ];

    for (const [l1, v1, l2, v2] of infoRows) {
        y -= LH;
        page.drawText(l1, { x: C1, y, font, size: 8 });
        page.drawText(v1, { x: C2, y, font, size: 8 });
        if (l2) page.drawText(l2, { x: C3, y, font, size: 8 });
        if (v2) page.drawText(v2, { x: RE - font.widthOfTextAtSize(v2, 8), y, font, size: 8 });
    }

    y -= 6;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.8, color: COLORS.black });
    y -= 4;

    // ── Bank charges summary (left) + Cashflow (right) ───────────
    const chargesRE = midX - 10;
    let yL = y - LH;
    let yR = y - LH;

    // Section headings
    page.drawText('Bank charges summary', { x: C1, y: yL, font: boldFont, size: 8.5 });
    page.drawText('Cashflow', { x: C3, y: yR, font: boldFont, size: 8.5 });
    yL -= LH; yR -= LH;

    // Left rows
    const leftRows = [
        ['Electronic banking fees', fmt(bankSummary.electronicBankingFees)],
        ['Service fees', fmt(bankSummary.serviceFees)],
        ['Other charges', fmt(bankSummary.otherCharges)],
        [`Bank charge(s) (total)`, fmt(bankSummary.bankChargesTotal)],
        [`*VAT inclusive @`, `${bankSummary.vatIncluded.toFixed(3)}%`],
        ['VAT calculated monthly', ''],
    ];
    for (const [label, val] of leftRows) {
        page.drawText(label, { x: C1, y: yL, font, size: 8 });
        if (val) page.drawText(val, { x: chargesRE - font.widthOfTextAtSize(val, 8), y: yL, font, size: 8 });
        yL -= LH;
    }

    // Right rows
    const rightRows = [
        ['Opening balance', fmt(bankSummary.openingBalance), false],
        ['Funds received/Credits', fmt(bankSummary.fundsReceivedCredits), false],
        ['Funds used/Debits', fmt(bankSummary.fundsUsedDebits), false],
        ['Closing balance', fmt(bankSummary.closingBalance), true],
        ['Annual credit interest rate', `${bankSummary.annualCreditInterestRate.toFixed(3)}%`, false],
    ];
    for (const [label, val, isBold] of rightRows) {
        const f = isBold ? boldFont : font;
        page.drawText(label as string, { x: C3, y: yR, font: f, size: 8 });
        page.drawText(val as string, { x: RE - f.widthOfTextAtSize(val as string, 8), y: yR, font: f, size: 8 });
        yR -= LH;
    }

    y = Math.min(yL, yR) - 6;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.8, color: COLORS.black });
    y -= 8;

    // ── Financial Graphs ─────────────────────────────────────────
    drawFinancialGraphs(page, graphsData, y, resources, width);
}

function drawFinancialGraphs(page: PDFPage, graphsData: GraphData, startY: number, resources: PDFResources, pageWidth: number) {
    const { font, boldFont } = resources;
    const midX = pageWidth / 2 + 30;
    const RE = pageWidth - MARGIN - 4;
    const BAR_W = 110;
    const BAR_H = 8;
    const ROW_H = 16;
    const C1 = MARGIN + 4;
    const chargesRE = midX - 10;
    const C3 = midX;

    let yL = startY;
    let yR = startY;

    const received = graphsData.fundsReceived;
    const used = graphsData.fundsUsed;

    // ── LEFT: Total funds received/credits ──────────────────────
    const totalRec = received.totalCredits;
    const recLabel = `Total funds received/credits`;
    const recVal = fmt(totalRec);
    page.drawText(recLabel, { x: C1, y: yL, font: boldFont, size: 8.5 });
    page.drawText(recVal, { x: chargesRE - boldFont.widthOfTextAtSize(recVal, 8.5), y: yL, font: boldFont, size: 8.5, color: COLORS.primary });
    yL -= ROW_H;

    const recRows = [
        { label: 'Atm/teller deposits', value: received.atmTellerDeposits },
        { label: 'Electronic payments received', value: received.electronicPaymentsReceived },
        { label: 'Transfers in', value: received.transfersIn },
        { label: 'Other credits', value: received.otherCredits },
    ];
    const barXL = C1 + 115;
    for (const row of recRows) {
        const bw = totalRec > 0 ? (row.value / totalRec) * BAR_W : 0;
        page.drawText(row.label, { x: C1, y: yL + 1, font, size: 7.5 });
        page.drawRectangle({ x: barXL, y: yL - 1, width: BAR_W, height: BAR_H, color: COLORS.lightGray });
        if (bw > 0) page.drawRectangle({ x: barXL, y: yL - 1, width: bw, height: BAR_H, color: COLORS.primary });
        const v = fmt(row.value);
        page.drawText(v, { x: chargesRE - font.widthOfTextAtSize(v, 7.5), y: yL + 1, font, size: 7.5 });
        yL -= ROW_H;
    }
    // Total row
    page.drawText('Total', { x: C1, y: yL + 1, font: boldFont, size: 8 });
    page.drawRectangle({ x: barXL, y: yL - 1, width: BAR_W, height: BAR_H, color: COLORS.primary });
    const totalRecV = fmt(totalRec);
    page.drawText(totalRecV, { x: chargesRE - boldFont.widthOfTextAtSize(totalRecV, 8), y: yL + 1, font: boldFont, size: 8 });
    yL -= ROW_H;

    // Scale
    const scaleNums = ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'];
    const scaleStep = BAR_W / 10;
    scaleNums.forEach((n, i) => {
        const sx = barXL + i * scaleStep - font.widthOfTextAtSize(n, 6) / 2;
        page.drawText(n, { x: sx, y: yL, font, size: 6, color: COLORS.gray });
    });
    yL -= 12;
    page.drawText('% of funds received', { x: barXL, y: yL, font, size: 7, color: COLORS.gray });
    yL -= 10;

    // ── RIGHT: Total funds used/debits ───────────────────────────
    const totalUsed = used.totalDebits;
    const usedLabel = 'Total funds used/debits';
    const usedVal = fmt(totalUsed);
    page.drawText(usedLabel, { x: C3, y: yR, font: boldFont, size: 8.5 });
    page.drawText(usedVal, { x: RE - boldFont.widthOfTextAtSize(usedVal, 8.5), y: yR, font: boldFont, size: 8.5, color: COLORS.primary });
    yR -= ROW_H;

    const usedRows = [
        { label: 'Transfers out', value: used.transfersOut },
        { label: '', value: 0 },
        { label: 'Total charges and fees', value: used.totalChargesAndFees },
        { label: 'Other debits', value: used.otherDebits },
    ];
    const barXR = C3 + 108;
    for (const row of usedRows) {
        if (!row.label) { yR -= ROW_H; continue; }
        const bw = totalUsed > 0 ? (row.value / totalUsed) * BAR_W : 0;
        page.drawText(row.label, { x: C3, y: yR + 1, font, size: 7.5 });
        page.drawRectangle({ x: barXR, y: yR - 1, width: BAR_W, height: BAR_H, color: COLORS.lightGray });
        if (bw > 0) page.drawRectangle({ x: barXR, y: yR - 1, width: bw, height: BAR_H, color: COLORS.primary });
        const v = fmt(row.value);
        page.drawText(v, { x: RE - font.widthOfTextAtSize(v, 7.5), y: yR + 1, font, size: 7.5 });
        yR -= ROW_H;
    }
    // Total row
    page.drawText('Total', { x: C3, y: yR + 1, font: boldFont, size: 8 });
    page.drawRectangle({ x: barXR, y: yR - 1, width: BAR_W, height: BAR_H, color: COLORS.primary });
    const totalUsedV = fmt(totalUsed);
    page.drawText(totalUsedV, { x: RE - boldFont.widthOfTextAtSize(totalUsedV, 8), y: yR + 1, font: boldFont, size: 8 });
    yR -= ROW_H;

    // Scale
    scaleNums.forEach((n, i) => {
        const sx = barXR + i * scaleStep - font.widthOfTextAtSize(n, 6) / 2;
        page.drawText(n, { x: sx, y: yR, font, size: 6, color: COLORS.gray });
    });
    yR -= 12;
    page.drawText('% of utilisation', { x: barXR, y: yR, font, size: 7, color: COLORS.gray });
}

function drawPageDateHeader(page: PDFPage, statementDate: string, resources: PDFResources) {
    const { font } = resources;
    const { height } = page.getSize();
    page.drawText(statementDate, { x: MARGIN, y: height - MARGIN - 5, font, size: 8, color: COLORS.gray });
}

function drawBankChargesBreakdownTable(page: PDFPage, data: StatementData, resources: PDFResources): number {
    const { font, boldFont } = resources;
    const { width } = page.getSize();
    let y = page.getSize().height - MARGIN - 25;

    const { bankSummary, bankChargesBreakdown, accountSummary } = data;
    const period = accountSummary.statementPeriod.replace(' – ', ' to ').replace('-', ' ');

    page.drawText(`Bank charges for the period ${period}`, { x: MARGIN, y, font: boldFont, size: 8.5 });
    y -= 16;

    // Table header
    const colW = { narrative: 220, itemCost: 80, vat: 70, total: 80 };
    const c1 = MARGIN;
    const c2 = c1 + colW.narrative;
    const c3 = c2 + colW.itemCost;
    const c4 = c3 + colW.vat;
    const tableRE = width - MARGIN;

    page.drawRectangle({ x: MARGIN, y: y - 15, width: tableRE - MARGIN, height: 15, color: COLORS.primary });
    page.drawText('Narrative Description', { x: c1 + 4, y: y - 11, font: boldFont, size: 8, color: COLORS.white });
    page.drawText('Item cost (R)', { x: c2 + 4, y: y - 11, font: boldFont, size: 8, color: COLORS.white });
    page.drawText('VAT (R)', { x: c3 + 4, y: y - 11, font: boldFont, size: 8, color: COLORS.white });
    page.drawText('Total (R)', { x: c4 + 4, y: y - 11, font: boldFont, size: 8, color: COLORS.white });
    y -= 15;

    const chargeRows = [
        { label: 'Electronic banking fees', ...bankChargesBreakdown.electronicBankingFees },
        { label: 'Service fees', ...bankChargesBreakdown.serviceFees },
        { label: 'Other charges', ...bankChargesBreakdown.otherCharges },
    ];

    for (const row of chargeRows) {
        y -= 14;
        page.drawText(row.label, { x: c1 + 4, y, font, size: 8 });
        page.drawText(row.itemCost.toFixed(2), { x: c2 + 4, y, font, size: 8 });
        page.drawText(row.vat.toFixed(2), { x: c3 + 4, y, font, size: 8 });
        page.drawText(row.total.toFixed(2), { x: c4 + 4, y, font, size: 8 });
        page.drawLine({ start: { x: MARGIN, y: y - 3 }, end: { x: tableRE, y: y - 3 }, thickness: 0.3, color: COLORS.lightGray });
    }

    y -= 14;
    const totalCharges = bankSummary.bankChargesTotal.toFixed(2);
    page.drawText('Total Charges', { x: c1 + 4, y, font: boldFont, size: 8 });
    page.drawText(totalCharges, { x: c4 + 4, y, font: boldFont, size: 8 });
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: tableRE, y }, thickness: 0.5, color: COLORS.black });

    return y - 10;
}

function drawTransactionsPageContent(
    page: PDFPage,
    transactions: Transaction[],
    openingBalance: number,
    data: StatementData,
    resources: PDFResources,
    isFirstTxPage = true
): { remainingTransactions: Transaction[]; lastBalance: number } {
    const { account } = data;
    const { font, boldFont } = resources;
    const { width } = page.getSize();

    let y: number;
    if (isFirstTxPage) {
        y = drawBankChargesBreakdownTable(page, data, resources);
    } else {
        y = page.getSize().height - MARGIN - 25;
    }

    // Column layout — 7 columns
    const tableRE = width - MARGIN;
    const colXs = {
        tranNo: MARGIN,
        date: MARGIN + 55,
        description: MARGIN + 120,
        fees: MARGIN + 330,
        debits: MARGIN + 400,
        credits: MARGIN + 468,
        balance: tableRE,
    };

    // Table header
    page.drawRectangle({ x: MARGIN, y: y - 16, width: tableRE - MARGIN, height: 16, color: COLORS.primary });
    page.drawText('Tran list no', { x: colXs.tranNo + 3, y: y - 12, font: boldFont, size: 7.5, color: COLORS.white });
    page.drawText('Date', { x: colXs.date + 3, y: y - 12, font: boldFont, size: 7.5, color: COLORS.white });
    page.drawText('Description', { x: colXs.description + 3, y: y - 12, font: boldFont, size: 7.5, color: COLORS.white });

    const feesHdr = `Fees (${account.currency})`;
    page.drawText(feesHdr, { x: colXs.fees + 3, y: y - 12, font: boldFont, size: 7.5, color: COLORS.white });

    const debitsHdr = `Debits (${account.currency})`;
    page.drawText(debitsHdr, { x: colXs.debits + 3, y: y - 12, font: boldFont, size: 7.5, color: COLORS.white });

    const creditsHdr = `Credits (${account.currency})`;
    page.drawText(creditsHdr, { x: colXs.credits + 3, y: y - 12, font: boldFont, size: 7.5, color: COLORS.white });

    const balHdr = `Balance (${account.currency})`;
    page.drawText(balHdr, { x: tableRE - boldFont.widthOfTextAtSize(balHdr, 7.5) - 3, y: y - 12, font: boldFont, size: 7.5, color: COLORS.white });
    y -= 16;

    const ROW_H = 18;

    const drawRow = (
        tranNo: string,
        date: string,
        description: string,
        fees: string | null,
        debits: string | null,
        credits: string | null,
        balance: string | null,
        isBold = false
    ) => {
        if (y < MARGIN + 40) return false;
        const f = isBold ? boldFont : font;
        y -= ROW_H;
        page.drawText(tranNo, { x: colXs.tranNo + 3, y, font: f, size: 8 });
        page.drawText(date, { x: colXs.date + 3, y, font: f, size: 8 });
        page.drawText(description.substring(0, 28), { x: colXs.description + 3, y, font: f, size: 8 });
        if (fees) page.drawText(fees, { x: colXs.fees + 3, y, font, size: 8 });
        if (debits) page.drawText(debits, { x: colXs.debits + 3, y, font, size: 8, color: COLORS.red });
        if (credits) page.drawText(credits, { x: colXs.credits + 3, y, font, size: 8, color: COLORS.primary });
        if (balance) {
            const bw = f.widthOfTextAtSize(balance, 8);
            page.drawText(balance, { x: tableRE - bw - 3, y, font: f, size: 8 });
        }
        page.drawLine({ start: { x: MARGIN, y: y - 4 }, end: { x: tableRE, y: y - 4 }, thickness: 0.3, color: COLORS.lightGray });
        return true;
    };

    let runningBalance = openingBalance;
    const firstDate = transactions.length > 0 ? new Date(transactions[0].date) : new Date();

    // Opening balance row
    drawRow('', format(firstDate, 'dd/MM/yyyy'), 'Opening balance', null, null, null, fmtNoR(runningBalance), true);

    let processed = 0;
    for (const tx of transactions) {
        const isFee = tx.transactionType === 'BANK_FEE';
        runningBalance += tx.type === 'credit' ? tx.amount : -tx.amount;
        const amtStr = `${fmtNoR(tx.amount)} *`;
        const ok = drawRow(
            tx.reference || '',
            format(new Date(tx.date), 'dd/MM/yyyy'),
            (tx.recipientName?.toUpperCase() || tx.description || '').substring(0, 28),
            isFee ? amtStr : null,
            !isFee && tx.type === 'debit' ? fmtNoR(tx.amount) : null,
            tx.type === 'credit' ? fmtNoR(tx.amount) : null,
            fmtNoR(runningBalance)
        );
        if (!ok) {
            runningBalance -= tx.type === 'credit' ? tx.amount : -tx.amount;
            return { remainingTransactions: transactions.slice(processed), lastBalance: runningBalance };
        }
        processed++;
    }

    // Closing balance row
    y -= 4;
    const closingText = `Closing balance`;
    const closingVal = fmtNoR(runningBalance);
    page.drawText(closingText, { x: colXs.tranNo + 3, y, font: boldFont, size: 8 });
    page.drawText(closingVal, { x: tableRE - boldFont.widthOfTextAtSize(closingVal, 8) - 3, y, font: boldFont, size: 8 });

    drawFooter(page, resources);
    return { remainingTransactions: [], lastBalance: runningBalance };
}

function drawFooter(page: PDFPage, resources: PDFResources) {
    const { font, boldFont } = resources;
    const { width } = page.getSize();
    const legalLine1 = 'We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution';
    const legalLine2 = 'through the Ombudsman for Banking Service. Authorised financial services and registered credit provider (NCRCP16).';
    const legalLine3 = 'Nedbank Ltd Reg No 1951/000009/06.';

    page.drawText('see money differently', { x: MARGIN, y: MARGIN + 22, font: boldFont, size: 9, color: COLORS.primary });
    page.drawText(legalLine1, { x: width / 2 - 170, y: MARGIN + 22, font, size: 6, color: COLORS.gray });
    page.drawText(legalLine2, { x: width / 2 - 170, y: MARGIN + 13, font, size: 6, color: COLORS.gray });
    page.drawText(legalLine3, { x: width / 2 - 170, y: MARGIN + 4, font, size: 6, color: COLORS.gray });
}

function drawPageNumber(page: PDFPage, pageNum: number, totalPages: number, resources: PDFResources) {
    const { font } = resources;
    const { width } = page.getSize();
    const text = `Page ${pageNum} of ${totalPages}`;
    page.drawText(text, { x: width - MARGIN - font.widthOfTextAtSize(text, 8), y: MARGIN, font, size: 8, color: COLORS.gray });
}

export async function generateStatementPdf(data: StatementData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const resources = await loadResources(pdfDoc);

    // Page 1 — Summary
    const summaryPage = pdfDoc.addPage(PageSizes.A4);

    // Count transaction pages first (estimate)
    let transactionsToProcess = [...data.transactions];
    let balanceForPage = data.bankSummary.openingBalance;
    const txPages: PDFPage[] = [];

    let isFirstTxPage = true;
    while (transactionsToProcess.length > 0) {
        const txPage = pdfDoc.addPage(PageSizes.A4);
        txPages.push(txPage);
        const { remainingTransactions, lastBalance } = drawTransactionsPageContent(
            txPage, transactionsToProcess, balanceForPage, data, resources, isFirstTxPage
        );
        isFirstTxPage = false;
        transactionsToProcess = remainingTransactions;
        balanceForPage = lastBalance;
    }

    const totalPages = 1 + txPages.length;
    const finalData = { ...data, accountSummary: { ...data.accountSummary, totalPages: String(totalPages) } };

    drawSummaryPageContent(summaryPage, finalData, resources);
    drawFooter(summaryPage, resources);
    drawPageNumber(summaryPage, 1, totalPages, resources);

    txPages.forEach((pg, i) => {
        drawPageDateHeader(pg, finalData.accountSummary.statementDate, resources);
        drawPageNumber(pg, i + 2, totalPages, resources);
    });

    return pdfDoc.save();
}
