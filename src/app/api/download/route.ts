// src/app/api/download/route.ts
'use server';
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// GET handler now takes the Request so we can watch for aborts
export async function GET(request: Request) {
  const rootDir = process.env.NEXT_PUBLIC_TAXONOMY_ROOT_DIR;
  if (!rootDir) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_TAXONOMY_ROOT_DIR is not configured' }, { status: 500 });
  }

  const taxonomyDir = path.join(rootDir, 'taxonomy');
  try {
    await fs.promises.access(taxonomyDir, fs.constants.R_OK);
  } catch {
    return NextResponse.json({ error: 'Taxonomy directory not found or not readable' }, { status: 404 });
  }

  // Spawn tar to write gzipped archive to stdout
  const tar = spawn('tar', ['-czf', '-', '-C', rootDir, 'taxonomy'], {
    stdio: ['ignore', 'pipe', 'inherit']
  });

  // If the client aborts, make sure to kill the tar process
  request.signal.addEventListener('abort', () => {
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
      'Content-Disposition': 'attachment; filename="taxonomy.tar.gz"',
      'Cache-Control': 'no-store'
    }
  });
}
