
import {
  Bell,
  ChevronRight,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
// import { Announcements } from '@/components/announcements';
import { db } from '@/app/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { Account } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/data';

// Custom SVG Icons
const OffersIcon = () => (
    <Image 
        src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2FScreenshot_2025-09-23-09-23-02-88_ccee45d3a323cb0330d71aa2e13568e6~2.jpg?alt=media&token=bb656f40-8f78-4431-9f5e-49e720f620e0"
        alt="Offers for you icon"
        width={40}
        height={40}
        className="h-10 w-10"
    />
);
const ApplicationsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M16 2H8C4.69 2 2 4.69 2 8V16C2 19.31 4.69 22 8 22H16C19.31 22 22 19.31 22 16V8C22 4.69 19.31 2 16 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.87 8.5C12.87 9.98 11.75 11.1 10.27 11.1C8.79 11.1 7.67 9.98 7.67 8.5C7.67 7.02 8.79 5.9 10.27 5.9C11.75 5.9 12.87 7.02 12.87 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.57 14.63H17.5V13.37C17.5 11.83 16.42 10.96 15 10.96H12.87C11.45 10.96 10.37 11.83 10.37 13.37V14.63" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 14H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 17H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const InsureIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M12 21C12.55 21 13 20.55 13 20V19C13 18.45 12.55 18 12 18C11.45 18 11 18.45 11 19V20C11 20.55 11.45 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.66 12.44C21.41 11.02 20.52 9.78997 19.21 9.01997C17.9 8.24997 16.28 7.99997 14.77 8.32997C13.26 8.65997 11.95 9.54003 11.07 10.79C10.19 12.04 9.81003 13.57 10.02 15.08C10.23 16.59 11.02 17.96 12.24 18.88C13.46 19.8 15.01 20.2 16.54 20C18.07 19.8 19.45 19 20.46 17.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.81 8.98999C17.82 7.15999 17.01 4.88999 15.18 3.87999C13.35 2.86999 11.08 3.67999 10.07 5.50999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12.44C3.82 9.35 6.54 7.23 9.71 7.23C9.97 7.23 10.23 7.25 10.48 7.29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const NedbankConnectIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M17 2H7C4 2 2 4 2 7V17C2 20 4 22 7 22H17C20 22 22 20 22 17V7C22 4 20 2 17 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.97 12.29H8.57001C8.24001 12.29 7.97001 12.56 7.97001 12.89V16.29C7.97001 16.62 8.24001 16.89 8.57001 16.89H11.97C12.3 16.89 12.57 16.62 12.57 16.29V12.89C12.57 12.56 12.3 12.29 11.97 12.29Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.57 14.59L13.97 13.19C14.26 12.9 14.26 12.42 13.97 12.13L12.57 10.73" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 8.5H15.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const DiscsAndFinesIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M15 5H9C6.5 5 6 6.5 6 9V12C6 14.5 6.5 16 9 16H15C17.5 16 18 14.5 18 12V9C18 6.5 17.5 5 15 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 10.5H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 10.5H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.5 19.5C9.32843 19.5 10 18.8284 10 18C10 17.1716 9.32843 16.5 8.5 16.5C7.67157 16.5 7 17.1716 7 18C7 18.8284 7.67157 19.5 8.5 19.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.5 19.5C16.3284 19.5 17 18.8284 17 18C17 17.1716 16.3284 16.5 15.5 16.5C14.6716 16.5 14 17.1716 14 18C14 18.8284 14.6716 19.5 15.5 19.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const ShopIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M2 3H4.37C5.26 3 6.01 3.58 6.27 4.44L8.74 13.54C8.93 14.24 9.54 14.73 10.27 14.73H18.44C19.18 14.73 19.81 14.21 20.03 13.49L21.78 7.49C22.08 6.48 21.28 5.52 20.24 5.52H6.83" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.6899 17.81C18.6899 18.51 18.1299 19.07 17.4299 19.07C16.7299 19.07 16.1699 18.51 16.1699 17.81C16.1699 17.11 16.7299 16.55 17.4299 16.55C18.1299 16.55 18.6899 17.11 18.6899 17.81Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.12 17.81C10.12 18.51 9.56 19.07 8.86 19.07C8.16 19.07 7.6 18.51 7.6 17.81C7.6 17.11 8.16 16.55 8.86 16.55C9.56 16.55 10.12 17.11 10.12 17.81Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PayShapIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M15.5801 5.34C15.5801 4.79 15.1401 4.35 14.5901 4.35C14.0401 4.35 13.6001 4.79 13.6001 5.34C13.6001 5.89 14.0401 6.33 14.5901 6.33C15.1401 6.33 15.5801 5.89 15.5801 5.34Z" fill="currentColor"/>
    <path d="M11.9999 9.02002C11.9999 8.47002 11.5599 8.03002 11.0099 8.03002C10.4599 8.03002 10.0199 8.47002 10.0199 9.02002C10.0199 9.57002 10.4599 10.01 11.0099 10.01C11.5599 10.01 11.9999 9.57002 11.9999 9.02002Z" fill="currentColor"/>
    <path d="M11.9999 5.34C11.9999 4.79 11.5599 4.35 11.0099 4.35C10.4599 4.35 10.0199 4.79 10.0199 5.34C10.0199 5.89 10.4599 6.33 11.0099 6.33C11.5599 6.33 11.9999 5.89 11.9999 5.34Z" fill="currentColor"/>
    <path d="M8.42 12.7C8.42 12.15 7.98 11.71 7.43 11.71C6.88 11.71 6.44 12.15 6.44 12.7C6.44 13.25 6.88 13.69 7.43 13.69C7.98 13.69 8.42 13.25 8.42 12.7Z" fill="currentColor"/>
    <path d="M8.42 9.02002C8.42 8.47002 7.98 8.03002 7.43 8.03002C6.88 8.03002 6.44 8.47002 6.44 9.02002C6.44 9.57002 6.88 10.01 7.43 10.01C7.98 10.01 8.42 9.57002 8.42 9.02002Z" fill="currentColor"/>
    <path d="M15.5801 9.02002C15.5801 8.47002 15.1401 8.03002 14.5901 8.03002C14.0401 8.03002 13.6001 8.47002 13.6001 9.02002C13.6001 9.57002 14.0401 10.01 14.5901 10.01C15.1401 10.01 15.5801 9.57002 15.5801 9.02002Z" fill="currentColor"/>
    <path d="M19.1601 12.7C19.1601 12.15 18.7201 11.71 18.1701 11.71C17.6201 11.71 17.1801 12.15 17.1801 12.7C17.1801 13.25 17.6201 13.69 18.1701 13.69C18.7201 13.69 19.1601 13.25 19.1601 12.7Z" fill="currentColor"/>
    <path d="M19.1601 16.38C19.1601 15.83 18.7201 15.39 18.1701 15.39C17.6201 15.39 17.1801 15.83 17.1801 16.38C17.1801 16.93 17.6201 17.37 18.1701 17.37C18.7201 17.37 19.1601 16.93 19.1601 16.38Z" fill="currentColor"/>
    <path d="M15.5801 16.38C15.5801 15.83 15.1401 15.39 14.5901 15.39C14.0401 15.39 13.6001 15.83 13.6001 16.38C13.6001 16.93 14.0401 17.37 14.5901 17.37C15.1401 17.37 15.5801 16.93 15.5801 16.38Z" fill="currentColor"/>
  </svg>
);
const QuickPayIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M22 13V15C22 18.87 18.87 22 15 22H9C5.13 22 2 18.87 2 15V9C2 5.13 5.13 2 9 2H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 6V4C22 2.9 21.1 2 20 2H18C16.9 2 16 2.9 16 4V6C16 7.1 16.9 8 18 8H20C21.1 8 22 7.1 22 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 15C18.5 15.83 17.83 16.5 17 16.5H12.5C12.22 16.5 12 16.28 12 16V13C12 12.72 12.22 12.5 12.5 12.5H17C17.83 12.5 18.5 13.17 18.5 14C18.5 14.83 17.83 15.5 17 15.5H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.5 12.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 13.75H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 9.75H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const GetCashIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M6 10V18C6 20.21 7.79 22 10 22H14C16.21 22 18 20.21 18 18V10C18 7.79 16.21 6 14 6H10C7.79 6 6 7.79 6 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 10.5V12.5C10 13.6 10.9 14.5 12 14.5C13.1 14.5 14 13.6 14 12.5V10.5C14 9.4 13.1 8.5 12 8.5C10.9 8.5 10 9.4 10 10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.75 2H13.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const HomeLoansIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M22 11V17C22 20 20 22 17 22H7C4 22 2 20 2 17V11C2 10.4 2.4 10 3 10H21C21.6 10 22 10.4 22 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 10V6C20 3.79 18.21 2 16 2H8C5.79 2 4 3.79 4 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 15.5H9C8.45 15.5 8 15.05 8 14.5V13.5C8 12.95 8.45 12.5 9 12.5H15C15.55 12.5 16 12.95 16 13.5V14.5C16 15.05 15.55 15.5 15 15.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 12.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 7H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 7H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const StatementsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary h-8 w-8">
    <path d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10H18C15 10 14 9 14 6V2L22 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 17H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);



