// src/app/api/github/download/route.ts
'use server';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { GITHUB_API_URL } from '@/types/const';
import { getGitHubUsername } from '@/utils/github';

const UPSTREAM_REPO_NAME = process.env.NEXT_PUBLIC_TAXONOMY_REPO!;

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });

  if (!token || !token.accessToken) {
    console.error('Unauthorized: Missing or invalid access token');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const githubToken = token.accessToken as string;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  const githubUsername = await getGitHubUsername(headers);
  try {
    const { branchName } = await req.json();

    if (!branchName || typeof branchName !== 'string') {
      return NextResponse.json({ error: 'contribution branch does not exist on remote taxonomy.' }, { status: 400 });
    }

    const tarballUrl = `${GITHUB_API_URL}/repos/${githubUsername}/${UPSTREAM_REPO_NAME}/tarball/${branchName}`;
    const tarballRes = await fetch(tarballUrl, {
      headers: headers
    });

    if (!tarballRes.ok) {
      return NextResponse.json({ error: 'Failed to download taxonomy for the contribution.' }, { status: 500 });
    }

    return new NextResponse(tarballRes.body, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('failed to download taxonomy for the contribution:', error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
