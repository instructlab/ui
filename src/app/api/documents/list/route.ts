// src/app/api/documents/list/route.ts

'use server';
import { NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { DOC_POOL_DIR, findTaxonomyDocRepoPath } from '@/app/api/utils';
import { KnowledgeFile } from '@/types';
import { devLog } from '@/utils/devlog';

const BASE_BRANCH = 'main';

/**
 * Function to retrieve list of documents from taxonomy-knowledge-docs document pool.
 * @returns An array of document name.
 */
const getKnowledgeFiles = async (): Promise<KnowledgeFile[]> => {
  const REPO_DIR = findTaxonomyDocRepoPath();
  const knowledgeFiles: KnowledgeFile[] = [];

  // Ensure the repository path exists
  if (!fs.existsSync(REPO_DIR)) {
    devLog("Taxonomy knowledge doc directory doesn't exist at :", REPO_DIR);
    return knowledgeFiles;
  }

  // Check if the branch exists
  const branches = await git.listBranches({ fs, dir: REPO_DIR });
  if (!branches.includes(BASE_BRANCH)) {
    throw new Error(`Branch "${BASE_BRANCH}" does not exist.`);
  }

  // Checkout the specified branch
  await git.checkout({ fs, dir: REPO_DIR, ref: BASE_BRANCH });

  // Read all files in the repository root directory

  const docPoolDir = path.join(REPO_DIR, DOC_POOL_DIR);

  // Ensure the doc-pool directory exist
  if (!fs.existsSync(docPoolDir)) {
    devLog(`${DOC_POOL_DIR} directory doesn't exist.`);
    return knowledgeFiles;
  }

  const allFiles = await fs.promises.readdir(docPoolDir, { recursive: true });

  // Filter for Markdown files only
  const markdownFiles = allFiles.filter((file) => path.extname(file).toLowerCase() === '.md');

  for (const file of markdownFiles) {
    const filePath = path.join(docPoolDir, file);

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
        ref: BASE_BRANCH,
        filepath: path.join(DOC_POOL_DIR, file),
        depth: 1 // Only the latest commit
      });

      if (logs.length === 0) {
        // No commits found for this file; skip it
        continue;
      }

      const latestCommit = logs[0];

      const commitDate = new Date(latestCommit.commit.committer.timestamp * 1000).toISOString();
      knowledgeFiles.push({
        filename: path.basename(file),
        commitDate: commitDate
      });
    } catch (error) {
      console.error(`Failed to retrieve commit for file ${file}:`, error);
      throw new Error(`Failed to retrieve commit for file: ${error}`);
    }
  }
  return knowledgeFiles;
};

/**
 * Handler to retrieve list of knowledge file from the taxonomy knowledge doc document pool.
 */
export async function GET() {
  try {
    const knowledgeFiles = await getKnowledgeFiles();
    return NextResponse.json({ files: knowledgeFiles }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch list of files from document pool:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
