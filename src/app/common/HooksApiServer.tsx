import { useEffect, useState } from 'react';

const API_URL = process.env.IL_UI_API_SERVER_URL || 'http://localhost:3000/jobs';

const useFetchJobs = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      // API server u/p
      const username = process.env.IL_UI_API_SERVER_USERNAME;
      const password = process.env.IL_UI_API_SERVER_PASSWORD;

      // auth header using base64 encoding
      const auth = btoa(username + ":" + password);
      const headers = {
        'Authorization': 'Basic ' + auth
      };

      try {
        const response = await fetch(API_URL, { headers });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setJobs(data);
      } catch ( error ) {
        console.error("Failed to fetch jobs:", error);
      }
    };

    // Fetch the jobs immediately when the component mounts
    fetchJobs();

    // Set up a timer to fetch the jobs periodically (e.g., every 5 seconds)
    const interval = setInterval(fetchJobs, 5000);

    // Clean up the interval on component unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  return jobs;
};

export default useFetchJobs;
