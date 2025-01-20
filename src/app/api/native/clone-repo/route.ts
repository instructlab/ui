// src/pages/api/clone-repo.ts
import { NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

// Retrieve the base directory from the environment variable
const LOCAL_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR || `${process.env.HOME}/.instructlab-ui`;
const TAXONOMY_REPO_URL = process.env.NEXT_PUBLIC_TAXONOMY_REPO_URL || 'https://github.com/instructlab/taxonomy.git';

export async function POST() {
  const taxonomyDirectoryPath = path.join(LOCAL_TAXONOMY_ROOT_DIR, '/taxonomy');

  if (fs.existsSync(taxonomyDirectoryPath)) {
    const files = fs.readdirSync(taxonomyDirectoryPath);
    if (files.length > 0) {
      console.log(`Using existing native Taxonomy repository at ${taxonomyDirectoryPath}.`);
      return NextResponse.json({ message: `Using existing native Taxonomy repository at ${taxonomyDirectoryPath}.` }, { status: 200 });
    }
    fs.rmdirSync(taxonomyDirectoryPath, { recursive: true });
  }

  try {
    await git.clone({
      fs,
      http,
      dir: taxonomyDirectoryPath,
      url: TAXONOMY_REPO_URL,
      singleBranch: true
    });

    // Include the full path in the response for client display
    console.log(`Local Taxonomy repository cloned successfully to ${taxonomyDirectoryPath}.`);
    return NextResponse.json({ message: `Local Taxonomy repository cloned successfully to ${taxonomyDirectoryPath}.` }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Failed to clone local taxonomy repository: ${errorMessage}`);
    return NextResponse.json({ message: `Failed to clone local taxonomy repository: ${errorMessage}` }, { status: 500 });
  }
}
