
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function TimedRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/') {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 4500); // 4.5 second delay

      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [pathname, router]);

  return null; // This component does not render anything
}
