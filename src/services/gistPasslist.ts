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

let localMemoryGistData: GistData = { ...DEFAULT_GIST_DATA };
let currentGistId: string | null = null;

export const setGistId = (gistId: string) => {
  currentGistId = gistId;
};

export const fetchGistData = async (token: string, gistId?: string): Promise<GistData> => {
  if (!token) return localMemoryGistData;
  const idToFetch = gistId || currentGistId;
  
  if (!idToFetch) {
    // Attempt to find the gist
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!response.ok) return localMemoryGistData;
    const gists = await response.json();
    const targetGist = gists.find((g: any) => g.files && g.files['tasky-passlist.json']);
    
    if (targetGist) {
      currentGistId = targetGist.id;
      return await getGistContent(token, targetGist.id);
    } else {
      // Create it
      return await createGist(token);
    }
  }

  return await getGistContent(token, idToFetch);
};

const getGistContent = async (token: string, gistId: string): Promise<GistData> => {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!response.ok) return localMemoryGistData;
  const gist = await response.json();
  try {
    const passList = JSON.parse(gist.files['tasky-passlist.json'].content);
    const requests = JSON.parse(gist.files['tasky-requests.json']?.content || '[]');
    return { passList, requests };
  } catch (e) {
    return localMemoryGistData;
  }
};

const createGist = async (token: string): Promise<GistData> => {
  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Tasky Auth & Admin Pass-List',
      public: false,
      files: {
        'tasky-passlist.json': {
          content: JSON.stringify(DEFAULT_GIST_DATA.passList, null, 2),
        },
        'tasky-requests.json': {
          content: JSON.stringify(DEFAULT_GIST_DATA.requests, null, 2),
        },
      },
    }),
  });
  if (response.ok) {
    const gist = await response.json();
    currentGistId = gist.id;
  }
  return DEFAULT_GIST_DATA;
};

export const updateGistData = async (token: string, data: GistData): Promise<void> => {
  if (!token) {
    localMemoryGistData = data;
    return;
  }
  if (!currentGistId) return;

  await fetch(`https://api.github.com/gists/${currentGistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        'tasky-passlist.json': {
          content: JSON.stringify(data.passList, null, 2),
        },
        'tasky-requests.json': {
          content: JSON.stringify(data.requests, null, 2),
        },
      },
    }),
  });
};
