import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Lock, LogOut } from 'lucide-react';

export const AccessPendingPage: React.FC = () => {
  const { user, requestAccess, logout, authState } = useAuth();
  const [note, setNote] = useState('');
  const [requested, setRequested] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestAccess(note);
    setRequested(true);
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
          {requested || authState === 'pending' ? (
            <div className="text-center text-sm space-y-4">
              <p className="bg-orange-100 text-orange-800 p-3 rounded-md">
                Your request is pending admin approval.
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
              <Button type="submit" className="w-full">
                Request Access
              </Button>
            </form>
          )}

          <Button variant="ghost" onClick={logout} className="w-full text-muted-foreground mt-4">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
