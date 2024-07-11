// src/app/api/pr/skill/route.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import yaml from 'js-yaml';
import { YamlLineLength, SkillYamlData, AttributionData } from '@/types';

const GITHUB_API_URL = 'https://api.github.com';
const SKILL_DIR = 'compositional_skills';
const UPSTREAM_REPO_OWNER = process.env.NEXT_PUBLIC_TAXONOMY_REPO_OWNER!;
const UPSTREAM_REPO_NAME = process.env.NEXT_PUBLIC_TAXONOMY_REPO!;
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
    const { content, attribution, name, email, submission_summary, filePath } = body;

    const githubUsername = await getGitHubUsername(headers);
    console.log('GitHub Username:', githubUsername);

    // Check if user's fork exists, if not, create it
    const forkExists = await checkUserForkExists(headers, githubUsername);
    if (!forkExists) {
      await createFork(headers);
    }

    const branchName = `skill-contribution-${Date.now()}`;
    const newYamlFilePath = `${SKILL_DIR}/${filePath}qna.yaml`;
    const newAttributionFilePath = `${SKILL_DIR}/${filePath}attribution.txt`;

    const skillData = yaml.load(content) as SkillYamlData;
    const attributionData = attribution as AttributionData;

    const yamlString = yaml.dump(skillData, { lineWidth: YamlLineLength });

    const attributionString = `Title of work: ${attributionData.title_of_work}
Link to work: ${attributionData.link_to_work}
Revision: ${attributionData.revision}
License of the work: ${attributionData.license_of_the_work}
Creator names: ${attributionData.creator_names}
`;

    // Get the base branch SHA
    const baseBranchSha = await getBaseBranchSha(headers, githubUsername);
    console.log(`Base branch SHA: ${baseBranchSha}`);

    // Create a new branch in the user's fork
    await createBranch(headers, githubUsername, branchName, baseBranchSha);

    // Create both files in a single commit
    await createFilesInSingleCommit(
      headers,
      githubUsername,
      [
        { path: newYamlFilePath, content: yamlString },
        { path: newAttributionFilePath, content: attributionString }
      ],
      branchName,
      `${submission_summary}\n\nSigned-off-by: ${name} <${email}>`
    );

    // Create a pull request from the user's fork to the upstream repository
    const pr = await createPullRequest(headers, githubUsername, branchName, submission_summary);

    return NextResponse.json(pr, { status: 201 });
  } catch (error) {
    console.error('Failed to create pull request:', error);
    return NextResponse.json({ error: 'Failed to create pull request' }, { status: 500 });
  }
}

async function getGitHubUsername(headers: HeadersInit): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch GitHub username:', response.status, errorText);
    throw new Error('Failed to fetch GitHub username');
  }

  const data = await response.json();
  return data.login;
}

async function checkUserForkExists(headers: HeadersInit, username: string) {
  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${UPSTREAM_REPO_NAME}`, {
    headers
  });

  return response.ok;
}

async function createFork(headers: HeadersInit) {
  const response = await fetch(`${GITHUB_API_URL}/repos/${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}/forks`, {
    method: 'POST',
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create fork:', response.status, errorText);
    throw new Error('Failed to create fork');
  }

  const responseData = await response.json();
  console.log('Fork created successfully:', responseData);
}

async function getBaseBranchSha(headers: HeadersInit, username: string) {
  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${UPSTREAM_REPO_NAME}/git/refs/heads/${BASE_BRANCH}`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get base branch SHA:', response.status, errorText);
    throw new Error('Failed to get base branch SHA');
  }

  const data = await response.json();
  return data.object.sha;
}

async function createBranch(headers: HeadersInit, username: string, branchName: string, baseSha: string) {
  const body = JSON.stringify({
    ref: `refs/heads/${branchName}`,
    sha: baseSha
  });

  console.log(`Creating branch with body: ${body}`);

  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${UPSTREAM_REPO_NAME}/git/refs`, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create branch:', response.status, errorText);
    throw new Error('Failed to create branch');
  }

  const responseData = await response.json();
  console.log('Branch created successfully:', responseData);
}

async function createFilesInSingleCommit(
  headers: HeadersInit,
  username: string,
  files: { path: string; content: string }[],
  branchName: string,
  commitMessage: string
) {
  const fileData = files.map((file) => ({
    path: file.path,
    mode: '100644',
    type: 'blob',
    content: file.content
  }));

  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${UPSTREAM_REPO_NAME}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: await getBaseTreeSha(headers, username, branchName),
      tree: fileData
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create files:', response.status, errorText);
    throw new Error('Failed to create files');
  }

  const treeData = await response.json();

  const commitResponse = await fetch(`${GITHUB_API_URL}/repos/${username}/${UPSTREAM_REPO_NAME}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: treeData.sha,
      parents: [await getCommitSha(headers, username, branchName)]
    })
  });

  if (!commitResponse.ok) {
    const errorText = await commitResponse.text();
    console.error('Failed to create commit:', commitResponse.status, errorText);
    throw new Error('Failed to create commit');
  }

  const commitData = await commitResponse.json();

  await fetch(`${GITHUB_API_URL}/repos/${username}/${UPSTREAM_REPO_NAME}/git/refs/heads/${branchName}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: commitData.sha
    })
  });
}

async function getBaseTreeSha(headers: HeadersInit, username: string, branchName: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${UPSTREAM_REPO_NAME}/git/trees/${branchName}`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get base tree SHA:', response.status, errorText);
    throw new Error('Failed to get base tree SHA');
  }

  const data = await response.json();
  return data.sha;
}

async function getCommitSha(headers: HeadersInit, username: string, branchName: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${UPSTREAM_REPO_NAME}/git/refs/heads/${branchName}`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get commit SHA:', response.status, errorText);
    throw new Error('Failed to get commit SHA');
  }

  const data = await response.json();
  return data.object.sha;
}

async function createPullRequest(headers: HeadersInit, username: string, branchName: string, skillSummary: string) {
  const response = await fetch(`${GITHUB_API_URL}/repos/${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `Skill: ${skillSummary}`,
      head: `${username}:${branchName}`,
      base: BASE_BRANCH
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create pull request:', response.status, errorText);
    throw new Error('Failed to create pull request');
  }

  const responseData = await response.json();
  console.log('Pull request created successfully:', responseData);

  return responseData;
}
