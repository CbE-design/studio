
'use client';

import { TipsForm } from "@/components/tips-form";
import { Lightbulb } from "lucide-react";

export default function TipsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Personalized Financial Tips</h1>
        <p className="text-muted-foreground">Get AI-powered tips to manage your money more effectively.</p>
      </div>
      
      <div className="flex items-start p-4 rounded-lg bg-primary/10 border border-primary/20">
        <Lightbulb className="w-6 h-6 mr-4 text-primary" />
        <p className="text-sm text-primary/80">
          Provide some details about your financial situation, and our AI will generate personalized, actionable tips to help you improve your money management skills. The more detail you provide, the better the tips will be.
        </p>
      </div>

      <TipsForm />
    </div>
  );
}
