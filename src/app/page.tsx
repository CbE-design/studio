
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 4500); // 4.5 second delay

    return () => clearTimeout(timer); // Cleanup the timer
  }, [router]);

  return (
    <main className="gradient-background flex min-h-screen flex-col items-center justify-between p-8 text-white">
      <div className="flex-1 flex items-center justify-center">
         <div className="text-center animate-fade-in flex flex-col items-center">
            <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-3883937532-b7f00.firebasestorage.app/o/NED.JO-white.png?alt=media&token=143ce385-52a1-432a-9df2-513ab41c49f8"
                alt="Nedbank Logo"
                width={80}
                height={80}
                className="mb-4"
            />
          <h1 className="text-4xl font-bold tracking-wider">
            <span className="text-white">NEDBANK</span>
            <span className="text-yellow-400">MONEY</span>
            <sup className="text-sm align-super">App</sup>
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
