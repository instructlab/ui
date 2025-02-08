// src/app/api/native/git/knowledge-files/route.ts

'use server';
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import http from 'isomorphic-git/http/node';

// Constants for repository paths
const TAXONOMY_DOCS_ROOT_DIR = process.env.NEXT_PUBLIC_TAXONOMY_ROOT_DIR || '';
const TAXONOMY_DOCS_CONTAINER_MOUNT_DIR = '/tmp/.instructlab-ui';
const TAXONOMY_KNOWLEDGE_DOCS_REPO_URL =
  process.env.NEXT_PUBLIC_TAXONOMY_DOCUMENTS_REPO || 'https://github.com/instructlab-public/taxonomy-knowledge-docs';
const BASE_BRANCH = 'main';

// Interface for the response
interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate: string;
}

function findTaxonomyDocRepoPath(): string {
  // Check the location of the taxonomy docs repository .
  let remoteTaxonomyDocsRepoDirFinal: string = '';
  // Check if the taxonomy docs repo directory is mounted in the container (for container deployment) or present locally (for local deployment).
  const remoteTaxonomyDocsRepoContainerMountDir = path.join(TAXONOMY_DOCS_CONTAINER_MOUNT_DIR, '/taxonomy-knowledge-docs');
  const remoteTaxonomyDocsRepoDir = path.join(TAXONOMY_DOCS_ROOT_DIR, '/taxonomy-knowledge-docs');
  if (fs.existsSync(remoteTaxonomyDocsRepoContainerMountDir) && fs.readdirSync(remoteTaxonomyDocsRepoContainerMountDir).length !== 0) {
    remoteTaxonomyDocsRepoDirFinal = TAXONOMY_DOCS_CONTAINER_MOUNT_DIR;
  } else {
    if (fs.existsSync(remoteTaxonomyDocsRepoDir) && fs.readdirSync(remoteTaxonomyDocsRepoDir).length !== 0) {
      remoteTaxonomyDocsRepoDirFinal = TAXONOMY_DOCS_ROOT_DIR;
    }
  }
  if (remoteTaxonomyDocsRepoDirFinal === '') {
    return '';
  }

  const taxonomyDocsDirectoryPath = path.join(remoteTaxonomyDocsRepoDirFinal, '/taxonomy-knowledge-docs');
  return taxonomyDocsDirectoryPath;
}

/**
 * Function to retrieve knowledge files from a specific branch.
 * @param branchName - The name of the branch to retrieve files from.
 * @returns An array of KnowledgeFile objects.
 */
