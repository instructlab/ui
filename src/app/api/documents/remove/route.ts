// src/app/api/documents/remove/route.ts

'use server';
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { DOC_POOL_DIR, findTaxonomyDocRepoPath } from '@/app/api/utils';
import { devLog } from '@/utils/devlog';

/**
 * Handler to delete knowledge file from taxonomy knowledge doc repo's document pool
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName } = body;
    const docsRepoPath = findTaxonomyDocRepoPath();

    // If the repository was not cloned, return an error
    if (!docsRepoPath && docsRepoPath == '') {
      console.error('Taxonomy knowledge docs repository is not present on the host');
      return NextResponse.json(
        { error: 'Failed to delete the document from document pool. Taxonomy knowledge docs repository is not present.' },
        { status: 500 }
      );
    }

    // Checkout the main branch
    await git.checkout({ fs, dir: docsRepoPath, ref: 'main' });

    const newDocsDirPath = path.join(docsRepoPath, DOC_POOL_DIR);

    if (!fs.existsSync(newDocsDirPath)) {
      console.error(`Document pool directory doesn't exist: ${docsRepoPath}`);
      return NextResponse.json({ error: 'Failed to delete the file from document pool. File does not exists.' }, { status: 500 });
    }

    const filePath = path.join(newDocsDirPath, fileName);
    devLog(`Deleting file ${filePath} from document pool.`);
    fs.rmSync(filePath);

    // Stage the files
    await git.add({ fs, dir: docsRepoPath, filepath: '.' });
    await git.remove({ fs, dir: docsRepoPath, filepath: '.' });

    // Commit the files
    await git.commit({
      fs,
      dir: docsRepoPath,
      author: { name: 'instructlab-ui', email: 'ui@instructlab.ai' },
      message: `File deleted from document pool: ${fileName}\n\nSigned-off-by: ui@instructlab.ai`
    });

    devLog(`Successfully deleted file ${fileName} from document pool.`);

    return NextResponse.json({ message: `Successfully deleted file ${fileName} from document pool.` }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload knowledge files:', error);
    return NextResponse.json({ error: 'Failed to upload knowledge files' }, { status: 500 });
  }
}
