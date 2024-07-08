'use server';

import { NextResponse, NextRequest } from 'next/server';
import fetch from 'node-fetch';

export async function POST(req: NextRequest) {
  const { repoUrl, documentNames } = await req.json();
  const USERNAME = process.env.DS_USERNAME;
  const API_KEY = process.env.DS_API_KEY;
  const HOST = process.env.DS_HOST;
  const PROJ_KEY = process.env.DS_PROJ_KEY;
  const BRANCH = 'main';

  if (!USERNAME || !API_KEY || !HOST || !PROJ_KEY) {
    console.error('Missing environment variables');
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const pdfFileName = documentNames.find((name) => name.endsWith('.pdf'));
  if (!pdfFileName) {
    console.error('No PDF file found for conversion');
    return NextResponse.json({ error: 'No PDF file found for conversion' }, { status: 400 });
  }

  const [repoOwner, repoName] = repoUrl.replace('https://github.com/', '').split('/');
  const PDF_URL = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${BRANCH}/${pdfFileName}`;
  console.log(`PDF URL for conversion: ${PDF_URL}`);

  try {
    console.log('Starting authentication...');
    const authResponse = await fetch(`${HOST}/api/cps/user/v1/user/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${USERNAME}:${API_KEY}`).toString('base64')}`
      },
      body: JSON.stringify({})
    });

    if (!authResponse.ok) {
      const error = await authResponse.text();
      console.error('Error during authentication:', error);
      return NextResponse.json({ error }, { status: authResponse.status });
    }

    const authData = await authResponse.json();
    const token = authData.access_token;
    console.log('Authentication successful. Token obtained.');

    console.log('Starting PDF conversion...');
    const convertResponse = await fetch(`${HOST}/api/cps/public/v2/project/${PROJ_KEY}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify({
        http_source: { url: PDF_URL, headers: {} }
      })
    });

    if (!convertResponse.ok) {
      const error = await convertResponse.text();
      console.error('Error during PDF conversion:', error);
      return NextResponse.json({ error }, { status: convertResponse.status });
    }

    const convertData = await convertResponse.json();
    const taskId = convertData.task_id;
    console.log(`PDF conversion started. Task ID: ${taskId}`);

    console.log('Checking conversion task status...');
    let taskStatus;
    while (true) {
      const taskResponse = await fetch(`${HOST}/api/cps/public/v2/project/${PROJ_KEY}/convert_tasks/${taskId}?wait=10`, {
        method: 'GET',
        headers: {
          Authorization: token
        }
      });

      if (!taskResponse.ok) {
        const error = await taskResponse.text();
        console.error('Error during task status check:', error);
        return NextResponse.json({ error }, { status: taskResponse.status });
      }

      const taskText = await taskResponse.text();
      try {
        taskStatus = JSON.parse(taskText);
      } catch (parseError) {
        console.error('Error parsing task status response:', taskText);
        return NextResponse.json({ error: 'Failed to parse task status response' }, { status: 500 });
      }

      console.log(`Task status: ${taskStatus.task_status}`);

      if (taskStatus.result && ['SUCCESS', 'FAILURE'].includes(taskStatus.task_status)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds before polling again
    }

    if (taskStatus.task_status === 'FAILURE') {
      console.error('PDF Conversion Task failed.');
      return NextResponse.json({ error: 'PDF Conversion Task failed' }, { status: 500 });
    }

    const result = {
      json_file_url: taskStatus.result.json_file_url,
      md_file_url: taskStatus.result.md_file_url,
      document_hash: taskStatus.result.document_hash
    };

    console.log('Task completed successfully.');
    console.log(`Full Result: ${result}`);
    console.log(`JSON file URL: ${result.json_file_url}`);
    console.log(`Markdown file URL: ${result.md_file_url}`);
    console.log(`Document hash: ${result.document_hash}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
