// src/app/api/native/eval/qna/route.ts
import { NextResponse, NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const HARD_CODED_QNA_PATH = '/var/home/cloud-user/.local/share/instructlab/taxonomy/knowledge/history/amazon/qna.yaml';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[SERVER] Body received:', body);

    const { selectedModelDir } = body;
    if (!selectedModelDir) {
      console.error('[SERVER] Missing selectedModelDir in request body!');
      return NextResponse.json({ error: 'Missing required field: selectedModelDir' }, { status: 400 });
    }

    console.log('[SERVER] selectedModelDir:', selectedModelDir);

    // Forward to Go backend
    const response = await fetch(`${BACKEND_URL}/qna-eval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_path: selectedModelDir,
        yaml_file: HARD_CODED_QNA_PATH
      })
    });

    const data = await response.json();
    console.log('[SERVER] Response from Go backend:', data);

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to initiate QnA evaluation' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in /api/native/eval/qna route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
