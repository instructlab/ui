// src/app/api/native/upload/route.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import path from 'path';
import fs from 'fs';

const TAXONOMY_DOCS_ROOT_DIR = process.env.NEXT_PUBLIC_TAXONOMY_ROOT_DIR || '';
const TAXONOMY_DOCS_CONTAINER_MOUNT_DIR = '/tmp/.instructlab-ui';
const TAXONOMY_KNOWLEDGE_DOCS_REPO_URL = 'https://github.com/instructlab-public/taxonomy-knowledge-docs.git';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files } = body;
    const docsRepoUrl = await cloneTaxonomyDocsRepo();

    // If the repository was not cloned, return an error
    if (!docsRepoUrl) {
      return NextResponse.json({ error: 'Failed to clone taxonomy knowledge docs repository' }, { status: 500 });
    }

    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', 'T').slice(0, -1);
    const filesWithTimestamp = files.map((file: { fileName: string; fileContent: string }) => {
      const [name, extension] = file.fileName.split(/\.(?=[^.]+$)/);
      return {
        fileName: `${name}-${timestamp}.${extension}`,
        fileContent: file.fileContent
      };
    });

    // Write the files to the repository
    const docsRepoUrlTmp = path.join(docsRepoUrl, '/');
    for (const file of filesWithTimestamp) {
      const filePath = path.join(docsRepoUrlTmp, file.fileName);
      console.log(`Writing file to ${filePath} in taxonomy knowledge docs repository.`);
      fs.writeFileSync(filePath, file.fileContent);
    }

    // Checkout the main branch
    await git.checkout({ fs, dir: docsRepoUrl, ref: 'main' });

    // Stage the files
    await git.add({ fs, dir: docsRepoUrl, filepath: '.' });

    // Commit the files
    const commitSha = await git.commit({
      fs,
      dir: docsRepoUrl,
      author: { name: 'instructlab-ui', email: 'ui@instructlab.ai' },
      message: `Add files: ${files
        .map((file: { fileName: string; fileContent: string }) => file.fileName)
        .join(', ')}\n\nSigned-off-by: ui@instructlab.ai`
    });

    console.log(`Successfully committed files to taxonomy knowledge docs repository with commit SHA: ${commitSha}`);

    const origTaxonomyDocsRepoDir = path.join(TAXONOMY_DOCS_ROOT_DIR, '/taxonomy-knowledge-docs');
    return NextResponse.json(
      {
        repoUrl: origTaxonomyDocsRepoDir,
        commitSha,
        documentNames: filesWithTimestamp.map((file: { fileName: string }) => file.fileName),
        prUrl: ''
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to upload knowledge documents:', error);
    return NextResponse.json({ error: 'Failed to upload knowledge documents' }, { status: 500 });
  }
}

async function cloneTaxonomyDocsRepo() {
  // Check the location of the taxonomy repository and create the taxonomy-docs-repository parallel to that.
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
    console.log(`Using existing taxonomy knowledge docs repository at ${remoteTaxonomyRepoDir}/taxonomy-knowledge-docs.`);
    return taxonomyDocsDirectoryPath;
  } else {
    console.log(`Taxonomy knowledge docs repository not found at ${taxonomyDocsDirectoryPath}. Cloning...`);
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
}
