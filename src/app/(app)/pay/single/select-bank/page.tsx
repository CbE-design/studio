
'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { banks as allBanks } from '@/app/lib/data';
import type { Bank } from '@/app/lib/definitions';

export default function SelectBankPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');

  const handleBankSelect = (bankName: string) => {
    // Preserve existing query params and add the selected bank
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('bank', bankName);
    router.push(`/pay/single?${newSearchParams.toString()}`);
  };
  
  const sortedBanks = useMemo(() => {
    return [...allBanks].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredBanks = useMemo(() => {
    if (!searchTerm) {
      return sortedBanks;
    }
    return sortedBanks.filter(bank =>
      bank.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, sortedBanks]);

  const popularBanks = useMemo(() => filteredBanks.filter(b => b.popular), [filteredBanks]);
  
  const groupedBanks = useMemo(() => {
    return filteredBanks
      .filter(b => !b.popular)
      .reduce((acc, bank) => {
        const firstLetter = bank.name.charAt(0).toUpperCase();
        const group = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(bank);
        return acc;
      }, {} as Record<string, Bank[]>);
  }, [filteredBanks]);

  const sortedGroups = Object.keys(groupedBanks).sort((a, b) => {
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-20">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Search</h1>
      </header>

      <div className="p-4 bg-white sticky top-[68px] z-20 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            placeholder="Search bank name" 
            className="bg-gray-100 pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="px-4">
          {popularBanks.length > 0 && (
            <div>
              <h2 className="bg-gray-100 text-gray-600 font-bold p-2 my-2 -mx-4 px-4 sticky top-[140px] z-10">POPULAR</h2>
              {popularBanks.map(bank => (
                <div key={bank.name} onClick={() => handleBankSelect(bank.name)} className="block hover:bg-gray-50 cursor-pointer">
                  <div className="py-3 border-b">
                    <p className="font-semibold text-sm">{bank.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sortedGroups.map(group => (
            <div key={group}>
              <h2 className="bg-gray-100 text-gray-600 font-bold p-2 my-2 -mx-4 px-4 sticky top-[140px] z-10">{group}</h2>
              {groupedBanks[group].map(bank => (
                <div key={bank.name} onClick={() => handleBankSelect(bank.name)} className="block hover:bg-gray-50 cursor-pointer">
                  <div className="py-3 border-b">
                    <p className="font-semibold text-sm">{bank.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {filteredBanks.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>No banks found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
