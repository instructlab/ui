// src/app/api/playground/chat/route.ts
'use server';
import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import https from 'https';
import { PassThrough } from 'stream';

export async function POST(req: NextRequest) {
  try {
    const { question, systemRole } = await req.json();
    const apiURL = req.nextUrl.searchParams.get('apiURL');
    const modelName = req.nextUrl.searchParams.get('modelName');
    const apiKey = req.nextUrl.searchParams.get('apiKey')

    if (!apiURL || !modelName) {
      return new NextResponse('Missing API URL or Model Name', { status: 400 });
    }

    const messages = [
      { role: 'system', content: systemRole },
      { role: 'user', content: question }
    ];

    const requestData = {
      model: modelName,
      messages: messages,
      stream: true
    };

    let agent: https.Agent
    if (apiKey && apiKey != "" ) {
      agent = new https.Agent({
        rejectUnauthorized: true
      });
    } else {
      agent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    var headers: HeadersInit
    if (apiKey && apiKey != "" ) {
      headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Authorization': `Bearer: ${apiKey}`
      }
    } else {
      headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      }
    }

    const chatResponse = await fetch(`${apiURL}/v1/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestData),
      agent: apiURL.startsWith('https') ? agent : undefined
    });

    if (!chatResponse.body) {
      return new NextResponse('Failed to fetch chat response', { status: 500 });
    }

    const passThrough = new PassThrough();

    chatResponse.body.on('data', (chunk) => {
      const chunkString = chunk.toString();
      const lines = chunkString.split('\n').filter((line: string) => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const json = line.replace('data: ', '');
          if (json === '[DONE]') {
            passThrough.end();
            return;
          }

          try {
            const parsed = JSON.parse(json);
            const deltaContent = parsed.choices[0].delta?.content;

            if (deltaContent) {
              passThrough.write(deltaContent);
            }
          } catch (err) {
            console.error('Error parsing chunk:', err);
          }
        }
      }
    });

    chatResponse.body.on('end', () => {
      passThrough.end();
    });

    const readableStream = new ReadableStream({
      start(controller) {
        passThrough.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        passThrough.on('end', () => {
          controller.close();
        });
        passThrough.on('error', (err) => {
          controller.error(err);
        });
      }
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse('Error processing request', { status: 500 });
  }
}
