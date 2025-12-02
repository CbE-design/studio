
import { Suspense } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { Skeleton } from '@/components/ui/skeleton';

const SplashScreenFallback = () => (
    <div className="gradient-background flex min-h-screen flex-col items-center justify-center p-8">
        <Skeleton className="h-12 w-64 bg-white/20" />
    </div>
);

export default function Page() {
  return (
    <Suspense fallback={<SplashScreenFallback />}>
      <SplashScreen />
    </Suspense>
  );
}
