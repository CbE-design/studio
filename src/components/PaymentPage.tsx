'use client';
import { useMemo } from 'react';
import { ArrowLeft, MessageSquare, ChevronRight, Search } from 'lucide-react';

const PaymentPage = ({ paymentDetails, setPaymentDetails, handlePaymentSubmit, setCurrentView, showBankModal, setShowBankModal, bankSearchQuery, setBankSearchQuery }) => {
  const allBanks = [ 'NEDBANK', 'ABSA BANK', 'CAPITEC BANK', 'FNB SOUTH AFRICA', 'STANDARD BANK SOUTH AFRICA', 'AFRICAN BANK', 'ALBARAKA BANK', 'BANK ZERO', 'BIDVEST BANK', 'BNP PARIBAS', 'CITIBANK', 'DISCOVERY BANK', 'FinBond Mutual Bank', 'FINBOND MUTUAL EPE DIVISION', 'FIRST NATIONAL BANK', 'GRINDROD BANK', 'GROBANK LTD', 'HABIB OVERSEAS BANK LIMITED', 'HBZ BANK LIMITED', 'HSBC BANK', 'INVESTEC BANK LIMITED', 'ITHALA(ABSA)', 'JP MORGAN CHASE', 'MERCANTILE BANK', 'NEDBANK-PEOPLES MORTGAGE LTD', 'NEDBANK (BOND ACCOUNTS)', 'NEDBANK INCORP. FBC', 'NEDBANK LESOTHO LIMITED', 'NEDBANK LTD INCORP. BOE BANK', 'NEDBANK LTD INCORP. PEP BANK', 'NEDBANK NAMIBIA' ];
  const filteredBanks = useMemo(() => allBanks.filter(bank => bank.toLowerCase().includes(bankSearchQuery.toLowerCase())), [bankSearchQuery, allBanks]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-white text-gray-800 p-4 flex justify-between items-center w-full shadow-md">
        <div className="flex items-center space-x-4">
          <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('transactLanding')} />
          <span className="text-lg font-semibold">Pay</span>
        </div>
        <MessageSquare size={24} />
      </header>
      <main className="flex-1 overflow-y-auto p-4 bg-gray-100 pb-20">
        <div className="p-4 bg-white shadow-md rounded-xl">
          <h2 className="text-lg font-semibold mb-2">Payment Details</h2>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <label className="block"><span className="text-gray-700 text-sm">Recipient</span><input type="text" value={paymentDetails.recipient} onChange={(e) => setPaymentDetails({ ...paymentDetails, recipient: e.target.value })} className="w-full mt-1 p-3 border rounded-xl" placeholder="Enter name and surname" required /></label>
            <label className="block"><span className="text-gray-700 text-sm">Bank name</span><div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl cursor-pointer mt-1" onClick={() => setShowBankModal(true)}><p className="font-medium">{paymentDetails.bankName}</p><ChevronRight size={20} /></div></label>
            <label className="block"><span className="text-gray-700 text-sm">Account number</span><input type="text" value={paymentDetails.accountNumber} onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })} className="w-full mt-1 p-3 border rounded-xl" placeholder="e.g. 123456789" required /></label>
            <label className="block"><span className="text-gray-700 text-sm">From which account?</span>
              <div className="mt-1">
                <label className="inline-flex items-center mr-6"><input type="radio" name="fromAccount" value="current" checked={paymentDetails.fromAccount === 'current'} onChange={(e) => setPaymentDetails({ ...paymentDetails, fromAccount: e.target.value })} className="form-radio text-primary" /><span className="ml-2 text-sm">Savvy Bundle</span></label>
                <label className="inline-flex items-center"><input type="radio" name="fromAccount" value="second" checked={paymentDetails.fromAccount === 'second'} onChange={(e) => setPaymentDetails({ ...paymentDetails, fromAccount: e.target.value })} className="form-radio text-primary" /><span className="ml-2 text-sm">Platinum Cheque</span></label>
                <label className="inline-flex items-center"><input type="radio" name="fromAccount" value="third" checked={paymentDetails.fromAccount === 'third'} onChange={(e) => setPaymentDetails({ ...paymentDetails, fromAccount: e.target.value })} className="form-radio text-primary" /><span className="ml-2 text-sm">Platinum Cheque</span></label>
              </div>
            </label>
            <label className="block"><span className="text-gray-700 text-sm">Amount (R)</span><input type="number" step="0.01" min="0.01" value={paymentDetails.amount} onChange={(e) => setPaymentDetails({ ...paymentDetails, amount: e.target.value })} className="w-full mt-1 p-3 border rounded-xl" placeholder="e.g. 100.00" required /></label>
            <label className="block"><span className="text-gray-700 text-sm">Your reference</span><input type="text" value={paymentDetails.yourReference} onChange={(e) => setPaymentDetails({ ...paymentDetails, yourReference: e.target.value })} className="w-full mt-1 p-3 border rounded-xl" placeholder="e.g. Monthly groceries" /></label>
            <label className="block"><span className="text-gray-700 text-sm">Recipient's reference</span><input type="text" value={paymentDetails.recipientsReference} onChange={(e) => setPaymentDetails({ ...paymentDetails, recipientsReference: e.target.value })} className="w-full mt-1 p-3 border rounded-xl" placeholder="e.g. Invoice number" /></label>
            <label className="block"><span className="text-gray-700 text-sm">Recipient's phone number (optional)</span><input type="tel" value={paymentDetails.recipientPhone} onChange={(e) => setPaymentDetails({ ...paymentDetails, recipientPhone: e.target.value })} className="w-full mt-1 p-3 border rounded-xl" placeholder="e.g. 0821234567" /></label>
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center"><input type="checkbox" id="sendSmsToggle" className="h-4 w-4 rounded" checked={paymentDetails.sendSms} onChange={(e) => setPaymentDetails({ ...paymentDetails, sendSms: e.target.checked })} /><label htmlFor="sendSmsToggle" className="ml-2 text-sm">Send SMS notification</label></div>
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold mt-4">Pay Now</button>
          </form>
        </div>
      </main>
      {showBankModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm flex flex-col h-[80vh]">
            <h3 className="text-lg font-bold mb-4">Select a Bank</h3>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search bank" value={bankSearchQuery} onChange={(e) => setBankSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl"/>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredBanks.map((bank) => (
                <button
                  key={bank}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-100"
                  onClick={() => {
                    setPaymentDetails({ ...paymentDetails, bankName: bank });
                    setShowBankModal(false);
                    setBankSearchQuery('');
                  }}
                >
                  {bank}
                </button>
              ))}
            </div>
            <button className="mt-4 w-full text-center py-2 text-gray-500" onClick={() => setShowBankModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
