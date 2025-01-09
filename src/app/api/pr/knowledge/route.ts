// src/app/api/pr/knowledge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import yaml from 'js-yaml';
import { KnowledgeYamlData, AttributionData } from '@/types';
import { GITHUB_API_URL, BASE_BRANCH } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { checkUserForkExists, createBranch, createFilesInSingleCommit, createFork, getBaseBranchSha, getGitHubUsername } from '@/utils/github';

const KNOWLEDGE_DIR = 'knowledge';
const UPSTREAM_REPO_OWNER = process.env.NEXT_PUBLIC_TAXONOMY_REPO_OWNER!;
const UPSTREAM_REPO_NAME = process.env.NEXT_PUBLIC_TAXONOMY_REPO!;

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
    const { content, attribution, name, email, submissionSummary, documentOutline, filePath } = body;

    const knowledgeData: KnowledgeYamlData = yaml.load(content) as KnowledgeYamlData;
    const attributionData: AttributionData = attribution;

    // Fetch GitHub username
    const githubUsername = await getGitHubUsername(headers);
    console.log('Knowledge contribution from gitHub Username:', githubUsername);

    // Check if user's fork exists, if not, create it
    const forkExists = await checkUserForkExists(headers, githubUsername, UPSTREAM_REPO_NAME);
    if (!forkExists) {
      await createFork(headers, UPSTREAM_REPO_OWNER, UPSTREAM_REPO_NAME, githubUsername);
    }

    const branchName = `knowledge-contribution-${Date.now()}`;
    const newYamlFilePath = `${KNOWLEDGE_DIR}/${filePath}qna.yaml`;
    const newAttributionFilePath = `${KNOWLEDGE_DIR}/${filePath}attribution.txt`;

    const yamlString = dumpYaml(knowledgeData);

    const attributionContent = `Title of work: ${attributionData.title_of_work}
Link to work: ${attributionData.link_to_work}
Revision: ${attributionData.revision}
License of the work: ${attributionData.license_of_the_work}
Creator names: ${attributionData.creator_names}
`;

    // Get the base branch SHA
    const baseBranchSha = await getBaseBranchSha(headers, githubUsername, UPSTREAM_REPO_NAME);
    console.log(`Base branch SHA: ${baseBranchSha}`);

    // Create a new branch in the user's fork
    await createBranch(headers, githubUsername, UPSTREAM_REPO_NAME, branchName, baseBranchSha);

    // Create both files in a single commit with DCO sign-off
    await createFilesInSingleCommit(
      headers,
      githubUsername,
      UPSTREAM_REPO_NAME,
      [
        { path: newYamlFilePath, content: yamlString },
        { path: newAttributionFilePath, content: attributionContent }
      ],
      branchName,
      `${submissionSummary}\n\nSigned-off-by: ${name} <${email}>`
    );

    // Create a pull request from the user's fork to the upstream repository
    const pr = await createPullRequest(headers, githubUsername, branchName, submissionSummary, documentOutline);

    return NextResponse.json(pr, { status: 201 });
  } catch (error) {
    console.error('Failed to create pull request:', error);
    return NextResponse.json({ error: 'Failed to create pull request' }, { status: 500 });
  }
}

async function createPullRequest(headers: HeadersInit, username: string, branchName: string, knowledgeSummary: string, documentOutline: string) {
  const response = await fetch(`${GITHUB_API_URL}/repos/${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `Knowledge: ${knowledgeSummary}`,
      head: `${username}:${branchName}`,
      body: documentOutline,
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
