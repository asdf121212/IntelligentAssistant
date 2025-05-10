import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Crop, X, Check, Share, Download, Monitor } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ScreenCaptureProps {
  onCapture: (image: string) => void;
  onClose: () => void;
  open: boolean;
}

export function ScreenCapture({ onCapture, onClose, open }: ScreenCaptureProps) {
  const [captureMode, setCaptureMode] = useState<'screenshot' | 'screenshare'>('screenshot');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Take a screenshot
  const captureScreenshot = async () => {
    try {
      setIsCapturing(true);
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      mediaStreamRef.current = stream;
      
      // Create a video element to capture a frame
      const video = document.createElement('video');
      video.srcObject = stream;
      
      // Wait for the video to load metadata
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      // Create a canvas to draw the video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current frame to the canvas
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to image
      const screenshot = canvas.toDataURL('image/png');
      setCapturedImage(screenshot);
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      
      setIsCapturing(false);
    } catch (error: any) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: "Screenshot Failed",
        description: error.message || "Failed to capture screenshot",
        variant: "destructive"
      });
      setIsCapturing(false);
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      setIsSharing(true);
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Listen for when the user stops sharing
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });
    } catch (error: any) {
      console.error('Error sharing screen:', error);
      toast({
        title: "Screen Sharing Failed",
        description: error.message || "Failed to start screen sharing",
        variant: "destructive"
      });
      setIsSharing(false);
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsSharing(false);
  };

  // Take a screenshot from the current screen share
  const captureFromScreenShare = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const screenshot = canvas.toDataURL('image/png');
      setCapturedImage(screenshot);
    }
  };

  // Handle completion - send the captured image to the parent component
  const handleComplete = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  // Handle dialog close - clean up resources
  const handleClose = () => {
    stopScreenShare();
    setCapturedImage(null);
    setIsCapturing(false);
    setIsSharing(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Screen Capture</DialogTitle>
          <DialogDescription>
            Capture your screen or share it to provide context.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={captureMode} onValueChange={(v) => setCaptureMode(v as 'screenshot' | 'screenshare')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="screenshot" disabled={isSharing || isCapturing}>
              <Camera className="mr-2 h-4 w-4" />
              Screenshot
            </TabsTrigger>
            <TabsTrigger value="screenshare" disabled={isSharing || isCapturing}>
              <Monitor className="mr-2 h-4 w-4" />
              Screen Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="screenshot" className="py-4">
            <div className="flex flex-col items-center justify-center gap-4">
              {capturedImage ? (
                <div className="relative">
                  <img 
                    src={capturedImage} 
                    alt="Captured screenshot" 
                    className="max-w-full max-h-[400px] object-contain border rounded-md"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80"
                    onClick={() => setCapturedImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md bg-muted/30 w-full h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Click the button below to capture your screen</p>
                </div>
              )}

              <Button
                onClick={captureScreenshot}
                disabled={isCapturing}
                className={cn("w-full", capturedImage && "hidden")}
              >
                {isCapturing ? "Capturing..." : "Capture Screenshot"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="screenshare" className="py-4">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative w-full">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  className={cn(
                    "w-full max-h-[400px] object-contain border rounded-md bg-black", 
                    !isSharing && "hidden"
                  )} 
                />

                {capturedImage && (
                  <div className="relative">
                    <img 
                      src={capturedImage} 
                      alt="Captured from screen share" 
                      className="max-w-full max-h-[400px] object-contain border rounded-md"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80"
                      onClick={() => setCapturedImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {!isSharing && !capturedImage && (
                  <div className="border rounded-md bg-muted/30 w-full h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Start screen sharing to capture content</p>
                  </div>
                )}

                {/* Hidden canvas for capturing from video */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex flex-row gap-2 w-full">
                {!isSharing ? (
                  <Button
                    onClick={startScreenShare}
                    className="flex-1"
                  >
                    Start Sharing
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={captureFromScreenShare}
                      variant="secondary"
                      className="flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Take Screenshot
                    </Button>
                    <Button
                      onClick={stopScreenShare}
                      variant="destructive"
                      className="flex-1"
                    >
                      Stop Sharing
                    </Button>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!capturedImage}
            className="ml-2"
          >
            Use Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}