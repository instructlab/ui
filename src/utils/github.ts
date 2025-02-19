// src/utils/github.ts
import axios from 'axios';
import { PullRequestUpdateData } from '@/types';
import { BASE_BRANCH, FORK_CLONE_CHECK_RETRY_COUNT, FORK_CLONE_CHECK_RETRY_TIMEOUT, GITHUB_API_URL } from '@/types/const';

type GithubUserInfo = {
  login: string;
  name: string;
  email: string;
};

export async function fetchPullRequests(token: string) {
  try {
    console.log('Refreshing PR Listing');
    const res = await fetch('/api/envConfig');
    const envConfig = await res.json();

    const response = await axios.get(
      `https://api.github.com/repos/${envConfig.UPSTREAM_REPO_OWNER}/${envConfig.UPSTREAM_REPO_NAME}/pulls?state=all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );
    console.log('Fetched PRs:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching pull requests:', error.response ? error.response.data : error.message);
    } else {
      console.error('Error fetching pull requests:', error);
    }
    throw error;
  }
}

export const fetchPullRequest = async (token: string, prNumber: number) => {
  try {
    const res = await fetch('/api/envConfig');
    const envConfig = await res.json();
    const response = await axios.get(
      `https://api.github.com/repos/${envConfig.UPSTREAM_REPO_OWNER}/${envConfig.UPSTREAM_REPO_NAME}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );
    if (response.status === 404) {
      throw new Error(`Pull request with number ${prNumber} not found.`);
    }
    console.log(`Fetched PR ${prNumber}:`, response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching pull request ${prNumber}:`, error.response ? error.response.data : error.message);
    } else {
      console.error(`Error fetching pull request ${prNumber}:`, error);
    }
    throw error;
  }
};

export const fetchPullRequestFiles = async (token: string, prNumber: number) => {
  try {
    const res = await fetch('/api/envConfig');
    const envConfig = await res.json();
    const response = await axios.get(
      `https://api.github.com/repos/${envConfig.UPSTREAM_REPO_OWNER}/${envConfig.UPSTREAM_REPO_NAME}/pulls/${prNumber}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );
    console.log(`Fetched files for PR ${prNumber}:`, response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching files for pull request ${prNumber}:`, error.response ? error.response.data : error.message);
    } else {
      console.error(`Error fetching files for pull request ${prNumber}:`, error);
    }
    throw error;
  }
};

export const fetchFileContent = async (token: string, filePath: string, ref: string) => {
  try {
    const res = await fetch('/api/envConfig');
    const envConfig = await res.json();
    const response = await axios.get(
      `https://api.github.com/repos/${envConfig.UPSTREAM_REPO_OWNER}/${envConfig.UPSTREAM_REPO_NAME}/contents/${filePath}?ref=${ref}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3.raw'
        }
      }
    );
    console.log(`Fetched file content for path: ${filePath} with ref: ${ref}:`, response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching file content:', error.response ? error.response.data : error.message);
    } else {
      console.error('Error fetching file content:', error);
    }
    throw error;
  }
};

export const updatePullRequest = async (token: string, prNumber: number, data: PullRequestUpdateData) => {
  try {
    console.log(`Updating PR Number: ${prNumber} with data:`, data);
    const res = await fetch('/api/envConfig');
    const envConfig = await res.json();
    const response = await axios.patch(
      `https://api.github.com/repos/${envConfig.UPSTREAM_REPO_OWNER}/${envConfig.UPSTREAM_REPO_NAME}/pulls/${prNumber}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );
    console.log(`Updated PR ${prNumber}:`, response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error updating pull request ${prNumber}:`, error.response ? error.response.data : error.message);
    } else {
      console.error(`Error updating pull request ${prNumber}:`, error);
    }
    throw error;
  }
};

