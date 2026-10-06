import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import {
  DeviceAuthService,
  DeviceCodeResponse,
  DeviceFlowStatus,
} from '../../services/deviceAuth';
import { GithubIcon } from '../icons/GithubIcon';
import {
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface DeviceAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (token: string) => Promise<void>;
}

export const DeviceAuthModal: React.FC<DeviceAuthModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [status, setStatus] = useState<DeviceFlowStatus>('idle');
  const [deviceData, setDeviceData] = useState<DeviceCodeResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) void startFlow();
    else {
      setStatus('idle');
      setDeviceData(null);
      setError(null);
    }
    return () => controllerRef.current?.abort();
  }, [open]);

  const startFlow = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setError(null);
    setDeviceData(null);
    setStatus('requesting_code');
    try {
      const data = await DeviceAuthService.requestDeviceCode(controller.signal);
      if (controller.signal.aborted) return;
      setDeviceData(data);
      setStatus('waiting_for_user');
      const token = await DeviceAuthService.pollForToken(data.device_code, data.interval, data.expires_in, controller.signal, () => setStatus('slow_down'));
      if (controller.signal.aborted) return;
      await onSuccess(token);
      if (controller.signal.aborted) return;
      setStatus('success');
      toast.success('Successfully authorized via GitHub!');
      onOpenChange(false);
    } catch (error) {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : 'GitHub authorization failed.';
      setError(message === 'Failed to fetch' ? 'Could not connect to Tasky sign-in. Check your connection and try again.' : message);
      setStatus('error');
    }
  };

  const copyCode = async () => {
    if (!deviceData?.user_code) return;
    try {
      await navigator.clipboard.writeText(deviceData.user_code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Copy is unavailable. Select the verification code and copy it manually.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <GithubIcon className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Sign in with GitHub
          </DialogTitle>
          <DialogDescription className="text-center">
            Authorize Tasky securely using GitHub's Device Flow
          </DialogDescription>
        </DialogHeader>

        {status === 'requesting_code' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connecting to GitHub...</p>
          </div>
        )}

        {(status === 'waiting_for_user' || status === 'slow_down') && deviceData && (
          <div className="space-y-6 py-2">
            <div className="rounded-lg border bg-muted/40 p-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Your Verification Code
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-3xl font-extrabold tracking-widest text-primary selection:bg-primary/20">
                  {deviceData.user_code}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={copyCode}
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">Open GitHub, enter the code above, then return here after approving Tasky.</p>
              <Button
                className="w-full h-11 text-base font-semibold gap-2 shadow-md cursor-pointer"
                asChild
              >
                <a href="https://github.com/login/device" target="_blank" rel="noopener noreferrer">
                  <span>Open GitHub & Confirm Code</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Waiting for your approval on GitHub...</span>
              </div>
            </div>

            <div className="border-t pt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Direct secure OAuth connection
              </span>

            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Authorization failed</p>
                <p className="text-xs mt-1 text-destructive/90">{error}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={startFlow}>
                Try Again
              </Button>

            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
};
