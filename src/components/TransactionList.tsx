import type { Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const transactions: Transaction[] = [
  { id: '1', date: '2024-07-28', description: 'Monthly Dividend', amount: 50000.00, type: 'credit' },
  { id: '2', date: '2024-07-27', description: 'Investment - Allan Gray', amount: -25000.00, type: 'debit' },
  { id: '3', date: '2024-07-26', description: 'Property Levy', amount: -3500.00, type: 'debit' },
  { id: '4', date: '2024-07-25', description: 'Rental Income - 12B Baker St', amount: 12500.00, type: 'credit' },
  { id: '5', date: '2024-07-24', description: 'Legal Fees', amount: -7800.00, type: 'debit' },
];

export function TransactionList({ limit }: { limit?: number }) {
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>A log of your recent account activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {displayTransactions.map((transaction) => (
            <li key={transaction.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-full", transaction.type === 'credit' ? 'bg-primary/10' : 'bg-muted')}>
                  {transaction.type === 'credit' ? (
                    <ArrowDownLeft className="h-5 w-5 text-primary" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <p className={cn(
                "font-bold",
                transaction.type === 'credit' ? 'text-primary' : 'text-foreground'
              )}>
                {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(transaction.amount)}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
