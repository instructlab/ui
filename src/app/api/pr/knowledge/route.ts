// src/app/api/pr/knowledge/route.ts

import { NextResponse } from 'next/server';

const API_SERVER_URL = process.env.IL_UI_API_SERVER_URL || 'http://localhost:3000';
const USERNAME = process.env.IL_UI_API_SERVER_USERNAME || 'kitteh';
const PASSWORD = process.env.IL_UI_API_SERVER_PASSWORD || 'floofykittens';

export async function POST(req: Request) {
  console.log(`Received request: ${req.method} ${req.url} ${req.body}}`);

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Basic ' + auth,
  };

  try {
    const body = await req.json();
    const response = await fetch(`${API_SERVER_URL}/pr/knowledge`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status !== 201) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to post knowledge data:', error);
    return NextResponse.json({ error: 'Failed to post knowledge data' }, { status: 500 });
  }
}

export const methods = {
  POST,
};
