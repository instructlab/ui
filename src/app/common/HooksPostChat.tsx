// HooksPostChat.tsx
import { useState } from 'react';

const API_CHAT_URL = process.env.IL_UI_API_CHAT_URL || 'http://localhost:3000/chat';

interface ChatData {
  question: string;
  context?: string;
}

export const usePostChat = () => {
  const [response, setResponse] = useState(null);

  const postChat = async (data: ChatData) => {
    const username = process.env.IL_UI_API_SERVER_USERNAME;
    const password = process.env.IL_UI_API_SERVER_PASSWORD;

    // auth header using base64 encoding
    const auth = btoa(username + ":" + password);
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + auth
    };

    try {
      const res = await fetch(API_CHAT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      setResponse(result);
      return result;
    } catch (error) {
      console.error("Failed to post chat data:", error);
      return null;
    }
  };

  return { response, postChat };
};
