'use server';

import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function DELETE(req: NextRequest, { params }: { params: { collectionName: string } }) {
  const { collectionName } = params;

  try {
    console.log(`Deleting collection: ${collectionName}`);

    // Make the API request to the backend to delete the collection
    const response = await fetch(`http://127.0.0.1:8000/collections/${encodeURIComponent(collectionName)}`, {
      method: 'DELETE'
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to delete collection: ${errorText}`);
      throw new Error(`Failed to delete collection: ${errorText}`);
    }

    // Return a success response to the client
    console.log(`Collection ${collectionName} deleted successfully.`);
    return NextResponse.json({ message: `Collection ${collectionName} deleted successfully.` }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting collection:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
