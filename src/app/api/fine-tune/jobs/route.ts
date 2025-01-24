// src/app/api/fine-tune/jobs/route.ts
'use server';

import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  // eslint-disable-line @typescript-eslint/no-unused-vars
  const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

  try {
    const response = await fetch(`${API_SERVER}/jobs`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from API server:', errorText);
      return NextResponse.json({ error: 'Error fetching jobs' }, { status: 500 });
    }
    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Error fetching jobs' }, { status: 500 });
  }
}
