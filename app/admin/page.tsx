'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from './components/user-management';
import Analytics from './components/analytics';
import Settings from './components/settings';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/firebase/config';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Here you would typically verify admin status from your backend
      const token = await user.getIdTokenResult();
      if (!token.claims.admin) {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdminStatus();
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button
          variant="outline"
          onClick={() => auth.signOut().then(() => router.push('/login'))}
        >
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="p-6">
            <UserManagement />
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <Analytics />
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6">
            <Settings />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 