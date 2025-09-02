'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export function BalanceCard({ balance }: { balance: number }) {
  const [showBalance, setShowBalance] = useState(true);

  const formattedBalance = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(balance);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setShowBalance(!showBalance)} aria-label={showBalance ? "Hide balance" : "Show balance"}>
          {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {showBalance ? formattedBalance : "R ••••••,••"}
        </div>
        <p className="text-xs text-muted-foreground">+2.3% from last month</p>
      </CardContent>
    </Card>
  );
}
