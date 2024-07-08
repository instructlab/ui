// src/utils/dsauthenticate.ts
'use server';

import fetch from 'node-fetch';

export async function dsauthenticate(USERNAME: string, API_KEY: string, DS_HOST: string, retries: number = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
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
        throw new Error(authText);
      }

      const authData = JSON.parse(authText);
      console.log('Authentication successful. Token obtained:', authData.access_token);
      return authData.access_token;
    } catch (error) {
      console.error(`Authentication attempt ${attempt + 1} failed:`, error.message);
      if (attempt < retries - 1) {
        console.log('Retrying in 3 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        throw new Error('Failed to authenticate after multiple attempts');
      }
    }
  }
}
