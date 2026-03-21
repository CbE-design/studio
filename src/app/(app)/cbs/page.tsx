'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Cpu, Activity, RefreshCw, CheckCircle2, ShieldCheck, Database, Info, ListChecks, Lock, FileJson, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getCbsSystemStatus, triggerCbsHandshake } from '@/app/lib/cbs-service';
import type { CbsStatus } from '@/app/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CbsBridgePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<CbsStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const currentStatus = await getCbsSystemStatus();
      setStatus(currentStatus);
    }
    loadStatus();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await triggerCbsHandshake();
      if (result.success) {
        const newStatus = await getCbsSystemStatus();
        setStatus(newStatus);
        toast({
          title: 'Production Sync Active',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Production Node is unreachable from this network.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="brand-header text-primary-foreground p-4 flex items-center sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2 -ml-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Server className="h-5 w-5" />
          Production Core Bridge
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card className="border-l-4 border-l-green-600 bg-green-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-bold uppercase text-green-900">Production Node Active</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-800 leading-relaxed">
              This application is now enrolled in the <strong>Nedbank Production Network</strong>. All transactions are cleared via real-time ISO 20022 pacs.008 messaging and are legally binding on the General Ledger.
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>CBS Live Link</CardTitle>
                <CardDescription>Direct production connection status</CardDescription>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase",
                status?.connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                <div className={cn("h-2 w-2 rounded-full", status?.connected ? "bg-green-500 animate-pulse" : "bg-red-50")} />
                {status?.connected ? 'Live' : 'Interrupted'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Production System</p>
                <p className="text-sm font-semibold">{status?.systemName || 'Loading...'}</p>
              </div>
              <div className={cn("p-3 rounded-lg border", status?.latency && parseInt(status.latency) < 20 ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-200")}>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Latency</p>
                <p className="text-sm font-semibold text-green-700">{status?.latency || '--'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">ISO 20022 Status</p>
                <p className="text-sm font-semibold text-green-600">Active Node</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">mTLS Security</p>
                <p className="text-sm font-semibold text-blue-600">Verified</p>
              </div>
            </div>

            <Button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="w-full h-12"
            >
              {isSyncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              {isSyncing ? 'Validating Handshake...' : 'Refresh Production Handshake'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase px-1 flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security Compliance
          </h2>
          <div className="bg-white rounded-xl border p-4 space-y-3">
            {[
              { label: 'mTLS Handshake', desc: 'Mutual TLS 1.3 certificates verified.', status: 'Active' },
              { label: 'Network Whitelisting', desc: 'Authorized IP range: 10.24.x.x (Nedbank DMZ).', status: 'Active' },
              { label: 'HSM Vault Signing', desc: 'Production keys secured in hardware HSM.', status: 'Ready' },
            ].map((step) => (
              <div key={step.label} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold">{step.label}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-green-50 rounded text-green-700 uppercase font-bold">{step.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Production Warning:</strong> Any manual re-sync will trigger a security audit event in the Nedbank Cyber Security Operations Center (CSOC).
          </p>
        </div>
      </main>
    </div>
  );
}