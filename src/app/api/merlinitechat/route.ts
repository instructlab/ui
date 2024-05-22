// src/app/api/merlinitechat/route.ts
'use server';
import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import https from 'https';
import { PassThrough } from 'stream';
import '../../../../envConfig';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    const messages = [{ text: question, isUser: true }];

    const requestData = {
      model: process.env.IL_MERLINITE_MODEL_NAME,
      messages: messages.map((message) => ({
        content: message.text,
        role: 'user',
      })),
      stream: true,
    };

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const chatResponse = await fetch(`${process.env.IL_MERLINITE_API}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(requestData),
      agent,
    });

    if (!chatResponse.body) {
      return new NextResponse('Failed to fetch chat response', { status: 500 });
    }

    const passThrough = new PassThrough();

    chatResponse.body.on('data', (chunk) => {
      const chunkString = chunk.toString();
      const lines = chunkString.split('\n').filter((line) => line.trim() !== '');

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
              passThrough.write(deltaContent); // Send the delta content to the client
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

    return new NextResponse(passThrough, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse('Error processing request', { status: 500 });
  }
}
