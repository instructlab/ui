// src/app/api/fine-tune/jobs/[job_id]/logs/route.ts
import { NextResponse } from 'next/server';

const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

export async function GET(request: Request, { params }: { params: { job_id: string } }) {
  const { job_id } = await Promise.resolve(params);

  try {
    const response = await fetch(`${API_SERVER}/jobs/${job_id}/logs`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from API server:', errorText);
      return NextResponse.json({ error: 'Error fetching logs' }, { status: 500 });
    }

    const logs = await response.text();
    return new NextResponse(logs, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Error fetching logs' }, { status: 500 });
  }
}
