
'use client';

import { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface PinInputProps {
  length: number;
  onComplete: (pin: string) => void;
}

export function PinInput({ length, onComplete }: PinInputProps) {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^[0-9]$/.test(value) && value !== '') return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Focus next input
    if (value !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // On complete
    const completedPin = newPin.join('');
    if (completedPin.length === length) {
        onComplete(completedPin);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };


  return (
    <div className="flex justify-between gap-4">
      {Array.from({ length }).map((_, index) => (
        <div key={index} className="relative w-10 h-12 flex items-center justify-center">
           <input
            ref={(el) => (inputRefs.current[index] = el)}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={pin[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={handleFocus}
            className={cn(
                'w-10 h-12 text-center text-2xl font-bold bg-transparent border-b-4 focus:outline-none transition-colors caret-transparent',
                pin[index] ? 'border-primary' : 'border-gray-300 dark:border-gray-600',
                'focus:border-primary'
              )}
            style={{ 
              WebkitTextSecurity: 'disc',
              MozTextSecurity: 'disc',
              textSecurity: 'disc',
            }}
          />
        </div>
      ))}
    </div>
  );
}
