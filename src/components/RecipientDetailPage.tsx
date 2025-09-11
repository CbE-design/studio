
'use client';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BankIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7V9H22V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M5 10V19H7V10H5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M11 10V19H13V10H11Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M17 10V19H19V10H17Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M2 22H22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
);


const RecipientDetailPage = ({ recipient, setCurrentView, onPay }) => {
    if (!recipient) return null;

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            <header className="bg-white p-4 flex justify-between items-center w-full flex-shrink-0">
                <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('recipients')} />
                <button className="text-primary font-semibold">Edit</button>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="bg-white p-4 pb-0">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center">
                            <span className="text-3xl font-semibold text-gray-700">{getInitial(recipient.name)}</span>
                        </div>
                        <h1 className="text-2xl font-semibold">{recipient.name}</h1>
                    </div>
                    <div className="flex border-b">
                        <div className="py-3 px-4 text-primary border-b-2 border-primary font-semibold">Details</div>
                        <div className="py-3 px-4 text-gray-500">History</div>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    <div className="bg-white rounded-lg">
                        <h2 className="p-4 text-sm font-semibold text-gray-500 border-b">BANK ACCOUNT</h2>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs text-gray-500">Bank name</label>
                                <div className="flex items-center justify-between mt-1 border rounded-md p-3 bg-gray-50">
                                    <span>{recipient.bank.toUpperCase()}</span>
                                    <div className="flex items-center space-x-3">
                                        <BankIcon />
                                        <ChevronRight size={20} className="text-gray-400" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Account type</label>
                                <div className="flex items-center justify-between mt-1 border rounded-md p-3 bg-gray-50">
                                    <span>Current Account</span>
                                    <ChevronRight size={20} className="text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Account number</label>
                                <Input value={recipient.accountNumber} readOnly className="mt-1 bg-gray-50" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Your reference</label>
                                <Input placeholder="Eskom electricity" className="mt-1" />
                            </div>
                             <div>
                                <label className="text-xs text-gray-500">Recipient's reference</label>
                                <Input placeholder="E0812710809" className="mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg">
                        <h2 className="p-4 text-sm font-semibold text-gray-500 border-b">EMAIL ADDRESS</h2>
                        <div className="p-4">
                             <div>
                                <label className="text-xs text-gray-500">Email address</label>
                                <Input placeholder="mtshenna@telkom.co.za" className="mt-1" />
                            </div>
                        </div>
                    </div>
                </div>

            </main>
            <footer className="bg-white border-t p-4">
                <Button className="w-full text-lg py-6" onClick={() => onPay(recipient)}>Pay</Button>
            </footer>
        </div>
    );
};

export default RecipientDetailPage;
