'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/context/AuthContext';
import { createUserProfile, getUserProfile } from '@/lib/user-service';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Check if user profile exists, if not create one
        try {
          const profile = await getUserProfile(result.user.uid);
          if (!profile) {
            // Create new user profile
            await createUserProfile(result.user.uid, {
              uid: result.user.uid,
              email: result.user.email || '',
              displayName: result.user.displayName || '',
              photoURL: result.user.photoURL || '',
            });
          }
        } catch (error) {
          // If error is "document not found", create new profile
          await createUserProfile(result.user.uid, {
            uid: result.user.uid,
            email: result.user.email || '',
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || '',
          });
        }
        
        // Force a hard navigation to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if we're redirecting
  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Student Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to access your personalized dashboard
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
          >
            <img
              src="/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </div>
      </div>
    </div>
  );
} 