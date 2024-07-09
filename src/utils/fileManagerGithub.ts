// src/utils/fileManagerGithub.ts
import axios from 'axios';
import { getGitHubUsername } from '@/utils/github';

const GITHUB_API_URL = 'https://api.github.com';
const TAXONOMY_DOCUMENTS_REPO = process.env.NEXT_PUBLIC_TAXONOMY_DOCUMENTS_REPO!;
const BASE_BRANCH = 'main';

export const fetchGitHubRepoFiles = async (token: string) => {
  try {
    const githubUsername = await getGitHubUsername(token);
    console.log('Fetching repository files for user:', githubUsername);

    const repoPath = TAXONOMY_DOCUMENTS_REPO.replace('github.com/', '');
    const [repoOwner, repoName] = repoPath.split('/');

    const response = await axios.get(`${GITHUB_API_URL}/repos/${githubUsername}/${repoName}/git/trees/${BASE_BRANCH}?recursive=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json'
      }
    });

    console.log('Fetched files:', response.data);
    return response.data.tree.filter((item: any) => item.type === 'blob'); // Only return files (blobs)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching repository files:', error.response ? error.response.data : error.message);
    } else {
      console.error('Error fetching repository files:', error);
    }
    throw error;
  }
};
