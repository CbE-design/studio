
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
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758622591390.jpg?alt=media&token=2f681462-7001-4654-9754-436e2c8f0ffe"
    alt="Offers for you icon"
    width={48}
    height={48}
    className="h-12 w-12"
  />
);
const ApplicationsIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758629149375.jpg?alt=media&token=485765e5-456f-412c-8da5-751ff5991dd5"
    alt="Applications icon"
    width={48}
    height={48}
    className="h-12 w-12"
  />
);
const InsureIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758630016360.jpg?alt=media&token=a946409a-39bd-47d1-ac07-9a00dca954cb"
    alt="Insure icon"
    width={48}
    height={48}
    className="h-12 w-12"
  />
);
const NedbankConnectIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758631700022.jpg?alt=media&token=148194a4-0b1a-4ea4-929e-956599069261"
    alt="Nedbank Connect icon"
    width={48}
    height={48}
    className="h-12 w-12"
  />
);
const DiscsAndFinesIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2FScreenshot_2025-09-23-09-23-02-88_ccee45d3a323cb0330d71aa2e13568e6~7.jpg?alt=media&token=e3f4b17f-c75c-4cf7-b95b-37e3783bfb11"
    alt="Discs and fines icon"
    width={48}
    height={48}
    className="h-12 w-12"
  />
);
const ShopIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758633570031.jpg?alt=media&token=b776f61f-926e-48ab-9f7c-9b18821c8b02"
    alt="Shop icon"
    width={48}
    height={48}
    className="h-12 w-12"
  />
);
const PayShapIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758635261879.jpg?alt=media&token=c6e6272c-58fc-4a13-bc26-12f5c77ceb7e"
    alt="PayShap icon"
    width={48}
    height={48}
    className="h-12 w-12"
  />
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
  { icon: InsureIcon, label: 'Insure', href: '#' },
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
