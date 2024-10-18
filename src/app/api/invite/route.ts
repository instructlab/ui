// src/api/invite/route.tsx
'use server';

import { NextRequest, NextResponse } from 'next/server';

const ORG_NAME = process.env.NEXT_PUBLIC_AUTHENTICATION_ORG;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { githubUsername } = body;

    console.log('Received GitHub username:', githubUsername);

    if (!githubUsername) {
      console.log('GitHub username is missing in the request');
      return NextResponse.json({ error: 'GitHub username is required' }, { status: 400 });
    }

    console.log('GITHUB_TOKEN is:', GITHUB_TOKEN ? 'Loaded' : 'Not loaded');
    console.log('github toke:', GITHUB_TOKEN);

    // Step 1: Fetch the GitHub user details by their username
    const userResponse = await fetch(`https://api.github.com/users/${githubUsername}`, {
      method: 'GET',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      const errorResponse = await userResponse.text();
      console.log('Failed to fetch GitHub user ID:', errorResponse);
      return NextResponse.json({ error: 'Failed to fetch GitHub user ID' }, { status: userResponse.status });
    }

    const userData = await userResponse.json();
    const inviteeId = userData.id;

    const inviteResponse = await fetch(`https://api.github.com/orgs/${ORG_NAME}/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invitee_id: inviteeId
      })
    });

    const inviteResponseBody = await inviteResponse.text();
    console.log('GitHub API response status:', inviteResponse.status);

    if (inviteResponse.ok) {
      return NextResponse.json({ message: `Invitation sent successfully to ${githubUsername}` }, { status: 200 });
    } else {
      return NextResponse.json({ error: inviteResponseBody }, { status: inviteResponse.status });
    }
  } catch (error) {
    console.error('Failed to send invitation:', error);
    return NextResponse.json({ error: 'Failed to send the invitation' }, { status: 500 });
  }
}
