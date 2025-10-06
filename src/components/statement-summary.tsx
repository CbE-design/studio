
'use client';

import type { Account, User } from '@/app/lib/definitions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format } from 'date-fns';
import Image from 'next/image';
import { FinancialGraph } from './financial-graph';

interface StatementSummaryProps {
    account: Account;
    user: User;
    openingBalance: number;
    closingBalance: number;
    totalCredits: number;
    totalDebits: number;
}

export function StatementSummaryPage({ account, user, openingBalance, closingBalance, totalCredits, totalDebits }: StatementSummaryProps) {
    const eConfirmLogo = PlaceHolderImages.find(img => img.id === 'statement-econfirm');
    const barcode = PlaceHolderImages.find(img => img.id === 'statement-barcode');
    const nLogo = { imageUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/images.png?alt=media&token=9c75c65e-fc09-4827-9a36-91caa0ae3ee5', imageHint: 'logo', description: 'N logo' };
    
    const formatCurrency = (val: number) => `R${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;

    // Placeholder data for graphs, since it's not in the main data model
    const graphData = {
        fundsReceived: { totalCredits: totalCredits, otherCredits: totalCredits },
        fundsUsed: { totalDebits: totalDebits, totalChargesAndFees: 0, otherDebits: totalDebits }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-gray-800 text-[8px] leading-tight">
            {/* Header */}
            <div className="grid grid-cols-2 gap-4 items-start mb-4">
                <div className="space-y-4">
                    {eConfirmLogo && <Image src={eConfirmLogo.imageUrl} alt={eConfirmLogo.description} data-ai-hint={eConfirmLogo.imageHint} width={80} height={40} />}
                    {barcode && <Image src={barcode.imageUrl} alt={barcode.description} data-ai-hint={barcode.imageHint} width={250} height={20} />}
                     <div className="text-[9px]">
                        <p>Mr</p>
                        <p className="font-bold">{(user.firstName + ' ' + user.lastName).toUpperCase()}</p>
                        <p className="font-bold">{account.name.toUpperCase()}</p>
                        <br />
                        <p>PO BOX 135</p>
                        <p>RIVONIA</p>
                        <p>JOHANNESBURG</p>
                        <p>2128</p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    {nLogo && <Image src={nLogo.imageUrl} alt={nLogo.description} data-ai-hint={nLogo.imageHint} width={50} height={26} />}
                    <div className="mt-8 text-gray-600">
                        <p>135 Rivonia Road, Sandown, 2196</p>
                        <p>P O Box 1144, Johannesburg, 2000, South Africa</p>
                         <div className="mt-4 text-left self-stretch">
                            <p>Bank VAT Reg No 4320116074</p>
                            <p>Lost cards 0800 110 929</p>
                            <p>Client services 0860 555 111</p>
                            <p className="text-primary font-bold">nedbank.co.za</p>
                            <hr className="my-1 border-gray-400" />
                            <p>Tax invoice</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Important Message */}
            <div className="bg-primary text-white p-3 my-4">
                <p className="font-bold text-sm">Important message</p>
                <p className="text-xs">From 28 February 2023, we will no longer send monthly investment statements by email or SMS. But don't worry - you can still view your statements on the Money app or Online Banking anytime. Visit www.nedbank.co.za/statement for more information.</p>
            </div>
            
            <p className="text-[7px] text-gray-500 mb-2">Please examine this statement soonest. If no error is reported within 30 days after receipt, the statement will be considered as being correct.</p>
            
            {/* Account Summary */}
            <div className="border border-gray-200">
                <div className="bg-primary text-white p-2">
                    <h2 className="font-bold text-sm">Account summary</h2>
                </div>
                <div className="bg-gray-100 p-2 grid grid-cols-2">
                    <p>Account type</p>
                    <p>Account number</p>
                </div>
                <div className="p-2 grid grid-cols-2 font-bold text-base">
                    <p>{account.name}</p>
                    <p>{account.accountNumber}</p>
                </div>
                <hr/>
                <div className="p-2 grid grid-cols-4 gap-y-1 text-xs">
                    <div>Statement date:</div>
                    <div>{format(new Date(), 'dd/MM/yyyy')}</div>
                    <div>Envelope:</div>
                    <div></div>
                    <div>Statement period:</div>
                    <div>{`${format(new Date(), 'dd/MM/yyyy')} - ${format(new Date(), 'dd/MM/yyyy')}`}</div>
                    <div>Total pages:</div>
                    <div>2</div>
                    <div>Statement frequency:</div>
                    <div>Monthly</div>
                    <div>Client VAT number:</div>
                    <div></div>
                </div>
            </div>

            {/* Bank Charges & Cashflow */}
            <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                    <h3 className="text-primary font-bold text-sm mb-1">Bank charges summary</h3>
                    <hr className="border-gray-200 mb-2"/>
                    <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <dt>Other charges</dt><dd className="text-right text-gray-600">{formatCurrency(0)}</dd>
                        <dt>Bank charge(s) (total)</dt><dd className="text-right text-gray-600">{formatCurrency(0)}</dd>
                        <dt>"VAT inclusive @</dt><dd className="text-right text-gray-600">15.000%</dd>
                        <dt>VAT calculated monthly</dt><dd></dd>
                    </dl>
                </div>
                <div>
                    <h3 className="text-primary font-bold text-sm mb-1">Cashflow</h3>
                    <hr className="border-gray-200 mb-2"/>
                     <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <dt>Opening balance</dt><dd className="text-right text-gray-600">{formatCurrency(openingBalance)}</dd>
                        <dt>Funds received/Credits</dt><dd className="text-right text-gray-600">{formatCurrency(totalCredits)}</dd>
                        <dt>Funds used/Debits</dt><dd className="text-right text-gray-600">{formatCurrency(totalDebits)}</dd>
                        <dt className="font-bold">Closing balance</dt><dd className="text-right font-bold text-gray-600">{formatCurrency(closingBalance)}</dd>
                        <dt>Annual credit interest rate</dt><dd className="text-right text-gray-600">0.000%</dd>
                    </dl>
                </div>
            </div>

            {/* Graphs placeholder area */}
            <FinancialGraph {...graphData} />
            
            {/* Footer */}
            <div className="mt-8 flex justify-between items-end">
                <div>
                    <p className="text-primary font-bold text-lg">see money differently</p>
                </div>
                <div className="text-[6px] text-gray-500 text-right max-w-xs">
                    <p>We subscribe to the Code of Banking Practice of The Banking Association South Africa and, for unresolved disputes, support resolution through the Ombudsman for Banking Services. Authorised financial services and registered credit provider (NCRCP16).</p>
                    <p>Nedbank Ltd Reg No 1951/000009/06.</p>
                </div>
                 <div className="text-right">
                    <p className="font-bold text-xs">Page 1 of 2</p>
                </div>
            </div>

        </div>
    );
}
