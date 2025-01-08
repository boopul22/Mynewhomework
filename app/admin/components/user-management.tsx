'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '@/app/firebase/config';
import { updateUserSubscription } from '@/lib/subscription-service';
import { useAuth } from '@/app/context/AuthContext';
import type { UserProfile } from '@/types/index';

interface UserData extends UserProfile {
  docId: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, userProfile } = useAuth();

  useEffect(() => {
    // Check if user is admin before loading data
    if (userProfile?.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
        variant: 'destructive',
      });
      return;
    }
    loadUsers();
  }, [userProfile]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      
      const usersData = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        // Get user auth data to ensure we have the latest email
        const userRef = doc(db, 'users', docSnapshot.id);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        
        // Type assertion for Firestore data
        const userDataTyped = userData as Partial<UserProfile>;
        const dataTyped = data as Partial<UserProfile>;
        
        return {
          docId: docSnapshot.id,
          uid: docSnapshot.id,
          email: userDataTyped.email || dataTyped.email || 'No Email',
          displayName: userDataTyped.displayName || dataTyped.displayName || 'No Name',
          photoURL: userDataTyped.photoURL || dataTyped.photoURL || '',
          role: userDataTyped.role || dataTyped.role || 'user',
          subscription: {
            plan: userDataTyped.subscription?.plan || dataTyped.subscription?.plan || 'free',
            status: userDataTyped.subscription?.status || dataTyped.subscription?.status || 'active',
            startDate: userDataTyped.subscription?.startDate || dataTyped.subscription?.startDate || new Date().toISOString(),
            endDate: userDataTyped.subscription?.endDate || dataTyped.subscription?.endDate || new Date().toISOString(),
            questionsUsed: userDataTyped.subscription?.questionsUsed || dataTyped.subscription?.questionsUsed || 0,
            questionsLimit: userDataTyped.subscription?.questionsLimit || dataTyped.subscription?.questionsLimit || 3
          },
          progress: userDataTyped.progress || dataTyped.progress || {
            weeklyGoal: 0,
            weeklyProgress: 0
          },
          stats: userDataTyped.stats || dataTyped.stats || {
            attendance: { present: 0, total: 0 },
            homework: { completed: 0, total: 0 },
            rating: 0
          }
        } as UserData;
      }));
      
      // Sort users by email for better organization
      const sortedUsers = usersData.sort((a, b) => {
        if (a.email === 'No Email') return 1;
        if (b.email === 'No Email') return -1;
        return a.email.localeCompare(b.email);
      });
      
      setUsers(sortedUsers);
      console.log('Loaded users:', sortedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (uid: string, plan: UserProfile['subscription']['plan']) => {
    try {
      await updateUserSubscription(uid, plan);
      
      // Update local state
      setUsers(users.map(user => {
        if (user.docId === uid) {
          return {
            ...user,
            subscription: {
              ...user.subscription,
              plan,
              status: 'active'
            }
          };
        }
        return user;
      }));

      toast({
        title: 'Success',
        description: 'User subscription updated successfully',
      });

      // Reload users to get fresh data
      await loadUsers();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user subscription',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => 
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // If not admin, show access denied
  if (userProfile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-center text-destructive">Access Denied</h2>
            <p className="text-center mt-2">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>User Management ({users.length} Users)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Search Users</Label>
            <Input
              placeholder="Search by email or name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.docId} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-card-foreground">
                          {user.displayName !== 'No Name' ? user.displayName : 'No Name'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.email !== 'No Email' ? user.email : 'No Email'}
                        </p>
                        <p className="text-sm text-card-foreground">
                          Current Plan: {user.subscription?.plan || 'free'}
                          {user.subscription?.status === 'active' && ' (Active)'}
                          {user.subscription?.status === 'cancelled' && ' (Cancelled)'}
                          {user.subscription?.status === 'expired' && ' (Expired)'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Questions Used: {user.subscription?.questionsUsed || 0} / {user.subscription?.questionsLimit || 3}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={user.subscription?.plan || 'free'}
                          onValueChange={(value: UserProfile['subscription']['plan']) => 
                            handleUpdateSubscription(user.docId, value)
                          }
                        >
                          <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free Plan</SelectItem>
                            <SelectItem value="homework-helper">Homework Helper</SelectItem>
                            <SelectItem value="homework-helper-essay">Homework Helper + Essay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 