import { NextRequest, NextResponse } from 'next/server';

type LogsRouteProps = {
  params: Promise<{ job_id: string }>;
};

export async function GET(request: NextRequest, props: LogsRouteProps) {
  const { job_id } = await props.params;

  try {
    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;
    const endpoint = `${API_SERVER}/jobs/${job_id}/logs`;
    console.log('Forwarding logs request to:', endpoint);

    const response = await fetch(endpoint, { method: 'GET' });
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
