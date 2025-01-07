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

interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  role: string;
  lastLogin: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Switch
                    checked={user.isActive}
                    onCheckedChange={() => toggleUserStatus(user.id, user.isActive)}
                  />
                </TableCell>
                <TableCell>{user.lastLogin}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 