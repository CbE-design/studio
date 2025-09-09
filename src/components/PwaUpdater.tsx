'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const PwaUpdater = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        const handleUpdate = (event: Event) => {
            const registration = (event as CustomEvent).detail;
            if (registration && registration.waiting) {
                setWaitingWorker(registration.waiting);
                setUpdateAvailable(true);
            }
        };

        window.addEventListener('pwa-update-available', handleUpdate);

        return () => {
            window.removeEventListener('pwa-update-available', handleUpdate);
        };
    }, []);

    const handleRefresh = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            // The new service worker will take over and the page will reload.
            // A hard reload is a good fallback.
            window.location.reload();
        }
        setUpdateAvailable(false);
    };

    if (!updateAvailable) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <p className="text-sm font-medium">A new version is available!</p>
            <Button onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update
            </Button>
        </div>
    );
};

export default PwaUpdater;
