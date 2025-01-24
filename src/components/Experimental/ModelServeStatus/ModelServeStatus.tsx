import React, { useState, useEffect } from 'react';
import { Label, LabelProps } from '@patternfly/react-core';

// map vllm-status => color
function getStatusColor(status: string): LabelProps['color'] {
  switch (status) {
    case 'running':
      return 'green';
    case 'loading':
      return 'orange';
    case 'stopped':
    default:
      return 'grey';
  }
}

interface ModelStatusProps {
  modelName: string | null; // e.g. 'granite-base-served', 'granite-latest-served', or custom
}

const ModelStatusIndicator: React.FC<ModelStatusProps> = ({ modelName }) => {
  const [status, setStatus] = useState<string>('stopped'); // or 'unknown'

  useEffect(() => {
    // If modelName is not "granite-base-served" or "granite-latest-served", we can treat as 'stopped'/no status
    if (modelName !== 'granite-base-served' && modelName !== 'granite-latest-served') {
      setStatus('stopped');
      return;
    }

    // Map to 'pre-train' or 'post-train'
    const vllmName = modelName === 'granite-base-served' ? 'pre-train' : 'post-train';

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/fine-tune/model/vllm-status?modelName=${vllmName}`);
        if (!res.ok) {
          console.error('Failed to fetch vllm status', res.status, res.statusText);
          setStatus('stopped');
          return;
        }
        const data = await res.json();
        if (data.status) {
          setStatus(data.status);
        } else {
          setStatus('stopped');
        }
      } catch (error) {
        console.error('Error fetching vllm status:', error);
        setStatus('stopped');
      }
    };

    // fetch once
    fetchStatus();

    // Optionally poll every X seconds
    const intervalId = setInterval(fetchStatus, 5000); // poll every 5s
    return () => clearInterval(intervalId);
  }, [modelName]);

  if (status === 'stopped') {
    // If not a vllm model or container is not running, show nothing or grey
    return null;
  }

  return (
    <Label className="square-label.pf-c-label" color={getStatusColor(status)}>
      {status}
    </Label>
  );
};

export default ModelStatusIndicator;
