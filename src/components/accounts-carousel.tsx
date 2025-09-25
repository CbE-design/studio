
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
    title: string;
    content: React.ReactNode;
}

interface AccountsCarouselProps {
    slides: Slide[];
}

export function AccountsCarousel({ slides }: AccountsCarouselProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

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
