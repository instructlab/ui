// src/app/api/playground/ragchat/collections/[collectionName]/documents/file/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import FormData from 'form-data';

export async function POST(req: NextRequest, { params }: { params: { collectionName: string } }) {
  const { collectionName } = params;

  try {
    // Parse the form data from the incoming request
    const formData = await req.formData();
    const file = formData.get('files') as File | null;

    if (!file) {
      throw new Error('File is required for upload');
    }

    // Create FormData for the backend request
    const backendFormData = new FormData();

    // Convert the file to a Buffer for the Node.js environment
    const buffer = Buffer.from(await file.arrayBuffer());

    // Append the file buffer to FormData
    backendFormData.append('file', buffer, file.name);

    // Send the file to the backend service
    const backendResponse = await fetch(`http://127.0.0.1:8000/collections/${encodeURIComponent(collectionName)}/documents/file`, {
      method: 'POST',
      body: backendFormData,
      headers: backendFormData.getHeaders()
    });

    const backendResponseText = await backendResponse.text();

    if (!backendResponse.ok) {
      throw new Error(`Failed to upload file to backend: ${backendResponseText}`);
    }

    return NextResponse.json({ message: 'File uploaded successfully', data: backendResponseText }, { status: 200 });
  } catch (error: any) {
    console.error('Error during file upload:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
