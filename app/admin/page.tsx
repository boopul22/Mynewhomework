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
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LucideUsers, LucideBarChart2, LucideSettings, LucideLogOut } from 'lucide-react';

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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your application settings and users
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => auth.signOut().then(() => router.push('/login'))}
              className="flex items-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LucideLogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <Card className="p-2">
            <TabsList className="grid w-full grid-cols-3 h-auto gap-4 bg-transparent">
              <TabsTrigger 
                value="users"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-4"
              >
                <LucideUsers className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-4"
              >
                <LucideBarChart2 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-4"
              >
                <LucideSettings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Card>

          <TabsContent value="users" className="mt-0">
            <Card className="p-6 shadow-lg border-t-4 border-t-primary">
              <UserManagement />
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <Card className="p-6 shadow-lg border-t-4 border-t-primary">
              <Analytics />
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <Card className="p-6 shadow-lg border-t-4 border-t-primary">
              <Settings />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 