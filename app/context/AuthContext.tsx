'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import type { UserProfile } from '@/types/index';
import { createUserProfile, getUserProfile } from '@/lib/user-service';
import { initializeUserCredits, checkAndRefillCredits } from '@/lib/credit-service';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        // Initialize credits if they don't exist
        if (!profile.credits) {
          await initializeUserCredits(user.uid);
          // Fetch updated profile
          const updatedProfile = await getUserProfile(user.uid);
          setUserProfile(updatedProfile);
          return;
        }
        await checkAndRefillCredits(user.uid);
        setUserProfile(profile);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Get or create user profile
        let profile = await getUserProfile(user.uid);
        
        if (!profile) {
          // Create new profile if it doesn't exist
          profile = await createUserProfile(user.uid, {
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
          });
        } else if (!profile.credits) {
          // Initialize credits if they don't exist
          await initializeUserCredits(user.uid);
          profile = await getUserProfile(user.uid);
        }
        
        // Check and refill credits
        await checkAndRefillCredits(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Set up periodic credit check
  useEffect(() => {
    if (!user) return;

    const checkCredits = async () => {
      await checkAndRefillCredits(user.uid);
      await refreshUserProfile();
    };

    // Check credits every hour
    const interval = setInterval(checkCredits, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshUserProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 