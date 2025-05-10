import { useQuery, useMutation } from '@tanstack/react-query';
import { Context } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AddContextModal } from './add-context-modal';

export function ActiveContexts() {
  const { data: contexts, isLoading } = useQuery<Context[]>({
    queryKey: ['/api/contexts'],
  });
  
  const [isAddContextModalOpen, setIsAddContextModalOpen] = useState(false);
  const { toast } = useToast();

  const updateContextMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Context> }) => {
      const res = await apiRequest('PUT', `/api/contexts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contexts'] });
      toast({
        title: 'Context updated',
        description: 'The context has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteContextMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/contexts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contexts'] });
      toast({
        title: 'Context removed',
        description: 'The context has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Removal failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleContextActive = (context: Context) => {
    updateContextMutation.mutate({
      id: context.id,
      data: { active: !context.active }
    });
  };

  const deleteContext = (contextId: number) => {
    if (window.confirm('Are you sure you want to delete this context?')) {
      deleteContextMutation.mutate(contextId);
    }
  };

  const getContextIcon = (type: string) => {
    if (type.includes('pdf')) return 'ri-file-pdf-line';
    if (type.includes('word')) return 'ri-file-word-line';
    if (type.includes('text')) return 'ri-file-text-line';
    return 'ri-file-line';
  };

  const getContextColorClass = (type: string) => {
    if (type.includes('pdf')) return 'bg-blue-100 text-blue-500';
    if (type.includes('word')) return 'bg-blue-100 text-blue-500';
    if (type.includes('text')) return 'bg-green-100 text-green-500';
    return 'bg-purple-100 text-purple-500';
  };

  const activeContexts = contexts?.filter(context => context.active) || [];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="font-medium text-gray-800">Active Contexts</h2>
          <button 
            className="text-sm text-primary-600 hover:text-primary-700"
            onClick={() => setIsAddContextModalOpen(true)}
          >
            Manage
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-500 py-4">Loading contexts...</div>
          ) : activeContexts.length > 0 ? (
            activeContexts.map(context => (
              <div key={context.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 ${getContextColorClass(context.type)} rounded-lg flex items-center justify-center`}>
                      <i className={`${getContextIcon(context.type)} text-lg`}></i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-800">{context.name}</h3>
                      <p className="text-xs text-gray-500">
                        {context.pageCount ? `${context.pageCount} pages` : ''} 
                        {context.fileSize ? ` • ${Math.round(context.fileSize / 1024)} KB` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex">
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-600" 
                      title="Toggle active"
                      onClick={() => toggleContextActive(context)}
                    >
                      <i className={context.active ? "ri-eye-line" : "ri-eye-off-line"}></i>
                    </button>
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-600" 
                      title="Remove"
                      onClick={() => deleteContext(context.id)}
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">No active contexts</div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center"
            onClick={() => setIsAddContextModalOpen(true)}
          >
            <i className="ri-add-line mr-1.5"></i>
            Add New Context
          </button>
        </div>
      </div>

      <AddContextModal 
        isOpen={isAddContextModalOpen} 
        onClose={() => setIsAddContextModalOpen(false)} 
      />
    </>
  );
}
