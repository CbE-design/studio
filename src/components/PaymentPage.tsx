'use client';
import { useMemo } from 'react';
import { ArrowLeft, ChevronRight, Search, User, Landmark, Smartphone, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const BankIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7V9H22V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M5 10V19H7V10H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M11 10V19H13V10H11Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M17 10V19H19V10H17Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M2 22H22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
);


const PaymentPage = ({ paymentDetails, setPaymentDetails, handlePaymentSubmit, setCurrentView, showBankModal, setShowBankModal, bankSearchQuery, setBankSearchQuery }) => {
  const allBanks = [ 'NEDBANK', 'ABSA BANK', 'CAPITEC BANK', 'FNB SOUTH AFRICA', 'STANDARD BANK SOUTH AFRICA', 'AFRICAN BANK', 'ALBARAKA BANK', 'BANK ZERO', 'BIDVEST BANK', 'BNP PARIBAS', 'CITIBANK', 'DISCOVERY BANK', 'FinBond Mutual Bank', 'FINBOND MUTUAL EPE DIVISION', 'FIRST NATIONAL BANK', 'GRINDROD BANK', 'GROBANK LTD', 'HABIB OVERSEAS BANK LIMITED', 'HBZ BANK LIMITED', 'HSBC BANK', 'INVESTEC BANK LIMITED', 'ITHALA(ABSA)', 'JP MORGAN CHASE', 'MERCANTILE BANK', 'NEDBANK-PEOPLES MORTGAGE LTD', 'NEDBANK (BOND ACCOUNTS)', 'NEDBANK INCORP. FBC', 'NEDBANK LESOTHO LIMITED', 'NEDBANK LTD INCORP. BOE BANK', 'NEDBANK LTD INCORP. PEP BANK', 'NEDBANK NAMIBIA' ];
  const filteredBanks = useMemo(() => allBanks.filter(bank => bank.toLowerCase().includes(bankSearchQuery.toLowerCase())), [bankSearchQuery, allBanks]);
  const isFormValid = paymentDetails.recipient && paymentDetails.bankName !== 'Select bank' && paymentDetails.accountNumber;


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <header className="bg-primary text-primary-foreground p-4 flex items-center w-full flex-shrink-0">
        <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('transactLanding')} />
        <h1 className="text-2xl font-semibold ml-4">Whom would you like to pay?</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-32">
        <form onSubmit={handlePaymentSubmit}>
          <div className="p-4 bg-white min-h-[200px]">
            <label className="block">
              <span className="text-gray-500 text-sm">A new recipient</span>
              <input 
                type="text" 
                value={paymentDetails.recipient} 
                onChange={(e) => setPaymentDetails({ ...paymentDetails, recipient: e.target.value })} 
                className="w-full mt-1 p-3 border border-gray-300 rounded-md text-base" 
                placeholder="Enter name and surname" 
                required 
              />
            </label>
            <div className="space-y-2 mt-4">
                <Button variant="outline" className="w-full justify-start text-primary border-gray-300">
                    <User size={20} className="mr-3" /> Select from saved recipients
                </Button>
                <Button variant="outline" className="w-full justify-start text-primary border-gray-300">
                    <Landmark size={20} className="mr-3" /> Select from bank-approved recipients
                </Button>
                <Button variant="outline" className="w-full justify-start text-primary border-gray-300">
                    <Smartphone size={20} className="mr-3" /> Select from phone contacts
                </Button>
            </div>
          </div>

          <div className="py-6 bg-gray-100">
             <h2 className="px-4 text-gray-500 text-sm mb-2">How would you like to pay?</h2>
             <div className="px-4">
                <div className="bg-primary text-primary-foreground p-4 rounded-lg flex flex-col items-center justify-center w-40 h-24 mx-auto">
                    <BankIcon />
                    <span className="text-center text-sm mt-2">Pay to a bank account</span>
                </div>
             </div>
          </div>
          
          <div className="p-4 bg-white">
            <h2 className="text-gray-500 text-sm mb-2">To which account?</h2>
            <div className="space-y-4">
                <div>
                    <span className="text-gray-500 text-xs">Bank name</span>
                    <div className="flex justify-between items-center border border-gray-300 p-3 rounded-md cursor-pointer mt-1" onClick={() => setShowBankModal(true)}>
                        <p className="font-medium text-base">{paymentDetails.bankName}</p>
                        <ChevronRight size={20} className="text-gray-400" />
                    </div>
                </div>
                <div>
                    <span className="text-gray-500 text-xs">Account number</span>
                    <input type="text" value={paymentDetails.accountNumber} onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })} className="w-full mt-1 p-3 border border-gray-300 rounded-md text-base" required />
                </div>
            </div>
          </div>
          
          <div className="p-4 bg-white mt-2">
             <h2 className="text-gray-500 text-sm mb-2">Payment type?</h2>
             <div>
                <span className="text-gray-500 text-xs">Payment method</span>
                <div className="flex justify-between items-center border border-primary p-3 rounded-md cursor-pointer mt-1" onClick={() => setCurrentView('paymentType')}>
                    <p className="font-medium text-base">{paymentDetails.paymentMethod}</p>
                    <ChevronRight size={20} className="text-gray-400" />
                </div>
             </div>
          </div>
          
          <div className="p-4 bg-green-50 mt-4 mx-4 rounded-md flex items-start space-x-3">
             <Info size={20} className="text-green-700 mt-1" />
             <p className="text-sm text-green-800">
                 Before you click Next, please make sure that your recipient's account information is correct. Nedbank doesn't validate account numbers or refund payments to a wrong recipient.
             </p>
          </div>

        </form>
      </main>

       <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
              <label htmlFor="save-recipient" className="text-sm font-medium">Save recipient</label>
              <Switch 
                id="save-recipient" 
                checked={paymentDetails.saveRecipient}
                onCheckedChange={(checked) => setPaymentDetails({ ...paymentDetails, saveRecipient: checked })}
              />
          </div>
          <Button 
            onClick={handlePaymentSubmit} 
            disabled={!isFormValid}
            className="w-full text-lg py-6"
          >
            Next
          </Button>
      </footer>

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
