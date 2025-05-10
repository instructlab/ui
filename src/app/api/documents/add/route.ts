// src/app/api/documents/add/route.ts

'use server';
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { cloneTaxonomyDocsRepo, DOC_POOL_DIR, TAXONOMY_DOCS_ROOT_DIR } from '@/app/api/utils';
import { devLog } from '@/utils/devlog';

/**
 * Handler to upload new files and replace existing files to the document pool of taxonomy knowledge doc repo.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { newFiles } = body;
    const docsRepoPath = await cloneTaxonomyDocsRepo();

    // If the repository was not cloned, return an error
    if (!docsRepoPath) {
      return NextResponse.json({ error: 'Failed to clone taxonomy knowledge docs repository' }, { status: 500 });
    }

    // Checkout the main branch
    await git.checkout({ fs, dir: docsRepoPath, ref: 'main' });

    const subDirectory = DOC_POOL_DIR;

    const newDocsDirPath = path.join(docsRepoPath, subDirectory);

    if (!fs.existsSync(newDocsDirPath)) {
      fs.mkdirSync(newDocsDirPath, { recursive: true });
      devLog(`New sub directory ${newDocsDirPath} created successfully.`);
    }

    // Write the files to the repository
    for (const file of newFiles) {
      const filePath = path.join(newDocsDirPath, file.fileName);
      devLog(`Writing file to ${filePath} in taxonomy knowledge docs repository.`);
      fs.writeFileSync(filePath, file.fileContent);
    }

    const filenames = newFiles.map((file: { fileName: string; fileContent: string }) => path.join(subDirectory, file.fileName));

    // Stage the files
    await git.add({ fs, dir: docsRepoPath, filepath: '.' });
    await git.remove({ fs, dir: docsRepoPath, filepath: '.' });

    // Commit the files
    await git.commit({
      fs,
      dir: docsRepoPath,
      author: { name: 'instructlab-ui', email: 'ui@instructlab.ai' },
      message: `File uploaded: ${filenames}\n\nSigned-off-by: ui@instructlab.ai`
    });

    devLog(`Successfully uploaded following file to taxonomy knowledge docs repository: ${filenames}`);

    const origTaxonomyDocsRepoDir = path.join(TAXONOMY_DOCS_ROOT_DIR, '/taxonomy-knowledge-docs');
    return NextResponse.json(
      {
        repoUrl: origTaxonomyDocsRepoDir,
        documentNames: filenames
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to upload knowledge file:', error);
    return NextResponse.json({ error: 'Failed to upload knowledge file' }, { status: 500 });
  }
}
