// src/common/HooksPostChat.tsx
import { useState } from 'react';

interface ChatData {
  question: string;
  context?: string;
}

const API_URL = '/api/chat';

export const usePostChat = () => {
  const [response, setResponse] = useState(null);

  const postChat = async (data: ChatData) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      setResponse(result);
      return result;
    } catch (error) {
      console.error('Failed to post chat data:', error);
      return null;
    }
  };

  return { response, postChat };
};
