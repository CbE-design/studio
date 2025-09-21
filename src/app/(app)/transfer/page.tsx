
import { ArrowLeft, CalendarIcon, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { db } from '@/app/lib/firebase';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { Account } from '@/app/lib/definitions';
import { TransferForm } from '@/components/transfer-form';

async function getAccounts(): Promise<Account[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "accounts"));
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Account',
        type: data.type || 'Cheque',
        accountNumber: data.accountNumber || 'N/A',
        balance: data.balance !== undefined ? data.balance : 0,
        currency: data.currency || 'ZAR',
      };
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

export default async function TransferPage() {
  const accounts = await getAccounts();

  return (
    <TransferForm allAccounts={accounts} />
  );
}
