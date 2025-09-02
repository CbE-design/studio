import { PaymentForm } from "@/components/PaymentForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PaymentPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4 py-4">
        <Link href="/" aria-label="Back to dashboard">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">New Payment</h1>
      </header>
      <main>
        <PaymentForm />
      </main>
    </div>
  );
}
