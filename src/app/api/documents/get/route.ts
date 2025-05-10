// src/app/api/documents/get.ts

'use server';
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { DOC_POOL_DIR, findTaxonomyDocRepoPath } from '@/app/api/utils';
import { KnowledgeFile } from '@/types';

const BASE_BRANCH = 'main';

/**
 * Function to retrieve knowledge file content from a document pool.
 * @param filename - Name of the file to retrieve
 * @returns A KnowledgeFile object with the content
 */
const getKnowledgeFiles = async (filename: string): Promise<KnowledgeFile> => {
  const REPO_DIR = findTaxonomyDocRepoPath();

  // Ensure the repository path exists
  if (!fs.existsSync(REPO_DIR)) {
    throw new Error('Taxonomy knowledge doc repository does not exist. No files present.');
  }

  // Check if the branch exists
  const branches = await git.listBranches({ fs, dir: REPO_DIR });
  if (!branches.includes(BASE_BRANCH)) {
    throw new Error(`Branch "${BASE_BRANCH}" does not exist.`);
  }

  // Checkout the specified branch
  await git.checkout({ fs, dir: REPO_DIR, ref: BASE_BRANCH });

  // check if the file exists in the document pool
  const filePath = path.join(REPO_DIR, DOC_POOL_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File "${filename}" does not exist in document pool.`);
  }

  try {
    // Retrieve the latest commit SHA for the file on the specified branch
    const logs = await git.log({
      fs,
      dir: REPO_DIR,
      ref: BASE_BRANCH,
      filepath: path.join(DOC_POOL_DIR, filename),
      depth: 1 // Only the latest commit
    });

    if (logs.length === 0) {
      throw new Error(`File "${filename}" exist, but has no related commit history.`);
    }

    const latestCommit = logs[0];

    const commitDate = new Date(latestCommit.commit.committer.timestamp * 1000).toISOString();

    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const knowledgeFile: KnowledgeFile = {
      filename: path.basename(filename),
      content: fileContent,
      commitDate: commitDate
    };
    return knowledgeFile;
  } catch (error) {
    console.error(`Failed to read file ${filename}:`, error);
    throw new Error(`File "${filename}" does not exist in document pool.`);
  }
};

/**
 * Handler to retrieve knowledge file content
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const filename = url.searchParams.get('filename');
  if (filename != null) {
    try {
      const knowledgeFile = await getKnowledgeFiles(filename);
      return NextResponse.json({ file: knowledgeFile }, { status: 200 });
    } catch (error) {
      console.error(`Failed to retrieve content of the file: ${filename}`, error);
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
  } else {
    console.error(`File name must be not empty.`);
    return NextResponse.json({ error: `File name must be not empty.` }, { status: 500 });
  }
}
