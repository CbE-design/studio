
'use client';

import { FirebaseProvider } from '@/firebase-provider';
import type { PropsWithChildren } from 'react';

export function FirebaseClientProvider({ children }: PropsWithChildren) {
    return (
        <FirebaseProvider>
            {children}
        </FirebaseProvider>
    )
}
