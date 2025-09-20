import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <div className="md:hidden sticky bottom-0">
         <BottomNav />
        </div>
    </div>
  );
}
