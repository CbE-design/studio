'use client';
import React from 'react';
import { MessageSquare, Menu, LayoutGrid, Lock, QrCode, Wallet, FileText, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const LoginPage = ({ setCurrentView }) => {
  const [pin, setPin] = React.useState(['', '', '', '', '']);
  const [activeFooterTab, setActiveFooterTab] = React.useState('Login');
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleLogin = () => {
    if (pin.join('').length === 5) {
      setCurrentView('overview');
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === '') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      if (value !== '' && index < 4) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if all PIN fields are filled and trigger login
      if (newPin.every(p => p !== '')) {
        // Use a timeout to allow the final digit to render before navigating
        setTimeout(() => setCurrentView('overview'), 100);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleFooterClick = (label: string) => {
    setActiveFooterTab(label);
    if (label === 'Login') {
      handleLogin();
    } else {
      console.log(`${label} button clicked`);
      alert(`${label} is not yet implemented.`);
    }
  };

  const LoginFooter = () => {
    const navItems = [
      { label: 'Latest', icon: <LayoutGrid size={24} /> },
      { label: 'Login', icon: <Lock size={24} /> },
      { label: 'Scan QR', icon: <QrCode size={24} /> },
      { label: 'Balance', icon: <Wallet size={24} /> },
      { label: 'Applications', icon: <FileText size={24} /> },
    ];

    return (
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="h-16 flex items-center justify-around text-gray-500 max-w-lg mx-auto">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleFooterClick(item.label)}
              className={`flex flex-col items-center justify-center h-full w-1/5 transition-colors duration-200 ${
                activeFooterTab === item.label ? 'text-primary font-bold' : 'text-gray-500 font-normal'
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

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      <header className="p-4 flex justify-between items-center w-full flex-shrink-0">
        <Image
            src="https://firebasestorage.googleapis.com/v0/b/van-schalkwyk-trust-mobile.firebasestorage.app/o/NED.JO.png?alt=media&token=4070ec81-1e57-45d8-93e4-9977f97229c6"
            alt="Nedbank Logo"
            width={32}
            height={32}
          />
        <div className="flex items-center space-x-4">
          <MessageSquare size={24} className="text-primary" />
          <Menu size={24} className="text-primary" />
        </div>
      </header>

      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <h1 className="text-3xl font-normal text-gray-800 mb-8">Welcome back.</h1>
        
        <div className="mb-10">
            <p className="mb-4 text-sm font-medium text-gray-600">App PIN</p>
            <div className="flex justify-center items-center space-x-2">
            {pin.map((digit, index) => (
                <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-12 bg-transparent text-center text-2xl font-semibold border-b-2 border-gray-300 focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ caretColor: 'transparent' }}
                />
            ))}
            </div>
        </div>

        <div className="text-center mb-8">
            <a href="#" className="text-primary font-semibold text-lg inline-flex items-center">
                Or use your Nedbank ID password <ArrowRight size={20} className="ml-2" />
            </a>
        </div>

        <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 flex items-center">
                <div className="bg-white rounded-lg mr-4 h-14 w-14 overflow-hidden">
                    <Image
                        src="https://firebasestorage.googleapis.com/v0/b/van-schalkwyk-trust-mobile.firebasestorage.app/o/7daee036639379.57235d3dd1f02.jpg?alt=media&token=4dd801c5-bb8e-46cd-b2b1-c19539a91ec8"
                        alt="Award Logo"
                        width={56}
                        height={56}
                        className="object-center w-full h-full"
                    />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">Voted #1 retail bank 2024</h3>
                    <p className="text-sm text-gray-600">2024 World Economic Magazine Awards - Best Retail Bank in South Africa</p>
                </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 flex items-center">
                    <div className="bg-white rounded-lg mr-4 h-14 w-14 overflow-hidden">
                         <Image
                            src="https://firebasestorage.googleapis.com/v0/b/van-schalkwyk-trust-mobile.firebasestorage.app/o/7daee036639379.57235d3dd1f02.jpg?alt=media&token=4dd801c5-bb8e-46cd-b2b1-c19539a91ec8"
                            alt="Award Logo"
                            width={56}
                            height={56}
                            className="object-center w-full h-full"
                        />
                    </div>
                <div>
                    <h3 className="font-bold text-gray-800">Customer Obsessed Enterprise Award</h3>
                    <p className="text-sm text-gray-600">2024 Forrester Award winner</p>
                </div>
            </div>
        </div>

      </main>

      <LoginFooter />
    </div>
  );
};

export default LoginPage;
