import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GitHubUser, getToken, setToken as setLocalToken, clearToken, validateToken } from '../services/githubAuth';
import { PassListEntry, AccessRequest, fetchGistData, updateGistData, submitAccessRequest, PASSLIST_GIST_ID } from '../services/gistPasslist';

type AuthState = 'loading' | 'unauthenticated' | 'pending' | 'approved' | 'admin';

interface AuthContextType {
  user: GitHubUser | null;
  authState: AuthState;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  loginDemo: (role: 'admin' | 'member') => Promise<void>;
  requestAccess: (note: string) => Promise<void>;
  approveRequest: (username: string) => Promise<void>;
  rejectRequest: (username: string) => Promise<void>;
  addUserToPassList: (username: string, role: 'admin' | 'member', avatarUrl: string) => Promise<void>;
  revokeUserFromPassList: (username: string) => Promise<void>;
  passList: PassListEntry[];
  pendingRequests: AccessRequest[];
  gistId: string | null;
  refreshPassList: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [passList, setPassList] = useState<PassListEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const gistId = user && !user.isDemo ? PASSLIST_GIST_ID : null;

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          // Here we would need to check if it's a demo token in a real app,
          // but for simplicity, we'll try to validate it.
          // If the token is 'demo-admin' or 'demo-member', we handle it.
          const isDemo = token === 'demo-admin' || token === 'demo-member';
          const role = token === 'demo-admin' ? 'admin' : 'member';
          const validUser = await validateToken(token, isDemo, role);
          setUser(validUser);
          await loadGistData(token, validUser);
        } catch (e) {
          clearToken();
          setAuthState('unauthenticated');
        }
      } else {
        setAuthState('unauthenticated');
      }
    };
    initAuth();
  }, []);

  const loadGistData = async (token: string, currentUser: GitHubUser) => {
    const data = await fetchGistData(token);
    setPassList(data.passList);
    setPendingRequests(data.requests);
    
    // Determine auth state
    if (currentUser.role === 'super-admin') {
      setAuthState('admin');
    } else {
      const isApproved = data.passList.some(entry => entry.username.toLowerCase() === currentUser.username.toLowerCase());
      if (isApproved) {
        const isAdmin = data.passList.find(entry => entry.username.toLowerCase() === currentUser.username.toLowerCase())?.role === 'admin';
        setAuthState(isAdmin ? 'admin' : 'approved');
      } else {
        setAuthState('pending');
      }
    }
  };

  // Pick up incoming requests and approvals while the signed-in session stays open.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let refreshing = false;
    const refresh = async () => {
      const token = getToken();
      if (!token || refreshing || document.visibilityState === 'hidden') return;
      refreshing = true;
      try {
        const data = await fetchGistData(token);
        if (cancelled || getToken() !== token) return;
        setPassList(data.passList);
        setPendingRequests(data.requests);
        const entry = data.passList.find(entry => entry.username.toLowerCase() === user.username.toLowerCase());
        setAuthState(user.role === 'super-admin' || entry?.role === 'admin' ? 'admin' : entry ? 'approved' : 'pending');
      } catch {
        // Keep the last confirmed state; explicit refresh surfaces errors to the user.
      } finally {
        refreshing = false;
      }
    };
    const interval = window.setInterval(() => { void refresh(); }, 60_000);
    window.addEventListener('focus', refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [user]);

  const loginWithToken = async (token: string) => {
    setAuthState('loading');
    try {
      const validUser = await validateToken(token);
      setLocalToken(token);
      setUser(validUser);
      await loadGistData(token, validUser);
    } catch (e) {
      clearToken();
      setUser(null);
      setAuthState('unauthenticated');
      throw e;
    }
  };

  const loginDemo = async (role: 'admin' | 'member') => {
    setAuthState('loading');
    const token = role === 'admin' ? 'demo-admin' : 'demo-member';
    try {
      const validUser = await validateToken(token, true, role);
      setLocalToken(token);
      setUser(validUser);
      await loadGistData(token, validUser);
    } catch (e) {
      clearToken();
      setUser(null);
      setAuthState('unauthenticated');
      throw e;
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setAuthState('unauthenticated');
    setPassList([]);
    setPendingRequests([]);
  };

  const requestAccess = async (note: string) => {
    if (!user) return;
    const token = getToken() || '';
    const newRequest: AccessRequest = {
      username: user.username,
      requestedAt: new Date().toISOString(),
      avatarUrl: user.avatarUrl,
      status: 'pending',
      note,
    };
    const updatedRequests = [...pendingRequests.filter(r => r.username !== user.username), newRequest];
    await submitAccessRequest(token, newRequest);
    setPendingRequests(updatedRequests);
  };

  const approveRequest = async (username: string) => {
    if (authState !== 'admin') throw new Error('Administrator access is required.');
    const token = getToken() || '';
    const { passList, requests: pendingRequests } = await fetchGistData(token);
    const request = pendingRequests.find(r => r.username === username);
    if (!request || !user) return;

    const updatedRequests = pendingRequests.map(r => r.username === username ? { ...r, status: 'approved' as const } : r);
    const newPassListEntry: PassListEntry = {
      username: request.username,
      approvedAt: new Date().toISOString(),
      approvedBy: user.username,
      avatarUrl: request.avatarUrl,
      role: 'member',
    };
    
    const updatedPassList = [...passList.filter(p => p.username.toLowerCase() !== username.trim().toLowerCase()), newPassListEntry];
    
    await updateGistData(token, { passList: updatedPassList, requests: updatedRequests });
    setPendingRequests(updatedRequests);
    setPassList(updatedPassList);
  };

  const rejectRequest = async (username: string) => {
    if (authState !== 'admin') throw new Error('Administrator access is required.');
    const token = getToken() || '';
    const { passList, requests: pendingRequests } = await fetchGistData(token);
    const updatedRequests = pendingRequests.map(r => r.username === username ? { ...r, status: 'rejected' as const } : r);
    await updateGistData(token, { passList, requests: updatedRequests });
    setPendingRequests(updatedRequests);
  };

  const addUserToPassList = async (username: string, role: 'admin' | 'member', avatarUrl: string) => {
    if (authState !== 'admin') throw new Error('Administrator access is required.');
    const token = getToken() || '';
    const { passList, requests: pendingRequests } = await fetchGistData(token);
    if (!user) return;
    const newPassListEntry: PassListEntry = {
      username: username.trim(),
      approvedAt: new Date().toISOString(),
      approvedBy: user.username,
      avatarUrl,
      role,
    };
    const updatedPassList = [...passList.filter(p => p.username.toLowerCase() !== username.trim().toLowerCase()), newPassListEntry];
    const updatedRequests = pendingRequests.map(request => request.username.toLowerCase() === username.trim().toLowerCase()
      ? { ...request, status: 'approved' as const }
      : request);
    await updateGistData(token, { passList: updatedPassList, requests: updatedRequests });
    setPassList(updatedPassList);
    setPendingRequests(updatedRequests);
  };

  const revokeUserFromPassList = async (username: string) => {
    if (authState !== 'admin') throw new Error('Administrator access is required.');
    const token = getToken() || '';
    const { passList, requests: pendingRequests } = await fetchGistData(token);
    const updatedPassList = passList.filter(p => p.username.toLowerCase() !== username.trim().toLowerCase());
    await updateGistData(token, { passList: updatedPassList, requests: pendingRequests });
    setPassList(updatedPassList);
  };

  const refreshPassList = async () => {
    const token = getToken();
    if (token && user) {
      await loadGistData(token, user);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      authState,
      loginWithToken,
      logout,
      loginDemo,
      requestAccess,
      approveRequest,
      rejectRequest,
      addUserToPassList,
      revokeUserFromPassList,
      passList,
      pendingRequests,
      gistId,
      refreshPassList,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
