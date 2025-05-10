import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Message, Conversation, InsertConversation } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ConversationArea() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get active conversation or create one
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  // Use the first conversation or create a new one when needed
  const activeConversation = conversations?.[0];

  const createConversationMutation = useMutation({
    mutationFn: async (data: InsertConversation) => {
      const res = await apiRequest('POST', '/api/conversations', data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      return data;
    },
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/conversations', activeConversation?.id, 'messages'],
    enabled: !!activeConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const res = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, { content });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversation?.id, 'messages'] });
      setMessage('');
    },
    onError: (error) => {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // If no active conversation, create one first
    if (!activeConversation) {
      const newConversation = await createConversationMutation.mutateAsync({
        userId: user?.id || 0,
        title: 'New Conversation',
      });
      
      // Now send the message using the new conversation ID
      sendMessageMutation.mutate({
        conversationId: newConversation.id,
        content: message,
      });
    } else {
      // Send message to existing conversation
      sendMessageMutation.mutate({
        conversationId: activeConversation.id,
        content: message,
      });
    }
  };

  // Start a new conversation
  const handleNewConversation = () => {
    if (user) {
      createConversationMutation.mutate({
        userId: user.id,
        title: 'New Conversation',
      });
    }
  };

  const isLoading = isLoadingConversations || isLoadingMessages || createConversationMutation.isPending;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="font-medium text-gray-800">AI Assistant</h2>
        <div className="flex space-x-2">
          <button 
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" 
            title="Start new conversation"
            onClick={handleNewConversation}
          >
            <i className="ri-add-line"></i>
          </button>
          <button className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="View history">
            <i className="ri-history-line"></i>
          </button>
        </div>
      </div>
      
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex-shrink-0 flex items-center justify-center">
                  <i className="ri-robot-fill text-white text-sm"></i>
                </div>
              )}
              
              <div 
                className={`flex-1 ${
                  msg.role === 'user' 
                    ? 'bg-primary-50 rounded-lg p-3 text-sm' 
                    : 'bg-gray-50 rounded-lg p-3 text-sm'
                }`}
              >
                <p className="text-gray-800 whitespace-pre-wrap">{msg.content}</p>
              </div>
              
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                  {user?.name?.[0] || user?.username?.[0] || 'U'}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex-shrink-0 flex items-center justify-center">
              <i className="ri-robot-fill text-white text-sm"></i>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-800">Hello! I'm your AI work assistant. How can I help you today?</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <form className="flex items-center space-x-2" onSubmit={handleSendMessage}>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sendMessageMutation.isPending}
            />
            <button 
              type="button" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className="ri-attachment-2 text-lg"></i>
            </button>
          </div>
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending} 
            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <i className="ri-send-plane-fill text-lg"></i>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
