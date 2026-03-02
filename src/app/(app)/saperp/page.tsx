
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, RefreshCw, CheckCircle2, AlertCircle, Clock, LayoutGrid, FileSpreadsheet, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const IntegrationItem = ({ icon: Icon, title, description, status }: { icon: any, title: string, description: string, status: 'active' | 'pending' | 'error' }) => (
    <div className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm">
        <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                <Badge variant={status === 'active' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">
                    {status}
                </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
    </div>
);

export default function SapErpPage() {
    const router = useRouter();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 3000);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="gradient-background text-primary-foreground p-4 flex items-center justify-between sticky top-0 z-10 border-b">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        <Building2 className="h-6 w-6" />
                        SAP ERP Integration
                    </h1>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSync} disabled={isSyncing}>
                    <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">Enterprise Dashboard</h2>
                    <p className="text-gray-500">Manage your CORRIE BUSINESS ENTERPRISE financial data synchronization with SAP ERP.</p>
                </div>

                <Alert className="bg-blue-50 border-blue-100">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-gray-600">
                        <strong>What is SAP ERP?</strong> SAP ERP is a business management software that integrates all core business processes. This integration syncs your banking transactions directly with your system for automated accounting, payroll, and reconciliation.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Sync Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-2xl font-bold">Connected</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Last synced: Today at 08:42 AM</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Pending Invoices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                <span className="text-2xl font-bold">12</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Ready for payment authorization</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">Data Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Sync Limit</span>
                                    <span>82%</span>
                                </div>
                                <Progress value={82} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="modules" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="modules">Integration Modules</TabsTrigger>
                        <TabsTrigger value="history">Sync History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="modules" className="space-y-4 pt-4">
                        <IntegrationItem 
                            icon={Users}
                            title="Payroll Integration"
                            description="Automatically sync employee payroll data and authorize bulk batch payments."
                            status="active"
                        />
                        <IntegrationItem 
                            icon={FileSpreadsheet}
                            title="Accounts Payable"
                            description="Import supplier invoices directly from SAP for streamlined payment cycles."
                            status="active"
                        />
                        <IntegrationItem 
                            icon={LayoutGrid}
                            title="Bank Reconciliation"
                            description="Real-time matching of bank statements with SAP General Ledger entries."
                            status="pending"
                        />
                        <IntegrationItem 
                            icon={AlertCircle}
                            title="Tax Compliance"
                            description="Direct synchronization with revenue services for automated tax submissions."
                            status="error"
                        />
                    </TabsContent>
                    <TabsContent value="history" className="pt-4">
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {[
                                        { type: 'Automatic Sync', date: '2024-05-20 08:42', items: 42, status: 'Success' },
                                        { type: 'Manual Trigger', date: '2024-05-19 14:15', items: 12, status: 'Success' },
                                        { type: 'Bulk Payroll', date: '2024-05-18 09:00', items: 156, status: 'Success' },
                                        { type: 'Automatic Sync', date: '2024-05-17 08:42', items: 38, status: 'Failed' },
                                    ].map((log, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium text-gray-800">{log.type}</p>
                                                <p className="text-xs text-gray-500">{log.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold">{log.items} records</p>
                                                <p className={cn("text-xs", log.status === 'Success' ? 'text-green-600' : 'text-red-600')}>{log.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="bg-white p-6 rounded-lg border border-dashed border-primary/40 flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-primary/5 rounded-full">
                        <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Need custom SAP configuration?</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto">Our enterprise specialists can help you tailor the SAP ERP integration to your specific business needs.</p>
                    </div>
                    <Button variant="outline" className="border-primary text-primary">Contact Support</Button>
                </div>
            </main>
        </div>
    );
}
