
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, LoaderCircle, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/app/lib/firebase';
import type { UserRecord } from 'firebase-admin/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function AdminUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const getAllUsersFn = httpsCallable(functions, 'getAllUsers');
        const result = await getAllUsersFn();
        const data = result.data as { success: boolean, users?: UserRecord[], message?: string };

        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          throw new Error(data.message || 'Failed to fetch users.');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Failed to Fetch Users',
          description: error.message || 'An unexpected error occurred.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);
  
  const getInitials = (name: string | undefined) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length-1]) {
      return `${names[0][0]}${names[names.length-1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="gradient-background text-primary-foreground p-4 flex items-center shadow-sm sticky top-0 z-10 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Users />
          Manage Users
        </h1>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {users.map(user => (
              <div key={user.uid} className="bg-white p-4 rounded-lg border flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <Avatar className="h-12 w-12 border">
                        <AvatarFallback className="text-lg bg-gray-100 text-primary font-semibold">
                            {getInitials(user.displayName)}
                        </AvatarFallback>
                    </Avatar>
                  <div>
                    <p className="font-semibold">{user.displayName || 'No Name'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                 <Button variant="outline" size="sm">View Details</Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
