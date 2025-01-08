'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { db } from '@/app/firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { addCredits } from '@/lib/credit-service';
import type { UserProfile } from '@/types/index';

interface User extends UserProfile {
  id: string;
  isActive: boolean;
  role: string;
  lastLogin: string;
}

interface CreditDialogProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

function CreditDialog({ user, onClose, onUpdate }: CreditDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleUpdateCredits = async () => {
    try {
      setLoading(true);
      await addCredits(user.id, amount, true);
      toast({
        title: 'Credits Updated',
        description: `Successfully updated credits for ${user.email}`,
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating credits:', error);
      toast({
        title: 'Error',
        description: 'Failed to update credits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Modify Credits - {user.email}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Current Credits</div>
          <Badge variant="secondary">
            {user.credits?.remaining ?? 0} credits
          </Badge>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Add/Remove Credits</label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount (negative to remove)"
            />
            <Button onClick={handleUpdateCredits} disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a positive number to add credits or a negative number to remove credits.
          </p>
        </div>
      </div>
    </DialogContent>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreditDialog, setShowCreditDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as User));
      setUsers(userList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus,
      });
      await fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleModifyCredits = (user: User) => {
    setSelectedUser(user);
    setShowCreditDialog(true);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search users..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            {/* Add user form would go here */}
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {user.credits?.remaining ?? 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.isActive}
                    onCheckedChange={() => toggleUserStatus(user.id, user.isActive)}
                  />
                </TableCell>
                <TableCell>{user.lastLogin}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleModifyCredits(user)}
                    >
                      Modify Credits
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showCreditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreditDialog(false);
          setSelectedUser(null);
        }
      }}>
        {selectedUser && (
          <CreditDialog
            user={selectedUser}
            onClose={() => {
              setShowCreditDialog(false);
              setSelectedUser(null);
            }}
            onUpdate={fetchUsers}
          />
        )}
      </Dialog>
    </div>
  );
} 