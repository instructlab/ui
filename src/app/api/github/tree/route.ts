// src/app/api/github/tree/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import path from 'path';
import fs from 'fs';

const LOCAL_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR || `${process.env.HOME}/.instructlab-ui`;
const LOCAL_TAXONOMY_DIR = path.join(LOCAL_TAXONOMY_ROOT_DIR, '/taxonomy');
const TAXONOMY_REPO_URL = process.env.NEXT_PUBLIC_TAXONOMY_REPO_URL || 'https://github.com/instructlab/taxonomy.git';
const SKILLS = 'compositional_skills';
const KNOWLEDGE = 'knowledge';
const CHECK_INTERVAL = 300000; // 5 minute
let lastChecked = 0;

async function cloneTaxonomyRepo(): Promise<boolean> {
  try {
    await git.clone({
      fs,
      http,
      dir: LOCAL_TAXONOMY_DIR,
      url: TAXONOMY_REPO_URL,
      singleBranch: true
    });

    // Include the full path in the response for client display
    console.log(`Local Taxonomy repository cloned successfully to ${LOCAL_TAXONOMY_DIR}.`);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Failed to clone local taxonomy repository: ${errorMessage}`);
    return false;
  }
}

function deleteTaxonomyRepo() {
  if (fs.existsSync(LOCAL_TAXONOMY_DIR)) {
    fs.rmdirSync(LOCAL_TAXONOMY_DIR, { recursive: true });
  }
}

async function getRemoteHeadHash(): Promise<string | null> {
  try {
    const remoteRefs = await git.listServerRefs({ http, url: TAXONOMY_REPO_URL });
    const mainRef = remoteRefs.find((ref) => ref.ref.endsWith('refs/heads/main'));
    return mainRef?.oid || null;
  } catch (error) {
    console.error('Failed to get remote head hash:', error);
    return null;
  }
}

async function getLocalHeadHash(): Promise<string | null> {
  try {
    const head = await git.resolveRef({ fs, dir: LOCAL_TAXONOMY_DIR, ref: 'HEAD' });
    return head || null;
  } catch (error) {
    console.error('Failed to get local head hash:', error);
    return null;
  }
}

async function checkForUpdates(): Promise<void> {
  if (!fs.existsSync(LOCAL_TAXONOMY_DIR)) {
    await cloneTaxonomyRepo();
    return;
  }

  const currentTime = Date.now();
  if (currentTime - lastChecked < CHECK_INTERVAL) {
    return;
  }
  lastChecked = currentTime;
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: Checking for updates... `);
  const remoteHash = await getRemoteHeadHash();
  const localHash = await getLocalHeadHash();

  if (remoteHash && localHash && remoteHash !== localHash) {
    console.log(`${timestamp}: New changes detected, updating repository...`);
    deleteTaxonomyRepo();
    await cloneTaxonomyRepo();
  } else {
    console.log(`${timestamp}: No new changes detected in taxonomy repo.`);
  }
}

async function getFirstLevelDirectories(directoryPath: string): Promise<string[]> {
  try {
    await checkForUpdates();
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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { root_path, dir_name } = body;

  try {
    let dirPath = '';
    if (root_path === 'skills') {
      dirPath = path.join(LOCAL_TAXONOMY_DIR, SKILLS, dir_name);
    } else {
      dirPath = path.join(LOCAL_TAXONOMY_DIR, KNOWLEDGE, dir_name);
    }
    const dirs = await getFirstLevelDirectories(dirPath);
    return NextResponse.json({ data: dirs }, { status: 201 });
  } catch (error) {
    console.error('Failed to get the tree for path:', root_path, error);
    return NextResponse.json({ error: 'Failed to get the tree for path' }, { status: 500 });
  }
}
