
'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { atmLocations } from '@/app/lib/data';
import { MapPin, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function LocatorPage() {
  const router = useRouter();
  const mapImage = PlaceHolderImages.find(img => img.id === 'atm-map');

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="brand-header text-white p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 text-white hover:bg-white/10" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">ATM & Branch Locator</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        {mapImage && (
          <div className="overflow-hidden">
            <Image
              src={mapImage.imageUrl}
              alt={mapImage.description}
              data-ai-hint={mapImage.imageHint}
              width={1200}
              height={800}
              className="w-full h-52 object-cover"
              priority
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Nearby Locations</p>
          {atmLocations.map(location => (
            <Card key={location.id} className="shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{location.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{location.address}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {location.services?.map(service => (
                        <Badge key={service} variant="outline" className="text-[10px] px-2 py-0.5 border-gray-200 text-gray-600">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
