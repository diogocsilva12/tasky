import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
  Settings,
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
  const [showSettings, setShowSettings] = useState(false);
  const [clientId, setClientId] = useState(DeviceAuthService.getClientId());
  const [proxyUrl, setProxyUrl] = useState(DeviceAuthService.getProxyUrl());
  const pollingRef = useRef<boolean>(false);

  // Start device flow when modal opens
  useEffect(() => {
    if (open) {
      startFlow();
    } else {
      pollingRef.current = false;
      setStatus('idle');
      setDeviceData(null);
      setError(null);
    }
  }, [open]);

  const startFlow = async () => {
    setError(null);
    setStatus('requesting_code');
    pollingRef.current = true;

    try {
      const data = await DeviceAuthService.requestDeviceCode(clientId);
      setDeviceData(data);
      setStatus('waiting_for_user');

      // Start polling
      const token = await DeviceAuthService.pollForToken(
        data.device_code,
        data.interval,
        clientId,
        () => setStatus('slow_down')
      );

      if (pollingRef.current) {
        setStatus('success');
        toast.success('Successfully authorized via GitHub!');
        await onSuccess(token);
        onOpenChange(false);
      }
    } catch (err: any) {
      if (pollingRef.current) {
        setError(err.message || 'GitHub device authorization failed.');
        setStatus('error');
      }
    }
  };

  const copyCode = () => {
    if (deviceData?.user_code) {
      navigator.clipboard.writeText(deviceData.user_code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const openGitHub = () => {
    copyCode();
    const uri = deviceData?.verification_uri || 'https://github.com/login/device';
    window.open(uri, '_blank', 'noopener,noreferrer');
  };

  const saveSettings = () => {
    DeviceAuthService.setClientId(clientId);
    DeviceAuthService.setProxyUrl(proxyUrl);
    setShowSettings(false);
    toast.success('OAuth settings saved');
    startFlow();
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
              <Button
                className="w-full h-11 text-base font-semibold gap-2 shadow-md cursor-pointer"
                onClick={openGitHub}
              >
                <span>Open GitHub & Confirm Code</span>
                <ExternalLink className="h-4 w-4" />
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
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                <Settings className="h-3 w-3" />
                <span>Config</span>
              </button>
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
              <Button
                variant="ghost"
                onClick={() => setShowSettings(true)}
                className="gap-1 text-xs"
              >
                <Settings className="h-3.5 w-3.5" /> OAuth Settings
              </Button>
            </div>
          </div>
        )}

        {/* OAuth App Settings Modal Drawer */}
        {showSettings && (
          <div className="rounded-lg border bg-card p-4 space-y-3 mt-2">
            <p className="text-xs font-semibold text-foreground">GitHub OAuth App Configuration</p>
            <div className="space-y-2">
              <label className="text-[11px] text-muted-foreground">OAuth App Client ID</label>
              <Input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="GitHub OAuth Client ID"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] text-muted-foreground">CORS Proxy URL (Optional)</label>
              <Input
                value={proxyUrl}
                onChange={(e) => setProxyUrl(e.target.value)}
                placeholder="e.g. https://my-worker.workers.dev"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveSettings}>
                Save & Connect
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
