'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/context/AuthContext';
import { createUserProfile } from '@/lib/user-service';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const router = useRouter();
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthInitialized(true);
      if (user) {
        console.log('User is already signed in:', user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  // Redirect if already logged in and profile is loaded
  useEffect(() => {
    if (user && userProfile) {
      console.log('Redirecting authenticated user to dashboard');
      router.push('/');
    }
  }, [user, userProfile, router]);

  const handleSignIn = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      console.log('Initiating Google sign-in...');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        const { uid, email, displayName, photoURL } = result.user;
        console.log('Successfully authenticated user:', email);
        
        if (!email) {
          throw new Error('No email provided from Google Auth');
        }
        
        try {
          // Create user profile
          console.log('Creating user profile...');
          await createUserProfile(uid, {
            uid,
            email,
            displayName: displayName || email.split('@')[0],
            photoURL: photoURL || '',
          });
          
          console.log('User profile created, redirecting to dashboard...');
          router.push('/');
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          alert('Failed to create user profile. Please try again.');
          // Sign out the user if profile creation fails
          await auth.signOut();
        }
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Please enable popups for this site to sign in with Google.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything until auth is initialized
  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Don't render login page if user is already authenticated
  if (user && userProfile) return null;

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
            onClick={handleSignIn}
            disabled={loading}
            variant="outline"
            className="w-full h-12 flex items-center justify-center gap-3"
          >
            <img
              src="/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-base font-medium">
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
} 