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
    if (newPin.join('').length === length) {
        onComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-between gap-2">
      {pin.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="tel" // Use tel for numeric keyboard on mobile
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={cn(
            'w-12 h-1 text-center bg-transparent border-b-2 focus:outline-none focus:border-primary transition-colors',
            digit ? 'border-primary' : 'border-gray-300'
          )}
        />
      ))}
    </div>
  );
}
