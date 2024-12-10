// src/app/api/fine-tune/jobs/[job_id]/status/route.ts
'use server';

import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { job_id: string } }) {
  const { job_id } = params;
  const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

  try {
    // Forward the request to the API server
    const response = await fetch(`${API_SERVER}/jobs/${job_id}/status`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from API server:', errorText);
      return NextResponse.json({ error: 'Error fetching job status' }, { status: 500 });
    }

    const result = await response.json();
    // Return the job status to the client
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json({ error: 'Error fetching job status' }, { status: 500 });
  }
}
