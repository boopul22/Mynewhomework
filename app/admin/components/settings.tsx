'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { getCreditSettings, updateCreditSettings } from '@/lib/credit-service';
import { CreditSettings, CreditPurchaseOption } from '@/types';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  
  // System settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    maxUploadSize: '10',
    defaultLanguage: 'en',
    sessionTimeout: '30',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    userRegistration: true,
    systemAlerts: true,
    weeklyReports: true,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordExpiry: '90',
    minPasswordLength: '8',
    loginAttempts: '3',
  });

  // Credit settings
  const [creditSettings, setCreditSettings] = useState<CreditSettings>({
    guestCredits: 5,
    defaultUserCredits: 20,
    refillAmount: 5,
    refillPeriod: 7,
    maxCredits: 100,
    purchaseOptions: []
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getCreditSettings();
        setCreditSettings(settings);
      } catch (error) {
        console.error('Error loading credit settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load credit settings',
          variant: 'destructive',
        });
      }
    };

    loadSettings();
  }, []);

  const handleSystemSettingChange = (key: string, value: string | boolean) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNotificationSettingChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSecuritySettingChange = (key: string, value: string | boolean) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreditSettingChange = (key: keyof CreditSettings, value: unknown) => {
    setCreditSettings((prev: CreditSettings) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await updateCreditSettings(creditSettings);
      toast({
        title: 'Settings saved',
        description: 'Your changes have been successfully saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Settings</h2>
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <Switch
                id="maintenance-mode"
                checked={systemSettings.maintenanceMode}
                onCheckedChange={(checked) => handleSystemSettingChange('maintenanceMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="debug-mode">Debug Mode</Label>
              <Switch
                id="debug-mode"
                checked={systemSettings.debugMode}
                onCheckedChange={(checked) => handleSystemSettingChange('debugMode', checked)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="max-upload">Maximum Upload Size (MB)</Label>
              <Input
                id="max-upload"
                value={systemSettings.maxUploadSize}
                onChange={(e) => handleSystemSettingChange('maxUploadSize', e.target.value)}
                type="number"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="language">Default Language</Label>
              <Select
                value={systemSettings.defaultLanguage}
                onValueChange={(value) => handleSystemSettingChange('defaultLanguage', value)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch
                id="email-notifications"
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => handleNotificationSettingChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="user-registration">User Registration Alerts</Label>
              <Switch
                id="user-registration"
                checked={notificationSettings.userRegistration}
                onCheckedChange={(checked) => handleNotificationSettingChange('userRegistration', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="system-alerts">System Alerts</Label>
              <Switch
                id="system-alerts"
                checked={notificationSettings.systemAlerts}
                onCheckedChange={(checked) => handleNotificationSettingChange('systemAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <Switch
                id="weekly-reports"
                checked={notificationSettings.weeklyReports}
                onCheckedChange={(checked) => handleNotificationSettingChange('weeklyReports', checked)}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa">Two-Factor Authentication</Label>
              <Switch
                id="2fa"
                checked={securitySettings.twoFactorAuth}
                onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorAuth', checked)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password-expiry">Password Expiry (days)</Label>
              <Input
                id="password-expiry"
                value={securitySettings.passwordExpiry}
                onChange={(e) => handleSecuritySettingChange('passwordExpiry', e.target.value)}
                type="number"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="min-password">Minimum Password Length</Label>
              <Input
                id="min-password"
                value={securitySettings.minPasswordLength}
                onChange={(e) => handleSecuritySettingChange('minPasswordLength', e.target.value)}
                type="number"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="login-attempts">Maximum Login Attempts</Label>
              <Input
                id="login-attempts"
                value={securitySettings.loginAttempts}
                onChange={(e) => handleSecuritySettingChange('loginAttempts', e.target.value)}
                type="number"
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Credit System Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Guest Credits</Label>
              <Input
                type="number"
                value={creditSettings.guestCredits}
                onChange={(e) => handleCreditSettingChange('guestCredits', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Default User Credits</Label>
              <Input
                type="number"
                value={creditSettings.defaultUserCredits}
                onChange={(e) => handleCreditSettingChange('defaultUserCredits', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Refill Amount</Label>
              <Input
                type="number"
                value={creditSettings.refillAmount}
                onChange={(e) => handleCreditSettingChange('refillAmount', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Refill Period (days)</Label>
              <Input
                type="number"
                value={creditSettings.refillPeriod}
                onChange={(e) => handleCreditSettingChange('refillPeriod', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum Credits</Label>
              <Input
                type="number"
                value={creditSettings.maxCredits}
                onChange={(e) => handleCreditSettingChange('maxCredits', parseInt(e.target.value))}
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <Label>Purchase Options</Label>
            {creditSettings.purchaseOptions.map((option: CreditPurchaseOption, index: number) => (
              <div key={option.id} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  placeholder="Credits"
                  type="number"
                  value={option.credits}
                  onChange={(e) => {
                    const newOptions = [...creditSettings.purchaseOptions];
                    newOptions[index] = { ...option, credits: parseInt(e.target.value) };
                    handleCreditSettingChange('purchaseOptions', newOptions);
                  }}
                />
                <Input
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  value={option.price}
                  onChange={(e) => {
                    const newOptions = [...creditSettings.purchaseOptions];
                    newOptions[index] = { ...option, price: parseFloat(e.target.value) };
                    handleCreditSettingChange('purchaseOptions', newOptions);
                  }}
                />
                <Input
                  placeholder="Description"
                  value={option.description}
                  onChange={(e) => {
                    const newOptions = [...creditSettings.purchaseOptions];
                    newOptions[index] = { ...option, description: e.target.value };
                    handleCreditSettingChange('purchaseOptions', newOptions);
                  }}
                />
                <Button
                  variant="destructive"
                  onClick={() => {
                    const newOptions = creditSettings.purchaseOptions.filter((_: CreditPurchaseOption, i: number) => i !== index);
                    handleCreditSettingChange('purchaseOptions', newOptions);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                const newOption = {
                  id: Date.now().toString(),
                  credits: 0,
                  price: 0,
                  currency: 'USD',
                  description: ''
                };
                handleCreditSettingChange('purchaseOptions', [...creditSettings.purchaseOptions, newOption]);
              }}
            >
              Add Purchase Option
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
} 