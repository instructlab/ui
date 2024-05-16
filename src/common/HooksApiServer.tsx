// src/common/HooksApiServer.tsx
import { useEffect, useState } from 'react';

const API_URL = '/api/jobs';

const useFetchJobs = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
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
