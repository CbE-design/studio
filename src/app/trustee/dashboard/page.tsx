
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, FileText, Users, Clock, ArrowRight, LogOut, LayoutDashboard, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore } from '@/firebase-provider';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { formatCurrency } from '@/app/lib/data';

export default function TrusteeDashboardPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [pendingCount, setPendingCount] = useState(0);
  const [managedTrusts, setManagedTrusts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const fetchTrusteeData = async () => {
      setIsLoading(true);
      try {
        // In this prototype, we assume the trustee manages the main demo trust
        const trustsSnap = await getDocs(collection(firestore, 'users'));
        const trusts = trustsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setManagedTrusts(trusts);

        let count = 0;
        for (const trust of trusts) {
          const accountsSnap = await getDocs(collection(firestore, 'users', trust.id, 'bankAccounts'));
          for (const acc of accountsSnap.docs) {
            const pendingSnap = await getDocs(query(
              collection(firestore, 'users', trust.id, 'bankAccounts', acc.id, 'transactions'),
              where('status', '==', 'PENDING_APPROVAL')
            ));
            count += pendingSnap.size;
          }
        }
        setPendingCount(count);
      } catch (e) {
        console.error("Failed to load trustee data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrusteeData();
  }, [firestore, user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/trustee/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/5 bg-[#141414] px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Trustee Portal</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Executive Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" className="text-gray-400 hover:text-red-400" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-[#141414] border-white/5 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Awaiting Signature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingCount}</div>
              <p className="text-xs text-gray-500 mt-1">Pending mandate verifications</p>
              <Button 
                className="w-full mt-4 bg-primary hover:bg-primary/90 font-bold"
                onClick={() => router.push('/trustee/authorizations')}
              >
                Open Mandate Center
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-white/5 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Managed Trusts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{managedTrusts.length}</div>
              <p className="text-xs text-gray-500 mt-1">Registered Trust mandates</p>
              <Button variant="outline" className="w-full mt-4 border-white/10 text-white hover:bg-white/5">
                View All Portfolios
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-white/5 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                Audits & Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">24</div>
              <p className="text-xs text-gray-500 mt-1">System events today</p>
              <Button variant="outline" className="w-full mt-4 border-white/10 text-white hover:bg-white/5">
                Download Audit Trail
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            Active Mandates
          </h2>
          <div className="bg-[#141414] border border-white/5 rounded-xl divide-y divide-white/5">
            {managedTrusts.map(trust => (
              <div key={trust.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-bold text-primary">
                    {trust.firstName?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p className="font-bold text-white">{trust.firstName || 'DICKSON FAMILY TRUST'}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{trust.id.substring(0, 12)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Enrolled
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-700 group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
