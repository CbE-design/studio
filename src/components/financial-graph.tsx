
'use client';

import { cn } from '@/lib/utils';

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

const formatCurrencyLocal = (val: number) => `R${val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;

const GraphBar = ({ label, value, percentage, isTotal = false }: { label: string; value: number; percentage: number; isTotal?: boolean }) => (
  <div className="grid grid-cols-[1fr_2fr_1fr] items-center gap-2 text-[7px]">
    <span className="text-left">{label}</span>
    <div className="w-full bg-gray-200 h-2.5 rounded-sm">
      <div
        className="bg-primary h-2.5 rounded-sm"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
    <span className={cn("text-right", isTotal && "font-bold")}>{formatCurrencyLocal(value)}</span>
  </div>
);

export function FinancialGraph({ fundsReceived, fundsUsed }: FinancialGraphProps) {
  const { totalCredits, otherCredits } = fundsReceived;
  const { totalDebits, totalChargesAndFees, otherDebits } = fundsUsed;

  const otherCreditsPercentage = totalCredits > 0 ? (otherCredits / totalCredits) * 100 : 0;
  const totalCreditsPercentage = 100;

  const chargesPercentage = totalDebits > 0 ? (totalChargesAndFees / totalDebits) * 100 : 0;
  const otherDebitsPercentage = totalDebits > 0 ? (otherDebits / totalDebits) * 100 : 0;
  const totalDebitsPercentage = 100;

  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      {/* Funds Received Graph */}
      <div className="space-y-2">
        <h4 className="font-bold text-primary text-[9px] flex justify-between">
          <span>Total funds received/credits</span>
          <span>{formatCurrencyLocal(totalCredits)}</span>
        </h4>
        <div className="space-y-1.5 p-2 border rounded-md bg-gray-50/50">
          <GraphBar label="Other credits" value={otherCredits} percentage={otherCreditsPercentage} />
          <GraphBar label="Total" value={totalCredits} percentage={totalCreditsPercentage} isTotal />
        </div>
        <div className="text-[7px] text-gray-500 text-center">% of funds received</div>
      </div>

      {/* Funds Used Graph */}
      <div className="space-y-2">
        <h4 className="font-bold text-primary text-[9px] flex justify-between">
          <span>Total funds used/debits</span>
          <span>{formatCurrencyLocal(totalDebits)}</span>
        </h4>
        <div className="space-y-1.5 p-2 border rounded-md bg-gray-50/50">
          <GraphBar label="Total charges and fees" value={totalChargesAndFees} percentage={chargesPercentage} />
          <GraphBar label="Other debits" value={otherDebits} percentage={otherDebitsPercentage} />
          <GraphBar label="Total" value={totalDebits} percentage={totalDebitsPercentage} isTotal />
        </div>
        <div className="text-[7px] text-gray-500 text-center">% of utilisation</div>
      </div>
    </div>
  );
}
