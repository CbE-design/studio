
'use client';

// This component is deprecated and not used for PDF generation.
// The graph logic is now directly inside `statement-generator.ts`.
// It is kept here only for potential future UI use or as a reference.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancialGraphProps {
  fundsReceived: {
    totalCredits: number;
    otherCredits: number;
  };
  fundsUsed: {
    totalDebits: number;
    totalChargesAndFees: number;
    otherDebits: number;
  };
}

const Bar = ({ value, total, color }: { value: number; total: number; color: string }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

export function FinancialGraph({ fundsReceived, fundsUsed }: FinancialGraphProps) {

  const formatCurrency = (val: number) => `R${val.toFixed(2)}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Funds Received */}
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex justify-between">
                    <span>Total funds received/credits</span>
                    <span className="text-primary">{formatCurrency(fundsReceived.totalCredits)}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div>
                    <div className="flex justify-between mb-1">
                        <span>Other Credits</span>
                        <span>{formatCurrency(fundsReceived.otherCredits)}</span>
                    </div>
                    <Bar value={fundsReceived.otherCredits} total={fundsReceived.totalCredits} color="bg-primary" />
                </div>
                <div>
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(fundsReceived.totalCredits)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Funds Used */}
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex justify-between">
                    <span>Total funds used/debits</span>
                    <span className="text-primary">{formatCurrency(fundsUsed.totalDebits)}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div>
                    <div className="flex justify-between mb-1">
                        <span>Total charges and fees</span>
                        <span>{formatCurrency(fundsUsed.totalChargesAndFees)}</span>
                    </div>
                    <Bar value={fundsUsed.totalChargesAndFees} total={fundsUsed.totalDebits} color="bg-primary" />
                </div>
                 <div>
                    <div className="flex justify-between mb-1">
                        <span>Other Debits</span>
                        <span>{formatCurrency(fundsUsed.otherDebits)}</span>
                    </div>
                    <Bar value={fundsUsed.otherDebits} total={fundsUsed.totalDebits} color="bg-primary" />
                </div>
                 <div>
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(fundsUsed.totalDebits)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
