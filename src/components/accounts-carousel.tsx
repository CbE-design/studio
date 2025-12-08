
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Eye, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import type { Account } from '@/app/lib/definitions';
import Link from 'next/link';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/app/lib/data';


const AccountSkeleton = () => (
  <div className="space-y-0">
    <div className="flex flex-row justify-between items-center p-3 border-b border-white/20">
      <div>
        <Skeleton className="h-5 w-40 bg-white/20" />
        <Skeleton className="h-6 w-32 mt-1 bg-white/20" />
      </div>
      <ChevronRight className="h-6 w-6" />
    </div>
    <div className="flex flex-row justify-between items-center p-3">
      <div>
        <Skeleton className="h-5 w-32 bg-white/20" />
        <Skeleton className="h-6 w-28 mt-1 bg-white/20" />
      </div>
      <ChevronRight className="h-6 w-6" />
    </div>
  </div>
)

const AccountsDisplay = () => {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const accountsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
  }, [firestore, user?.uid]);

  const { data: accounts, isLoading: isAccountsLoading } = useCollection<Account>(accountsQuery);

  if (isUserLoading || isAccountsLoading) {
    return <AccountSkeleton />;
  }

  return (
    <div className="space-y-0">
      {accounts && accounts.length > 0 ? (
        accounts.map((account, index) => {
          const isDormant = account.name === 'Savvy Bundle Current Account';
          return (
            <Link href={`/account/${account.id}`} key={account.id}>
              <div className={cn(
                "flex flex-row justify-between items-center p-3 cursor-pointer text-white",
                index < accounts.length - 1 ? 'border-b border-white/20' : ''
              )}>
                <div>
                  <p className={cn("text-sm font-normal normal-case", isDormant && "text-white/60")}>{account.name}</p>
                  <p className={cn("text-base font-normal", isDormant && "text-white/60")}>{formatCurrency(account.balance, account.currency)}</p>
                </div>
                <ChevronRight className={cn("h-6 w-6", isDormant && "text-white/60")} />
              </div>
            </Link>
          );
        })
      ) : (
         <div className="text-center py-4">
            <p className="text-sm text-white">No accounts found.</p>
            <p className="text-xs text-white/80">This can happen if you just signed up. Try refreshing.</p>
         </div>
      )}
    </div>
  );
}


export function AccountsCarousel() {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    const slides = [
        {
          title: 'Accounts',
          content: <AccountsDisplay />,
        },
        {
          title: 'Rewards',
          content: (
             <div key="rewards" className="space-y-2">
              <div className="flex flex-row justify-between items-center p-3 border-b border-white/20">
                <div>
                  <p className="text-sm">Greenbacks Rewards</p>
                  <div className="text-base font-normal">GB 0</div>
                </div>
                <ChevronRightIcon className="h-6 w-6" />
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
                <ChevronRightIcon className="h-6 w-6" />
              </div>
            </div>
          ),
        },
        {
          title: 'Savings & Investments',
          content: (
            <div key="savings" className="space-y-2">
               <div className="flex flex-row justify-between items-center p-3 border-b border-white/20">
                <div>
                  <p className="text-sm font-normal normal-case">Nedbank Justinvest Money Market Investment</p>
                  <p className="text-base font-normal">R18 502 191.17</p>
                </div>
                <ChevronRightIcon className="h-6 w-6" />
              </div>
              <div className="flex flex-row justify-between items-center p-3 border-b border-white/20">
                <div>
                  <p className="text-sm">Tax certificates</p>
                  <p className="text-base font-normal">Tax certificates</p>
                </div>
                <ChevronRightIcon className="h-6 w-6" />
              </div>
              <div className="flex flex-row justify-between items-center p-3">
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
                <ChevronRightIcon className="h-6 w-6" />
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


    const scrollPrev = useCallback(() => {
      api?.scrollPrev();
    }, [api]);
  
    const scrollNext = useCallback(() => {
      api?.scrollNext();
    }, [api]);

    useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap());

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const CurrentSlideTitle = () => {
        const title = slides[current]?.title || 'Accounts';
         return (
            <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-bold">{title}</h1>
                <Eye className="h-6 w-6" />
            </div>
        )
    }

    return (
        <div>
            <CurrentSlideTitle />
            <Carousel setApi={setApi}>
                <CarouselContent>
                    {slides.map((slide, index) => (
                        <CarouselItem key={index}>
                            {slide.content}
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            <div className="flex items-center justify-center space-x-2 py-4">
                <button onClick={scrollPrev} className="p-1 disabled:opacity-50" disabled={current === 0}>
                    <ChevronLeft className="h-8 w-8" />
                </button>
                {Array.from({ length: count }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        className={`h-2 w-2 rounded-full ${current === index ? 'bg-white' : 'bg-white/50'}`}
                    />
                ))}
                <button onClick={scrollNext} className="p-1 disabled:opacity-50" disabled={current === count - 1}>
                    <ChevronRight className="h-8 w-8" />
                </button>
            </div>
        </div>
    );
}

    