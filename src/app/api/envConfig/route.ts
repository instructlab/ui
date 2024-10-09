// src/app/api/envConfig/route.ts
import { NextResponse } from 'next/server';

// Set the route to be dynamic, to ensure that it's not pre-rendered as static resource.
// Otherwise client side code will get empty envConfig object, when UI is deployed
// in the container in kubernetes/docker environment.
export const dynamic = 'force-dynamic';

export async function GET() {
  const envConfig = {
    ENDPOINT_PROXY: process.env.IL_ENDPOINT_PROXY || '',
    GRANITE_API: process.env.IL_GRANITE_API || '',
    GRANITE_MODEL_NAME: process.env.IL_GRANITE_MODEL_NAME || '',
    MERLINITE_API: process.env.IL_MERLINITE_API || '',
    MERLINITE_MODEL_NAME: process.env.IL_MERLINITE_MODEL_NAME || '',
    UPSTREAM_REPO_OWNER: process.env.NEXT_PUBLIC_TAXONOMY_REPO_OWNER || '',
    UPSTREAM_REPO_NAME: process.env.NEXT_PUBLIC_TAXONOMY_REPO || '',
    DEPLOYMENT_TYPE: process.env.IL_UI_DEPLOYMENT || ''
  };

  return NextResponse.json(envConfig);
}
