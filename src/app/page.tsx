
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 4500); // 4.5 second delay

    return () => clearTimeout(timer); // Cleanup the timer
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gradient-to-b from-green-400 to-primary text-white">
      <div className="flex-1 flex items-center justify-center">
         <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold tracking-wider">
            <span className="text-white">NEDBANK</span>
            <span className="text-yellow-400">MONEY</span>
            <sup className="text-sm">™</sup>
          </h1>
        </div>
      </div>
      <footer className="text-center text-xs text-white/80">
        <p>Nedbank Ltd Reg No 1951/000009/06.</p>
        <p>Licensed financial services provider (FSP9363) and registered credit provider (NCRCP16)</p>
      </footer>
    </main>
  );
}
