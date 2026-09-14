export interface PassListEntry {
  username: string;
  approvedAt: string;
  approvedBy: string;
  avatarUrl: string;
  role: 'admin' | 'member';
}

export interface AccessRequest {
  username: string;
  requestedAt: string;
  avatarUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
}

export interface GistData {
  passList: PassListEntry[];
  requests: AccessRequest[];
}

const DEFAULT_GIST_DATA: GistData = {
  passList: [
    {
      username: 'diogocsilva12',
      approvedAt: new Date().toISOString(),
      approvedBy: 'system',
      avatarUrl: 'https://avatars.githubusercontent.com/u/0?v=4', 
      role: 'admin',
    },
  ],
  requests: [],
};

// All accounts must read the same owner-controlled Gist, including secret Gists.
export const PASSLIST_GIST_ID = '1cf8b94ee4ce2b16db050183d7d093b6';
const OWNER = 'diogocsilva12';
const REQUEST_TYPE = 'tasky-access-request-v1';
let localMemoryGistData: GistData = structuredClone(DEFAULT_GIST_DATA);
const isDemo = (token: string) => token === 'demo-admin' || token === 'demo-member';

async function github<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub access storage failed (${response.status}). Check your connection and token's gist permission, then retry.`);
  }
  return response.json() as Promise<T>;
}

interface GistComment {
  body: string;
  created_at: string;
  user: { login: string; avatar_url: string } | null;
}

export const fetchGistData = async (token: string): Promise<GistData> => {
  if (isDemo(token)) return structuredClone(localMemoryGistData);
  if (!token) throw new Error('Sign in to load access permissions.');
  const gist = await github<{
    owner: { login: string };
    files: Record<string, { content: string; truncated?: boolean }>;
  }>(token, `/gists/${PASSLIST_GIST_ID}`);
  if (gist.owner.login.toLowerCase() !== OWNER) throw new Error('Invalid access storage owner.');
  if (Object.values(gist.files).some(file => file.truncated)) throw new Error('Access storage is too large to read safely.');
  const passList: PassListEntry[] = JSON.parse(gist.files['tasky-passlist.json'].content);
  const requests: AccessRequest[] = JSON.parse(gist.files['tasky-requests.json']?.content || '[]');
  if (!Array.isArray(passList) || !Array.isArray(requests)) throw new Error('Invalid access storage data.');

  // Only the Gist owner can edit files. Other users submit authenticated comments.
  // Never trust identity or approval fields supplied inside a comment body.
  const merged = new Map(requests.map(request => [request.username.toLowerCase(), request]));
  for (let page = 1; ; page++) {
    const comments = await github<GistComment[]>(token, `/gists/${PASSLIST_GIST_ID}/comments?per_page=100&page=${page}`);
    for (const comment of comments) {
      if (!comment.user) continue;
      let body;
      try { body = JSON.parse(comment.body); } catch { continue; }
      if (body?.type !== REQUEST_TYPE || typeof body.note !== 'string') continue;
      const username = comment.user.login;
      const key = username.toLowerCase();
      // Persisted decisions win over comments, so old requests cannot reappear.
      if (merged.has(key) || passList.some(entry => entry.username.toLowerCase() === key)) continue;
      merged.set(key, {
        username,
        requestedAt: comment.created_at,
        avatarUrl: comment.user.avatar_url,
        status: 'pending',
        note: body.note,
      });
    }
    if (comments.length < 100) break;
  }
  return { passList, requests: [...merged.values()] };
};

export const submitAccessRequest = async (token: string, request: AccessRequest): Promise<void> => {
  if (isDemo(token)) {
    localMemoryGistData.requests = [...localMemoryGistData.requests.filter(r => r.username.toLowerCase() !== request.username.toLowerCase()), request];
    return;
  }
  if (!token) throw new Error('Sign in to request access.');
  await github(token, `/gists/${PASSLIST_GIST_ID}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body: JSON.stringify({ type: REQUEST_TYPE, note: request.note }) }),
  });
};

export const updateGistData = async (token: string, data: GistData): Promise<void> => {
  if (isDemo(token)) {
    localMemoryGistData = structuredClone(data);
    return;
  }
  if (!token) throw new Error('Sign in to update access permissions.');
  await github(token, `/gists/${PASSLIST_GIST_ID}`, {
    method: 'PATCH',
    body: JSON.stringify({
      files: {
        'tasky-passlist.json': { content: JSON.stringify(data.passList, null, 2) },
        'tasky-requests.json': { content: JSON.stringify(data.requests, null, 2) },
      },
    }),
  });
};
