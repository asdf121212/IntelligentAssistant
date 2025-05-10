import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail, Send, X, AlertCircle, CheckCircle2, FileEdit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface Email {
  id: number;
  subject: string | null;
  from: string;
  to: string;
  cc?: string;
  date: string;
  body: string;
  html?: string;
  needsResponse: boolean;
  responseGenerated: boolean;
}

interface SuggestedAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
}

interface EmailResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: Email;
  onGenerateResponse: () => void;
  isGenerating: boolean;
}

export function EmailResponseModal({
  isOpen,
  onClose,
  email,
  onGenerateResponse,
  isGenerating
}: EmailResponseModalProps) {
  const [activeTab, setActiveTab] = useState<string>('email');
  const [editedResponse, setEditedResponse] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch response if it exists
  const { data: responses = [], isLoading: isLoadingResponses } = useQuery({
    queryKey: [`/api/email/${email.id}/responses`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/email/${email.id}/responses`);
      return await res.json();
    },
    enabled: !!email.id && isOpen,
  });
  
  const response = responses.length > 0 ? responses[0] : null;
  
  // Set edited response when response is loaded
  useEffect(() => {
    if (response?.draftResponse) {
      setEditedResponse(response.draftResponse);
    }
  }, [response]);
  
  // When email changes or modal reopens, reset to email tab
  useEffect(() => {
    setActiveTab('email');
  }, [email.id, isOpen]);
  
  // Mutation to update response
  const updateResponseMutation = useMutation({
    mutationFn: async (data: { draftResponse: string; status: string }) => {
      const res = await apiRequest('PUT', `/api/email/response/${response.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/email/${email.id}/responses`] });
      toast({
        title: 'Response updated',
        description: 'Your changes to the response have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update response',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mutation to send email
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { editedResponse: string }) => {
      const res = await apiRequest('POST', `/api/email/response/${response.id}/send`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email/inbox'] });
      toast({
        title: 'Email sent',
        description: 'Your response has been sent successfully.',
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send email',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleSaveResponse = () => {
    if (!response) return;
    
    updateResponseMutation.mutate({
      draftResponse: editedResponse,
      status: 'edited'
    });
  };
  
  const handleSendEmail = () => {
    if (!response) return;
    
    sendEmailMutation.mutate({
      editedResponse
    });
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {email.subject || '(No subject)'}
          </DialogTitle>
          <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
            <span className="font-medium">From:</span> {email.from}
            <span className="hidden sm:inline">•</span>
            <span className="text-gray-500">
              {format(new Date(email.date), 'MMM d, yyyy h:mm a')}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="email">Original Email</TabsTrigger>
            <TabsTrigger value="response" disabled={!email.responseGenerated && !isGenerating}>
              {isGenerating ? 'Generating...' : 'AI Response'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="overflow-auto mt-4 flex-1">
            <div className="space-y-4">
              <div className="prose max-w-none">
                {email.html ? (
                  <div dangerouslySetInnerHTML={{ __html: email.html }} />
                ) : (
                  <div className="whitespace-pre-wrap">{email.body}</div>
                )}
              </div>
              
              {!email.responseGenerated && email.needsResponse && (
                <div className="pt-4 border-t">
                  <Button 
                    variant="default" 
                    onClick={onGenerateResponse}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating AI Response...
                      </>
                    ) : (
                      'Generate AI Response'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="response" className="overflow-auto mt-0 flex-1 flex flex-col">
            {isLoadingResponses ? (
              <div className="flex flex-col items-center justify-center flex-1 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-gray-500">Loading response...</p>
              </div>
            ) : response ? (
              <div className="space-y-4 py-4 flex-1 flex flex-col">
                {response.suggestedActions && response.suggestedActions.length > 0 && (
                  <Card className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Suggested Actions</CardTitle>
                      <CardDescription>
                        Based on email analysis, consider these actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {response.suggestedActions.map((action: SuggestedAction, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <Badge 
                              variant="outline"
                              className={`${getPriorityColor(action.priority)} text-xs font-normal py-0.5 px-1.5`}
                            >
                              {action.priority}
                            </Badge>
                            <span className="text-sm">{action.action}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex-1">
                  <Textarea
                    className="w-full h-[280px] font-mono text-sm"
                    value={editedResponse}
                    onChange={(e) => setEditedResponse(e.target.value)}
                    placeholder="Edit the AI-generated response..."
                  />
                </div>
                
                <div className="flex justify-between pt-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleSaveResponse}
                    disabled={updateResponseMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    {updateResponseMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileEdit className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sendEmailMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    {sendEmailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No response generated</h3>
                <p className="text-sm text-gray-500">
                  {isGenerating ? 'Generating a response...' : 'Generate a response to view AI suggestions.'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-between">
          <div className="hidden sm:flex">
            {email.needsResponse && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                Needs Response
              </Badge>
            )}
            {email.responseGenerated && (
              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                Response Generated
              </Badge>
            )}
          </div>
          <Button variant="ghost" onClick={onClose} className="flex items-center gap-1">
            <X className="h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}