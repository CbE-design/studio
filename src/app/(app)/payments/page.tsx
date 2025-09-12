'use client';

import { accounts, beneficiaries, formatCurrency } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function PaymentsPage() {
  const { toast } = useToast();

  const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = formData.get('amount');
    
    toast({
      title: "Payment Successful",
      description: `Your payment of ${formatCurrency(Number(amount))} has been processed.`,
    });
    e.currentTarget.reset();
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Payments</h1>
        <p className="text-muted-foreground">Transfer funds and pay your bills.</p>
      </div>
      <Card className="shadow-lg">
        <CardContent className="p-4 md:p-6">
          <Tabs defaultValue="transfer">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transfer">Transfer Funds</TabsTrigger>
              <TabsTrigger value="bill">Pay Bill</TabsTrigger>
            </TabsList>
            <TabsContent value="transfer">
              <Card>
                <CardHeader>
                  <CardTitle>Transfer Between Accounts</CardTitle>
                  <CardDescription>Move money between your MoneyGO accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="from-account">From</Label>
                        <Select name="from-account">
                          <SelectTrigger id="from-account">
                            <SelectValue placeholder="Select an account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name} ({formatCurrency(acc.balance)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="to-account">To</Label>
                        <Select name="to-account">
                          <SelectTrigger id="to-account">
                            <SelectValue placeholder="Select an account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name} ({formatCurrency(acc.balance)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount-transfer">Amount</Label>
                      <Input id="amount-transfer" name="amount" type="number" placeholder="0.00" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reference-transfer">Reference</Label>
                      <Input id="reference-transfer" name="reference" placeholder="e.g., Savings" />
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                      Transfer
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bill">
              <Card>
                <CardHeader>
                  <CardTitle>Pay a Bill</CardTitle>
                  <CardDescription>Make payments to your saved beneficiaries.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-account-bill">From</Label>
                      <Select name="from-account-bill">
                        <SelectTrigger id="from-account-bill">
                          <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.filter(a => a.type !== 'Credit').map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name} ({formatCurrency(acc.balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="beneficiary">To</Label>
                      <Select name="beneficiary">
                        <SelectTrigger id="beneficiary">
                          <SelectValue placeholder="Select a beneficiary" />
                        </SelectTrigger>
                        <SelectContent>
                          {beneficiaries.map(ben => (
                            <SelectItem key={ben.id} value={ben.id}>
                              {ben.name} - {ben.accountNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount-bill">Amount</Label>
                      <Input id="amount-bill" name="amount" type="number" placeholder="0.00" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reference-bill">Payment Reference</Label>
                      <Input id="reference-bill" name="reference" placeholder="e.g., Invoice #123" />
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                      Pay Bill
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
