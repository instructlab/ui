'use server';

import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  try {
    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

    const response = await fetch(`${API_SERVER}/data/generate`, {
      method: 'POST'
    });

    if (!response.ok) {
      console.error('Error response from API server:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to generate data' }, { status: response.status });
    }

    const responseData = await response.json();

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Error generating data:', error);
    return NextResponse.json({ error: 'An error occurred while generating data' }, { status: 500 });
  }
}
