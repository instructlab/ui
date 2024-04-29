// HooksWebSocket.tsx
import { useEffect, useState } from 'react';
import { JobModel } from "@app/common/ModelJobs";

const WEBSOCKET_URL = 'ws://localhost:3000/ws';

const useWebSocket = () => {
  const [jobs, setJobs] = useState<JobModel[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    function connectWebSocket() {
      console.log("Connecting to WebSocket at", WEBSOCKET_URL);
      const newSocket = new WebSocket(WEBSOCKET_URL);

      newSocket.onopen = () => {
        console.log("WebSocket connection established.");
      };

      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      newSocket.onmessage = (event) => {
        console.log("Message received from server:", event.data);
        const job = JSON.parse(event.data);
        setJobs(prevJobs => {
          const existingJob = prevJobs.find(j => j.jobID === job.jobID);
          return existingJob ? prevJobs : [...prevJobs, job];
        });
      };

      newSocket.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        console.log("Attempting to reconnect...");
        setTimeout(connectWebSocket, 5000); // Attempt to reconnect every 5 seconds
      };

      setSocket(newSocket);
    }

    connectWebSocket();

    return () => {
      console.log("Cleaning up WebSocket.");
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return jobs;
};

export default useWebSocket;
