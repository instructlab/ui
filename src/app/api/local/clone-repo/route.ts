// src/pages/api/clone-repo.ts
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

// Retrieve the base directory from the environment variable
const BASE_DIRECTORY = process.env.NEXT_PUBLIC_BASE_CLONE_DIRECTORY;

export async function POST(req: NextRequest) {
  const { repoUrl, directory } = await req.json();

  if (!repoUrl || !directory) {
    return NextResponse.json({ message: 'Repository URL and directory are required' }, { status: 400 });
  }

  if (!BASE_DIRECTORY) {
    return NextResponse.json({ message: 'Base directory is not configured on the server' }, { status: 500 });
  }

  try {
    const clonePath = path.resolve(BASE_DIRECTORY, directory);

    // Ensure clonePath is within BASE_DIRECTORY
    if (!clonePath.startsWith(BASE_DIRECTORY)) {
      return NextResponse.json({ message: 'Invalid directory path' }, { status: 403 });
    }

    await git.clone({
      fs,
      http,
      dir: clonePath,
      url: repoUrl,
      singleBranch: true,
      depth: 1
    });

    // Include the full path in the response for client display
    return NextResponse.json({ message: `Repository cloned successfully.`, fullPath: clonePath }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ message: `Failed to clone repository: ${errorMessage}` }, { status: 500 });
  }
}
