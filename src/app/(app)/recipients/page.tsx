
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { beneficiaries as allBeneficiaries } from '@/app/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

const tabs = ['Local', 'International', 'Bank-approved'];

const alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function RecipientsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Local');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBeneficiaries = useMemo(() => {
    if (!searchTerm) {
      return allBeneficiaries;
    }
    return allBeneficiaries.filter(ben =>
      ben.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const groupedBeneficiaries = useMemo(() => {
    return filteredBeneficiaries.reduce((acc, ben) => {
      const firstLetter = ben.name.charAt(0).toUpperCase();
      const group = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(ben);
      return acc;
    }, {} as Record<string, typeof allBeneficiaries>);
  }, [filteredBeneficiaries]);

  const sortedGroups = Object.keys(groupedBeneficiaries).sort((a, b) => {
    if (a === '#') return -1;
    if (b === '#') return 1;
    return a.localeCompare(b);
  });


  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white text-gray-800 p-4 flex items-center justify-between shadow-sm sticky top-0 z-20 border-b">
        <h1 className="text-xl font-bold">Recipients</h1>
        <Button variant="ghost" size="icon">
          <UserPlus />
        </Button>
      </header>

      <div className="border-b sticky top-[73px] z-20 bg-white">
        <div className="flex justify-around">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "py-3 w-full text-center text-sm font-medium",
                activeTab === tab
                  ? "text-[#009C6D] border-b-2 border-[#009C6D]"
                  : "text-gray-500"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
       <div className="p-4 bg-white sticky top-[125px] z-20 border-b">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search" 
                className="bg-gray-100 pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      <main className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto">
            <div className="px-4">
              {sortedGroups.map(group => (
                <div key={group}>
                  <h2 id={group} className="bg-gray-100 text-gray-600 font-bold p-2 my-2 -mx-4 px-4 sticky top-[197px] z-10">{group}</h2>
                  {groupedBeneficiaries[group].map(ben => (
                    <Link href={`/recipients/${ben.id}`} key={ben.id} className="block hover:bg-gray-50">
                        <div className="py-3 border-b">
                        <p className="font-semibold">{ben.name}</p>
                        <p className="text-sm text-gray-500">
                            {ben.bank ? `${ben.bank} - ${ben.accountNumber}` : ben.accountNumber}
                        </p>
                        </div>
                    </Link>
                  ))}
                </div>
              ))}
              {filteredBeneficiaries.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  <p>No recipients found.</p>
                </div>
              )}
            </div>
        </div>
        <ScrollArea className="h-full">
            <div className="flex flex-col items-center justify-center h-full px-2 text-xs text-gray-500 font-medium">
                {alphabet.map(letter => (
                    <a key={letter} href={`#${letter}`} className="py-0.5 hover:text-[#009C6D]" onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById(letter);
                      if (element) {
                        element.scrollIntoView();
                      }
                    }}>
                        {letter}
                    </a>
                ))}
            </div>
        </ScrollArea>
      </main>
    </div>
  );
}
