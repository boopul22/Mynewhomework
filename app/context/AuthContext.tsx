'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/app/firebase/config';
import type { UserProfile } from '@/types/index';
import { initializeUserSubscription } from '@/lib/subscription-service';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshUserProfile: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.email} logged in` : 'User logged out');
      setUser(user);
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Initialize subscription for new users
        console.log('Initializing user subscription...');
        await initializeUserSubscription(user.uid);

        // Listen to user profile changes
        console.log('Setting up profile listener...');
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(userRef, (doc) => {
          console.log('Profile updated:', doc.exists() ? 'Profile exists' : 'No profile');
          if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error listening to profile:', error);
          setLoading(false);
        });

        return () => {
          console.log('Cleaning up profile listener...');
          unsubscribeProfile();
        };
      } catch (error) {
        console.error('Error in auth effect:', error);
        setLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth state listener...');
      unsubscribe();
    };
  }, []);

  const refreshUserProfile = () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        }
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 