import axios from 'axios';
import { PullRequestUpdateData } from '@/types';

const UPSTREAM_REPO_OWNER = process.env.NEXT_PUBLIC_TAXONOMY_REPO_OWNER!;
const UPSTREAM_REPO_NAME = process.env.NEXT_PUBLIC_TAXONOMY_REPO!;

export const fetchPullRequests = async (token: string) => {
  try {
    console.log('Refreshing PR Listing');
    const response = await axios.get(`https://api.github.com/repos/${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}/pulls?state=all`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });
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
};

export const fetchPullRequest = async (token: string, prNumber: number) => {
  try {
    console.log(`Fetching PR Number: ${prNumber}`);
    const response = await axios.get(`https://api.github.com/repos/${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}/pulls/${prNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });
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
    console.log(`Fetching files for PR Number: ${prNumber}`);
    const response = await axios.get(`https://api.github.com/repos/${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}/pulls/${prNumber}/files`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });
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
    console.log(`Fetching file content for path: ${filePath} with ref: ${ref}`);
    const response = await axios.get(`https://api.github.com/repos/${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}/contents/${filePath}?ref=${ref}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3.raw'
      }
    });
    console.log('Fetched file content:', response.data);
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
    const response = await axios.patch(`https://api.github.com/repos/${UPSTREAM_REPO_OWNER}/${UPSTREAM_REPO_NAME}/pulls/${prNumber}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });
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
  filePath: { yaml: string; attribution: string },
  updatedYamlContent: string,
  updatedAttributionContent: string,
  branch: string
) => {
  try {
    console.log(`Amending commit for path: ${filePath} in repo: ${repoName}`);

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

    // Step 4: Create a new tree with the updated blobs
    const newTreeResponse = await axios.post(
      `https://api.github.com/repos/${username}/${repoName}/git/trees`,
      {
        base_tree: treeSha,
        tree: [
          {
            path: filePath.yaml,
            mode: '100644',
            type: 'blob',
            sha: yamlBlobSha
          },
          {
            path: filePath.attribution,
            mode: '100644',
            type: 'blob',
            sha: attributionBlobSha
          }
        ]
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
        message: `Amend commit with updated content`,
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

export const getGitHubUsername = async (token: string) => {
  try {
    console.log('Fetching GitHub username');
    const response = await axios.get(`https://api.github.com/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });
    console.log('Fetched GitHub username:', response.data.login);
    return response.data.login;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching GitHub username:', error.response ? error.response.data : error.message);
    } else {
      console.error('Error fetching GitHub username:', error);
    }
    throw error;
  }
};
