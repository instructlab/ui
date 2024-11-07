// src/app/api/tree/route.ts
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

const DEPLOYMENT = process.env.IL_UI_DEPLOYMENT!;
const EXPERIMENTAL_FEATURES = process.env.NEXT_PUBLIC_EXPERIMENTAL_FEATURES || '';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { root_path, dir_name } = body;

  try {
    let apiBaseUrl = 'http://pathservice:4000/tree/';
    if (DEPLOYMENT === 'dev' && EXPERIMENTAL_FEATURES !== 'true') {
      apiBaseUrl = 'http://localhost:4000/tree/';
    }
    const response = await axios.get<string[]>(apiBaseUrl + root_path, {
      params: { dir_name: dir_name }
    });
    return NextResponse.json({ data: response.data }, { status: 201 });
  } catch (error) {
    console.error('Failed to get the tree for path:', root_path, error);
    return NextResponse.json({ error: 'Failed to get the tree for path' }, { status: 500 });
  }
}
