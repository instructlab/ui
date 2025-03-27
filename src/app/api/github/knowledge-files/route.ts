// src/app/api/github/knowledge-files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  BASE_BRANCH,
  checkIfRepoExists,
  forkRepo,
  getBranchSha,
  getGitHubUsernameAndEmail,
  readCommit,
  GITHUB_API_URL,
  TAXONOMY_DOCUMENTS_REPO
} from '@/app/api/github/utils';
import path from 'path';

// Interface for the response
interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate: string;
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });

  if (!token || !token.accessToken) {
    console.error('Unauthorized: Missing or invalid access token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const githubToken = token.accessToken as string;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  try {
    const body = await req.json();
    const { branchName, currentCommitSHA, newFiles, updatedExistingFiles } = body;

    // Fetch GitHub username and email
    const { githubUsername, userEmail } = await getGitHubUsernameAndEmail(headers);

    // Split the TAXONOMY_DOCUMENTS_REPO into owner and repo name
    const repoPath = TAXONOMY_DOCUMENTS_REPO.replace('github.com/', '');
    const [repoOwner, repoName] = repoPath.split('/');

    // Check if the repository is already forked
    const repoForked = await checkIfRepoExists(headers, githubUsername, repoName);
    console.log(`Repository forked: ${repoForked}`);
    if (!repoForked) {
      // Fork the repository if it is not already forked
      await forkRepo(headers, repoOwner, repoName, githubUsername);
      // Add a delay to ensure the fork operation completes to avoid a race condition when retrieving the bas SHA
      // This only occurs if this is the first time submitting and the fork isn't present.
      // TODO change to a retry
      console.log('Pause 5s for the forking operation to complete');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log('Repository forked');
    }

    // Fetch the latest commit SHA of the base branch
    const baseBranchSha = await getBranchSha(headers, githubUsername, repoName, BASE_BRANCH);
    console.log(`Base branch SHA: ${baseBranchSha}`);

    // New directory for the files
    const newSubDirectory = new Date().toISOString().replace(/[-:.]/g, '').replace('T', 'T').slice(0, -1);

    // Read the preview commit sha
    let contributionName = branchName;
    let existingSubDirectory = '';
    const finalFiles = new Map<string, { fileName: string; fileContent: string }>();

    const commitMsg = await readCommit(headers, githubUsername, repoName, currentCommitSHA);
    if (commitMsg.length != 0) {
      const name = extractContributionName(commitMsg);
      if (name.length === 0) {
        console.warn('Contribution name not found. Looks like the SHA is not correct.');
        console.log('Continue uploading the newly provided document.');
      } else {
        console.log(`Contribution name found for the sha ${currentCommitSHA}:`, contributionName);
        contributionName = name;
      }

      const directory = extractSubDirectoryName(commitMsg);
      if (directory.length === 0) {
        console.warn('No subdirectory exist. Either the commit sha is invalid, or the docs are manually deleted.');
        console.log('Continue uploading the newly provided document.');
      } else {
        console.log(`Document sub directory exist for the sha ${currentCommitSHA}:`, directory);
        existingSubDirectory = directory;
      }
    } else {
      console.log('Uploading the documents for the first time for the contribution');
    }

    let existingFiles = [];
    if (existingSubDirectory.length != 0) {
      // Read all the files from the existing directory.
      existingFiles = await fetchAllFilesFromDir(headers, githubUsername, repoName, path.join(contributionName, existingSubDirectory));
      existingFiles.map((existingFile: { fileName: string; filePath: string; fileSha: string; fileContent: string }) => {
        if (updatedExistingFiles.some((file: { fileName: string; fileContent: string }) => file.fileName === existingFile.fileName)) {
          console.log('Re-uploading existing file : ', existingFile.filePath);
          finalFiles.set(existingFile.fileName, {
            fileName: path.join(contributionName, newSubDirectory, existingFile.fileName),
            fileContent: existingFile.fileContent
          });
        } else {
          console.log(`${existingFile.fileName} is either deleted or replaced with newer version`);
        }
      });
    }

    // Create files in the main branch with unique filenames e.g. foo-20240618T203521842.md
    newFiles.map((file: { fileName: string; fileContent: string; action: string }) => {
      console.log(`Uploading new file ${file.fileName} from knowledge contribution ${branchName}`);
      finalFiles.set(file.fileName, {
        fileName: path.join(contributionName, newSubDirectory, file.fileName),
        fileContent: file.fileContent
      });
    });

    const commitSha = await createFilesCommit(
      headers,
      githubUsername,
      repoName,
      BASE_BRANCH,
      contributionName,
      newSubDirectory,
      finalFiles,
      userEmail,
      baseBranchSha
    );
    console.log(`Created files commit SHA: ${commitSha}`);

    if (existingSubDirectory.length != 0 && existingFiles.length != 0) {
      // Deleting the existing files
      await deleteExistingFiles(headers, githubUsername, repoName, BASE_BRANCH, contributionName, existingSubDirectory);
      console.log('Existing files are cleaned up');
    }

    return NextResponse.json(
      {
        repoUrl: `https://github.com/${githubUsername}/${repoName}`,
        commitSha,
        documentNames: Array.from(finalFiles.values()).map((file: { fileName: string }) => file.fileName), //TODO:
        prUrl: `https://github.com/${githubUsername}/${repoName}`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to upload documents:', error);
    return NextResponse.json({ error: 'Failed to upload documents' }, { status: 500 });
  }
}

async function createFilesCommit(
  headers: HeadersInit,
  owner: string,
  repo: string,
  branchName: string,
  contributionName: string,
  subDirectory: string,
  files: Map<string, { fileName: string; fileContent: string }>,
  userEmail: string,
  baseSha: string
): Promise<string> {
  console.log('Creating files commit...');
  // Create blobs for each file
  const filesArray = Array.from(files.values());
  const blobs = await Promise.all(
    filesArray.map((file) =>
      fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.fileContent,
          encoding: 'utf-8'
        })
      }).then((response) => response.json())
    )
  );

  // Create tree
  const createTreeResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseSha,
      tree: filesArray.map((file, index) => ({
        path: file.fileName,
        mode: '100644',
        type: 'blob',
        sha: blobs[index].sha
      }))
    })
  });

  if (!createTreeResponse.ok) {
    const errorText = await createTreeResponse.text();
    console.error('Failed to create tree:', createTreeResponse.status, errorText);
    throw new Error('Failed to create tree');
  }

  const treeData = await createTreeResponse.json();
  console.log('Tree created:', treeData);

  // Create commit with DCO sign-off
  // TODO: if the user's github does not have an associated github email, we need to specify one in the upload section
  // or reuse the one from the form. If we use the email field from the form, it needs to be null checked when
  // the user clicks the upload documents button.
  const createCommitResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: `Contribution Name:${contributionName}\n\nDocument uploaded: ${filesArray.map((file) => file.fileName).join(', ')}\n\nSub-Directory:${subDirectory}\n\nSigned-off-by: ${owner} <${userEmail}>`,
      tree: treeData.sha,
      parents: [baseSha]
    })
  });

  if (!createCommitResponse.ok) {
    const errorText = await createCommitResponse.text();
    console.error('Failed to create commit:', createCommitResponse.status, errorText);
    throw new Error('Failed to create commit');
  }

  const commitData = await createCommitResponse.json();
  console.log('Commit created:', commitData);

  // Update branch reference
  const updateBranchResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: commitData.sha })
  });

  if (!updateBranchResponse.ok) {
    const errorText = await updateBranchResponse.text();
    console.error('Failed to update branch reference:', updateBranchResponse.status, errorText);
    throw new Error('Failed to update branch reference');
  }
  console.log('Branch reference updated');

  return commitData.sha;
}

