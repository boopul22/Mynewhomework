import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, AlertCircle, Loader2, Crown, Zap, BookOpen } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import type { SubscriptionSettings, SubscriptionPlan } from '@/types/index';
import { getSubscriptionSettings, updateUserSubscription } from '@/lib/subscription-service';
import { toast } from '@/components/ui/use-toast';

const FEATURE_ICONS = {
  'questions': Zap,
  'subjects': BookOpen,
  'model': Crown,
} as const;

export default function SubscriptionDisplay() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearlyBilling, setYearlyBilling] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSubscriptionInfo = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        const subscriptionSettings = await getSubscriptionSettings();
        
        if (!mounted) return;
        setSettings(subscriptionSettings);
      } catch (error) {
        console.error('Error loading subscription information:', error);
        if (!mounted) return;
        toast({
          title: 'Error',
          description: 'Failed to load subscription information',
          variant: 'destructive',
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSubscriptionInfo();

    return () => {
      mounted = false;
    };
  }, [user]);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    toast({
      title: 'Coming Soon',
      description: 'Subscription functionality will be available soon!',
    });
  };

  if (loading) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  const currentPlan = userProfile?.subscription?.plan || 'free';
  const isActive = userProfile?.subscription?.status === 'active';
  const endDate = userProfile?.subscription?.endDate ? new Date(userProfile.subscription.endDate) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Choose Your Plan</CardTitle>
        <CardDescription className="max-w-md mx-auto mt-2">
          Get the help you need with your homework. Choose the plan that best fits your needs.
        </CardDescription>
        <div className="flex items-center justify-center mt-6 space-x-3">
          <span className={`text-sm ${!yearlyBilling ? 'font-medium' : ''}`}>Monthly</span>
          <Switch
            checked={yearlyBilling}
            onCheckedChange={setYearlyBilling}
          />
          <span className={`text-sm ${yearlyBilling ? 'font-medium' : ''}`}>
            Yearly
            <Badge variant="secondary" className="ml-2 font-normal">Save 20%</Badge>
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {user && isActive && (
          <div className="bg-secondary/50 p-4 rounded-lg text-center mb-8">
            <h3 className="font-medium">
              Current Plan: {settings.plans.find(p => p.id === currentPlan)?.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {daysLeft > 0 ? `${daysLeft} days remaining` : 'Subscription expired'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {settings.plans.map((plan) => {
            const price = yearlyBilling ? plan.price * 12 * 0.8 : plan.price;
            const isCurrentPlan = currentPlan === plan.id && isActive;
            const popularPlan = plan.id === 'homework-helper';

            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden border-2 ${
                  isCurrentPlan 
                    ? 'border-primary' 
                    : popularPlan 
                    ? 'border-blue-500/50 dark:border-blue-400/50' 
                    : 'border-transparent'
                }`}
              >
                {popularPlan && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs transform translate-x-8 translate-y-4 rotate-45">
                    Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Current Plan</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className={`h-5 w-5 ${plan.id === 'free' ? 'text-gray-400' : 'text-yellow-500'}`} />
                    <span>{plan.name}</span>
                  </CardTitle>
                  <CardDescription className="min-h-[40px]">
                    {plan.id === 'free' && 'Perfect for trying out the service'}
                    {plan.id === 'homework-helper' && 'Most popular for regular homework help'}
                    {plan.id === 'homework-helper-essay' && 'Best value for comprehensive support'}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">${price.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        /{yearlyBilling ? 'year' : 'month'}
                      </span>
                    </div>
                    {yearlyBilling && (
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        ${(price / 12).toFixed(2)} per month, billed yearly
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => {
                      const [value, ...descParts] = feature.split(' ');
                      const description = descParts.join(' ');
                      const icon = FEATURE_ICONS[
                        description.includes('questions') 
                          ? 'questions' 
                          : description.includes('subjects') 
                          ? 'subjects'
                          : 'model'
                      ];
                      const Icon = icon;

                      return (
                        <li key={i} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm">
                            <strong>{value}</strong> {description}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={popularPlan ? "default" : "outline"}
                    disabled={isCurrentPlan}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Get Started'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {!user && (
          <div className="flex items-center justify-center space-x-2 text-amber-500 bg-amber-50 dark:bg-amber-950/50 p-4 rounded-lg mt-8">
            <AlertCircle className="h-5 w-5" />
            <span>Sign up now to start your {settings.trialDays}-day free trial!</span>
          </div>
        )}
      </CardContent>

      {!user && (
        <CardFooter>
          <Button 
            className="w-full max-w-md mx-auto" 
            size="lg"
            onClick={() => window.location.href = '/login'}
          >
            Start Free Trial
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 