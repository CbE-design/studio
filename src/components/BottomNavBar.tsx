'use client';
import { CreditCard, Plus, User, MoreHorizontal, Home } from 'lucide-react';

const BottomNavBar = ({ activeTab, onTabClick }) => {
  const navItems = [
    { 
      label: 'Overview', 
      icon: <Home size={24} />,
      view: 'overview' 
    },
    { label: 'Cards', icon: <CreditCard size={24} />, view: 'cards' },
    { label: 'Transact', icon: <Plus size={30} />, view: 'transactLanding' },
    { label: 'Recipients', icon: <User size={24} />, view: 'recipients' },
    { label: 'More', icon: <MoreHorizontal size={24} />, view: 'more' },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="h-16 flex items-center justify-around text-gray-500 max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onTabClick(item.label, item.view)}
            className={`flex flex-col items-center justify-center h-full w-1/5 transition-colors duration-200 ${
              activeTab === item.label
                ? 'text-primary font-bold'
                : 'text-gray-500 font-normal'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </footer>
  );
};

export default BottomNavBar;
