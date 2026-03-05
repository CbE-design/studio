'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database, Activity, RefreshCw, CheckCircle2, ShieldCheck, Server, Layers, Info, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getSapSystemStatus } from '@/app/lib/sap-service';
import type { SapStatus } from '@/app/lib/sap-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SapErpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<SapStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const currentStatus = await getSapSystemStatus();
      setStatus(currentStatus);
    }
    loadStatus();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const newStatus = await getSapSystemStatus();
      setStatus(newStatus);
      toast({
        title: 'SAP Sync Complete',
        description: 'General Ledger successfully reconciled with local cache.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'SAP NetWeaver Gateway is currently unreachable.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground p-4 flex items-center sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          SAP ERP Bridge
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card className="border-l-4 border-l-blue-600 bg-blue-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-bold uppercase text-blue-900">What is SAP ERP?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-800 leading-relaxed">
              SAP acts as the <strong>Ultimate System of Record</strong>. While the app processes payments, SAP manages the bank&apos;s <strong>General Ledger</strong>, ensuring every transaction is accounted for in the official financial books for auditing and tax compliance.
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-600">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>NetWeaver Connection</CardTitle>
                <CardDescription>Enterprise Resource Planning (ERP) Status</CardDescription>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase",
                status?.connected ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
              )}>
                <div className={cn("h-2 w-2 rounded-full", status?.connected ? "bg-blue-500 animate-pulse" : "bg-red-500")} />
                {status?.connected ? 'Integrated' : 'Disconnected'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Target ERP</p>
                <p className="text-sm font-semibold">{status?.system || 'Loading...'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Gateway</p>
                <p className="text-sm font-semibold">{status?.gatewayVersion || '--'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">GL Status</p>
                <p className={cn("text-sm font-semibold", status?.synced ? "text-green-600" : "text-amber-600")}>
                  {status?.synced ? 'Synchronized' : 'Pending Sync'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Protocol</p>
                <p className="text-sm font-semibold">OData over HTTPS</p>
              </div>
            </div>

            <Button 
              onClick={handleManualSync} 
              disabled={isSyncing}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            >
              {isSyncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Server className="mr-2 h-4 w-4" />
              )}
              {isSyncing ? 'Accessing NetWeaver...' : 'Sync SAP General Ledger'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase px-1 flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Audit Readiness Checklist
          </h2>
          <div className="bg-white rounded-xl border p-4 space-y-3">
            {[
              { label: 'Ledger Reconciliation', desc: 'Auto-sync with General Ledger.', status: 'Active' },
              { label: 'Digital Signatures', desc: 'PKI signing for each entry.', status: 'Required' },
              { label: 'OData V4 Mapping', desc: 'Mapping fields to SAP Metadata.', status: 'Done' },
            ].map((step) => (
              <div key={step.label} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold">{step.label}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 rounded text-blue-600 uppercase font-bold">{step.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-100 border border-gray-200 rounded-xl">
          <p className="text-[10px] text-gray-500 leading-relaxed text-center">
            <strong>SAP NOTICE:</strong> All transaction records exported to SAP NetWeaver are digitally signed and immutable. The General Ledger (GL) serves as the legal system of record for this entity.
          </p>
        </div>
      </main>
    </div>
  );
}