async function deleteExistingFiles(
  headers: HeadersInit,
  owner: string,
  repo: string,
  branchName: string,
  contributionName: string,
  subDirectory: string
) {
  console.log('Deleting existing files for contribution : ', contributionName);
  const baseBranchSha = await getBranchSha(headers, owner, repo, branchName);
  console.log(`${contributionName}: base branch sha :`, baseBranchSha);

  try {
    let response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${baseBranchSha}?recursive=1`, {
      headers
    });

    if (!response.ok) {
      console.error('Failed to fetch the git tree', response.statusText);
    }
    const data = await response.json();

    const dirPath = path.join(contributionName, subDirectory);
    const updatedTree = data.tree.map((item: { path: string; sha: string }) => {
      if (item.path.startsWith(dirPath)) {
        return { ...item, sha: null }; // Mark for deletion
      }
      return item;
    });

    response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseBranchSha,
        tree: updatedTree
      })
    });

    if (!response.ok) {
      console.error('Failed to update the git tree', response.statusText);
    }
    const treeUpdateData = await response.json();

    response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: `Deleting subdirectory ${subDirectory} for contribution ${contributionName}`,
        tree: treeUpdateData.sha,
        parents: [baseBranchSha]
      })
    });

    if (!response.ok) {
      console.error('Failed to create a delete commit for contribution:', contributionName);
    }

    const commitData = await response.json();
    console.log('Delete commit created:', commitData);

    // Update branch reference
    const updateBranchResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: commitData.sha })
    });

    if (!updateBranchResponse.ok) {
      const errorText = await updateBranchResponse.text();
      console.error('Failed to update branch reference:', updateBranchResponse.status, errorText);
      throw new Error('Failed to update branch reference');
    }
    console.log('Branch reference updated');
    console.log(`${contributionName}: new branch sha :`, commitData.sha);
  } catch (error) {
    console.error(`Failed to delete files for the contribution : ${contributionName}`, error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const commitSHA = url.searchParams.get('commitSHA');
    if (commitSHA == null) {
      return NextResponse.json({ files: [] }, { status: 200 });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });

    if (!token || !token.accessToken) {
      console.error('Unauthorized: Missing or invalid access token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const githubToken = token.accessToken as string;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    // Fetch GitHub username and email
    const { githubUsername } = await getGitHubUsernameAndEmail(headers);

    // Split the TAXONOMY_DOCUMENTS_REPO into owner and repo name
    const repoPath = TAXONOMY_DOCUMENTS_REPO.replace('github.com/', '');
    const [_, repoName] = repoPath.split('/');

    // Read the preview commit sha
    let contributionName = '';
    let existingSubDirectory = '';
    const finalFiles: KnowledgeFile[] = [];

    const commitMsg = await readCommit(headers, githubUsername, repoName, commitSHA);
    if (commitMsg.length != 0) {
      const name = extractContributionName(commitMsg);
      if (name.length === 0) {
        console.warn('Contribution name not found. Looks like the SHA is not correct.');
        console.log('Continue uploading the newly provided document.');
      } else {
        console.log(`Contribution name found for the sha ${commitSHA}:`, contributionName);
        contributionName = name;
      }

      const directory = extractSubDirectoryName(commitMsg);
      if (directory.length === 0) {
        console.warn('No subdirectory exist. Either the commit sha is invalid, or the docs are manually deleted.');
        console.log('Continue uploading the newly provided document.');
      } else {
        console.log(`Document sub directory exist for the sha ${commitSHA}:`, directory);
        existingSubDirectory = directory;
      }
    } else {
      console.log('Uploading the documents for the first time for the contribution');
    }

    if (existingSubDirectory.length != 0) {
      // Read all the files from the existing directory.
      const existingFiles = await fetchAllFilesFromDir(headers, githubUsername, repoName, path.join(contributionName, existingSubDirectory));
      existingFiles.map((file: { fileName: string; filePath: string; fileSha: string; fileContent: string }) => {
        console.log('Existing file found : ', file.filePath);
        finalFiles.push({
          filename: file.fileName,
          content: file.fileContent,
          commitSha: file.fileSha,
          commitDate: ''
        });
      });
    }
    return NextResponse.json({ files: finalFiles }, { status: 200 });
  } catch (error) {
    console.error('Failed to process GET request:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Fetch the content of a file from the repository
async function fetchFileContent(headers: HeadersInit, owner: string, repo: string, filePath: string): Promise<string> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${filePath}`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch content of file ${filePath} :`, response.status, errorText);
      throw new Error(`Failed to fetch content of file ${filePath}.`);
    }

    const data = await response.json();
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch (error) {
    console.error(`Error fetching content for ${filePath}:`, error);
    return '';
  }
}

async function fetchAllFilesFromDir(
  headers: HeadersInit,
  owner: string,
  repo: string,
  filePath: string
): Promise<{ fileName: string; filePath: string; fileSha: string; fileContent: string }[]> {
  try {
    const contentsResponse = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'GET',
      headers
    });

    const contentsData = await contentsResponse.json();
    if (!Array.isArray(contentsData)) {
      throw new Error(`${filePath} is not a directory`);
    }
    const results = Promise.all(
      contentsData.map(async (file) => {
        const content = await fetchFileContent(headers, owner, repo, file.path);
        return {
          fileName: file.name,
          filePath: file.path,
          fileSha: file.sha,
          fileContent: content
        };
      })
    );
    return results;
  } catch (error) {
    console.error(`Failed to read content from :${filePath}`, error);
  }
  return [];
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

/**
 *  Extract the contribution name where documents are stored.
 * @param commitMessage Commit message from the provided SHA
 * @returns
 */
function extractContributionName(commitMessage: string): string {
  const match = commitMessage.match(/Contribution Name:(.+)/);
  if (!match) return '';
  return match[1].trim();
}
