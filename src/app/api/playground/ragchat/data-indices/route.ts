// src/app/api/playground/ragchat/data-indices/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { dsauthenticate } from '../../../../../utils/dsauthenticate';

async function fetchDataIndices(DS_HOST: string, PROJ_KEY: string, token: string, retries: number = 3) {
  const fetchUrl = `${DS_HOST}/api/cps/public/v2/project/${PROJ_KEY}/data_indices`;
  console.log('Fetching data indices from:', fetchUrl);
  console.log('Using token:', token);

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(fetchUrl, {
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
      console.log('Fetched data indices:', data);
      return data;
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error.message);
      if (attempt < retries - 1) {
        console.log('Retrying in 3 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        throw new Error('Failed to fetch data indices after multiple attempts');
      }
    }
  }
}

export async function GET(req: NextRequest) {
  const USERNAME = process.env.DS_USERNAME;
  const API_KEY = process.env.DS_API_KEY;
  const DS_HOST = process.env.DS_HOST;
  const PROJ_KEY = process.env.DS_PROJ_KEY;

  if (!USERNAME || !API_KEY || !DS_HOST || !PROJ_KEY) {
    console.error('Missing required parameters or environment variables', { USERNAME, API_KEY, DS_HOST, PROJ_KEY });
    return NextResponse.json({ error: 'Missing required parameters or environment variables' }, { status: 400 });
  }

  try {
    const token = await dsauthenticate(USERNAME, API_KEY, DS_HOST);
    const dataIndices = await fetchDataIndices(DS_HOST, PROJ_KEY, token);
    return NextResponse.json({ dataIndices }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
