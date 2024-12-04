// src/app/api/playground/ragchat/collections/[collectionName]/documents/url/route.ts
`use server`;

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { collectionName: string } }) {
  const { collectionName } = params;

  try {
    const { http_source } = await req.json();

    const response = await fetch(`http://localhost:8000/collections/${encodeURIComponent(collectionName)}/documents/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ http_source })
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Failed to upload URL: ${responseText}`);
    }

    return NextResponse.json({ message: 'URL uploaded successfully', data: responseText }, { status: 200 });
  } catch (error: any) {
    console.error('Error uploading URL:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
