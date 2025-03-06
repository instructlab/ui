// Constants for repository paths
import path from 'path';
import fs from 'fs';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

export const TAXONOMY_DOCS_ROOT_DIR = process.env.NEXT_PUBLIC_TAXONOMY_ROOT_DIR || '';
export const TAXONOMY_DOCS_CONTAINER_MOUNT_DIR = '/tmp/.instructlab-ui';
export const TAXONOMY_KNOWLEDGE_DOCS_REPO_URL =
  process.env.NEXT_PUBLIC_TAXONOMY_DOCUMENTS_REPO || 'https://github.com/instructlab-public/taxonomy-knowledge-docs';

export const cloneTaxonomyDocsRepo = async (): Promise<string | null> => {
  // Check the location of the taxonomy repository and create the taxonomy-knowledge-doc repository parallel to that.
  let remoteTaxonomyRepoDirFinal: string = '';
  // Check if directory pointed by remoteTaxonomyRepoDir exists and not empty
  const remoteTaxonomyRepoContainerMountDir = path.join(TAXONOMY_DOCS_CONTAINER_MOUNT_DIR, '/taxonomy');
  const remoteTaxonomyRepoDir = path.join(TAXONOMY_DOCS_ROOT_DIR, '/taxonomy');
  if (fs.existsSync(remoteTaxonomyRepoContainerMountDir) && fs.readdirSync(remoteTaxonomyRepoContainerMountDir).length !== 0) {
    remoteTaxonomyRepoDirFinal = TAXONOMY_DOCS_CONTAINER_MOUNT_DIR;
  } else {
    if (fs.existsSync(remoteTaxonomyRepoDir) && fs.readdirSync(remoteTaxonomyRepoDir).length !== 0) {
      remoteTaxonomyRepoDirFinal = TAXONOMY_DOCS_ROOT_DIR;
    }
  }
  if (remoteTaxonomyRepoDirFinal === '') {
    return null;
  }

  const taxonomyDocsDirectoryPath = path.join(remoteTaxonomyRepoDirFinal, '/taxonomy-knowledge-docs');

  if (fs.existsSync(taxonomyDocsDirectoryPath)) {
    console.log(`Using existing taxonomy knowledge docs repository at ${TAXONOMY_DOCS_ROOT_DIR}/taxonomy-knowledge-docs.`);
    return taxonomyDocsDirectoryPath;
  } else {
    console.log(`Taxonomy knowledge docs repository not found at ${TAXONOMY_DOCS_ROOT_DIR}/taxonomy-knowledge-docs. Cloning...`);
  }

  try {
    await git.clone({
      fs,
      http,
      dir: taxonomyDocsDirectoryPath,
      url: TAXONOMY_KNOWLEDGE_DOCS_REPO_URL,
      singleBranch: true
    });

    // Include the full path in the response for client display. Path displayed here is the one
    // that user set in the environment variable.
    console.log(`Taxonomy knowledge docs repository cloned successfully to ${remoteTaxonomyRepoDir}.`);
    // Return the path that the UI sees (direct or mounted)
    return taxonomyDocsDirectoryPath;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Failed to clone taxonomy docs repository: ${errorMessage}`);
    return null;
  }
};

export const findTaxonomyDocRepoPath = (): string => {
  // Check the location of the taxonomy docs repository .
  let remoteTaxonomyDocsRepoDirFinal: string = '';
  // Check if the taxonomy docs repo directory is mounted in the container (for container deployment) or present locally (for local deployment).
  const remoteTaxonomyDocsRepoContainerMountDir = path.join(TAXONOMY_DOCS_CONTAINER_MOUNT_DIR, '/taxonomy-knowledge-docs');
  const remoteTaxonomyDocsRepoDir = path.join(TAXONOMY_DOCS_ROOT_DIR, '/taxonomy-knowledge-docs');
  if (fs.existsSync(remoteTaxonomyDocsRepoContainerMountDir) && fs.readdirSync(remoteTaxonomyDocsRepoContainerMountDir).length !== 0) {
    remoteTaxonomyDocsRepoDirFinal = TAXONOMY_DOCS_CONTAINER_MOUNT_DIR;
  } else {
    if (fs.existsSync(remoteTaxonomyDocsRepoDir) && fs.readdirSync(remoteTaxonomyDocsRepoDir).length !== 0) {
      remoteTaxonomyDocsRepoDirFinal = TAXONOMY_DOCS_ROOT_DIR;
    }
  }
  if (remoteTaxonomyDocsRepoDirFinal === '') {
    return '';
  }

  const taxonomyDocsDirectoryPath = path.join(remoteTaxonomyDocsRepoDirFinal, '/taxonomy-knowledge-docs');
  return taxonomyDocsDirectoryPath;
};
