// src/app/api/model/vllm-status/route.ts
'use server';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelName = searchParams.get('modelName');
    if (!modelName) {
      return NextResponse.json({ error: 'Missing modelName query param' }, { status: 400 });
    }

    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;
    const endpoint = `${API_SERVER}/vllm-status?model_name=${modelName}`;

    console.log('Forwarding request to vllm-status:', endpoint);

    const response = await fetch(endpoint);
    if (!response.ok) {
      console.error('vllm-status error from API server:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to get vllm status' }, { status: response.status });
    }

    const statusData = await response.json();
    return NextResponse.json(statusData, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in vllm-status route:', error);
    return NextResponse.json({ error: 'Unexpected error fetching vllm status' }, { status: 500 });
  }
}
