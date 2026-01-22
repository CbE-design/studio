'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export function TipsForm() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Feature Coming Soon</CardTitle>
        <CardDescription>The AI-powered financial tips feature is temporarily unavailable.</CardDescription>
      </CardHeader>
      <CardContent>
         <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Under Maintenance</AlertTitle>
            <AlertDescription>
                We're working on improving this feature to provide you with even better financial insights. Please check back later!
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
