
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Eye, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Accounts } from './accounts';
import { Button } from './ui/button';

export function AccountsCarousel() {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    const slides = [
        {
          title: 'Accounts',
          content: <Accounts />,
        },
        {
          title: 'Rewards',
          content: (
             <div key="rewards" className="space-y-2">
              <div className="flex flex-row justify-between items-center p-3 rounded-lg border-b border-white/20 cursor-pointer hover:bg-white/10">
                <div>
                  <p className="text-sm">Greenbacks Rewards</p>
                  <p className="text-base font-normal">GB 0</p>
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
            <div key="savings" className="space-y-4">
              <div className="flex flex-row justify-between items-center py-2 border-b border-white/20">
                <div>
                  <p className="text-xs">Tax certificates</p>
                  <p className="text-base font-normal">Tax certificates</p>
                </div>
                <ChevronRightIcon className="h-6 w-6" />
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

    return (
        <div>
            <Carousel setApi={setApi}>
                <CarouselContent>
                    {slides.map((slide, index) => (
                        <CarouselItem key={index}>
                            <div className="flex items-center gap-2 mb-6">
                                <h1 className="text-xl font-bold">{slide.title}</h1>
                                <Eye className="h-6 w-6" />
                            </div>
                            {slide.content}
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
            <div className="flex items-center justify-center space-x-2 py-4">
                <button onClick={scrollPrev} className="p-1 disabled:opacity-50" disabled={current === 0}>
                    <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: count }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        className={`h-2 w-2 rounded-full ${current === index ? 'bg-white' : 'bg-white/50'}`}
                    />
                ))}
                <button onClick={scrollNext} className="p-1 disabled:opacity-50" disabled={current === count - 1}>
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}