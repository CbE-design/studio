
'use client';

import type { StatementData } from '@/app/lib/statement-generator';
import Image from 'next/image';

interface StatementSummaryProps {
    statementData: StatementData;
}

const Bar = ({ label, value, total, color }: { label: string, value: number, total: number, color: string }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="text-xs">
            <div className="flex justify-between mb-1">
                <span>{label}</span>
                <span>R{value.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

export function StatementSummaryPage({ statementData }: StatementSummaryProps) {
    const { accountSummary, bankSummary, graphsData } = statementData;
    const { fundsReceived, fundsUsed } = graphsData;
    
    const formatCurrency = (val: number) => `R${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-gray-800 text-[8px] leading-tight">
            
            <div className="bg-primary text-white p-2 my-2">
                <div className="flex justify-between">
                    <h2 className="font-bold text-sm">Account summary</h2>
                    <div className="text-right">
                        <span>Account number</span>
                        <span className="ml-4">{accountSummary.accountNumber}</span>
                    </div>
                </div>
            </div>
            
            <div className="p-2 grid grid-cols-2 gap-x-4 text-xs mb-2">
                <div>
                    <p><span className="font-bold w-28 inline-block">Account type:</span> {accountSummary.accountType}</p>
                    <p><span className="font-bold w-28 inline-block">Statement date:</span> {accountSummary.statementDate}</p>
                    <p><span className="font-bold w-28 inline-block">Statement period:</span> {accountSummary.statementPeriod}</p>
                    <p><span className="font-bold w-28 inline-block">Statement frequency:</span> {accountSummary.statementFrequency}</p>
                </div>
                 <div className="text-right">
                    <p><span className="font-bold">Envelope:</span> {accountSummary.envelope}</p>
                    <p><span className="font-bold">Total pages:</span> {accountSummary.totalPages}</p>
                    <p><span className="font-bold">Client VAT number:</span> {accountSummary.clientVatNumber}</p>
                </div>
            </div>
            <hr/>

            <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                    <h3 className="font-bold text-sm mb-1">Bank charges summary</h3>
                    <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <dt>Cash fees</dt><dd className="text-right text-gray-600">{formatCurrency(bankSummary.cashFees)}</dd>
                        <dt>Other charges</dt><dd className="text-right text-gray-600">{formatCurrency(bankSummary.otherCharges)}</dd>
                        <dt>Bank charge(s) (total)</dt><dd className="text-right text-gray-600">{formatCurrency(bankSummary.bankChargesTotal)}</dd>
                        <dt>VAT included @</dt><dd className="text-right text-gray-600">{bankSummary.vatIncluded.toFixed(3)}%</dd>
                        <dt>VAT calculated monthly</dt><dd className="text-right text-gray-600">{formatCurrency(bankSummary.vatCalculatedMonthly)}</dd>
                    </dl>
                </div>
                <div>
                    <h3 className="font-bold text-sm mb-1">Cashflow</h3>
                     <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <dt>Opening balance</dt><dd className="text-right text-gray-600">{formatCurrency(bankSummary.openingBalance)}</dd>
                        <dt>Funds received/Credits</dt><dd className="text-right text-gray-600">{formatCurrency(bankSummary.fundsReceivedCredits)}</dd>
                        <dt>Funds used/Debits</dt><dd className="text-right text-gray-600">{formatCurrency(bankSummary.fundsUsedDebits)}</dd>
                        <dt className="font-bold">Closing balance</dt><dd className="text-right font-bold text-gray-600">{formatCurrency(bankSummary.closingBalance)}</dd>
                        <dt>Annual credit interest rate</dt><dd className="text-right text-gray-600">{bankSummary.annualCreditInterestRate.toFixed(3)}%</dd>
                    </dl>
                </div>
            </div>
            
            <hr className="my-4"/>

            <div className="grid grid-cols-2 gap-4">
                {/* Funds Received Graph */}
                <div className="space-y-2">
                    <div className="flex justify-between font-bold text-xs">
                        <h3>Total funds received/credits</h3>
                        <span className="text-primary">{formatCurrency(fundsReceived.totalCredits)}</span>
                    </div>
                    <Bar label="Atm/teller deposits" value={fundsReceived.atmTellerDeposits} total={fundsReceived.totalCredits} color="bg-primary" />
                    <Bar label="Electronic payments received" value={fundsReceived.electronicPaymentsReceived} total={fundsReceived.totalCredits} color="bg-primary" />
                    <Bar label="Transfers in" value={fundsReceived.transfersIn} total={fundsReceived.totalCredits} color="bg-primary" />
                    <Bar label="Other credits" value={fundsReceived.otherCredits} total={fundsReceived.totalCredits} color="bg-primary" />
                    <div className="font-bold text-xs flex justify-between">
                        <span>Total</span>
                        <span>{formatCurrency(fundsReceived.totalCredits)}</span>
                    </div>
                     <div className="w-full bg-primary h-2.5 rounded-full mt-1"></div>
                </div>

                {/* Funds Used Graph */}
                <div className="space-y-2">
                    <div className="flex justify-between font-bold text-xs">
                        <h3>Total funds used/debits</h3>
                        <span className="text-primary">{formatCurrency(fundsUsed.totalDebits)}</span>
                    </div>
                     <Bar label="Account payments" value={fundsUsed.accountPayments} total={fundsUsed.totalDebits} color="bg-primary" />
                     <Bar label="Electronic transfers" value={fundsUsed.electronicTransfers} total={fundsUsed.totalDebits} color="bg-primary" />
                     <Bar label="Total charges and fees" value={fundsUsed.totalChargesAndFees} total={fundsUsed.totalDebits} color="bg-primary" />
                     <Bar label="Other debits" value={fundsUsed.otherDebits} total={fundsUsed.totalDebits} color="bg-primary" />
                      <div className="font-bold text-xs flex justify-between">
                        <span>Total</span>
                        <span>{formatCurrency(fundsUsed.totalDebits)}</span>
                    </div>
                     <div className="w-full bg-primary h-2.5 rounded-full mt-1"></div>
                </div>
            </div>
        </div>
    );
}
