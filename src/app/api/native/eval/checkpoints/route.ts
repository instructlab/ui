// app/api/native/eval/checkpoints/route.ts
'use server';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Received GET request for /api/native/eval/checkpoints');

  try {
    const apiUrl = 'http://localhost:8080/checkpoints';
    console.log(`Fetching checkpoints from external API: ${apiUrl}`);

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`External API response status: ${res.status}`);

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Error from external API:', errorData);
      return NextResponse.json({ error: errorData.error || 'Failed to fetch checkpoints' }, { status: res.status });
    }

    const data = await res.json();
    console.log('Checkpoints data fetched successfully:', data);

    // Validate that data is an array
    if (!Array.isArray(data)) {
      console.warn('Unexpected data format from external API:', data);
      return NextResponse.json({ error: 'Invalid data format received from checkpoints API.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching checkpoints:', error);
    return NextResponse.json({ error: 'Unable to reach the checkpoints endpoint' }, { status: 500 });
  }
}
