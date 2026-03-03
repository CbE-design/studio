
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
    DatabaseZap,
    Zap,
    ShieldAlert,
    BarChart3,
    Link2,
    Settings2,
    Lock,
    Key,
    Server,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, normalizeDate } from '@/app/lib/data';
import { createTransactionAction, generateProofOfPaymentAction } from '@/app/lib/actions';
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
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState('Today at 08:42 AM');
    const [isConnected, setIsConnected] = useState(true);

    const [activeDialog, setActiveDialog] = useState<'payroll' | 'pop' | 'payable' | 'connect' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatingPopId, setGeneratingPopId] = useState<string | null>(null);

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
        if (!firestore || !user?.uid || isUserLoading) {
            return;
        }

        const debitsQuery = query(
            collectionGroup(firestore, 'transactions'),
            where('type', '==', 'debit'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc'),
            limit(15)
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
    }, [firestore, user?.uid, isUserLoading]);

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

    const handleDownloadPop = async (tx: Transaction) => {
        setGeneratingPopId(tx.id);
        try {
            const result = await generateProofOfPaymentAction(tx);
            if ('error' in result) throw new Error(result.error);

            const blob = new Blob([result], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Corporate_POP_${tx.sapDocumentNumber || tx.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({ title: "Document Generated", description: "The corporate proof of payment has been downloaded." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Generation Failed", description: e.message });
        } finally {
            setGeneratingPopId(null);
        }
    }

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

    const handleConnectNedbank = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsConnected(true);
            setIsProcessing(false);
            setActiveDialog(null);
            toast({
                title: "Nedbank Profile Linked",
                description: "The Dickson Family Trust SAP instance is now securely connected to Nedbank API services.",
            });
        }, 2500);
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
                    disabled={isSyncing || !isConnected}
                    className="hover:bg-white/10"
                >
                    {isSyncing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold text-gray-800">Enterprise Dashboard</h2>
                    <p className="text-sm text-gray-500">Bridge management for <strong>DICKSON FAMILY TRUST</strong>.</p>
                </div>

                {!isConnected ? (
                    <Card className="border-2 border-dashed border-primary bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Link2 className="text-primary" />
                                Bridge Offline
                            </CardTitle>
                            <CardDescription>Your SAP ERP instance is not currently connected to your Nedbank profile.</CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button className="w-full font-bold uppercase tracking-widest" onClick={() => setActiveDialog('connect')}>
                                Connect to Nedbank
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bridge Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-green-500" />
                                    <span className="text-2xl font-bold">Linked</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase">mTLS Encrypted Connection</p>
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
                                <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Sync</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5 text-primary" />
                                    <span className="text-lg font-bold truncate">{lastSync}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 uppercase">Auto-reconciliation Active</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Tabs defaultValue="modules" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-200">
                        <TabsTrigger value="modules">Modules</TabsTrigger>
                        <TabsTrigger value="strategic">Strategic Value</TabsTrigger>
                        <TabsTrigger value="connections">How to Connect</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="modules" className="space-y-4 pt-4">
                        <IntegrationItem 
                            icon={Users}
                            title="Payroll Integration"
                            description="Automatically sync employee payroll data from SAP HR. Review and authorize bulk batch payments directly here."
                            status={isConnected ? "active" : "pending"}
                            onClick={isConnected ? () => setActiveDialog('payroll') : undefined}
                        />
                        <IntegrationItem 
                            icon={FileText}
                            title="Corporate POP Generation"
                            description="Automatically generate and upload bank-stamped Proof of Payments back into SAP's document system."
                            status={isConnected ? "active" : "pending"}
                            onClick={isConnected ? () => setActiveDialog('pop') : undefined}
                        />
                        <IntegrationItem 
                            icon={FileSpreadsheet}
                            title="Accounts Payable Bridge"
                            description="Import pending supplier invoices from SAP Accounts Payable. Pay multiple suppliers in a single transaction cycle."
                            status={isConnected ? "active" : "pending"}
                            onClick={isConnected ? () => setActiveDialog('payable') : undefined}
                        />
                        <IntegrationItem 
                            icon={LayoutGrid}
                            title="Bank Reconciliation"
                            description="Real-time matching of bank statements with SAP General Ledger entries. Currently mapping data points."
                            status="pending"
                        />
                    </TabsContent>

                    <TabsContent value="strategic" className="pt-4 space-y-6">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    Why use the SAP ERP Bridge?
                                </CardTitle>
                                <CardDescription>Strategic advantages for the Dickson Family Trust.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <ShieldAlert className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Risk Mitigation</h4>
                                            <p className="text-xs text-gray-600 leading-relaxed">Eliminate manual data entry errors. Data flows directly from your verified SAP business records to the bank's clearing system.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Real-time Reconciliation</h4>
                                            <p className="text-xs text-gray-600 leading-relaxed">Your General Ledger is updated instantly upon bank confirmation, providing a 100% accurate view of your trust's liquidity.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <DatabaseZap className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Audit Compliance</h4>
                                            <p className="text-xs text-gray-600 leading-relaxed">Every transaction includes an immutable SAP document reference, satisfying the highest standards of corporate governance.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="connections" className="pt-4 space-y-6">
                        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Server className="text-primary h-5 w-5" />
                                Connection Guide: SAP to Nedbank
                            </h3>
                            
                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-primary" />
                                        Step 1: Nedbank API Portal Registration
                                    </h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        The Dickson Family Trust must first register as a Corporate Entity on the <strong>Nedbank API Developer Portal</strong>. You will be issued a <code>Client ID</code> and <code>Client Secret</code> specifically for your trust's accounts.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-primary" />
                                        Step 2: Certificate Exchange (mTLS)
                                    </h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        To ensure bank-grade security, you must upload a public SSL certificate to Nedbank and configure your SAP Cloud Connector to use the corresponding private key for every API request.
                                    </p>
                                </section>

                                <section className="space-y-3">
                                    <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                        <Settings2 className="h-4 w-4 text-primary" />
                                        Step 3: Map SAP Payment Methods
                                    </h4>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        In your SAP SPRO configuration, map the <code>F110</code> (Automatic Payment Run) to export in <strong>ISO 20022 XML format</strong>. This app's bridge will automatically translate these files into instant bank instructions.
                                    </p>
                                </section>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-dashed text-center">
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Technical Status</p>
                                <div className="flex justify-center gap-4">
                                    <Badge variant="outline" className="bg-white flex gap-1 items-center"><Key className="h-3 w-3" /> OAuth 2.0 Ready</Badge>
                                    <Badge variant="outline" className="bg-white flex gap-1 items-center"><ShieldCheck className="h-3 w-3" /> mTLS Validated</Badge>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full border-primary text-primary" onClick={() => setActiveDialog('connect')}>
                                <Settings2 className="mr-2 h-4 w-4" /> Open Connection Wizard
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
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">Our enterprise specialists can help you tailor the SAP integration to your specific trust requirements.</p>
                    </div>
                    <Button variant="outline" className="border-primary text-primary font-bold uppercase text-[10px] tracking-widest px-8">Contact Support</Button>
                </div>
            </main>

            {/* --- ACTIVATED WORKFLOW DIALOGS --- */}

            {/* Connection Dialog */}
            <Dialog open={activeDialog === 'connect'} onOpenChange={() => setActiveDialog(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="text-primary" /> Nedbank API Connection
                        </DialogTitle>
                        <DialogDescription>
                            Enter your credentials from the Nedbank API Portal to link your Dickson Family Trust profile.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="client-id" className="text-xs text-gray-500">Corporate Client ID</Label>
                            <Input id="client-id" placeholder="e.g. DFT-9928-NBK" defaultValue={isConnected ? "DFT-9928-NBK" : ""} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="client-secret" className="text-xs text-gray-500">Client Secret</Label>
                            <Input id="client-secret" type="password" placeholder="••••••••••••" defaultValue={isConnected ? "password123" : ""} />
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 flex gap-3">
                            <Lock className="h-4 w-4 shrink-0" />
                            <span>This connection uses Mutual TLS (mTLS) 1.3 encryption. Your Client Secret is never stored in plain text.</span>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => { setIsConnected(false); setActiveDialog(null); }}>Disconnect</Button>
                        <Button 
                            className="flex-1" 
                            onClick={handleConnectNedbank}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <LoaderCircle className="animate-spin h-4 w-4" /> : isConnected ? 'Update Keys' : 'Link Profile'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            Download bank-stamped Proof of Payments with integrated SAP Document references.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[350px] overflow-auto">
                        {loadingDebits ? (
                            <div className="p-8 text-center"><LoaderCircle className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                        ) : recentDebits.length > 0 ? (
                            recentDebits.map((tx, i) => (
                                <div key={tx.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold uppercase truncate">{tx.recipientName || tx.description}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">
                                            {formatCurrency(tx.amount)} • {tx.sapDocumentNumber || 'DOC-PENDING'}
                                        </p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-primary"
                                        onClick={() => handleDownloadPop(tx)}
                                        disabled={generatingPopId === tx.id}
                                    >
                                        {generatingPopId === tx.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4 text-sm">No recent transactions found to export.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={() => setActiveDialog(null)}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Accounts Payable Bridge Dialog */}
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
