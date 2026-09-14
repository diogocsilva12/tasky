import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Lock, LogOut } from 'lucide-react';

export const AccessPendingPage: React.FC = () => {
  const { user, requestAccess, logout, pendingRequests, refreshPassList } = useAuth();
  const [note, setNote] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const request = pendingRequests.find(r => r.username.toLowerCase() === user?.username.toLowerCase());

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setError('');
    try { await requestAccess(note); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not submit request.'); }
    finally { setIsBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4 text-orange-500">
            <Lock className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl text-center">Access Restricted</CardTitle>
          <CardDescription className="text-center">
            Hi {user?.name || user?.username}! You are authenticated, but you are not on the pass-list yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {request ? (
            <div className="text-center text-sm space-y-4">
              <p className="bg-orange-100 text-orange-800 p-3 rounded-md">
                {request.status === 'rejected' ? 'Your request was declined. Contact the admin to review your access.' : 'Your request is awaiting admin approval.'}
              </p>
              <p className="text-muted-foreground">
                Please contact the admin (@diogocsilva12) if you need immediate access.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  id="note" 
                  placeholder="Why do you need access? (optional)" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isBusy}>
                Request Access
              </Button>
            </form>
          )}

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button variant="outline" className="w-full" disabled={isBusy} onClick={async () => {
            setIsBusy(true);
            setError('');
            try { await refreshPassList(); }
            catch (error) { setError(error instanceof Error ? error.message : 'Could not check access.'); }
            finally { setIsBusy(false); }
          }}>Check approval status</Button>
          <Button variant="ghost" onClick={logout} className="w-full text-muted-foreground mt-4">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
