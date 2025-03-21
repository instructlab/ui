import React, { useState, useEffect } from 'react';
import { Icon, Spinner, Tooltip } from '@patternfly/react-core';
import { GRANITE_BASE_MODEL_NAME, GRANITE_LATEST_MODEL_NAME } from '@/components/Experimental/ChatEval/const';
import { CheckCircleIcon, ExclamationCircleIcon, InfoCircleIcon } from '@patternfly/react-icons';

interface ModelStatusProps {
  modelName: string | null; // e.g. 'granite-base-served', 'granite-latest-served', or custom
}

const ModelStatusIndicator: React.FC<ModelStatusProps> = ({ modelName }) => {
  const [status, setStatus] = useState<string>('stopped'); // or 'unknown'
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // If not a served granite model, we can ignore
    if (modelName !== GRANITE_BASE_MODEL_NAME && modelName !== GRANITE_LATEST_MODEL_NAME) {
      setIsLoading(false);
      return;
    }

    const fetchStatus = async () => {
      // Map to 'pre-train' or 'post-train'
      const vllmName = modelName === GRANITE_BASE_MODEL_NAME ? 'pre-train' : 'post-train';

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
      } finally {
        setIsLoading(false);
      }
    };

    // fetch once
    fetchStatus();

    // Optionally poll every X seconds
    const intervalId = setInterval(fetchStatus, 5000); // poll every 5s

    return () => clearInterval(intervalId);
  }, [modelName]);

  if (modelName !== GRANITE_BASE_MODEL_NAME && modelName !== GRANITE_LATEST_MODEL_NAME) {
    return null;
  }

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  return (
    <Tooltip content={<span style={{ textTransform: 'capitalize' }}>{status}</span>}>
      {status === 'running' ? (
        <Icon status="success">
          <CheckCircleIcon />
        </Icon>
      ) : status === 'stopped' ? (
        <Icon status="danger">
          <ExclamationCircleIcon />
        </Icon>
      ) : (
        <Icon status="info">
          <InfoCircleIcon />
        </Icon>
      )}
    </Tooltip>
  );
};

export default ModelStatusIndicator;
