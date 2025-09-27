
import { accounts } from '@/app/lib/data';
import type { Account } from '@/app/lib/definitions';
import { TransferForm } from '@/components/transfer-form';

export default function TransferPage() {
  const allAccounts: Account[] = accounts;

  return (
    <TransferForm allAccounts={allAccounts} />
  );
}
