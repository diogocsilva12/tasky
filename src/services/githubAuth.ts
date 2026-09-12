export interface GitHubUser {
  username: string;
  name: string | null;
  avatarUrl: string;
  scopes: string[];
  role: 'super-admin' | 'admin' | 'member' | 'unauthenticated';
  isDemo: boolean;
}

const TOKEN_KEY = 'tasky_github_pat';
let memoryToken: string | null = null;

export const setToken = (token: string) => {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    memoryToken = token;
  }
};

export const getToken = (): string | null => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || memoryToken;
  } catch (e) {
    return memoryToken;
  }
};

export const clearToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // ignore
  }
  memoryToken = null;
};

export const validateToken = async (token: string, isDemo = false, demoRole: 'admin' | 'member' = 'member'): Promise<GitHubUser> => {
  if (isDemo) {
    if (demoRole === 'admin') {
      return {
        username: 'diogocsilva12',
        name: 'Demo Admin',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1234567?v=4',
        scopes: ['repo', 'project', 'gist'],
        role: 'super-admin',
        isDemo: true,
      };
    } else {
      return {
        username: 'guest-dev',
        name: 'Guest Developer',
        avatarUrl: 'https://avatars.githubusercontent.com/u/7654321?v=4',
        scopes: ['repo', 'project'],
        role: 'member',
        isDemo: true,
      };
    }
  }

  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error('Invalid GitHub Personal Access Token');
  }

  const data = await response.json();
  const scopesHeader = response.headers.get('x-oauth-scopes') || '';
  const scopes = scopesHeader.split(',').map(s => s.trim()).filter(Boolean);

  const role = data.login.toLowerCase() === 'diogocsilva12' ? 'super-admin' : 'member'; 

  return {
    username: data.login,
    name: data.name,
    avatarUrl: data.avatar_url,
    scopes,
    role,
    isDemo: false,
  };
};
