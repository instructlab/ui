// src/app/api/playground/ragchat/collections/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function GET(req: NextRequest) {
  console.log('Received request to fetch collections');

  try {
    console.log('Making fetch call to backend service...');

    const response = await fetch('http://127.0.0.1:8000/collections', {
      method: 'GET',
      headers: {
        Accept: 'application/json' // Ensure Accept header is set properly
      }
    });

    const rawText = await response.text();
    console.log('Raw response text from backend:', rawText);

    const data = JSON.parse(rawText);
    console.log('Parsed collections data:', data);

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching collections:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
