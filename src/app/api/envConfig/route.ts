// src/app/api/envConfig/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const envConfig = {
    GRANITE_API: process.env.IL_GRANITE_API || '',
    GRANITE_MODEL_NAME: process.env.IL_GRANITE_MODEL_NAME || '',
    MERLINITE_API: process.env.IL_MERLINITE_API || '',
    MERLINITE_MODEL_NAME: process.env.IL_MERLINITE_MODEL_NAME || '',
  };

  return NextResponse.json(envConfig);
}
