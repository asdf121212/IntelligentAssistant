import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/ui/file-upload';
import { Loader2 } from 'lucide-react';

interface AddContextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddContextModal({ isOpen, onClose }: AddContextModalProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const createContextMutation = useMutation({
    mutationFn: async (data: { name: string; content: string }) => {
      const res = await apiRequest('POST', '/api/contexts', {
        userId: 0, // This will be set by the server from the session
        name: data.name,
        type: 'text/plain',
        content: data.content,
        active: true
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contexts'] });
      toast({
        title: 'Context added',
        description: 'Your context has been added successfully.',
      });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Failed to add context',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createContextMutation.mutate({ name, content });
  };

  const resetForm = () => {
    setName('');
    setContent('');
    onClose();
  };

  const handleUploadComplete = (data: any) => {
    toast({
      title: 'Upload successful',
      description: 'Your document has been uploaded and processed as a context.',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetForm()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Context</DialogTitle>
          <DialogDescription>
            Add a new document or text to your contexts.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="text">Add Text</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="py-4">
            <FileUpload onUploadComplete={handleUploadComplete} />
            <p className="text-xs text-gray-500 mt-4">
              Files are processed securely and added to your contexts for future reference.
            </p>
          </TabsContent>
          
          <TabsContent value="text" className="py-4">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contextName">Name</Label>
                  <Input
                    id="contextName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter a name for this context"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contextContent">Content</Label>
                  <Textarea
                    id="contextContent"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter the text content for this context"
                    required
                    className="min-h-[200px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createContextMutation.isPending || !name || !content}
                >
                  {createContextMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Context'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
