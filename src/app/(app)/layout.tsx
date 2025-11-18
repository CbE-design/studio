
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        <div className="sticky bottom-0 z-20">
         <BottomNav />
        </div>
    </div>
  );
}
