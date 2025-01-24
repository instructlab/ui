// src/app/api/fine-tune/gpu-free/route.ts
'use server';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;
    const endpoint = `${API_SERVER}/gpu-free`;

    const resp = await fetch(endpoint);
    if (!resp.ok) {
      console.error('gpu-free error from API server:', resp.status, resp.statusText);
      return NextResponse.json({ free_gpus: 0 }, { status: 200 });
      // Return 0 in case of error
    }

    const data = await resp.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in gpu-free route:', error);
    return NextResponse.json({ free_gpus: 0 }, { status: 200 });
  }
}