export const amendCommit = async (
  token: string,
  username: string,
  repoName: string,
  oldFilePath: { yaml: string; attribution: string }, // If the user changed the taxonomy file path on edit, adjust the amendment
  newFilePath: { yaml: string; attribution: string },
  updatedYamlContent: string,
  updatedAttributionContent: string,
  branch: string,
  commitMessage: string
) => {
  try {
    console.log(`Amending commit for path: ${oldFilePath} in repo: ${repoName}`);

    // Step 1: Get the latest commit SHA for the branch
    const branchResponse = await axios.get(`https://api.github.com/repos/${username}/${repoName}/git/refs/heads/${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });
    const latestCommitSha = branchResponse.data.object.sha;
    console.log(`Latest commit SHA for branch ${branch}: ${latestCommitSha}`);

    // Step 2: Get the tree SHA and parent SHA from the latest commit
    const commitResponse = await axios.get(`https://api.github.com/repos/${username}/${repoName}/git/commits/${latestCommitSha}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });
    const commitDetails = commitResponse.data;
    const treeSha = commitDetails.tree.sha;
    const parentSha = commitDetails.parents[0].sha;
    console.log(`Commit details: treeSha=${treeSha}, parentSha=${parentSha}`);

    // Step 3: Create new blobs for the updated contents
    const yamlBlobResponse = await axios.post(
      `https://api.github.com/repos/${username}/${repoName}/git/blobs`,
      {
        content: Buffer.from(updatedYamlContent).toString('base64'),
        encoding: 'base64'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );
    const yamlBlobSha = yamlBlobResponse.data.sha;
    console.log(`New YAML blob SHA: ${yamlBlobSha}`);

    const attributionBlobResponse = await axios.post(
      `https://api.github.com/repos/${username}/${repoName}/git/blobs`,
      {
        content: Buffer.from(updatedAttributionContent).toString('base64'),
        encoding: 'base64'
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );
    const attributionBlobSha = attributionBlobResponse.data.sha;
    console.log(`New Attribution blob SHA: ${attributionBlobSha}`);

    // Step 4: Create a new tree with the updated blobs and remove old files if path changed
    const tree = [
      {
        path: newFilePath.yaml,
        mode: '100644',
        type: 'blob',
        sha: yamlBlobSha
      },
      {
        path: newFilePath.attribution,
        mode: '100644',
        type: 'blob',
        sha: attributionBlobSha
      }
    ];

    if (oldFilePath.yaml !== newFilePath.yaml) {
      tree.push({
        path: oldFilePath.yaml,
        mode: '100644',
        type: 'blob',
        sha: null
      });
    }

    if (oldFilePath.attribution !== newFilePath.attribution) {
      tree.push({
        path: oldFilePath.attribution,
        mode: '100644',
        type: 'blob',
        sha: null
      });
    }

    const newTreeResponse = await axios.post(
      `https://api.github.com/repos/${username}/${repoName}/git/trees`,
      {
        base_tree: treeSha,
        tree
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );
    const newTreeSha = newTreeResponse.data.sha;
    console.log(`New tree SHA: ${newTreeSha}`);

    // Step 5: Create a new commit with the updated tree but same parent
    const newCommitResponse = await axios.post(
      `https://api.github.com/repos/${username}/${repoName}/git/commits`,
      {
        message: commitMessage,
        tree: newTreeSha,
        parents: [parentSha]
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );
    const newCommitSha = newCommitResponse.data.sha;
    console.log(`New commit SHA: ${newCommitSha}`);

    // Step 6: Update the reference to point to the new commit
    await axios.patch(
      `https://api.github.com/repos/${username}/${repoName}/git/refs/heads/${branch}`,
      {
        sha: newCommitSha,
        force: true
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    );

    return newCommitResponse.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error amending commit:`, error.response ? error.response.data : error.message);
    } else {
      console.error(`Error amending commit:`, error);
    }
    throw error;
  }
};

export async function getGitHubUserInfo(headers: HeadersInit): Promise<GithubUserInfo> {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch GitHub user info:', response.status, errorText);
    throw new Error('Failed to fetch GitHub user info');
  }

  const data = await response.json();

  const userInfo: GithubUserInfo = {
    name: data.name || '',
    login: data.login || '',
    email: ''
  };

  userInfo.email = await getGitHubUserPrimaryEmail(headers);
  return userInfo;
}

export async function getGitHubUserPrimaryEmail(headers: HeadersInit): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/user/public_emails`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch GitHub email address:', response.status, errorText);
    return '';
  }

  const data = await response.json();

  // Look for the primary email in the returned list
  const emailInfo = data.find((emailObj: { primary: boolean; email?: string }) => emailObj.primary === true);
  return emailInfo && emailInfo.email ? emailInfo.email : '';
}

export async function getGitHubUsername(headers: HeadersInit): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch GitHub username:', response.status, errorText);
    throw new Error('Failed to fetch GitHub username');
  }

  const data = await response.json();
  return data.login;
}

export async function createFork(headers: HeadersInit, upstreamRepoOwner: string, upstreamRepoName: string, username: string) {
  const response = await fetch(`${GITHUB_API_URL}/repos/${upstreamRepoOwner}/${upstreamRepoName}/forks`, {
    method: 'POST',
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create fork:', response.status, errorText);
    throw new Error('Failed to create fork');
  }

  const responseData = await response.json();

  //Ensure the fork is not empty by calling getBaseBranchSha in loop for 5 times with 2 seconds delay
  for (let i = 0; i < FORK_CLONE_CHECK_RETRY_COUNT; i++) {
    await new Promise((resolve) => setTimeout(resolve, FORK_CLONE_CHECK_RETRY_TIMEOUT));
    try {
      const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${upstreamRepoName}/git/refs/heads/${BASE_BRANCH}`, {
        headers
      });

      if (response.ok) {
        break;
      } else {
        console.log('Fork is not fully cloned yet, retrying...');
      }
    } catch (error) {
      console.warn('Failed to check if the fork is fully cloned:', error);
    }
  }
  console.log('Fork created successfully:', responseData);
}

export async function checkUserForkExists(headers: HeadersInit, username: string, upstreamRepoName: string): Promise<boolean> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${upstreamRepoName}`, {
    headers
  });

  return response.ok;
}

export async function getBaseBranchSha(headers: HeadersInit, username: string, upstreamRepoName: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${upstreamRepoName}/git/refs/heads/${BASE_BRANCH}`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get base branch SHA:', response.status, errorText);
    throw new Error('Failed to get base branch SHA');
  }

  const data = await response.json();
  return data.object.sha;
}

export async function createBranch(headers: HeadersInit, username: string, upstreamRepoName: string, branchName: string, baseSha: string) {
  const body = JSON.stringify({
    ref: `refs/heads/${branchName}`,
    sha: baseSha
  });

  console.log(`Creating branch with body: ${body}`);

  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${upstreamRepoName}/git/refs`, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create branch:', response.status, errorText);
    throw new Error('Failed to create branch');
  }

  const responseData = await response.json();
  console.log('Branch created successfully:', responseData);
}

export async function createFilesInSingleCommit(
  headers: HeadersInit,
  username: string,
  upstreamRepoName: string,
  files: { path: string; content: string }[],
  branchName: string,
  commitMessage: string
) {
  const fileData = files.map((file) => ({
    path: file.path,
    mode: '100644',
    type: 'blob',
    content: file.content
  }));

  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${upstreamRepoName}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: await getBaseTreeSha(headers, username, upstreamRepoName, branchName),
      tree: fileData
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create files:', response.status, errorText);
    throw new Error('Failed to create files');
  }

  const treeData = await response.json();

  const commitResponse = await fetch(`${GITHUB_API_URL}/repos/${username}/${upstreamRepoName}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: treeData.sha,
      parents: [await getCommitSha(headers, username, upstreamRepoName, branchName)]
    })
  });

  if (!commitResponse.ok) {
    const errorText = await commitResponse.text();
    console.error('Failed to create commit:', commitResponse.status, errorText);
    throw new Error('Failed to create commit');
  }

  const commitData = await commitResponse.json();

  await fetch(`${GITHUB_API_URL}/repos/${username}/${upstreamRepoName}/git/refs/heads/${branchName}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: commitData.sha
    })
  });
}

async function getBaseTreeSha(headers: HeadersInit, username: string, upstreamRepoName: string, branchName: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${upstreamRepoName}/git/trees/${branchName}`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get base tree SHA:', response.status, errorText);
    throw new Error('Failed to get base tree SHA');
  }

  const data = await response.json();
  return data.sha;
}

async function getCommitSha(headers: HeadersInit, username: string, upstreamRepoName: string, branchName: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${username}/${upstreamRepoName}/git/refs/heads/${branchName}`, {
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get commit SHA:', response.status, errorText);
    throw new Error('Failed to get commit SHA');
  }

  const data = await response.json();
  return data.object.sha;
}
