import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Switch,
  Divider,
  Select,
  SelectItem,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  Bell,
  Mail,
  Phone,
  Shield,
  Globe,
  Palette,
  Save,
  Smartphone,
} from "lucide-react";
import { successToast, errorToast } from "~/components/toast";

interface Settings {
  notifications: {
    email: {
      orderUpdates: boolean;
      promotions: boolean;
      newsletter: boolean;
      security: boolean;
    };
    push: {
      orderUpdates: boolean;
      promotions: boolean;
      reminders: boolean;
    };
    sms: {
      orderUpdates: boolean;
      security: boolean;
    };
  };
  preferences: {
    language: string;
    currency: string;
    timezone: string;
    theme: string;
  };
  privacy: {
    profileVisibility: string;
    dataCollection: boolean;
    marketing: boolean;
    analytics: boolean;
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: {
        orderUpdates: true,
        promotions: true,
        newsletter: false,
        security: true,
      },
      push: {
        orderUpdates: true,
        promotions: false,
        reminders: true,
      },
      sms: {
        orderUpdates: true,
        security: true,
      },
    },
    preferences: {
      language: "en",
      currency: "USD",
      timezone: "America/New_York",
      theme: "system",
    },
    privacy: {
      profileVisibility: "private",
      dataCollection: true,
      marketing: false,
      analytics: true,
    },
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, this would save to an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem("userSettings", JSON.stringify(settings));
      successToast("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      errorToast("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSetting = (category: keyof Settings['notifications'], key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [category]: {
          ...prev.notifications[category],
          [key]: value,
        },
      },
    }));
  };

  const updatePreference = (key: keyof Settings['preferences'], value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const updatePrivacySetting = (key: keyof Settings['privacy'], value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account preferences and notifications
          </p>
        </div>

        <Tabs aria-label="Settings sections" className="w-full">
          <Tab key="notifications" title="Notifications">
            <div className="space-y-6">
              {/* Email Notifications */}
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <Mail size={20} />
                  <h3 className="text-lg font-semibold">Email Notifications</h3>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Order Updates
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive emails about order status changes
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.notifications.email.orderUpdates}
                      onValueChange={(value) => updateNotificationSetting('email', 'orderUpdates', value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Promotions & Deals
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get notified about sales and special offers
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.notifications.email.promotions}
                      onValueChange={(value) => updateNotificationSetting('email', 'promotions', value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Newsletter
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Subscribe to our weekly newsletter
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.notifications.email.newsletter}
                      onValueChange={(value) => updateNotificationSetting('email', 'newsletter', value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Security Alerts
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Important security notifications
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.notifications.email.security}
                      onValueChange={(value) => updateNotificationSetting('email', 'security', value)}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Push Notifications */}
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <Bell size={20} />
                  <h3 className="text-lg font-semibold">Push Notifications</h3>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Order Updates
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get push notifications for order changes
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.notifications.push.orderUpdates}
                      onValueChange={(value) => updateNotificationSetting('push', 'orderUpdates', value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Promotions
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Push notifications for deals and offers
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.notifications.push.promotions}
                      onValueChange={(value) => updateNotificationSetting('push', 'promotions', value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Reminders
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cart abandonment and wishlist reminders
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.notifications.push.reminders}
                      onValueChange={(value) => updateNotificationSetting('push', 'reminders', value)}
                    />
                  </div>
                </CardBody>
              </Card>

              {/* SMS Notifications */}
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <Smartphone size={20} />
                  <h3 className="text-lg font-semibold">SMS Notifications</h3>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Order Updates
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SMS notifications for critical order updates
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.notifications.sms.orderUpdates}
                      onValueChange={(value) => updateNotificationSetting('sms', 'orderUpdates', value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Security Alerts
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SMS for important security notifications
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.notifications.sms.security}
                      onValueChange={(value) => updateNotificationSetting('sms', 'security', value)}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="preferences" title="Preferences">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <Globe size={20} />
                  <h3 className="text-lg font-semibold">Language & Region</h3>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                  <Select
                    label="Language"
                    value={settings.preferences.language}
                    onChange={(e) => updatePreference('language', e.target.value)}
                  >
                    <SelectItem key="en" value="en">English</SelectItem>
                    <SelectItem key="es" value="es">Spanish</SelectItem>
                    <SelectItem key="fr" value="fr">French</SelectItem>
                    <SelectItem key="de" value="de">German</SelectItem>
                  </Select>
                  
                  <Select
                    label="Currency"
                    value={settings.preferences.currency}
                    onChange={(e) => updatePreference('currency', e.target.value)}
                  >
                    <SelectItem key="USD" value="USD">USD - US Dollar</SelectItem>
                    <SelectItem key="EUR" value="EUR">EUR - Euro</SelectItem>
                    <SelectItem key="GBP" value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem key="GHS" value="GHS">GHS - Ghanaian Cedi</SelectItem>
                  </Select>
                  
                  <Select
                    label="Timezone"
                    value={settings.preferences.timezone}
                    onChange={(e) => updatePreference('timezone', e.target.value)}
                  >
                    <SelectItem key="America/New_York" value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem key="America/Chicago" value="America/Chicago">Central Time</SelectItem>
                    <SelectItem key="America/Denver" value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem key="America/Los_Angeles" value="America/Los_Angeles">Pacific Time</SelectItem>
                  </Select>
                </CardBody>
              </Card>

              <Card>
                <CardHeader className="flex items-center gap-2">
                  <Palette size={20} />
                  <h3 className="text-lg font-semibold">Appearance</h3>
                </CardHeader>
                <Divider />
                <CardBody>
                  <Select
                    label="Theme"
                    value={settings.preferences.theme}
                    onChange={(e) => updatePreference('theme', e.target.value)}
                  >
                    <SelectItem key="light" value="light">Light</SelectItem>
                    <SelectItem key="dark" value="dark">Dark</SelectItem>
                    <SelectItem key="system" value="system">System</SelectItem>
                  </Select>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="privacy" title="Privacy">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <Shield size={20} />
                  <h3 className="text-lg font-semibold">Privacy Settings</h3>
                </CardHeader>
                <Divider />
                <CardBody className="space-y-4">
                  <Select
                    label="Profile Visibility"
                    value={settings.privacy.profileVisibility}
                    onChange={(e) => updatePrivacySetting('profileVisibility', e.target.value)}
                  >
                    <SelectItem key="public" value="public">Public</SelectItem>
                    <SelectItem key="private" value="private">Private</SelectItem>
                    <SelectItem key="friends" value="friends">Friends Only</SelectItem>
                  </Select>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Data Collection
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Allow collection of usage data for improvement
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.privacy.dataCollection}
                      onValueChange={(value) => updatePrivacySetting('dataCollection', value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Marketing Communications
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Receive personalized marketing content
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.privacy.marketing}
                      onValueChange={(value) => updatePrivacySetting('marketing', value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Analytics
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Help us improve by sharing anonymous usage data
                      </p>
                    </div>
                    <Switch
                      isSelected={settings.privacy.analytics}
                      onValueChange={(value) => updatePrivacySetting('analytics', value)}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button
            color="primary"
            size="lg"
            onPress={handleSave}
            isLoading={saving}
            startContent={<Save size={20} />}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
} 