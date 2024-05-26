// src/app/api/playground/devchat/route.ts
'use server';
import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import https from 'https';
import http from 'http';
import { PassThrough } from 'stream';
import '../../../../../envConfig';

export async function POST(req: NextRequest) {
  try {
    const { question, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, repetitionPenalty, selectedModel, systemRole } =
      await req.json();

    const messages = [
      { role: 'system', content: systemRole },
      { role: 'user', content: question },
    ].filter((message) => message.content);

    // TODO: resolve this typing eslint skip
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const requestData: any = {
      model: selectedModel.modelName,
      messages: messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      repetition_penalty: repetitionPenalty,
      stop: ['<|endoftext|>'],
      logprobs: false,
      stream: true,
    };

    const agent = selectedModel.apiURL.startsWith('https') ? new https.Agent({ rejectUnauthorized: false }) : new http.Agent();

    const chatResponse = await fetch(`${selectedModel.apiURL}/v1/chat/completions`, {
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
