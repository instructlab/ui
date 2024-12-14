// src/app/api/tree/route.ts
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

const PATH_SERVICE_URL = process.env.IL_PATH_SERVICE_URL || 'http://pathservice:4000/tree/';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { root_path, dir_name } = body;

  try {
    const apiBaseUrl = PATH_SERVICE_URL;
    const response = await axios.get<string[]>(apiBaseUrl + root_path, {
      params: { dir_name: dir_name }
    });
    return NextResponse.json({ data: response.data }, { status: 201 });
  } catch (error) {
    console.error('Failed to get the tree for path:', root_path, error);
    return NextResponse.json({ error: 'Failed to get the tree for path' }, { status: 500 });
  }
}
