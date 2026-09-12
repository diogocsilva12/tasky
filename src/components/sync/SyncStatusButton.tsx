import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export const SyncStatusButton: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('success');

  const handleSync = async () => {
    setIsSyncing(true);
    setStatus('idle');
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLastSynced(new Date());
      setStatus('success');
      toast.success('Sync completed successfully');
    } catch (error) {
      setStatus('error');
      toast.error('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
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
    <div className="flex items-center space-x-2">
      <div className="text-xs text-muted-foreground flex items-center space-x-1">
        {status === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
        {status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
        <span>
          {lastSynced ? `Synced: ${getRelativeTime(lastSynced)}` : 'Not synced'}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
        className="h-8 w-8 p-0"
        title="Manual Sync"
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};
