'use server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the request body for required data
    const { modelName, branchName } = await request.json();
    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

    if (!modelName || !branchName) {
      return NextResponse.json({ error: 'Missing required parameters: modelName and branchName' }, { status: 400 });
    }

    // Forward the request to the API server's pipeline endpoint
    const endpoint = `${API_SERVER}/pipeline/generate-train`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modelName,
        branchName
      })
    });

    if (!response.ok) {
      console.error('Error response from API server (pipeline):', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to run generate-train pipeline on the API server' }, { status: response.status });
    }

    const responseData = await response.json();
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Error during generate-train pipeline:', error);
    return NextResponse.json({ error: 'An error occurred during generate-train pipeline' }, { status: 500 });
  }
}
