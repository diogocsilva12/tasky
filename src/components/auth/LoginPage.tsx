import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DeviceAuthModal } from './DeviceAuthModal';
import { GithubIcon } from '../icons/GithubIcon';
import { AlertCircle, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithToken, loginDemo } = useAuth();
  const [token, setToken] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithToken(token, remember);
    } catch (err: any) {
      setError(err.message || 'Failed to login with provided token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/80">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-1">
            <GithubIcon className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Tasky</CardTitle>
          <CardDescription className="text-sm">
            Minimalist GitHub Task & Kanban Management
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm cursor-pointer">
            <input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} className="mt-1 accent-primary" />
            <span><span className="block font-medium">Remember me on this device</span><span className="block text-xs text-muted-foreground mt-1">Stay signed in for 30 days. Signing out removes the remembered session.</span></span>
          </label>
          {/* Solution 1: Direct GitHub Device Login */}
          <div className="space-y-2">
            <Button
              className="w-full h-11 text-base font-semibold gap-2.5 shadow-sm cursor-pointer"
              onClick={() => setDeviceModalOpen(true)}
            >
              <GithubIcon className="h-5 w-5" />
              <span>Sign in with GitHub</span>
            </Button>
            <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 inline" />
              Fast 1-click GitHub device flow authorization
            </p>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium">
                Or sign in with Personal Access Token
              </span>
            </div>
          </div>

          {/* Solution 2: PAT Token */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <Input
                id="token"
                type="password"
                placeholder="ghp_... or gho_..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-10 text-sm font-mono"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1 font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border">
                  Terminal: gh auth token
                </span>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,project,gist&description=Tasky+Access+Token"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-0.5 font-medium"
                >
                  <span>Create new PAT</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-xs">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="outline"
              className="w-full cursor-pointer h-9"
              disabled={loading || !token.trim()}
            >
              {loading ? 'Validating Token...' : 'Sign In with Token'}
            </Button>
          </form>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium">
                Instant Preview
              </span>
            </div>
          </div>

          {/* Instant Demo Pass */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={() => loginDemo('admin')}
              disabled={loading}
              className="text-xs gap-1.5 h-9 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Demo as Admin</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => loginDemo('member')}
              disabled={loading}
              className="text-xs gap-1.5 h-9 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>Demo as Member</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GitHub Device Auth Modal */}
      <DeviceAuthModal
        open={deviceModalOpen}
        onOpenChange={setDeviceModalOpen}
        onSuccess={async (tok) => {
          await loginWithToken(tok, remember);
        }}
      />
    </div>
  );
};
