'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Cpu, Activity, RefreshCw, CheckCircle2, ShieldCheck, Database, Info, ListChecks, Lock, FileJson } from 'lucide-react';
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
          title: 'System Synced',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: 'Could not connect to Core Banking Host.',
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
          <Cpu className="h-5 w-5" />
          CBS Core Bridge
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-bold uppercase text-primary">ISO 20022 Standard Active</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-700 leading-relaxed">
              This node is communicating via <strong>ISO 20022 XML messaging</strong>. Payments are encapsulated in <code className="bg-gray-200 px-1 rounded">pacs.008</code> (Customer Credit Transfer) schemas, allowing for richer data and real-time clearing via SARB.
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>Live heartbeat from Core Banking System</CardDescription>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase",
                status?.connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                <div className={cn("h-2 w-2 rounded-full", status?.connected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                {status?.connected ? 'Online' : 'Offline'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Active System</p>
                <p className="text-sm font-semibold">{status?.systemName || 'Loading...'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Latency</p>
                <p className="text-sm font-semibold">{status?.latency || '--'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">ISO 20022 Readiness</p>
                <p className="text-sm font-semibold text-green-600">{status?.isoReadiness || '--'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Sync Version</p>
                <p className="text-sm font-semibold">SOAP/REST v4.2</p>
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
                <Activity className="mr-2 h-4 w-4" />
              )}
              {isSyncing ? 'Synchronizing Host...' : 'Force System Re-sync'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase px-1 flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Path to Production
          </h2>
          <div className="bg-white rounded-xl border p-4 space-y-3">
            {[
              { label: 'Network Whitelisting', desc: 'App Server IP added to bank DMZ firewall.', status: 'Pending' },
              { label: 'ISO 20022 pacs.008 Mapping', desc: 'Financial XML schemas verified for ZAR clearing.', status: 'Active' },
              { label: 'mTLS Handshake', desc: 'Mutual TLS client certificates installed.', status: 'Mock' },
            ].map((step) => (
              <div key={step.label} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold">{step.label}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded text-gray-500 uppercase font-bold">{step.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Security Notice:</strong> Outside of the whitelisted network range, the Core Banking System layer will ignore all packets, preventing DDoS and brute-force attempts at the hardware level.
          </p>
        </div>
      </main>
    </div>
  );
}
