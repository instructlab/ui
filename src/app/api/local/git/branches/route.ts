// src/app/api/local/git/branches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

// Get the repository path from the environment variable
const REPO_DIR = process.env.NEXT_PUBLIC_LOCAL_REPO_PATH || '/path/to/local/repo';

export async function GET() {
  try {
    // Ensure the repository path exists
    if (!fs.existsSync(REPO_DIR)) {
      return NextResponse.json({ error: 'Repository path does not exist.' }, { status: 400 });
    }

    // List all branches in the repository
    const branches = await git.listBranches({ fs, dir: REPO_DIR });

    // Return the list of branches as JSON
    return NextResponse.json({ branches }, { status: 200 });
  } catch (error) {
    console.error('Failed to list branches:', error);
    return NextResponse.json({ error: 'Failed to list branches' }, { status: 500 });
  }
}

// Handle POST requests for merge or branch comparison
export async function POST(req: NextRequest) {
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
  }
}

// Helper function to recursively gather file paths and their oids from a tree
async function getFilesFromTree(commitOid: string) {
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
