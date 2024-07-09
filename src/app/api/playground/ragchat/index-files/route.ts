// src/app/api/playground/ragchat/index-files/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

async function authenticate(USERNAME: string, API_KEY: string, DS_HOST: string, retries: number = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log('Starting authentication...');
      const authResponse = await fetch(`${DS_HOST}/api/cps/user/v1/user/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${USERNAME}:${API_KEY}`).toString('base64')}`
        },
        body: JSON.stringify({})
      });

      const authText = await authResponse.text();
      console.log('Auth response text:', authText);

      if (!authResponse.ok) {
        throw new Error(authText);
      }

      const authData = JSON.parse(authText);
      console.log('Authentication successful. Token obtained.');
      return authData.access_token;
    } catch (error) {
      console.error(`Authentication attempt ${attempt + 1} failed:`, error.message);
      if (attempt < retries - 1) {
        console.log('Retrying in 3 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        throw new Error('Failed to authenticate after multiple attempts');
      }
    }
  }
}

async function fetchDocuments(DS_HOST: string, PROJ_KEY: string, dsIndexKey: string, token: string, retries: number = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log('Fetching documents...');
      const response = await fetch(`${DS_HOST}/api/cps/public/v2/project/${PROJ_KEY}/data_indices/${dsIndexKey}/documents/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      console.log('Fetched documents:', data.documents);
      return data.documents.filter((doc: any) => doc.status === 'SUCCESS');
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error.message);
      if (attempt < retries - 1) {
        console.log('Retrying in 3 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        throw new Error('Failed to fetch documents after multiple attempts');
      }
    }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dsIndexKey = searchParams.get('indexKey');
  const USERNAME = process.env.DS_USERNAME;
  const API_KEY = process.env.DS_API_KEY;
  const DS_HOST = process.env.DS_HOST;
  const PROJ_KEY = process.env.DS_PROJ_KEY;

  console.log('Received request for data index:', dsIndexKey);

  if (!dsIndexKey || !USERNAME || !API_KEY || !DS_HOST || !PROJ_KEY) {
    console.error('Missing required parameters or environment variables', { dsIndexKey, USERNAME, API_KEY, DS_HOST, PROJ_KEY });
    return NextResponse.json({ error: 'Missing required parameters or environment variables' }, { status: 400 });
  }

  try {
    const token = await authenticate(USERNAME, API_KEY, DS_HOST);
    const documents = await fetchDocuments(DS_HOST, PROJ_KEY, dsIndexKey, token);
    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
