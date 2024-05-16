// Running.tsx
import { Columns } from "@app/common/DisplayColumns";
import useFetchJobs from "@app/common/HooksApiServer";
import JobsLayout from "@app/common/JobsLayout";
import { formatDate } from '@app/utils/dateUtils';
import AngleRightIcon from '@patternfly/react-icons/dist/dynamic/icons/angle-right-icon'
import CodeBranchIcon from '@patternfly/react-icons/dist/dynamic/icons/code-branch-icon'
import GithubIcon from '@patternfly/react-icons/dist/dynamic/icons/github-icon'
import * as React from 'react';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page'
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title'
import { ExpandableRowContent, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { getSortParams } from '@app/utils/tableUtils';

const RunningJobs: React.FunctionComponent = () => {
  const jobs = useFetchJobs();
  const [expandedRows, setExpandedRows] = React.useState<Record<number, boolean>>({});
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | null>(null);
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc'>('asc');

  // Filter and sort jobs
  const runningJobs = React.useMemo(() => {
    const errorJobs = jobs.filter(job => job.status === 'running');
    return errorJobs.sort((a, b) => {
      if (activeSortIndex === 0) {
        const jobA = parseInt(a.jobID, 10);
        const jobB = parseInt(b.jobID, 10);
        return activeSortDirection === 'desc' ? jobA - jobB : jobB - jobA;
      }
      return 0;
    });
  }, [jobs, activeSortIndex, activeSortDirection]);

  return (
    <JobsLayout>
      <PageSection>
        <Title headingLevel="h1" size="lg">
          Running Jobs - <em>Click to Expand Details</em>
        </Title>
        <Table aria-label="All Jobs">
          <Thead>
            <Tr>
              <Th sort={getSortParams(0, activeSortIndex, activeSortDirection, setActiveSortIndex, setActiveSortDirection)}>Job ID</Th>
              <Th>Status</Th>
              <Th>Job Type</Th>
              <Th>Request Time</Th>
              <Th>PR Number</Th>
              <Th>Author</Th>
              <Th>GitHub URL</Th>
            </Tr>
          </Thead>
          <Tbody>
            {runningJobs.map((job, index) => (
              <React.Fragment key={index}>
                <Tr onClick={() => setExpandedRows({ ...expandedRows, [index]: !expandedRows[index] })}>
                  <Td dataLabel={Columns.jobID}>
                    <AngleRightIcon /> {job.jobID}</Td>
                  <Td dataLabel={Columns.status}>{job.status}</Td>
                  <Td dataLabel={Columns.jobType}>{job.jobType}</Td>
                  <Td dataLabel={Columns.requestTime}>{formatDate(job.requestTime)}</Td>
                  <Td dataLabel={Columns.prNumber}>
                    <CodeBranchIcon /> {job.prNumber}
                  </Td>
                  <Td dataLabel={Columns.author}>{job.author}</Td>
                  <Td>
                    <a href={`https://github.com/${job.repoOwner}/${job.repoName}/pull/${job.prNumber}`}
                       target="_blank"
                       rel="noopener noreferrer">
                      <GithubIcon /> Open on GitHub
                    </a>
                  </Td>
                </Tr>
                {expandedRows[index] ? (
                  <Tr isExpanded={expandedRows[index]}>
                    <Td colSpan={7} noPadding>
                      <ExpandableRowContent>
                        <div>
                          <p><strong>Duration:</strong> {job.duration}</p>
                          <p><strong>Repository Owner:</strong> {job.repoOwner}</p>
                          <p><strong>PR SHA:</strong> {job.prSHA}</p>
                          <p><strong>Errors:</strong> {job.errors}</p>
                          <p><strong>Repository Name:</strong> {job.repoName}</p>
                          <p><strong>S3 URL:</strong> <a href={job.s3URL} target="_blank" rel="noopener noreferrer">{job.s3URL}</a></p>
                          <p><strong>Model Name:</strong> {job.modelName}</p>
                          <p><strong>Command Run:</strong> {job.cmd}</p>
                        </div>
                      </ExpandableRowContent>
                    </Td>
                  </Tr>
                ) : null}
              </React.Fragment>
            ))}
          </Tbody>
        </Table>
      </PageSection>
    </JobsLayout>
  );
};

export { RunningJobs };
