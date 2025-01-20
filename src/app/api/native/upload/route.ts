// src/app/api/native/upload/route.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import path from 'path';
import fs from 'fs';

const LOCAL_TAXONOMY_DOCS_ROOT_DIR = process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR || `${process.env.HOME}/.instructlab-ui`;
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
    for (const file of filesWithTimestamp) {
      const filePath = path.join(docsRepoUrl, file.fileName);
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

    return NextResponse.json(
      {
        repoUrl: docsRepoUrl,
        commitSha,
        documentNames: filesWithTimestamp.map((file: { fileName: string }) => file.fileName),
        prUrl: ''
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to upload documents:', error);
    return NextResponse.json({ error: 'Failed to upload documents' }, { status: 500 });
  }
}

async function cloneTaxonomyDocsRepo() {
  const taxonomyDocsDirectoryPath = path.join(LOCAL_TAXONOMY_DOCS_ROOT_DIR, '/taxonomy-knowledge-docs');
  console.log(`Cloning taxonomy docs repository to ${taxonomyDocsDirectoryPath}...`);

  if (fs.existsSync(taxonomyDocsDirectoryPath)) {
    console.log(`Using existing taxonomy knowledge docs repository at ${taxonomyDocsDirectoryPath}.`);
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
      singleBranch: true,
      depth: 1
    });

    // Include the full path in the response for client display
    console.log(`Repository cloned successfully to ${taxonomyDocsDirectoryPath}.`);
    return taxonomyDocsDirectoryPath;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Failed to clone taxonomy docs repository: ${errorMessage}`);
    return null;
  }
}
