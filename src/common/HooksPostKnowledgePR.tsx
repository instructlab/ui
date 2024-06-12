// src/common/HooksPostKnowledgePR.tsx
import { useState } from 'react';

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
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const postKnowledgePR = async (data: KnowledgePRData) => {
    try {
      const res = await fetch('/api/pr/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (res.status !== 201) {
        setError(result.error);
        console.log('Knowledge submission failed: ' + result.error);
        return [null, result.error];
      }

      setResponse(result.msg);
      console.log('Knowledge submitted successfully: ' + result.msg);
      return [result.msg, null];
    } catch (error) {
      console.error('Failed to post Knowledge PR: ', error);
      setError('Failed to post Knowledge PR');
      return [null, 'Failed to post Knowledge PR'];
    }
  };

  return { response, error, postKnowledgePR };
};
