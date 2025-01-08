import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Crown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import type { SubscriptionSettings } from '@/types/index';
import { getSubscriptionSettings } from '@/lib/subscription-service';
import Link from 'next/link';

export default function SubscriptionStatus() {
  const { user, userProfile } = useAuth();
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSubscriptionInfo = async () => {
      try {
        const subscriptionSettings = await getSubscriptionSettings();
        if (mounted) {
          setSettings(subscriptionSettings);
        }
      } catch (error) {
        console.error('Error loading subscription information:', error);
      }
    };

    loadSubscriptionInfo();

    return () => {
      mounted = false;
    };
  }, []);

  if (!settings) return null;

  const currentPlan = userProfile?.subscription?.plan || 'free';
  const isActive = userProfile?.subscription?.status === 'active';
  const questionsLeft = userProfile?.subscription ? 
    Math.max(0, userProfile.subscription.questionsLimit - userProfile.subscription.questionsUsed) : 0;
  const planDetails = settings.plans.find(p => p.id === currentPlan);

  // Calculate days left in subscription or trial
  const endDate = userProfile?.subscription?.endDate ? new Date(userProfile.subscription.endDate) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {user ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crown className={`h-5 w-5 ${currentPlan === 'free' ? 'text-gray-400' : 'text-yellow-500'}`} />
                <div>
                  <h3 className="font-medium text-sm">{planDetails?.name || 'Free Plan'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {isActive ? `${daysLeft} days left` : 'Expired'}
                  </p>
                </div>
              </div>
              <Link href="/subscription">
                <Button variant="ghost" size="sm" className="text-xs">
                  {currentPlan === 'free' ? 'Upgrade' : 'Manage'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Daily Questions</span>
                <Badge variant={questionsLeft > 0 ? "secondary" : "destructive"} className="text-xs">
                  {questionsLeft} left
                </Badge>
              </div>
              <Progress 
                value={(questionsLeft / (userProfile?.subscription?.questionsLimit || 1)) * 100} 
                className="h-1.5" 
              />
            </div>

            {!isActive && (
              <div className="flex items-center space-x-2 text-amber-500 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-md text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Your subscription has expired</span>
              </div>
            )}

            {isActive && questionsLeft === 0 && (
              <div className="flex items-center space-x-2 text-amber-500 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-md text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>You've used all questions for today</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-gray-400" />
              <span className="text-sm">Start Free Trial</span>
            </div>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign Up
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 