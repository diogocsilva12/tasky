import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner';

type SyncInterval = 'off' | '1m' | '5m' | '15m';

const INTERVAL_MS: Record<SyncInterval, number | null> = {
  off: null,
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
};

export const SyncStatusButton: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('success');
  const [autoSyncInterval, setAutoSyncInterval] = useState<SyncInterval>('5m');

  const handleSync = async (silent = false) => {
    setIsSyncing(true);
    setStatus('idle');

    try {
      // Simulate sync process
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setLastSynced(new Date());
      setStatus('success');
      if (!silent) {
        toast.success('Sync completed successfully');
      }
    } catch {
      setStatus('error');
      if (!silent) {
        toast.error('Sync failed. Please try again.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Background Auto-sync timer
  useEffect(() => {
    const ms = INTERVAL_MS[autoSyncInterval];
    if (!ms) return;

    const intervalId = setInterval(() => {
      handleSync(true);
    }, ms);

    return () => clearInterval(intervalId);
  }, [autoSyncInterval]);

  const getRelativeTime = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000); // in minutes
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 min ago';
    if (diff < 60) return `${diff} mins ago`;
    const hours = Math.floor(diff / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex items-center space-x-1.5">
      <div className="text-xs text-muted-foreground hidden xl:flex items-center space-x-1">
        {status === 'success' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
        {status === 'error' && <AlertCircle className="w-3 h-3 text-destructive" />}
        <span>{lastSynced ? `Synced: ${getRelativeTime(lastSynced)}` : 'Not synced'}</span>
      </div>

      <div className="flex items-center rounded-md border border-border/70 bg-background/80 shadow-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSync(false)}
          disabled={isSyncing}
          className="h-7 px-2 text-xs gap-1.5 rounded-r-none hover:bg-accent cursor-pointer"
          title="Manual GitHub Sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync</span>
        </Button>

        <div className="w-px h-4 bg-border/60" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-xs rounded-l-none text-muted-foreground hover:text-foreground cursor-pointer"
              title={`Auto-Sync interval: ${autoSyncInterval}`}
            >
              <span className="text-[10px] font-mono mr-0.5">{autoSyncInterval}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Auto-Sync Frequency</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(['off', '1m', '5m', '15m'] as SyncInterval[]).map((val) => (
              <DropdownMenuItem
                key={val}
                onClick={() => {
                  setAutoSyncInterval(val);
                  toast.info(val === 'off' ? 'Auto-sync disabled' : `Auto-sync set to every ${val}`);
                }}
                className={`text-xs cursor-pointer ${
                  autoSyncInterval === val ? 'font-semibold text-primary' : ''
                }`}
              >
                {val === 'off'
                  ? 'Disabled (Manual)'
                  : val === '1m'
                  ? 'Every 1 minute'
                  : val === '5m'
                  ? 'Every 5 minutes'
                  : 'Every 15 minutes'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
