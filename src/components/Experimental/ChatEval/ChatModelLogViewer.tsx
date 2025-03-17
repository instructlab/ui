// src/components/Experimental/ChatEval/ChatEval.tsx
'use client';

import React from 'react';
import { Spinner, CodeBlock, CodeBlockCode, Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@patternfly/react-core';
import { Model } from '@/types';

interface Props {
  model: Model;
  modelJobId: string | null;
  onClose: () => void;
}

const ChatModelLogViewer: React.FC<Props> = ({ model, modelJobId, onClose }) => {
  const [jobLogs, setJobLogs] = React.useState<string>();
  const [loaded, setLoaded] = React.useState<boolean>();

  React.useEffect(() => {
    let canceled = false;
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/fine-tune/jobs/${modelJobId}/logs`, {
          method: 'GET'
        });
        if (canceled) {
          return;
        }
        if (response.ok) {
          const logsText = await response.text();
          if (!canceled) {
            setJobLogs(logsText);
          }
        } else {
          setJobLogs('Failed to fetch logs.');
        }
      } catch (error) {
        console.error('Error fetching job logs:', error);
        setJobLogs('Error fetching logs.');
      } finally {
        if (!canceled) {
          setLoaded(true);
        }
      }
    };

    fetchLogs();

    return () => {
      canceled = true;
    };
  }, [modelJobId]);

  if (!modelJobId) {
    return null;
  }

  return (
    <Modal isOpen variant="large" aria-label="log viewer" aria-labelledby="log-viewer-modal-title" disableFocusTrap onClose={onClose}>
      <ModalHeader title={`Logs for model: ${model.name}`} labelId="log-viewer-modal-title" />
      <ModalBody>
        {loaded ? (
          <CodeBlock>
            <CodeBlockCode id={`logs-${modelJobId}`}>{jobLogs}</CodeBlockCode>
          </CodeBlock>
        ) : (
          <Spinner size="md" />
        )}
      </ModalBody>
      <ModalFooter>
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ChatModelLogViewer;
