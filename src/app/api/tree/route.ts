// src/app/api/tree/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import * as fs from 'fs';
import { findTaxonomyRepoPath } from '@/app/api/utils';

const SKILLS = 'compositional_skills';
const KNOWLEDGE = 'knowledge';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { root_path, dir_name } = body;

  try {
    const taxonomyRootPath = findTaxonomyRepoPath();
    let dirPath = '';
    if (root_path === 'skills') {
      dirPath = path.join(taxonomyRootPath, SKILLS, dir_name);
    } else {
      dirPath = path.join(taxonomyRootPath, KNOWLEDGE, dir_name);
    }
    const dirs = getFirstLevelDirectories(dirPath);
    return NextResponse.json({ data: dirs }, { status: 201 });
  } catch (error) {
    console.error('Failed to get the tree for path:', root_path, error);
    return NextResponse.json({ error: 'Failed to get the tree for path' }, { status: 500 });
  }
}

function getFirstLevelDirectories(directoryPath: string): string[] {
  try {
    return fs
      .readdirSync(directoryPath)
      .map((name) => path.join(directoryPath, name))
      .filter((source) => fs.statSync(source).isDirectory())
      .map((dir) => path.basename(dir));
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}
