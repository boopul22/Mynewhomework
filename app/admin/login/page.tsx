'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LucideShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Get the ID token result to check admin claim
      const tokenResult = await user.getIdTokenResult();
      
      if (tokenResult.claims.admin) {
        router.push('/admin');
      } else {
        setError('Access denied. You do not have admin privileges.');
        await auth.signOut();
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md p-8 space-y-8 shadow-lg border-t-4 border-t-primary">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <LucideShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Login
          </h1>
          <p className="text-muted-foreground">
            Sign in with your Google account to access the admin panel
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="border-destructive/50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-6 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          disabled={loading}
          variant="outline"
        >
          <Image
            src="/google.svg"
            alt="Google logo"
            width={20}
            height={20}
            className="opacity-90"
          />
          <span className="text-base">
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </span>
        </Button>
      </Card>
    </div>
  );
} 