const getKnowledgeFiles = async (branchName: string): Promise<KnowledgeFile[]> => {
  const REPO_DIR = findTaxonomyDocRepoPath();

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
 * Handler for GET requests to read the knowledge files and their content.
 */
const getKnowledgeFilesHandler = async (): Promise<NextResponse> => {
  try {
    const knowledgeFiles = await getKnowledgeFiles(BASE_BRANCH);
    return NextResponse.json({ files: knowledgeFiles }, { status: 200 });
  } catch (error) {
    console.error('Failed to process GET request to fetch knowledge files:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
};

/**
 * GET handler to retrieve knowledge files from the taxonomy-knowledge-doc main branch.
 */
export async function GET() {
  return await getKnowledgeFilesHandler();
}

/**
 * POST handler to commit knowledge files to taxonomy-knowledge-doc repo's main branch.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files } = body;
    const docsRepoUrl = await cloneTaxonomyDocsRepo();

    // If the repository was not cloned, return an error
    if (!docsRepoUrl) {
      return NextResponse.json({ error: 'Failed to clone taxonomy knowledge docs repository' }, { status: 500 });
    }

    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', 'T').slice(0, -1);
    const filesWithTimestamp = files.map((file: { fileName: string; fileContent: string }) => {
      const [name, extension] = file.fileName.split(/\.(?=[^.]+$)/);
      return {
        fileName: `${name}-${timestamp}.${extension}`,
        fileContent: file.fileContent
      };
    });

    // Write the files to the repository
    const docsRepoUrlTmp = path.join(docsRepoUrl, '/');
    for (const file of filesWithTimestamp) {
      const filePath = path.join(docsRepoUrlTmp, file.fileName);
      console.log(`Writing file to ${filePath} in taxonomy knowledge docs repository.`);
      fs.writeFileSync(filePath, file.fileContent);
    }

    // Checkout the main branch
    await git.checkout({ fs, dir: docsRepoUrl, ref: 'main' });

    // Stage the files
    await git.add({ fs, dir: docsRepoUrl, filepath: '.' });

    // Commit the files
    const commitSha = await git.commit({
      fs,
      dir: docsRepoUrl,
      author: { name: 'instructlab-ui', email: 'ui@instructlab.ai' },
      message: `Add files: ${files
        .map((file: { fileName: string; fileContent: string }) => file.fileName)
        .join(', ')}\n\nSigned-off-by: ui@instructlab.ai`
    });

    console.log(`Successfully committed files to taxonomy knowledge docs repository with commit SHA: ${commitSha}`);

    const origTaxonomyDocsRepoDir = path.join(TAXONOMY_DOCS_ROOT_DIR, '/taxonomy-knowledge-docs');
    return NextResponse.json(
      {
        repoUrl: origTaxonomyDocsRepoDir,
        commitSha,
        documentNames: filesWithTimestamp.map((file: { fileName: string }) => file.fileName)
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to upload knowledge documents:', error);
    return NextResponse.json({ error: 'Failed to upload knowledge documents' }, { status: 500 });
  }
}

async function cloneTaxonomyDocsRepo() {
  // Check the location of the taxonomy repository and create the taxonomy-knowledge-doc repository parallel to that.
  let remoteTaxonomyRepoDirFinal: string = '';
  // Check if directory pointed by remoteTaxonomyRepoDir exists and not empty
  const remoteTaxonomyRepoContainerMountDir = path.join(TAXONOMY_DOCS_CONTAINER_MOUNT_DIR, '/taxonomy');
  const remoteTaxonomyRepoDir = path.join(TAXONOMY_DOCS_ROOT_DIR, '/taxonomy');
  if (fs.existsSync(remoteTaxonomyRepoContainerMountDir) && fs.readdirSync(remoteTaxonomyRepoContainerMountDir).length !== 0) {
    remoteTaxonomyRepoDirFinal = TAXONOMY_DOCS_CONTAINER_MOUNT_DIR;
  } else {
    if (fs.existsSync(remoteTaxonomyRepoDir) && fs.readdirSync(remoteTaxonomyRepoDir).length !== 0) {
      remoteTaxonomyRepoDirFinal = TAXONOMY_DOCS_ROOT_DIR;
    }
  }
  if (remoteTaxonomyRepoDirFinal === '') {
    return null;
  }

  const taxonomyDocsDirectoryPath = path.join(remoteTaxonomyRepoDirFinal, '/taxonomy-knowledge-docs');

  if (fs.existsSync(taxonomyDocsDirectoryPath)) {
    console.log(`Using existing taxonomy knowledge docs repository at ${TAXONOMY_DOCS_ROOT_DIR}/taxonomy-knowledge-docs.`);
    return taxonomyDocsDirectoryPath;
  } else {
    console.log(`Taxonomy knowledge docs repository not found at ${TAXONOMY_DOCS_ROOT_DIR}/taxonomy-knowledge-docs. Cloning...`);
  }

  try {
    await git.clone({
      fs,
      http,
      dir: taxonomyDocsDirectoryPath,
      url: TAXONOMY_KNOWLEDGE_DOCS_REPO_URL,
      singleBranch: true
    });

    // Include the full path in the response for client display. Path displayed here is the one
    // that user set in the environment variable.
    console.log(`Taxonomy knowledge docs repository cloned successfully to ${remoteTaxonomyRepoDir}.`);
    // Return the path that the UI sees (direct or mounted)
    return taxonomyDocsDirectoryPath;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Failed to clone taxonomy docs repository: ${errorMessage}`);
    return null;
  }
}
