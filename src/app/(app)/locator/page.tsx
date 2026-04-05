
'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { atmLocations } from '@/app/lib/data';
import { MapPin, Banknote, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LocatorPage() {
  const mapImage = PlaceHolderImages.find(img => img.id === 'atm-map');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">ATM & Branch Locator</h1>
        <p className="text-muted-foreground">Find nearby Nedbank ATMs and branches.</p>
      </div>

      {mapImage && (
        <Card className="shadow-lg overflow-hidden">
          <Image
            src={mapImage.imageUrl}
            alt={mapImage.description}
            data-ai-hint={mapImage.imageHint}
            width={1200}
            height={800}
            className="w-full h-64 object-cover md:h-96"
          />
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {atmLocations.map(location => (
          <Card key={location.id} className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="text-primary" />
                <span>{location.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{location.address}</p>
              <div className="flex flex-wrap gap-2">
                {location.services.map(service => (
                  <Badge key={service} variant="secondary">
                    {service === 'Withdrawal' && <Banknote className="mr-1 h-3 w-3" />}
                    {service === 'Deposit' && <Landmark className="mr-1 h-3 w-3" />}
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
