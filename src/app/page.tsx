'use client';

import { BalanceCard } from "@/components/BalanceCard";
import { Header } from "@/components/Header";
import { TransactionList } from "@/components/TransactionList";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const accountBalance = 1234567.89;

  return (
    <div className="flex flex-col gap-6">
      <Header />
      <main className="flex flex-col gap-6">
        <BalanceCard balance={accountBalance} />
        <div className="flex gap-4">
          <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/payment">
              Make a Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="flex-1">View Statement</Button>
        </div>
        <TransactionList limit={5} />
      </main>
    </div>
  );
}
