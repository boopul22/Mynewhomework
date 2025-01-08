'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import type { UserProfile } from '@/types/index';
import { createUserProfile, getUserProfile } from '@/lib/user-service';
import { initializeUserCredits, checkAndRefillCredits } from '@/lib/credit-service';
import { setCookie, deleteCookie } from 'cookies-next';

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
      try {
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
      } catch (error) {
        console.error('Error refreshing user profile:', error);
        // Don't set loading to false here to prevent access to protected routes
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Set authentication cookie when user is logged in
          setCookie('authenticated', 'true', {
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
          });

          // Get or create user profile
          let profile = await getUserProfile(user.uid);
          
          if (!profile) {
            // Create new profile if it doesn't exist
            profile = await createUserProfile(user.uid, {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
            });
          }
          
          if (!profile.credits) {
            // Initialize credits if they don't exist
            await initializeUserCredits(user.uid);
            profile = await getUserProfile(user.uid);
          }
          
          // Check and refill credits
          await checkAndRefillCredits(user.uid);
          setUserProfile(profile);
          setLoading(false);
        } catch (error) {
          console.error('Error initializing user profile:', error);
          // Keep loading true to prevent access to protected routes
          setLoading(true);
        }
      } else {
        // Remove authentication cookie when user is logged out
        deleteCookie('authenticated');
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up periodic credit check
  useEffect(() => {
    if (!user) return;

    const checkCredits = async () => {
      try {
        await checkAndRefillCredits(user.uid);
        await refreshUserProfile();
      } catch (error) {
        console.error('Error checking credits:', error);
      }
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