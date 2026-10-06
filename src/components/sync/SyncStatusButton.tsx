import React from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useBoardSync } from '../../context/BoardSyncContext';

export const SyncStatusButton: React.FC = () => {
  const { sync, status, demo } = useBoardSync();
  const { syncing: isSyncing, lastSynced, error } = status;
  const handleSync = async () => {
    try { await sync(); toast.success('Shared board and GitHub issues are up to date'); }
    catch { /* The persistent sync banner displays the failure. */ }
  };
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
        {lastSynced && !error && <CheckCircle className="w-3 h-3 text-emerald-500" />}
        {error && <AlertCircle className="w-3 h-3 text-destructive" />}
        <span>{demo ? 'Demo · local only' : lastSynced ? `Synced: ${getRelativeTime(lastSynced)}` : 'Not synced'}</span>
      </div>

      <div className="flex items-center rounded-md border border-border/70 bg-background/80 shadow-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing || demo}
          className="h-7 px-2 text-xs gap-1.5 rounded-r-none hover:bg-accent cursor-pointer"
          title="Sync shared board and linked GitHub issues"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync</span>
        </Button>


      </div>
    </div>
  );
};
