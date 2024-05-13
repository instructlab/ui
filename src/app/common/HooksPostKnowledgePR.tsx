// HooksPostKnowledgePR.tsx
import { useState } from 'react';

const API_SERVER_URL = process.env.IL_UI_API_SERVER_URL || 'http://localhost:3000/';

interface KnowledgePRData {
  name: string;
  email: string;
  task_description: string;
  task_details: string;
  repo: string;
  commit: string;
  patterns: string;
  title_work: string;
  link_work: string;
  revision: string;
  license_work: string;
  creators: string;
  domain: string;
  questions: string[];
  answers: string[];
}

export const usePostKnowledgePR = () => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const postKnowledgePR = async (data: KnowledgePRData) => {
    const username = process.env.IL_UI_API_SERVER_USERNAME;
    const password = process.env.IL_UI_API_SERVER_PASSWORD;

    // auth header using base64 encoding
    const auth = btoa(username + ":" + password);
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + auth
    };

    try {
      const API_SERVER_PR_URL = API_SERVER_URL + 'pr/knowledge';
      const res = await fetch(API_SERVER_PR_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.status !== 200) {
        setError(result.error);
        console.log('Knowledge submission failed ' + result.msg);
        return [null, result.error];
      }

      setResponse(result.msg);
      console.log('Knowledge submitted successfully ' + result.msg);
      return [result.msg, null];
    } catch (error) {
      console.error("Failed to post Knowledge PR: ", error);
      return [null, error];

    }
  };

  return { response, error, postKnowledgePR };
};
