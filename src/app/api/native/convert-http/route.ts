// src/app/api/native/convert-http/route.ts
'use server';

import { NextResponse } from 'next/server';

interface ConvertHttpRequestBody {
  options?: {
    from_formats?: string[];
    to_formats?: string[];
    image_export_mode?: string;
    table_mode?: string;
    abort_on_error?: boolean;
    return_as_file?: boolean;
    do_table_structure?: boolean;
    include_images?: boolean;
  };
  http_sources: { url: string }[];
}

// convert a doc from a URL (provided via http_sources) to Markdown.
export async function POST(request: Request) {
  try {
    const body: ConvertHttpRequestBody = await request.json();
    const baseUrl = process.env.IL_FILE_CONVERSION_SERVICE || 'http://doclingserve:5001';
    const healthRes = await fetch(`${baseUrl}/health`);
    if (!healthRes.ok) {
      console.error('The file conversion service is offline or returned non-OK status:', healthRes.status, healthRes.statusText);
      return NextResponse.json({ error: 'Conversion service is offline, only markdown files accepted.' }, { status: 503 });
    }

    const healthData = await healthRes.json();
    if (!healthData.status || healthData.status !== 'ok') {
      console.error('Conversion service health check response not "ok":', healthData);
      return NextResponse.json({ error: 'Conversion service is offline, only markdown files accepted.' }, { status: 503 });
    }

    const res = await fetch(`${baseUrl}/v1alpha/convert/source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.error('Conversion service responded with error', res.status, res.statusText);
      return NextResponse.json({ error: `Conversion service call failed. ${res.statusText}` }, { status: 500 });
    }

    const data = await res.json();

    // Return the markdown wrapped in JSON for the client to parse
    return NextResponse.json({ content: data }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error during URL conversion route call:', error);
      return NextResponse.json({ error: 'URL conversion failed.', message: error.message }, { status: 500 });
    } else {
      console.error('Unknown error during conversion route call:', error);
      return NextResponse.json({ error: 'Conversion failed due to an unknown error.' }, { status: 500 });
    }
  }
}
