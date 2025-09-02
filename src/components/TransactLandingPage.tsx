'use client';
import { Send, Repeat, FileText, Landmark, Globe, ChevronRight, ArrowLeft, Phone } from 'lucide-react';

const TransactLandingPage = ({ setCurrentView }) => {
  const paymentOptions = [
    { icon: <Send size={24} className="text-[#00703C]" />, title: 'Single payment', description: 'Make a once-off payment or pay a saved recipient.', onClick: () => setCurrentView('payment') },
    { icon: <Phone size={24} className="text-[#00703C]" />, title: 'Send money', description: 'Send money to anyone with a South African cellphone number.' },
    { icon: <Repeat size={24} className="text-[#00703C]" />, title: 'PayShap Request', description: 'Request and make payments with PayShap.' },
    { icon: <FileText size={24} className="text-[#00703C]" />, title: 'Bill payments', description: 'Add and manage your monthly bills. Earn great rewards.' },
    { icon: <Landmark size={24} className="text-[#00703C]" />, title: 'Government payment', description: 'Complete and view government payments.' },
    { icon: <Globe size={24} className="text-[#00703C]" />, title: 'International payments', description: 'View, receive and make payments, or send money internationally.' },
  ];

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white text-gray-800 p-4 flex items-center w-full shadow-md">
        <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('overview')} />
        <h1 className="text-xl font-semibold ml-4">What would you like to do?</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        {paymentOptions.map((option, index) => (
          <div key={index} onClick={option.onClick} className="flex items-center p-4 border-b cursor-pointer">
            <div className="p-2 bg-gray-100 rounded-full">{option.icon}</div>
            <div className="ml-4 flex-1">
              <p className="font-semibold">{option.title}</p>
              <p className="text-sm text-gray-500">{option.description}</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        ))}
      </main>
    </div>
  );
};

export default TransactLandingPage;
