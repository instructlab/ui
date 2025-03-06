// src/app/api/github/knowledge-files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  BASE_BRANCH,
  checkIfRepoExists,
  fetchCommitInfo,
  fetchMarkdownFiles,
  forkRepo,
  getBranchSha,
  GITHUB_API_URL,
  TAXONOMY_DOCUMENTS_REPO
} from '@/app/api/github/utils';

export async function GET(req: NextRequest) {
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
    // Fetch GitHub username
    const githubUsername = await getGitHubUsername(headers);

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

    const files = await fetchMarkdownFiles(headers, githubUsername, repoName, BASE_BRANCH);

    let mostRecentSha = '';
    let mostRecentDate = 0;
    let mostRecentFiles: string[] = [];

    for (const file of files) {
      const commitInfo = await fetchCommitInfo(headers, githubUsername, repoName, file.path);
      if (commitInfo) {
        const { sha, date } = commitInfo;
        const commitDate = new Date(date).getTime();
        if (commitDate > mostRecentDate) {
          mostRecentDate = commitDate;
          mostRecentSha = sha;
          mostRecentFiles = [];
        }
        if (sha === mostRecentSha) {
          mostRecentFiles.push(file.path);
        }
      }
    }
    const fileNames = mostRecentFiles.join(',');

    return NextResponse.json(
      {
        repoUrl: `https://github.com/${githubUsername}/${repoName}`,
        commitSha: baseBranchSha,
        fileNames
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to retrieve document info:', error);
    return NextResponse.json({ error: 'Failed to retrieve document info' }, { status: 500 });
  }
}

async function getGitHubUsername(headers: HeadersInit): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/user`, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch GitHub username:', response.status, errorText);
    throw new Error('Failed to fetch GitHub username');
  }

  const data = await response.json();
  return data.login;
}
