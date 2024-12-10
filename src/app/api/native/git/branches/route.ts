// src/app/api/native/git/branches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

// Get the repository path from the environment variable
const TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_TAXONOMY_ROOT_DIR || './.instructlab-ui';

export async function GET() {
  const REPO_DIR = path.join(TAXONOMY_ROOT_DIR, '/taxonomy');
  try {
    // Ensure the repository path exists
    if (!fs.existsSync(REPO_DIR)) {
      return NextResponse.json({ error: 'Repository path does not exist.' }, { status: 400 });
    }

    // List all branches in the repository
    const branches = await git.listBranches({ fs, dir: REPO_DIR });
    const branchDetails = [];

    for (const branch of branches) {
      const branchCommit = await git.resolveRef({ fs, dir: REPO_DIR, ref: branch });
      const commitDetails = await git.readCommit({ fs, dir: REPO_DIR, oid: branchCommit });

      branchDetails.push({
        name: branch,
        creationDate: commitDetails.commit.committer.timestamp * 1000 // Convert to milliseconds
      });
    }

    branchDetails.sort((a, b) => b.creationDate - a.creationDate); // Sort by creation date, newest first

    console.log('Branches present in native taxonomy:', branchDetails);
    return NextResponse.json({ branches: branchDetails }, { status: 200 });
  } catch (error) {
    console.error('Failed to list branches:', error);
    return NextResponse.json({ error: 'Failed to list branches' }, { status: 500 });
  }
}

// Handle POST requests for merge or branch comparison
export async function POST(req: NextRequest) {
  const REPO_DIR = path.join(TAXONOMY_ROOT_DIR, '/taxonomy');
  const { branchName, action } = await req.json();

  try {
    if (action === 'merge') {
      // Ensure valid branch name
      if (!branchName || branchName === 'main') {
        return NextResponse.json({ error: 'Invalid branch name for merge' }, { status: 400 });
      }

      // Initialize the repository and checkout main branch
      await git.init({ fs, dir: REPO_DIR });
      await git.checkout({ fs, dir: REPO_DIR, ref: 'main' });

      // Perform the merge
      await git.merge({
        fs,
        dir: REPO_DIR,
        ours: 'main',
        theirs: branchName,
        author: {
          name: 'Instruct Lab Local',
          email: 'local@instructlab.ai'
        }
      });

      return NextResponse.json({ message: `Successfully merged ${branchName} into main.` }, { status: 200 });
    } else if (action === 'diff') {
      // Ensure valid branch name
      if (!branchName || branchName === 'main') {
        return NextResponse.json({ error: 'Invalid branch name for comparison' }, { status: 400 });
      }

      // Fetch the commit SHA for `main` and the target branch
      const mainCommit = await git.resolveRef({ fs, dir: REPO_DIR, ref: 'main' });
      const branchCommit = await git.resolveRef({ fs, dir: REPO_DIR, ref: branchName });

      const mainFiles = await getFilesFromTree(mainCommit);
      const branchFiles = await getFilesFromTree(branchCommit);

      const changes = [];

      // Identify modified and deleted files
      for (const file in mainFiles) {
        if (branchFiles[file]) {
          if (mainFiles[file] !== branchFiles[file]) {
            changes.push({ file, status: 'modified' });
          }
        } else {
          changes.push({ file, status: 'deleted' });
        }
      }

      // Identify added files
      for (const file in branchFiles) {
        if (!mainFiles[file]) {
          changes.push({ file, status: 'added' });
        }
      }

      return NextResponse.json({ changes }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
    }
  } catch (error) {
    console.error(`Failed to ${action === 'merge' ? 'merge branch' : 'compare branches'}:`, error);
    return NextResponse.json(
      {
        error: `Failed to ${action === 'merge' ? 'merge branch' : 'compare branches'}`
      },
      { status: 500 }
    );
  } finally {
    // Ensure switching back to 'main' branch after any operation
    try {
      await git.checkout({ fs, dir: REPO_DIR, ref: 'main' });
    } catch (checkoutError) {
      console.error('Failed to switch back to main branch:', checkoutError);
    }
  }
}

// Helper function to recursively gather file paths and their oids from a tree
async function getFilesFromTree(commitOid: string) {
  const REPO_DIR = path.join(TAXONOMY_ROOT_DIR, '/taxonomy');
  const fileMap: Record<string, string> = {};

  async function walkTree(dir: string) {
    const tree = await git.readTree({ fs, dir: REPO_DIR, oid: commitOid, filepath: dir });

    for (const entry of tree.tree) {
      const fullPath = path.join(dir, entry.path);
      if (entry.type === 'blob') {
        fileMap[fullPath] = entry.oid;
      } else if (entry.type === 'tree') {
        await walkTree(fullPath); // Recursively walk subdirectories
      }
    }
  }

  await walkTree('');
  return fileMap;
}
