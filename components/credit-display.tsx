import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Coins, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import type { CreditSettings, CreditPurchaseOption } from '@/types/index';
import { getCreditSettings, getGuestCredits, useCredits, initializeUserCredits } from '@/lib/credit-service';
import { toast } from '@/components/ui/use-toast';

export default function CreditDisplay() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [settings, setSettings] = useState<CreditSettings | null>(null);
  const [guestCredits, setGuestCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCreditInfo = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        const creditSettings = await getCreditSettings();
        
        if (!mounted) return;
        setSettings(creditSettings);
        
        if (!user) {
          const guestCreditCount = await getGuestCredits();
          if (!mounted) return;
          setGuestCredits(guestCreditCount);
        }
      } catch (error) {
        console.error('Error loading credit information:', error);
        if (!mounted) return;
        toast({
          title: 'Error',
          description: 'Failed to load credit information',
          variant: 'destructive',
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCreditInfo();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Separate effect for handling credit initialization
  useEffect(() => {
    let mounted = true;

    const initializeCreditsIfNeeded = async () => {
      if (!user || !userProfile || userProfile.credits) return;

      try {
        await initializeUserCredits(user.uid);
        if (mounted) {
          await refreshUserProfile();
        }
      } catch (error) {
        console.error('Error initializing credits:', error);
        if (mounted) {
          toast({
            title: 'Error',
            description: 'Failed to initialize credits',
            variant: 'destructive',
          });
        }
      }
    };

    initializeCreditsIfNeeded();

    return () => {
      mounted = false;
    };
  }, [user, userProfile, refreshUserProfile]);

  const handlePurchase = async (option: CreditPurchaseOption) => {
    toast({
      title: 'Coming Soon',
      description: 'Credit purchase functionality will be available soon!',
    });
  };

  // Show loading only when we don't have the necessary data
  const isLoading = loading || (user && !userProfile) || (!user && guestCredits === null) || !settings;

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const credits = user ? userProfile?.credits?.remaining ?? 0 : guestCredits ?? 0;
  // Get the appropriate max credits based on user type and actual credits
  const maxCredits = user ? Math.max(userProfile?.credits?.remaining ?? 0, settings?.maxCredits ?? 100) : settings?.guestCredits ?? 5;
  const progress = (credits / maxCredits) * 100;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Credits</CardTitle>
          <Coins className="h-6 w-6 text-yellow-500" />
        </div>
        <CardDescription>
          {user ? `Logged in user credits` : `Guest credits (Max: ${maxCredits})`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Available Credits</span>
            <Badge variant="secondary">{credits}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {credits === 0 && (
          <div className="flex items-center space-x-2 text-amber-500 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">You've run out of credits!</span>
          </div>
        )}

        {!user && credits && credits <= 2 && (
          <div className="flex items-center space-x-2 text-amber-500 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Sign up to get {settings?.defaultUserCredits} credits!</span>
          </div>
        )}

        {user && settings?.purchaseOptions && (
          <div className="space-y-3">
            <h4 className="font-semibold">Purchase More Credits</h4>
            <div className="grid gap-2">
              {settings.purchaseOptions.map((option: CreditPurchaseOption) => (
                <Button
                  key={option.id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handlePurchase(option)}
                >
                  <span>{option.description}</span>
                  <span className="font-semibold">${option.price}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {!user && (
        <CardFooter>
          <Button className="w-full" variant="default" onClick={() => window.location.href = '/login'}>
            Sign Up for More Credits
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 