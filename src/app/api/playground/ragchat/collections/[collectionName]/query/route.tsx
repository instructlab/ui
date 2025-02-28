// src/app/api/playground/ragchat/collections/[collectionName]/query/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function POST(req: NextRequest, { params }: { params: { collectionName: string } }) {
  const { collectionName } = params;

  try {
    const { question } = await req.json();

    console.log(`Received question: ${question} for collection: ${collectionName}`);

    const response = await fetch(`http://127.0.0.1:8000/collections/${encodeURIComponent(collectionName)}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to query collection: ${errorText}`);
      throw new Error(`Failed to query collection: ${errorText}`);
    }

    // Parse the backend response
    const responseData = await response.json();
    console.log('Backend response data:', responseData);

    // Extract the 'answer' and 'sources' fields
    const { answer, sources } = responseData;

    // Return the answer and sources to the client
    return NextResponse.json({ answer, sources }, { status: 200 });
  } catch (error: any) {
    console.error('Error querying collection:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
