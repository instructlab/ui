// src/app/api/jobs/route.ts
import { NextResponse } from 'next/server';

const API_SERVER_URL = process.env.IL_UI_API_SERVER_URL || 'http://localhost:3000';
const USERNAME = process.env.IL_UI_API_SERVER_USERNAME || 'kitteh';
const PASSWORD = process.env.IL_UI_API_SERVER_PASSWORD || 'floofykittens';

export async function GET() {
  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const headers = {
    Authorization: `Basic ${auth}`,
  };

  try {
    const response = await fetch(`${API_SERVER_URL}/jobs`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export function POST() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
