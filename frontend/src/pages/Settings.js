import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Separator } from '../components/ui/separator';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Sun, 
  Moon, 
  Palette, 
  Bell, 
  Shield, 
  User,
  Loader2,
  Check
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const accentColors = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' }
];

export default function Settings() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState(true);
  const [textSize, setTextSize] = useState('normal');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/settings`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.theme) setTheme(data.theme);
        if (data.accent_color) setAccentColor(data.accent_color);
        if (data.notifications_enabled !== undefined) setNotifications(data.notifications_enabled);
        if (data.text_size) setTextSize(data.text_size);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('theme', theme);
      formData.append('accent_color', accentColor);
      formData.append('notifications_enabled', notifications);
      formData.append('text_size', textSize);

      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container animate-fade-in max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-[Manrope] mb-2">
            Settings
          </h1>
          <p className="text-lg text-muted-foreground">
            Customize your NeuroClaim experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="card-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full" />
                  ) : (
                    <User className="w-8 h-8 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-lg">{user?.name}</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card className="card-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how NeuroClaim looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-muted-foreground" />
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    data-testid="theme-switch"
                  />
                  <Moon className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              <Separator />

              {/* Accent Color */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base">Accent Color</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred accent color
                  </p>
                </div>
                <div className="flex gap-3">
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAccentColor(color.value)}
                      className={`w-12 h-12 rounded-xl ${color.class} flex items-center justify-center transition-transform hover:scale-105 ${
                        accentColor === color.value ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : ''
                      }`}
                      data-testid={`accent-${color.value}`}
                      title={color.label}
                    >
                      {accentColor === color.value && (
                        <Check className="w-6 h-6 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Text Size */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base">Text Size</Label>
                  <p className="text-sm text-muted-foreground">
                    Adjust text size for better readability
                  </p>
                </div>
                <RadioGroup value={textSize} onValueChange={setTextSize} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" data-testid="text-small" />
                    <Label htmlFor="small" className="text-sm">Small</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" data-testid="text-normal" />
                    <Label htmlFor="normal" className="text-base">Normal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="large" data-testid="text-large" />
                    <Label htmlFor="large" className="text-lg">Large</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="card-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your claims
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  data-testid="notifications-switch"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="card-warm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.has_2fa ? 'Enabled' : 'Not enabled'} - Add extra security to your account
                  </p>
                </div>
                <Button variant="outline" className="rounded-full" data-testid="2fa-setup-btn">
                  {user?.has_2fa ? 'Manage' : 'Enable'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={saveSettings}
              className="rounded-full h-12 px-8"
              disabled={isSaving}
              data-testid="save-settings-btn"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" /> Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
