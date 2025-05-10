import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailModal({ isOpen, onClose }: EmailModalProps) {
  const [subject, setSubject] = useState('');
  const [purpose, setPurpose] = useState('update');
  const [details, setDetails] = useState('');
  const [tone, setTone] = useState('formal');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const { toast } = useToast();

  const emailDraftMutation = useMutation({
    mutationFn: async (data: { subject: string; purpose: string; details: string; tone: string }) => {
      const res = await apiRequest('POST', '/api/ai/draft-email', data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedEmail(data.email);
      toast({
        title: 'Email drafted',
        description: 'Your email has been generated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to generate email',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    emailDraftMutation.mutate({ subject, purpose, details, tone });
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail);
    toast({
      title: 'Copied to clipboard',
      description: 'Email content has been copied to your clipboard.',
    });
  };

  const resetForm = () => {
    setSubject('');
    setPurpose('update');
    setDetails('');
    setTone('formal');
    setGeneratedEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetForm()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Draft Email</DialogTitle>
          <DialogDescription>
            Fill in the details below to generate a professional email draft.
          </DialogDescription>
        </DialogHeader>

        {!generatedEmail ? (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="emailSubject">Subject</Label>
                <Input
                  id="emailSubject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emailPurpose">Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger id="emailPurpose">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Team Update</SelectItem>
                    <SelectItem value="request">Information Request</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emailDetails">Key Details</Label>
                <Textarea
                  id="emailDetails"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="What should be included in this email?"
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid gap-2">
                <Label>Tone</Label>
                <RadioGroup value={tone} onValueChange={setTone} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="formal" id="tone-formal" />
                    <Label htmlFor="tone-formal">Formal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="friendly" id="tone-friendly" />
                    <Label htmlFor="tone-friendly">Friendly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="direct" id="tone-direct" />
                    <Label htmlFor="tone-direct">Direct</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={emailDraftMutation.isPending || !subject || !details}
              >
                {emailDraftMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Draft'
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4">
            <div className="border border-gray-200 rounded-lg p-3 bg-white mb-4 whitespace-pre-wrap">
              {generatedEmail}
            </div>
            <DialogFooter className="flex justify-between sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGeneratedEmail('')}
              >
                Edit Request
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyToClipboard}
              >
                Copy to Clipboard
              </Button>
              <Button
                type="button"
                onClick={resetForm}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
