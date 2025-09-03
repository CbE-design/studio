'use client';
import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { MessageSquare, Menu, LayoutGrid, Lock, QrCode, Wallet, FileText, ArrowRight, PlayCircle } from 'lucide-react';

const LoginPage = ({ setCurrentView }) => {
  const [pin, setPin] = useState(['', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === '') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      if (value !== '' && index < 4) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newPin.every(p => p !== '')) {
        handleLogin();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = () => {
    if (pin.join('').length === 5) {
      setCurrentView('overview');
    }
  };
  
  const handleFooterClick = (label: string) => {
    if (label === 'Login') {
      handleLogin();
    } else {
      console.log(`${label} button clicked`);
    }
  };

  const LoginFooter = () => {
    const navItems = [
      { label: 'Latest', icon: <LayoutGrid size={24} /> },
      { label: 'Login', icon: <Lock size={24} />, primary: true },
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
                item.primary ? 'text-[#00703C] font-bold' : 'text-gray-500 font-normal'
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
        <div className="h-8 w-8"></div>
        <div className="flex items-center space-x-4">
          <MessageSquare size={24} className="text-gray-600" />
          <Menu size={24} className="text-gray-600" />
        </div>
      </header>

      <main className="flex-1 px-6 py-8 overflow-y-auto">
        <h1 className="text-3xl font-light text-gray-800 mb-8">Welcome back.</h1>
        
        <div className="mb-10">
            <p className="mb-2 text-sm font-medium text-gray-600">App PIN</p>
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
                className="w-12 h-0.5 bg-gray-300 rounded-full text-center focus:outline-none focus:ring-2 focus:ring-[#00703C] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ caretColor: 'transparent', fontSize: '2rem' }}
                />
            ))}
            </div>
        </div>

        <div className="text-center mb-8">
            <a href="#" className="text-green-600 font-semibold text-lg inline-flex items-center">
                Or use your Nedbank ID password <ArrowRight size={20} className="ml-2" />
            </a>
        </div>

        <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 flex items-center">
                <div className="bg-green-800 rounded-lg p-3 mr-4">
                    <PlayCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">Voted #1 retail bank 2024</h3>
                    <p className="text-sm text-gray-600">2024 World Economic Magazine Awards - Best Retail Bank in South Africa</p>
                </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 flex items-center">
                    <div className="bg-green-800 rounded-lg p-3 mr-4">
                        <PlayCircle className="h-8 w-8 text-white" />
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
