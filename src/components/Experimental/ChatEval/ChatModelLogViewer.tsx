// src/components/Experimental/ChatEval/ChatEval.tsx
'use client';

import React from 'react';
import { ExpandableSection, Spinner, CodeBlock, CodeBlockCode } from '@patternfly/react-core';

interface Props {
  modelJobId: string | null;
}

const ChatModelLogViewer: React.FC<Props> = ({ modelJobId }) => {
  const [expandedJobs, setExpandedJobs] = React.useState<Record<string, boolean>>({});
  const [jobLogs, setJobLogs] = React.useState<Record<string, string>>({});

  const handleToggleLogs = async (jobId: string, isExpanding: boolean) => {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: isExpanding }));
    if (isExpanding && !jobLogs[jobId]) {
      try {
        const response = await fetch(`/api/fine-tune/jobs/${jobId}/logs`, {
          method: 'GET'
        });
        if (response.ok) {
          const logsText = await response.text();
          setJobLogs((prev) => ({ ...prev, [jobId]: logsText }));
        } else {
          setJobLogs((prev) => ({ ...prev, [jobId]: 'Failed to fetch logs.' }));
        }
      } catch (error) {
        console.error('Error fetching job logs:', error);
        setJobLogs((prev) => ({ ...prev, [jobId]: 'Error fetching logs.' }));
      }
    }
  };

  if (!modelJobId) {
    return null;
  }

  return (
    <ExpandableSection
      toggleText={expandedJobs[modelJobId] ? 'Hide Logs' : 'View Logs'}
      onToggle={(_event, expanded) => handleToggleLogs(modelJobId, expanded)}
      isExpanded={expandedJobs[modelJobId]}
    >
      {jobLogs[modelJobId] ? (
        <CodeBlock>
          <CodeBlockCode id={`logs-${modelJobId}`}>{jobLogs[modelJobId]}</CodeBlockCode>
        </CodeBlock>
      ) : (
        <Spinner size="md" />
      )}
    </ExpandableSection>
  );
};

export default ChatModelLogViewer;
