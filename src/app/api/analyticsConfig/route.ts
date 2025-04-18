import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
 const uiConfig = {
   verbose: process.env.ANALYTICS_VERBOSE || true,
   activeProviders: process.env.ANALYTICS_PROVIDERS || [ "None" ],
   umamiKey: process.env.UMAMI_KEY || '',
   umamiHostUrl: process.env.UMAMI_HOST_URL || '',
   segmentKey: process.env.SEGMENT_KEY || '',
   segmentCdn: process.env.SEGMENT_CDN || '',
   segmentIntegrations: {}
 } ;

  const tmp = process.env.SEGMENT_INTEGRATIONS;
  if (tmp) {
    uiConfig.segmentIntegrations = JSON.parse(tmp);
  }

 return NextResponse.json(uiConfig);
}
