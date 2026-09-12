import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { GitBranch, Key, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithToken, loginDemo } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithToken(token);
    } catch (err: any) {
      setError(err.message || 'Failed to login with provided token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <GitBranch className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl text-center">Sign in to Tasky</CardTitle>
          <CardDescription className="text-center">
            Enter your GitHub Personal Access Token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input 
                id="token" 
                type="password" 
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Key className="h-3 w-3" /> Requires scopes: <span className="font-semibold">repo</span>, <span className="font-semibold">project</span>, <span className="font-semibold">gist</span>
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => loginDemo('admin')} disabled={loading}>
              Demo as Admin
            </Button>
            <Button variant="outline" onClick={() => loginDemo('member')} disabled={loading}>
              Demo as Member
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
