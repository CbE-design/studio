'use client';
import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import Image from 'next/image';
import { MessageSquare, Menu, LayoutGrid, Lock, QrCode, Wallet, FileText } from 'lucide-react';

const LoginPage = ({ setCurrentView }) => {
  const [pin, setPin] = useState(['', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === '') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      // Move to next input if a digit is entered
      if (value !== '' && index < 4) {
        inputRefs.current[index + 1]?.focus();
      }

      // If all pins are filled, log in
      if (newPin.every(p => p !== '')) {
        handleLogin();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = () => {
    // Simple check, in a real app this would be a proper validation
    if (pin.join('').length === 5) {
      setCurrentView('overview');
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
              onClick={item.primary ? handleLogin : () => {}}
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
        <Image
          src="https://i.ibb.co/dKq1gT7/nedbank-logo.png"
          alt="Company Logo"
          width={24}
          height={24}
        />
        <div className="flex items-center space-x-4">
          <MessageSquare size={24} className="text-gray-600" />
          <Menu size={24} className="text-gray-600" />
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <h1 className="text-3xl text-gray-800">Welcome back.</h1>
        <p className="mt-8 mb-2 text-sm font-medium text-gray-600">App PIN</p>
        <div className="flex justify-between items-center space-x-2">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="password"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-12 h-2 bg-gray-300 rounded-full text-center focus:outline-none focus:ring-2 focus:ring-[#00703C] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ caretColor: 'transparent', fontSize: '2rem' }}
            />
          ))}
        </div>
        <a href="#" className="block mt-6 text-sm font-semibold text-[#00703C]">
          Or use your Nedbank ID password &rarr;
        </a>
      </main>

      <LoginFooter />
    </div>
  );
};

export default LoginPage;
