import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { ScreenCapture } from "@/components/ui/screen-capture";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ScreenCaptureButtonProps {
  onContextAdded?: () => void;
}

export function ScreenCaptureButton({ onContextAdded }: ScreenCaptureButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Mutation to process a screenshot
  const processScreenshot = useMutation({
    mutationFn: async (dataUrl: string) => {
      const response = await apiRequest("POST", "/api/screenshot/process", { dataUrl });
      return await response.json();
    },
    onSuccess: (data) => {
      // Show the result to the user or ask for further actions
      if (data.result) {
        saveAsContext(data.result);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Processing Screenshot",
        description: error.message || "Failed to process screenshot",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  // Mutation to save the processed screenshot as a context
  const saveContext = useMutation({
    mutationFn: async (data: { name: string, content: string }) => {
      const response = await apiRequest("POST", "/api/screenshot/save-context", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Screenshot context saved successfully",
      });
      setIsProcessing(false);
      
      if (onContextAdded) {
        onContextAdded();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Context",
        description: error.message || "Failed to save context",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  // Handle the captured image
  const handleCapture = (imageData: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to capture and analyze screenshots",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    processScreenshot.mutate(imageData);
  };

  // Save the processed content as a context
  const saveAsContext = (content: string) => {
    const contextName = `Screenshot ${new Date().toLocaleString()}`;
    saveContext.mutate({
      name: contextName,
      content
    });
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="gap-2"
        onClick={() => setIsModalOpen(true)}
        disabled={isProcessing}
      >
        <Camera className="h-4 w-4" />
        {isProcessing ? "Processing..." : "Screen Capture"}
      </Button>

      <ScreenCapture
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCapture={handleCapture}
      />
    </>
  );
}