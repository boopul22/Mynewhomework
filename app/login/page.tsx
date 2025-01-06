'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to Student Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your personalized dashboard
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-50 border border-gray-300"
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