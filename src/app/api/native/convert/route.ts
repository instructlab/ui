// src/app/api/native/convert/route.ts
import { NextResponse } from 'next/server';

`use server`;

interface ConvertRequestBody {
  options?: {
    output_markdown?: boolean;
    include_images?: boolean;
  };
  file_source: {
    base64_string: string;
    filename: string;
  };
}

// This route calls the external REST service to convert any doc => markdown
export async function POST(request: Request) {
  try {
    // 1. Parse JSON body from client
    const body: ConvertRequestBody = await request.json();

    // 2. Read the IL_FILE_CONVERSION_SERVICE from .env (fallback to localhost if not set)
    const baseUrl = process.env.IL_FILE_CONVERSION_SERVICE || 'http://localhost:8000';

    // 3. Check the health of the conversion service before proceeding
    const healthRes = await fetch(`${baseUrl}/health`);
    if (!healthRes.ok) {
      console.error('The file conversion service is offline or returned non-OK status:', healthRes.status, healthRes.statusText);
      return NextResponse.json({ error: 'Conversion service is offline, only markdown files accepted.' }, { status: 503 });
    }

    // Parse the health response body in case we need to verify its "status":"ok"
    const healthData = await healthRes.json();
    if (!healthData.status || healthData.status !== 'ok') {
      console.error('Doc->md conversion service health check response not "ok":', healthData);
      return NextResponse.json({ error: 'Conversion service is offline, only markdown files accepted.' }, { status: 503 });
    }

    // 4. Service is healthy, proceed with md conversion
    const res = await fetch(`${baseUrl}/convert/markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.error('Conversion service responded with error', res.status, res.statusText);
      return NextResponse.json({ error: `Conversion service call failed. ${res.statusText}` }, { status: 500 });
    }

    // 5. Wait for the docling service to return the user submitted file converted to markdown
    const data = await res.text();

    // Return the markdown wrapped in JSON so the client side can parse it
    return NextResponse.json({ content: data }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error during doc->md conversion route call:', error);
      return NextResponse.json({ error: 'md conversion failed.', message: error.message }, { status: 500 });
    } else {
      console.error('Unknown error during conversion route call:', error);
      return NextResponse.json({ error: 'conversion failed due to an unknown error.' }, { status: 500 });
    }
  }
}
