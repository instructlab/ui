// src/app/api/github/knowledge-files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const GITHUB_API_URL = 'https://api.github.com';
const TAXONOMY_DOCUMENTS_REPO = process.env.NEXT_PUBLIC_TAXONOMY_DOCUMENTS_REPO || 'https://github.com/instructlab-public/taxonomy-knowledge-docs';
const BASE_BRANCH = 'main';

// Interface for the response
interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate: string;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });

  if (!token || !token.accessToken) {
    console.error('Unauthorized: Missing or invalid access token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const githubToken = token.accessToken as string;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  try {
    const body = await req.json();
    const { files } = body;

    // Fetch GitHub username and email
    const { githubUsername, userEmail } = await getGitHubUsernameAndEmail(headers);

    // Split the TAXONOMY_DOCUMENTS_REPO into owner and repo name
    const repoPath = TAXONOMY_DOCUMENTS_REPO.replace('github.com/', '');
    const [repoOwner, repoName] = repoPath.split('/');

    // Check if the repository is already forked
    const repoForked = await checkIfRepoExists(headers, githubUsername, repoName);
    console.log(`Repository forked: ${repoForked}`);
    if (!repoForked) {
      // Fork the repository if it is not already forked
      await forkRepo(headers, repoOwner, repoName, githubUsername);
      // Add a delay to ensure the fork operation completes to avoid a race condition when retrieving the bas SHA
      // This only occurs if this is the first time submitting and the fork isn't present.
      // TODO change to a retry
      console.log('Pause 5s for the forking operation to complete');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log('Repository forked');
    }

    // Fetch the latest commit SHA of the base branch
    const baseBranchSha = await getBranchSha(headers, githubUsername, repoName, BASE_BRANCH);
    console.log(`Base branch SHA: ${baseBranchSha}`);

    // Create files in the main branch with unique filenames e.g. foo-20240618T203521842.md
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', 'T').slice(0, -1);
    const filesWithTimestamp = files.map((file: { fileName: string; fileContent: string }) => {
      const [name, extension] = file.fileName.split(/\.(?=[^.]+$)/);
      return {
        fileName: `${name}-${timestamp}.${extension}`,
        fileContent: file.fileContent
      };
    });

    const commitSha = await createFilesCommit(headers, githubUsername, repoName, BASE_BRANCH, filesWithTimestamp, userEmail, baseBranchSha);
    console.log(`Created files commit SHA: ${commitSha}`);

    return NextResponse.json(
      {
        repoUrl: `https://github.com/${githubUsername}/${repoName}`,
        commitSha,
        documentNames: filesWithTimestamp.map((file: { fileName: string }) => file.fileName),
        prUrl: `https://github.com/${githubUsername}/${repoName}`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to upload documents:', error);
    return NextResponse.json({ error: 'Failed to upload documents' }, { status: 500 });
  }
}

async function getGitHubUsernameAndEmail(headers: HeadersInit): Promise<{ githubUsername: string; userEmail: string }> {
  const response = await fetch(`${GITHUB_API_URL}/user`, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch GitHub username and email:', response.status, errorText);
    throw new Error('Failed to fetch GitHub username and email');
  }

  const data = await response.json();
  return { githubUsername: data.login, userEmail: data.email };
}

async function checkIfRepoExists(headers: HeadersInit, owner: string, repo: string): Promise<boolean> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}`, { headers });
  const exists = response.ok;
  if (!exists) {
    const errorText = await response.text();
    console.error('Repository does not exist:', response.status, errorText);
  }
  return exists;
}

async function forkRepo(headers: HeadersInit, owner: string, repo: string, forkOwner: string) {
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
}

async function getBranchSha(headers: HeadersInit, owner: string, repo: string, branch: string): Promise<string> {
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
}

async function createFilesCommit(
  headers: HeadersInit,
  owner: string,
  repo: string,
  branchName: string,
  files: { fileName: string; fileContent: string }[],
  userEmail: string,
  baseSha: string
): Promise<string> {
  console.log('Creating files commit...');
  // Create blobs for each file
  const blobs = await Promise.all(
    files.map((file) =>
      fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.fileContent,
          encoding: 'utf-8'
        })
      }).then((response) => response.json())
    )
  );
  console.log('Blobs created:', blobs);

  // Create tree
  const createTreeResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseSha,
      tree: files.map((file, index) => ({
        path: file.fileName,
        mode: '100644',
        type: 'blob',
        sha: blobs[index].sha
      }))
    })
  });

  if (!createTreeResponse.ok) {
    const errorText = await createTreeResponse.text();
    console.error('Failed to create tree:', createTreeResponse.status, errorText);
    throw new Error('Failed to create tree');
  }

  const treeData = await createTreeResponse.json();
  console.log('Tree created:', treeData);

  // Create commit with DCO sign-off
  // TODO: if the user's github does not have an associated github email, we need to specify one in the upload section
  // or reuse the one from the form. If we use the email field from the form, it needs to be null checked when
  // the user clicks the upload documents button.
  const createCommitResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: `Add files: ${files.map((file) => file.fileName).join(', ')}\n\nSigned-off-by: ${userEmail}`,
      tree: treeData.sha,
      parents: [baseSha]
    })
  });

  if (!createCommitResponse.ok) {
    const errorText = await createCommitResponse.text();
    console.error('Failed to create commit:', createCommitResponse.status, errorText);
    throw new Error('Failed to create commit');
  }

  const commitData = await createCommitResponse.json();
  console.log('Commit created:', commitData);

  // Update branch reference
  const updateBranchResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: commitData.sha })
  });

  if (!updateBranchResponse.ok) {
    const errorText = await updateBranchResponse.text();
    console.error('Failed to update branch reference:', updateBranchResponse.status, errorText);
    throw new Error('Failed to update branch reference');
  }
  console.log('Branch reference updated');

  return commitData.sha;
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });

    if (!token || !token.accessToken) {
      console.error('Unauthorized: Missing or invalid access token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const githubToken = token.accessToken as string;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    // Fetch GitHub username and email
    const { githubUsername } = await getGitHubUsernameAndEmail(headers);

    // Split the TAXONOMY_DOCUMENTS_REPO into owner and repo name
    const repoPath = TAXONOMY_DOCUMENTS_REPO.replace('github.com/', '');
    const [_, repoName] = repoPath.split('/');

    const files = await fetchMarkdownFiles(headers, githubUsername, repoName, BASE_BRANCH);
    const knowledgeFiles: KnowledgeFile[] = [];

    for (const file of files) {
      const commitInfo = await fetchCommitInfo(headers, githubUsername, repoName, file.path);
      if (commitInfo) {
        const { sha, date } = commitInfo;
        const content = await fetchFileContent(headers, githubUsername, repoName, file.path);
        knowledgeFiles.push({
          filename: file.path,
          content: content,
          commitSha: sha,
          commitDate: date
        });
      }
    }
    return NextResponse.json({ files: knowledgeFiles }, { status: 200 });
  } catch (error) {
    console.error('Failed to process GET request:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Fetch all markdown files from the main branch
async function fetchMarkdownFiles(
  headers: HeadersInit,
  owner: string,
  repo: string,
  branchName: string
): Promise<{ path: string; content: string }[]> {
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
}

// Fetch the latest commit info for a file
async function fetchCommitInfo(headers: HeadersInit, owner: string, repo: string, filePath: string): Promise<{ sha: string; date: string } | null> {
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
}

// Fetch the content of a file from the repository
async function fetchFileContent(headers: HeadersInit, owner: string, repo: string, filePath: string): Promise<string> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${filePath}`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch content of file ${filePath} :`, response.status, errorText);
      throw new Error(`Failed to fetch content of file ${filePath}.`);
    }

    const data = await response.json();
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch (error) {
    console.error(`Error fetching content for ${filePath}:`, error);
    return '';
  }
}
