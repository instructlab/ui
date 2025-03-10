export const GITHUB_API_URL = 'https://api.github.com';
export const TAXONOMY_DOCUMENTS_REPO =
  process.env.NEXT_PUBLIC_TAXONOMY_DOCUMENTS_REPO || 'https://github.com/instructlab-public/taxonomy-knowledge-docs';
export const BASE_BRANCH = 'main';

export const prInfoFromSummary = (summaryString: string): { prTitle: string, prBody?: string } => {
  const prTitle = summaryString.length > 60 ? `${summaryString.slice(0, 60)}...` : summaryString;
  const prBody = summaryString.length > 60 ? `${summaryString.slice(60)}...` : undefined;
  return { prTitle, prBody};
};

export const checkIfRepoExists = async (headers: HeadersInit, owner: string, repo: string): Promise<boolean> => {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}`, { headers });
  const exists = response.ok;
  if (!exists) {
    const errorText = await response.text();
    console.error('Repository does not exist:', response.status, errorText);
  }
  return exists;
};

export const forkRepo = async (headers: HeadersInit, owner: string, repo: string, forkOwner: string) => {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/forks`, {
    method: 'POST',
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fork repository:', response.status, errorText);
    throw new Error('Failed to fork repository');
  }

  // Wait for the fork to be created
  let forkCreated = false;
  for (let i = 0; i < 10; i++) {
    const forkExists = await checkIfRepoExists(headers, forkOwner, repo);
    if (forkExists) {
      forkCreated = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  if (!forkCreated) {
    throw new Error('Failed to confirm fork creation');
  }
};

export const getBranchSha = async (headers: HeadersInit, owner: string, repo: string, branch: string): Promise<string> => {
  console.log(`Fetching branch SHA for ${branch}...`);
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get branch SHA:', response.status, errorText);
    if (response.status === 409 && errorText.includes('Git Repository is empty')) {
      throw new Error('Git Repository is empty.');
    }
    throw new Error('Failed to get branch SHA');
  }

  const data = await response.json();
  console.log('Branch SHA:', data.object.sha);
  return data.object.sha;
};

// Fetch all markdown files from the main branch
export const fetchMarkdownFiles = async (
  headers: HeadersInit,
  owner: string,
  repo: string,
  branchName: string
): Promise<{ path: string; content: string }[]> => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${branchName}?recursive=1`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch files from knowledge document repository:', response.status, errorText);
      throw new Error('Failed to fetch file from knowledge document  repository:');
    }

    const data = await response.json();
    const files = data.tree.filter(
      (item: { type: string; path: string }) => item.type === 'blob' && item.path.endsWith('.md') && item.path !== 'README.md'
    );
    return files.map((file: { path: string; content: string }) => ({ path: file.path, content: file.content }));
  } catch (error) {
    console.error('Error fetching files from knowledge document repository:', error);
    return [];
  }
};

// Fetch the latest commit info for a file
export const fetchCommitInfo = async (
  headers: HeadersInit,
  owner: string,
  repo: string,
  filePath: string
): Promise<{ sha: string; date: string } | null> => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/commits?path=${filePath}`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch commit information for file:', response.status, errorText);
      throw new Error('Failed to fetch commit information for file.');
    }

    const data = await response.json();
    if (data.length === 0) return null;

    return {
      sha: data[0].sha,
      date: data[0].commit.committer.date
    };
  } catch (error) {
    console.error(`Error fetching commit info for ${filePath}:`, error);
    return null;
  }
};
