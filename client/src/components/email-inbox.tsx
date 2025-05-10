import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, RefreshCw, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { EmailSettingsModal } from './email-settings-modal';
import { EmailResponseModal } from './email-response-modal';

interface Email {
  id: number;
  subject: string | null;
  from: string;
  date: string;
  body: string;
  needsResponse: boolean;
  responseGenerated: boolean;
  isRead: boolean;
}

interface EmailResponse {
  id: number;
  draftResponse: string;
  suggestedActions: { action: string; priority: string }[];
  status: string;
}

export default function EmailInbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('all');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  
  const { data: emailSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/email/settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/email/settings');
      if (res.status === 404) return null;
      return await res.json();
    },
    enabled: !!user,
  });
  
  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['/api/email/inbox', activeTab],
    queryFn: async () => {
      const params = activeTab === 'needs-response' ? '?needsResponse=true' : '';
      const res = await apiRequest('GET', `/api/email/inbox${params}`);
      const data = await res.json();
      return data.map((email: any) => ({
        ...email,
        date: new Date(email.date),
      }));
    },
    enabled: !!user && !!emailSettings,
  });
  
  const { data: emailResponses = {}, isLoading: isLoadingResponse } = useQuery({
    queryKey: ['/api/email/responses', selectedEmail?.id],
    queryFn: async () => {
      if (!selectedEmail) return [];
      const res = await apiRequest('GET', `/api/email/${selectedEmail.id}/responses`);
      return await res.json();
    },
    enabled: !!selectedEmail,
  });
  
  const syncEmailsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/email/sync');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/inbox'] });
      toast({
        title: 'Emails synced',
        description: 'Your emails have been successfully synced.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const generateResponseMutation = useMutation({
    mutationFn: async (emailId: number) => {
      const res = await apiRequest('POST', `/api/email/${emailId}/generate-response`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/inbox'] });
      queryClient.invalidateQueries({ queryKey: ['/api/email/responses', selectedEmail?.id] });
      toast({
        title: 'Response generated',
        description: 'A draft response has been generated for this email.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate response',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setIsResponseModalOpen(true);
  };
  
  const handleSyncEmails = () => {
    if (!emailSettings) {
      setIsSettingsModalOpen(true);
      return;
    }
    syncEmailsMutation.mutate();
  };
  
  const handleGenerateResponse = (emailId: number) => {
    generateResponseMutation.mutate(emailId);
  };
  
  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Close the response modal and reset selected email
  const handleCloseResponseModal = () => {
    setIsResponseModalOpen(false);
    setSelectedEmail(null);
  };
  
  // Group and sort emails by date (today, yesterday, earlier this week, etc.)
  const groupedEmails: { [key: string]: Email[] } = emails.reduce((acc: any, email: Email) => {
    const date = new Date(email.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let group = 'Earlier';
    
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    } else if (date > new Date(today.setDate(today.getDate() - 7))) {
      group = 'This Week';
    }
    
    if (!acc[group]) {
      acc[group] = [];
    }
    
    acc[group].push(email);
    return acc;
  }, {});
  
  // Sort emails by date within each group
  Object.keys(groupedEmails).forEach(group => {
    groupedEmails[group].sort((a: Email, b: Email) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  });
  
  // Preferred group order
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  
  if (!user) {
    return <div className="text-center py-8">Please log in to access your emails.</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Inbox</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
          <Button 
            onClick={handleSyncEmails} 
            disabled={syncEmailsMutation.isPending || isLoadingSettings}
            className="flex items-center gap-1"
          >
            {syncEmailsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>Sync Emails</span>
          </Button>
        </div>
      </div>
      
      {!emailSettings ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Mail className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <h3 className="text-lg font-medium">Connect your email account</h3>
                <p className="text-sm text-gray-500">
                  Connect your email account to start syncing emails and generating responses.
                </p>
              </div>
              <Button onClick={() => setIsSettingsModalOpen(true)}>
                Connect Email
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Emails</TabsTrigger>
            <TabsTrigger value="needs-response">Needs Response</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : emails.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <Mail className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No emails found</h3>
                  <p className="text-sm text-gray-500">
                    Try syncing your emails or check back later.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {groupOrder.map(group => {
                  if (!groupedEmails[group] || groupedEmails[group].length === 0) return null;
                  
                  return (
                    <div key={group}>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{group}</h3>
                      <div className="space-y-2">
                        {groupedEmails[group].map((email: Email) => (
                          <Card 
                            key={email.id} 
                            className={`cursor-pointer hover:bg-gray-50 transition-colors ${!email.isRead ? 'border-l-4 border-l-primary' : ''}`}
                            onClick={() => handleEmailClick(email)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-1">
                                <div className="font-medium truncate pr-4">
                                  {email.subject || '(No subject)'}
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                  {getFormattedDate(email.date.toString())}
                                </div>
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {email.from}
                              </div>
                              <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {email.body}
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <div className="flex gap-2">
                                  {email.needsResponse && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                                      Needs Response
                                    </Badge>
                                  )}
                                  {email.responseGenerated && (
                                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                                      Response Ready
                                    </Badge>
                                  )}
                                </div>
                                {email.needsResponse && !email.responseGenerated && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGenerateResponse(email.id);
                                    }}
                                    disabled={generateResponseMutation.isPending}
                                  >
                                    {generateResponseMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : null}
                                    Generate Response
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="needs-response" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : emails.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-4 text-center">
                  <Mail className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium">No emails need response</h3>
                  <p className="text-sm text-gray-500">
                    All your emails have been handled or don't need a response.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {emails.map((email: Email) => (
                  <Card 
                    key={email.id} 
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${!email.isRead ? 'border-l-4 border-l-primary' : ''}`}
                    onClick={() => handleEmailClick(email)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium truncate pr-4">
                          {email.subject || '(No subject)'}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {getFormattedDate(email.date.toString())}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {email.from}
                      </div>
                      <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {email.body}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-2">
                          {email.responseGenerated ? (
                            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                              Response Ready
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                              Needs Response
                            </Badge>
                          )}
                        </div>
                        {!email.responseGenerated && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateResponse(email.id);
                            }}
                            disabled={generateResponseMutation.isPending}
                          >
                            {generateResponseMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Generate Response
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      <EmailSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        existingSettings={emailSettings}
      />
      
      {selectedEmail && (
        <EmailResponseModal
          isOpen={isResponseModalOpen}
          onClose={handleCloseResponseModal}
          email={selectedEmail}
          onGenerateResponse={() => handleGenerateResponse(selectedEmail.id)}
          isGenerating={generateResponseMutation.isPending}
        />
      )}
    </div>
  );
}