
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Building2, 
    RefreshCw, 
    Clock, 
    LayoutGrid, 
    FileSpreadsheet, 
    Users, 
    FileText,
    ExternalLink,
    ShieldCheck,
    ChevronRight,
    LoaderCircle,
    Check,
    Download,
    CreditCard,
    HelpCircle,
    DatabaseZap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase-provider';
import { collection, query, orderBy, limit, where, collectionGroup, onSnapshot } from 'firebase/firestore';
import type { Account, Transaction, Beneficiary } from '@/app/lib/definitions';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { formatCurrency, normalizeDate } from '@/app/lib/data';
import { createTransactionAction } from '@/app/lib/actions';
import { format } from 'date-fns';

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

const ProcessStep = ({ number, title, description }: { number: string, title: string, description: string }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
            {number}
        </div>
        <div>
            <h4 className="font-bold text-sm text-gray-800">{title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
    </div>
);

export default function SapErpPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState('Today at 08:42 AM');

    const [activeDialog, setActiveDialog] = useState<'payroll' | 'pop' | 'payable' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const accountsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'bankAccounts'));
    }, [firestore, user?.uid]);

    const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);

    const [recentDebits, setRecentDebits] = useState<Transaction[]>([]);
    const [loadingDebits, setLoadingDebits] = useState(true);

    const beneficiariesQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'users', user.uid, 'beneficiaries'), limit(5));
    }, [firestore, user?.uid]);
    const { data: beneficiaries, isLoading: beneficiariesLoading } = useCollection<Beneficiary>(beneficiariesQuery);

    useEffect(() => {
        if (!firestore || !user?.uid) return;

        const debitsQuery = query(
            collectionGroup(firestore, 'transactions'),
            where('type', '==', 'debit'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(debitsQuery, (snapshot) => {
            const txs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
                .filter(tx => tx.transactionType !== 'BANK_FEE');
            setRecentDebits(txs);
            setLoadingDebits(false);
        }, (error) => {
            console.error("Error listening to enterprise transactions:", error);
            setLoadingDebits(false);
        });

        return () => unsubscribe();
    }, [firestore, user?.uid]);

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
        }, 2000);
    };

    const processAction = async (title: string, successMsg: string, isPayment: boolean = false) => {
        setIsProcessing(true);
        
        if (isPayment) {
            const primaryAccount = accounts?.find(a => a.type === 'Cheque');
            if (primaryAccount && user) {
                try {
                    const amount = activeDialog === 'payroll' ? '162000.00' : '84500.25';
                    const result = await createTransactionAction({
                        fromAccountId: primaryAccount.id,
                        userId: user.uid,
                        amount: amount,
                        recipientName: activeDialog === 'payroll' ? 'SAP PAYROLL BATCH' : 'SAP ACCOUNTS PAYABLE',
                        paymentType: 'Standard EFT',
                        yourReference: `SAP-${activeDialog?.toUpperCase()}`,
                        recipientReference: `SAP-BATCH-${Date.now()}`
                    });

                    if (!result.success) throw new Error(result.message);
                } catch (e: any) {
                    toast({ variant: 'destructive', title: 'Batch Processing Failed', description: e.message });
                    setIsProcessing(false);
                    return;
                }
            }
        }

        setTimeout(() => {
            setIsProcessing(false);
            setActiveDialog(null);
            toast({
                title: title,
                description: successMsg,
            });
        }, 1500);
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
                                <span className="text-2xl font-bold">3 Batches</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 uppercase">Awaiting Authorization</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Sync Limit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span>Volume</span>
                                    <span>94%</span>
                                </div>
                                <Progress value={94} className="h-1.5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="modules" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-200">
                        <TabsTrigger value="modules">Modules</TabsTrigger>
                        <TabsTrigger value="how-it-works">How it works</TabsTrigger>
                        <TabsTrigger value="connections">Accounts</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="modules" className="space-y-4 pt-4">
                        <IntegrationItem 
                            icon={Users}
                            title="Payroll Integration"
                            description="Automatically sync employee payroll data from SAP HR. Review and authorize bulk batch payments directly here."
                            status="active"
                            onClick={() => setActiveDialog('payroll')}
                        />
                        <IntegrationItem 
                            icon={FileText}
                            title="Corporate POP Generation"
                            description="Automatically generate and upload bank-stamped Proof of Payments back into SAP's document system."
                            status="active"
                            onClick={() => setActiveDialog('pop')}
                        />
                        <IntegrationItem 
                            icon={FileSpreadsheet}
                            title="Accounts Payable Bridge"
                            description="Import pending supplier invoices from SAP Accounts Payable. Pay multiple suppliers in a single transaction cycle."
                            status="active"
                            onClick={() => setActiveDialog('payable')}
                        />
                        <IntegrationItem 
                            icon={LayoutGrid}
                            title="Bank Reconciliation"
                            description="Real-time matching of bank statements with SAP General Ledger entries. Currently mapping data points."
                            status="pending"
                        />
                    </TabsContent>

                    <TabsContent value="how-it-works" className="pt-4 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <HelpCircle className="h-5 w-5 text-primary" />
                                    The Enterprise Bridge Process
                                </CardTitle>
                                <CardDescription>How SAP and Nedbank work together for your trust.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <ProcessStep 
                                    number="1"
                                    title="Data Extraction"
                                    description="Your SAP instance identifies payroll files or supplier invoices that need processing and sends them to the bank's secure landing zone."
                                />
                                <ProcessStep 
                                    number="2"
                                    title="Bank Validation"
                                    description="The bank validates the payment file against your account limits and security protocols. This happens in the background every few hours."
                                />
                                <ProcessStep 
                                    number="3"
                                    title="Manual Authorization"
                                    description="You (the authorized signatory) review the batch details in this app and click 'Authorize'. No manual data entry is required."
                                />
                                <ProcessStep 
                                    number="4"
                                    title="Auto-Reconciliation"
                                    description="Once paid, the bank sends a confirmation back to SAP. SAP automatically marks the invoice as 'Paid' and clears your ledger."
                                />
                                
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex gap-3">
                                    <DatabaseZap className="h-5 w-5 text-primary shrink-0" />
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        <strong>Why use this?</strong> It eliminates the risk of typing in the wrong account number or amount, as the data is pulled directly from your verified business records in SAP.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
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

            {/* --- ACTIVATED WORKFLOW DIALOGS --- */}

            {/* Payroll Dialog */}
            <Dialog open={activeDialog === 'payroll'} onOpenChange={() => setActiveDialog(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="text-primary" /> Payroll Authorization
                        </DialogTitle>
                        <DialogDescription>
                            Review the monthly payroll batch imported from SAP HR for authorization.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-[300px] overflow-auto">
                        {[
                            { name: 'M. Sibiya', amount: 42500 },
                            { name: 'J. van der Merwe', amount: 38900 },
                            { name: 'S. Pillay', amount: 51200 },
                            { name: 'K. Nkosi', amount: 29400 }
                        ].map((emp, i) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                <span className="font-medium">{emp.name}</span>
                                <span className="text-gray-600">{formatCurrency(emp.amount)}</span>
                            </div>
                        ))}
                        <div className="pt-2 flex justify-between font-bold text-primary">
                            <span>TOTAL BATCH (4)</span>
                            <span>{formatCurrency(162000)}</span>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild><Button variant="outline" className="flex-1">Cancel</Button></DialogClose>
                        <Button 
                            className="flex-1" 
                            onClick={() => processAction('Payroll Authorized', 'Salary batch for 4 employees has been released for payment.', true)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <LoaderCircle className="animate-spin h-4 w-4" /> : 'Authorize Batch'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Corporate POP Dialog */}
            <Dialog open={activeDialog === 'pop'} onOpenChange={() => setActiveDialog(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="text-primary" /> Corporate POP Export
                        </DialogTitle>
                        <DialogDescription>
                            Select recent enterprise transfers to export bank-stamped POPs directly into your SAP Document Center.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[350px] overflow-auto">
                        {loadingDebits ? (
                            <div className="p-8 text-center"><LoaderCircle className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                        ) : recentDebits.length > 0 ? (
                            recentDebits.map((tx, i) => (
                                <div key={tx.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <div className="h-4 w-4 rounded border border-primary flex items-center justify-center bg-primary text-white">
                                        <Check className="h-3 w-3" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold uppercase truncate">{tx.recipientName || tx.description}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{formatCurrency(tx.amount)} • {format(normalizeDate(tx.date), 'dd MMM yyyy')}</p>
                                    </div>
                                    <Download className="h-4 w-4 text-gray-400" />
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4 text-sm">No recent transactions found to export.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full" 
                            onClick={() => processAction('Export Successful', 'Batch Proof of Payments have been synced to your SAP Document Management System.')}
                            disabled={isProcessing || recentDebits.length === 0}
                        >
                            {isProcessing ? <LoaderCircle className="animate-spin h-4 w-4" /> : `Export ${recentDebits.length} POPs to SAP`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Accounts Payable Dialog */}
            <Dialog open={activeDialog === 'payable'} onOpenChange={() => setActiveDialog(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="text-primary" /> Accounts Payable Bridge
                        </DialogTitle>
                        <DialogDescription>
                            Review pending supplier invoices imported from your SAP Accounts Payable ledger.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-yellow-800 uppercase">Awaiting Action</p>
                                <p className="text-xl font-bold text-yellow-900">{formatCurrency(84500.25)}</p>
                                <p className="text-[10px] text-yellow-700">{beneficiaries?.length || 0} Supplier Invoices</p>
                            </div>
                            <FileSpreadsheet className="h-8 w-8 text-yellow-400" />
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-auto">
                            {beneficiariesLoading ? (
                                <LoaderCircle className="animate-spin mx-auto text-primary" />
                            ) : beneficiaries && beneficiaries.length > 0 ? (
                                beneficiaries.map((ben, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-white border rounded">
                                        <span className="font-medium">{ben.name}</span>
                                        <span className="font-bold">{formatCurrency((i + 1) * 15000 + 4500.25)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-2">No suppliers synced from SAP.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full" 
                            onClick={() => processAction('Payment Successful', 'Supplier payments have been processed and reconciled in SAP.', true)}
                            disabled={isProcessing || !beneficiaries?.length}
                        >
                            {isProcessing ? <LoaderCircle className="animate-spin h-4 w-4" /> : 'Pay Selected Invoices'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
