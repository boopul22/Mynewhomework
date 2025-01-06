'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { UserProfile } from '@/types';
import { createUserProfile, getUserProfile } from '@/lib/user-service';

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
      setUserProfile(profile);
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
        }
        
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, refreshUserProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 