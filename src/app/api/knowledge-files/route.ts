// src/app/api/knowledge-files/route.ts

'use server';
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { cloneTaxonomyDocsRepo, findTaxonomyDocRepoPath, TAXONOMY_DOCS_ROOT_DIR } from '@/app/api/utils';

const BASE_BRANCH = 'main';

// Interface for the response
interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate: string;
}

/**
 * Function to retrieve knowledge files from a specific branch.
 * @param contributionCommitSHA - Retrieve files from the SHA.
 * @returns An array of KnowledgeFile objects.
 */
const getKnowledgeFiles = async (contributionCommitSHA: string): Promise<KnowledgeFile[]> => {
  const REPO_DIR = findTaxonomyDocRepoPath();

  // Ensure the repository path exists
  if (!fs.existsSync(REPO_DIR)) {
    throw new Error('Repository path does not exist.');
  }

  // Check if the branch exists
  const branches = await git.listBranches({ fs, dir: REPO_DIR });
  if (!branches.includes(BASE_BRANCH)) {
    throw new Error(`Branch "${BASE_BRANCH}" does not exist.`);
  }

  // Checkout the specified branch
  await git.checkout({ fs, dir: REPO_DIR, ref: BASE_BRANCH });

  // Read all files in the repository root directory

  const allFiles = await fs.promises.readdir(REPO_DIR, { recursive: true });

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
        ref: BASE_BRANCH,
        filepath: file,
        depth: 1 // Only the latest commit
      });

      if (logs.length === 0) {
        // No commits found for this file; skip it
        continue;
      }

      const latestCommit = logs[0];
      const commitSha = latestCommit.oid;

      if (contributionCommitSHA !== '') {
        if (contributionCommitSHA == commitSha) {
          const commitDate = new Date(latestCommit.commit.committer.timestamp * 1000).toISOString();

          // Read the file content
          const fileContent = fs.readFileSync(filePath, 'utf-8');

          knowledgeFiles.push({
            filename: path.basename(file),
            content: fileContent,
            commitSha: commitSha,
            commitDate: commitDate
          });
        }
      } else {
        const commitDate = new Date(latestCommit.commit.committer.timestamp * 1000).toISOString();

        // Read the file content
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        knowledgeFiles.push({
          filename: path.basename(file),
          content: fileContent,
          commitSha: commitSha,
          commitDate: commitDate
        });
      }
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
const getKnowledgeFilesHandler = async (commitSHA: string): Promise<NextResponse> => {
  try {
    const knowledgeFiles = await getKnowledgeFiles(commitSHA);
    return NextResponse.json({ files: knowledgeFiles }, { status: 200 });
  } catch (error) {
    console.error('Failed to process GET request to fetch knowledge files:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
};

/**
 * GET handler to retrieve knowledge files from the taxonomy-knowledge-doc main branch.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const commitSHA = url.searchParams.get('commitSHA');
  return await getKnowledgeFilesHandler(commitSHA ? commitSHA : '');
}

/**
 * POST handler to commit knowledge files to taxonomy-knowledge-doc repo's main branch.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branchName, currentCommitSHA, newFiles, updatedExistingFiles } = body;
    const docsRepoPath = await cloneTaxonomyDocsRepo();

    // If the repository was not cloned, return an error
    if (!docsRepoPath) {
      return NextResponse.json({ error: 'Failed to clone taxonomy knowledge docs repository' }, { status: 500 });
    }

    // Checkout the main branch
    await git.checkout({ fs, dir: docsRepoPath, ref: 'main' });

    const subDirectory = new Date().toISOString().replace(/[-:.]/g, '').replace('T', 'T').slice(0, -1);

    const newDocsDirPath = path.join(docsRepoPath, branchName, subDirectory);

    let oldDocsDirPath = '';

    if (currentCommitSHA != '') {
      const commit = await git.readCommit({ fs, dir: docsRepoPath, oid: currentCommitSHA });

      const existingSubDirectory = extractSubDirectoryName(commit.commit.message);
      if (existingSubDirectory.length === 0) {
        console.warn('No subdirectory exist. Either the commit sha is invalid, or the docs are manually deleted.');
        console.log('Continue uploading the newly provided document.');
      } else {
        console.log(`Document sub directory exist for the contribution ${branchName}:`, existingSubDirectory);
        oldDocsDirPath = path.join(docsRepoPath, branchName, existingSubDirectory);
      }
    }

    if (!fs.existsSync(newDocsDirPath)) {
      fs.mkdirSync(newDocsDirPath, { recursive: true });
      console.log(`New sub directory ${newDocsDirPath} created successfully.`);
    } else {
      console.log(`Failed to created new sub directory ${docsRepoPath}`);
      return NextResponse.json({ error: 'Failed to upload documents.' }, { status: 500 });
    }

    if (oldDocsDirPath != '') {
      const existingFiles = fs.readdirSync(oldDocsDirPath);
      // Copy existing document to new sub directory
      for (const existingFile of existingFiles) {
        if (updatedExistingFiles.some((file: { fileName: string; fileContent: string }) => file.fileName === existingFile)) {
          const sourcePath = path.join(oldDocsDirPath, existingFile);
          const targetPath = path.join(newDocsDirPath, existingFile);

          const stat = fs.statSync(sourcePath);

          if (stat.isFile()) {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`Copied file: ${sourcePath} -> ${targetPath}`);
          } else {
            console.error('Unexpected sub directory found in the existing document directory. Skipping it. : ', sourcePath);
          }
        } else {
          console.log(`${existingFile} is either deleted or replaced with newer version`);
        }
      }

      //Delete the old directory
      fs.rmdirSync(oldDocsDirPath, { recursive: true });
    }

    // Write the files to the repository
    for (const file of newFiles) {
      const filePath = path.join(newDocsDirPath, file.fileName);
      console.log(`Writing file to ${filePath} in taxonomy knowledge docs repository.`);
      fs.writeFileSync(filePath, file.fileContent);
    }

    const finalFiles = fs.readdirSync(newDocsDirPath);
    const filenames = finalFiles.map((file) => path.join(branchName, subDirectory, file));

    // Stage the files
    await git.add({ fs, dir: docsRepoPath, filepath: '.' });
    await git.remove({ fs, dir: docsRepoPath, filepath: '.' });

    // Commit the files
    const commitSha = await git.commit({
      fs,
      dir: docsRepoPath,
      author: { name: 'instructlab-ui', email: 'ui@instructlab.ai' },
      message: `Contribution Name: ${branchName}\n\nSub-Directory:${subDirectory}\n\nDocument uploaded: ${finalFiles}\n\nSigned-off-by: ui@instructlab.ai`
    });

    console.log(`Successfully committed documents to taxonomy knowledge docs repository with commit SHA: ${commitSha}`);

    const origTaxonomyDocsRepoDir = path.join(TAXONOMY_DOCS_ROOT_DIR, '/taxonomy-knowledge-docs');
    return NextResponse.json(
      {
        repoUrl: origTaxonomyDocsRepoDir,
        commitSha,
        documentNames: filenames
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to upload knowledge documents:', error);
    return NextResponse.json({ error: 'Failed to upload knowledge documents' }, { status: 500 });
  }
}

/**
 *  Extract the sub directory name where documents are stored.
 * @param commitMessage Commit message from the provided SHA
 * @returns
 */
function extractSubDirectoryName(commitMessage: string): string {
  const match = commitMessage.match(/Sub-Directory:(.+)/);
  if (!match) return '';
  return match[1].trim();
}
