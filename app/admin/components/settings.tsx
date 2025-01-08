'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { getSubscriptionSettings, updateSubscriptionSettings } from '@/lib/subscription-service';
import type { SubscriptionSettings, SubscriptionPlan } from '@/types/index';

export default function Settings() {
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const subscriptionSettings = await getSubscriptionSettings();
      setSettings(subscriptionSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await updateSubscriptionSettings(settings);
      
      // Reload settings to ensure we have the latest data
      await loadSettings();
      
      toast({
        title: 'Success',
        description: 'Subscription settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addNewPlan = () => {
    if (!settings) return;

    const newPlan: SubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: 'New Plan',
      price: 0,
      interval: 'month',
      features: ['New feature'],
      questionsPerDay: 10,
      subjects: 'limited',
      aiModel: 'standard'
    };

    setSettings({
      ...settings,
      plans: [...settings.plans, newPlan]
    });
  };

  const removePlan = (planId: string) => {
    if (!settings) return;
    if (planId === 'free') {
      toast({
        title: 'Cannot Remove Free Plan',
        description: 'The free plan is required and cannot be removed.',
        variant: 'destructive',
      });
      return;
    }

    setSettings({
      ...settings,
      plans: settings.plans.filter(p => p.id !== planId)
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>Configure subscription plans and features</CardDescription>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <span className="mr-2">Saving...</span>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </>
              ) : 'Save Changes'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !settings ? (
            <div className="text-center py-8 text-muted-foreground">
              Error loading settings. Please refresh the page.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label>Trial Period (Days)</Label>
                  <Input
                    type="number"
                    value={settings.trialDays}
                    onChange={(e) => setSettings({
                      ...settings,
                      trialDays: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div>
                  <Label>Default Plan</Label>
                  <Select
                    value={settings.defaultPlan}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      defaultPlan: value as 'free'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Subscription Plans</h3>
                  <Button onClick={addNewPlan} variant="outline" size="sm">
                    Add New Plan
                  </Button>
                </div>

                {settings.plans.map((plan, index) => (
                  <Card key={plan.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-4 flex-1">
                          <div>
                            <Label>Plan Name</Label>
                            <Input
                              value={plan.name}
                              onChange={(e) => {
                                const newPlans = [...settings.plans];
                                newPlans[index] = {
                                  ...plan,
                                  name: e.target.value
                                };
                                setSettings({
                                  ...settings,
                                  plans: newPlans
                                });
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Price (USD)</Label>
                              <Input
                                type="number"
                                value={plan.price}
                                onChange={(e) => {
                                  const newPlans = [...settings.plans];
                                  newPlans[index] = {
                                    ...plan,
                                    price: parseFloat(e.target.value)
                                  };
                                  setSettings({
                                    ...settings,
                                    plans: newPlans
                                  });
                                }}
                              />
                            </div>

                            <div>
                              <Label>Questions per Day</Label>
                              <Input
                                type="number"
                                value={plan.questionsPerDay === Infinity ? 999999 : plan.questionsPerDay}
                                onChange={(e) => {
                                  const newPlans = [...settings.plans];
                                  newPlans[index] = {
                                    ...plan,
                                    questionsPerDay: parseInt(e.target.value) === 999999 ? Infinity : parseInt(e.target.value)
                                  };
                                  setSettings({
                                    ...settings,
                                    plans: newPlans
                                  });
                                }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Billing Interval</Label>
                              <Select
                                value={plan.interval}
                                onValueChange={(value) => {
                                  const newPlans = [...settings.plans];
                                  newPlans[index] = {
                                    ...plan,
                                    interval: value as 'month' | 'year'
                                  };
                                  setSettings({
                                    ...settings,
                                    plans: newPlans
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="month">Monthly</SelectItem>
                                  <SelectItem value="year">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>AI Model</Label>
                              <Select
                                value={plan.aiModel}
                                onValueChange={(value) => {
                                  const newPlans = [...settings.plans];
                                  newPlans[index] = {
                                    ...plan,
                                    aiModel: value as 'standard' | 'advanced'
                                  };
                                  setSettings({
                                    ...settings,
                                    plans: newPlans
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>Features (one per line)</Label>
                            <textarea
                              className="w-full min-h-[100px] p-2 border rounded-md"
                              value={plan.features.join('\n')}
                              onChange={(e) => {
                                const newPlans = [...settings.plans];
                                newPlans[index] = {
                                  ...plan,
                                  features: e.target.value.split('\n').filter(f => f.trim())
                                };
                                setSettings({
                                  ...settings,
                                  plans: newPlans
                                });
                              }}
                            />
                          </div>
                        </div>

                        {plan.id !== 'free' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removePlan(plan.id)}
                            className="ml-4"
                          >
                            Remove Plan
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 