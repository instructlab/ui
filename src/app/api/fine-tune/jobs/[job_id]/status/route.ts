// src/app/api/fine-tune/jobs/[job_id]/status/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';

type StatusRouteProps = {
  params: Promise<{ job_id: string }>;
};

export async function GET(request: NextRequest, props: StatusRouteProps) {
  const { job_id } = await props.params;
  const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

  try {
    const response = await fetch(`${API_SERVER}/jobs/${job_id}/status`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from API server:', errorText);
      return NextResponse.json({ error: 'Error fetching job status' }, { status: 500 });
    }

    // Return the job status to the client
    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json({ error: 'Error fetching job status' }, { status: 500 });
  }
}
