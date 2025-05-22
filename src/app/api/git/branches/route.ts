// src/app/api/git/branches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { findTaxonomyRepoPath } from '@/app/api/utils';

// Get the repository path from the environment variable
const LOCAL_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR || `${process.env.HOME}/.instructlab-ui`;
const REMOTE_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_TAXONOMY_ROOT_DIR || '';

interface CommitDetails {
  message: string;
  email: string;
  name: string;
}

interface Diffs {
  file: string;
  status: string;
  content?: string;
}

export async function GET() {
  const REPO_DIR = path.join(LOCAL_TAXONOMY_ROOT_DIR, '/taxonomy');
  try {
    // Ensure the repository path exists
    if (!fs.existsSync(REPO_DIR)) {
      return NextResponse.json({ error: 'Local repository path does not exist.' }, { status: 400 });
    }

    // List all branches in the repository
    const branches = await git.listBranches({ fs, dir: REPO_DIR });
    const branchDetails = [];

    for (const branch of branches) {
      const branchCommit = await git.resolveRef({ fs, dir: REPO_DIR, ref: branch });
      const commitDetails = await git.readCommit({ fs, dir: REPO_DIR, oid: branchCommit });

      const commitMessage = commitDetails.commit.message.replace(`...\n\n...`, '');

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

    branchDetails.sort((a, b) => b.creationDate - a.creationDate); // Sort by creation date, newest first
    console.log('Total branches present in taxonomy:', branchDetails.length);

    return NextResponse.json({ branches: branchDetails }, { status: 200 });
  } catch (error) {
    console.error('Failed to list branches from local taxonomy:', error);
    return NextResponse.json({ error: 'Failed to list branches from local taxonomy' }, { status: 500 });
  }
}

// Handle POST requests for delete/diff/publish actions
export async function POST(req: NextRequest) {
  const LOCAL_TAXONOMY_DIR = path.join(LOCAL_TAXONOMY_ROOT_DIR, '/taxonomy');
  const { branchName, action } = await req.json();
  console.log('Received POST request:', { branchName, action });

  if (action === 'delete') {
    return handleDelete(branchName, LOCAL_TAXONOMY_DIR);
  }

  if (action === 'diff') {
    return handleDiff(branchName, LOCAL_TAXONOMY_DIR);
  }

  if (action === 'publish') {
    const remoteTaxonomyRepoDirFinal: string = findTaxonomyRepoPath();

    if (remoteTaxonomyRepoDirFinal === '') {
      return NextResponse.json({ error: 'Unable to locate taxonomy repository path.' }, { status: 400 });
    }

    console.log('Remote taxonomy repository path:', remoteTaxonomyRepoDirFinal);

    return handlePublish(branchName, LOCAL_TAXONOMY_DIR, remoteTaxonomyRepoDirFinal);
  }
  return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
}

async function handleDelete(branchName: string, localTaxonomyDir: string) {
  try {
    if (!branchName || branchName === 'main') {
      return NextResponse.json({ error: 'Invalid branch name for deletion' }, { status: 400 });
    }

    // Delete the target branch
    await git.deleteBranch({ fs, dir: localTaxonomyDir, ref: branchName });

    return NextResponse.json({ message: `Successfully deleted contribution ${branchName}.` }, { status: 200 });
  } catch (error) {
    console.error(`Failed to delete contribution ${branchName}:`, error);
    return NextResponse.json(
      {
        error: `Failed to delete contribution ${branchName}`
      },
      { status: 500 }
    );
  } finally {
    // Ensure switching back to 'main' branch after any operation
    try {
      await git.checkout({ fs, dir: localTaxonomyDir, ref: 'main' });
    } catch (checkoutError) {
      console.error('Failed to switch back to main branch:', checkoutError);
    }
  }
}

async function handleDiff(branchName: string, localTaxonomyDir: string) {
  try {
    // Ensure valid branch name
    if (!branchName || branchName === 'main') {
      return NextResponse.json({ error: 'Invalid branch name for comparison' }, { status: 400 });
    }

    // Resolve the reference to the branch's HEAD
    const commitOid = await git.resolveRef({
      fs,
      dir: localTaxonomyDir,
      ref: `refs/heads/${branchName}` // Resolve the branch reference
    });

    // Read the commit object using its OID
    const commit = await git.readCommit({
      fs,
      dir: localTaxonomyDir,
      oid: commitOid
    });

    const signoffMatch = commit.commit.message.split('Signed-off-by:');
    const message = signoffMatch ? signoffMatch[0].trim() : '';

    const commitDetails: CommitDetails = {
      message: message.replace('...\n\n...', ''),
      email: commit.commit.author.email,
      name: commit.commit.author.name
    };

    const changes = await findDiff(branchName, localTaxonomyDir);
    const enrichedChanges: Diffs[] = [];
    for (const change of changes) {
      if (change.status === 'added' || change.status === 'modified') {
        const fileContent = await readFileFromBranch(localTaxonomyDir, branchName, change.file);
        enrichedChanges.push({ ...change, content: fileContent });
      } else {
        enrichedChanges.push(change);
      }
    }

    return NextResponse.json({ changes: enrichedChanges, commitDetails: commitDetails }, { status: 200 });
  } catch (error) {
    console.error(`Failed to show contribution changes ${branchName}:`, error);
    return NextResponse.json(
      {
        error: `Failed to show contribution changes for ${branchName}`
      },
      { status: 500 }
    );
  } finally {
    // Ensure switching back to 'main' branch after any operation
    try {
      await git.checkout({ fs, dir: localTaxonomyDir, ref: 'main' });
    } catch (checkoutError) {
      console.error('Failed to switch back to main branch:', checkoutError);
    }
  }
}

async function findDiff(branchName: string, localTaxonomyDir: string): Promise<Diffs[]> {
  // Fetch the commit SHA for `main` and the target branch
  const mainCommit = await git.resolveRef({ fs, dir: localTaxonomyDir, ref: 'main' });
  const branchCommit = await git.resolveRef({ fs, dir: localTaxonomyDir, ref: branchName });

  const mainFiles = await getFilesFromTree(mainCommit, localTaxonomyDir);
  const branchFiles = await getFilesFromTree(branchCommit, localTaxonomyDir);

  // Create an array of Diffs to store changes
  const changes: Diffs[] = [];
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
  return changes;
}

async function getTopCommitDetails(dir: string, ref: string = 'HEAD') {
  try {
    // Fetch the top commit (latest commit on the branch)
    const [topCommit] = await git.log({
      fs,
      dir,
      ref,
      depth: 1 // Only fetch the latest commit
    });

    if (!topCommit) {
      throw new Error('No commits found in the repository.');
    }

    // Extract commit message
    const commitMessage = topCommit.commit.message;

    // Check for Signed-off-by line
    const signoffMatch = commitMessage.match(/^Signed-off-by: (.+)$/m);
    const signoff = signoffMatch ? signoffMatch[1] : null;

    return {
      message: commitMessage,
      signoff
    };
  } catch (error) {
    console.error('Error reading top commit details:', error);
    throw error;
  }
}

async function handlePublish(branchName: string, localTaxonomyDir: string, remoteTaxonomyDir: string) {
  try {
    if (!branchName || branchName === 'main') {
      return NextResponse.json({ error: 'Invalid contribution name for publish' }, { status: 400 });
    }

    console.log(`Publishing contribution from ${branchName} to remote taxonomy repo at ${remoteTaxonomyDir}`);
    const changes = await findDiff(branchName, localTaxonomyDir);

    // Check if there are any changes to publish, create a new branch at remoteTaxonomyDir and
    // copy all the files listed in the changes array to the new branch and create a commit
    if (changes.length > 0) {
      await git.checkout({ fs, dir: localTaxonomyDir, ref: branchName });
      // Read the commit message of the top commit from the branch
      const details = await getTopCommitDetails(localTaxonomyDir);

      // Check if the remote branch exists, if not create it
      const remoteBranchName = branchName;
      const remoteBranchExists = await git.listBranches({ fs, dir: remoteTaxonomyDir });
      if (remoteBranchExists.includes(remoteBranchName)) {
        console.log(`Branch ${remoteBranchName} exists in remote taxonomy, deleting it.`);
        await git.deleteBranch({ fs, dir: remoteTaxonomyDir, ref: remoteBranchName });
      } else {
        console.log(`Branch ${remoteBranchName} does not exist in remote taxonomy, creating a new branch.`);
      }

      await git.checkout({ fs, dir: remoteTaxonomyDir, ref: 'main' });
      await git.branch({ fs, dir: remoteTaxonomyDir, ref: remoteBranchName });
      await git.checkout({ fs, dir: remoteTaxonomyDir, ref: remoteBranchName });

      // Copy the files listed in the changes array to the remote branch and if the directories do not exist, create them
      for (const change of changes) {
        if (change.status !== 'deleted') {
          const filePath = path.join(localTaxonomyDir, change.file);
          const remoteFilePath = path.join(remoteTaxonomyDir, change.file);
          const remoteFileDir = path.dirname(remoteFilePath);
          if (!fs.existsSync(remoteFileDir)) {
            fs.mkdirSync(remoteFileDir, { recursive: true });
          }
          fs.copyFileSync(filePath, remoteFilePath);
        } else {
          // If deleted, ensure the file is removed from remote as well, if it exists
          const remoteFilePath = path.join(remoteTaxonomyDir, change.file);
          if (fs.existsSync(remoteFilePath)) {
            fs.rmSync(remoteFilePath);
          }
        }
      }

      await git.add({ fs, dir: remoteTaxonomyDir, filepath: '.' });

      const authorInfo = details.signoff!.match(/(.*?) <(.*?)>/);
      let authorName = '';
      let authorEmail = '';
      if (authorInfo) {
        console.log(`Author information found in signoff: ${authorInfo}`);
        authorName = authorInfo[1];
        authorEmail = authorInfo[2];
      } else {
        return NextResponse.json({ message: `Author information is not present in the contribution ${branchName}.` }, { status: 500 });
      }
      // Create a commit with the same message and signoff as the top commit from the local branch
      await git.commit({
        fs,
        dir: remoteTaxonomyDir,
        message: details.message,
        author: {
          name: authorName,
          email: authorEmail
        }
      });
      console.log(`Successfully published contribution ${branchName} to remote taxonomy repo at ${REMOTE_TAXONOMY_ROOT_DIR}/taxonomy.`);
      return NextResponse.json(
        { message: `Successfully published contribution ${branchName} to ${REMOTE_TAXONOMY_ROOT_DIR}/taxonomy.` },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ message: `No changes to publish from contribution ${branchName}.` }, { status: 200 });
    }
  } catch (error) {
    console.error(`Failed to publish contribution from ${branchName}:`, error);
    return NextResponse.json(
      {
        error: `Failed to publish contribution from ${branchName}`
      },
      { status: 500 }
    );
  } finally {
    // Ensure switching back to 'main' branch after any operation
    try {
      await git.checkout({ fs, dir: localTaxonomyDir, ref: 'main' });
    } catch (checkoutError) {
      console.error('Failed to switch back to main branch in local taxonomy repo:', checkoutError);
    }
    try {
      await git.checkout({ fs, dir: remoteTaxonomyDir, ref: 'main' });
    } catch (checkoutError) {
      console.error('Failed to switch back to main branch in remote taxonomy repo:', checkoutError);
    }
  }
}

async function readFileFromBranch(localTaxonomyDir: string, branchName: string, filePath: string): Promise<string> {
  const tempDir = path.join(localTaxonomyDir, '.temp_checkout');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const branchCommit = await git.resolveRef({ fs, dir: localTaxonomyDir, ref: branchName });
  const { blob } = await git.readBlob({ fs, dir: localTaxonomyDir, oid: branchCommit, filepath: filePath });

  const decoder = new TextDecoder('utf-8');
  const content = decoder.decode(blob);
  return content;
}

async function getFilesFromTree(commitOid: string, repoDir: string) {
  const fileMap: Record<string, string> = {};

  async function walkTree(dir: string) {
    const tree = await git.readTree({ fs, dir: repoDir, oid: commitOid, filepath: dir });
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
