// src/components/Experimental/FineTuning/index.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  ToggleGroupItem,
  ToggleGroup,
  Flex,
  FlexItem,
  Bullseye,
  EmptyStateVariant,
  ExpandableSection,
  CodeBlock,
  CodeBlockCode,
  PageSection,
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Title,
  Button,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Alert,
  EmptyStateFooter,
  EmptyStateActions
} from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationCircleIcon, SearchIcon } from '@patternfly/react-icons';
import { useTheme } from '@/context/ThemeContext';
import { Model, Branch, Job } from '@/components/Experimental/FineTuning/types';
import AddFineTuningJobModal from '@/components/Experimental/FineTuning/AddFineTuningJobModal';

const FineTuning: React.FC = () => {
  const { theme } = useTheme();
  const [models, setModels] = useState<Model[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'successful', 'pending', 'failed', 'all'

  // State for managing expanded jobs and their logs
  const [expandedJobs, setExpandedJobs] = useState<{ [jobId: string]: boolean }>({});
  const [jobLogs, setJobLogs] = useState<{ [jobId: string]: string }>({});

  // Ref to store intervals for each job's logs
  const logsIntervals = useRef<{ [jobId: string]: NodeJS.Timeout }>({});

  const mapJobType = (job: Job) => {
    let jobType: 'generate' | 'train' | 'pipeline' | 'model-serve' | 'vllm-run';

    if (job.job_id.startsWith('g-')) {
      jobType = 'generate';
    } else if (job.job_id.startsWith('p-')) {
      jobType = 'pipeline';
    } else if (job.job_id.startsWith('ml-')) {
      jobType = 'model-serve';
    } else if (job.job_id.startsWith('v-')) {
      jobType = 'vllm-run'; // New categorization for 'v-' jobs
    } else {
      jobType = 'train';
    }

    return { ...job, type: jobType };
  };

  // Fetch models, branches, and jobs when the component mounts
  useEffect(() => {
    let canceled = false;
    let refreshIntervalId: NodeJS.Timeout;

    const fetchJobs = async () => {
      console.debug('Fetching jobs from /api/fine-tune/jobs');

      try {
        const response = await fetch('/api/fine-tune/jobs', { cache: 'no-cache' });
        console.debug(`Fetch response status: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch jobs: ${response.status} ${errorText}`);
          return;
        }

        const data = await response.json();
        console.debug('Polling: Jobs data fetched successfully:', data);

        const safeJobsData = Array.isArray(data) ? data : [];
        const updatedJobs = safeJobsData
          .map((job: Job) => mapJobType(job))
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

        if (!canceled) {
          setJobs(updatedJobs);
        }
      } catch (error) {
        console.error('Error fetching jobs during polling:', error);
      }
    };

    const fetchData = async () => {
      try {
        // Fetch models
        const modelsResponse = await fetch('/api/fine-tune/models', { cache: 'no-cache' });
        if (canceled) {
          return;
        }
        console.log(modelsResponse);
        if (!modelsResponse.ok) {
          throw new Error('Failed to fetch models');
        }
        const modelsData = await modelsResponse.json();

        // Fetch branches
        const branchesResponse = await fetch('/api/fine-tune/git/branches', { cache: 'no-cache' });
        if (canceled) {
          return;
        }
        if (!branchesResponse.ok) {
          throw new Error('Failed to fetch git branches');
        }
        const branchesData = await branchesResponse.json();

        // Fetch jobs
        await fetchJobs();
        if (!canceled) {
          setModels(modelsData);
          setBranches(branchesData.branches);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Error fetching data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData().then(() => {
      if (!canceled) {
        refreshIntervalId = setInterval(fetchJobs, 30000);
      }
    });

    return () => {
      canceled = true;
      clearInterval(refreshIntervalId);
    };
  }, []);

  // Clean up all intervals on component unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.values(logsIntervals.current).forEach(clearInterval);
    };
  }, []);

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return format(date, 'PPpp');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleToggleChange = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, _selected: boolean) => {
    const id = (event.currentTarget as HTMLButtonElement).id;
    setSelectedStatus(id);
  };

  const filteredJobs = jobs.filter((job) => {
    if (job.job_id.startsWith('ml-') || job.job_id.startsWith('v-')) {
      return false; // Exclude model serve and vllm prefixed jobs from the dashboard list
    }
    if (selectedStatus === 'successful') return job.status === 'finished';
    if (selectedStatus === 'pending') return job.status === 'running';
    if (selectedStatus === 'failed') return job.status === 'failed';
    return true; // 'all'
  });

  const handleCreateButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = (newJob?: Job) => {
    if (newJob) {
      setJobs((prev) => [...prev, newJob]);
    }
    setIsModalOpen(false);
  };

  const fetchJobLogs = async (jobId: string) => {
    try {
      const response = await fetch(`/api/fine-tune/jobs/${jobId}/logs`, {
        headers: {
          'Cache-Control': 'no-cache'
        },
        cache: 'no-cache'
      });

      if (response.ok) {
        const logsText = await response.text();
        setJobLogs((prev) => ({ ...prev, [jobId]: logsText }));
      } else {
        const errorText = await response.text();
        setJobLogs((prev) => ({ ...prev, [jobId]: `Failed to fetch logs: ${response.status} ${errorText}` }));
        console.warn(`Failed to fetch logs for job ${jobId}: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error(`Error fetching job logs for job ${jobId}:`, error);
      setJobLogs((prev) => ({ ...prev, [jobId]: 'Error fetching logs.' }));
    }
  };

  const handleToggleLogs = (jobId: string, isExpanding: boolean) => {
    console.debug(`Toggling logs for job ID: ${jobId}. Expanding: ${isExpanding}`);
    setExpandedJobs((prev) => ({ ...prev, [jobId]: isExpanding }));

    if (isExpanding) {
      // Fetch logs immediately
      fetchJobLogs(jobId);

      // Set up interval to fetch logs every 10 seconds
      const intervalId = setInterval(() => {
        fetchJobLogs(jobId);
      }, 10000);

      // Store the interval ID
      logsIntervals.current[jobId] = intervalId;
    } else {
      // Clear the interval if it exists
      if (logsIntervals.current[jobId]) {
        clearInterval(logsIntervals.current[jobId]);
        delete logsIntervals.current[jobId];
      }
    }
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              Fine tuning jobs
            </Title>
          </FlexItem>
          {jobs.length > 0 ? (
            <FlexItem>
              <Button variant="primary" onClick={handleCreateButtonClick}>
                Create+
              </Button>
            </FlexItem>
          ) : null}
        </Flex>
      </PageSection>

      <PageSection isFilled>
        {isLoading ? (
          <Bullseye>
            <Spinner size="xl" />
          </Bullseye>
        ) : (
          <>
            {errorMessage ? <Alert variant="danger" title={errorMessage} isInline /> : null}
            {!jobs.length ? (
              <EmptyState
                headingLevel="h1"
                icon={() => (
                  <Image src={theme === 'dark' ? '/Finetune_empty_Dark.svg' : '/Finetune_empty.svg'} alt="No documents" width={56} height={56} />
                )}
                titleText="No fine tuning jobs"
                variant={EmptyStateVariant.lg}
              >
                <EmptyStateBody>You have not created any fine-tuning jobs yet. Use the Create+ button to get started.</EmptyStateBody>
                <EmptyStateFooter>
                  <EmptyStateActions>
                    <Button variant="primary" onClick={handleCreateButtonClick}>
                      Create+
                    </Button>
                  </EmptyStateActions>
                </EmptyStateFooter>
              </EmptyState>
            ) : (
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} flexWrap={{ default: 'nowrap' }}>
                <FlexItem>
                  <ToggleGroup aria-label="Job Status Filter">
                    <ToggleGroupItem text="All" buttonId="all" isSelected={selectedStatus === 'all'} onChange={handleToggleChange} />
                    <ToggleGroupItem
                      text="Successful"
                      buttonId="successful"
                      isSelected={selectedStatus === 'successful'}
                      onChange={handleToggleChange}
                    />
                    <ToggleGroupItem text="Pending" buttonId="pending" isSelected={selectedStatus === 'pending'} onChange={handleToggleChange} />
                    <ToggleGroupItem text="Failed" buttonId="failed" isSelected={selectedStatus === 'failed'} onChange={handleToggleChange} />
                  </ToggleGroup>
                </FlexItem>
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => {
                    const isExpanded = expandedJobs[job.job_id] || false;
                    const logs = jobLogs[job.job_id];
                    return (
                      <FlexItem key={job.job_id}>
                        <Card style={{ width: '100%' }}>
                          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* TODO: fix the status icons to have color, e.g. red/green */}
                            {job.status === 'finished' ? (
                              <CheckCircleIcon color="var(--pf-global--success-color--nonstatus--green)" />
                            ) : job.status === 'failed' ? (
                              <ExclamationCircleIcon color="var(--pf-global--danger-color--status--danger--default)" />
                            ) : null}
                            {job.type === 'generate'
                              ? 'Generate Job'
                              : job.type === 'pipeline'
                                ? 'Generate & Train Pipeline'
                                : job.type === 'model-serve'
                                  ? 'Model Serve Job'
                                  : 'Train Job'}
                          </CardTitle>
                          <CardBody>
                            {/* If fields are added, the percentages need to be tweaked to keep columns lined up across cards. */}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={{ width: '25%' }}>
                                <strong>Job ID:</strong> {job.job_id}
                              </div>
                              <div style={{ width: '25%' }}>
                                <strong>Status:</strong> {job.status}
                              </div>
                              <div style={{ width: '25%' }}>
                                <strong>Start Time:</strong> {formatDate(job.start_time)}
                              </div>
                              <div style={{ width: '25%' }}>
                                <strong>End Time:</strong> {formatDate(job.end_time)}
                              </div>
                            </div>
                          </CardBody>
                          <CardFooter>
                            {/* Expandable section for logs */}
                            <ExpandableSection
                              toggleText={isExpanded ? 'Hide Logs' : 'View Logs'}
                              onToggle={(_event, expanded) => handleToggleLogs(job.job_id, expanded)}
                              isExpanded={isExpanded}
                            >
                              {logs ? (
                                <CodeBlock>
                                  <CodeBlockCode id={`logs-${job.job_id}`}>{logs}</CodeBlockCode>
                                </CodeBlock>
                              ) : (
                                <Spinner size="sm" />
                              )}
                            </ExpandableSection>
                          </CardFooter>
                        </Card>
                      </FlexItem>
                    );
                  })
                ) : (
                  <Bullseye>
                    <EmptyState headingLevel="h2" titleText="No results found" icon={SearchIcon}>
                      <EmptyStateBody>No matching fine tuning jobs found</EmptyStateBody>
                      <EmptyStateFooter>
                        <Button variant="link" onClick={() => setSelectedStatus('all')}>
                          Clear filter
                        </Button>
                      </EmptyStateFooter>
                    </EmptyState>
                  </Bullseye>
                )}
              </Flex>
            )}
          </>
        )}
      </PageSection>
      {isModalOpen ? <AddFineTuningJobModal models={models} branches={branches} onClose={handleModalClose} /> : null}
    </>
  );
};

export default FineTuning;
