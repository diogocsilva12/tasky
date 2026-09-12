import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GitHubUser, getToken, setToken as setLocalToken, clearToken, validateToken } from '../services/githubAuth';
import { PassListEntry, AccessRequest, fetchGistData, updateGistData } from '../services/gistPasslist';

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
  const [gistId] = useState<string | null>(null);

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

  const loginWithToken = async (token: string) => {
    setAuthState('loading');
    try {
      const validUser = await validateToken(token);
      setLocalToken(token);
      setUser(validUser);
      await loadGistData(token, validUser);
    } catch (e) {
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
    setPendingRequests(updatedRequests);
    await updateGistData(token, { passList, requests: updatedRequests });
  };

  const approveRequest = async (username: string) => {
    const token = getToken() || '';
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
    
    const updatedPassList = [...passList.filter(p => p.username !== username), newPassListEntry];
    
    setPendingRequests(updatedRequests);
    setPassList(updatedPassList);
    await updateGistData(token, { passList: updatedPassList, requests: updatedRequests });
  };

  const rejectRequest = async (username: string) => {
    const token = getToken() || '';
    const updatedRequests = pendingRequests.map(r => r.username === username ? { ...r, status: 'rejected' as const } : r);
    setPendingRequests(updatedRequests);
    await updateGistData(token, { passList, requests: updatedRequests });
  };

  const addUserToPassList = async (username: string, role: 'admin' | 'member', avatarUrl: string) => {
    const token = getToken() || '';
    if (!user) return;
    const newPassListEntry: PassListEntry = {
      username,
      approvedAt: new Date().toISOString(),
      approvedBy: user.username,
      avatarUrl,
      role,
    };
    const updatedPassList = [...passList.filter(p => p.username !== username), newPassListEntry];
    setPassList(updatedPassList);
    await updateGistData(token, { passList: updatedPassList, requests: pendingRequests });
  };

  const revokeUserFromPassList = async (username: string) => {
    const token = getToken() || '';
    const updatedPassList = passList.filter(p => p.username !== username);
    setPassList(updatedPassList);
    await updateGistData(token, { passList: updatedPassList, requests: pendingRequests });
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
