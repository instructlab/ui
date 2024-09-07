// src/app/api/playground/chat/route.ts
'use server';
import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import https from 'https';

export async function POST(req: NextRequest) {
  try {
    const { question, systemRole } = await req.json();

    const apiURL = 'https://granite-7b-lab-vllm-openai.apps.fmaas-backend.fmaas.res.ibm.com';
    const modelName = 'instructlab/granite-7b-lab';

    const messages = [
      { role: 'system', content: systemRole },
      { role: 'user', content: question }
    ];

    const requestData = {
      model: modelName,
      messages,
      stream: false // Disable streaming
    };

    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const chatResponse = await fetch(`${apiURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify(requestData),
      agent: apiURL.startsWith('https') ? agent : undefined
    });

    if (!chatResponse.ok) {
      return new NextResponse('Failed to fetch chat response', { status: chatResponse.status });
    }

    const result = await chatResponse.json(); // Wait for the complete response

    return new NextResponse(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse('Error processing request', { status: 500 });
  }
}
