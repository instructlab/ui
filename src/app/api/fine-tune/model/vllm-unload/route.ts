'use server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { model_name } = body;
    if (!model_name) {
      return NextResponse.json({ error: 'Missing model_name' }, { status: 400 });
    }

    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;
    const endpoint = `${API_SERVER}/vllm-unload`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_name })
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Unload model error from API server:', errorText);
      return NextResponse.json({ error: errorText }, { status: resp.status });
    }

    const data = await resp.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in vllm-unload route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
