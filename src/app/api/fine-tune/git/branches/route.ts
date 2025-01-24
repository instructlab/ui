// src/app/api/native/fine-tune/git/branches/route.ts
import { NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

const REMOTE_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_TAXONOMY_ROOT_DIR || '';

export async function GET() {
  const REPO_DIR = path.join(REMOTE_TAXONOMY_ROOT_DIR, '/taxonomy');
  try {
    console.log(`Checking local taxonomy directory for branches: ${REPO_DIR}`);

    // Ensure the repository path exists
    if (!fs.existsSync(REPO_DIR)) {
      console.log('Local repository path does not exist:', REPO_DIR);
      return NextResponse.json({ error: 'Local repository path does not exist.' }, { status: 400 });
    }

    console.log('Local taxonomy directory exists. Proceeding with branch listing.');

    // List all branches in the repository
    const branches = await git.listBranches({ fs, dir: REPO_DIR });
    console.log(`Branches found: ${branches.join(', ')}`);

    const branchDetails = [];

    for (const branch of branches) {
      const branchCommit = await git.resolveRef({
        fs,
        dir: REPO_DIR,
        ref: branch
      });
      const commitDetails = await git.readCommit({
        fs,
        dir: REPO_DIR,
        oid: branchCommit
      });

      const commitMessage = commitDetails.commit.message;

      // Check for Signed-off-by line
      const signoffMatch = commitMessage.match(/^Signed-off-by: (.+)$/m);
      const signoff = signoffMatch ? signoffMatch[1] : null;
      const messageStr = commitMessage.split('Signed-off-by');

      branchDetails.push({
        name: branch,
        creationDate: commitDetails.commit.committer.timestamp * 1000,
        message: messageStr[0].replace(/\n+$/, ''),
        author: signoff
      });
    }

    // Sort by creation date, newest first
    branchDetails.sort((a, b) => b.creationDate - a.creationDate);

    console.log('Total branches present in native taxonomy (fine-tune):', branchDetails.length);

    return NextResponse.json({ branches: branchDetails }, { status: 200 });
  } catch (error) {
    console.error('Failed to list branches from local taxonomy (fine-tune):', error);
    return NextResponse.json({ error: 'Failed to list branches from local taxonomy (fine-tune)' }, { status: 500 });
  }
}
