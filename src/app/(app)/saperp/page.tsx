'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Building2, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    LayoutGrid, 
    FileSpreadsheet, 
    Users, 
    Info, 
    FileText,
    ExternalLink,
    ShieldCheck,
    ChevronRight,
    LoaderCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, query } from 'firebase/firestore';
import type { Account } from '@/app/lib/definitions';
import { cn } from '@/lib/utils';

const IntegrationItem = ({ 
    icon: Icon, 
    title, 
    description, 
    status, 
    onClick 
}: { 
    icon: any, 
    title: string, 
    description: string, 
    status: 'active' | 'pending' | 'error',
    onClick?: () => void
}) => (
    <div 
        onClick={onClick}
        className={cn(
            "flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm transition-all",
            onClick ? "cursor-pointer hover:border-primary/50 hover:shadow-md active:scale-[0.98]" : ""
        )}
    >
        <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                <Badge variant={status === 'active' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'} className="capitalize text-[10px]">
                    {status}
                </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
            {onClick && (
                <div className="mt-2 flex items-center text-[10px] font-bold text-primary uppercase tracking-wider">
                    Manage Module <ChevronRight className="ml-1 h-3 w-3" />
                </div>
            )}
        </div>
    </div>
);

export default function SapErpPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState('Today at 08:42 AM');

    // Fetch actual accounts to show connectivity
    const accountsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
    }, [firestore, user?.uid]);

    const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            const now = new Date();
            setLastSync(`Today at ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
            toast({
                title: "SAP Data Synchronized",
                description: "All financial records have been updated in your SAP General Ledger.",
            });
        }, 2500);
    };

    const handleModuleAction = (moduleName: string) => {
        toast({
            title: `${moduleName} Action`,
            description: `Processing enterprise-level ${moduleName.toLowerCase()} synchronization.`,
        });
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="gradient-background text-primary-foreground p-4 flex items-center justify-between sticky top-0 z-10 border-b">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="mr-2 -ml-2 hover:bg-white/10" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        <Building2 className="h-6 w-6" />
                        SAP ERP Integration
                    </h1>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    className="hover:bg-white/10"
                >
                    {isSyncing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">Enterprise Dashboard</h2>
                    <p className="text-sm text-gray-500">Manage data synchronization for <strong>DICKSON FAMILY TRUST</strong>.</p>
                </div>

                <Alert className="bg-blue-50 border-blue-100">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs text-gray-600">
                        <strong>What is SAP ERP?</strong> SAP is an enterprise resource planning software that centralizes your core business data. This integration allows automated bank reconciliation, bulk payroll processing, and supplier payment authorization directly from your accounting system.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sync Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-green-500" />
                                <span className="text-2xl font-bold">Encrypted</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase">Last sync: {lastSync}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-yellow-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Batch</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-yellow-500" />
                                <span className="text-2xl font-bold">12 Items</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase">Awaiting SAP Confirmation</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Sync Limit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span>Records</span>
                                    <span>82%</span>
                                </div>
                                <Progress value={82} className="h-1.5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="modules" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-200">
                        <TabsTrigger value="modules">Integration Modules</TabsTrigger>
                        <TabsTrigger value="connections">Active Connections</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="modules" className="space-y-4 pt-4">
                        <IntegrationItem 
                            icon={Users}
                            title="Payroll Integration"
                            description="Automatically sync employee payroll data and authorize bulk batch payments from SAP HR."
                            status="active"
                            onClick={() => handleModuleAction('Payroll')}
                        />
                        <IntegrationItem 
                            icon={FileText}
                            title="Corporate POP Generation"
                            description="Generate official bank-stamped Proof of Payments directly within SAP for all bulk transfers."
                            status="active"
                            onClick={() => handleModuleAction('POP Generation')}
                        />
                        <IntegrationItem 
                            icon={FileSpreadsheet}
                            title="Accounts Payable"
                            description="Import supplier invoices directly from SAP for streamlined enterprise payment cycles."
                            status="active"
                            onClick={() => handleModuleAction('Accounts Payable')}
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
                            description="Direct synchronization with revenue services for automated corporate tax submissions."
                            status="error"
                        />
                    </TabsContent>

                    <TabsContent value="connections" className="pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold uppercase">Connected Accounts</CardTitle>
                                <CardDescription className="text-xs">These accounts are currently broadcasting data to your SAP instance.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {accountsLoading ? (
                                        <div className="p-8 text-center"><LoaderCircle className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                                    ) : accounts && accounts.length > 0 ? (
                                        accounts.map(account => (
                                            <div key={account.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{account.name}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{account.accountNumber}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Reconciled</Badge>
                                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 text-sm">No accounts found to connect.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div className="mt-4">
                            <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider h-12">
                                <ExternalLink className="mr-2 h-4 w-4" /> Open SAP Cloud Connector
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="bg-white p-6 rounded-lg border border-dashed border-primary/40 flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-primary/5 rounded-full">
                        <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Need custom configuration?</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">Our enterprise specialists can help you tailor the SAP integration to your specific business requirements.</p>
                    </div>
                    <Button variant="outline" className="border-primary text-primary font-bold uppercase text-[10px] tracking-widest px-8">Contact Support</Button>
                </div>
            </main>
        </div>
    );
}
