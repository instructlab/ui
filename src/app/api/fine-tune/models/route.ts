// src/pages/api/fine-tune/models/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

    const response = await fetch(`${API_SERVER}/models`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
