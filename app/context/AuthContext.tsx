'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import type { UserProfile } from '@/types/index';
import { createUserProfile, getUserProfile } from '@/lib/user-service';
import { initializeUserCredits, checkAndRefillCredits } from '@/lib/credit-service';
import { setCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isPublicRoute: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isPublicRoute: true,
  refreshUserProfile: async () => {},
});

// Helper function to check if a path is a public route
const isPublicRoute = (path: string) => {
  const publicPaths = ['/', '/about', '/contact', '/features'];
  return publicPaths.includes(path);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const router = useRouter();

  // Update isPublic state based on current path
  useEffect(() => {
    const updatePublicState = () => {
      setIsPublic(isPublicRoute(window.location.pathname));
    };
    
    // Update initially
    updatePublicState();

    // Update on route changes
    window.addEventListener('popstate', updatePublicState);
    return () => window.removeEventListener('popstate', updatePublicState);
  }, []);

  const refreshUserProfile = async () => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          if (!profile.credits) {
            await initializeUserCredits(user.uid);
            const updatedProfile = await getUserProfile(user.uid);
            setUserProfile(updatedProfile);
            return;
          }
          await checkAndRefillCredits(user.uid);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          setCookie('authenticated', 'true', {
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
          });

          let profile = await getUserProfile(user.uid);
          
          if (!profile) {
            profile = await createUserProfile(user.uid, {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
            });
          }
          
          if (!profile.credits) {
            await initializeUserCredits(user.uid);
            profile = await getUserProfile(user.uid);
          }
          
          await checkAndRefillCredits(user.uid);
          setUserProfile(profile);
          setLoading(false);

          // Only redirect from login page
          const currentPath = window.location.pathname;
          if (currentPath === '/login') {
            router.push('/');
          }
        } catch (error) {
          console.error('Error initializing user profile:', error);
          setLoading(false); // Still set loading to false for public routes
        }
      } else {
        deleteCookie('authenticated');
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

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

    const interval = setInterval(checkCredits, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      isPublicRoute: isPublic,
      refreshUserProfile 
    }}>
      {(!loading || isPublic) && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 