const widgets = [
  { icon: OffersIcon, label: 'Offers for you', href: '#' },
  { icon: ApplicationsIcon, label: 'Applications', href: '#' },
  { icon: InsureIcon, label: 'Insure', count: 5, href: '#' },
  { icon: NedbankConnectIcon, label: 'Nedbank Connect', new: true, href: '#' },
  { icon: DiscsAndFinesIcon, label: 'Discs and fines', href: '#' },
  { icon: ShopIcon, label: 'Shop', href: '#' },
  { icon: PayShapIcon, label: 'PayShap', href: '#' },
  { icon: QuickPayIcon, label: 'Quick Pay', href: '#' },
  { icon: GetCashIcon, label: 'Get cash', href: '#' },
  { icon: HomeLoansIcon, label: 'Home loans', href: '#' },
  { icon: StatementsIcon, label: 'Statements and docs', href: '/documents' },
];

async function getAccounts(): Promise<Account[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "accounts"));
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Account',
        type: data.type || 'Cheque',
        accountNumber: data.accountNumber || 'N/A',
        balance: data.balance !== undefined ? data.balance : 0,
        currency: data.currency || 'ZAR',
      };
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

export default async function DashboardPage() {
  const accounts = await getAccounts();

  const slides = [
    {
      title: 'Accounts',
      content: (
        <div className="space-y-2">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <Link href={`/account/${account.id}`} key={account.id}>
                <div className="flex flex-row justify-between items-center py-2 border-b border-white/20 last:border-b-0 cursor-pointer">
                  <div>
                    <p className="text-sm">{account.name}</p>
                    <p className="text-lg font-bold">{formatCurrency(account.balance, account.currency)}</p>
                  </div>
                  <ChevronRight className="h-6 w-6" />
                </div>
              </Link>
            ))
          ) : (
             <div className="text-center py-4">
                <p className="text-sm">No accounts found.</p>
                <p className="text-xs text-white/80">Please add account data to your 'accounts' collection in Firestore.</p>
              </div>
          )}
        </div>
      ),
    },
    {
      title: 'Rewards',
      content: (
         <div className="space-y-2">
          <div className="flex flex-row justify-between items-center py-2">
            <div>
              <p className="text-sm">Greenbacks Rewards</p>
              <p className="text-lg font-bold">GB 0</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
        </div>
      ),
    },
    {
      title: 'International banking and travel',
      content: (
        <div className="space-y-4">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
            <div>
              <p className="text-xs">Incoming and outgoing payments</p>
              <p className="text-lg font-bold">International payments</p>
            </div>
            <Button variant="link" className="text-white font-bold">View</Button>
          </div>
          <div className="flex flex-row justify-between items-center py-2">
            <div>
              <p className="text-xs">Foreign Currency Accounts</p>
              <p className="text-lg font-bold">Your currencies</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
        </div>
      ),
    },
    {
      title: 'Savings & Investments',
      content: (
        <div className="space-y-4">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
            <div>
              <p className="text-xs">Tax certificates</p>
              <p className="text-lg font-bold">Tax certificates</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
          <div className="flex flex-row justify-between items-center py-2">
            <div>
              <p className="text-lg font-bold">Save & Invest</p>
            </div>
             <Button variant="link" className="font-bold text-yellow-400">Explore options</Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Insurance',
      content: (
        <div className="space-y-4">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
            <div>
              <p className="text-xs">Insurance</p>
              <p className="text-lg font-bold">My policies and applications</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
          <div className="flex flex-row justify-between items-center py-2">
            <div>
              <p className="text-xs">Insurance</p>
              <p className="text-lg font-bold">New policy</p>
            </div>
             <Button variant="link" className="font-bold text-yellow-400">Get cover</Button>
          </div>
        </div>
      ),
    },
  ];


  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 space-y-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
              alt="Nedbank Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-bold text-xl">Spot Buy And Sell</span>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="h-6 w-6" />
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-primary text-primary-foreground p-4">
            <Carousel>
                <CarouselContent>
                {slides.map((slide, index) => (
                    <CarouselItem key={index}>
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-xl font-bold">{slide.title}</h1>
                        <Eye className="h-6 w-6" />
                    </div>
                    {slide.content}
                    </CarouselItem>
                ))}
                </CarouselContent>
            </Carousel>
        </div>
        <div className="p-4">
            {/* <Announcements /> */}
            <Card className="my-6 shadow-md border rounded-lg overflow-hidden">
            <CardContent className="p-0">
                <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/Screenshot_2025-09-21-05-29-50-22_ccee45d3a323cb0330d71aa2e13568e6~2.jpg?alt=media&token=7708ee45-0a82-4711-aab5-6818776094f3"
                alt="Nedbank Connect Banner"
                data-ai-hint="promotional banner"
                width={600}
                height={100}
                className="w-full"
                />
            </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4 text-gray-800">My widgets</h2>
            <div className="grid grid-cols-4 gap-4 text-center">
            {widgets.map((widget, index) => (
              <Link href={widget.href} key={index}>
                <div className="flex flex-col items-center gap-1 relative cursor-pointer">
                <div className="p-3 rounded-lg shadow-sm border bg-white">
                    <widget.icon />
                </div>
                <p className="text-xs text-gray-600">{widget.label}</p>
                {widget.new && (
                    <div className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-semibold text-white bg-green-500 rounded-md">
                    New
                    </div>
                )}
                {widget.count && (
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 flex items-center justify-center h-5 w-5 text-xs font-semibold text-white bg-primary rounded-full">
                    {widget.count}
                    </div>
                )}
                </div>
              </Link>
            ))}
            </div>
        </div>
      </main>
    </div>
  );
}
