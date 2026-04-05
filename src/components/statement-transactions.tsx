
'use client';

import type { Account, Transaction } from '@/app/lib/definitions';
import type { StatementData } from '@/app/lib/statement-generator';
import { format } from 'date-fns';

const fmtNoR = (amount: number) => {
    const isNeg = amount < 0;
    const abs = Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${isNeg ? '-' : ''}${abs}`;
};

interface Props {
    account: Account;
    transactions: Transaction[];
    openingBalance: number;
    statementData: StatementData;
}

export const StatementTransactionsPage = ({ account, transactions, openingBalance, statementData }: Props) => {
    const { accountSummary, bankSummary, bankChargesBreakdown } = statementData;
    let runningBalance = openingBalance;

    return (
        <div className="bg-white font-['Helvetica',sans-serif] text-[10px] leading-snug border border-gray-200 shadow-sm mt-2">

            {/* Date stamp */}
            <div className="px-6 pt-4 pb-1 text-[9px] text-gray-500">
                {accountSummary.statementDate}
            </div>

            {/* Bank charges breakdown table */}
            <div className="px-6 pb-3">
                <p className="font-bold text-[11px] mb-1">
                    Bank charges for the period {accountSummary.statementPeriod.replace(' – ', ' to ')}
                </p>

                <table className="w-full text-[10px]">
                    <thead className="bg-[#007a33] text-white">
                        <tr>
                            <th className="py-1 px-2 text-left font-semibold">Narrative Description</th>
                            <th className="py-1 px-2 text-left font-semibold">Item cost (R)</th>
                            <th className="py-1 px-2 text-left font-semibold">VAT (R)</th>
                            <th className="py-1 px-2 text-left font-semibold">Total (R)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[
                            { label: 'Electronic banking fees', ...bankChargesBreakdown.electronicBankingFees },
                            { label: 'Service fees', ...bankChargesBreakdown.serviceFees },
                            { label: 'Other charges', ...bankChargesBreakdown.otherCharges },
                        ].map(row => (
                            <tr key={row.label}>
                                <td className="py-1 px-2 text-gray-700">{row.label}</td>
                                <td className="py-1 px-2">{row.itemCost.toFixed(2)}</td>
                                <td className="py-1 px-2">{row.vat.toFixed(2)}</td>
                                <td className="py-1 px-2">{row.total.toFixed(2)}</td>
                            </tr>
                        ))}
                        <tr className="font-bold border-t-2 border-gray-300">
                            <td className="py-1 px-2">Total Charges</td>
                            <td></td>
                            <td></td>
                            <td className="py-1 px-2">{bankSummary.bankChargesTotal.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Transactions table */}
            <div className="px-6 pb-4">
                <table className="w-full text-[10px]">
                    <thead className="bg-[#007a33] text-white">
                        <tr>
                            <th className="py-1 px-1.5 text-left font-semibold w-12">Tran list no</th>
                            <th className="py-1 px-1.5 text-left font-semibold w-20">Date</th>
                            <th className="py-1 px-1.5 text-left font-semibold">Description</th>
                            <th className="py-1 px-1.5 text-right font-semibold w-16">Fees (R)</th>
                            <th className="py-1 px-1.5 text-right font-semibold w-16">Debits (R)</th>
                            <th className="py-1 px-1.5 text-right font-semibold w-16">Credits (R)</th>
                            <th className="py-1 px-1.5 text-right font-semibold w-16">Balance (R)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Opening balance row */}
                        <tr className="font-semibold bg-gray-50">
                            <td className="py-1 px-1.5"></td>
                            <td className="py-1 px-1.5 text-gray-600">
                                {transactions.length > 0 ? format(new Date(transactions[0].date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-1 px-1.5">Opening balance</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td className="py-1 px-1.5 text-right">{fmtNoR(openingBalance)}</td>
                        </tr>

                        {transactions.map((tx) => {
                            const isFee = tx.transactionType === 'BANK_FEE';
                            runningBalance += tx.type === 'credit' ? tx.amount : -tx.amount;
                            return (
                                <tr key={tx.id} className="hover:bg-gray-50">
                                    <td className="py-1 px-1.5 text-gray-500">{tx.reference || ''}</td>
                                    <td className="py-1 px-1.5 text-gray-600">{format(new Date(tx.date), 'dd/MM/yyyy')}</td>
                                    <td className="py-1 px-1.5">{(tx.recipientName?.toUpperCase() || tx.description || '').substring(0, 35)}</td>
                                    <td className="py-1 px-1.5 text-right text-gray-700">
                                        {isFee ? `${fmtNoR(tx.amount)} *` : ''}
                                    </td>
                                    <td className="py-1 px-1.5 text-right text-red-600">
                                        {!isFee && tx.type === 'debit' ? fmtNoR(tx.amount) : ''}
                                    </td>
                                    <td className="py-1 px-1.5 text-right text-[#007a33]">
                                        {tx.type === 'credit' ? fmtNoR(tx.amount) : ''}
                                    </td>
                                    <td className="py-1 px-1.5 text-right">{fmtNoR(runningBalance)}</td>
                                </tr>
                            );
                        })}

                        {/* Closing balance row */}
                        <tr className="font-bold border-t-2 border-gray-300">
                            <td colSpan={6} className="py-1 px-1.5">Closing balance</td>
                            <td className="py-1 px-1.5 text-right">{fmtNoR(runningBalance)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-2 flex justify-between items-end text-[8px]">
                <span className="font-bold text-[#007a33] text-[11px]">see money differently</span>
                <div className="text-center text-gray-400 max-w-sm">
                    <p>We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Service.</p>
                    <p>Authorised financial services and registered credit provider (NCRCP16). Nedbank Ltd Reg No 1951/000009/06.</p>
                </div>
                <span className="text-gray-500">Page 2 of {accountSummary.totalPages}</span>
            </div>
        </div>
    );
};
