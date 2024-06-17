// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const GITHUB_API_URL = 'https://api.github.com';
const TAXONOMY_DOCUMENTS_REPO = process.env.TAXONOMY_DOCUMENTS_REPO!;
const BASE_BRANCH = 'main';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  console.log('GitHub Token:', token);

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
    console.log('GitHub Username:', githubUsername);
    console.log('User Email:', userEmail);

    const repoOwner = githubUsername;
    const repoName = TAXONOMY_DOCUMENTS_REPO.split('/').pop();

    if (!repoName) {
      throw new Error('Repository name is undefined');
    }

    const newBranchName = `upload-${Date.now()}`;

    // Get the base branch SHA
    const baseBranchSha = await getBranchSha(headers, repoOwner, repoName, BASE_BRANCH);
    console.log(`Base branch SHA: ${baseBranchSha}`);

    // Create a new branch
    await createBranch(headers, repoOwner, repoName, newBranchName, baseBranchSha);

    // Create files in the new branch
    const commitSha = await createFilesCommit(headers, repoOwner, repoName, newBranchName, files, userEmail);

    // Create a pull request
    const prUrl = await createPullRequest(
      headers,
      repoOwner,
      repoName,
      newBranchName,
      files.map((file: { fileName: string }) => file.fileName).join(', ')
    );

    return NextResponse.json(
      {
        repoUrl: `https://github.com/${repoOwner}/${repoName}`,
        commitSha,
        documentNames: files.map((file: { fileName: string }) => file.fileName),
        prUrl
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

async function getBranchSha(headers: HeadersInit, owner: string, repo: string, branch: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get branch SHA:', response.status, errorText);
    throw new Error('Failed to get branch SHA');
  }

  const data = await response.json();
  return data.object.sha;
}

async function createBranch(headers: HeadersInit, owner: string, repo: string, branchName: string, baseSha: string) {
  const body = JSON.stringify({
    ref: `refs/heads/${branchName}`,
    sha: baseSha
  });

  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create branch:', response.status, errorText);
    throw new Error('Failed to create branch');
  }
}

async function createFilesCommit(
  headers: HeadersInit,
  owner: string,
  repo: string,
  branchName: string,
  files: { fileName: string; fileContent: string }[],
  userEmail: string
): Promise<string> {
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

  // Get base tree
  const baseTreeSha = await getBaseTreeSha(headers, owner, repo, branchName);

  // Create tree
  const createTreeResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
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

  // Create commit with DCO sign-off
  const createCommitResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: `Add files: ${files.map((file) => file.fileName).join(', ')}\n\nSigned-off-by: ${userEmail}`,
      tree: treeData.sha,
      parents: [await getBranchSha(headers, owner, repo, branchName)]
    })
  });

  if (!createCommitResponse.ok) {
    const errorText = await createCommitResponse.text();
    console.error('Failed to create commit:', createCommitResponse.status, errorText);
    throw new Error('Failed to create commit');
  }

  const commitData = await createCommitResponse.json();

  // Update branch reference
  await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: commitData.sha })
  });

  return commitData.sha;
}

async function getBaseTreeSha(headers: HeadersInit, owner: string, repo: string, branch: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${branch}`, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get base tree SHA:', response.status, errorText);
    throw new Error('Failed to get base tree SHA');
  }

  const data = await response.json();
  return data.sha;
}

async function createPullRequest(headers: HeadersInit, owner: string, repo: string, branchName: string, fileNames: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `Add files: ${fileNames}`,
      head: branchName,
      base: BASE_BRANCH
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create pull request:', response.status, errorText);
    throw new Error('Failed to create pull request');
  }

  const data = await response.json();
  return data.html_url;
}
