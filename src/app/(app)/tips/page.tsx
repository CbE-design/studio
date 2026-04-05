
'use client';

import { TipsForm } from "@/components/tips-form";
import { Lightbulb, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function TipsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="brand-header text-white p-4 flex items-center sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="mr-2 text-white hover:bg-white/10" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Financial Tips</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-start p-4 rounded-2xl bg-green-50 border border-green-100">
          <Lightbulb className="w-5 h-5 mr-3 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            Provide some details about your financial situation, and our AI will generate personalised, actionable tips to help you improve your money management skills.
          </p>
        </div>

        <TipsForm />
      </main>
    </div>
  );
}
