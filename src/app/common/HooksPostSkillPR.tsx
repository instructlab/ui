// HooksPostSkillPR.tsx
import { useState } from 'react';

const API_SERVER_URL = process.env.IL_UI_API_SERVER_URL || 'http://localhost:3000/';

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
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);

  const postSkillPR = async (data: SkillPRData) => {
    const username = process.env.IL_UI_API_SERVER_USERNAME;
    const password = process.env.IL_UI_API_SERVER_PASSWORD;

    // auth header using base64 encoding
    const auth = btoa(username + ":" + password);
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + auth
    };

    try {
      const API_SERVER_PR_URL = API_SERVER_URL + 'pr/skill';
      const res = await fetch(API_SERVER_PR_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.status !== 200) {
        setError(result.error);
        console.log('Skill submission failed ' + result.msg);
        return [null, result.error];
      }

      setResponse(result.msg);
      console.log('Skill submitted successfully' + result.msg);
      return [result.msg, null];
    } catch (error) {
      console.error("Failed to post skill PR data:", error);
      return [null, error];
    }
  };

  return { response, error, postSkillPR };
};
