// src/app/api/download/route.ts
'use server';
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as git from 'isomorphic-git';

const LOCAL_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR || `${process.env.HOME}/.instructlab-ui`;

export async function POST(req: NextRequest) {
  const rootDir = LOCAL_TAXONOMY_ROOT_DIR;
  if (!rootDir) {
    return NextResponse.json({ error: 'Failed to find the local taxonomy that contains the contribution.' }, { status: 500 });
  }
  const { branchName } = await req.json();

  const taxonomyDir = path.join(rootDir, 'taxonomy');
  try {
    await fs.promises.access(taxonomyDir, fs.constants.R_OK);
  } catch {
    return NextResponse.json({ error: 'Taxonomy directory not found or not readable' }, { status: 500 });
  }

  // Checkout the new branch
  await git.checkout({ fs, dir: taxonomyDir, ref: branchName });

  // Spawn tar to write gzipped archive to stdout
  const tar = spawn('tar', ['-czf', '-', '-C', rootDir, 'taxonomy'], {
    stdio: ['ignore', 'pipe', 'inherit']
  });

  // If the client aborts, make sure to kill the tar process
  req.signal.addEventListener('abort', () => {
    tar.kill('SIGTERM');
  });

  // Helper: convert Node.js Readable into a Web ReadableStream<Uint8Array>
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      tar.stdout.on('data', (chunk: Buffer) => {
        controller.enqueue(chunk);
      });
      tar.stdout.on('end', () => {
        controller.close();
      });
      tar.stdout.on('error', (err) => {
        controller.error(err);
      });
    },
    cancel() {
      tar.kill('SIGTERM');
    }
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment`,
      'Cache-Control': 'no-store'
    }
  });
}
