
'use client';

import type { StatementData } from '@/app/lib/statement-generator';

interface StatementSummaryProps {
    statementData: StatementData;
}

const fmt = (val: number) => {
    const isNeg = val < 0;
    const abs = Math.abs(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${isNeg ? '-' : ''}R${abs}`;
};

const BarRow = ({ label, value, total }: { label: string; value: number; total: number }) => {
    const pct = total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
    return (
        <div className="flex items-center gap-2 text-[10px]">
            <span className="w-36 shrink-0 text-gray-700">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-sm overflow-hidden">
                <div className="h-full bg-[#007a33] rounded-sm" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-16 text-right text-gray-700">{fmt(value)}</span>
        </div>
    );
};

export function StatementSummaryPage({ statementData }: StatementSummaryProps) {
    const { user, account, accountSummary, bankSummary, graphsData } = statementData;
    const { fundsReceived, fundsUsed } = graphsData;

    return (
        <div className="bg-white font-['Helvetica',sans-serif] text-[10px] leading-snug border border-gray-200 shadow-sm">

            {/* Date stamp */}
            <div className="px-6 pt-4 text-[9px] text-gray-500">
                {accountSummary.statementDate}
            </div>

            {/* Address row */}
            <div className="flex justify-between px-6 pt-2 pb-3 border-b border-gray-100">
                <div className="text-[9px] leading-5">
                    <p className="text-gray-600">Mr</p>
                    <p className="font-bold text-gray-900">{`${user.firstName} ${user.lastName}`.toUpperCase()}</p>
                    <p className="font-bold text-gray-900">{account.name.toUpperCase()}</p>
                    <p className="mt-1 text-gray-700">PO BOX 135</p>
                    <p className="text-gray-700">RIVONIA</p>
                    <p className="text-gray-700">JOHANNESBURG</p>
                    <p className="text-gray-700">2128</p>
                </div>
                <div className="text-right text-[9px] leading-5 text-gray-600">
                    <p>135 Rivonia Road, Sandown, 2196</p>
                    <p>P O Box 1144, Johannesburg, 2000, South Africa</p>
                    <p className="mt-1">Bank VAT Reg No 4320116074</p>
                    <p>Lost cards 0800 110 929</p>
                    <p>Client services 0800 555 111</p>
                    <p className="font-bold text-[#007a33]">nedbank.co.za</p>
                    <div className="border-t border-gray-300 mt-1 pt-1">
                        <p>Tax invoice</p>
                    </div>
                </div>
            </div>

            {/* Important message banner */}
            <div className="bg-[#007a33] text-white px-6 py-2 text-[9px]">
                <p className="font-bold">Important message</p>
                <p>From 28 February 2023, we will no longer send monthly investment statements by email or SMS.</p>
                <p>Visit www.nedbank.co.za/statement for more information.</p>
            </div>

            <div className="px-6 py-2 text-[9px] text-gray-500 border-b border-gray-100">
                Please examine this statement soonest. If no error is reported within 30 days after receipt, the statement will be considered as being correct.
            </div>

            {/* Account summary */}
            <div className="px-6">
                <div className="bg-[#007a33] text-white flex justify-between items-center px-2 py-1 mt-2">
                    <span className="font-bold text-sm">Account summary</span>
                    <div className="flex items-center gap-4 text-[10px]">
                        <span>Account number</span>
                        <span className="font-bold">{accountSummary.accountNumber}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 py-2 text-[10px] border-b border-gray-200">
                    <div className="space-y-0.5">
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Account type</span><span>{accountSummary.accountType}</span></div>
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Statement date:</span><span>{accountSummary.statementDate}</span></div>
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Statement period:</span><span>{accountSummary.statementPeriod}</span></div>
                        <div className="flex gap-2"><span className="w-32 text-gray-500">Statement frequency:</span><span>{accountSummary.statementFrequency}</span></div>
                    </div>
                    <div className="space-y-0.5 text-right">
                        <div className="flex justify-end gap-2"><span className="text-gray-500">Envelope:</span><span>{accountSummary.envelope}</span></div>
                        <div className="flex justify-end gap-2"><span className="text-gray-500">Total pages:</span><span>{accountSummary.totalPages}</span></div>
                        <div className="flex justify-end gap-2"><span className="text-gray-500">Client VAT number:</span><span>{accountSummary.clientVatNumber || ''}</span></div>
                    </div>
                </div>

                {/* Bank charges + Cashflow */}
                <div className="grid grid-cols-2 gap-x-8 py-2 text-[10px] border-b border-gray-200">
                    <div>
                        <p className="font-bold mb-1">Bank charges summary</p>
                        <div className="space-y-0.5">
                            {[
                                ['Electronic banking fees', fmt(bankSummary.electronicBankingFees)],
                                ['Service fees', fmt(bankSummary.serviceFees)],
                                ['Other charges', fmt(bankSummary.otherCharges)],
                                ['Bank charge(s) (total)', fmt(bankSummary.bankChargesTotal)],
                                ['*VAT inclusive @', `${bankSummary.vatIncluded.toFixed(3)}%`],
                                ['VAT calculated monthly', ''],
                            ].map(([l, v]) => (
                                <div key={l} className="flex justify-between"><span className="text-gray-600">{l}</span><span>{v}</span></div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Cashflow</p>
                        <div className="space-y-0.5">
                            {[
                                ['Opening balance', fmt(bankSummary.openingBalance), false],
                                ['Funds received/Credits', fmt(bankSummary.fundsReceivedCredits), false],
                                ['Funds used/Debits', fmt(bankSummary.fundsUsedDebits), false],
                                ['Closing balance', fmt(bankSummary.closingBalance), true],
                                ['Annual credit interest rate', `${bankSummary.annualCreditInterestRate.toFixed(3)}%`, false],
                            ].map(([l, v, bold]) => (
                                <div key={l as string} className={`flex justify-between ${bold ? 'font-bold' : ''}`}>
                                    <span className="text-gray-600">{l as string}</span>
                                    <span>{v as string}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-300 my-1" />

                {/* Graphs */}
                <div className="grid grid-cols-2 gap-x-8 py-3 text-[10px]">
                    {/* Left: funds received */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between font-bold">
                            <span>Total funds received/credits</span>
                            <span className="text-[#007a33]">{fmt(fundsReceived.totalCredits)}</span>
                        </div>
                        <BarRow label="Atm/teller deposits" value={fundsReceived.atmTellerDeposits} total={fundsReceived.totalCredits} />
                        <BarRow label="Electronic payments received" value={fundsReceived.electronicPaymentsReceived} total={fundsReceived.totalCredits} />
                        <BarRow label="Transfers in" value={fundsReceived.transfersIn} total={fundsReceived.totalCredits} />
                        <BarRow label="Other credits" value={fundsReceived.otherCredits} total={fundsReceived.totalCredits} />
                        <div className="flex justify-between font-bold border-t border-gray-200 pt-1">
                            <span>Total</span>
                            <span>{fmt(fundsReceived.totalCredits)}</span>
                        </div>
                        <div className="h-2 bg-[#007a33] rounded-sm w-full" />
                        <div className="flex justify-between text-[8px] text-gray-400">
                            {['0','10','20','30','40','50','60','70','80','90','100'].map(n => <span key={n}>{n}</span>)}
                        </div>
                        <p className="text-[8px] text-gray-400 text-center">% of funds received</p>
                    </div>

                    {/* Right: funds used */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between font-bold">
                            <span>Total funds used/debits</span>
                            <span className="text-[#007a33]">{fmt(fundsUsed.totalDebits)}</span>
                        </div>
                        <BarRow label="Transfers out" value={fundsUsed.transfersOut} total={fundsUsed.totalDebits} />
                        <div className="h-3" />
                        <BarRow label="Total charges and fees" value={fundsUsed.totalChargesAndFees} total={fundsUsed.totalDebits} />
                        <BarRow label="Other debits" value={fundsUsed.otherDebits} total={fundsUsed.totalDebits} />
                        <div className="flex justify-between font-bold border-t border-gray-200 pt-1">
                            <span>Total</span>
                            <span>{fmt(fundsUsed.totalDebits)}</span>
                        </div>
                        <div className="h-2 bg-[#007a33] rounded-sm w-full" />
                        <div className="flex justify-between text-[8px] text-gray-400">
                            {['0','10','20','30','40','50','60','70','80','90','100'].map(n => <span key={n}>{n}</span>)}
                        </div>
                        <p className="text-[8px] text-gray-400 text-center">% of utilisation</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-2 flex justify-between items-end text-[8px]">
                <span className="font-bold text-[#007a33] text-[11px]">see money differently</span>
                <div className="text-center text-gray-400 max-w-sm">
                    <p>We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Service.</p>
                    <p>Authorised financial services and registered credit provider (NCRCP16). Nedbank Ltd Reg No 1951/000009/06.</p>
                </div>
                <span className="text-gray-500">Page 1 of {accountSummary.totalPages}</span>
            </div>
        </div>
    );
}
