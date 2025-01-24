// src/pages/api/fine-tune/data-sets.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

    const response = await fetch(`${API_SERVER}/data`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
