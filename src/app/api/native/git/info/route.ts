// src/app/api/native/git/knowledge-files/route.ts

'use server';
import { NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { cloneTaxonomyDocsRepo, findTaxonomyDocRepoPath, TAXONOMY_DOCS_ROOT_DIR } from '@/app/api/native/git/utils';

/**
 * GET handler to retrieve knowledge files from the taxonomy-knowledge-doc main branch.
 */
export async function GET() {
  try {
    const docsRepoUrl = await cloneTaxonomyDocsRepo();
    const REPO_DIR = findTaxonomyDocRepoPath();

    // If the repository was not cloned, return an error
    if (!docsRepoUrl) {
      return NextResponse.json({ error: 'Failed to clone taxonomy knowledge docs repository' }, { status: 500 });
    }

    let commitSha: string = '';

    // Checkout the main branch
    await git.checkout({
      fs,
      dir: docsRepoUrl,
      ref: 'main',
      onPostCheckout: (data) => {
        commitSha = data.newHead;
      }
    });

    // Read all files in the repository root directory
    const allFiles = fs.readdirSync(REPO_DIR);

    // Filter for Markdown files only
    const markdownFiles = allFiles.filter((file) => path.extname(file).toLowerCase() === '.md');

    const knowledgeFiles: {
      filename: string;
      commitSha: string;
    }[] = [];
    let mostRecentSha = '';
    let mostRecentDate = 0;

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
          ref: 'main',
          filepath: file,
          depth: 1 // Only the latest commit
        });

        if (logs.length === 0) {
          // No commits found for this file; skip it
          continue;
        }

        const latestCommit = logs[0];
        const commitSha = latestCommit.oid;
        const commitDate = latestCommit.commit.committer.timestamp;

        if (commitDate > mostRecentDate) {
          mostRecentDate = commitDate;
          mostRecentSha = commitSha;
        }

        knowledgeFiles.push({ filename: file, commitSha: commitSha });
      } catch (error) {
        console.error(`Failed to retrieve commit for file ${file}:`, error);
      }
    }

    const fileNames = knowledgeFiles
      .filter((knowledgeFile) => knowledgeFile.commitSha === mostRecentSha)
      .map((knowledgeFile) => knowledgeFile.filename)
      .join(',');
    const origTaxonomyDocsRepoDir = path.join(TAXONOMY_DOCS_ROOT_DIR, '/taxonomy-knowledge-docs');

    return NextResponse.json(
      {
        repoUrl: origTaxonomyDocsRepoDir,
        commitSha,
        fileNames
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to upload knowledge documents:', error);
    return NextResponse.json({ error: 'Failed to upload knowledge documents' }, { status: 500 });
  }
}
