// pages/api/pr/skill.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const API_SERVER_URL = process.env.IL_UI_API_SERVER_URL || 'http://localhost:3000';
const USERNAME = process.env.IL_UI_API_SERVER_USERNAME || 'kitteh';
const PASSWORD = process.env.IL_UI_API_SERVER_PASSWORD || 'floofykittens';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + auth,
    };

    try {
      const apiRes = await fetch(`${API_SERVER_URL}pr/skill`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body),
      });

      if (!apiRes.ok) {
        const errorResult = await apiRes.json();
        throw new Error(`HTTP error! status: ${apiRes.status} - ${errorResult.error}`);
      }

      const result = await apiRes.json();
      res.status(201).json(result);
    } catch (error) {
      console.error('Failed to post Skill PR:', error);
      res.status(500).json({ error: 'Failed to post Skill PR' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
