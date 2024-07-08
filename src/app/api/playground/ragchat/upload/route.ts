// pages/api/playground/ragchat/upload.ts
'use server';

import { NextResponse, NextRequest } from 'next/server';
import fetch from 'node-fetch';

export async function POST(req: NextRequest) {
  try {
    const { fileUrl } = await req.json();

    if (!fileUrl) {
      console.error('No file URL found in the request');
      return NextResponse.json({ error: 'No file URL found in the request' }, { status: 400 });
    }

    console.log('File URL received:', fileUrl);

    const USERNAME = process.env.DS_USERNAME;
    const API_KEY = process.env.DS_API_KEY;
    const DS_HOST = process.env.DS_HOST;
    const PROJ_KEY = process.env.DS_PROJ_KEY;
    const INDEX_KEY = process.env.DS_INDEX_KEY;

    if (!USERNAME || !API_KEY || !DS_HOST || !PROJ_KEY || !INDEX_KEY) {
      console.error('Missing environment variables');
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    // Step 1: Authenticate
    console.log('Starting authentication...');
    const authResponse = await fetch(`${DS_HOST}/api/cps/user/v1/user/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${USERNAME}:${API_KEY}`).toString('base64')}`
      },
      body: JSON.stringify({})
    });

    const authText = await authResponse.text();
    console.log('Auth response text:', authText);

    if (!authResponse.ok) {
      console.error('Error during authentication:', authText);
      return NextResponse.json({ error: authText }, { status: authResponse.status });
    }

    const authData = JSON.parse(authText);
    const token = authData.access_token;
    console.log('Authentication successful. Token obtained.');

    // Step 2: Upload & Convert PDF
    console.log('Starting document upload and conversion...');
    const uploadResponse = await fetch(`${DS_HOST}/api/cps/public/v1/project/${PROJ_KEY}/data_indices/${INDEX_KEY}/actions/ccs_convert_upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        file_url: [fileUrl]
      })
    });

    const uploadText = await uploadResponse.text();
    console.log('Upload response text:', uploadText);

    if (!uploadResponse.ok) {
      console.error('Error during document upload and conversion:', uploadText);
      return NextResponse.json({ error: uploadText }, { status: uploadResponse.status });
    }

    const uploadData = JSON.parse(uploadText);
    const taskId = uploadData.task_id;
    console.log('Document upload and conversion initiated successfully. Task ID:', taskId);

    // Step 3: Polling Task Status for PDF Conversion
    console.log('Polling task status for PDF conversion...');
    let taskStatus = 'PENDING';
    let statusData;
    let retries = 0;
    const maxRetries = 20;
    while (taskStatus === 'PENDING' || taskStatus === 'RETRY' || taskStatus === 'STARTED') {
      const statusResponse = await fetch(`${DS_HOST}/api/cps/public/v2/project/${PROJ_KEY}/celery_tasks/${taskId}?wait=10`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const statusText = await statusResponse.text();
      console.log('Status response text:', statusText);

      if (!statusResponse.ok) {
        console.error('Error during status polling:', statusText);
        return NextResponse.json({ error: statusText }, { status: statusResponse.status });
      }

      statusData = JSON.parse(statusText);
      taskStatus = statusData.task_status;
      console.log(`Task status: ${taskStatus}`);

      if (taskStatus === 'SUCCESS') {
        break;
      } else if (taskStatus === 'FAILURE') {
        console.error('Task failed:', statusData);
        return NextResponse.json({ error: 'Task failed' }, { status: 500 });
      }

      retries++;
      if (retries >= maxRetries) {
        console.error('Max retries reached:', statusData);
        return NextResponse.json({ error: 'Max retries reached' }, { status: 500 });
      }

      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds before the next retry
    }

    if (!statusData.result) {
      console.error('Task result is null');
      return NextResponse.json({ error: 'Task result is null' }, { status: 500 });
    }

    // Step 4: Fetch Document Details
    const transactionId = statusData.result.transaction_id;
    console.log('Fetching document details...');
    const docDetailsResponse = await fetch(
      `${DS_HOST}/api/cps/public/v2/project/${PROJ_KEY}/data_indices/${INDEX_KEY}/documents/transactions/${transactionId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const docDetailsText = await docDetailsResponse.text();
    console.log('Document details response text:', docDetailsText);

    if (!docDetailsResponse.ok) {
      console.error('Error fetching document details:', docDetailsText);
      return NextResponse.json({ error: docDetailsText }, { status: docDetailsResponse.status });
    }

    const docDetailsData = JSON.parse(docDetailsText);
    const docHash = docDetailsData.documents[0]?.document_hash || null;
    if (!docHash) {
      console.error('Invalid document hash:', docHash);
      return NextResponse.json({ error: 'Invalid document hash' }, { status: 500 });
    }

    console.log('Document details fetched successfully. Document hash:', docHash);

    // Step 5: Ingest Document
    console.log('Starting document ingestion...');
    const ingestResponse = await fetch(`${DS_HOST}/api/cps/public/v2/project/${PROJ_KEY}/semantic/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        parameters: {
          skip_ingested_docs: true
        },
        source: {
          type: 'private_data_document',
          index_key: INDEX_KEY,
          document_hash: docHash,
          proj_key: PROJ_KEY
        }
      })
    });

    const ingestText = await ingestResponse.text();
    console.log('Ingest response text:', ingestText);

    if (!ingestResponse.ok) {
      console.error('Error during document ingestion:', ingestText);
      return NextResponse.json({ error: ingestText }, { status: ingestResponse.status });
    }

    const ingestData = JSON.parse(ingestText);
    const ingestTaskId = ingestData.task_id;
    console.log('Document ingestion initiated successfully. Task ID:', ingestTaskId);

    // Step 6: Polling Task Status for Ingestion
    console.log('Polling task status for ingestion...');
    taskStatus = 'PENDING';
    retries = 0;
    while (taskStatus === 'PENDING' || taskStatus === 'RETRY' || taskStatus === 'STARTED') {
      const ingestStatusResponse = await fetch(`${DS_HOST}/api/cps/public/v2/project/${PROJ_KEY}/celery_tasks/${ingestTaskId}?wait=10`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const ingestStatusText = await ingestStatusResponse.text();
      console.log('Ingest status response text:', ingestStatusText);

      if (!ingestStatusResponse.ok) {
        console.error('Error during ingest status polling:', ingestStatusText);
        return NextResponse.json({ error: ingestStatusText }, { status: ingestStatusResponse.status });
      }

      const ingestStatusData = JSON.parse(ingestStatusText);
      taskStatus = ingestStatusData.task_status;
      console.log(`Ingest task status: ${taskStatus}`);

      if (taskStatus === 'SUCCESS') {
        break;
      } else if (taskStatus === 'FAILURE') {
        console.error('Ingest task failed:', ingestStatusData);
        return NextResponse.json({ error: 'Ingest task failed' }, { status: 500 });
      }

      retries++;
      if (retries >= maxRetries) {
        console.error('Max retries reached for ingestion:', ingestStatusData);
        return NextResponse.json({ error: 'Max retries reached for ingestion' }, { status: 500 });
      }

      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds before the next retry
    }

    console.log('Document ingestion completed successfully.');
    return NextResponse.json({ uploadData, ingestData });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
