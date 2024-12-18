// src/app/api/native/git/knowledge-files/route.ts

import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

// Constants for repository paths
const LOCAL_TAXONOMY_DOCS_ROOT_DIR =
  process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_DOCS_ROOT_DIR || `${process.env.HOME}/.instructlab-ui/taxonomy-knowledge-docs`;

// Interface for the response
interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate: string;
}

interface Branch {
  name: string;
  commitSha: string;
  commitDate: string;
}

/**
 * Function to list all branches.
 */
const listAllBranches = async (): Promise<Branch[]> => {
  const REPO_DIR = LOCAL_TAXONOMY_DOCS_ROOT_DIR;

  if (!fs.existsSync(REPO_DIR)) {
    throw new Error('Repository path does not exist.');
  }

  const branches = await git.listBranches({ fs, dir: REPO_DIR });

  const branchDetails: Branch[] = [];

  for (const branch of branches) {
    try {
      const latestCommit = await git.log({ fs, dir: REPO_DIR, ref: branch, depth: 1 });
      if (latestCommit.length === 0) {
        continue; // No commits on this branch
      }

      const commit = latestCommit[0];
      const commitSha = commit.oid;
      const commitDate = new Date(commit.commit.committer.timestamp * 1000).toISOString();

      branchDetails.push({
        name: branch,
        commitSha: commitSha,
        commitDate: commitDate
      });
    } catch (error) {
      console.error(`Failed to retrieve commit for branch ${branch}:`, error);
      continue;
    }
  }

  return branchDetails;
};

/**
 * Function to retrieve knowledge files from a specific branch.
 * @param branchName - The name of the branch to retrieve files from.
 * @returns An array of KnowledgeFile objects.
 */
const getKnowledgeFiles = async (branchName: string): Promise<KnowledgeFile[]> => {
  const REPO_DIR = LOCAL_TAXONOMY_DOCS_ROOT_DIR;

  // Ensure the repository path exists
  if (!fs.existsSync(REPO_DIR)) {
    throw new Error('Repository path does not exist.');
  }

  // Check if the branch exists
  const branches = await git.listBranches({ fs, dir: REPO_DIR });
  if (!branches.includes(branchName)) {
    throw new Error(`Branch "${branchName}" does not exist.`);
  }

  // Checkout the specified branch
  await git.checkout({ fs, dir: REPO_DIR, ref: branchName });

  // Read all files in the repository root directory
  const allFiles = fs.readdirSync(REPO_DIR);

  // Filter for Markdown files only
  const markdownFiles = allFiles.filter((file) => path.extname(file).toLowerCase() === '.md');

  const knowledgeFiles: KnowledgeFile[] = [];

  for (const file of markdownFiles) {
    const filePath = path.join(REPO_DIR, file);

    // Check if the file is a regular file
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      continue;
    }

    try {
      // Retrieve the latest commit SHA for the file on the specified branch
      const logs = await git.log({
        fs,
        dir: REPO_DIR,
        ref: branchName,
        filepath: file,
        depth: 1 // Only the latest commit
      });

      if (logs.length === 0) {
        // No commits found for this file; skip it
        continue;
      }

      const latestCommit = logs[0];
      const commitSha = latestCommit.oid;
      const commitDate = new Date(latestCommit.commit.committer.timestamp * 1000).toISOString();

      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      knowledgeFiles.push({
        filename: file,
        content: fileContent,
        commitSha: commitSha,
        commitDate: commitDate
      });
    } catch (error) {
      console.error(`Failed to retrieve commit for file ${file}:`, error);
      // Skip files that cause errors
      continue;
    }
  }

  return knowledgeFiles;
};

/**
 * Handler for GET requests.
 * - If 'action=list-branches' is present, return all branches.
 * - Else, return knowledge files from the 'main' branch.
 */
const getKnowledgeFilesHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'list-branches') {
      const branches = await listAllBranches();
      return NextResponse.json({ branches }, { status: 200 });
    }

    // Default behavior: fetch files from 'main' branch
    const branchName = 'main';
    const knowledgeFiles = await getKnowledgeFiles(branchName);
    return NextResponse.json({ files: knowledgeFiles }, { status: 200 });
  } catch (error) {
    console.error('Failed to retrieve knowledge files:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
};

/**
 * Handler for POST requests.
 * - If 'branchName' is provided, fetch files for that branch.
 * - If 'action=diff', fetch files from the 'main' branch.
 * - Else, return an error.
 */
const postKnowledgeFilesHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { action, branchName } = body;

    if (action === 'diff') {
      // fetch files from main
      const branchNameForDiff = 'main';
      const knowledgeFiles = await getKnowledgeFiles(branchNameForDiff);
      return NextResponse.json({ files: knowledgeFiles }, { status: 200 });
    }

    if (branchName && typeof branchName === 'string') {
      // Fetch files from a specified branch
      const knowledgeFiles = await getKnowledgeFiles(branchName);
      return NextResponse.json({ files: knowledgeFiles }, { status: 200 });
    }

    // If no valid action or branchName is provided
    return NextResponse.json({ error: 'Invalid request. Provide an action or branchName.' }, { status: 400 });
  } catch (error) {
    console.error('Failed to process POST request:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
};

/**
 * GET handler to retrieve knowledge files or list branches based on 'action' query parameter.
 */
export async function GET(req: NextRequest) {
  return await getKnowledgeFilesHandler(req);
}

/**
 * POST handler to retrieve knowledge files based on 'branchName' or 'action'.
 */
export async function POST(req: NextRequest) {
  return await postKnowledgeFilesHandler(req);
}
