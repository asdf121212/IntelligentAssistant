import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  provider: string;
  isLoading?: boolean;
}

export function SocialButton({
  className,
  icon,
  provider,
  isLoading = false,
  ...props
}: SocialButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "w-full flex items-center justify-center gap-2 border border-gray-300 py-6 relative",
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-white bg-opacity-80">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {icon}
          <span>Continue with {provider}</span>
        </>
      )}
    </Button>
  );
}