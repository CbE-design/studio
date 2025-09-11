
'use client';
import { ArrowLeft, UserPlus, Search } from 'lucide-react';

const RecipientsPage = ({ recipients, setCurrentView, onRecipientClick }) => {
  const groupedRecipients = [...recipients]
    .sort((a, b) => a.name.localeCompare(b.name))
    .reduce((acc, recipient) => {
      const firstLetter = (recipient.name && recipient.name[0]) ? recipient.name[0].toUpperCase() : '?';
      if (!acc[firstLetter]) acc[firstLetter] = [];
      acc[firstLetter].push(recipient);
      return acc;
    }, {});
  
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-white text-gray-800 p-4 flex justify-between items-center w-full shadow-md">
        <ArrowLeft size={24} className="cursor-pointer" onClick={() => setCurrentView('overview')} />
        <span className="text-lg font-semibold">Recipients</span>
        <UserPlus size={24} />
      </header>
      <div className="bg-white px-4 py-2 border-b">
        <div className="flex space-x-4 text-sm font-medium">
          <span className="text-primary border-b-2 border-primary pb-2">Local</span>
          <span className="text-gray-500">International</span>
          <span className="text-gray-500">Bank-approved</span>
        </div>
      </div>
      <div className="relative p-4 bg-gray-100">
        <Search size={16} className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-full" />
      </div>
      <main className="flex-1 overflow-y-auto bg-white flex pb-20">
        <div className="flex-1 px-4">
          {Object.keys(groupedRecipients).sort().map((letter) => (
            <div key={letter} id={letter} className="mb-4">
              <h3 className="text-sm font-bold text-gray-500 mb-2 pt-2">{letter}</h3>
              {groupedRecipients[letter].map((recipient) => (
                <div 
                  key={recipient.id} 
                  className="flex flex-col p-4 border-b cursor-pointer"
                  onClick={() => onRecipientClick(recipient)}
                >
                  <p className="text-sm font-semibold">{recipient.name}</p>
                  <p className="text-xs text-gray-500">{recipient.bank} - {recipient.accountNumber}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last Paid: {recipient.lastPaid ? new Date(recipient.lastPaid.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col p-2 bg-gray-50 text-xs font-medium text-primary space-y-1">
          {alphabet.map((letter) => (
            <a key={letter} href={`#${letter}`} className="p-1 hover:bg-gray-200 rounded">{letter}</a>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RecipientsPage;
