'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/context/AuthContext';
import { LogOut, User } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/app/firebase/config';

export function Header() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
      {user ? (
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
} 