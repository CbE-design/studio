import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/header";
import { SidebarProvider } from "@/components/ui/sidebar";
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
        <div className="md:hidden">
         <BottomNav />
        </div>
         <div className="hidden md:flex w-full">
            <SidebarProvider>
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <Header />
                <main className="flex-1 p-4 overflow-y-auto bg-background md:p-6 lg:p-8">
                  {children}
                </main>
              </div>
            </SidebarProvider>
         </div>
    </div>
  );
}
