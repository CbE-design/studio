
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { getFinancialTipsAction } from '@/app/lib/actions';
import type { State } from '@/app/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, LoaderCircle, CheckCircle, Wallet } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? 'Generating Tips...' : 'Get My Tips'}
    </Button>
  );
}

export function TipsForm() {
  const initialState: State = { message: null, errors: {}, data: null };
  const [state, dispatch] = useFormState(getFinancialTipsAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && state.message !== 'Success! Here are your personalized tips.') {
       if (!state.errors || Object.keys(state.errors).length === 0){
        toast({
            variant: 'destructive',
            title: 'Error',
            description: state.message,
        });
       }
    }
  }, [state, toast]);

  return (
    <div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Financial Details</CardTitle>
          <CardDescription>All information is kept confidential.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income">Monthly Income (USD)</Label>
              <Input id="income" name="income" type="number" placeholder="e.g., 5000" required />
              {state.errors?.income &&
                state.errors.income.map((error: string) => (
                  <p className="text-sm font-medium text-destructive" key={error}>
                    {error}
                  </p>
                ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="spendingHabits">Spending Habits</Label>
              <Textarea
                id="spendingHabits"
                name="spendingHabits"
                placeholder="e.g., I spend about $500 on groceries, $200 on dining out, and $150 on entertainment..."
                required
              />
               {state.errors?.spendingHabits &&
                state.errors.spendingHabits.map((error: string) => (
                  <p className="text-sm font-medium text-destructive" key={error}>
                    {error}
                  </p>
                ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Current Budget</Label>
              <Textarea
                id="budget"
                name="budget"
                placeholder="e.g., I have a loose budget, but I don't track my expenses closely..."
                required
              />
              {state.errors?.budget &&
                state.errors.budget.map((error: string) => (
                  <p className="text-sm font-medium text-destructive" key={error}>
                    {error}
                  </p>
                ))}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      {state.data && (
        <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-bold font-headline">Your AI-Generated Tips</h2>
            {state.data.tips.map((tip, index) => (
                <Alert key={index}>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>Tip #{index + 1}</AlertTitle>
                    <AlertDescription>{tip}</AlertDescription>
                </Alert>
            ))}
            
            {state.data.shouldUseTool && (
                <Alert variant="default" className="bg-accent/10 border-accent/20">
                    <Wallet className="h-4 w-4 text-accent" />
                    <AlertTitle className="text-accent">Recommendation</AlertTitle>
                    <AlertDescription className="text-accent/90">
                        Based on your information, we highly recommend using the Nedbank Budget Tool to get a better handle on your finances. It can help you track spending and create a more effective budget.
                    </AlertDescription>
                </Alert>
            )}
             {!state.data.shouldUseTool && (
                <Alert variant="default" className="bg-green-500/10 border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700">Great Job!</AlertTitle>
                    <AlertDescription className="text-green-700/90">
                       You seem to have a good grasp of your budget. Keep up the great work!
                    </AlertDescription>
                </Alert>
            )}
        </div>
      )}
    </div>
  );
}
