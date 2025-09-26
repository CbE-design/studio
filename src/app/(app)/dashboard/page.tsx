
import {
  Bell,
  ChevronRight,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AccountsCarousel } from '@/components/accounts-carousel';
import { Accounts } from '@/components/accounts';

// Custom SVG Icons
const OffersIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758622591390.jpg?alt=media&token=2f681462-7001-4654-9754-436e2c8f0ffe"
    alt="Offers for you icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
);
const ApplicationsIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758629149375.jpg?alt=media&token=485765e5-456f-412c-8da5-751ff5991dd5"
    alt="Applications icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
);
const InsureIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758630016360.jpg?alt=media&token=a946409a-39bd-47d1-ac07-9a00dca954cb"
    alt="Insure icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
);
const NedbankConnectIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758631700022.jpg?alt=media&token=148194a4-0b1a-4ea4-929e-956599069261"
    alt="Nedbank Connect icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
);
const DiscsAndFinesIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2FScreenshot_2025-09-23-09-23-02-88_ccee45d3a323cb0330d71aa2e13568e6~7.jpg?alt=media&token=e3f4b17f-c75c-4cf7-b95b-37e3783bfb11"
    alt="Discs and fines icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
);
const ShopIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758633570031.jpg?alt=media&token=b776f61f-926e-48ab-9f7c-9b18821c8b02"
    alt="Shop icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
);
const PayShapIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758635261879.jpg?alt=media&token=c6e6272c-58fc-4a13-bc26-12f5c77ceb7e"
    alt="PayShap icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
);
const QuickPayIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758635889725.jpg?alt=media&token=7ac2249c-b95f-43b6-83e6-80a4fd291ab2"
    alt="Quick Pay icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
);
const GetCashIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758636434590.jpg?alt=media&token=9a2b5c0a-b399-4780-981a-3bd21e8d55e9"
    alt="Get cash icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
);
const StatementsIcon = () => (
  <Image
    src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/My%20Widget%20Buttons%2F1758804914043.jpg?alt=media&token=d6f57fac-922b-4aff-8a89-103273efe411"
    alt="Statements and docs icon"
    width={56}
    height={56}
    className="h-14 w-14"
  />
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
  { icon: StatementsIcon, label: 'Statements and docs', href: '/documents' },
];

export default function DashboardPage() {
  const slides = [
    {
      title: 'Accounts',
      content: <Accounts key="accounts" />,
    },
    {
      title: 'Rewards',
      content: (
         <div key="rewards" className="space-y-2">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20 last:border-b-0">
            <div>
              <p className="text-sm">Greenbacks Rewards</p>
              <p className="text-base font-normal">GB 0</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
        </div>
      ),
    },
    {
      title: 'International banking and travel',
      content: (
        <div key="international" className="space-y-4">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
            <div>
              <p className="text-xs">Incoming and outgoing payments</p>
              <p className="text-base font-normal">International payments</p>
            </div>
            <Button variant="link" className="text-white font-bold">View</Button>
          </div>
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20 last:border-b-0">
            <div>
              <p className="text-xs">Foreign Currency Accounts</p>
              <p className="text-base font-normal">Your currencies</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
        </div>
      ),
    },
    {
      title: 'Savings & Investments',
      content: (
        <div key="savings" className="space-y-4">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
            <div>
              <p className="text-xs">Tax certificates</p>
              <p className="text-base font-normal">Tax certificates</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20 last:border-b-0">
            <div>
              <p className="text-base font-normal">Save & Invest</p>
            </div>
             <Button variant="link" className="font-bold text-yellow-400">Explore options</Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Insurance',
      content: (
        <div key="insurance" className="space-y-4">
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
            <div>
              <p className="text-xs">Insurance</p>
              <p className="text-base font-normal">My policies and applications</p>
            </div>
            <ChevronRight className="h-6 w-6" />
          </div>
          <div className="flex flex-row justify-between items-center py-2 border-b border-white/20 last:border-b-0">
            <div>
              <p className="text-xs">Insurance</p>
              <p className="text-base font-normal">New policy</p>
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
          <div className="flex items-center gap-6">
            <Image 
              src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO.png?alt=media&token=990d35fb-2ebf-42c4-988e-78999a4e09d7" 
              alt="Nedbank Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span className="font-medium text-lg">Corrie</span>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="h-5 w-5" />
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="bg-primary text-primary-foreground p-4">
            <AccountsCarousel slides={slides} />
        </div>
        <div className="p-4">
            <Card className="my-6 shadow-md rounded-lg overflow-hidden">
            <CardContent className="p-0">
                <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/CutPaste_2025-09-25_19-22-52-484.png?alt=media&token=611adbd9-a489-4019-99a0-d0aa83f6a21a"
                alt="Advertisement banner"
                data-ai-hint="advertisement banner"
                width={600}
                height={100}
                className="w-full"
                />
            </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4 text-gray-800">My widgets</h2>
            <Card className="shadow-md rounded-lg">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {widgets.map((widget, index) => (
                    <Link href={widget.href} key={index}>
                      <div className="flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="mr-4">
                           <div className={cn(
                              "rounded-lg flex items-center justify-center h-12 w-12 bg-gray-100"
                            )}>
                                <widget.icon />
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <p className="text-base font-medium text-gray-700">{widget.label}</p>
                          <div className="flex items-center">
                            {widget.new && (
                              <span className="mr-2 px-2 py-0.5 text-xs font-semibold text-white bg-green-500 rounded-full">
                                New
                              </span>
                            )}
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
