// src/components/Experimental/FineTuning/index.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ToggleGroupItem, ToggleGroup } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core/dist/esm/components/Button';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import {
  Modal,
  Form,
  FormGroup,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Card,
  CardTitle,
  CardBody,
  CardFooter
} from '@patternfly/react-core';
import { format } from 'date-fns';

import { ExpandableSection, CodeBlock, CodeBlockCode } from '@patternfly/react-core';

interface Model {
  name: string;
  last_modified: string;
  size: string;
}

interface Branch {
  name: string;
  creationDate: number;
}

interface Job {
  job_id: string;
  status: string;
  type?: 'generate' | 'train' | 'pipeline';
  branch?: string;
  start_time: string; // ISO timestamp
  end_time?: string;
}

const FineTuning: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState<boolean>(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState<boolean>(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'successful', 'pending', 'failed', 'all'

  // State for managing expanded jobs and their logs
  const [expandedJobs, setExpandedJobs] = useState<{ [jobId: string]: boolean }>({});
  const [jobLogs, setJobLogs] = useState<{ [jobId: string]: string }>({});

  // Ref to store intervals for each job's logs
  const logsIntervals = useRef<{ [jobId: string]: NodeJS.Timeout }>({});

  const mapJobType = (job: Job) => {
    let jobType: 'generate' | 'train' | 'pipeline' | 'model-serve';
    if (job.job_id.startsWith('g-')) {
      jobType = 'generate';
    } else if (job.job_id.startsWith('p-')) {
      jobType = 'pipeline';
    } else if (job.job_id.startsWith('ml-')) {
      jobType = 'model-serve';
    } else {
      jobType = 'train';
    }
    return { ...job, type: jobType };
  };

  // Fetch models, branches, and jobs when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch models
        const modelsResponse = await fetch('/api/fine-tune/models', { cache: 'no-cache' });
        if (!modelsResponse.ok) {
          throw new Error('Failed to fetch models');
        }
        const modelsData = await modelsResponse.json();

        // Fetch branches
        const branchesResponse = await fetch('/api/local/git/branches', { cache: 'no-cache' });
        if (!branchesResponse.ok) {
          throw new Error('Failed to fetch git branches');
        }
        const branchesData = await branchesResponse.json();

        // Fetch jobs
        const jobsResponse = await fetch('/api/fine-tune/jobs', { cache: 'no-cache' });
        if (!jobsResponse.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const jobsData = await jobsResponse.json();

        const safeJobsData = Array.isArray(jobsData) ? jobsData : [];
        const updatedJobs = safeJobsData
          .map((job: Job) => mapJobType(job))
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

        setModels(modelsData);
        setBranches(branchesData.branches);
        setJobs(updatedJobs);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Error fetching data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Polling to update jobs periodically
    const interval = setInterval(() => {
      fetch('/api/fine-tune/jobs', { cache: 'no-cache' })
        .then((res) => res.json())
        .then((data) => {
          const safeJobsData = Array.isArray(data) ? data : [];
          const updatedJobs = safeJobsData
            .map((job: Job) => mapJobType(job))
            .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
          setJobs(updatedJobs);
        })
        .catch((error) => {
          console.error('Error fetching jobs:', error);
          setJobs([]);
        });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Clean up all intervals on component unmount
  useEffect(() => {
    return () => {
      Object.values(logsIntervals.current).forEach(clearInterval);
    };
  }, []);

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return format(date, 'PPpp');
  };

  const handleToggleChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.id;
    setSelectedStatus(id);
  };

  const filteredJobs = jobs.filter((job) => {
    if (job.job_id.startsWith('ml-')) {
      return false; // Exclude model serve jobs from the dashboard list
    }
    if (selectedStatus === 'successful') return job.status === 'finished';
    if (selectedStatus === 'pending') return job.status === 'running';
    if (selectedStatus === 'failed') return job.status === 'failed';
    return true; // 'all'
  });

  const handleCreateButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setErrorMessage('');
    setSelectedBranch('');
    setSelectedModel('');
  };

  const handleGenerateClick = async () => {
    if (!selectedModel || !selectedBranch) {
      setErrorMessage('Please select both a model and a branch.');
      return;
    }
    setIsModalOpen(false);
    try {
      const response = await fetch('/api/fine-tune/data/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: selectedModel, branchName: selectedBranch }),
        cache: 'no-cache'
      });
      const result = await response.json();
      if (response.ok) {
        const newJob: Job = {
          job_id: result.job_id,
          status: 'running',
          type: result.job_id.startsWith('g-') ? 'generate' : result.job_id.startsWith('p-') ? 'pipeline' : 'train'
        };
        setJobs((prevJobs) => [...prevJobs, newJob]);
      } else {
        setErrorMessage('Failed to start generate job');
      }
    } catch (error) {
      console.error('Error starting generate job:', error);
      setErrorMessage('Error starting generate job');
    }
  };

  const handleTrainClick = async () => {
    if (!selectedModel || !selectedBranch) {
      setErrorMessage('Please select both a model and a branch.');
      return;
    }
    setIsModalOpen(false);
    try {
      const response = await fetch('/api/fine-tune/model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: selectedModel, branchName: selectedBranch }),
        cache: 'no-cache'
      });
      const result = await response.json();
      if (response.ok) {
        const newJob: Job = {
          job_id: result.job_id,
          status: 'running',
          type: result.job_id.startsWith('g-') ? 'generate' : result.job_id.startsWith('p-') ? 'pipeline' : 'train'
        };
        setJobs((prevJobs) => [...prevJobs, newJob]);
      } else {
        setErrorMessage('Failed to start train job');
      }
    } catch (error) {
      console.error('Error starting train job:', error);
      setErrorMessage('Error starting train job');
    }
  };

  const handlePipelineClick = async () => {
    if (!selectedModel || !selectedBranch) {
      setErrorMessage('Please select both a model and a branch.');
      return;
    }
    setIsModalOpen(false);
    try {
      const response = await fetch('/api/fine-tune/pipeline/generate-train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: selectedModel, branchName: selectedBranch }),
        cache: 'no-cache'
      });
      const result = await response.json();
      if (response.ok && result.pipeline_job_id) {
        // Add the new job to the job list
        const newJob: Job = {
          job_id: result.pipeline_job_id,
          status: 'running',
          type: 'pipeline',
          branch: selectedBranch
        };
        setJobs((prevJobs) => [...prevJobs, newJob]);
      } else {
        setErrorMessage('Failed to start generate-train pipeline');
      }
    } catch (error) {
      console.error('Error starting generate-train pipeline job:', error);
      setErrorMessage('Error starting generate-train pipeline job');
    }
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
        setJobLogs((prev) => ({ ...prev, [jobId]: 'Failed to fetch logs.' }));
      }
    } catch (error) {
      console.error('Error fetching job logs:', error);
      setJobLogs((prev) => ({ ...prev, [jobId]: 'Error fetching logs.' }));
    }
  };

  const handleToggleLogs = (jobId: string, isExpanding: boolean) => {
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

  if (isLoading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner size="lg" />
      </PageSection>
    );
  }

  return (
    <div>
      <PageBreadcrumb hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/">Dashboard</BreadcrumbItem>
          <BreadcrumbItem isActive>Fine Tuning</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection hasBodyWrapper={false} style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="lg">
          Fine Tuning Jobs
        </Title>
      </PageSection>

      <PageSection hasBodyWrapper={false} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <ToggleGroup aria-label="Job Status Filter">
            <ToggleGroupItem text="All" buttonId="all" isSelected={selectedStatus === 'all'} onChange={handleToggleChange} />
            <ToggleGroupItem text="Successful" buttonId="successful" isSelected={selectedStatus === 'successful'} onChange={handleToggleChange} />
            <ToggleGroupItem text="Pending" buttonId="pending" isSelected={selectedStatus === 'pending'} onChange={handleToggleChange} />
            <ToggleGroupItem text="Failed" buttonId="failed" isSelected={selectedStatus === 'failed'} onChange={handleToggleChange} />
          </ToggleGroup>
        </div>
        <div>
          <Button variant="primary" onClick={handleCreateButtonClick}>
            Create+
          </Button>
        </div>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        {filteredJobs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredJobs.map((job) => {
              const isExpanded = expandedJobs[job.job_id] || false;
              const logs = jobLogs[job.job_id];
              return (
                <Card key={job.job_id} style={{ width: '100%' }}>
                  <CardTitle>
                    {job.type === 'generate'
                      ? 'Generate Job'
                      : job.type === 'pipeline'
                        ? 'Generate & Train Pipeline'
                        : job.type === 'model-serve'
                          ? 'Model Serve Job'
                          : 'Train Job'}
                  </CardTitle>{' '}
                  <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <p>
                        <strong>Job ID:</strong> {job.job_id}
                      </p>
                      <p>
                        <strong>Status:</strong> {job.status}
                      </p>
                      <p>
                        <strong>Branch:</strong> {job.branch || 'N/A'}
                      </p>
                      <p>
                        <strong>Start Time:</strong> {formatDate(job.start_time)}
                      </p>
                      <p>
                        <strong>End Time:</strong> {formatDate(job.end_time)}
                      </p>
                    </div>
                  </CardBody>
                  <CardFooter>
                    {job.status === 'finished' ? (
                      <Alert variant="success" isInline title="Job Completed Successfully!" />
                    ) : job.status === 'failed' ? (
                      <Alert variant="danger" isInline title="Job Failed" />
                    ) : null}

                    {/* Expandable section for logs */}
                    <ExpandableSection
                      toggleText={isExpanded ? 'Hide Logs' : 'View Logs'}
                      onToggle={(_event, expanded) => handleToggleLogs(job.job_id, expanded)}
                      isExpanded={isExpanded}
                    >
                      {logs && (
                        <CodeBlock>
                          <CodeBlockCode id={`logs-${job.job_id}`}>{logs}</CodeBlockCode>
                        </CodeBlock>
                      )}
                    </ExpandableSection>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState headingLevel="h4" titleText="No Fine Tuning Jobs">
            <EmptyStateBody>You haven't created any fine-tuning jobs yet. Use the 'Create' button to get started.</EmptyStateBody>
          </EmptyState>
        )}
      </PageSection>

      <Modal title="Create Fine-Tuning Job" isOpen={isModalOpen} onClose={handleModalClose} variant="small" style={{ padding: '3rem' }}>
        {errorMessage && <Alert variant="danger" title={errorMessage} isInline />}
        <Form>
          <FormGroup label="Select Git Branch" isRequired fieldId="branch-select">
            <Dropdown
              isOpen={isBranchDropdownOpen}
              onSelect={(_event, value) => {
                setSelectedBranch(value as string);
                setIsBranchDropdownOpen(false);
              }}
              onOpenChange={(isOpen) => setIsBranchDropdownOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef} onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} isExpanded={isBranchDropdownOpen}>
                  {selectedBranch || 'Select a branch'}
                </MenuToggle>
              )}
            >
              <DropdownList>
                {branches.map((branch) => (
                  <DropdownItem key={branch.name} value={branch.name}>
                    {branch.name}
                  </DropdownItem>
                ))}
              </DropdownList>
            </Dropdown>
          </FormGroup>

          <FormGroup label="Select Base Model" isRequired fieldId="model-select">
            <Dropdown
              isOpen={isModelDropdownOpen}
              onSelect={(_event, value) => {
                setSelectedModel(value as string);
                setIsModelDropdownOpen(false);
              }}
              onOpenChange={(isOpen) => setIsModelDropdownOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef} onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} isExpanded={isModelDropdownOpen}>
                  {selectedModel || 'Select a model'}
                </MenuToggle>
              )}
            >
              <DropdownList>
                {models.map((model) => (
                  <DropdownItem key={model.name} value={model.name}>
                    {model.name}
                  </DropdownItem>
                ))}
              </DropdownList>
            </Dropdown>
          </FormGroup>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="primary" onClick={handleGenerateClick}>
              Generate
            </Button>
            <Button variant="primary" onClick={handleTrainClick}>
              Train
            </Button>
            <Button variant="primary" onClick={handlePipelineClick}>
              Generate &amp; Train
            </Button>
          </div>
          <Button variant="link" onClick={handleModalClose}>
            Cancel
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default FineTuning;
