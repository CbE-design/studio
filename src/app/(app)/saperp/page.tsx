'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SapErpPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-10 border-b">
                <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-semibold">SAP ERP Integration</h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm border space-y-4 max-w-sm">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Construction className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Module Deactivated</h2>
                    <p className="text-gray-500 text-sm">
                        The SAP ERP bridge has been removed from this profile. Enterprise integration services are currently disabled.
                    </p>
                    <Button onClick={() => router.push('/dashboard')} className="w-full">
                        Return to Overview
                    </Button>
                </div>
            </main>
        </div>
    );
}
