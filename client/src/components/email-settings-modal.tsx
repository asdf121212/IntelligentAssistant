import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface EmailSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSettings: any;
}

const emailSettingsSchema = z.object({
  emailProvider: z.string(),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  credentials: z.object({
    username: z.string().optional(),
    password: z.string().min(1, { message: 'Password is required' }),
    host: z.string().min(1, { message: 'IMAP host is required' }),
    port: z.coerce.number().min(1, { message: 'IMAP port is required' }),
    tls: z.boolean().default(true),
    smtpHost: z.string().min(1, { message: 'SMTP host is required' }),
    smtpPort: z.coerce.number().min(1, { message: 'SMTP port is required' }),
    smtpSecure: z.boolean().default(true),
  }),
  active: z.boolean().default(true),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

// Common email provider presets
const emailProviderPresets: { [key: string]: any } = {
  gmail: {
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
  },
  outlook: {
    host: 'outlook.office365.com',
    port: 993,
    tls: true,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: false,
  },
  yahoo: {
    host: 'imap.mail.yahoo.com',
    port: 993,
    tls: true,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    smtpSecure: true,
  },
  icloud: {
    host: 'imap.mail.me.com',
    port: 993,
    tls: true,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
    smtpSecure: false,
  },
  custom: {
    host: '',
    port: 993,
    tls: true,
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
  },
};

export function EmailSettingsModal({ isOpen, onClose, existingSettings }: EmailSettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Set default values based on existing settings or default to Gmail
  const defaultValues: EmailSettingsFormValues = {
    emailProvider: existingSettings?.emailProvider || 'gmail',
    email: existingSettings?.email || '',
    credentials: {
      username: '',
      password: '',
      host: emailProviderPresets.gmail.host,
      port: emailProviderPresets.gmail.port,
      tls: emailProviderPresets.gmail.tls,
      smtpHost: emailProviderPresets.gmail.smtpHost,
      smtpPort: emailProviderPresets.gmail.smtpPort,
      smtpSecure: emailProviderPresets.gmail.smtpSecure,
    },
    active: existingSettings?.active ?? true,
  };
  
  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues,
  });
  
  // Update settings when provider changes
  const handleProviderChange = (value: string) => {
    form.setValue('emailProvider', value);
    
    if (value !== 'custom') {
      const preset = emailProviderPresets[value];
      form.setValue('credentials.host', preset.host);
      form.setValue('credentials.port', preset.port);
      form.setValue('credentials.tls', preset.tls);
      form.setValue('credentials.smtpHost', preset.smtpHost);
      form.setValue('credentials.smtpPort', preset.smtpPort);
      form.setValue('credentials.smtpSecure', preset.smtpSecure);
    }
  };
  
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: EmailSettingsFormValues) => {
      const res = await apiRequest('POST', '/api/email/settings', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/settings'] });
      toast({
        title: 'Settings saved',
        description: 'Your email settings have been saved successfully.',
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: EmailSettingsFormValues) => {
    // If username is empty, use the email as username
    if (!data.credentials.username) {
      data.credentials.username = data.email;
    }
    
    saveSettingsMutation.mutate(data);
  };
  
  // Get the current provider value
  const currentProvider = form.watch('emailProvider');
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>Email Settings</DialogTitle>
          <DialogDescription>
            Connect your email account to sync emails and generate automated responses.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="emailProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Provider</FormLabel>
                  <Select
                    onValueChange={(value) => handleProviderChange(value)}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your email provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook / Office 365</SelectItem>
                      <SelectItem value="yahoo">Yahoo Mail</SelectItem>
                      <SelectItem value="icloud">iCloud Mail</SelectItem>
                      <SelectItem value="custom">Custom IMAP</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose your email provider for preset server settings.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="credentials.password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password or App Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormDescription>
                    {currentProvider === 'gmail' ? (
                      <span>For Gmail, you will need to use an <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-primary underline">App Password</a>.</span>
                    ) : currentProvider === 'outlook' ? (
                      <span>For Outlook, consider using an <a href="https://support.microsoft.com/en-us/account-billing/manage-app-passwords-for-two-step-verification-d6dc8c6d-4bf7-4851-ad95-6d07799387e9" target="_blank" rel="noopener noreferrer" className="text-primary underline">App Password</a>.</span>
                    ) : (
                      <span>Use your account password or app-specific password.</span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center gap-2">
              <Switch
                checked={showAdvancedSettings}
                onCheckedChange={setShowAdvancedSettings}
                id="advanced-settings"
              />
              <label
                htmlFor="advanced-settings"
                className="text-sm cursor-pointer select-none"
              >
                Show advanced server settings
              </label>
            </div>
            
            {showAdvancedSettings && (
              <div className="space-y-4 border rounded-md p-4 bg-gray-50">
                <h3 className="font-medium text-sm">IMAP Settings (Incoming Mail)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="credentials.host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMAP Host</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="credentials.port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMAP Port</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="credentials.tls"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use TLS</FormLabel>
                        <FormDescription>
                          Enable TLS encryption for secure connections
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <h3 className="font-medium text-sm mt-6">SMTP Settings (Outgoing Mail)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="credentials.smtpHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="credentials.smtpPort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="credentials.smtpSecure"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use Secure SMTP</FormLabel>
                        <FormDescription>
                          Enable TLS encryption for secure SMTP connections
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Email Integration</FormLabel>
                    <FormDescription>
                      Enables email syncing and AI response generation
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveSettingsMutation.isPending}>
                {saveSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}