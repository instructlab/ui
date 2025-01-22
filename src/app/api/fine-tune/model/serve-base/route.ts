// src/app/api/model/serve-base/route.ts
'use server';

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Received serve-base model request');

    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;
    const endpoint = `${API_SERVER}/model/serve-base`;

    console.log(`Forwarding request to the API server: ${endpoint}`);

    // No request body needed for serving the base model
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Response from API server (serve-base):', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      console.error('Error response from the API server:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to serve the base model on the API server' }, { status: response.status });
    }

    // Parse response safely
    let responseData;
    try {
      const text = await response.text();
      responseData = text ? JSON.parse(text) : {};
      console.log('Parsed response data (serve-base):', responseData);
    } catch (error) {
      console.error('Error parsing JSON response from API server:', error);
      return NextResponse.json({ error: 'Invalid JSON response from the API server' }, { status: 500 });
    }

    if (!responseData.job_id) {
      console.error('Missing job_id in API server response for serve-base:', responseData);
      return NextResponse.json({ error: 'API server response does not contain job_id' }, { status: 500 });
    }

    console.log('Returning success response with job_id (serve-base):', responseData.job_id);
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Unexpected error during serve-base:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during serving the base model' }, { status: 500 });
  }
}
