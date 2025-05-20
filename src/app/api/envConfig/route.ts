// src/app/api/envConfig/route.ts
import { NextResponse } from 'next/server';

// Set the route to be dynamic, to ensure that it's not pre-rendered as static resource.
// Otherwise client side code will get empty envConfig object, when UI is deployed
// in the container in kubernetes/docker environment.
export const dynamic = 'force-dynamic';

export async function GET() {
  const envConfig = {
    GRANITE_API: process.env.IL_GRANITE_API || '',
    GRANITE_MODEL_NAME: process.env.IL_GRANITE_MODEL_NAME || '',
    MERLINITE_API: process.env.IL_MERLINITE_API || '',
    MERLINITE_MODEL_NAME: process.env.IL_MERLINITE_MODEL_NAME || '',
    UPSTREAM_REPO_OWNER: process.env.NEXT_PUBLIC_TAXONOMY_REPO_OWNER || '',
    UPSTREAM_REPO_NAME: process.env.NEXT_PUBLIC_TAXONOMY_REPO || '',
    ENABLE_DEV_MODE: process.env.IL_ENABLE_DEV_MODE || 'false',
    ENABLE_DOC_CONVERSION: process.env.IL_ENABLE_DOC_CONVERSION || 'false',
    ENABLE_SKILLS_FEATURES: process.env.IL_ENABLE_SKILLS_FEATURES || '',
    ENABLE_PLAYGROUND_FEATURES: process.env.IL_ENABLE_PLAYGROUND_FEATURES || '',
    EXPERIMENTAL_FEATURES: process.env.NEXT_PUBLIC_EXPERIMENTAL_FEATURES || '',
    TAXONOMY_ROOT_DIR: process.env.NEXT_PUBLIC_TAXONOMY_ROOT_DIR || '',
    TAXONOMY_KNOWLEDGE_DOCUMENT_REPO:
      process.env.NEXT_PUBLIC_TAXONOMY_DOCUMENTS_REPO || 'https://github.com/instructlab-public/taxonomy-knowledge-docs',
    API_SERVER: process.env.NEXT_PUBLIC_API_SERVER,
    HEADER_LOGO: process.env.IL_HEADER_LOGO,
    HEADER_LOGO_DARK: process.env.IL_HEADER_LOGO_DARK,
    LARGE_LOGO: process.env.IL_LARGE_LOGO,
    LARGE_LOGO_DARK: process.env.IL_LARGE_LOGO_DARK,
    PRODUCT_NAME: process.env.IL_PRODUCT_NAME
  };

  return NextResponse.json(envConfig);
}
