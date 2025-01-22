// src/app/api/fine-tune/pipeline/generate-train/route.ts
'use server';

import { NextResponse } from 'next/server';

interface GenerateTrainPipelineSuccessResponse {
  pipeline_job_id: string;
}

// Interface for an error response from the API server
interface GenerateTrainPipelineErrorResponse {
  error: string;
}

// Union type for API responses
type GenerateTrainPipelineAPIResponse = GenerateTrainPipelineSuccessResponse | GenerateTrainPipelineErrorResponse;

export async function POST(request: Request): Promise<NextResponse<GenerateTrainPipelineAPIResponse>> {
  try {
    // Parse the request body for required data
    const { modelName, branchName, epochs } = await request.json();
    const API_SERVER = process.env.NEXT_PUBLIC_API_SERVER!;

    console.log('Request body:', { modelName, branchName, epochs });

    // Validate required parameters
    if (!modelName || !branchName) {
      console.error('Missing required parameters: modelName and branchName');
      return NextResponse.json({ error: 'Missing required parameters: modelName and branchName' }, { status: 400 });
    }

    // Validate epochs if provided
    if (epochs !== undefined && (typeof epochs !== 'number' || epochs <= 0)) {
      return NextResponse.json({ error: "'epochs' must be a positive integer" }, { status: 400 });
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
        branchName,
        epochs
      })
    });

    console.log('Response from API server:', {
      status: response.status,
      statusText: response.statusText
    });

    // Read the response body as text
    const responseText = await response.text();

    // Attempt to parse the response as JSON
    let responseData: GenerateTrainPipelineAPIResponse;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response data:', responseData);
    } catch (error) {
      console.error('Error parsing JSON response from API server:', error);
      return NextResponse.json({ error: 'Invalid JSON response from the API server' }, { status: 500 });
    }

    // Use 'let' instead of 'const' for responseData
    // Determine if the response is a success or error
    if ('pipeline_job_id' in responseData) {
      // Successful response
      if (!responseData.pipeline_job_id) {
        console.error('Missing pipeline_job_id in API server response:', responseData);
        return NextResponse.json({ error: 'API server response does not contain pipeline_job_id' }, { status: 500 });
      }

      // Return the successful response to the client
      console.log('Returning success response with pipeline_job_id:', responseData.pipeline_job_id);
      return NextResponse.json(responseData, { status: 200 });
    } else {
      // Error response
      console.error('API server returned an error:', responseData.error);
      return NextResponse.json({ error: responseData.error || 'Failed to start generate-train pipeline' }, { status: response.status });
    }
  } catch (error) {
    console.error('Unexpected error during training:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during training' }, { status: 500 });
  }
}
