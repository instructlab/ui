// src/app/api/fine-tune/model/train/route.ts
'use server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Received train job request');

    // Parse the request body for required data
    const { modelName, branchName, epochs } = await request.json();
    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

    console.log('Request body:', { modelName, branchName, epochs });

    if (!modelName || !branchName) {
      console.error('Missing required parameters: modelName and branchName');
      return NextResponse.json({ error: 'Missing required parameters: modelName and branchName' }, { status: 400 });
    }

    // Validate epochs if provided
    if (epochs !== undefined && (typeof epochs !== 'number' || epochs <= 0)) {
      return NextResponse.json({ error: "'epochs' must be a positive integer" }, { status: 400 });
    }

    // Forward the request to the API server
    const endpoint = `${API_SERVER}/model/train`;

    console.log(`Forwarding request to API server: ${API_SERVER}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modelName,
        branchName,
        epochs
      })
    });

    console.log('Response from API server:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from API server:', response.status, response.statusText, errorText);
      return NextResponse.json({ error: 'Failed to train the model on the API server' }, { status: response.status });
    }

    // Parse response safely
    let responseData;
    try {
      const text = await response.text();
      responseData = text ? JSON.parse(text) : {};
      console.log('Parsed response data:', responseData);
    } catch (error) {
      console.error('Error parsing JSON response from API server:', error);
      return NextResponse.json({ error: 'Invalid JSON response from the API server' }, { status: 500 });
    }

    if (!responseData.job_id) {
      console.error('Missing job_id in API server response:', responseData);
      return NextResponse.json({ error: 'API server response does not contain job_id' }, { status: 500 });
    }

    console.log('Returning success response with job_id:', responseData.job_id);
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Unexpected error during training:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during training' }, { status: 500 });
  }
}
