// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';

const API_CHAT_URL = process.env.IL_UI_API_CHAT_URL || 'http://localhost:3000';
const USERNAME = process.env.IL_UI_API_SERVER_USERNAME || 'kitteh';
const PASSWORD = process.env.IL_UI_API_SERVER_PASSWORD || 'floofykittens';

export async function POST(request: Request) {
  const { question, context } = await request.json();

  // Auth header using base64 encoding
  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Basic ' + auth,
  };

  try {
    const response = await fetch(`${API_CHAT_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to post chat data:', error);
    return NextResponse.json({ error: 'Failed to post chat data' }, { status: 500 });
  }
}

export const methods = {
  POST,
};
