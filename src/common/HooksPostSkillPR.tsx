// src/common/HooksPostSkillPR.tsx
import { useState } from 'react';

interface SkillPRData {
  name: string;
  email: string;
  task_description: string;
  task_details: string;
  title_work: string;
  link_work: string;
  license_work: string;
  creators: string;
  questions: string[];
  contexts: string[];
  answers: string[];
}

export const usePostSkillPR = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const postSkillPR = async (data: SkillPRData) => {
    try {
      const res = await fetch('/api/pr/skill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.status !== 201) {
        setError(result.error);
        console.log('Skill submission failed: ' + result.error);
        return [null, result.error];
      }

      setResponse(result.msg);
      console.log('Skill submitted successfully: ' + result.msg);
      return [result.msg, null];
    } catch (error) {
      console.error('Failed to post Skill PR: ', error);
      setError('Failed to post Skill PR');
      return [null, 'Failed to post Skill PR'];
    }
  };

  return { response, error, postSkillPR };
};
